import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canvasFont,
  clearShadow,
  fillAccentWash,
  paintAccentRail,
  paintBadgeChip,
  paintNodeShadow,
} from "./canvas-chrome";
import {
  collectSubtreeIds,
  ghostPos,
  isDescendantOrSelf,
  type DragGhost,
} from "./drag-subtree";
import { HoverCard } from "./HoverCard";
import { PropTooltip } from "./PropTooltip";
import {
  exportFitPng,
  exportSvgFromApi,
} from "./export-canvas";
import { getCachedImage } from "./image-cache";
import {
  drawNodeShape,
  nodeBadges,
  nodeBoxSize,
  ROUTER_ICON_URL,
  TOPO_ICON_PX,
  wrapTextLines,
} from "./node-geometry";
import {
  cardFieldHits,
  drawPropSheet,
  NodePropOverlay,
  type CardChipHit,
} from "./node-props";
import { branchPalette, readSystemTheme } from "./system-theme";
import { useAppStore } from "./store";
import { useCanvasUi } from "./useCanvasUi";

const NODE_W = 200;

type DragMode = "none" | "pan" | "node" | "link";
type ToolMode = "select" | "pan" | "link";
/** branch = drag whole subtree; node = drag only the grabbed node */
type DragScope = "branch" | "node";

const MINI_W = 168;
const MINI_H = 118;

