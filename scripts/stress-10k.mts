/**
 * Stress: create a canvas and grow to N nodes via API.
 * Usage: node --import tsx scripts/stress-10k.mts [count=10000]
 */
const BASE = process.env.MINDMAP_URL ?? "http://127.0.0.1:17890";
const COUNT = Number(process.argv[2] ?? 10_000);

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function main() {
  const t0 = performance.now();
  const created = await json<{
    canvas: { id: string; focusNodeId: string };
  }>(`${BASE}/api/canvases`, {
    method: "POST",
    body: JSON.stringify({ title: `stress-${COUNT}` }),
  });
  const canvasId = created.canvas.id;
  let parent = created.canvas.focusNodeId;
  const batch = 50;
  let made = 1;
  console.log(`canvas ${canvasId}, target ${COUNT}`);

  while (made < COUNT) {
    const n = Math.min(batch, COUNT - made);
    const ops = Array.from({ length: n }, (_, i) => ({
      type: "create_node" as const,
      text: `n${made + i}`,
      parentId: parent,
      sidePref: (made + i) % 2 === 0 ? (-1 as const) : (1 as const),
    }));
    const tBatch = performance.now();
    const result = await json<{
      snapshot: { nodes: { id: string }[]; canvas: { focusNodeId: string } };
      positions: Record<string, unknown>;
    }>(`${BASE}/api/canvases/${canvasId}/ops`, {
      method: "POST",
      body: JSON.stringify({ ops, origin: "user", summary: `batch ${made}` }),
    });
    made += n;
    // widen tree: periodically use a recent child as parent
    const nodes = result.snapshot.nodes;
    parent = nodes[Math.floor(nodes.length * 0.5)]?.id ?? parent;
    const dt = performance.now() - tBatch;
    if (made % 500 === 0 || made >= COUNT) {
      console.log(
        `nodes=${made} batch=${dt.toFixed(0)}ms layoutKeys=${Object.keys(result.positions).length}`,
      );
    }
  }

  const tLoad0 = performance.now();
  const loaded = await json<{ nodes: unknown[]; positions: Record<string, unknown> }>(
    `${BASE}/api/canvases/${canvasId}`,
  );
  const tLoad = performance.now() - tLoad0;
  const total = performance.now() - t0;
  console.log(
    JSON.stringify(
      {
        ok: true,
        canvasId,
        nodes: loaded.nodes.length,
        positions: Object.keys(loaded.positions).length,
        loadMs: Math.round(tLoad),
        totalMs: Math.round(total),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
