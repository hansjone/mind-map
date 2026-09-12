/**
 * Canvas UI copy (zh / en). Keep ALL user-facing strings here.
 * TopologyCanvas must not embed literals — Windows tools corrupt CJK in large files.
 */

export type CanvasLocale = "zh" | "en";

export type CanvasUi = {
  unnamed: string;
  newNode: string;
  leftChild: string;
  rightChild: string;
  sibling: string;
  relationLabel: string;
  toolbarAria: string;
  controlsAria: string;
  backRosterTitle: string;
  backRoster: string;
  toolSelect: string;
  toolPan: string;
  toolLink: string;
  dragNode: string;
  dragBranch: string;
  dragNodeTitle: string;
  dragBranchTitle: string;
  bubble: string;
  card: string;
  bubbleTitle: string;
  cardTitle: string;
  unpin: string;
  unpinTitle: string;
  undo: string;
  fullscreen: string;
  exitFullscreen: string;
  zoomIn: string;
  zoomInTitle: string;
  zoomOut: string;
  zoomOutTitle: string;
  fit: string;
  fitTitle: string;
  lock: string;
  unlock: string;
  lockTitle: string;
  unlockTitle: string;
  addLeftChildTitle: string;
  addRightChildTitle: string;
  hintLocked: string;
  hintNodeDrag: string;
  hintBranchDrag: string;
};

const zh: CanvasUi = {
  unnamed: "未命名",
  newNode: "新节点",
  leftChild: "左侧子主题",
  rightChild: "右侧子主题",
  sibling: "兄弟节点",
  relationLabel: "关联",
  toolbarAria: "画布工具",
  controlsAria: "视图控制",
  backRosterTitle: "返回画布列表",
  backRoster: "返回",
  toolSelect: "选择",
  toolPan: "平移",
  toolLink: "连线",
  dragNode: "单点",
  dragBranch: "整枝",
  dragNodeTitle: "单点拖拽：只移动当前节点 (N)；按住 Shift 也可临时单点",
  dragBranchTitle: "整枝拖拽：节点与子孙一起移动 (B)",
  bubble: "气泡",
  card: "卡片",
  bubbleTitle: "气泡视图：精简标题",
  cardTitle: "卡片视图：展开属性面板",
  unpin: "解钉",
  unpinTitle: "取消钉住：让选中节点重新参与自动布局",
  undo: "撤销",
  fullscreen: "全屏",
  exitFullscreen: "退出全屏",
  zoomIn: "放大",
  zoomInTitle: "放大 (+)",
  zoomOut: "缩小",
  zoomOutTitle: "缩小 (-)",
  fit: "适应画布",
  fitTitle: "适应画布 (F)",
  lock: "锁定",
  unlock: "解锁",
  lockTitle: "锁定画布 (L)",
  unlockTitle: "解锁画布 (L)",
  addLeftChildTitle: "添加左侧子主题",
  addRightChildTitle: "添加右侧子主题",
  hintLocked: "已锁定 · 仅浏览/缩放/平移",
  hintNodeDrag: "单点拖 · 只移动当前节点 · Shift 临时单点 · Esc 取消",
  hintBranchDrag: "整枝拖 · 空白钉住 · 落到节点换父 · N 单点 · Esc 取消",
};

const en: CanvasUi = {
  unnamed: "Untitled",
  newNode: "New node",
  leftChild: "Left child",
  rightChild: "Right child",
  sibling: "Sibling",
  relationLabel: "Link",
  toolbarAria: "Canvas tools",
  controlsAria: "View controls",
  backRosterTitle: "Back to canvas list",
  backRoster: "Back",
  toolSelect: "Select",
  toolPan: "Pan",
  toolLink: "Link",
  dragNode: "Node",
  dragBranch: "Branch",
  dragNodeTitle: "Move node only (N); hold Shift for temporary node-drag",
  dragBranchTitle: "Move node with descendants (B)",
  bubble: "Bubble",
  card: "Card",
  bubbleTitle: "Bubble view: title only",
  cardTitle: "Card view: property sheet",
  unpin: "Unpin",
  unpinTitle: "Unpin selected node for auto layout",
  undo: "Undo",
  fullscreen: "Fullscreen",
  exitFullscreen: "Exit fullscreen",
  zoomIn: "Zoom in",
  zoomInTitle: "Zoom in (+)",
  zoomOut: "Zoom out",
  zoomOutTitle: "Zoom out (-)",
  fit: "Fit",
  fitTitle: "Fit view (F)",
  lock: "Lock",
  unlock: "Unlock",
  lockTitle: "Lock canvas (L)",
  unlockTitle: "Unlock canvas (L)",
  addLeftChildTitle: "Add left child",
  addRightChildTitle: "Add right child",
  hintLocked: "Locked · browse / zoom / pan only",
  hintNodeDrag: "Node drag · Shift temp node · Esc cancel",
  hintBranchDrag: "Branch drag · pin on blank · drop to reparent · N node · Esc cancel",
};

export const canvasUiTables = { zh, en } as const;

export function normalizeCanvasLocale(raw: unknown): CanvasLocale {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (s.startsWith("zh")) return "zh";
  if (!s) {
    // Standalone / no hint: prefer browser language
    if (typeof navigator !== "undefined") {
      const nav = String(navigator.language || "").toLowerCase();
      if (nav.startsWith("zh")) return "zh";
    }
    return "en";
  }
  return "en";
}

export function getCanvasUi(locale: CanvasLocale | string): CanvasUi {
  const loc = normalizeCanvasLocale(locale);
  return canvasUiTables[loc];
}

/** @deprecated Prefer getCanvasUi(locale) — kept so old imports fail loudly in check. */
export const canvasUi = zh;
