import fs from "node:fs";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { cors } from "hono/cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { SqliteGraphStore } from "@mind-map/graph-store";
import { coerceOpInput, OpSchema, type Op } from "@mind-map/shared";
import { listSkins } from "@mind-map/dream-skin";
import { GraphError } from "@mind-map/graph-core";
import { z } from "zod";
import {
  createChatHandler,
  llmConfigured,
  llmStatus,
} from "./chat.js";
import {
  listProposals,
  runTool,
  setActivity,
  clientCanvasPayload,
  finalizeAutoFit,
} from "./tools.js";

export type SessionBridge = {
  prompt: (canvasId: string, text: string) => Promise<{ ok: boolean; sessionId?: string }>
  history: (canvasId: string) => Promise<{ sessionId: string | null; messages: { role: string; content: string }[] }>
  status: (canvasId?: string) => { ok: boolean; mode: string; bound?: boolean; sessionId?: string | null; agents?: boolean }
}

function bridgeBase() {
  return (process.env.MINDMAP_DSH_BRIDGE || "").replace(/\/$/, "");
}

function internalToken() {
  return process.env.MINDMAP_INTERNAL_TOKEN || "";
}

async function callDshBridge(path: string, init?: RequestInit) {
  const base = bridgeBase();
  if (!base) throw new Error("DSH bridge not configured");
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(body.message || body.error || `bridge ${res.status}`));
  }
  return body;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Monorepo root, or plugin package root when launched from packaged bundle. */
export const mindMapRoot = process.env.MINDMAP_ROOT
  ? path.resolve(process.env.MINDMAP_ROOT)
  : path.resolve(__dirname, "../../..");

export function resolveWebDist(root = mindMapRoot) {
  if (process.env.MINDMAP_WEB_DIST) {
    return path.resolve(process.env.MINDMAP_WEB_DIST);
  }
  const bundled = path.join(root, "bundle", "web");
  if (fs.existsSync(path.join(bundled, "index.html"))) return bundled;
  return path.join(root, "apps", "web", "dist");
}

export function loadDotEnv(root = mindMapRoot) {
  try {
    const envPath = path.join(root, ".env");
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
      if (!m || line.trimStart().startsWith("#")) continue;
      const key = m[1]!;
      let val = m[2]!;
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] == null) process.env[key] = val;
    }
  } catch {
    /* ignore */
  }
}

export type MindMapServerOptions = {
  port?: number;
  bind?: string;
  dataDir?: string;
  root?: string;
  /** When set by DSH plugin, overrides env-based LLM status messaging. */
  llmSource?: "dsh" | "env" | "none";
  /** Optional in-process session bridge (preferred over HTTP MINDMAP_DSH_BRIDGE). */
  sessionBridge?: SessionBridge;
};

export type MindMapServerHandle = {
  app: Hono;
  store: SqliteGraphStore;
  port: number;
  bind: string;
  dbPath: string;
  close: () => Promise<void>;
};

