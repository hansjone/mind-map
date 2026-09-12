import fs from "node:fs";
import path from "node:path";

const srcPath =
  "C:/Users/zhout/.dsh/profiles/web/node_modules/dsh-dream-skin/lib/client.js";
const src = fs.readFileSync(srcPath, "utf8");
const start = src.indexOf("const SKINS = [");
const end = src.indexOf("];", start);
if (start < 0 || end < 0) throw new Error("SKINS not found");
const block = src.slice(start, end + 2);
const skins = new Function(`${block}; return SKINS;`)();

const names = {
  abyss: ["Abyss", "深渊"],
  aurora: ["Aurora", "极光"],
  nebula: ["Nebula", "星云"],
  ember: ["Ember", "余烬"],
  midnight: ["Midnight", "午夜"],
  ivory: ["Ivory", "象牙"],
  mist: ["Mist", "晨雾"],
  rose: ["Rose", "玫瑰"],
};

const out = skins.map((s) => ({
  id: s.id,
  colorScheme: s.colorScheme,
  name: names[s.id]?.[0] ?? s.id,
  nameZh: names[s.id]?.[1] ?? s.id,
  tokens: s.tokens,
}));

const dir = path.resolve("packages/dream-skin/src");
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, "skins.json"), JSON.stringify(out, null, 2));
console.log(
  "wrote",
  out.length,
  "skins:",
  out.map((s) => s.id).join(","),
);
