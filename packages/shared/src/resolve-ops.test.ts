import { describe, expect, it } from "vitest";
import { resolveWireOps, type MindNode } from "./index.js";

function node(partial: Partial<MindNode> & { id: string; text: string }): MindNode {
  const t = Date.now();
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

describe("resolveWireOps", () => {
  it("resolves @alias within the same batch", () => {
    const r = resolveWireOps(
      [
        { type: "create_node", text: "AIOps", alias: "aiops" },
        { type: "create_node", text: "重启", parentId: "@aiops" },
        {
          type: "link",
          from: "@aiops",
          to: "重启",
          kind: "relation",
          label: "诊断→重启",
        },
      ],
      [],
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [a, b, link] = r.ops as Array<Record<string, unknown>>;
    expect(a?.id).toBeTruthy();
    expect(b?.parentId).toBe(a?.id);
    expect(link?.from).toBe(a?.id);
    expect(link?.to).toBe(b?.id);
    expect(r.nodeIdMap["@aiops"]).toBe(a?.id);
    expect(r.nodeIdMap.AIOps).toBe(a?.id);
  });

  it("resolves fromText/toText against existing nodes", () => {
    const live = [
      node({ id: "n1", text: "诊断" }),
      node({ id: "n2", text: "重启" }),
    ];
    const r = resolveWireOps(
      [
        {
          type: "link",
          fromText: "诊断",
          toText: "重启",
          kind: "relation",
        },
      ],
      live,
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const link = r.ops[0] as Record<string, unknown>;
    expect(link.from).toBe("n1");
    expect(link.to).toBe("n2");
    expect(link.fromText).toBeUndefined();
  });

  it("returns ambiguous when titles collide", () => {
    const live = [
      node({ id: "n1", text: "同名" }),
      node({ id: "n2", text: "同名" }),
    ];
    const r = resolveWireOps(
      [{ type: "link", fromText: "同名", toText: "同名", kind: "relation" }],
      live,
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error).toBe("ambiguous");
  });

  it("resolves batch_create with forward @alias parents and relations", () => {
    const r = resolveWireOps(
      [
        {
          type: "batch_create",
          nodes: [
            { text: "数通", alias: "datacom" },
            {
              text: "AIOps",
              alias: "aiops",
              parentId: "@datacom",
              relations: [{ to: "@restart", kind: "relation", label: "触发" }],
            },
            { text: "重启", alias: "restart", parentId: "@datacom" },
          ],
        },
      ],
      [],
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const batch = r.ops[0] as {
      nodes: Array<{
        id: string;
        parentId?: string;
        relations?: Array<{ to: string }>;
      }>;
    };
    const [a, b, c] = batch.nodes;
    expect(b?.parentId).toBe(a?.id);
    expect(c?.parentId).toBe(a?.id);
    expect(b?.relations?.[0]?.to).toBe(c?.id);
    expect(r.nodeIdMap["@aiops"]).toBe(b?.id);
  });

  it("resolves restore_node against soft-deleted id/alias/title", () => {
    const live = [
      node({ id: "n_live", text: "贾母", alias: "jiamu" }),
      node({
        id: "n_gone",
        text: "林黛玉",
        alias: "daiyu",
        deletedAt: Date.now(),
      }),
    ];
    const byId = resolveWireOps(
      [{ type: "restore_node", nodeId: "n_gone" }],
      live,
    );
    expect(byId.ok).toBe(true);
    if (byId.ok) {
      expect((byId.ops[0] as { nodeId: string }).nodeId).toBe("n_gone");
    }

    const byAlias = resolveWireOps(
      [{ type: "restore_node", nodeId: "@daiyu" }],
      live,
    );
    expect(byAlias.ok).toBe(true);
    if (byAlias.ok) {
      expect((byAlias.ops[0] as { nodeId: string }).nodeId).toBe("n_gone");
    }

    const byText = resolveWireOps(
      [{ type: "restore_node", nodeText: "林黛玉" }],
      live,
    );
    expect(byText.ok).toBe(true);
    if (byText.ok) {
      expect((byText.ops[0] as { nodeId: string }).nodeId).toBe("n_gone");
    }

    const liveReject = resolveWireOps(
      [{ type: "restore_node", nodeId: "n_live" }],
      live,
    );
    expect(liveReject.ok).toBe(false);
  });

  it("resolves unlink from+to to edgeId", () => {
    const live = [
      node({ id: "n1", text: "黛玉", alias: "daiyu" }),
      node({ id: "n2", text: "宝玉", alias: "baoyu" }),
    ];
    const edges = [
      {
        id: "e1",
        canvasId: "c1",
        from: "n1",
        to: "n2",
        kind: "relation" as const,
        isPrimaryParent: false,
        order: 0,
        label: "知己",
        tags: [],
        version: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const r = resolveWireOps(
      [{ type: "unlink", from: "@daiyu", to: "@baoyu", kind: "relation" }],
      live,
      { edges },
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const op = r.ops[0] as Record<string, unknown>;
    expect(op.edgeId).toBe("e1");
    expect(op.from).toBeUndefined();
    expect(op.to).toBeUndefined();
  });
});
