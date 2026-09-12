import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import {
  applyOps,
  cloneGraph,
  createEmptyGraph,
  resolveAnchorNodeId,
  toSnapshot,
  type MutableGraph,
} from "@mind-map/graph-core";
import type {
  CanvasMeta,
  MindEdge,
  MindNode,
  Op,
} from "@mind-map/shared";
import { newId, now } from "@mind-map/shared";

const SCHEMA = `
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS canvases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  focus_node_id TEXT,
  viewport_json TEXT NOT NULL,
  prefs_json TEXT NOT NULL,
  rev INTEGER NOT NULL DEFAULT 0,
  agent_mode TEXT NOT NULL DEFAULT 'edit',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS nodes (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  text TEXT NOT NULL,
  note TEXT,
  collapsed INTEGER NOT NULL DEFAULT 0,
  pinned INTEGER NOT NULL DEFAULT 0,
  pos_json TEXT,
  side_pref INTEGER NOT NULL DEFAULT 0,
  style_preset TEXT NOT NULL DEFAULT 'default',
  version INTEGER NOT NULL DEFAULT 1,
  tags_json TEXT NOT NULL DEFAULT '[]',
  links_json TEXT NOT NULL DEFAULT '[]',
  image_url TEXT,
  due_at INTEGER,
  start_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS edges (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  kind TEXT NOT NULL,
  is_primary_parent INTEGER NOT NULL DEFAULT 0,
  "order" REAL NOT NULL DEFAULT 0,
  label TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  note TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);
CREATE TABLE IF NOT EXISTS events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  canvas_id TEXT NOT NULL,
  change_set_id TEXT NOT NULL,
  op_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS change_sets (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  base_rev INTEGER NOT NULL,
  origin TEXT NOT NULL,
  summary TEXT NOT NULL,
  inverse_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  undone_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_nodes_canvas ON nodes(canvas_id);
CREATE INDEX IF NOT EXISTS idx_edges_canvas ON edges(canvas_id);
CREATE INDEX IF NOT EXISTS idx_events_canvas ON events(canvas_id);
`;

function rowNode(r: Record<string, unknown>): MindNode {
  return {
    id: String(r.id),
    canvasId: String(r.canvas_id),
    text: String(r.text),
    note: r.note != null ? String(r.note) : undefined,
    collapsed: Boolean(r.collapsed),
    pinned: Boolean(r.pinned),
    pos: r.pos_json ? (JSON.parse(String(r.pos_json)) as { x: number; y: number }) : null,
    sidePref: Number(r.side_pref) as -1 | 0 | 1,
    stylePreset: String(r.style_preset) as MindNode["stylePreset"],
    version: Number(r.version),
    tags: JSON.parse(String(r.tags_json ?? "[]")) as string[],
    links: JSON.parse(String(r.links_json ?? "[]")) as MindNode["links"],
    imageUrl: r.image_url != null ? String(r.image_url) : undefined,
    dueAt: r.due_at != null ? Number(r.due_at) : undefined,
    startAt: r.start_at != null ? Number(r.start_at) : undefined,
    accentColor:
      r.accent_color != null ? (String(r.accent_color) as MindNode["accentColor"]) : undefined,
    icon: r.icon != null ? (String(r.icon) as MindNode["icon"]) : undefined,
    alias: r.alias != null ? String(r.alias) : undefined,
    description: r.description_json
      ? (JSON.parse(String(r.description_json)) as MindNode["description"])
      : undefined,
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null,
  };
}

