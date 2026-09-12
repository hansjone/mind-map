import { describe, expect, it } from "vitest";
import {
  queryMissingMeta,
  queryNeighbors,
  queryOrphans,
  queryPaths,
  queryStats,
  resolveQueryNodeRef,
  type MindEdge,
  type MindNode,
} from "./index.js";

function node(
  partial: Partial<MindNode> & { id: string; text: string },
): MindNode {
  const t = 1;
  return {
    canvasId: "c1",
    collapsed: false,
    pinned: false,
    sidePref: 0,
    stylePreset: "default",
    version: 1,
    tags: [],
    links: [],
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}

function edge(
  partial: Partial<MindEdge> & {
    id: string;
    from: string;
    to: string;
    kind: "hierarchy" | "relation";
  },
): MindEdge {
  const t = 1;
  return {
    canvasId: "c1",
    isPrimaryParent: partial.kind === "hierarchy",
    order: 0,
    tags: [],
    version: 1,
    createdAt: t,
    updatedAt: t,
    ...partial,
  };
}

describe("graph-query", () => {
  const nodes = [
    node({
      id: "a",
      text: "AIOps",
      alias: "aiops",
      description: { function: "根因诊断", sla: "30s" },
    }),
    node({ id: "b", text: "自动重启", alias: "restart" }),
    node({ id: "c", text: "工单", alias: "ticket" }),
    node({ id: "d", text: "孤立点" }),
  ];
  const edges = [
    edge({
      id: "e1",
      from: "a",
      to: "b",
      kind: "relation",
      label: "高置信→重启",
    }),
    edge({
      id: "e2",
      from: "a",
      to: "c",
      kind: "relation",
      label: "低置信→工单",
    }),
    edge({ id: "e3", from: "c", to: "b", kind: "relation", label: "也可能重启" }),
  ];

  it("neighbors out depth 1", () => {
    const r = queryNeighbors({
      nodes,
      edges,
      nodeId: "a",
      depth: 1,
      direction: "out",
    });
    expect(r.citedNodeIds.sort()).toEqual(["a", "b", "c"]);
    expect(r.nodes.find((n) => n.id === "a")?.function).toBe("根因诊断");
  });

  it("paths finds both branches", () => {
    const r = queryPaths({
      nodes,
      edges,
      fromId: "a",
      toId: "b",
      direction: "out",
      maxPaths: 5,
    });
    expect(r.paths.length).toBe(2);
    const texts = r.paths.map((p) => p.texts.join("→")).sort();
    expect(texts).toContain("AIOps→自动重启");
    expect(texts).toContain("AIOps→工单→自动重启");
    expect(r.paths.find((p) => p.hops === 2)?.hops).toBe(2);
    const direct = r.paths.find((p) => p.hops === 1)!;
    expect(direct.edges[0]?.id).toBe("e1");
    expect(direct.edges[0]?.label).toBe("高置信→重启");
    expect(direct.edgeLabels[0]).toBe("高置信→重启");
    expect(r.truncated).toBe(false);
    expect(r.pathsReturned).toBe(2);
    expect(r.totalPathsFound).toBe(2);
    expect(r.omittedPaths).toBe(0);
    expect(r.maxPaths).toBe(5);
  });

  it("path truncation reports omitted count", () => {
    const r = queryPaths({
      nodes,
      edges,
      fromId: "a",
      toId: "b",
      direction: "out",
      maxPaths: 1,
    });
    expect(r.pathsReturned).toBe(1);
    expect(r.truncated).toBe(true);
    expect(r.totalPathsFound).toBeGreaterThan(1);
    expect(r.omittedPaths).toBe(r.totalPathsFound - 1);
    expect(r.maxPaths).toBe(1);
  });

  it("multi-hop through intermediate relation node (BFS)", () => {
    const n = [
      node({ id: "detect", text: "检测", alias: "detect" }),
      node({ id: "trig", text: "诊断触发", alias: "diag_trigger" }),
      node({ id: "aiops", text: "AIOps", alias: "aiops" }),
      node({ id: "kb", text: "知识入库", alias: "knowledge_write" }),
    ];
    const e = [
      edge({ id: "1", from: "detect", to: "trig", kind: "relation", label: "触发" }),
      edge({ id: "2", from: "trig", to: "aiops", kind: "relation", label: "进入诊断" }),
      edge({ id: "3", from: "aiops", to: "kb", kind: "relation", label: "沉淀" }),
    ];
    const r = queryPaths({
      nodes: n,
      edges: e,
      fromId: "detect",
      toId: "kb",
      throughRelationNodes: true,
      maxHops: 5,
      direction: "out",
    });
    expect(r.paths.length).toBe(1);
    expect(r.paths[0]!.texts).toEqual([
      "检测",
      "诊断触发",
      "AIOps",
      "知识入库",
    ]);
    expect(r.paths[0]!.hops).toBe(3);
    expect(r.paths[0]!.edges.map((x) => x.id)).toEqual(["1", "2", "3"]);
  });

  it("throughRelationNodes false forces 1 hop", () => {
    const r = queryPaths({
      nodes,
      edges,
      fromId: "a",
      toId: "b",
      throughRelationNodes: false,
      direction: "out",
    });
    expect(r.maxHops).toBe(1);
    expect(r.paths.every((p) => p.hops === 1)).toBe(true);
    expect(r.paths.map((p) => p.texts.join("→"))).toEqual(["AIOps→自动重启"]);
  });

  it("stats and orphans / missing meta", () => {
    const s = queryStats({ nodes, edges });
    expect(s.nodeCount).toBe(4);
    expect(s.orphanNodes).toBe(1);
    // empty description → withoutDescription; withoutFunction only if description present
    expect(s.nodesWithoutDescription).toBe(3);
    expect(s.nodesWithoutFunction).toBe(0);
    expect(s.connectedComponents.count).toBe(s.islands);
    expect(s.orphanDef).toMatch(/full graph/i);
    expect(s.nodesWithoutRelation).toBeUndefined();
    expect(s.mostConnected?.nodeId).toBe("a");
    expect(s.mostConnected?.degree).toBe(2);
    expect(s.longestPath?.hops).toBeGreaterThanOrEqual(1);
    const rel = queryStats({ nodes, edges, edgeKinds: "relation" });
    expect(rel.longestPath?.edgeKinds).toBe("relation");
    expect(rel.nodesWithoutRelation).toBe(rel.orphanNodes);
    expect(rel.orphanDef).toMatch(/relation/i);
    const o = queryOrphans({ nodes, edges });
    expect(o.citedNodeIds).toEqual(["d"]);
    const m = queryMissingMeta({ nodes, edges });
    expect(m.nodesWithoutDescription.some((n) => n.id === "b")).toBe(true);
    expect(m.nodesWithoutFunction.length).toBe(0);
  });

  it("resolveQueryNodeRef alias and title", () => {
    expect(resolveQueryNodeRef(nodes, "@aiops").ok).toBe(true);
    expect(resolveQueryNodeRef(nodes, "自动重启").ok).toBe(true);
    const miss = resolveQueryNodeRef(nodes, "不存在");
    expect(miss.ok).toBe(false);
  });
});
