import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SqliteGraphStore } from "./index.js";

describe("SqliteGraphStore undo", () => {
  it("undoes latest create without throwing", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mm-undo-"));
    const store = new SqliteGraphStore(path.join(dir, "g.sqlite"));
    const g = store.createCanvas("undo-test");
    const canvasId = g.canvas.id;
    const applied = store.applyChangeSet(
      canvasId,
      [{ type: "create_node", text: "临时节点", id: "n_tmp" }],
      { origin: "user", summary: "create" },
    );
    expect(
      store.getSnapshot(canvasId).nodes.some((n) => n.id === "n_tmp" && !n.deletedAt),
    ).toBe(true);
    const undone = store.undoChangeSet(applied.changeSetId);
    expect(undone.rev).toBeGreaterThan(applied.rev);
    const tmp = store.getSnapshot(canvasId).nodes.find((n) => n.id === "n_tmp");
    // Soft-deleted or fully absent both mean undo removed it from the live graph.
    expect(!tmp || tmp.deletedAt).toBe(true);
    expect(store.latestUndoableChangeSetId(canvasId)).toBe(undone.changeSetId);
  });
});
