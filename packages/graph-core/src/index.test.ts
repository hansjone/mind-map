import { describe, expect, it } from "vitest";
import { applyOps, createEmptyGraph, GraphError } from "./index.js";

describe("graph-core", () => {
  it("creates empty graph with anchor", () => {
    const g = createEmptyGraph("Demo");
    expect(g.nodes.size).toBe(1);
    expect(g.canvas.focusNodeId).toBeTruthy();
  });

  it("creates child and rejects hierarchy cycle", () => {
    const g = createEmptyGraph("Root");
    const rootId = g.canvas.focusNodeId!;
    const r1 = applyOps(g, [
      { type: "create_node", text: "A", parentId: rootId, id: "n_a" },
    ]);
    const r2 = applyOps(r1.graph, [
      { type: "create_node", text: "B", parentId: "n_a", id: "n_b" },
    ]);
    expect(() =>
      applyOps(r2.graph, [
        { type: "link", from: "n_b", to: rootId, kind: "hierarchy" },
      ]),
    ).toThrow(GraphError);
  });

  it("update_text is invertible", () => {
    const g = createEmptyGraph("Root");
    const id = g.canvas.focusNodeId!;
    const r = applyOps(g, [{ type: "update_text", nodeId: id, text: "Hello" }]);
    expect(r.graph.nodes.get(id)!.text).toBe("Hello");
    const back = applyOps(r.graph, r.inverseOps);
    expect(back.graph.nodes.get(id)!.text).toBe("Root");
  });

  it("create_node inverse deletes the node (undo-safe)", () => {
    const g = createEmptyGraph("Root");
    const r = applyOps(g, [
      { type: "create_node", text: "凤霞", id: "n_fx" },
    ]);
    expect(r.graph.nodes.get("n_fx")?.deletedAt ?? null).toBeNull();
    const back = applyOps(r.graph, r.inverseOps);
    expect(back.graph.nodes.get("n_fx")!.deletedAt).toBeTruthy();
  });

  it("reorder is invertible and clears pin", () => {
    const g = createEmptyGraph("Root");
    const rootId = g.canvas.focusNodeId!;
    let r = applyOps(g, [
      { type: "create_node", text: "A", parentId: rootId, id: "n_a" },
      { type: "create_node", text: "B", parentId: rootId, id: "n_b" },
    ]);
    r = applyOps(r.graph, [
      {
        type: "set_pinned",
        nodeId: "n_b",
        pinned: true,
        pos: { x: 100, y: 50 },
      },
    ]);
    const ordered = applyOps(r.graph, [
      { type: "reorder", nodeId: "n_b", order: -1 },
    ]);
    expect(ordered.graph.nodes.get("n_b")!.pinned).toBe(false);
    const edge = [...ordered.graph.edges.values()].find(
      (e) => e.to === "n_b" && e.isPrimaryParent && !e.deletedAt,
    );
    expect(edge!.order).toBe(-1);
    const back = applyOps(ordered.graph, ordered.inverseOps);
    expect(back.graph.nodes.get("n_b")!.pinned).toBe(true);
  });

  it("batch_create two-pass parents/relations and inverse", () => {
    const g = createEmptyGraph("Root");
    const r = applyOps(g, [
      {
        type: "batch_create",
        nodes: [
          { text: "数通", alias: "datacom", id: "n_dc" },
          {
            text: "AIOps",
            alias: "aiops",
            id: "n_ai",
            parentId: "n_dc",
            description: { function: "诊断" },
            relations: [
              { to: "n_rs", kind: "relation", label: "触发" },
            ],
          },
          { text: "重启", alias: "restart", id: "n_rs", parentId: "n_dc" },
        ],
      },
    ]);
    expect(r.graph.nodes.get("n_ai")!.description?.function).toBe("诊断");
    const hier = [...r.graph.edges.values()].filter(
      (e) => e.kind === "hierarchy" && !e.deletedAt && e.from === "n_dc",
    );
    expect(hier.length).toBe(2);
    const rel = [...r.graph.edges.values()].find(
      (e) =>
        e.kind === "relation" &&
        e.from === "n_ai" &&
        e.to === "n_rs" &&
        !e.deletedAt,
    );
    expect(rel?.label).toBe("触发");
    const back = applyOps(r.graph, r.inverseOps);
    expect(back.graph.nodes.get("n_ai")!.deletedAt).toBeTruthy();
    expect(back.graph.nodes.get("n_dc")!.deletedAt).toBeTruthy();
  });

  it("batch_link creates multiple relation edges", () => {
    const g = createEmptyGraph("Root");
    const seeded = applyOps(g, [
      { type: "create_node", text: "A", id: "n_a", alias: "a" },
      { type: "create_node", text: "B", id: "n_b", alias: "b" },
      { type: "create_node", text: "C", id: "n_c", alias: "c" },
    ]);
    const r = applyOps(seeded.graph, [
      {
        type: "batch_link",
        edges: [
          { from: "n_a", to: "n_b", kind: "relation", label: "ab" },
          { from: "n_a", to: "n_c", kind: "relation", label: "ac" },
        ],
      },
    ]);
    const rels = [...r.graph.edges.values()].filter(
      (e) => e.kind === "relation" && !e.deletedAt,
    );
    expect(rels).toHaveLength(2);
    expect(rels.map((e) => e.label).sort()).toEqual(["ab", "ac"]);
    const back = applyOps(r.graph, r.inverseOps);
    const left = [...back.graph.edges.values()].filter(
      (e) => e.kind === "relation" && !e.deletedAt,
    );
    expect(left).toHaveLength(0);
  });

  it("auto_fit marks padding for host", () => {
    const g = createEmptyGraph("Root");
    const r = applyOps(g, [{ type: "auto_fit", padding: 80 }]);
    expect(r.autoFitPadding).toBe(80);
    expect(r.inverseOps[0]?.type).toBe("set_viewport");
  });

  it("delete_node + restore_node restores leaf and parent edge", () => {
    const g = createEmptyGraph("Root");
    const rootId = g.canvas.focusNodeId!;
    let r = applyOps(g, [
      { type: "create_node", text: "贾母", id: "n_jm", parentId: rootId },
      { type: "create_node", text: "黛玉", id: "n_dy", parentId: "n_jm" },
      {
        type: "link",
        from: "n_dy",
        to: "n_jm",
        kind: "relation",
        label: "外孙女",
      },
    ]);
    r = applyOps(r.graph, [{ type: "delete_node", nodeId: "n_dy" }]);
    expect(r.graph.nodes.get("n_dy")!.deletedAt).toBeTruthy();
    expect(
      [...r.graph.edges.values()].filter(
        (e) =>
          !e.deletedAt &&
          (e.from === "n_dy" || e.to === "n_dy"),
      ),
    ).toHaveLength(0);

    const restored = applyOps(r.graph, [
      { type: "restore_node", nodeId: "n_dy" },
    ]);
    expect(restored.graph.nodes.get("n_dy")!.deletedAt).toBeNull();
    const parentEdge = [...restored.graph.edges.values()].find(
      (e) =>
        !e.deletedAt &&
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        e.from === "n_jm" &&
        e.to === "n_dy",
    );
    expect(parentEdge).toBeTruthy();
    const rel = [...restored.graph.edges.values()].find(
      (e) =>
        !e.deletedAt &&
        e.kind === "relation" &&
        e.from === "n_dy" &&
        e.to === "n_jm",
    );
    expect(rel?.label).toBe("外孙女");
  });

  it("delete_node undo restores via restore_node without duplicate edges", () => {
    const g = createEmptyGraph("Root");
    const rootId = g.canvas.focusNodeId!;
    let r = applyOps(g, [
      { type: "create_node", text: "A", id: "n_a", parentId: rootId },
      { type: "create_node", text: "B", id: "n_b", parentId: "n_a" },
    ]);
    const beforeEdges = [...r.graph.edges.values()].filter((e) => !e.deletedAt)
      .length;
    const deleted = applyOps(r.graph, [{ type: "delete_node", nodeId: "n_a" }]);
    // B promoted under root
    const promo = [...deleted.graph.edges.values()].find(
      (e) =>
        !e.deletedAt &&
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        e.to === "n_b",
    );
    expect(promo?.from).toBe(rootId);

    const undone = applyOps(deleted.graph, deleted.inverseOps);
    expect(undone.graph.nodes.get("n_a")!.deletedAt).toBeNull();
    const aParent = [...undone.graph.edges.values()].find(
      (e) =>
        !e.deletedAt &&
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        e.to === "n_a",
    );
    expect(aParent?.from).toBe(rootId);
    const bParent = [...undone.graph.edges.values()].find(
      (e) =>
        !e.deletedAt &&
        e.kind === "hierarchy" &&
        e.isPrimaryParent &&
        e.to === "n_b",
    );
    expect(bParent?.from).toBe("n_a");
    const liveHier = [...undone.graph.edges.values()].filter(
      (e) => !e.deletedAt && e.kind === "hierarchy" && e.isPrimaryParent,
    );
    // root→a, a→b (plus possibly root title edges depending on create)
    expect(liveHier.filter((e) => e.to === "n_b")).toHaveLength(1);
    expect(liveHier.filter((e) => e.to === "n_a")).toHaveLength(1);
    expect(
      [...undone.graph.edges.values()].filter((e) => !e.deletedAt).length,
    ).toBeGreaterThanOrEqual(beforeEdges);
  });
});
