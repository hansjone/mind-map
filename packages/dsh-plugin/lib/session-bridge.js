/**
 * Canvas ↔ DSH Session binding.
 * Web input → agent.followup; session/event → push to mind-map WS mirror.
 */

import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'

const PLUGIN = 'dsh-mind-map'

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), '.dsh')
}

function textOf(message) {
  const content = message?.content
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
}

function tryGet(ctx, name) {
  try {
    return ctx.get?.(name) ?? ctx[name]
  } catch {
    return undefined
  }
}

/** Same default model a New Session in DSH Web would use. */
function currentDefaultModel(ctx) {
  try {
    const selection = tryGet(ctx, 'agentDefaultModel')?.currentSelection?.()
    const provider = typeof selection?.provider === 'string' ? selection.provider.trim() : ''
    const model = typeof selection?.model === 'string' ? selection.model.trim() : ''
    if (!provider || !model) return null
    return {
      provider,
      model,
      ...(selection.reasoningEffort === undefined
        ? {}
        : { reasoningEffort: selection.reasoningEffort }),
    }
  } catch {
    return null
  }
}

/** Drop harness context notices / tool rows — only real chat turns for the mirror. */
function isMirrorableChatMessage(message) {
  if (!message || typeof message !== 'object') return false
  const source = message.source || {}
  const kind = source.kind
  const form = source.form
  if (form === 'snapshot' || form === 'notice' || form === 'instructions' || form === 'catalog') {
    return false
  }
  if (kind === 'tool') return false
  if (message.role === 'assistant') return kind === 'model' || kind == null || kind === undefined
  if (message.role === 'user') {
    return kind === 'user' || kind === 'plugin' || kind == null || kind === undefined
  }
  return false
}

function isRuntimeContextText(text) {
  return (
    typeof text === 'string' &&
    (text.includes('Current runtime context') ||
      text.includes('Current DSH file policy') ||
      text.includes('This snapshot supersedes'))
  )
}