function rowEdge(r: Record<string, unknown>): MindEdge {
  return {
    id: String(r.id),
    canvasId: String(r.canvas_id),
    from: String(r.from),
    to: String(r.to),
    kind: String(r.kind) as MindEdge["kind"],
    isPrimaryParent: Boolean(r.is_primary_parent),
    order: Number(r.order),
    label: r.label != null ? String(r.label) : undefined,
    tags: JSON.parse(String(r.tags_json ?? "[]")) as string[],
    note: r.note != null ? String(r.note) : undefined,
    weight: r.weight != null ? Number(r.weight) : undefined,
    lineStyle:
      r.line_style != null ? (String(r.line_style) as MindEdge["lineStyle"]) : undefined,
    direction:
      r.direction != null ? (String(r.direction) as MindEdge["direction"]) : undefined,
    version: Number(r.version),
    createdAt: Number(r.created_at),
    updatedAt: Number(r.updated_at),
    deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null,
  };
}

export class SqliteGraphStore {
  readonly db: DatabaseSync;
  private cache = new Map<string, MutableGraph>();

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.db.exec(SCHEMA);
    this.migrateSchema();
  }

  private migrateSchema() {
    const verRow = this.db.prepare("SELECT value FROM meta WHERE key = ?").get("schema_version") as
      | { value: string }
      | undefined;
    let ver = verRow ? Number(verRow.value) : 0;
    if (!verRow) {
      this.db.prepare("INSERT INTO meta(key, value) VALUES(?, ?)").run("schema_version", "1");
      ver = 1;
    }
    const tableInfo = (table: string) =>
      (this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (c) => c.name,
      );
    const ensureCol = (table: string, col: string, ddl: string) => {
      if (!tableInfo(table).includes(col)) {
        this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
      }
    };
    if (ver < 2) {
      ensureCol("nodes", "links_json", `links_json TEXT NOT NULL DEFAULT '[]'`);
      ensureCol("nodes", "image_url", `image_url TEXT`);
      ensureCol("nodes", "due_at", `due_at INTEGER`);
      ensureCol("nodes", "start_at", `start_at INTEGER`);
      ensureCol("edges", "tags_json", `tags_json TEXT NOT NULL DEFAULT '[]'`);
      ensureCol("edges", "note", `note TEXT`);
      this.db
        .prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
        .run("schema_version", "2");
      ver = 2;
    }
    if (ver < 3) {
      ensureCol("nodes", "accent_color", `accent_color TEXT`);
      ensureCol("nodes", "icon", `icon TEXT`);
      ensureCol("edges", "weight", `weight REAL`);
      ensureCol("edges", "line_style", `line_style TEXT`);
      this.db
        .prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
        .run("schema_version", "3");
      ver = 3;
    }
    if (ver < 4) {
      ensureCol("nodes", "alias", `alias TEXT`);
      this.db
        .prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
        .run("schema_version", "4");
      ver = 4;
    }
    if (ver < 5) {
      ensureCol("edges", "direction", `direction TEXT`);
      this.db.exec(`
CREATE TABLE IF NOT EXISTS snapshots (
  id TEXT PRIMARY KEY,
  canvas_id TEXT NOT NULL,
  name TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_canvas ON snapshots(canvas_id);
`);
      this.db
        .prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
        .run("schema_version", "5");
      ver = 5;
    }
    if (ver < 6) {
      ensureCol("nodes", "description_json", `description_json TEXT`);
      this.db
        .prepare(`INSERT INTO meta(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`)
        .run("schema_version", "6");
    }
  }

  close(): void {
    this.db.close();
  }

  listCanvases(): CanvasMeta[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM canvases WHERE deleted_at IS NULL ORDER BY updated_at DESC`,
      )
      .all() as Record<string, unknown>[];
    return rows.map((r) => this.rowCanvas(r));
  }

  private rowCanvas(r: Record<string, unknown>): CanvasMeta {
    const rawPrefs = JSON.parse(String(r.prefs_json || "{}")) as Record<string, unknown>;
    const anchorNodeId =
      rawPrefs.anchorNodeId != null ? String(rawPrefs.anchorNodeId) : null;
    const prefs = {
      themeId: "abyss",
      branchColoring: true,
      density: "comfortable",
      riskProfile: "fast",
      showRelationEdges: true,
      nodeBadges: "icons",
      showHoverCard: true,
      inspectorMode: "selection",
      nodeViewMode: "card",
      ...rawPrefs,
    } as CanvasMeta["prefs"];
    delete (prefs as Record<string, unknown>).anchorNodeId;
    return {
      id: String(r.id),
      title: String(r.title),
      focusNodeId: r.focus_node_id != null ? String(r.focus_node_id) : null,
      anchorNodeId,
      viewport: JSON.parse(String(r.viewport_json)),
      prefs,
      rev: Number(r.rev),
      agentMode: String(r.agent_mode) as CanvasMeta["agentMode"],
      createdAt: Number(r.created_at),
      updatedAt: Number(r.updated_at),
      deletedAt: r.deleted_at != null ? Number(r.deleted_at) : null,
    };
  }

  createCanvas(title?: string, rootText?: string): MutableGraph {
    const g = createEmptyGraph(title ?? "未命名画布", rootText);
    this.persistGraph(g, true);
    this.cache.set(g.canvas.id, g);
    return g;
  }

  loadCanvas(canvasId: string): MutableGraph {
    const cached = this.cache.get(canvasId);
    if (cached) return cloneGraph(cached);

    const crow = this.db.prepare(`SELECT * FROM canvases WHERE id = ?`).get(canvasId) as
      | Record<string, unknown>
      | undefined;
    if (!crow || crow.deleted_at != null) throw new Error(`canvas not found: ${canvasId}`);

    const nodes = (
      this.db.prepare(`SELECT * FROM nodes WHERE canvas_id = ?`).all(canvasId) as Record<
        string,
        unknown
      >[]
    ).map(rowNode);
    const edges = (
      this.db.prepare(`SELECT * FROM edges WHERE canvas_id = ?`).all(canvasId) as Record<
        string,
        unknown
      >[]
    ).map(rowEdge);

    const g: MutableGraph = {
      canvas: this.rowCanvas(crow),
      nodes: new Map(nodes.map((n) => [n.id, n])),
      edges: new Map(edges.map((e) => [e.id, e])),
    };
    if (!g.canvas.anchorNodeId) {
      resolveAnchorNodeId(g);
    }
    this.cache.set(canvasId, g);
    return cloneGraph(g);
  }

  getSnapshot(canvasId: string) {
    return toSnapshot(this.loadCanvas(canvasId));
  }

  applyChangeSet(
    canvasId: string,
    ops: Op[],
    opts: { origin: "user" | "ai"; summary?: string },
  ) {
    const g = this.loadCanvas(canvasId);
    const baseRev = g.canvas.rev;
    const result = applyOps(g, ops);
    result.graph.canvas.rev = baseRev + 1;
    const changeSetId = newId("cs");

    this.db.exec("BEGIN");
    try {
      this.persistGraph(result.graph, false);
      this.db
        .prepare(
          `INSERT INTO change_sets(id, canvas_id, base_rev, origin, summary, inverse_json, created_at)
           VALUES(?,?,?,?,?,?,?)`,
        )
        .run(
          changeSetId,
          canvasId,
          baseRev,
          opts.origin,
          opts.summary ?? `${ops.length} ops`,
          JSON.stringify(result.inverseOps),
          now(),
        );
      const ins = this.db.prepare(
        `INSERT INTO events(canvas_id, change_set_id, op_json, created_at) VALUES(?,?,?,?)`,
      );
      for (const op of ops) {
        ins.run(canvasId, changeSetId, JSON.stringify(op), now());
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }

    this.cache.set(canvasId, result.graph);
    return {
      changeSetId,
      rev: result.graph.canvas.rev,
      snapshot: toSnapshot(result.graph),
      affectedNodeIds: result.affectedNodeIds,
      inverseOps: result.inverseOps,
      autoFitPadding: result.autoFitPadding,
    };
  }

  undoChangeSet(changeSetId: string) {
    const row = this.db
      .prepare(`SELECT * FROM change_sets WHERE id = ?`)
      .get(changeSetId) as Record<string, unknown> | undefined;
    if (!row) throw new Error("changeset not found");
    if (row.undone_at != null) throw new Error("already undone");
    const canvasId = String(row.canvas_id);
    const inverse = JSON.parse(String(row.inverse_json)) as Op[];
    // Undo must not fail on stale expectedVersion from the forward pass.
    const cleaned = inverse.map((op) => {
      if (!op || typeof op !== "object") return op;
      const { expectedVersion: _ev, ...rest } = op as Op & {
        expectedVersion?: number;
      };
      return rest as Op;
    });
    const result = this.applyChangeSet(canvasId, cleaned, {
      origin: "user",
      summary: `undo ${changeSetId}`,
    });
    this.db
      .prepare(`UPDATE change_sets SET undone_at = ? WHERE id = ?`)
      .run(now(), changeSetId);
    return result;
  }

  /** Most recent change set that can still be undone (for mindmap_undo without id). */
  latestUndoableChangeSetId(canvasId: string): string | null {
    const row = this.db
      .prepare(
        `SELECT id FROM change_sets
         WHERE canvas_id = ? AND undone_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(canvasId) as { id: string } | undefined;
    return row?.id ?? null;
  }

  /** Latest undo companion (summary starts with "undo ") — redo by undoing it. */
  latestRedoableChangeSetId(canvasId: string): string | null {
    const row = this.db
      .prepare(
        `SELECT id, summary FROM change_sets
         WHERE canvas_id = ? AND undone_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(canvasId) as { id: string; summary: string } | undefined;
    if (!row) return null;
    if (!String(row.summary).startsWith("undo ")) return null;
    return row.id;
  }

  listChangeSets(canvasId: string, limit = 30) {
    const rows = this.db
      .prepare(
        `SELECT id, base_rev, origin, summary, created_at, undone_at
         FROM change_sets WHERE canvas_id = ?
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(canvasId, limit) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      baseRev: Number(r.base_rev),
      origin: String(r.origin),
      summary: String(r.summary),
      createdAt: Number(r.created_at),
      undone: r.undone_at != null,
      isUndoCompanion: String(r.summary).startsWith("undo "),
    }));
  }

  createSnapshot(canvasId: string, name: string) {
    const snap = this.getSnapshot(canvasId);
    const id = newId("snap");
    const t = now();
    this.db
      .prepare(
        `INSERT INTO snapshots(id, canvas_id, name, snapshot_json, created_at) VALUES(?,?,?,?,?)`,
      )
      .run(id, canvasId, name || `snapshot-${t}`, JSON.stringify(snap), t);
    return { id, name: name || `snapshot-${t}`, createdAt: t };
  }

  listSnapshots(canvasId: string, limit = 20) {
    const rows = this.db
      .prepare(
        `SELECT id, name, created_at FROM snapshots WHERE canvas_id = ?
         ORDER BY created_at DESC LIMIT ?`,
      )
      .all(canvasId, limit) as Record<string, unknown>[];
    return rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      createdAt: Number(r.created_at),
    }));
  }

  restoreSnapshot(snapshotId: string) {
    const row = this.db
      .prepare(`SELECT * FROM snapshots WHERE id = ?`)
      .get(snapshotId) as Record<string, unknown> | undefined;
    if (!row) throw new Error("snapshot not found");
    const canvasId = String(row.canvas_id);
    const snap = JSON.parse(String(row.snapshot_json)) as {
      canvas: CanvasMeta;
      nodes: MindNode[];
      edges: MindEdge[];
    };
    const g = this.loadCanvas(canvasId);
    // Soft-delete current live nodes/edges then restore snapshot rows.
    const t = now();
    for (const n of g.nodes.values()) {
      if (!n.deletedAt) {
        n.deletedAt = t;
        n.version += 1;
        n.updatedAt = t;
      }
    }
    for (const e of g.edges.values()) {
      if (!e.deletedAt) {
        e.deletedAt = t;
        e.version += 1;
        e.updatedAt = t;
      }
    }
    for (const n of snap.nodes) {
      g.nodes.set(n.id, {
        ...n,
        canvasId,
        deletedAt: n.deletedAt ?? null,
        updatedAt: t,
      });
    }
    for (const e of snap.edges) {
      g.edges.set(e.id, {
        ...e,
        canvasId,
        deletedAt: e.deletedAt ?? null,
        updatedAt: t,
      });
    }
    g.canvas.title = snap.canvas.title;
    g.canvas.focusNodeId = snap.canvas.focusNodeId;
    g.canvas.anchorNodeId = snap.canvas.anchorNodeId;
    g.canvas.prefs = { ...g.canvas.prefs, ...snap.canvas.prefs };
    g.canvas.viewport = { ...snap.canvas.viewport };
    g.canvas.rev += 1;
    g.canvas.updatedAt = t;
    const changeSetId = newId("cs");
    this.db.exec("BEGIN");
    try {
      this.persistGraph(g, false);
      this.db
        .prepare(
          `INSERT INTO change_sets(id, canvas_id, base_rev, origin, summary, inverse_json, created_at)
           VALUES(?,?,?,?,?,?,?)`,
        )
        .run(
          changeSetId,
          canvasId,
          g.canvas.rev - 1,
          "user",
          `restore snapshot ${snapshotId}`,
          JSON.stringify([]),
          t,
        );
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
    this.cache.set(canvasId, g);
    return {
      changeSetId,
      rev: g.canvas.rev,
      snapshot: toSnapshot(g),
      affectedNodeIds: [...g.nodes.keys()],
    };
  }

  search(
    canvasId: string,
    query: string,
    limit = 20,
    scope:
      | "text"
      | "note"
      | "tags"
      | "description"
      | "edge_label"
      | "edge_note"
      | "all" = "text",
  ) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const g = this.loadCanvas(canvasId);
    type NodeHit = {
      kind: "node";
      id: string;
      text: string;
      score: number;
      matchIn: ("text" | "note" | "tags" | "description")[];
    };
    type EdgeHit = {
      kind: "edge";
      id: string;
      from: string;
      to: string;
      fromText: string;
      toText: string;
      label?: string;
      note?: string;
      score: number;
      matchIn: ("edge_label" | "edge_note")[];
    };
    const hits: (NodeHit | EdgeHit)[] = [];

    const wantNodes =
      scope === "text" ||
      scope === "note" ||
      scope === "tags" ||
      scope === "description" ||
      scope === "all";
    const wantEdgeLabel = scope === "edge_label" || scope === "all";
    const wantEdgeNote = scope === "edge_note" || scope === "all";

    if (wantNodes) {
      for (const n of g.nodes.values()) {
        if (n.deletedAt) continue;
        const matchIn: ("text" | "note" | "tags" | "description")[] = [];
        const t = n.text.toLowerCase();
        const note = (n.note ?? "").toLowerCase();
        const tags = (n.tags ?? []).map((x) => x.toLowerCase());
        const desc = n.description
          ? JSON.stringify(n.description).toLowerCase()
          : "";
        const wantText = scope === "text" || scope === "all";
        const wantNote = scope === "note" || scope === "all";
        const wantTags = scope === "tags" || scope === "all";
        const wantDesc = scope === "description" || scope === "all";
        if (wantText && t.includes(q)) matchIn.push("text");
        if (wantNote && note.includes(q)) matchIn.push("note");
        if (wantTags && tags.some((tag) => tag.includes(q))) matchIn.push("tags");
        if (wantDesc && desc.includes(q)) matchIn.push("description");
        if (!matchIn.length) continue;
        let score = 0.4;
        if (matchIn.includes("text")) score = t.startsWith(q) ? 1 : 0.75;
        else if (matchIn.includes("tags")) score = 0.55;
        else if (matchIn.includes("description")) score = 0.5;
        else score = 0.45;
        hits.push({ kind: "node", id: n.id, text: n.text, score, matchIn });
      }
    }

    if (wantEdgeLabel || wantEdgeNote) {
      for (const e of g.edges.values()) {
        if (e.deletedAt) continue;
        const matchIn: ("edge_label" | "edge_note")[] = [];
        const label = (e.label ?? "").toLowerCase();
        const note = (e.note ?? "").toLowerCase();
        if (wantEdgeLabel && label.includes(q)) matchIn.push("edge_label");
        if (wantEdgeNote && note.includes(q)) matchIn.push("edge_note");
        if (!matchIn.length) continue;
        const fromN = g.nodes.get(e.from);
        const toN = g.nodes.get(e.to);
        let score = 0.5;
        if (matchIn.includes("edge_label")) {
          score = label.startsWith(q) ? 0.95 : 0.7;
        } else {
          score = 0.55;
        }
        hits.push({
          kind: "edge",
          id: e.id,
          from: e.from,
          to: e.to,
          fromText: fromN?.text ?? e.from,
          toText: toN?.text ?? e.to,
          ...(e.label ? { label: e.label } : {}),
          ...(e.note ? { note: e.note } : {}),
          score,
          matchIn,
        });
      }
    }

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  renameCanvas(canvasId: string, title: string) {
    const g = this.loadCanvas(canvasId);
    g.canvas.title = title;
    g.canvas.updatedAt = now();
    this.db
      .prepare(`UPDATE canvases SET title = ?, updated_at = ? WHERE id = ?`)
      .run(title, g.canvas.updatedAt, canvasId);
    this.cache.set(canvasId, g);
    return g.canvas;
  }

  softDeleteCanvas(canvasId: string) {
    const t = now();
    this.db.prepare(`UPDATE canvases SET deleted_at = ?, updated_at = ? WHERE id = ?`).run(t, t, canvasId);
    this.cache.delete(canvasId);
  }

  /** Permanent delete of a canvas and all related rows (P17). */
  hardDeleteCanvas(canvasId: string) {
    this.db.prepare(`DELETE FROM events WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM change_sets WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM edges WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM nodes WHERE canvas_id = ?`).run(canvasId);
    this.db.prepare(`DELETE FROM canvases WHERE id = ?`).run(canvasId);
    this.cache.delete(canvasId);
  }

  listDeletedNodes(canvasId: string): MindNode[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM nodes WHERE canvas_id = ? AND deleted_at IS NOT NULL ORDER BY deleted_at DESC LIMIT 100`,
      )
      .all(canvasId) as Record<string, unknown>[];
    return rows.map(rowNode);
  }

  restoreNode(canvasId: string, nodeId: string) {
    const g = this.loadCanvas(canvasId);
    const focus = g.canvas.focusNodeId;
    if (!g.nodes.get(nodeId)) throw new Error("not found");
    const ops: Op[] = [{ type: "restore_node", nodeId }];
    if (focus && focus !== nodeId) {
      ops.push({
        type: "link",
        from: focus,
        to: nodeId,
        kind: "hierarchy",
        asPrimary: true,
      });
    }
    return this.applyChangeSet(canvasId, ops, {
      origin: "user",
      summary: `restore ${nodeId}`,
    });
  }

  updateViewport(canvasId: string, viewport: CanvasMeta["viewport"]) {
    const g = this.loadCanvas(canvasId);
    g.canvas.viewport = viewport;
    g.canvas.updatedAt = now();
    this.db
      .prepare(`UPDATE canvases SET viewport_json = ?, updated_at = ? WHERE id = ?`)
      .run(JSON.stringify(viewport), g.canvas.updatedAt, canvasId);
    this.cache.set(canvasId, g);
  }

  private persistGraph(g: MutableGraph, isNew: boolean) {
    const c = g.canvas;
    if (!c.anchorNodeId) resolveAnchorNodeId(g);
    const prefsJson = JSON.stringify({
      ...c.prefs,
      anchorNodeId: c.anchorNodeId ?? null,
    });
    if (isNew) {
      this.db
        .prepare(
          `INSERT INTO canvases(id, title, focus_node_id, viewport_json, prefs_json, rev, agent_mode, created_at, updated_at)
           VALUES(?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          c.id,
          c.title,
          c.focusNodeId,
          JSON.stringify(c.viewport),
          prefsJson,
          c.rev,
          c.agentMode,
          c.createdAt,
          c.updatedAt,
        );
    } else {
      this.db
        .prepare(
          `UPDATE canvases SET title=?, focus_node_id=?, viewport_json=?, prefs_json=?, rev=?, agent_mode=?, updated_at=? WHERE id=?`,
        )
        .run(
          c.title,
          c.focusNodeId,
          JSON.stringify(c.viewport),
          prefsJson,
          c.rev,
          c.agentMode,
          c.updatedAt,
          c.id,
        );
    }

    const upsertNode = this.db.prepare(
      `INSERT INTO nodes(id, canvas_id, text, note, collapsed, pinned, pos_json, side_pref, style_preset, version, tags_json, links_json, image_url, due_at, start_at, accent_color, icon, alias, description_json, created_at, updated_at, deleted_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         text=excluded.text, note=excluded.note, collapsed=excluded.collapsed, pinned=excluded.pinned,
         pos_json=excluded.pos_json, side_pref=excluded.side_pref, style_preset=excluded.style_preset,
         version=excluded.version, tags_json=excluded.tags_json, links_json=excluded.links_json,
         image_url=excluded.image_url, due_at=excluded.due_at, start_at=excluded.start_at,
         accent_color=excluded.accent_color, icon=excluded.icon, alias=excluded.alias,
         description_json=excluded.description_json,
         updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
    );
    for (const n of g.nodes.values()) {
      upsertNode.run(
        n.id,
        n.canvasId,
        n.text,
        n.note ?? null,
        n.collapsed ? 1 : 0,
        n.pinned ? 1 : 0,
        n.pos ? JSON.stringify(n.pos) : null,
        n.sidePref,
        n.stylePreset,
        n.version,
        JSON.stringify(n.tags ?? []),
        JSON.stringify(n.links ?? []),
        n.imageUrl ?? null,
        n.dueAt ?? null,
        n.startAt ?? null,
        n.accentColor ?? null,
        n.icon ?? null,
        n.alias ?? null,
        n.description ? JSON.stringify(n.description) : null,
        n.createdAt,
        n.updatedAt,
        n.deletedAt ?? null,
      );
    }

    const upsertEdge = this.db.prepare(
      `INSERT INTO edges(id, canvas_id, "from", "to", kind, is_primary_parent, "order", label, tags_json, note, weight, line_style, direction, version, created_at, updated_at, deleted_at)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         "from"=excluded."from", "to"=excluded."to", kind=excluded.kind, is_primary_parent=excluded.is_primary_parent,
         "order"=excluded."order", label=excluded.label, tags_json=excluded.tags_json, note=excluded.note,
         weight=excluded.weight, line_style=excluded.line_style, direction=excluded.direction,
         version=excluded.version, updated_at=excluded.updated_at, deleted_at=excluded.deleted_at`,
    );
    for (const e of g.edges.values()) {
      upsertEdge.run(
        e.id,
        e.canvasId,
        e.from,
        e.to,
        e.kind,
        e.isPrimaryParent ? 1 : 0,
        e.order,
        e.label ?? null,
        JSON.stringify(e.tags ?? []),
        e.note ?? null,
        e.weight ?? null,
        e.lineStyle ?? null,
        e.direction ?? null,
        e.version,
        e.createdAt,
        e.updatedAt,
        e.deletedAt ?? null,
      );
    }
  }
}
