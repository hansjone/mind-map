/**
 * dsh-mind-map — Host half.
 * Canvas Web is local; chat IS a DSH Session (mirror only on the Web).
 */

import { randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { createRuntime } from './runtime.js'
import { createSessionBridge } from './session-bridge.js'
import { makeMindmapSkill, registerMindmapTools } from './tools.js'

export const name = 'dsh-mind-map'
export const NS = 'dsh-mind-map'
export const inject = []

const API_PREFIX = '/dsh-mind-map'
const DEFAULTS = {
  enabled: true,
  port: 17890,
  autoStart: true,
}

/**
 * Resolve a host peer package via ESM import (not createRequire).
 * Linked plugins + dsh.cmd chdir break CJS resolution from import.meta.url;
 * parallel loader import also races require() against cosmokit's ESM graph.
 */
async function importHostPkg(id) {
  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')
  const scoped = id.startsWith('@')
  const parts = scoped ? id.split('/') : [id]
  const candidates = [
    join(dshHome, 'profiles', 'web', 'node_modules', ...parts, 'lib', 'index.mjs'),
    join(dshHome, 'profiles', 'web', 'node_modules', ...parts, 'lib', 'index.js'),
  ]
  // Bare import works when the package is installed next to this plugin.
  try {
    return await import(id)
  } catch {
    // fall through to profile paths
  }
  for (const file of candidates) {
    if (!existsSync(file)) continue
    try {
      return await import(pathToFileURL(file).href)
    } catch {
      // try next
    }
  }
  throw new Error(`cannot resolve ${id}`)
}

const SchemaMod = await importHostPkg('@deepseek-ai/schemastery')
const Schema = SchemaMod.default || SchemaMod

export const Config = Schema.object({
  enabled: Schema.boolean().default(DEFAULTS.enabled),
  port: Schema.number().min(1024).max(65535).step(1).default(DEFAULTS.port),
  autoStart: Schema.boolean().default(DEFAULTS.autoStart),
})

function resolveConfig(config = {}) {
  return {
    enabled: config.enabled !== false,
    port: Number(config.port) > 0 ? Number(config.port) : DEFAULTS.port,
    autoStart: config.autoStart !== false,
  }
}

function tryGet(ctx, key) {
  try {
    return ctx.get?.(key) ?? ctx[key]
  } catch {
    return undefined
  }
}

function writeJson(res, status, body) {
  if (res.headersSent || res.writableEnded) return
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(JSON.stringify(body))
}

async function readJson(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}

function registerWebRoute(ctx, handler) {
  const register = (webServer) => {
    if (!webServer || typeof webServer.register !== 'function') return () => {}
    return webServer.register({
      kind: 'prefix',
      path: API_PREFIX,
      handler,
    })
  }
  const present = tryGet(ctx, 'webServer')
  if (present !== undefined) return register(present)
  const disposers = []
  let registered = false
  const off = ctx.on('internal/service', (serviceName, value) => {
    if (serviceName !== 'webServer' || registered) return
    registered = true
    disposers.push(register(value))
  })
  return () => {
    off()
    for (const d of disposers) {
      if (typeof d === 'function') d()
    }
  }
}

export function apply(ctx, config = {}) {
  const entry = resolveConfig(config)
  const runtime = createRuntime()
  const internalToken = randomBytes(16).toString('hex')
  let mindMapBase = `http://127.0.0.1:${entry.port}`
  let bridge = null

  const getBase = () => mindMapBase
  const getToken = () => internalToken

  bridge = createSessionBridge({
    ctx,
    getMindMapBase: getBase,
    getInternalToken: getToken,
    logger: ctx.logger,
  })

  async function ensureServer(cfg = entry) {
    if (!cfg.enabled) {
      await runtime.stop()
      return runtime.status()
    }
    let dshPort = tryGet(ctx, 'webServer')?.port
    for (let i = 0; !dshPort && i < 40; i++) {
      await new Promise((r) => setTimeout(r, 100))
      dshPort = tryGet(ctx, 'webServer')?.port
    }
    if (!dshPort) {
      throw new Error('DSH webServer.port unavailable; cannot wire session bridge')
    }
    const bridgeUrl = `http://127.0.0.1:${dshPort}${API_PREFIX}`
    const st = await runtime.start({
      port: cfg.port,
      bridgeUrl,
      internalToken,
    })
    mindMapBase = st.url
    return st
  }

  ctx.inject(['settings'], (sctx) => {
    sctx.settings.register(NS, Config, { base: entry, applies: 'live' })
  })

  ctx.inject(['tools'], (tctx) => {
    registerMindmapTools(
      tctx,
      getBase,
      (sessionId) => bridge.getActiveCanvas(sessionId),
      (sessionId, canvasId) => bridge.setActiveCanvas(sessionId, canvasId),
      (sessionId, info) => bridge.queueUiOpen(sessionId, info),
    )
    tctx.logger?.info?.('[dsh-mind-map] mindmap_* tools registered')
  })

  ctx.inject(['skills'], (sctx) => {
    if (typeof sctx.skills?.register === 'function') {
      sctx.skills.register(makeMindmapSkill())
    }
  })

  ctx.effect(() => {
    const off = ctx.on('session/event', (session, event) => {
      bridge.onSessionEvent(session, event)
    })
    return () => {
      if (typeof off === 'function') off()
    }
  }, 'dsh-mind-map: session mirror')

  ctx.effect(() => {
    return registerWebRoute(ctx, async (req, res) => {
      try {
        const url = new URL(req.url || '/', 'http://dsh.local')
        const path = url.pathname.replace(API_PREFIX, '') || '/'
        const method = (req.method || 'GET').toUpperCase()

        if (path === '/health' && method === 'GET') {
          writeJson(res, 200, {
            ok: true,
            plugin: name,
            server: runtime.status(),
            canvasUrl: mindMapBase,
          })
          return
        }

        if (path === '/status' && method === 'GET') {
          const canvasId = url.searchParams.get('canvasId') || ''
          writeJson(res, 200, {
            ...bridge.status(canvasId),
            server: runtime.status(),
            canvasUrl: mindMapBase,
            config: entry,
          })
          return
        }

        if (path === '/prompt' && method === 'POST') {
          const body = await readJson(req)
          const result = await bridge.prompt(body.canvasId, body.text)
          writeJson(res, 200, result)
          return
        }

        if (path === '/history' && method === 'GET') {
          const canvasId = url.searchParams.get('canvasId') || ''
          const hist = await bridge.history(canvasId)
          writeJson(res, 200, { ok: true, ...hist })
          return
        }

        if (path === '/ensure' && method === 'POST') {
          const body = await readJson(req)
          const binding = await bridge.ensureBinding(body.canvasId)
          writeJson(res, 200, { ok: true, sessionId: binding.sessionId })
          return
        }

        if (path === '/open' && method === 'POST') {
          await ensureServer(entry)
          writeJson(res, 200, { ok: true, url: mindMapBase })
          return
        }

        if (path === '/canvases' && method === 'GET') {
          await ensureServer(entry)
          const r = await fetch(`${mindMapBase}/api/canvases`)
          const body = await r.json().catch(() => ({}))
          writeJson(res, r.status, body)
          return
        }

        if (path === '/canvases' && method === 'POST') {
          await ensureServer(entry)
          const body = await readJson(req)
          const r = await fetch(`${mindMapBase}/api/canvases`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              title: body.title || '未命名画布',
              rootText: body.rootText,
            }),
          })
          const out = await r.json().catch(() => ({}))
          const sessionId = String(body.sessionId || '').trim()
          const canvasId = out?.canvas?.id
          if (r.ok && sessionId && canvasId) {
            bridge.setActiveCanvas(sessionId, canvasId)
            bridge.queueUiOpen(sessionId, {
              canvasId,
              title: out.canvas?.title || body.title || 'Mind Map',
            })
          }
          writeJson(res, r.status, { ...out, activeCanvasId: canvasId || null })
          return
        }

        if (path.startsWith('/canvases/') && method === 'PATCH') {
          await ensureServer(entry)
          const id = path.slice('/canvases/'.length).split('/')[0]
          const body = await readJson(req)
          const r = await fetch(`${mindMapBase}/api/canvases/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ title: body.title }),
          })
          const out = await r.json().catch(() => ({}))
          writeJson(res, r.status, out)
          return
        }

        if (path.startsWith('/canvases/') && method === 'DELETE') {
          await ensureServer(entry)
          const id = path.slice('/canvases/'.length).split('/')[0]
          const r = await fetch(`${mindMapBase}/api/canvases/${encodeURIComponent(id)}`, {
            method: 'DELETE',
          })
          const out = await r.json().catch(() => ({}))
          if (r.ok) bridge.clearActiveForCanvas(id)
          writeJson(res, r.status, out)
          return
        }

        if (path === '/active' && method === 'GET') {
          const sessionId = url.searchParams.get('sessionId') || ''
          writeJson(res, 200, {
            ok: true,
            sessionId,
            canvasId: bridge.getActiveCanvas(sessionId),
          })
          return
        }

        if (path === '/active' && method === 'POST') {
          const body = await readJson(req)
          const sessionId = String(body.sessionId || '').trim()
          const canvasId = body.canvasId == null ? '' : String(body.canvasId).trim()
          if (!sessionId) {
            writeJson(res, 400, { ok: false, error: 'sessionId_required' })
            return
          }
          const bound = bridge.setActiveCanvas(sessionId, canvasId)
          writeJson(res, 200, { ok: true, sessionId, canvasId: bound })
          return
        }

        if (path === '/ui-open' && method === 'GET') {
          const sessionId = url.searchParams.get('sessionId') || ''
          const cmd = bridge.consumeUiOpen(sessionId)
          writeJson(res, 200, { ok: true, ...(cmd || {}) })
          return
        }

        writeJson(res, 404, { ok: false, error: 'not_found' })
      } catch (e) {
        ctx.logger?.error?.('[dsh-mind-map] route error %s', e)
        writeJson(res, 500, { ok: false, message: String(e?.message || e) })
      }
    })
  }, 'dsh-mind-map: web routes')

  ctx.effect(() => {
    let stopped = false
    const boot = async () => {
      if (stopped) return
      if (entry.autoStart && entry.enabled) {
        try {
          await ensureServer(entry)
          ctx.logger?.info?.('[dsh-mind-map] canvas at %s', mindMapBase)
        } catch (e) {
          ctx.logger?.error?.('[dsh-mind-map] failed to start server: %s', e?.message || e)
        }
      }
    }
    void boot()

    const settings = tryGet(ctx, 'settings')
    let unwatch = null
    if (settings?.watch) {
      try {
        unwatch = settings.watch(NS, (next) => {
          Object.assign(entry, resolveConfig(next))
          if (entry.autoStart && entry.enabled) void ensureServer(entry)
          else if (!entry.enabled) void runtime.stop()
        })
      } catch {
        /* optional */
      }
    }

    return () => {
      stopped = true
      if (typeof unwatch === 'function') unwatch()
      bridge.dispose()
      // Sync kill so DSH process exit does not leave canvas server orphaned.
      try {
        runtime.stop()
      } catch (e) {
        ctx.logger?.warn?.('[dsh-mind-map] stop failed: %s', e?.message || e)
      }
    }
  }, 'dsh-mind-map: lifecycle')
}
