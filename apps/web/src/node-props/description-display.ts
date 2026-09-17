/** Human-readable display helpers for MindNode.description (never show raw JSON on card face). */

export type DescChip = {
  key: string;
  label: string;
  value: string;
  /** Full value without truncation (for tooltips / expanded face). */
  fullValue: string;
};

const LABEL_MAP: Record<string, string> = {
  role: "角色",
  birth: "生卒",
  born: "出生",
  death: "卒年",
  dynasty: "朝代",
  era: "年代",
  nickname: "别称",
  alias: "别称",
  title: "头衔",
  name: "名称",
  function: "职能",
  summary: "概要",
  type: "类型",
  category: "分类",
  status: "状态",
  location: "地点",
  place: "地点",
  org: "组织",
  organization: "组织",
  party: "党派",
  nation: "国家",
  year: "年份",
  date: "日期",
  period: "时期",
  event: "事件",
  cause: "原因",
  effect: "影响",
  result: "结果",
  note: "备注",
  sla: "SLA",
};

const MAX_CHIPS = 6;
const MAX_VALUE_LEN = 36;

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatValueRaw(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t || null;
  }
  if (typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  if (Array.isArray(v)) {
    const parts = v
      .map((x) =>
        typeof x === "string" || typeof x === "number" ? String(x) : null,
      )
      .filter(Boolean) as string[];
    if (!parts.length) return null;
    return parts.join("、");
  }
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return null;
    }
  }
  return null;
}

function labelForKey(key: string): string {
  const lower = key.toLowerCase();
  return LABEL_MAP[key] || LABEL_MAP[lower] || key;
}

/** Reverse map: Chinese label → canonical key (first match wins). */
const LABEL_TO_KEY: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const [k, label] of Object.entries(LABEL_MAP)) {
    if (!out[label]) out[label] = k;
  }
  return out;
})();

export function canonicalDescriptionKey(input: string): string {
  const t = input.trim();
  if (!t) return t;
  return LABEL_TO_KEY[t] || t;
}

export function displayDescriptionKey(key: string): string {
  return labelForKey(key);
}

export type DescriptionChipsOpts = {
  max?: number;
  /** When true, `value` is not truncated (same as fullValue). */
  full?: boolean;
};

/** Flatten description object into labeled chips for card / editor face. */
export function descriptionChips(
  description: Record<string, unknown> | null | undefined,
  maxOrOpts: number | DescriptionChipsOpts = MAX_CHIPS,
): DescChip[] {
  const opts: DescriptionChipsOpts =
    typeof maxOrOpts === "number" ? { max: maxOrOpts } : maxOrOpts;
  const max = opts.max ?? (opts.full ? 64 : MAX_CHIPS);
  const full = Boolean(opts.full);
  if (!description || typeof description !== "object") return [];
  const out: DescChip[] = [];
  for (const [key, raw] of Object.entries(description)) {
    const fullValue = formatValueRaw(raw);
    if (!fullValue) continue;
    const value = full ? fullValue : truncate(fullValue, MAX_VALUE_LEN);
    out.push({ key, label: labelForKey(key), value, fullValue });
    if (out.length >= max) break;
  }
  return out;
}

/** One-line preview for registry / tooltips (not JSON). */
export function descriptionPreviewLine(
  description: Record<string, unknown> | null | undefined,
): string | null {
  const chips = descriptionChips(description, 3);
  if (!chips.length) return null;
  return chips.map((c) => `${c.label} ${c.value}`).join(" · ");
}
