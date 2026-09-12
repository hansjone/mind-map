/**
 * Canvas UI copy (zh). Keep ALL user-facing CJK here.
 * TopologyCanvas.tsx must not embed Chinese literals — they get corrupted
 * by Windows/PowerShell default encodings (question-mark placeholders / invalid 0xb7 bytes).
 */
export const canvasUi = {
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
} as const;

export type CanvasUiKey = keyof typeof canvasUi;