export function TopologyCanvas() {
  const { U } = useCanvasUi();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const nodes = useAppStore((s) => s.nodes);
  const edges = useAppStore((s) => s.edges);
  const positions = useAppStore((s) => s.positions);
  const selectedIds = useAppStore((s) => s.selectedIds);
  const highlightIds = useAppStore((s) => s.highlightIds);
  const highlightEdgeIds = useAppStore((s) => s.highlightEdgeIds);
  const highlightStyle = useAppStore((s) => s.highlightStyle);
  const canvas = useAppStore((s) => s.canvas);
  const canvasId = useAppStore((s) => s.canvasId);
  const applyOps = useAppStore((s) => s.applyOps);
  const setPrefs = useAppStore((s) => s.setPrefs);
  const patchLocal = useAppStore((s) => s.patchLocal);
  const setSelection = useAppStore((s) => s.setSelection);
  const undo = useAppStore((s) => s.undo);
  const lastChangeSetId = useAppStore((s) => s.lastChangeSetId);
  const embed =
    typeof window !== "undefined" &&
    (() => {
      try {
        const q = new URLSearchParams(window.location.search);
        return q.get("embed") === "1" || q.get("embed") === "true";
      } catch {
        return false;
      }
    })();

  const requestBackToRoster = useCallback(() => {
    try {
      window.parent?.postMessage({ type: "dsh-mind-map:back" }, "*");
    } catch {
      /* ignore */
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = hostRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      await el.requestFullscreen();
    } catch {
      // iframe: notify parent Tab fullscreen when needed
      try {
        window.parent?.postMessage({ type: "dsh-mind-map:fullscreen" }, "*");
      } catch {
        /* ignore */
      }
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const fitViewport = useAppStore((s) => s.fitViewport);
  const consumeFitViewport = useAppStore((s) => s.consumeFitViewport);

  useEffect(() => {
    if (!fitViewport) return;
    const vp = consumeFitViewport();
    if (vp) setViewport(vp);
  }, [fitViewport, consumeFitViewport]);

  const [toolMode, setToolMode] = useState<ToolMode>("select");
  const [dragScope, setDragScope] = useState<DragScope>("node");
  const [locked, setLocked] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [themeTick, setThemeTick] = useState(0);
  const [imageTick, setImageTick] = useState(0);
  const [editing, setEditing] = useState<{
    id: string;
    x: number;
    y: number;
    text: string;
  } | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  /** Card view: click-expanded node shows full field text on the face. */
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  /** Card view: double-click opens property editor overlay. */
  const [propEditId, setPropEditId] = useState<string | null>(null);
  const [propTip, setPropTip] = useState<{
    label: string;
    value: string;
    x: number;
    y: number;
    pinned: boolean;
    nodeId: string;
    fieldKey: string;
  } | null>(null);
  const propTipRef = useRef(propTip);
  propTipRef.current = propTip;
  const [linkPreview, setLinkPreview] = useState<{
    fromId: string;
    x: number;
    y: number;
  } | null>(null);
  const [ghost, setGhost] = useState<DragGhost | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dropForbidden, setDropForbidden] = useState(false);
  const [hostSize, setHostSize] = useState({ w: 1, h: 1 });
  const [dragCursor, setDragCursor] = useState<string | null>(null);

  const dragRef = useRef<{
    mode: DragMode;
    lastX: number;
    lastY: number;
    space: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    moved: boolean;
    alt: boolean;
    forcePin: boolean;
    /** World coords at pointer-down (for grab-point preserving delta). */
    startWorldX: number;
    startWorldY: number;
    subtreeIds: string[];
  }>({
    mode: "none",
    lastX: 0,
    lastY: 0,
    space: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    moved: false,
    alt: false,
    forcePin: false,
    startWorldX: 0,
    startWorldY: 0,
    subtreeIds: [],
  });
  const ghostRef = useRef<DragGhost | null>(null);
  ghostRef.current = ghost;
  const miniDragRef = useRef(false);

  const theme = useMemo(() => readSystemTheme(), [themeTick]);
  const palette = useMemo(() => branchPalette(theme.brand, 8), [theme.brand]);

  useEffect(() => {
    const onScheme = () => setThemeTick((n) => n + 1);
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener?.("change", onScheme);
    return () => mq.removeEventListener?.("change", onScheme);
  }, []);
  const dens = canvas?.prefs.density === "compact";
  const viewMode = canvas?.prefs.nodeViewMode ?? "card";
  const cardView = viewMode === "card";
  const topoView = viewMode === "topology";
  const boxOf = useCallback(
    (n: (typeof nodes)[number]) =>
      nodeBoxSize(n, dens, {
        asCard: cardView,
        asTopology: topoView,
        expanded: cardView && expandedCardId === n.id,
      }),
    [dens, cardView, topoView, expandedCardId],
  );
  const nw = dens ? 160 : NODE_W;

  const withRouterIcon = useCallback(
    <T extends { type: string; icon?: string | null }>(op: T): T => {
      if (!topoView) return op;
      if (op.type !== "create_node") return op;
      if (op.icon != null) return op;
      return { ...op, icon: "router" };
    },
    [topoView],
  );

  const branchColoring = canvas?.prefs.branchColoring !== false;
  const branchColor = useMemo(() => {
    const map = new Map<string, string>();
    if (!branchColoring) return map;
    const roots = nodes.filter((n) => {
      if (n.deletedAt) return false;
      return !edges.some(
        (e) => e.kind === "hierarchy" && e.isPrimaryParent && e.to === n.id,
      );
    });
    let i = 0;
    for (const r of roots) {
      map.set(r.id, palette[i % palette.length]!);
      i++;
    }
    const walk = (id: string, color: string) => {
      for (const e of edges) {
        if (e.kind === "hierarchy" && e.isPrimaryParent && e.from === id) {
          map.set(e.to, color);
          walk(e.to, color);
        }
      }
    };
    for (const [id, color] of map) walk(id, color);
    return map;
  }, [nodes, edges, palette, branchColoring]);

  const toWorld = useCallback(
    (clientX: number, clientY: number) => {
      const host = hostRef.current!;
      const rect = host.getBoundingClientRect();
      return {
        x: (clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom,
        y: (clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom,
      };
    },
    [viewport],
  );

  const posOf = useCallback(
    (id: string) => ghostPos(id, positions[id], ghost),
    [positions, ghost],
  );

  const hitTest = useCallback(
    (wx: number, wy: number, exclude?: Set<string>) => {
      for (let i = nodes.length - 1; i >= 0; i--) {
        const n = nodes[i]!;
        if (n.deletedAt) continue;
        if (exclude?.has(n.id)) continue;
        const p = posOf(n.id);
        if (!p) continue;
        const { w, h } = boxOf(n);
        if (wx >= p.x - w / 2 && wx <= p.x + w / 2 && wy >= p.y - h / 2 && wy <= p.y + h / 2) {
          return n.id;
        }
      }
      return null;
    },
    [nodes, posOf, boxOf],
  );

  /** Resolve card property under pointer (hover tip / pin for讲解). */
  const hitCardField = useCallback(
    (
      clientX: number,
      clientY: number,
      world: { x: number; y: number },
    ): {
      nodeId: string;
      field: CardChipHit;
      tipX: number;
      tipY: number;
    } | null => {
      if (!cardView || viewport.zoom < 0.35) return null;
      const hit = hitTest(world.x, world.y);
      if (!hit || propEditId === hit) return null;
      const n = nodes.find((x) => x.id === hit);
      const p = n ? posOf(hit) : null;
      if (!n || !p) return null;
      const { w: bw, h: bh } = boxOf(n);
      const localX = world.x - (p.x - bw / 2);
      const localY = world.y - (p.y - bh / 2);
      const fields = cardFieldHits(n, dens, expandedCardId === n.id);
      const field = fields.find(
        (f) =>
          localX >= f.x &&
          localX <= f.x + f.w &&
          localY >= f.y &&
          localY <= f.y + f.h,
      );
      if (!field) return null;
      const host = hostRef.current?.getBoundingClientRect();
      const tipX = host
        ? clientX - host.left + 14
        : hostSize.w / 2 + viewport.x + world.x * viewport.zoom + 14;
      const tipY = host
        ? clientY - host.top + 14
        : hostSize.h / 2 + viewport.y + world.y * viewport.zoom + 14;
      return { nodeId: hit, field, tipX, tipY };
    },
    [
      cardView,
      viewport,
      hitTest,
      propEditId,
      nodes,
      posOf,
      boxOf,
      dens,
      expandedCardId,
      hostSize,
    ],
  );

  const worldBounds = useMemo(() => {
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    let any = false;
    for (const n of nodes) {
      if (n.deletedAt) continue;
      const p = positions[n.id];
      if (!p) continue;
      if (!any) {
        minX = p.x;
        maxX = p.x;
        minY = p.y;
        maxY = p.y;
        any = true;
      } else {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      }
    }
    if (!any) return { minX: -200, maxX: 200, minY: -120, maxY: 120 };
    const pad = 80;
    return {
      minX: minX - pad,
      maxX: maxX + pad,
      minY: minY - pad,
      maxY: maxY + pad,
    };
  }, [nodes, positions]);

  const setZoomAroundCenter = useCallback((nextZoom: number) => {
    setViewport((v) => ({
      ...v,
      zoom: Math.min(4, Math.max(0.02, nextZoom)),
    }));
  }, []);

  const fitView = useCallback(() => {
    const { minX, maxX, minY, maxY } = worldBounds;
    const bw = Math.max(40, maxX - minX);
    const bh = Math.max(40, maxY - minY);
    const w = hostSize.w || 1;
    const h = hostSize.h || 1;
    const zoom = Math.min(
      2.5,
      Math.max(0.12, Math.min((w * 0.86) / bw, (h * 0.86) / bh)),
    );
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setViewport({ x: -cx * zoom, y: -cy * zoom, zoom });
  }, [worldBounds, hostSize]);

  const panFromMini = useCallback(
    (clientX: number, clientY: number) => {
      const el = miniRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const { minX, maxX, minY, maxY } = worldBounds;
      const bw = Math.max(1, maxX - minX);
      const bh = Math.max(1, maxY - minY);
      const wx = minX + ((clientX - rect.left) / rect.width) * bw;
      const wy = minY + ((clientY - rect.top) / rect.height) * bh;
      setViewport((v) => ({
        ...v,
        x: -wx * v.zoom,
        y: -wy * v.zoom,
      }));
    },
    [worldBounds],
  );

  const draw = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = el.clientWidth;
    const h = el.clientHeight;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = theme.bgBase;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + viewport.x, h / 2 + viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1 / viewport.zoom;
    const grid = 48;
    const startX =
      Math.floor((-w / 2 - viewport.x) / viewport.zoom / grid) * grid - grid * 2;
    const endX =
      Math.ceil((w / 2 - viewport.x) / viewport.zoom / grid) * grid + grid * 2;
    const startY =
      Math.floor((-h / 2 - viewport.y) / viewport.zoom / grid) * grid - grid * 2;
    const endY =
      Math.ceil((h / 2 - viewport.y) / viewport.zoom / grid) * grid + grid * 2;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    for (let x = startX; x <= endX; x += grid) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += grid) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    for (const e of edges) {
      if (canvas?.prefs.showRelationEdges === false && e.kind === "relation") continue;
      const a = posOf(e.from);
      const b = posOf(e.to);
      if (!a || !b) continue;
      const fromN = nodes.find((n) => n.id === e.from);
      const toN = nodes.find((n) => n.id === e.to);
      const aw = fromN ? boxOf(fromN).w : nw;
      const bw = toN ? boxOf(toN).w : nw;
      const ah = fromN ? boxOf(fromN).h : 40;
      const bh = toN ? boxOf(toN).h : 40;
      ctx.beginPath();
      let x1: number;
      let y1: number;
      let x2: number;
      let y2: number;
      let cx: number;
      if (topoView) {
        // Straight links into router icon centers (edges draw under nodes)
        const icon = dens ? TOPO_ICON_PX.compact : TOPO_ICON_PX.comfortable;
        const pad = dens ? 4 : 6;
        x1 = a.x;
        y1 = a.y - ah / 2 + pad + icon / 2;
        x2 = b.x;
        y2 = b.y - bh / 2 + pad + icon / 2;
        cx = (x1 + x2) / 2;
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
      } else {
        x1 = a.x + (b.x >= a.x ? aw / 2 : -aw / 2);
        y1 = a.y;
        x2 = b.x + (b.x >= a.x ? -bw / 2 : bw / 2);
        y2 = b.y;
        cx = (x1 + x2) / 2;
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cx, y1, cx, y2, x2, y2);
      }
      const weight = Math.max(1, Math.min(5, e.weight ?? 1));
      const style = topoView
        ? (e.lineStyle ?? "solid")
        : (e.lineStyle ?? (e.kind === "relation" ? "dashed" : "solid"));
      if (style === "dotted") {
        ctx.setLineDash([2 / viewport.zoom, 4 / viewport.zoom]);
      } else if (style === "dashed") {
        ctx.setLineDash([6 / viewport.zoom, 4 / viewport.zoom]);
      } else {
        ctx.setLineDash([]);
      }
      const isEdgeFlash = highlightEdgeIds.includes(e.id);
      const flashEdgeColor = highlightStyle?.edgeColor ?? theme.brand;
      const flashEdgeWidth = highlightStyle?.edgeWidth ?? 3.6;
      // Topology: uniform link blue (ignore branch palette)
      const topoLinkColor = "#2563eb";
      const edgeColor = isEdgeFlash
        ? flashEdgeColor
        : topoView
          ? topoLinkColor
          : e.kind === "relation"
            ? theme.labelSecondary
            : branchColor.get(e.to) ?? theme.brand;
      ctx.strokeStyle = edgeColor;
      ctx.lineWidth =
        (isEdgeFlash
          ? flashEdgeWidth
          : topoView
            ? 1.8 + (weight - 1) * 0.5
            : 1.2 + (weight - 1) * 0.7) / viewport.zoom;
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrowheads: direction forward|both|none (relation default forward)
      const dir =
        e.direction ??
        (topoView ? "none" : e.kind === "relation" ? "forward" : "none");
      if (dir === "forward" || dir === "both") {
        const arrowAng = topoView
          ? Math.atan2(y2 - y1, x2 - x1)
          : Math.atan2(0, x2 - cx || (x2 >= a.x ? 1 : -1));
        const size = 8 / viewport.zoom;
        ctx.beginPath();
        ctx.fillStyle = edgeColor;
        ctx.moveTo(x2, y2);
        ctx.lineTo(
          x2 - size * Math.cos(arrowAng - 0.45),
          y2 - size * Math.sin(arrowAng - 0.45),
        );
        ctx.lineTo(
          x2 - size * Math.cos(arrowAng + 0.45),
          y2 - size * Math.sin(arrowAng + 0.45),
        );
        ctx.closePath();
        ctx.fill();
      }
      if (dir === "both") {
        const arrowAng = topoView
          ? Math.atan2(y1 - y2, x1 - x2)
          : Math.atan2(0, x1 - cx || (a.x >= b.x ? 1 : -1));
        const size = 8 / viewport.zoom;
        ctx.beginPath();
        ctx.fillStyle = edgeColor;
        ctx.moveTo(x1, y1);
        ctx.lineTo(
          x1 - size * Math.cos(arrowAng - 0.45),
          y1 - size * Math.sin(arrowAng - 0.45),
        );
        ctx.lineTo(
          x1 - size * Math.cos(arrowAng + 0.45),
          y1 - size * Math.sin(arrowAng + 0.45),
        );
        ctx.closePath();
        ctx.fill();
      }
      if (e.label && viewport.zoom >= 0.25) {
        ctx.fillStyle = theme.labelSecondary;
        ctx.font = `11px sans-serif`;
        ctx.fillText(e.label, cx, (y1 + y2) / 2 - 6);
      }
    }

    if (linkPreview) {
      const a = posOf(linkPreview.fromId);
      if (a) {
        const fromN = nodes.find((n) => n.id === linkPreview.fromId);
        const ah = fromN ? boxOf(fromN).h : 40;
        let sx = a.x;
        let sy = a.y;
        if (topoView) {
          const icon = dens ? TOPO_ICON_PX.compact : TOPO_ICON_PX.comfortable;
          const pad = dens ? 4 : 6;
          sy = a.y - ah / 2 + pad + icon / 2;
        }
        ctx.beginPath();
        ctx.setLineDash([4 / viewport.zoom, 4 / viewport.zoom]);
        ctx.strokeStyle = topoView ? "#2563eb" : theme.brand;
        ctx.moveTo(sx, sy);
        ctx.lineTo(linkPreview.x, linkPreview.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    const badgeMode = canvas?.prefs.nodeBadges ?? "icons";

    for (const n of nodes) {
      if (n.deletedAt) continue;
      const p = posOf(n.id);
      if (!p) continue;
      const inGhost = Boolean(ghost?.ids.includes(n.id));
      const { w: boxW, h: boxH } = boxOf(n);
      const x = p.x - boxW / 2;
      const y = p.y - boxH / 2;
      const fill = n.accentColor ?? branchColor.get(n.id) ?? theme.bubble;
      const isSel = selectedIds.includes(n.id);
      const isFlash = highlightIds.includes(n.id);
      const flashNodeColor = highlightStyle?.nodeColor ?? theme.brand;
      const isHover = hoverId === n.id;
      const isDrop = dropTargetId === n.id;
      const isForbidden = dropForbidden && isDrop;

      if (inGhost) ctx.globalAlpha = 0.7;

      if (topoView) {
        const icon = dens ? TOPO_ICON_PX.compact : TOPO_ICON_PX.comfortable;
        const pad = dens ? 4 : 6;
        const iconX = x + (boxW - icon) / 2;
        const iconY = y + pad;
        if (isFlash && highlightStyle?.nodeGlow !== false) {
          ctx.shadowColor = flashNodeColor;
          ctx.shadowBlur = 14 / viewport.zoom;
        } else if (isSel || isHover) {
          ctx.shadowColor = fill;
          ctx.shadowBlur = 10 / viewport.zoom;
        }
        const img = getCachedImage(ROUTER_ICON_URL, () =>
          setImageTick((t) => t + 1),
        );
        if (img && img.naturalWidth > 0) {
          ctx.drawImage(img, iconX, iconY, icon, icon);
        } else {
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect?.(iconX, iconY, icon, icon, 6);
          if (!ctx.roundRect) {
            ctx.rect(iconX, iconY, icon, icon);
          }
          ctx.fill();
        }
        clearShadow(ctx);
        // Soft accent tint plate behind icon when selected/hover
        if (isSel || isHover || isDrop || isFlash) {
          ctx.strokeStyle = isForbidden
            ? theme.warn
            : isDrop || isFlash
              ? theme.brand
              : fill;
          ctx.lineWidth = 1.6 / viewport.zoom;
          ctx.beginPath();
          const rr = 6;
          ctx.moveTo(iconX + rr, iconY);
          ctx.arcTo(iconX + icon, iconY, iconX + icon, iconY + icon, rr);
          ctx.arcTo(iconX + icon, iconY + icon, iconX, iconY + icon, rr);
          ctx.arcTo(iconX, iconY + icon, iconX, iconY, rr);
          ctx.arcTo(iconX, iconY, iconX + icon, iconY, rr);
          ctx.closePath();
          ctx.stroke();
        }
        ctx.fillStyle = theme.labelPrimary;
        ctx.font = canvasFont(dens ? 11 : 12, 600);
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const captionY = iconY + icon + 4;
        const lines = wrapTextLines(
          ctx,
          n.text || U.unnamed,
          boxW - 4,
          dens ? 1 : 2,
        );
        lines.forEach((line, i) => {
          ctx.fillText(line, x + boxW / 2, captionY + i * (dens ? 13 : 14));
        });
        ctx.textAlign = "left";
        ctx.globalAlpha = inGhost ? 0.7 : 1;
        continue;
      }

      if (isFlash && highlightStyle?.nodeGlow !== false) {
        ctx.shadowColor = flashNodeColor;
        ctx.shadowBlur = 14 / viewport.zoom;
      } else if (cardView) {
        // Solid body + deep drop shadow (skip floaty accent bloom)
        paintNodeShadow(ctx, viewport.zoom, {
          selected: isSel,
          weight: "heavy",
        });
      } else {
        paintNodeShadow(ctx, viewport.zoom, { selected: isSel });
      }
      ctx.fillStyle = cardView ? theme.glassFill : theme.bgLayer1;
      const drawPreset = cardView ? "card" : n.stylePreset;
      const cornerR = cardView
        ? dens
          ? 14
          : 16
        : n.stylePreset === "title"
          ? boxH / 2
          : 12;
      drawNodeShape(ctx, drawPreset, x, y, boxW, boxH, cornerR);
      ctx.fill();
      clearShadow(ctx);
      ctx.globalAlpha = inGhost ? 0.7 : 1;
      // Soft accent tint only — no header band / dividers
      fillAccentWash(
        ctx,
        fill,
        cardView ? 0.08 : n.stylePreset === "title" ? 0.22 : 0.14,
      );
      if (
        !cardView &&
        n.stylePreset !== "decision" &&
        n.stylePreset !== "title" &&
        n.stylePreset !== "note"
      ) {
        paintAccentRail(ctx, x, y, boxH, fill, 12);
      }
      if (!cardView && n.stylePreset === "note") {
        ctx.setLineDash([4 / viewport.zoom, 3 / viewport.zoom]);
      } else {
        ctx.setLineDash([]);
      }
      // Card: thin glass border; soft accent only on hover/select (not thick colored frame)
      if (cardView) {
        ctx.strokeStyle = isForbidden
          ? theme.warn
          : isDrop || isFlash
            ? theme.brand
            : isSel || isHover
              ? fill
              : theme.glassBorder;
        ctx.lineWidth =
          (isDrop || isFlash || isSel || isHover ? 1.8 : 1.25) / viewport.zoom;
      } else {
        ctx.strokeStyle = isForbidden
          ? theme.warn
          : isDrop
            ? theme.brand
            : n.stylePreset === "risk"
              ? theme.warn
              : isFlash
                ? flashNodeColor
                : isSel || isHover
                  ? theme.brand
                  : fill;
        ctx.lineWidth =
          (isDrop ||
          isFlash ||
          isSel ||
          n.stylePreset === "title" ||
          n.stylePreset === "decision"
            ? 2.4
            : 1.35) / viewport.zoom;
      }
      if (!cardView && n.stylePreset === "muted")
        ctx.globalAlpha = inGhost ? 0.4 : 0.55;
      clearShadow(ctx);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = inGhost ? 0.7 : 1;

      if (cardView) {
        const editingProps = propEditId === n.id;
        if (!editingProps) {
          drawPropSheet(
            ctx,
            n,
            x,
            y,
            theme,
            viewport.zoom,
            dens,
            fill,
            () => setImageTick((t) => t + 1),
            { expanded: expandedCardId === n.id },
          );
        } else {
          // Title-only placeholder under HTML overlay (same flat surface)
          ctx.beginPath();
          ctx.arc(x + 16, y + 20, 4, 0, Math.PI * 2);
          ctx.fillStyle = fill;
          ctx.fill();
          ctx.fillStyle = theme.labelPrimary;
          ctx.font = canvasFont(14, 600);
          ctx.textBaseline = "middle";
          const ph = wrapTextLines(ctx, n.text || U.unnamed, boxW - 44, 1);
          ctx.fillText(ph[0] ?? "?", x + 28, y + 20);
        }
      } else {
        const padX = 14;
        const contentLeft = padX + (n.stylePreset === "decision" || n.stylePreset === "title" || n.stylePreset === "note" ? 0 : 4);
        let contentTop = y + 12;

        if (n.imageUrl) {
          const ih = dens ? 64 : 78;
          const iw = boxW - contentLeft - 12;
          const img = getCachedImage(n.imageUrl, () =>
            setImageTick((t) => t + 1),
          );
          ctx.save();
          ctx.beginPath();
          drawNodeShape(ctx, "default", x + contentLeft, contentTop, iw, ih, 8);
          ctx.clip();
          if (img && img.naturalWidth > 0) {
            // Contain: fit image inside box, no crop
            const scale = Math.min(
              iw / img.naturalWidth,
              ih / img.naturalHeight,
            );
            const dw = img.naturalWidth * scale;
            const dh = img.naturalHeight * scale;
            ctx.fillStyle = "rgba(0,0,0,0.22)";
            ctx.fillRect(x + contentLeft, contentTop, iw, ih);
            ctx.drawImage(
              img,
              x + contentLeft + (iw - dw) / 2,
              contentTop + (ih - dh) / 2,
              dw,
              dh,
            );
          } else {
            ctx.fillStyle = theme.border;
            ctx.fillRect(x + contentLeft, contentTop, iw, ih);
          }
          ctx.restore();
          contentTop += ih + 8;
        }

        ctx.fillStyle =
          n.stylePreset === "muted" ? theme.labelSecondary : theme.labelPrimary;
        const fontSize = dens
          ? 12
          : n.stylePreset === "title"
            ? 15
            : 13;
        const weight =
          n.stylePreset === "title" || n.stylePreset === "decision" ? 600 : 500;
        ctx.font = canvasFont(fontSize, weight as 500 | 600);
        ctx.textBaseline = "top";
        const maxW = boxW - contentLeft - 12;
        const maxLines = dens ? 2 : n.stylePreset === "title" ? 2 : 2;
        const lines = wrapTextLines(ctx, n.text || U.unnamed, maxW, maxLines);
        const lineH = fontSize + 3;
        const textBlockH = lines.length * lineH;
        const badges =
          badgeMode !== "off" && viewport.zoom >= 0.35
            ? badgeMode === "tags"
              ? (n.tags ?? []).slice(0, 2).map((t) => `#${t}`)
              : nodeBadges(n).slice(0, 4)
            : [];
        const badgeH = badges.length ? 20 : 0;
        let titleY = contentTop;
        if (!n.imageUrl) {
          const available = boxH - 16 - badgeH;
          titleY = y + Math.max(10, (available - textBlockH) / 2);
        }
        lines.forEach((line, i) => {
          ctx.fillText(line, x + contentLeft, titleY + i * lineH);
        });

        if (badges.length) {
          let bx = x + contentLeft;
          const by = y + boxH - 22;
          for (const b of badges) {
            bx += paintBadgeChip(ctx, b, bx, by, theme, viewport.zoom);
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }, [
    theme,
    viewport,
    edges,
    posOf,
    nodes,
    branchColor,
    selectedIds,
    highlightIds,
    highlightEdgeIds,
    highlightStyle,
    hoverId,
    linkPreview,
    ghost,
    dropTargetId,
    dropForbidden,
    nw,
    dens,
    cardView,
    topoView,
    expandedCardId,
    propEditId,
    boxOf,
    canvas?.prefs.showRelationEdges,
    canvas?.prefs.nodeBadges,
    imageTick,
    U,
  ]);

  const drawMini = useCallback(() => {
    const el = miniRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    el.width = Math.floor(MINI_W * dpr);
    el.height = Math.floor(MINI_H * dpr);
    el.style.width = `${MINI_W}px`;
    el.style.height = `${MINI_H}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, MINI_W, MINI_H);
    ctx.fillStyle = theme.bgLayer1;
    ctx.fillRect(0, 0, MINI_W, MINI_H);

    const { minX, maxX, minY, maxY } = worldBounds;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const sx = MINI_W / bw;
    const sy = MINI_H / bh;
    const scale = Math.min(sx, sy);
    const ox = (MINI_W - bw * scale) / 2;
    const oy = (MINI_H - bh * scale) / 2;
    const toMini = (wx: number, wy: number) => ({
      x: ox + (wx - minX) * scale,
      y: oy + (wy - minY) * scale,
    });

    ctx.strokeStyle = theme.border;
    ctx.lineWidth = 1;
    for (const e of edges) {
      if (e.kind !== "hierarchy") continue;
      const a = posOf(e.from);
      const b = posOf(e.to);
      if (!a || !b) continue;
      const p1 = toMini(a.x, a.y);
      const p2 = toMini(b.x, b.y);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    for (const n of nodes) {
      if (n.deletedAt) continue;
      const p = posOf(n.id);
      if (!p) continue;
      const m = toMini(p.x, p.y);
      ctx.fillStyle = branchColor.get(n.id) ?? theme.brand;
      ctx.beginPath();
      ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const vw = hostSize.w / viewport.zoom;
    const vh = hostSize.h / viewport.zoom;
    const vcx = -viewport.x / viewport.zoom;
    const vcy = -viewport.y / viewport.zoom;
    const tl = toMini(vcx - vw / 2, vcy - vh / 2);
    const br = toMini(vcx + vw / 2, vcy + vh / 2);
    ctx.strokeStyle = theme.brand;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(tl.x, tl.y, Math.max(4, br.x - tl.x), Math.max(4, br.y - tl.y));
  }, [
    theme,
    worldBounds,
    edges,
    posOf,
    nodes,
    branchColor,
    hostSize,
    viewport,
  ]);

  useEffect(() => {
    const el = canvasRef.current;
    const host = hostRef.current;
    if (!el || !host) return;
    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      el.width = Math.floor(rect.width * dpr);
      el.height = Math.floor(rect.height * dpr);
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;
      setHostSize({ w: rect.width, h: rect.height });
      draw();
      drawMini();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    return () => ro.disconnect();
  }, [draw, drawMini]);

  useEffect(() => {
    draw();
    drawMini();
  }, [draw, drawMini]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      if (!e.metaKey && !e.ctrlKey && !e.altKey) {
        const k = e.key.toLowerCase();
        if (k === "v") setToolMode("select");
        if (k === "h") setToolMode("pan");
        if (k === "c") setToolMode("link");
        if (k === "b") setDragScope("branch");
        if (k === "n") setDragScope("node");
        if (k === "l") setLocked((v) => !v);
        if (k === "f") fitView();
        if (k === "=" || k === "+") setZoomAroundCenter(viewport.zoom * 1.15);
        if (k === "-" || k === "_") setZoomAroundCenter(viewport.zoom / 1.15);
      }

      if (e.code === "Space") dragRef.current.space = true;
      if (e.key === "Alt") dragRef.current.alt = true;
      if (e.key === "Escape" && dragRef.current.mode === "node") {
        e.preventDefault();
        dragRef.current.mode = "none";
        dragRef.current.nodeId = null;
        dragRef.current.moved = false;
        setGhost(null);
        setDropTargetId(null);
        setDropForbidden(false);
        setDragCursor(null);
        return;
      }
      if (e.key === "Escape") {
        if (propEditId || expandedCardId || propTip) {
          e.preventDefault();
          setPropEditId(null);
          setExpandedCardId(null);
          setPropTip(null);
          return;
        }
      }
      if (locked) return;

      if (e.key === "Tab" && !locked) {
        e.preventDefault();
        const parent = selectedIds[0];
        void applyOps([
          withRouterIcon(
            parent
              ? { type: "create_node", text: U.newNode, parentId: parent }
              : { type: "create_node", text: U.newNode },
          ),
        ]);
      }
      if (e.key === "ArrowLeft" && selectedIds[0] && !editing) {
        e.preventDefault();
        void applyOps([
          withRouterIcon({
            type: "create_node",
            text: U.leftChild,
            parentId: selectedIds[0],
            sidePref: -1,
          }),
        ]);
      }
      if (e.key === "ArrowRight" && selectedIds[0] && !editing) {
        e.preventDefault();
        void applyOps([
          withRouterIcon({
            type: "create_node",
            text: U.rightChild,
            parentId: selectedIds[0],
            sidePref: 1,
          }),
        ]);
      }
      if ((e.key === "Delete" || e.key === "Backspace") && !editing) {
        const id = selectedIds[0];
        if (id) {
          void applyOps([{ type: "delete_node", nodeId: id }]);
        }
      }
      if (e.key === "Enter" && selectedIds[0] && !editing) {
        e.preventDefault();
        const parentOfSel =
          edges.find(
            (x) =>
              x.kind === "hierarchy" &&
              x.isPrimaryParent &&
              x.to === selectedIds[0],
          )?.from ?? null;
        void applyOps([
          withRouterIcon(
            parentOfSel
              ? {
                  type: "create_node",
                  text: U.sibling,
                  parentId: parentOfSel,
                }
              : { type: "create_node", text: U.newNode },
          ),
        ]);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") dragRef.current.space = false;
      if (e.key === "Alt") dragRef.current.alt = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [
    applyOps,
    canvas,
    selectedIds,
    editing,
    edges,
    locked,
    fitView,
    setZoomAroundCenter,
    viewport.zoom,
    U,
    withRouterIcon,
    undo,
    lastChangeSetId,
    propEditId,
    expandedCardId,
    propTip,
  ]);

  const cursor =
    dragCursor ??
    (toolMode === "pan" || dragRef.current.space
      ? "grab"
      : toolMode === "link"
        ? "crosshair"
        : "default");

  return (
    <div
      className={`canvas-host${locked ? " is-locked" : ""}`}
      ref={hostRef}
      style={{ cursor }}
      onWheel={(e) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setViewport((v) => ({
          ...v,
          zoom: Math.min(4, Math.max(0.02, v.zoom * factor)),
        }));
      }}
      onPointerDown={(e) => {
        const t = e.target as HTMLElement | null;
        if (
          t?.closest?.(
            ".canvas-toolbar, .canvas-controls, .canvas-minimap, .edit-overlay, .node-handles, .hover-card, .inspector",
          )
        ) {
          return;
        }
        const world = toWorld(e.clientX, e.clientY);
        const hit = hitTest(world.x, world.y);
        dragRef.current.lastX = e.clientX;
        dragRef.current.lastY = e.clientY;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        dragRef.current.moved = false;
        dragRef.current.alt = e.altKey;
        dragRef.current.forcePin = e.ctrlKey || e.metaKey;
        dragRef.current.startWorldX = world.x;
        dragRef.current.startWorldY = world.y;
        dragRef.current.subtreeIds = [];
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

        const wantPan =
          toolMode === "pan" ||
          dragRef.current.space ||
          e.button === 1 ||
          e.button === 2 ||
          (!hit && toolMode !== "link");

        if (wantPan) {
          dragRef.current.mode = "pan";
          dragRef.current.nodeId = null;
          // Blank click clears selection (still allows pan-drag).
          if (!hit) setSelection([]);
          setDragCursor("grabbing");
          return;
        }

        if (locked) {
          if (hit) setSelection([hit]);
          else setSelection([]);
          dragRef.current.mode = "none";
          return;
        }

        if (hit && (toolMode === "link" || e.altKey)) {
          dragRef.current.mode = "link";
          dragRef.current.nodeId = hit;
          setSelection([hit]);
          setLinkPreview({ fromId: hit, x: world.x, y: world.y });
          return;
        }

        if (hit && toolMode === "select") {
          dragRef.current.mode = "node";
          dragRef.current.nodeId = hit;
          // Shift temporarily forces single-node; otherwise use toolbar scope
          const single =
            e.shiftKey || dragScope === "node";
          dragRef.current.subtreeIds = single
            ? [hit]
            : collectSubtreeIds(hit, edges);
          setSelection([hit]);
          return;
        }

        dragRef.current.mode = "pan";
        setDragCursor("grabbing");
      }}
      onPointerMove={(e) => {
        let world = toWorld(e.clientX, e.clientY);
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        if (Math.hypot(dx, dy) > 4) dragRef.current.moved = true;

        if (dragRef.current.mode === "pan") {
          const pdx = e.clientX - dragRef.current.lastX;
          const pdy = e.clientY - dragRef.current.lastY;
          dragRef.current.lastX = e.clientX;
          dragRef.current.lastY = e.clientY;
          setViewport((v) => ({ ...v, x: v.x + pdx, y: v.y + pdy }));
          return;
        }
        if (dragRef.current.mode === "link" && dragRef.current.nodeId) {
          setLinkPreview({
            fromId: dragRef.current.nodeId,
            x: world.x,
            y: world.y,
          });
          return;
        }
        if (dragRef.current.mode === "node" && dragRef.current.nodeId && dragRef.current.moved) {
          const rootId = dragRef.current.nodeId;

          // Edge auto-pan near viewport borders
          const host = hostRef.current;
          if (host) {
            const rect = host.getBoundingClientRect();
            const margin = 48;
            let panX = 0;
            let panY = 0;
            if (e.clientX < rect.left + margin) panX = 12;
            else if (e.clientX > rect.right - margin) panX = -12;
            if (e.clientY < rect.top + margin) panY = 12;
            else if (e.clientY > rect.bottom - margin) panY = -12;
            if (panX || panY) {
              setViewport((v) => ({ ...v, x: v.x + panX, y: v.y + panY }));
              // Adjust start world so grab point stays consistent after pan
              dragRef.current.startWorldX += panX / viewport.zoom;
              dragRef.current.startWorldY += panY / viewport.zoom;
              world = toWorld(e.clientX, e.clientY);
            }
          }

          // Preserve grab point: delta = pointer movement in world space
          const gdx = world.x - dragRef.current.startWorldX;
          const gdy = world.y - dragRef.current.startWorldY;
          const ids =
            dragRef.current.subtreeIds.length > 0
              ? dragRef.current.subtreeIds
              : collectSubtreeIds(rootId, edges);
          setGhost({ rootId, dx: gdx, dy: gdy, ids });
          setDragCursor("grabbing");

          dragRef.current.forcePin = e.ctrlKey || e.metaKey;
          if (dragRef.current.forcePin) {
            setDropTargetId(null);
            setDropForbidden(false);
            setHoverId(null);
            return;
          }

          const exclude = new Set(ids);
          const hit = hitTest(world.x, world.y, exclude);
          setHoverId(hit);
          if (hit && hit !== rootId) {
            const forbidden = isDescendantOrSelf(hit, rootId, edges);
            setDropTargetId(hit);
            setDropForbidden(forbidden);
          } else {
            setDropTargetId(null);
            setDropForbidden(false);
          }
        }

        // Idle hover: property tip in card view (skip while a tip is pinned)
        if (dragRef.current.mode === "none" && !ghost) {
          const hit = hitTest(world.x, world.y);
          setHoverId(hit);
          if (propTipRef.current?.pinned) return;
          const found = hitCardField(e.clientX, e.clientY, world);
          if (found) {
            setPropTip({
              label: found.field.label,
              value: found.field.fullValue,
              x: found.tipX,
              y: found.tipY,
              pinned: false,
              nodeId: found.nodeId,
              fieldKey: found.field.key,
            });
          } else {
            setPropTip(null);
          }
        }
      }}
      onPointerUp={(e) => {
        const world = toWorld(e.clientX, e.clientY);
        const mode = dragRef.current.mode;
        const fromId = dragRef.current.nodeId;
        const moved = dragRef.current.moved;
        const g = ghostRef.current;
        const forcePin = dragRef.current.forcePin || e.ctrlKey || e.metaKey;

        if (!locked && mode === "link" && fromId) {
          const hit = hitTest(world.x, world.y);
          if (hit && hit !== fromId) {
            void applyOps([
              {
                type: "link",
                from: fromId,
                to: hit,
                kind: "relation",
                label: U.relationLabel,
              },
            ]);
          }
          setLinkPreview(null);
        } else if (!locked && mode === "node" && fromId && moved && g) {
          const exclude = new Set(g.ids);
          const hit =
            forcePin || dropForbidden ? null : hitTest(world.x, world.y, exclude);
          const canReparent =
            hit &&
            hit !== fromId &&
            !isDescendantOrSelf(hit, fromId, edges);

          if (canReparent && hit) {
            const sidePref: -1 | 0 | 1 =
              (positions[hit]?.x ?? 0) <= 0 ? -1 : 1;
            const nextPos = { ...positions };
            for (const id of g.ids) {
              const base = positions[id];
              if (base) nextPos[id] = { x: base.x + g.dx, y: base.y + g.dy };
            }
            patchLocal({ positions: nextPos });
            setGhost(null);
            void applyOps([
              {
                type: "move_node",
                nodeId: fromId,
                newParentId: hit,
                sidePref,
              },
            ]);
          } else {
            // Free place -> pin every dragged id (branch = whole subtree, node = one)
            const nextPos = { ...positions };
            const pinOps: {
              type: "set_pinned";
              nodeId: string;
              pinned: true;
              pos: { x: number; y: number };
            }[] = [];
            const nextNodes = nodes.map((n) => {
              if (!exclude.has(n.id)) return n;
              const base = positions[n.id];
              if (!base) return n;
              const pos = { x: base.x + g.dx, y: base.y + g.dy };
              nextPos[n.id] = pos;
              pinOps.push({
                type: "set_pinned",
                nodeId: n.id,
                pinned: true,
                pos,
              });
              return { ...n, pinned: true, pos };
            });
            patchLocal({ positions: nextPos, nodes: nextNodes });
            setGhost(null);
            void applyOps(pinOps, "drag pin");
          }
        } else if (mode === "node" && fromId && !moved) {
          setSelection([fromId]);
          if (cardView) {
            const found = hitCardField(e.clientX, e.clientY, world);
            if (found) {
              // Click property → pin tip for present /讲解
              setExpandedCardId(fromId);
              if (propEditId && propEditId !== fromId) setPropEditId(null);
              setPropTip({
                label: found.field.label,
                value: found.field.fullValue,
                x: found.tipX,
                y: found.tipY,
                pinned: true,
                nodeId: found.nodeId,
                fieldKey: found.field.key,
              });
            } else {
              setExpandedCardId((prev) => (prev === fromId ? null : fromId));
              if (propEditId && propEditId !== fromId) setPropEditId(null);
            }
          }
        } else if (mode === "pan" && !moved) {
          setExpandedCardId(null);
          setPropEditId(null);
          // Keep pinned tip for讲解; only hover tip clears on blank click
          setPropTip((t) => (t?.pinned ? t : null));
        }

        dragRef.current.mode = "none";
        dragRef.current.nodeId = null;
        dragRef.current.forcePin = false;
        dragRef.current.subtreeIds = [];
        setLinkPreview(null);
        setGhost(null);
        setDropTargetId(null);
        setDropForbidden(false);
        setDragCursor(null);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        // Right-click releases a pinned property tip
        if (propTipRef.current?.pinned) {
          setPropTip(null);
          return;
        }
      }}
      onDoubleClick={(e) => {
        if (locked) return;
        const world = toWorld(e.clientX, e.clientY);
        const hit = hitTest(world.x, world.y);
        if (hit) {
          if (cardView) {
            setSelection([hit]);
            setExpandedCardId(hit);
            setPropEditId(hit);
            setPropTip(null);
            return;
          }
          const n = nodes.find((x) => x.id === hit)!;
          const host = hostRef.current!.getBoundingClientRect();
          const p = posOf(hit)!;
          setEditing({
            id: hit,
            text: n.text,
            x: host.width / 2 + viewport.x + p.x * viewport.zoom - 70,
            y: host.height / 2 + viewport.y + p.y * viewport.zoom - 16,
          });
        } else if (toolMode === "select") {
          void applyOps([
            withRouterIcon({
              type: "create_node",
              text: U.newNode,
              ...(selectedIds[0] ? { parentId: selectedIds[0] } : {}),
              sidePref: world.x < 0 ? -1 : 1,
            }),
          ]);
        }
      }}
    >
      <canvas ref={canvasRef} />

      <div
        className="canvas-toolbar"
        role="toolbar"
        aria-label={U.toolbarAria}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {embed ? (
          <>
            <div className="canvas-toolbar__group">
              <button
                type="button"
                className="canvas-tool-btn"
                title={U.backRosterTitle}
                onClick={requestBackToRoster}
              >
                {U.backRoster}
              </button>
            </div>
            <div className="canvas-toolbar__sep" />
          </>
        ) : null}
        <div className="canvas-toolbar__group">
          {(
            [
              ["select", U.toolSelect, "V"],
              ["pan", U.toolPan, "H"],
              ["link", U.toolLink, "C"],
            ] as const
          ).map(([mode, label, key]) => (
            <button
              key={mode}
              type="button"
              className={`canvas-tool-btn${toolMode === mode ? " is-active" : ""}`}
              title={`${label} (${key})`}
              aria-pressed={toolMode === mode}
              onClick={() => setToolMode(mode)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="canvas-toolbar__sep" />
        <div className="canvas-toolbar__group">
          <button
            type="button"
            className={`canvas-tool-btn${dragScope === "node" ? " is-active" : ""}`}
            title={U.dragNodeTitle}
            aria-pressed={dragScope === "node"}
            onClick={() => setDragScope("node")}
          >
            {U.dragNode}
          </button>
          <button
            type="button"
            className={`canvas-tool-btn${dragScope === "branch" ? " is-active" : ""}`}
            title={U.dragBranchTitle}
            aria-pressed={dragScope === "branch"}
            onClick={() => setDragScope("branch")}
          >
            {U.dragBranch}
          </button>
        </div>
        <div className="canvas-toolbar__sep" />
        <div className="canvas-toolbar__group">
          <button
            type="button"
            className={`canvas-tool-btn${viewMode === "bubble" ? " is-active" : ""}`}
            title={U.bubbleTitle}
            aria-pressed={viewMode === "bubble"}
            disabled={locked}
            onClick={() => {
              if (viewMode === "bubble") return;
              void setPrefs({ nodeViewMode: "bubble" });
            }}
          >
            {U.bubble}
          </button>
          <button
            type="button"
            className={`canvas-tool-btn${viewMode === "card" ? " is-active" : ""}`}
            title={U.cardTitle}
            aria-pressed={viewMode === "card"}
            disabled={locked}
            onClick={() => {
              if (viewMode === "card") return;
              void setPrefs({ nodeViewMode: "card" });
            }}
          >
            {U.card}
          </button>
          <button
            type="button"
            className={`canvas-tool-btn${viewMode === "topology" ? " is-active" : ""}`}
            title={U.topologyTitle}
            aria-pressed={viewMode === "topology"}
            disabled={locked}
            onClick={() => {
              if (viewMode === "topology") return;
              void setPrefs({ nodeViewMode: "topology" });
            }}
          >
            {U.topology}
          </button>
          <button
            type="button"
            className="canvas-tool-btn"
            title={U.unpinTitle}
            disabled={
              locked ||
              !selectedIds[0] ||
              !nodes.find((n) => n.id === selectedIds[0])?.pinned
            }
            onClick={() => {
              if (!selectedIds[0]) return;
              void applyOps([
                { type: "set_pinned", nodeId: selectedIds[0], pinned: false },
              ]);
            }}
          >
            {U.unpin}
          </button>
        </div>
        <div className="canvas-toolbar__sep" />
        <div className="canvas-toolbar__group">
          <button
            type="button"
            className="canvas-tool-btn"
            title={U.undo}
            disabled={!lastChangeSetId}
            onClick={() => void undo()}
          >
            {U.undo}
          </button>
        </div>
        <div className="canvas-toolbar__sep" />
        <div className="canvas-toolbar__group">
          <button
            type="button"
            className="canvas-tool-btn"
            title={U.exportPngTitle}
            onClick={() => {
              const el = canvasRef.current;
              if (!el) return;
              const title = (canvas?.title ?? "mindmap").replace(
                /[\\/:*?"<>|]+/g,
                "_",
              );
              void exportFitPng({
                fitView,
                canvas: el,
                filename: `${title}.png`,
              }).catch(() => {
                /* ignore */
              });
            }}
          >
            {U.exportPng}
          </button>
          <button
            type="button"
            className="canvas-tool-btn"
            title={U.exportSvgTitle}
            disabled={!canvasId}
            onClick={() => {
              if (!canvasId) return;
              const title = (canvas?.title ?? "mindmap").replace(
                /[\\/:*?"<>|]+/g,
                "_",
              );
              void exportSvgFromApi(canvasId, `${title}.svg`).catch(() => {
                /* ignore */
              });
            }}
          >
            {U.exportSvg}
          </button>
        </div>
        <span className="canvas-toolbar__zoom">
          {Math.round(viewport.zoom * 100)}%
        </span>
      </div>

      <div
        className="canvas-controls"
        role="toolbar"
        aria-label={U.controlsAria}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="canvas-controls__btn"
          title={fullscreen ? U.exitFullscreen : U.fullscreen}
          aria-label={fullscreen ? U.exitFullscreen : U.fullscreen}
          onClick={() => void toggleFullscreen()}
        >
          <FullscreenIcon exit={fullscreen} />
        </button>
        <button
          type="button"
          className="canvas-controls__btn"
          title={U.zoomInTitle}
          aria-label={U.zoomIn}
          onClick={() => setZoomAroundCenter(viewport.zoom * 1.2)}
        >
          <ZoomInIcon />
        </button>
        <button
          type="button"
          className="canvas-controls__btn"
          title={U.zoomOutTitle}
          aria-label={U.zoomOut}
          onClick={() => setZoomAroundCenter(viewport.zoom / 1.2)}
        >
          <ZoomOutIcon />
        </button>
        <button
          type="button"
          className="canvas-controls__btn"
          title={U.fitTitle}
          aria-label={U.fit}
          onClick={fitView}
        >
          <FitIcon />
        </button>
        <button
          type="button"
          className={`canvas-controls__btn${locked ? " is-active" : ""}`}
          title={locked ? U.unlockTitle : U.lockTitle}
          aria-label={locked ? U.unlock : U.lock}
          aria-pressed={locked}
          onClick={() => setLocked((v) => !v)}
        >
          <LockIcon locked={locked} />
        </button>
      </div>

      <div
        className="canvas-minimap"
        onPointerDown={(e) => {
          e.stopPropagation();
          miniDragRef.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          panFromMini(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!miniDragRef.current) return;
          panFromMini(e.clientX, e.clientY);
        }}
        onPointerUp={() => {
          miniDragRef.current = false;
        }}
        onPointerCancel={() => {
          miniDragRef.current = false;
        }}
      >
        <canvas ref={miniRef} width={MINI_W} height={MINI_H} />
      </div>

      {editing && (
        <input
          className="edit-overlay"
          style={{ left: editing.x, top: editing.y }}
          autoFocus
          value={editing.text}
          onChange={(e) => setEditing({ ...editing, text: e.target.value })}
          onBlur={() => {
            void applyOps([
              { type: "update_text", nodeId: editing.id, text: editing.text },
            ]);
            setEditing(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            if (e.key === "Escape") setEditing(null);
          }}
        />
      )}

      {!locked &&
        selectedIds[0] &&
        !ghost &&
        positions[selectedIds[0]] &&
        (() => {
          const id = selectedIds[0]!;
          const n = nodes.find((x) => x.id === id);
          if (!n || n.deletedAt) return null;
          const p = positions[id]!;
          const { w: boxW } = boxOf(n);
          const cx = hostSize.w / 2 + viewport.x + p.x * viewport.zoom;
          const cy = hostSize.h / 2 + viewport.y + p.y * viewport.zoom;
          const hw = (boxW / 2) * viewport.zoom;
          // Center-to-center: parent half + child half + breathing room
          const edgeGap = dens ? 100 : 140;
          const addChild = (side: -1 | 1) => {
            const text = side < 0 ? U.leftChild : U.rightChild;
            const childW = dens ? 160 : 200;
            void applyOps([
              withRouterIcon({
                type: "create_node",
                text,
                parentId: id,
                sidePref: side,
                pos: {
                  x: p.x + side * (boxW / 2 + childW / 2 + edgeGap),
                  y: p.y,
                },
              }),
            ]);
          };
          return (
            <div className="node-handles" onPointerDown={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="node-handle node-handle--left"
                style={{ left: cx - hw - 14, top: cy - 10 }}
                title={U.addLeftChildTitle}
                onClick={() => addChild(-1)}
              >
                +
              </button>
              <button
                type="button"
                className="node-handle node-handle--right"
                style={{ left: cx + hw - 2, top: cy - 10 }}
                title={U.addRightChildTitle}
                onClick={() => addChild(1)}
              >
                +
              </button>
            </div>
          );
        })()}

      {canvas?.prefs.showHoverCard !== false &&
        hoverId &&
        !ghost &&
        !cardView &&
        (() => {
          const n = nodes.find((x) => x.id === hoverId);
          if (!n) return null;
          const p = n ? positions[n.id] : null;
          if (!p) return null;
          const { h: boxH } = boxOf(n);
          const x = hostSize.w / 2 + viewport.x + p.x * viewport.zoom + 12;
          const y =
            hostSize.h / 2 + viewport.y + p.y * viewport.zoom + (boxH / 2) * viewport.zoom + 8;
          return <HoverCard node={n} x={x} y={y} />;
        })()}

      {cardView && propTip ? (
        <PropTooltip
          label={propTip.label}
          value={propTip.value}
          x={propTip.x}
          y={propTip.y}
          pinned={propTip.pinned}
          hostW={hostSize.w}
          hostH={hostSize.h}
          onUnpin={() => setPropTip(null)}
        />
      ) : null}

      {!locked &&
        !ghost &&
        cardView &&
        propEditId &&
        viewport.zoom >= 0.35 &&
        (() => {
          const id = propEditId;
          const n = nodes.find((x) => x.id === id);
          if (!n || n.deletedAt) return null;
          const p = positions[id];
          if (!p) return null;
          const { w } = boxOf(n);
          const sx = hostSize.w / 2 + viewport.x + p.x * viewport.zoom;
          const sy = hostSize.h / 2 + viewport.y + p.y * viewport.zoom;
          return (
            <NodePropOverlay
              node={n}
              applyOps={applyOps}
              screenX={sx}
              screenY={sy}
              zoom={viewport.zoom}
              width={w}
              accent={branchColor.get(id)}
              showStylePreset={false}
            />
          );
        })()}

      <div className="canvas-hint muted">
        {locked
          ? U.hintLocked
          : dragScope === "node"
            ? U.hintNodeDrag
            : U.hintBranchDrag}
      </div>
    </div>
  );
}


function FullscreenIcon({ exit }: { exit?: boolean }) {
  if (exit) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M7 14H5v5h5v-2H7v-3zm12 0h-2v3h-3v2h5v-5zM7 5h3V3H5v5h2V5zm10 0v3h2V3h-5v2h3z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 14H5v5h5v-2H7v-3zm0-9h3V3H5v5h2V5zm12 9h-2v3h-3v2h5v-5zm-2-9V3h-3v2h3v3h2V5h-2z"
      />
    </svg>
  );
}

function ZoomInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
      />
    </svg>
  );
}

function ZoomOutIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M19 13H5v-2h14v2z" />
    </svg>
  );
}

function FitIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 5v4h2V7h2V5H3zm0 10v4h4v-2H5v-2H3zm14-10v2h2v2h2V5h-4zm4 10h-2v2h-2v2h4v-4zM7 9h10v6H7V9z"
      />
    </svg>
  );
}

function LockIcon({ locked }: { locked: boolean }) {
  if (locked) {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-7h-1V7a5 5 0 0 0-10 0v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zM9 7a3 3 0 0 1 6 0v3H9V7z"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm6-7h-1V7a5 5 0 0 0-9.9-1h2.1A3 3 0 0 1 15 7v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2z"
      />
    </svg>
  );
}