export function startMindMapServer(
  options: MindMapServerOptions = {},
): MindMapServerHandle {
  const root = options.root ?? mindMapRoot;
  loadDotEnv(root);

  const port = Number(options.port ?? process.env.PORT ?? 17890);
  const bind = options.bind ?? process.env.BIND ?? "127.0.0.1";
  const dataDir = options.dataDir ?? process.env.DATA_DIR ?? path.join(root, "data");
  const dbPath = path.join(dataDir, "mindmap.sqlite");

  const store = new SqliteGraphStore(dbPath);
  const app = new Hono();
  app.use("*", cors({ origin: "*" }));

  const sockets = new Set<WebSocket>();

  function broadcast(payload: unknown) {
    const data = JSON.stringify(payload);
    for (const ws of sockets) {
      if (ws.readyState === ws.OPEN) ws.send(data);
    }
  }

  app.get("/health", (c) =>
    c.json({ ok: true, port, bind, dbPath, skins: listSkins().map((s) => s.id) }),
  );

  app.get("/api/skins", (c) => c.json({ skins: listSkins() }));

  app.get("/api/canvases", (c) =>
    c.json({
      canvases: store.listCanvases().map((x) => ({
        id: x.id,
        title: x.title,
        focusNodeId: x.focusNodeId === x.anchorNodeId ? null : x.focusNodeId,
        viewport: x.viewport,
        prefs: x.prefs,
        rev: x.rev,
        agentMode: x.agentMode,
        createdAt: x.createdAt,
        updatedAt: x.updatedAt,
      })),
    }),
  );

  app.post("/api/canvases", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      title?: string;
      rootText?: string;
    };
    const g = store.createCanvas(body.title, body.rootText);
    broadcast({ type: "canvas/created", canvasId: g.canvas.id });
    return c.json(clientCanvasPayload(store, g.canvas.id));
  });

  app.get("/api/canvases/:id", (c) => {
    const id = c.req.param("id");
    try {
      return c.json(clientCanvasPayload(store, id));
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });

  app.patch("/api/canvases/:id", async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json()) as {
      title?: string;
      viewport?: { x: number; y: number; zoom: number };
    };
    if (body.title) store.renameCanvas(id, body.title);
    if (body.viewport) store.updateViewport(id, body.viewport);
    return c.json({ canvas: store.loadCanvas(id).canvas });
  });

  app.delete("/api/canvases/:id", (c) => {
    const id = c.req.param("id");
    store.hardDeleteCanvas(id);
    broadcast({ type: "canvas/deleted", canvasId: id });
    return c.json({ ok: true });
  });

  app.post("/api/canvases/:id/ops", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const coercedOps = Array.isArray(body?.ops)
      ? body.ops.map((o: unknown) => coerceOpInput(o))
      : body?.ops;
    const parsed = z
      .object({
        ops: z.array(OpSchema),
        origin: z.enum(["user", "ai"]).default("user"),
        summary: z.string().optional(),
      })
      .safeParse({ ...body, ops: coercedOps });
    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          error: "invalid_op",
          message:
            "Each op needs field `type` (not `op`). Valid: create_node, link, update_text, set_pinned, …",
          details: parsed.error.flatten(),
        },
        400,
      );
    }
    try {
      const result = store.applyChangeSet(id, parsed.data.ops as Op[], {
        origin: parsed.data.origin,
        summary: parsed.data.summary,
      });
      const fitViewport =
        result.autoFitPadding != null
          ? finalizeAutoFit(store, id, result.autoFitPadding)
          : null;
      const payload = clientCanvasPayload(store, id);
      const preserveUnpinned = parsed.data.ops.every((o) => o.type === "set_pinned");
      broadcast({
        type: "canvas/event",
        canvasId: id,
        changeSetId: result.changeSetId,
        rev: result.rev,
        preserveUnpinned,
        affectedNodeIds: result.affectedNodeIds.filter(
          (nid) => nid !== result.snapshot.canvas.anchorNodeId,
        ),
        fitViewport: fitViewport ?? undefined,
      });
      return c.json({
        ok: true,
        changeSetId: result.changeSetId,
        rev: result.rev,
        affectedNodeIds: result.affectedNodeIds.filter(
          (nid) => nid !== result.snapshot.canvas.anchorNodeId,
        ),
        fitViewport: fitViewport ?? undefined,
        ...payload,
      });
    } catch (e) {
      if (e instanceof GraphError) {
        return c.json({ ok: false, error: e.code, message: e.message }, 409);
      }
      return c.json({ ok: false, error: "invalid_op", message: String(e) }, 400);
    }
  });

  app.post("/api/canvases/:id/undo", async (c) => {
    const canvasId = c.req.param("id");
    const body = (await c.req.json().catch(() => ({}))) as {
      changeSetId?: string;
    };
    try {
      let changeSetId = body.changeSetId;
      if (!changeSetId) {
        changeSetId = store.latestUndoableChangeSetId(canvasId) ?? undefined;
      }
      if (!changeSetId) {
        return c.json(
          { ok: false, error: "nothing_to_undo", message: "No undoable change set" },
          400,
        );
      }
      const result = store.undoChangeSet(changeSetId);
      const payload = clientCanvasPayload(store, canvasId);
      broadcast({
        type: "canvas/event",
        canvasId,
        changeSetId: result.changeSetId,
        rev: result.rev,
      });
      return c.json({
        ok: true,
        undoneChangeSetId: changeSetId,
        changeSetId: result.changeSetId,
        rev: result.rev,
        ...payload,
      });
    } catch (e) {
      return c.json({ ok: false, error: "undo_failed", message: String(e) }, 400);
    }
  });

  app.get("/api/canvases/:id/search", (c) => {
    const q = c.req.query("q") ?? "";
    const scopeRaw = c.req.query("scope") ?? "text";
    const scope =
      scopeRaw === "note" ||
      scopeRaw === "tags" ||
      scopeRaw === "description" ||
      scopeRaw === "edge_label" ||
      scopeRaw === "edge_note" ||
      scopeRaw === "all"
        ? scopeRaw
        : "text";
    return c.json({ hits: store.search(c.req.param("id"), q, 20, scope) });
  });

  app.get("/api/canvases/:id/trash", (c) => {
    try {
      return c.json({ nodes: store.listDeletedNodes(c.req.param("id")) });
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });

  app.post("/api/canvases/:id/trash/:nodeId/restore", (c) => {
    try {
      const result = store.restoreNode(c.req.param("id"), c.req.param("nodeId"));
      broadcast({
        type: "canvas/event",
        canvasId: c.req.param("id"),
        changeSetId: result.changeSetId,
      });
      return c.json({ ok: true, ...result });
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 400);
    }
  });

  app.post("/api/canvases/:id/activity", async (c) => {
    const id = c.req.param("id");
    const body = (await c.req.json()) as {
      selectionIds?: string[];
      focusNodeId?: string | null;
      viewport?: { x: number; y: number; zoom: number };
    };
    setActivity({
      canvasId: id,
      selectionIds: body.selectionIds ?? [],
      focusNodeId: body.focusNodeId ?? null,
      viewport: body.viewport ?? { x: 0, y: 0, zoom: 1 },
      updatedAt: Date.now(),
    });
    return c.json({ ok: true });
  });

  app.get("/api/canvases/:id/proposals", (c) => {
    return c.json({ proposals: listProposals(c.req.param("id")) });
  });

  app.post("/api/canvases/:id/proposals/:pid/accept", async (c) => {
    const result = await runTool(
      "mindmap_accept_proposal",
      { proposalId: c.req.param("pid"), canvasId: c.req.param("id") },
      { store, broadcast, defaultCanvasId: c.req.param("id") },
    );
    return c.json(result);
  });

  app.post("/api/canvases/:id/proposals/:pid/reject", async (c) => {
    const result = await runTool(
      "mindmap_reject_proposal",
      { proposalId: c.req.param("pid") },
      { store, broadcast, defaultCanvasId: c.req.param("id") },
    );
    return c.json(result);
  });

  app.get("/api/canvases/:id/export.json", (c) => {
    try {
      const snap = store.getSnapshot(c.req.param("id"));
      return c.json(snap);
    } catch {
      return c.json({ ok: false, error: "not_found" }, 404);
    }
  });

  app.post("/api/tools/:name", async (c) => {
    const name = c.req.param("name");
    const args = (await c.req.json().catch(() => ({}))) as Record<string, unknown>;
    try {
      const result = await runTool(name, args, { store, broadcast });
      return c.json(result);
    } catch (e) {
      return c.json(
        { ok: false, error: "tool_error", message: String(e) },
        400,
      );
    }
  });

  const handleChat = createChatHandler({ store, broadcast });

  async function sessionStatus(canvasId?: string) {
    if (options.sessionBridge) {
      return { ...options.sessionBridge.status(canvasId), canvasUrl: `http://${bind}:${port}` };
    }
    if (bridgeBase()) {
      const q = canvasId ? `?canvasId=${encodeURIComponent(canvasId)}` : "";
      return callDshBridge(`/status${q}`);
    }
    return {
      ok: true,
      mode: llmConfigured() ? "legacy-env-llm" : "unconfigured",
      bound: false,
      sessionId: null,
      agents: false,
      message: "未连接 DSH：请通过 dsh-mind-map 插件启动，对话将镜像 DSH 会话",
    };
  }

  app.get("/api/session/status", async (c) => {
    try {
      const canvasId = c.req.query("canvasId") || undefined;
      return c.json(await sessionStatus(canvasId));
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });

  app.post("/api/session/prompt", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      canvasId?: string;
      text?: string;
    };
    if (!body.canvasId || !body.text?.trim()) {
      return c.json({ ok: false, message: "canvasId and text required" }, 400);
    }
    try {
      if (options.sessionBridge) {
        const result = await options.sessionBridge.prompt(body.canvasId, body.text);
        return c.json(result);
      }
      if (bridgeBase()) {
        const result = await callDshBridge("/prompt", {
          method: "POST",
          body: JSON.stringify({ canvasId: body.canvasId, text: body.text }),
        });
        return c.json(result);
      }
      return c.json(
        {
          ok: false,
          error: "dsh_bridge_missing",
          message: "对话需经 DSH 会话。请用 dsh-mind-map 插件启动画布服务。",
        },
        503,
      );
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });

  app.get("/api/session/history", async (c) => {
    const canvasId = c.req.query("canvasId");
    if (!canvasId) return c.json({ ok: false, message: "canvasId required" }, 400);
    try {
      if (options.sessionBridge) {
        const hist = await options.sessionBridge.history(canvasId);
        return c.json({ ok: true, ...hist });
      }
      if (bridgeBase()) {
        const hist = await callDshBridge(
          `/history?canvasId=${encodeURIComponent(canvasId)}`,
        );
        return c.json(hist);
      }
      return c.json({ ok: true, sessionId: null, messages: [] });
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });

  app.post("/api/session/ensure", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { canvasId?: string };
    if (!body.canvasId) return c.json({ ok: false, message: "canvasId required" }, 400);
    try {
      if (options.sessionBridge) {
        // ensure via prompt path's ensureBinding is private; status+history enough
        const st = options.sessionBridge.status(body.canvasId);
        if (st.bound) return c.json({ ok: true, sessionId: st.sessionId });
      }
      if (bridgeBase()) {
        const result = await callDshBridge("/ensure", {
          method: "POST",
          body: JSON.stringify({ canvasId: body.canvasId }),
        });
        return c.json(result);
      }
      return c.json({ ok: false, message: "DSH bridge missing" }, 503);
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });

  app.post("/api/internal/session-event", async (c) => {
    const token = c.req.header("x-mindmap-token") || "";
    const expected = internalToken();
    if (expected && token !== expected) {
      return c.json({ ok: false, error: "forbidden" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      canvasId?: string;
      mirror?: Record<string, unknown>;
    };
    if (!body.canvasId || !body.mirror) {
      return c.json({ ok: false, message: "canvasId and mirror required" }, 400);
    }
    broadcast({
      type: "session/mirror",
      canvasId: body.canvasId,
      mirror: body.mirror,
    });
    return c.json({ ok: true });
  });

  const uploadsDir = path.join(dataDir, "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });

  app.post("/api/uploads", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      dataBase64?: string;
      mimeType?: string;
      filename?: string;
    } | null;
    const raw = String(body?.dataBase64 || "").trim();
    if (!raw) {
      return c.json({ ok: false, message: "dataBase64 required" }, 400);
    }
    let b64 = raw;
    let mime = String(body?.mimeType || "").trim().toLowerCase();
    const dataUrl = /^data:([^;]+);base64,(.+)$/i.exec(raw);
    if (dataUrl) {
      mime = dataUrl[1]!.toLowerCase();
      b64 = dataUrl[2]!;
    }
    const allowed: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const ext = allowed[mime];
    if (!ext) {
      return c.json(
        {
          ok: false,
          message: "仅支持 jpeg/png/webp/gif",
        },
        400,
      );
    }
    let buf: Buffer;
    try {
      buf = Buffer.from(b64, "base64");
    } catch {
      return c.json({ ok: false, message: "invalid base64" }, 400);
    }
    if (!buf.length || buf.length > 6 * 1024 * 1024) {
      return c.json({ ok: false, message: "图片需小于 6MB（压缩后）" }, 400);
    }
    const id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    const name = `${id}.${ext}`;
    fs.writeFileSync(path.join(uploadsDir, name), buf);
    const url = `/uploads/${name}`;
    return c.json({ ok: true, url, mimeType: mime, bytes: buf.length });
  });

  app.get("/uploads/:name", (c) => {
    const name = c.req.param("name");
    if (!/^[\w.-]+\.(jpe?g|png|webp|gif)$/i.test(name)) {
      return c.notFound();
    }
    const fp = path.join(uploadsDir, name);
    if (!fs.existsSync(fp)) return c.notFound();
    const lower = name.toLowerCase();
    const mime = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".webp")
        ? "image/webp"
        : lower.endsWith(".gif")
          ? "image/gif"
          : "image/jpeg";
    const data = fs.readFileSync(fp);
    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  });

  // Legacy env-LLM path kept only as offline fallback; prefer DSH session.
  app.post("/api/chat", async (c) => {
    if (bridgeBase() || options.sessionBridge) {
      return c.json(
        {
          ok: false,
          error: "use_session_prompt",
          message: "请使用 /api/session/prompt（DSH 会话镜像）",
        },
        400,
      );
    }
    if (!llmConfigured()) {
      return c.json(
        {
          ok: false,
          error: "llm_not_configured",
          message:
            "请通过 DSH 插件 dsh-mind-map 使用会话对话；独立调试才需要 LLM_API_KEY",
        },
        503,
      );
    }
    const body = (await c.req.json()) as {
      canvasId: string;
      messages: { role: "user" | "assistant" | "system"; content: string }[];
    };
    if (!body.canvasId || !body.messages?.length) {
      return c.json({ ok: false, message: "canvasId and messages required" }, 400);
    }
    try {
      const result = await handleChat(body);
      return result.toDataStreamResponse();
    } catch (e) {
      return c.json({ ok: false, message: String(e) }, 500);
    }
  });

  app.get("/api/llm/status", async (c) => {
    try {
      const st = await sessionStatus();
      const dshOk = st.mode === "dsh-session" || Boolean(bridgeBase()) || Boolean(options.sessionBridge);
      return c.json({
        ...llmStatus(options.llmSource ?? (dshOk ? "dsh" : undefined)),
        configured: dshOk || llmConfigured(),
        session: st,
      });
    } catch {
      return c.json({
        ...llmStatus(options.llmSource),
        configured: llmConfigured(),
      });
    }
  });

  // Static UI: monorepo apps/web/dist, or packaged bundle/web via MINDMAP_WEB_DIST.
  const webDistAbs = resolveWebDist(root);
  if (fs.existsSync(path.join(webDistAbs, "index.html"))) {
    app.use(
      "/*",
      serveStatic({
        root: webDistAbs,
        index: "index.html",
      }),
    );
    // SPA fallback (never swallow API / health)
    app.get("*", async (c) => {
      const p = c.req.path
      if (p.startsWith("/api") || p === "/health" || p.startsWith("/ws") || p.startsWith("/uploads")) {
        return c.notFound()
      }
      const indexPath = path.join(webDistAbs, "index.html");
      if (!fs.existsSync(indexPath)) {
        return c.text(
          "Mind Map UI not built. From mind-map repo run: pnpm --filter @mind-map/web build && pnpm pack:plugin",
          503,
        );
      }
      return c.html(fs.readFileSync(indexPath, "utf8"));
    });
  } else {
    app.get("/", (c) =>
      c.text(
        `Mind Map UI missing (${webDistAbs}). Run: pnpm pack:plugin`,
        503,
      ),
    );
  }

  const server = serve({ fetch: app.fetch, port, hostname: bind }, (info) => {
    console.log(`[mind-map] http://${info.address}:${info.port}`);
    console.log(`[mind-map] db ${dbPath}`);
  }) as unknown as Server;

  server.on("error", (err: NodeJS.ErrnoException) => {
    console.error(`[mind-map] listen error: ${err.code || err.message}`);
    if (err.code === "EADDRINUSE") {
      console.error(
        `[mind-map] ${bind}:${port} is busy — stop the old process or change the port in DSH settings`,
      );
    }
    process.exitCode = 1;
    try {
      store.close();
    } catch {
      /* ignore */
    }
    process.exit(1);
  });

  const wss = new WebSocketServer({ server, path: "/ws" });
  wss.on("error", (err) => {
    console.error(`[mind-map] ws error: ${String(err)}`);
  });
  wss.on("connection", (ws) => {
    sockets.add(ws);
    ws.send(JSON.stringify({ type: "hello", ok: true }));
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(String(raw)) as { type?: string };
        if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
      } catch {
        /* ignore */
      }
    });
    ws.on("close", () => sockets.delete(ws));
  });

  return {
    app,
    store,
    port,
    bind,
    dbPath,
    close: async () => {
      await new Promise<void>((resolve) => {
        wss.close();
        server.close(() => resolve());
      });
      store.close();
    },
  };
}
