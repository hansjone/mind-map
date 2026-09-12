import { describe, expect, it } from "vitest";
import { hierarchyFingerprint, layout, nodeLayoutSize } from "./index.js";
import type { MindEdge, MindNode } from "@mind-map/shared";

function node(id: string, text: string, sidePref: -1 | 0 | 1 = 0): MindNode {
  return {
    id,
    canvasId: "c",
    text,
    collapsed: false,
    pinned: false,
    sidePref,
    stylePreset: "default",
    version: 1,
    tags: [],
    links: [],
    createdAt: 0,
    updatedAt: 0,
  };
}

function edge(from: string, to: string, order = 0): MindEdge {
  return {
    id: `e_${from}_${to}`,
    canvasId: "c",
    from,
    to,
    kind: "hierarchy",
    isPrimaryParent: true,
    order,
    tags: [],
    version: 1,
    createdAt: 0,
    updatedAt: 0,
  };
}

describe("layout-engine", () => {
  it("places focus at origin and children left/right", () => {
    const nodes = [
      node("root", "R"),
      node("a", "A", -1),
      node("b", "B", 1),
    ];
    const edges = [edge("root", "a", 0), edge("root", "b", 1)];
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    expect(pos.root).toEqual({ x: 0, y: 0 });
    expect(pos.a!.x).toBeLessThan(0);
    expect(pos.b!.x).toBeGreaterThan(0);
  });

  it("nested left subtree stays on negative x", () => {
    const nodes = [
      node("root", "R"),
      node("a", "A", -1),
      node("a1", "A1", 0),
      node("b", "B", 1),
    ];
    const edges = [
      edge("root", "a", 0),
      edge("a", "a1", 0),
      edge("root", "b", 1),
    ];
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    expect(pos.a!.x).toBeLessThan(0);
    expect(pos.a1!.x).toBeLessThan(pos.a!.x);
    expect(pos.b!.x).toBeGreaterThan(0);
  });

  it("respects pinned positions", () => {
    const n = node("a", "A", 1);
    n.pinned = true;
    n.pos = { x: 999, y: -50 };
    const nodes = [node("root", "R"), n];
    const edges = [edge("root", "a", 0)];
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    expect(pos.a).toEqual({ x: 999, y: -50 });
  });

  it("re-roots on focus so ancestors are not stacked as orphans", () => {
    const nodes = [
      node("root", "R"),
      node("a", "A", -1),
      node("a1", "A1"),
      node("b", "B", 1),
    ];
    const edges = [
      edge("root", "a", 0),
      edge("a", "a1", 0),
      edge("root", "b", 1),
    ];
    const pos = layout({ nodes, edges, focusNodeId: "a1" });
    expect(pos.a1).toEqual({ x: 0, y: 0 });
    // former parent `a` becomes outward neighbor — not at x=0 tower
    expect(pos.a).toBeTruthy();
    expect(Math.abs(pos.a!.x)).toBeGreaterThan(50);
    // siblings of the path should also be placed off-center
    expect(pos.root).toBeTruthy();
    expect(pos.b).toBeTruthy();
    expect(Math.abs(pos.b!.x) + Math.abs(pos.b!.y)).toBeGreaterThan(50);
  });

  it("does not overlap sibling boxes after separation", () => {
    const kids = Array.from({ length: 10 }, (_, i) => node(`k${i}`, `很长的标题节点${i}`));
    const nodes = [node("root", "中心"), ...kids];
    const edges = kids.map((k, i) => edge("root", k.id, i));
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    const box = { w: 200, h: 70 };
    const pad = 12;
    for (let i = 0; i < kids.length; i++) {
      for (let j = i + 1; j < kids.length; j++) {
        const a = pos[kids[i]!.id]!;
        const b = pos[kids[j]!.id]!;
        const ox = box.w + pad - Math.abs(b.x - a.x);
        const oy = box.h + pad - Math.abs(b.y - a.y);
        expect(ox <= 0 || oy <= 0).toBe(true);
      }
    }
  });

  it("hides primary descendants of collapsed nodes and re-packs siblings", () => {
    const branch = node("core", "核心矛盾", -1);
    branch.collapsed = true;
    const nodes = [
      node("root", "雷雨"),
      branch,
      node("c1", "周萍↔繁漪"),
      node("c2", "矿工劳资矛盾"),
      node("era", "时代背景", 1),
      node("e1", "半封建半殖民地"),
    ];
    const edges = [
      edge("root", "core", 0),
      edge("core", "c1", 0),
      edge("core", "c2", 1),
      edge("root", "era", 1),
      edge("era", "e1", 0),
    ];
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    expect(pos.core).toBeTruthy();
    expect(pos.c1).toBeUndefined();
    expect(pos.c2).toBeUndefined();
    expect(pos.era).toBeTruthy();
    expect(pos.e1).toBeTruthy();
  });

  it("hides hierarchy subtree even without isPrimaryParent", () => {
    const branch = node("theme", "余华主题", -1);
    branch.collapsed = true;
    const child = node("c", "苦难");
    const nodes = [node("root", "活着"), branch, child];
    const edges: MindEdge[] = [
      {
        ...edge("root", "theme", 0),
        isPrimaryParent: true,
      },
      {
        ...edge("theme", "c", 0),
        isPrimaryParent: false,
      },
    ];
    const pos = layout({ nodes, edges, focusNodeId: "root" });
    expect(pos.theme).toBeTruthy();
    expect(pos.c).toBeUndefined();
  });

  it("pin-only with prevPositions keeps unrelated nodes stable", () => {
    const nodes = [
      node("root", "R"),
      node("a", "A", -1),
      node("a1", "A1"),
      node("b", "B", 1),
    ];
    const edges = [
      edge("root", "a", 0),
      edge("a", "a1", 0),
      edge("root", "b", 1),
    ];
    const first = layout({ nodes, edges, focusNodeId: "root" });
    const fp = hierarchyFingerprint(edges);
    const pinned = nodes.map((n) =>
      n.id === "a"
        ? { ...n, pinned: true, pos: { x: -400, y: 120 } }
        : n,
    );
    const second = layout({
      nodes: pinned,
      edges,
      focusNodeId: "root",
      prevPositions: first,
      prevHierarchyFp: fp,
    });
    expect(second.a).toEqual({ x: -400, y: 120 });
    // sibling branch barely moves
    expect(Math.abs((second.b?.x ?? 0) - (first.b?.x ?? 0))).toBeLessThan(30);
    expect(Math.abs((second.b?.y ?? 0) - (first.b?.y ?? 0))).toBeLessThan(30);
    // single-node pin: child stays at previous layout pos (not dragged with parent)
    expect(second.a1!.x).toBeCloseTo(first.a1!.x, 0);
    expect(second.a1!.y).toBeCloseTo(first.a1!.y, 0);
  });

  it("card preset height grows with visible fields", () => {
    const dens = { gapX: 72, gapY: 36, nodeW: 200, nodeH: 56, pad: 20 };
    const bare = nodeLayoutSize(
      {
        stylePreset: "default",
        imageUrl: undefined,
        tags: [],
        links: [],
        note: undefined,
        description: undefined,
        dueAt: undefined,
        startAt: undefined,
        pinned: false,
      },
      dens,
      { asCard: true },
    );
    const rich = nodeLayoutSize(
      {
        stylePreset: "default",
        imageUrl: "https://example.com/a.jpg",
        tags: ["a"],
        links: [{ url: "https://ex.com" }],
        note: "hello",
        description: { role: "创始人", birth: "1879" },
        dueAt: 1,
        startAt: undefined,
        pinned: true,
      },
      dens,
      { asCard: true },
    );
    expect(bare.w).toBe(288);
    expect(rich.w).toBe(288);
    expect(rich.h).toBeGreaterThan(bare.h);
  });
});
