#!/usr/bin/env node
/**
 * Fail the build if canvas UI CJK is corrupted or missing.
 * Root cause we guard against: Windows tools rewriting TopologyCanvas.tsx
 * with "?" for multibyte UTF-8, and Latin-1 middot 0xb7 breaking UTF-8.
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

const labels = mustUtf8("src/canvas-ui-text.ts");
if (labels) {
  const required = [
    "选择",
    "平移",
    "连线",
    "单点",
    "整枝",
    "气泡",
    "卡片",
    "撤销",
    "未命名",
  ];
  for (const s of required) {
    if (!labels.includes(s)) errors.push(`canvas-ui-text.ts missing: ${s}`);
  }
  if (/^\s*\w+:\s*["']\?{2,}["']/m.test(labels)) {
    errors.push("canvas-ui-text.ts contains corrupted ?? string literals");
  }
}

const canvas = mustUtf8("src/TopologyCanvas.tsx");
if (canvas) {
  // Toolbar / controls must use canvasUi — no inline ?? placeholders.
  const badUi = [
    ...canvas.matchAll(/\["select",\s*"(\?+)"/g),
    ...canvas.matchAll(/\["pan",\s*"(\?+)"/g),
    ...canvas.matchAll(/\["link",\s*"(\?+)"/g),
  ];
  if (badUi.length) {
    errors.push(
      "TopologyCanvas.tsx has corrupted tool labels (??). Use canvasUi from canvas-ui-text.ts",
    );
  }
  if (!canvas.includes("canvas-ui-text") && !canvas.includes("canvasUi")) {
    errors.push("TopologyCanvas.tsx must import canvasUi from canvas-ui-text.ts");
  }
  // Detect classic corruption: many consecutive ? inside quotes in JSX title/aria
  const titleQ = [...canvas.matchAll(/title=\{?["'](\?{2,})["']\}?/g)];
  if (titleQ.length >= 3) {
    errors.push(
      `TopologyCanvas.tsx looks CJK-corrupted (${titleQ.length} title="??" hits). Restore via canvasUi.`,
    );
  }
}

if (errors.length) {
  console.error("[check-canvas-cjk] FAILED:");
  for (const e of errors) console.error(" -", e);
  console.error(
    "Fix: edit src/canvas-ui-text.ts (UTF-8 only). Never pipe CJK through PowerShell Set-Content.",
  );
  process.exit(1);
}

console.log("[check-canvas-cjk] OK");
