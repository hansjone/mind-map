#!/usr/bin/env node
/**
 * Fail the build if canvas UI CJK/i18n tables are corrupted or incomplete.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];

function mustUtf8(rel) {
  const path = join(root, rel);
  if (!existsSync(path)) {
    errors.push(`missing: ${rel}`);
    return null;
  }
  const buf = readFileSync(path);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch (e) {
    errors.push(`${rel}: invalid UTF-8 (${e.message})`);
    return null;
  }
}

const requiredZh = ["选择", "平移", "连线", "单点", "整枝", "气泡", "卡片", "撤销", "未命名"];
const requiredEn = [
  "Select",
  "Pan",
  "Link",
  "Node",
  "Branch",
  "Bubble",
  "Card",
  "Undo",
  "Untitled",
];

const labels = mustUtf8("src/canvas-ui-text.ts");
if (labels) {
  for (const s of requiredZh) {
    if (!labels.includes(s)) errors.push(`canvas-ui-text.ts missing zh: ${s}`);
  }
  for (const s of requiredEn) {
    if (!labels.includes(`"${s}"`) && !labels.includes(`'${s}'`)) {
      errors.push(`canvas-ui-text.ts missing en: ${s}`);
    }
  }
  if (!labels.includes("const zh:") && !labels.includes("const zh =")) {
    errors.push("canvas-ui-text.ts must define zh table");
  }
  if (!labels.includes("const en:") && !labels.includes("const en =")) {
    errors.push("canvas-ui-text.ts must define en table");
  }
  if (/^\s*\w+:\s*["']\?{2,}["']/m.test(labels)) {
    errors.push("canvas-ui-text.ts contains corrupted ?? string literals");
  }
}

const hook = mustUtf8("src/useCanvasUi.ts");
if (hook && !hook.includes("dsh-mind-map:locale")) {
  errors.push("useCanvasUi.ts must listen for dsh-mind-map:locale");
}

const canvas = mustUtf8("src/TopologyCanvas.tsx");
if (canvas) {
  const badUi = [
    ...canvas.matchAll(/\["select",\s*"(\?+)"/g),
    ...canvas.matchAll(/\["pan",\s*"(\?+)"/g),
    ...canvas.matchAll(/\["link",\s*"(\?+)"/g),
  ];
  if (badUi.length) {
    errors.push("TopologyCanvas.tsx has corrupted tool labels (??)");
  }
  if (!canvas.includes("useCanvasUi")) {
    errors.push("TopologyCanvas.tsx must use useCanvasUi()");
  }
  const titleQ = [...canvas.matchAll(/title=\{?["'](\?{2,})["']\}?/g)];
  if (titleQ.length >= 3) {
    errors.push(`TopologyCanvas.tsx CJK-corrupted (${titleQ.length} title="??")`);
  }
}

if (errors.length) {
  console.error("[check-canvas-cjk] FAILED:");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log("[check-canvas-cjk] OK (zh/en i18n)");
