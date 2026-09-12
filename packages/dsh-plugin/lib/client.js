/**
 * dsh-mind-map — browser half.
 * Must use window.__ModuleLoader__ (lazy-CJS), same as dsh-ops-cron / dsh-voice-scribe.
 *
 * v3.2: registerTab — full right-panel topology (not Files preview / .mindmap).
 */
window.__ModuleLoader__.load({
  id: 'dsh-mind-map',
  factory: (require) => {
    const module = { exports: {} }
    const exports = module.exports
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })

    const React = require('react')
    const h = React.createElement
    const { useEffect, useId, useState } = React

    const name = 'dsh-mind-map'
    const inject = ['slots', 'locale', 'settingsScope']
    const NS = 'dsh-mind-map'
    const API = '/dsh-mind-map'
    const LOCALE_NS = 'settings.dshMindMap'
    const TAB_ID = 'dsh-mind-map'
    /** Filled in apply(); also used by resolveHostLang / iframe locale sync. */
    const runtime = { ctx: null }

    function resolveHostLang() {
      try {
        const loc = runtime.ctx && runtime.ctx.locale
        const snap = loc && typeof loc.getSnapshot === 'function' ? loc.getSnapshot() : null
        const raw =
          (snap && (snap.active || snap.locale || snap.preference || snap.lang)) ||
          (loc && loc.active) ||
          (document.documentElement && document.documentElement.lang) ||
          (typeof navigator !== 'undefined' && (navigator.language || navigator.userLanguage)) ||
          ''
        return String(raw).trim().toLowerCase().startsWith('zh') ? 'zh' : 'en'
      } catch {
        try {
          return String(document.documentElement.lang || '')
            .toLowerCase()
            .startsWith('zh')
            ? 'zh'
            : 'en'
        } catch {
          return 'en'
        }
      }
    }

    function postLocaleToMindmapFrames(lang) {
      const next = lang === 'zh' ? 'zh' : 'en'
      const frames = document.querySelectorAll('iframe.dsh-mm-frame')
      for (const frame of frames) {
        try {
          frame.contentWindow?.postMessage(
            { type: 'dsh-mind-map:locale', lang: next },
            '*',
          )
        } catch {
          /* ignore */
        }
      }
    }

    const DEFAULTS = {
      enabled: true,
      port: 17890,
      autoStart: true,
    }

    const zh = {
      title: 'Mind Map',
      description: '右侧整页思维导图 Tab；对话用 DSH',
      enabled: '启用',
      port: '画布端口',
      autoStart: '随 DSH 自动启动画布服务',
      open: '打开思维导图 Tab',
      opening: '打开中…',
      hint: '侧栏打开「思维导图」先看到画布名册；点名称进入。AI 新建、打开或查图时会自动进入对应画布。',
      save: '保存',
      saving: '保存中…',
      discard: '放弃',
      saveFailed: '保存失败',
      statusRunning: '画布服务运行中',
      statusStopped: '画布服务未运行',
      tabTitle: '思维导图',
      panelLoading: '正在启动画布…',
      panelFailed: '画布加载失败',
      panelHint: '请确认插件已启用且画布服务在跑',
      refresh: '刷新',
      rosterNew: '新建画布',
      rosterEmpty: '暂无画布。点「新建画布」，或在对话里让 AI 新建一张。',
      rosterHint: '点名称进入画布；画布内用「← 列表」可返回。',
      deleteCanvas: '删除',
      renameCanvas: '重命名',
      renamePrompt: '画布名称',
      confirmDelete: '确定永久删除该画布？',
    }

    const en = {
      title: 'Mind Map',
      description: 'Full right-panel mind-map tab; chat stays in DSH',
      enabled: 'Enabled',
      port: 'Canvas port',
      autoStart: 'Start canvas server with DSH',
      open: 'Open mind-map tab',
      opening: 'Opening…',
      hint: 'Open Mind Map from the sidebar to see the canvas roster first. AI create/open/query jumps into that canvas automatically.',
      save: 'Save',
      saving: 'Saving…',
      discard: 'Discard',
      saveFailed: 'Save failed',
      statusRunning: 'Canvas server running',
      statusStopped: 'Canvas server stopped',
      tabTitle: 'Mind Map',
      panelLoading: 'Starting canvas…',
      panelFailed: 'Failed to load canvas',
      panelHint: 'Enable the plugin and ensure the canvas server is running',
      refresh: 'Refresh',
      rosterNew: 'New canvas',
      rosterEmpty: 'No canvases yet. Click New canvas, or ask the AI to create one.',
      rosterHint: 'Click a name to open. Use ← List inside a canvas to return.',
      deleteCanvas: 'Delete',
      renameCanvas: 'Rename',
      renamePrompt: 'Canvas name',
      confirmDelete: 'Permanently delete this canvas?',
    }

    function normalizePrefs(value) {
      const v = value || {}
      return {
        enabled: v.enabled !== false,
        port: Number(v.port) > 0 ? Number(v.port) : DEFAULTS.port,
        autoStart: v.autoStart !== false,
      }
    }

    function tryGet(ctx, key) {
      try {
        return ctx.get?.(key) ?? ctx[key]
      } catch {
        return undefined
      }
    }

    function createStore(initial) {
      let state = initial
      const subs = new Set()
      return {
        getSnapshot: () => state,
        subscribe: (fn) => {
          subs.add(fn)
          return () => subs.delete(fn)
        },
        set: (next) => {
          state = typeof next === 'function' ? next(state) : next
          for (const fn of subs) fn()
        },
      }
    }

    function createForm(scope) {
      const staged = new Map()
      let saving = false
      let failed = false
      let store
      function publish() {
        store.set(projection())
      }
      function current() {
        return normalizePrefs(scope.getSnapshot().value)
      }
      function draft() {
        const next = { ...current() }
        for (const field of Object.keys(DEFAULTS)) {
          if (!staged.has(field)) continue
          const op = staged.get(field)
          next[field] = op.kind === 'clear' ? DEFAULTS[field] : op.value
        }
        return next
      }
      function projection() {
        const snapshot = scope.getSnapshot()
        return {
          available: snapshot.status !== 'unavailable',
          writable: snapshot.writable === true,
          dirty: staged.size > 0,
          saving,
          failed,
          value: draft(),
        }
      }
      store = createStore(projection())
      scope.subscribe(() => publish())
      return {
        store,
        edit(field, value) {
          staged.set(field, { kind: 'set', value })
          failed = false
          publish()
        },
        discard() {
          staged.clear()
          failed = false
          publish()
        },
        async save() {
          const state = projection()
          if (!state.dirty || saving || !state.writable) return
          saving = true
          failed = false
          publish()
          try {
            for (const [field, op] of staged.entries()) {
              if (op.kind === 'clear') await scope.unset(field)
              else await scope.set(field, op.value)
            }
            staged.clear()
          } catch {
            failed = true
          } finally {
            saving = false
            publish()
          }
        },
      }
    }

    async function resolveEmbedUrl(canvasId) {
      const openRes = await fetch(`${API}/open`, { method: 'POST' })
      const openBody = await openRes.json().catch(() => ({}))
      if (!openRes.ok) {
        throw new Error(openBody.message || openBody.error || `open HTTP ${openRes.status}`)
      }
      const stRes = await fetch(`${API}/status`)
      const st = await stRes.json().catch(() => ({}))
      const base = String(
        openBody.url || st.canvasUrl || `http://127.0.0.1:${st.config?.port || DEFAULTS.port}`,
      ).replace(/\/$/, '')
      const q = new URLSearchParams({ embed: '1', _v: String(Date.now()) })
      if (canvasId) q.set('canvasId', String(canvasId))
      q.set('lang', resolveHostLang())
      // Pass DSH host CSS tokens into the iframe (cross-origin).
      try {
        const root = document.documentElement
        const cs = getComputedStyle(root)
        const keys = [
          ['t_bgBase', '--dsw-alias-bg-base'],
          ['t_bgLayer1', '--dsw-alias-bg-layer-1'],
          ['t_labelPrimary', '--dsw-alias-label-primary'],
          ['t_labelSecondary', '--dsw-alias-label-secondary'],
          ['t_brand', '--dsw-alias-brand-primary'],
          ['t_border', '--dsw-alias-border-l1'],
          ['t_bubble', '--dsw-specific-bubble'],
          ['t_warn', '--dsw-alias-state-warn-primary'],
          ['t_error', '--dsw-alias-state-error-primary'],
        ]
        for (const [param, css] of keys) {
          const v = cs.getPropertyValue(css).trim()
          if (v) q.set(param, v)
        }
        const scheme =
          root.dataset.colorScheme ||
          (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        q.set('colorScheme', scheme)
      } catch {
        /* ignore */
      }
      return `${base}/?${q.toString()}`
    }

    const LAST_CANVAS_KEY = 'dsh-mind-map:last-canvas'

    function readLastCanvas() {
      try {
        const raw = sessionStorage.getItem(LAST_CANVAS_KEY)
        if (!raw) return null
        const o = JSON.parse(raw)
        if (o && o.canvasId) return o
      } catch {
        /* ignore */
      }
      return null
    }

    function writeLastCanvas(canvasId, title) {
      const id = String(canvasId || '').trim()
      if (!id) return
      try {
        sessionStorage.setItem(
          LAST_CANVAS_KEY,
          JSON.stringify({
            canvasId: id,
            title: String(title || 'Mind Map'),
            at: Date.now(),
          }),
        )
      } catch {
        /* ignore */
      }
    }

    function clearLastCanvas() {
      try {
        sessionStorage.removeItem(LAST_CANVAS_KEY)
      } catch {
        /* ignore */
      }
    }

    function MindmapTabPanel(props) {
      const sessionId =
        props.scope && props.scope.sessionId != null ? String(props.scope.sessionId) : ''
      const meta = props.tab && props.tab.meta && typeof props.tab.meta === 'object' ? props.tab.meta : {}
      // Boot policy (manual vs AI):
      // - AI pendingEnter / fresh meta.enter → open that canvas
      // - liveCanvasId already set → panel remount while staying on a map (tab switch)
      // - otherwise → roster (manual click on 思维导图 must NOT auto-open last map)
      const boot = (() => {
        const p = pendingEnter
        if (p && Date.now() - p.at < 30000) {
          pendingEnter = null
          liveCanvasId = p.canvasId
          writeLastCanvas(p.canvasId, p.title)
          return { view: 'canvas', canvasId: p.canvasId, title: p.title }
        }
        const nonce = Number(meta.nonce || 0)
        if (
          meta.enter &&
          meta.canvasId &&
          nonce > 0 &&
          Date.now() - nonce < 20000
        ) {
          liveCanvasId = String(meta.canvasId)
          writeLastCanvas(meta.canvasId, meta.title)
          return {
            view: 'canvas',
            canvasId: String(meta.canvasId),
            title: meta.title || 'Mind Map',
          }
        }
        // Remount while already viewing a canvas (tab strip focus) — keep it.
        if (liveCanvasId) {
          const last = readLastCanvas()
          const title =
            (last && last.canvasId === liveCanvasId && last.title) ||
            meta.title ||
            'Mind Map'
          return {
            view: 'canvas',
            canvasId: String(liveCanvasId),
            title: String(title),
          }
        }
        return { view: 'roster', canvasId: '', title: '' }
      })()
      const [view, setView] = useState(boot.view)
      const [canvasId, setCanvasId] = useState(boot.canvasId)
      const [canvasTitle, setCanvasTitle] = useState(boot.title)
      const [list, setList] = useState([])
      const [src, setSrc] = useState('')
      const [error, setError] = useState('')
      const [busy, setBusy] = useState(true)
      const [tick, setTick] = useState(0)

      async function loadRoster() {
        setBusy(true)
        setError('')
        try {
          await fetch(`${API}/open`, { method: 'POST' })
          const res = await fetch(`${API}/canvases`)
          const body = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`)
          setList(Array.isArray(body.canvases) ? body.canvases : [])
        } catch (e) {
          setError(String(e?.message || e))
          setList([])
        } finally {
          setBusy(false)
        }
      }

      function enterCanvas(c) {
        const id = String(c.id || '')
        if (!id) return
        const title = c.title || 'Mind Map'
        liveCanvasId = id
        writeLastCanvas(id, title)
        // Already showing this canvas with a loaded iframe — don't tear it down
        // (AI multi-tool turns used to re-enter every ~1s → full black flashes).
        if (view === 'canvas' && String(canvasId) === id && src) {
          if (title && title !== canvasTitle) {
            setCanvasTitle(title)
            syncOpenTabTitle(props.tab && props.tab.id, title, {
              canvasId: id,
              title,
              enter: false,
            })
          }
          return
        }
        setCanvasId(id)
        setCanvasTitle(title)
        setView('canvas')
        // Only clear src when switching canvases; keep iframe on same-id soft enter.
        if (String(canvasId) !== id) setSrc('')
        syncOpenTabTitle(props.tab && props.tab.id, title, {
          canvasId: id,
          title,
          enter: false,
        })
      }

      async function createCanvasManual() {
        const title = window.prompt('画布名称', '未命名画布')
        if (title == null) return
        const name = String(title).trim() || '未命名画布'
        setBusy(true)
        setError('')
        try {
          await fetch(`${API}/open`, { method: 'POST' })
          const res = await fetch(`${API}/canvases`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title: name, sessionId }),
          })
          const body = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`)
          const id = body.canvas && body.canvas.id
          if (!id) throw new Error('create returned no canvas id')
          enterCanvas({ id, title: body.canvas.title || name })
        } catch (e) {
          setError(String(e?.message || e))
          setBusy(false)
        }
      }

      async function renameCanvas(c, ev) {
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation()
        const current = String(c.title || '').trim() || '未命名画布'
        const next = window.prompt(zh.renamePrompt, current)
        if (next == null) return
        const name = String(next).trim()
        if (!name || name === current) return
        try {
          const res = await fetch(`${API}/canvases/${encodeURIComponent(c.id)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title: name }),
          })
          const body = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`)
          const title = body.canvas?.title || name
          setList((rows) =>
            rows.map((row) => (String(row.id) === String(c.id) ? { ...row, title } : row)),
          )
          if (String(canvasId) === String(c.id)) {
            setCanvasTitle(title)
            syncOpenTabTitle(props.tab && props.tab.id, title, {
              canvasId: String(c.id),
              title,
              enter: false,
            })
          }
        } catch (e) {
          setError(String(e?.message || e))
        }
      }

      async function deleteCanvas(c, ev) {
        if (ev && typeof ev.stopPropagation === 'function') ev.stopPropagation()
        if (!window.confirm(zh.confirmDelete)) return
        try {
          const res = await fetch(`${API}/canvases/${encodeURIComponent(c.id)}`, {
            method: 'DELETE',
          })
          const body = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`)
          if (String(canvasId) === String(c.id)) {
            liveCanvasId = ''
            clearLastCanvas()
            setSrc('')
            setCanvasId('')
            setCanvasTitle('')
            setView('roster')
          }
          setTick((n) => n + 1)
        } catch (e) {
          setError(String(e?.message || e))
        }
      }

      useEffect(() => {
        const onOpen = (ev) => {
          const d = ev && ev.detail
          if (!d || !d.canvasId) return
          if (sessionId && d.sessionId && String(d.sessionId) !== sessionId) return
          enterCanvas({ id: String(d.canvasId), title: d.title || 'Mind Map' })
        }
        window.addEventListener('dsh-mind-map:open', onOpen)
        return () => window.removeEventListener('dsh-mind-map:open', onOpen)
      }, [sessionId])

      // Fresh AI open only (nonce < 20s). Ignore sticky meta.enter from an old tab.
      useEffect(() => {
        const pending = consumePendingEnter()
        if (pending) {
          enterCanvas({ id: pending.canvasId, title: pending.title })
          return
        }
        const nonce = Number(meta.nonce || 0)
        if (
          meta.enter &&
          meta.canvasId &&
          nonce > 0 &&
          Date.now() - nonce < 20000
        ) {
          enterCanvas({
            id: String(meta.canvasId),
            title: meta.title || 'Mind Map',
          })
        }
      }, [meta.nonce, meta.canvasId, meta.enter, meta.title])

      // Keep polling pending enter while on roster (open event may race mount).
      useEffect(() => {
        if (view !== 'roster') return undefined
        const id = window.setInterval(() => {
          const pending = consumePendingEnter()
          if (pending) enterCanvas({ id: pending.canvasId, title: pending.title })
        }, 400)
        return () => window.clearInterval(id)
      }, [view])

      useEffect(() => {
        if (view !== 'roster') return undefined
        void loadRoster()
        return undefined
      }, [view, tick])

      useEffect(() => {
        if (view !== 'canvas' || !canvasId) return undefined
        let cancelled = false
        // Don't blank the panel if iframe already loaded for this canvas.
        const refreshing = Boolean(src)
        if (!refreshing) setBusy(true)
        setError('')
        ;(async () => {
          if (sessionId) {
            await fetch(`${API}/active`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ sessionId, canvasId }),
            })
          }
          const url = await resolveEmbedUrl(canvasId)
          if (!cancelled) {
            setSrc((prev) => (prev === url ? prev : url))
            setBusy(false)
          }
        })().catch((e) => {
          if (cancelled) return
          setError(String(e?.message || e))
          setBusy(false)
        })
        return () => {
          cancelled = true
        }
        // src intentionally omitted: we only (re)bind when view/canvas/session changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [view, canvasId, sessionId])

      useEffect(() => {
        if (view !== 'canvas') return undefined
        const onMsg = (ev) => {
          const data = ev && ev.data
          if (!data || typeof data.type !== 'string') return
          if (data.type === 'dsh-mind-map:back') {
            void backToRoster()
            return
          }
          if (data.type === 'dsh-mind-map:fullscreen') {
            const root = document.querySelector('.dsh-mm-panel--canvas')
            if (!root) return
            if (document.fullscreenElement) {
              void document.exitFullscreen().catch(() => {})
            } else {
              void root.requestFullscreen?.().catch(() => {})
            }
          }
        }
        window.addEventListener('message', onMsg)
        return () => window.removeEventListener('message', onMsg)
      }, [view, sessionId, canvasId])

      // Keep iframe UI language in sync with DSH (no full reload).
      useEffect(() => {
        if (view !== 'canvas' || !src) return undefined
        const push = () => postLocaleToMindmapFrames(resolveHostLang())
        push()
        const onLoad = () => push()
        const frame = document.querySelector('iframe.dsh-mm-frame')
        if (frame) frame.addEventListener('load', onLoad)
        const mo = new MutationObserver(push)
        mo.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['lang'],
        })
        let off = null
        try {
          const loc = runtime.ctx && runtime.ctx.locale
          if (loc && typeof loc.subscribe === 'function') off = loc.subscribe(push)
          else if (loc && typeof loc.on === 'function') off = loc.on('change', push)
        } catch {
          /* ignore */
        }
        const timer = setInterval(push, 2000)
        return () => {
          if (frame) frame.removeEventListener('load', onLoad)
          mo.disconnect()
          clearInterval(timer)
          if (typeof off === 'function') off()
        }
      }, [view, src])

      async function backToRoster() {
        if (sessionId) {
          await fetch(`${API}/active`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId, canvasId: '' }),
          }).catch(() => {})
        }
        liveCanvasId = ''
        clearLastCanvas()
        setSrc('')
        setCanvasId('')
        setCanvasTitle('')
        setView('roster')
        setTick((n) => n + 1)
        syncOpenTabTitle(props.tab && props.tab.id, zh.tabTitle, {
          enter: false,
          canvasId: '',
          title: zh.tabTitle,
        })
      }

      useEffect(() => {
        const onRoster = () => {
          // AI create/open: don't bounce back to roster mid-jump.
          if (Date.now() < aiJumpUntil || pendingEnter) return
          void backToRoster()
        }
        window.addEventListener('dsh-mind-map:show-roster', onRoster)
        return () => window.removeEventListener('dsh-mind-map:show-roster', onRoster)
      }, [sessionId])

      if (view === 'roster') {
        return h(
          'div',
          { className: 'dsh-mm-panel dsh-mm-roster', 'data-state': busy ? 'loading' : 'ready' },
          h(
            'div',
            { className: 'dsh-mm-roster-head' },
            h('h3', null, zh.tabTitle),
            h(
              'div',
              { className: 'dsh-mm-roster-actions' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-mm-panel-btn',
                  onClick: () => void createCanvasManual(),
                },
                zh.rosterNew,
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-mm-panel-btn',
                  onClick: () => setTick((n) => n + 1),
                },
                zh.refresh,
              ),
            ),
          ),
          h('p', { className: 'dsh-mm-roster-hint' }, zh.rosterHint),
          error
            ? h(
                'div',
                { className: 'dsh-mm-roster-error' },
                h('p', null, error),
              )
            : null,
          busy && !error ? h('p', { className: 'dsh-mm-panel-msg' }, zh.panelLoading) : null,
          !busy && !error && list.length === 0
            ? h('p', { className: 'dsh-mm-roster-empty' }, zh.rosterEmpty)
            : null,
          h(
            'ul',
            { className: 'dsh-mm-roster-list' },
            list.map((c) => {
              const fullTitle = c.title || c.id
              return h(
                'li',
                { key: c.id, className: 'dsh-mm-roster-row' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-roster-item',
                    title: fullTitle,
                    onClick: () => {
                      void enterCanvas(c)
                    },
                  },
                  h('span', { className: 'dsh-mm-roster-name' }, fullTitle),
                ),
                h(
                  'div',
                  { className: 'dsh-mm-roster-ops', role: 'group' },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-mm-roster-op',
                      title: zh.renameCanvas,
                      onClick: (ev) => void renameCanvas(c, ev),
                    },
                    zh.renameCanvas,
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dsh-mm-roster-op dsh-mm-roster-op--danger',
                      title: zh.deleteCanvas,
                      onClick: (ev) => void deleteCanvas(c, ev),
                    },
                    zh.deleteCanvas,
                  ),
                ),
              )
            }),
          ),
        )
      }

      return h(
        'div',
        {
          className: 'dsh-mm-panel dsh-mm-panel--canvas',
          'data-state': busy ? 'loading' : error ? 'error' : 'ready',
        },
        // Keep iframe mounted while refreshing — replacing it with only a loading
        // message on a dark panel looks like a full black screen during AI ops.
        src
          ? h('iframe', {
              key: canvasId,
              className: 'dsh-mm-frame',
              src,
              title: canvasTitle || zh.tabTitle,
              allow: 'fullscreen',
              style: busy ? { opacity: 0.72 } : undefined,
            })
          : null,
        !src && busy
          ? h('p', { className: 'dsh-mm-panel-msg' }, zh.panelLoading)
          : null,
        error
          ? h(
              'div',
              { className: 'dsh-mm-panel-error' },
              h('p', { className: 'dsh-mm-panel-msg' }, zh.panelFailed),
              h('p', { className: 'dsh-mm-panel-sub' }, error),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dsh-mm-panel-btn',
                  onClick: () => void backToRoster(),
                },
                '← 列表',
              ),
            )
          : null,
      )
    }

    /** Filled in apply(); settings card uses it to openTab. */
    // runtime declared near top (locale + iframe helpers)
    /** Suppress roster-on-activate while AI is jumping into a canvas. */
    let aiJumpUntil = 0
    /** Latest AI-requested canvas enter (survives tab remount / event race). */
    let pendingEnter = null
    /** Canvas currently shown in the tab panel ('' = roster). Used to avoid openTab thrash. */
    let liveCanvasId = ''
    /** Last openTab we issued for a canvas (dedupe AI multi-tool spam). */
    let lastOpenTab = { canvasId: '', at: 0 }

    function markAiJump(info) {
      aiJumpUntil = Date.now() + 20000
      const cid = info && info.canvasId ? String(info.canvasId) : ''
      if (cid) {
        pendingEnter = {
          canvasId: cid,
          title: String((info && info.title) || 'Mind Map'),
          at: Date.now(),
        }
      }
    }
    function consumePendingEnter() {
      const p = pendingEnter
      if (!p || Date.now() - p.at > 20000) {
        pendingEnter = null
        return null
      }
      pendingEnter = null
      return p
    }

    /** Outline-style mind-map glyph (matches builtin + menu icons). */
    function MindMapIcon(size) {
      const s = Number(size) > 0 ? Number(size) : 16
      return h(
        'svg',
        {
          width: s,
          height: s,
          viewBox: '0 0 16 16',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg',
          'aria-hidden': 'true',
        },
        h('circle', {
          cx: '8',
          cy: '8',
          r: '2',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('circle', {
          cx: '3.5',
          cy: '3.5',
          r: '1.5',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('circle', {
          cx: '12.5',
          cy: '3.5',
          r: '1.5',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('circle', {
          cx: '3.5',
          cy: '12.5',
          r: '1.5',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('circle', {
          cx: '12.5',
          cy: '12.5',
          r: '1.5',
          stroke: 'currentColor',
          'stroke-width': '1.5',
        }),
        h('path', {
          d: 'M6.3 6.7 4.5 4.9M9.7 6.7l1.8-1.8M6.3 9.3 4.5 11.1M9.7 9.3l1.8 1.8',
          stroke: 'currentColor',
          'stroke-width': '1.5',
          'stroke-linecap': 'round',
        }),
      )
    }

    /** Update the open tab strip title without changing + menu label. */
    function syncOpenTabTitle(tabId, title, metaPatch) {
      const label = String(title || zh.tabTitle)
      try {
        const svc = tryGet(runtime.ctx, 'betterSidebar')
        if (svc && typeof svc.updateTab === 'function' && tabId) {
          const patch = { title: label }
          if (metaPatch && typeof metaPatch === 'object') patch.meta = metaPatch
          svc.updateTab(String(tabId), patch)
          return
        }
        if (svc && typeof svc.openTab === 'function') {
          svc.openTab({ type: TAB_ID, title: label })
        }
      } catch {
        /* ignore */
      }
    }

    function SettingsCard(props) {
      const t = typeof props.t === 'function'
        ? props.t
        : (key) => zh[key] || en[key] || key
      const state = props.useCard
        ? props.useCard((s) => s)
        : {
            writable: false,
            dirty: false,
            saving: false,
            failed: false,
            value: DEFAULTS,
          }
      const [open, setOpen] = useState(false)
      const [busy, setBusy] = useState(false)
      const [serverHint, setServerHint] = useState('')
      const id = useId()
      const value = state.value || DEFAULTS
      const blocked = !state.writable || state.saving || !state.dirty
      const sidebar = tryGet(runtime.ctx, 'betterSidebar')

      useEffect(() => {
        if (!open) return undefined
        let cancelled = false
        fetch(`${API}/status`)
          .then((r) => r.json())
          .then((body) => {
            if (cancelled) return
            const running = body && body.server && body.server.running
            setServerHint(running ? t('statusRunning') : t('statusStopped'))
          })
          .catch(() => {
            if (!cancelled) setServerHint(t('statusStopped'))
          })
        return () => {
          cancelled = true
        }
      }, [open])

      async function openTab() {
        setBusy(true)
        try {
          const url = await resolveEmbedUrl('')
          if (sidebar && typeof sidebar.openTab === 'function') {
            // url seed = content open → expands right panel
            sidebar.openTab({
              type: TAB_ID,
              title: t('tabTitle'),
              url,
              meta: { enter: false },
            })
          } else {
            window.open(url.replace('embed=1', 'embed=0'), '_blank', 'noopener,noreferrer')
          }
          setServerHint(t('statusRunning'))
        } catch {
          setServerHint(t('statusStopped'))
        } finally {
          setBusy(false)
        }
      }

      return h(
        'li',
        { className: 'dsh-mm-card', 'data-open': open ? 'true' : 'false' },
        h(
          'button',
          {
            type: 'button',
            className: 'dsh-mm-header',
            'aria-expanded': open,
            onClick: () => setOpen((v) => !v),
          },
          h(
            'div',
            { className: 'dsh-mm-headText' },
            h('span', { className: 'dsh-mm-name' }, t('title')),
            h('span', { className: 'dsh-mm-description' }, t('description')),
          ),
          h('span', { className: 'dsh-mm-chevron' }, open ? '▾' : '▸'),
        ),
        open
          ? h(
              'div',
              { className: 'dsh-mm-body' },
              h(
                'div',
                { className: 'dsh-mm-field' },
                h('span', { className: 'dsh-mm-label' }, t('enabled')),
                h('button', {
                  type: 'button',
                  className: 'dsh-mm-switch',
                  role: 'switch',
                  'aria-checked': value.enabled ? 'true' : 'false',
                  disabled: !state.writable || state.saving,
                  onClick: () => props.edit('enabled', !value.enabled),
                }),
              ),
              h(
                'div',
                { className: 'dsh-mm-field' },
                h('label', { className: 'dsh-mm-label', htmlFor: `${id}-port` }, t('port')),
                h('input', {
                  id: `${id}-port`,
                  className: 'dsh-mm-input',
                  type: 'number',
                  min: 1024,
                  max: 65535,
                  value: value.port,
                  disabled: !state.writable || state.saving,
                  onChange: (e) => props.edit('port', Number(e.target.value)),
                }),
              ),
              h(
                'div',
                { className: 'dsh-mm-field' },
                h('span', { className: 'dsh-mm-label' }, t('autoStart')),
                h('button', {
                  type: 'button',
                  className: 'dsh-mm-switch',
                  role: 'switch',
                  'aria-checked': value.autoStart ? 'true' : 'false',
                  disabled: !state.writable || state.saving,
                  onClick: () => props.edit('autoStart', !value.autoStart),
                }),
              ),
              serverHint ? h('p', { className: 'dsh-mm-status' }, serverHint) : null,
              h('p', { className: 'dsh-mm-hint' }, t('hint')),
              h(
                'div',
                { className: 'dsh-mm-footer' },
                state.failed ? h('p', { className: 'dsh-mm-failed' }, t('saveFailed')) : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-open',
                    disabled: busy,
                    onClick: () => {
                      void openTab()
                    },
                  },
                  busy ? t('opening') : t('open'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-discard',
                    disabled: !state.dirty || state.saving,
                    onClick: props.discard,
                  },
                  t('discard'),
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'dsh-mm-save',
                    disabled: blocked,
                    onClick: () => {
                      props.save()
                    },
                  },
                  t(state.saving ? 'saving' : 'save'),
                ),
              ),
            )
          : null,
      )
    }

    const CSS = `
.dsh-mm-card{list-style:none;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-2);margin:0 0 10px}
.dsh-mm-header{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left}
.dsh-mm-headText{display:flex;flex-direction:column;gap:2px;min-width:0}
.dsh-mm-name{font-weight:600;color:var(--dsw-alias-label-primary)}
.dsh-mm-description{font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mm-body{padding:0 14px 14px;display:flex;flex-direction:column;gap:10px}
.dsh-mm-field{display:flex;align-items:center;justify-content:space-between;gap:12px}
.dsh-mm-label{font-size:13px;color:var(--dsw-alias-label-primary)}
.dsh-mm-input{height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);color:inherit;padding:0 10px;width:120px}
.dsh-mm-switch{width:40px;height:22px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);position:relative}
.dsh-mm-switch[aria-checked="true"]{background:var(--dsw-alias-color-accent,#3b82f6)}
.dsh-mm-hint,.dsh-mm-status{margin:0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dsh-mm-footer{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;align-items:center}
.dsh-mm-open,.dsh-mm-save,.dsh-mm-discard,.dsh-mm-panel-btn{box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;height:32px;border-radius:8px;border:1px solid var(--dsw-alias-border-l2);padding:0 12px;font:inherit;cursor:pointer;background:var(--dsw-alias-bg-layer-3,#1c1c22);color:inherit;width:auto;margin:0;flex:0 0 auto;white-space:nowrap}
.dsh-mm-save{background:var(--dsw-alias-brand-primary,var(--dsw-alias-color-accent,#3b82f6));border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}
.dsh-mm-failed{margin:0;color:#ef4444;font-size:12px;margin-right:auto}
.dsh-mm-panel{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;background:#121218;color:var(--dsw-alias-label-primary,#f5f5f7);isolation:isolate}
.dsh-mm-panel-msg{margin:24px 16px 8px;font-size:14px;color:var(--dsw-alias-label-primary,#f5f5f7)}
.dsh-mm-panel-sub{margin:0 16px 12px;font-size:12px;color:var(--dsw-alias-label-secondary,#a1a1aa)}
.dsh-mm-panel--canvas>.dsh-mm-panel-btn{align-self:flex-start;margin:0 16px 16px}
.dsh-mm-frame{flex:1;width:100%;height:100%;border:0;background:#101014;min-height:0}
.dsh-mm-panel--canvas{position:relative}
.dsh-mm-roster{padding:16px 16px 20px;overflow:auto;box-sizing:border-box}
.dsh-mm-roster-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;min-width:0}
.dsh-mm-roster-head h3{margin:0;font-size:16px;font-weight:600;letter-spacing:.01em;color:var(--dsw-alias-label-primary,#f5f5f7);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mm-roster-actions{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;gap:8px;flex-shrink:0}
.dsh-mm-roster-hint,.dsh-mm-roster-empty{margin:0 0 14px;font-size:12px;line-height:1.45;color:var(--dsw-alias-label-secondary,#a1a1aa)}
.dsh-mm-roster-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;max-width:560px}
.dsh-mm-roster-row{display:flex;flex-direction:row;flex-wrap:nowrap;align-items:center;gap:0;min-width:0;border-radius:10px;border:1px solid rgba(255,255,255,.08);background:#1a1a22;overflow:hidden}
.dsh-mm-roster-row:hover{border-color:rgba(255,255,255,.14);background:#20202a}
.dsh-mm-roster-item{flex:1 1 auto;min-width:0;display:flex !important;align-items:center;height:44px;padding:0 14px;border:0;border-radius:0;background:transparent;color:inherit;font:inherit;cursor:pointer;text-align:left;width:auto !important;margin:0;box-sizing:border-box}
.dsh-mm-roster-item:hover{background:transparent}
.dsh-mm-roster-name{display:block;font-size:14px;font-weight:500;line-height:1.3;color:var(--dsw-alias-label-primary,#f5f5f7);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-mm-roster-ops{display:flex !important;flex-direction:row !important;flex-wrap:nowrap !important;flex:0 0 auto;align-items:center;gap:4px;padding:0 8px 0 0;margin:0}
.dsh-mm-roster-op{box-sizing:border-box;display:inline-flex !important;align-items:center;justify-content:center;flex:0 0 auto;width:auto !important;min-width:0;max-width:none;height:28px;padding:0 10px;margin:0;border-radius:6px;border:1px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary,#a1a1aa);font:inherit;cursor:pointer;font-size:12px;line-height:1;white-space:nowrap}
.dsh-mm-roster-op:hover{color:var(--dsw-alias-label-primary,#f5f5f7);background:rgba(255,255,255,.06)}
.dsh-mm-roster-op--danger:hover{color:#f87171;background:rgba(248,113,113,.1)}
.dsh-mm-roster-actions .dsh-mm-panel-btn{display:inline-flex !important;width:auto !important;margin:0;align-self:auto}
.dsh-mm-panel-btn--primary{background:var(--dsw-alias-brand-primary,#5e6ad2);border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}
`

    function registerMindmapTab(svc) {
      if (!svc || typeof svc.registerTab !== 'function') return () => {}
      return svc.registerTab({
        id: TAB_ID,
        // + menu always shows the product name (not the active canvas title).
        title: () => zh.tabTitle,
        icon: (size) => MindMapIcon(size),
        order: 25,
        single: true,
        createTab: () => ({
          tab: {
            id: TAB_ID,
            type: TAB_ID,
            title: zh.tabTitle,
            meta: { enter: false },
          },
        }),
        onOpen: () => {
          // AI jump in progress — leave panel alone (auto-enter that canvas).
          if (Date.now() < aiJumpUntil || pendingEnter) return
          // Manual open from + / sidebar: always land on roster.
          // (Do not restore sessionStorage / sticky meta — that fought AI auto-enter UX.)
          liveCanvasId = ''
          clearLastCanvas()
          window.dispatchEvent(new CustomEvent('dsh-mind-map:show-roster'))
        },
        // Do NOT roster on onActivate: tab-strip switch must keep the open canvas.
        // Use ← 列表 or open the feature again to see the roster.
        component: (props) => h(MindmapTabPanel, props),
      })
    }

    function apply(ctx) {
      runtime.ctx = ctx

      ctx.effect(() => {
        const tag = document.createElement('style')
        tag.setAttribute('data-plugin', name)
        tag.textContent = CSS
        document.head.appendChild(tag)
        return () => tag.remove()
      }, 'dsh-mind-map: styles')

      ctx.effect(() => {
        try {
          return ctx.locale.register(LOCALE_NS, { zh, en })
        } catch {
          const offZh = ctx.locale.register(LOCALE_NS, 'zh', zh)
          const offEn = ctx.locale.register(LOCALE_NS, 'en', en)
          return () => {
            if (offZh) offZh()
            if (offEn) offEn()
          }
        }
      }, 'dsh-mind-map: locale')

      ctx.effect(() => {
        let dispose = null
        const attach = (svc) => {
          if (dispose || !svc) return
          dispose = registerMindmapTab(svc)
        }
        attach(tryGet(ctx, 'betterSidebar'))
        const off = typeof ctx.on === 'function'
          ? ctx.on('internal/service', (serviceName, value) => {
              if (serviceName === 'betterSidebar') attach(value)
            })
          : null
        return () => {
          if (typeof off === 'function') off()
          if (typeof dispose === 'function') dispose()
          dispose = null
        }
      }, 'dsh-mind-map: sidebar tab')

      // AI create/open/query → host queues ui-open → client opens tab and enters canvas.
      // Deduped: same canvas already live → do NOT openTab again (prevents black flashes).
      ctx.effect(() => {
        let dead = false
        const poll = async () => {
          if (dead) return
          try {
            const svc = tryGet(ctx, 'betterSidebar')
            const sessionId = svc?.getSnapshot?.()?.sessionId
            if (!sessionId || typeof svc.openTab !== 'function') return
            const r = await fetch(`${API}/ui-open?sessionId=${encodeURIComponent(sessionId)}`)
            const body = await r.json().catch(() => ({}))
            if (!body?.canvasId) return
            const title = body.title || zh.tabTitle
            const cid = String(body.canvasId)
            const alreadyLive = liveCanvasId && liveCanvasId === cid
            const recentlyOpened =
              lastOpenTab.canvasId === cid && Date.now() - lastOpenTab.at < 10000
            markAiJump({ canvasId: cid, title })

            if (!alreadyLive && !recentlyOpened) {
              lastOpenTab = { canvasId: cid, at: Date.now() }
              const url = await resolveEmbedUrl(cid)
              svc.openTab({
                type: TAB_ID,
                title,
                url,
                meta: {
                  canvasId: cid,
                  title,
                  enter: true,
                  nonce: Date.now(),
                },
              })
            }

            // Only nudge the panel when not already on this canvas (avoids remount thrash).
            if (!alreadyLive) {
              window.dispatchEvent(
                new CustomEvent('dsh-mind-map:open', {
                  detail: {
                    sessionId,
                    canvasId: cid,
                    title,
                    nonce: Date.now(),
                  },
                }),
              )
            }
          } catch {
            /* ignore poll errors */
          }
        }
        const id = window.setInterval(() => {
          void poll()
        }, 1200)
        void poll()
        return () => {
          dead = true
          window.clearInterval(id)
        }
      }, 'dsh-mind-map: ui-open poll')

      const scope = ctx.settingsScope.bind({ namespace: NS })
      const form = createForm(scope)
      ctx.slots.inject('settings.plugin.item', () =>
        ctx.slots.register(
          {
            name: 'settings.plugin.item',
            key: NS,
            locale: LOCALE_NS,
            inject: () => ({
              hooks: { card: form.store },
              edit: (field, value) => form.edit(field, value),
              save: () => {
                form.save()
              },
              discard: () => form.discard(),
            }),
          },
          SettingsCard,
        ),
      )
    }

    exports.name = name
    exports.inject = inject
    exports.apply = apply
    return module.exports
  },
})