export function createSessionBridge({ ctx, getMindMapBase, getInternalToken, logger }) {
  /** @type {Map<string, { sessionId: string, handle: any, agent: any }>} */
  const byCanvas = new Map()
  /** @type {Map<string, string>} mirror agent session → canvas */
  const canvasBySession = new Map()
  /** @type {Map<string, string>} DSH chat session → currently displayed canvas */
  const activeBySession = new Map()
  /** @type {Map<string, { canvasId: string, title: string, at: number }>} */
  const uiOpenBySession = new Map()

  function setActiveCanvas(sessionId, canvasId) {
    const sid = String(sessionId || '').trim()
    if (!sid) return null
    const cid = String(canvasId || '').trim()
    if (!cid) {
      activeBySession.delete(sid)
      return null
    }
    activeBySession.set(sid, cid)
    return cid
  }

  function getActiveCanvas(sessionId) {
    const sid = String(sessionId || '').trim()
    if (!sid) return null
    return activeBySession.get(sid) || canvasBySession.get(sid) || null
  }

  function clearActiveCanvas(sessionId) {
    const sid = String(sessionId || '').trim()
    if (sid) activeBySession.delete(sid)
  }

  function clearActiveForCanvas(canvasId) {
    const cid = String(canvasId || '')
    for (const [sid, id] of activeBySession.entries()) {
      if (id === cid) activeBySession.delete(sid)
    }
  }

  /** Ask the DSH client to open the 思维导图 tab on this canvas. */
  function queueUiOpen(sessionId, { canvasId, title } = {}) {
    const sid = String(sessionId || '').trim()
    const cid = String(canvasId || '').trim()
    if (!sid || !cid) return false
    setActiveCanvas(sid, cid)
    const prev = uiOpenBySession.get(sid)
    // Coalesce: same canvas already queued → just refresh title/time (don't churn).
    if (prev && prev.canvasId === cid) {
      prev.title = String(title || prev.title || 'Mind Map')
      prev.at = Date.now()
      return true
    }
    uiOpenBySession.set(sid, {
      canvasId: cid,
      title: String(title || 'Mind Map'),
      at: Date.now(),
    })
    return true
  }

  function consumeUiOpen(sessionId) {
    const sid = String(sessionId || '').trim()
    if (!sid) return null
    const cmd = uiOpenBySession.get(sid) || null
    if (cmd) uiOpenBySession.delete(sid)
    return cmd
  }
  async function ensureBinding(canvasId) {
    const existing = byCanvas.get(canvasId)
    if (existing?.agent) return existing

    const agents = tryGet(ctx, 'agents')
    if (!agents || typeof agents.create !== 'function') {
      throw new Error('DSH agents service unavailable')
    }

    const selection = currentDefaultModel(ctx)
    if (!selection) {
      throw new Error(
        'DSH 尚未选择默认模型。请先在 DSH 设置 → Models 选好模型，再在画布对话。',
      )
    }

    const sessionId = randomUUID()
    const cwd =
      process.env.MINDMAP_SESSION_CWD ||
      join(dshHome(), 'user-workspaces', 'administrator')

    const handle = await agents.create({
      sessionId,
      agentOptions: {
        provider: selection.provider,
        model: selection.model,
        ...selection.reasoningEffort === undefined
          ? {}
          : { reasoningEffort: selection.reasoningEffort },
      },
      meta: {
        cwd,
        title: `Mind Map · ${String(canvasId).slice(0, 8)}`,
      },
      setup: (agentCtx) => {
        // Fill {{model}} / {{provider}} for persona assembly (same as dsh-ops-cron).
        if (!agentCtx || typeof agentCtx.on !== 'function') return
        const snapshot = {
          provider: selection.provider,
          model: selection.model,
          ...selection.reasoningEffort === undefined
            ? {}
            : { reasoningEffort: selection.reasoningEffort },
        }
        agentCtx.on('system-prompt/assemble', async (...args) => {
          const next = args.find((arg) => typeof arg === 'function')
          const assembled = next ? await next() : (args[0] || {})
          return {
            ...assembled,
            variables: {
              ...assembled.variables,
              provider: snapshot.provider,
              model: snapshot.model,
            },
          }
        })
        agentCtx.on('agent/request', async (...args) => {
          const next = args.find((arg) => typeof arg === 'function')
          const resolved = next ? await next() : (args[0] || {})
          const { reasoningEffort: _inherited, ...rest } = resolved || {}
          return {
            ...rest,
            provider: snapshot.provider,
            model: snapshot.model,
            ...snapshot.reasoningEffort === undefined
              ? {}
              : { reasoningEffort: snapshot.reasoningEffort },
          }
        })
      },
    })
    const agent = handle?.agent
    if (!agent || typeof agent.followup !== 'function') {
      try {
        handle?.dispose?.()
      } catch {
        /* ignore */
      }
      throw new Error('agents.create did not return a usable agent')
    }

    try {
      if (typeof agent.session?.append === 'function') {
        agent.session.append('session/title', {
          title: `Mind Map · ${String(canvasId).slice(0, 8)}`,
          source: 'plugin',
        })
      }
    } catch {
      /* best-effort */
    }

    // Best-effort: show session in workspace list
    try {
      const registry = tryGet(ctx, 'workspaceRegistry')
      const list =
        typeof registry?.list === 'function'
          ? registry.list()
          : typeof registry?.workspaces === 'function'
            ? registry.workspaces()
            : []
      const rows = Array.isArray(list) ? list : []
      const ws =
        rows.find((w) => {
          const p = String(w?.path || w?.cwd || '')
          return p && p.replace(/\\/g, '/') === cwd.replace(/\\/g, '/')
        }) || rows[0]
      if (ws && typeof ws.attachSession === 'function') {
        await ws.attachSession(sessionId)
      }
    } catch (e) {
      logger?.warn?.('[dsh-mind-map] workspace attach skipped: %s', e?.message || e)
    }

    const binding = { sessionId, handle, agent, model: selection }
    byCanvas.set(canvasId, binding)
    canvasBySession.set(sessionId, canvasId)
    logger?.info?.(
      '[dsh-mind-map] bound canvas %s → session %s (%s/%s)',
      canvasId,
      sessionId,
      selection.provider,
      selection.model,
    )
    return binding
  }

  async function prompt(canvasId, text) {
    const trimmed = String(text || '').trim()
    if (!canvasId || !trimmed) throw new Error('canvasId and text required')
    const binding = await ensureBinding(canvasId)
    // Match dsh-ops-cron: plain message object + plugin source (reliable wake).
    const message = {
      id: randomUUID(),
      role: 'user',
      content: [{ type: 'text', text: trimmed }],
      source: { kind: 'plugin', plugin: PLUGIN },
    }
    binding.agent.followup(message)
    return {
      ok: true,
      sessionId: binding.sessionId,
      model: binding.model || null,
    }
  }

  async function history(canvasId) {
    const binding = byCanvas.get(canvasId)
    if (!binding) return { sessionId: null, messages: [], model: null }
    const session = binding.agent?.session
    let messages = []
    try {
      const derived =
        typeof session?.deriveMessages === 'function'
          ? session.deriveMessages()
          : session?.messages || []
      const list = Array.isArray(derived) ? derived : []
      messages = list
        .filter(isMirrorableChatMessage)
        .map((m) => {
          const role = m?.role === 'assistant' ? 'assistant' : m?.role === 'user' ? 'user' : null
          if (!role) return null
          const content = textOf(m)
          if (!content || isRuntimeContextText(content)) return null
          // Skip our own plugin echoes if duplicated; keep user-visible text.
          return { role, content }
        })
        .filter(Boolean)
    } catch {
      messages = []
    }
    return { sessionId: binding.sessionId, messages, model: binding.model || null }
  }

  function status(canvasId) {
    const binding = canvasId ? byCanvas.get(canvasId) : null
    const selection = currentDefaultModel(ctx)
    return {
      ok: true,
      mode: 'dsh-session',
      bound: Boolean(binding),
      sessionId: binding?.sessionId || null,
      agents: Boolean(tryGet(ctx, 'agents')),
      model: binding?.model || selection,
      hasDefaultModel: Boolean(selection),
    }
  }

  async function pushMirror(canvasId, payload) {
    const base = getMindMapBase?.()
    if (!base) return
    const token = getInternalToken?.() || ''
    try {
      await fetch(`${base}/api/internal/session-event`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-mindmap-token': token,
        },
        body: JSON.stringify({ canvasId, ...payload }),
      })
    } catch (e) {
      logger?.warn?.('[dsh-mind-map] mirror push failed: %s', e?.message || e)
    }
  }

  function onSessionEvent(session, event) {
    const sessionId = session?.id || session?.header?.id
    if (!sessionId) return
    const canvasId = canvasBySession.get(sessionId)
    if (!canvasId) return

    const type = event?.type
    if (type === 'assistant/chunk') {
      const chunk = event.data?.chunk
      if (chunk?.type === 'text-delta' && typeof chunk.text === 'string') {
        void pushMirror(canvasId, {
          mirror: { kind: 'text-delta', text: chunk.text, sessionId },
        })
      }
      return
    }
    if (type === 'user/message') {
      const message = event.data?.message || event.data
      if (!isMirrorableChatMessage(message)) return
      const text = textOf(message)
      if (!text || isRuntimeContextText(text)) return
      // Don't mirror our own plugin-sourced prompt twice (UI already shows optimistic bubble).
      if (message?.source?.kind === 'plugin' && message?.source?.plugin === PLUGIN) return
      void pushMirror(canvasId, {
        mirror: { kind: 'user', text, sessionId },
      })
      return
    }
    if (type === 'assistant/message') {
      const message = event.data?.message || event.data
      if (!isMirrorableChatMessage(message)) return
      const text = textOf(message)
      if (!text || isRuntimeContextText(text)) return
      void pushMirror(canvasId, {
        mirror: { kind: 'assistant', text, sessionId },
      })
      return
    }
    if (type === 'tool/call') {
      void pushMirror(canvasId, {
        mirror: {
          kind: 'tool',
          name: event.data?.name || 'tool',
          callId: event.data?.callId,
          sessionId,
        },
      })
      return
    }
    if (type === 'turn/end') {
      void pushMirror(canvasId, {
        mirror: {
          kind: 'turn-end',
          reason: event.data?.reason,
          sessionId,
        },
      })
    }
  }

  function dispose() {
    for (const binding of byCanvas.values()) {
      try {
        binding.handle?.dispose?.()
      } catch {
        /* ignore */
      }
    }
    byCanvas.clear()
    canvasBySession.clear()
    activeBySession.clear()
    uiOpenBySession.clear()
  }

  return {
    ensureBinding,
    prompt,
    history,
    status,
    onSessionEvent,
    dispose,
    byCanvas,
    canvasBySession,
    activeBySession,
    setActiveCanvas,
    getActiveCanvas,
    clearActiveCanvas,
    clearActiveForCanvas,
    queueUiOpen,
    consumeUiOpen,
  }
}
