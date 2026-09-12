/**
 * Start / stop the mind-map Hono server as a child process.
 * Lifetime is tied to the DSH host: when the plugin disposes / process exits,
 * the canvas server is killed (including process tree on Windows).
 *
 * Two layouts:
 * - Packaged (remote `dsh plugin add`): packages/dsh-plugin/bundle/{web,server.mjs}
 * - Monorepo (local link): ../../.. mind-map root with apps/web + apps/server
 */

import { spawn, execSync } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = dirname(fileURLToPath(import.meta.url))
/** dsh-mind-map package root (…/dsh-mind-map or …/packages/dsh-plugin) */
export const pluginRoot = join(__dirname, '..')
/** Monorepo root when linked from source; otherwise same as pluginRoot when packaged. */
export const mindMapRoot = (() => {
  const mono = join(__dirname, '../../..')
  if (existsSync(join(mono, 'apps', 'web', 'package.json'))) return mono
  return pluginRoot
})()

function bundledServer() {
  return join(pluginRoot, 'bundle', 'server.mjs')
}

function bundledWebIndex() {
  return join(pluginRoot, 'bundle', 'web', 'index.html')
}

function isPackagedInstall() {
  return existsSync(bundledServer()) && existsSync(bundledWebIndex())
}

function resolveTsxCliRel() {
  const candidates = [
    join(mindMapRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    join(mindMapRoot, 'apps', 'server', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  ]
  for (const abs of candidates) {
    if (existsSync(abs)) {
      return relative(mindMapRoot, abs).split('\\').join('/')
    }
  }
  try {
    const requireFromRoot = createRequire(join(mindMapRoot, 'package.json'))
    const abs = requireFromRoot.resolve('tsx/dist/cli.mjs')
    return relative(mindMapRoot, abs).split('\\').join('/')
  } catch {
    return null
  }
}

function ensureWebDist() {
  // Remote/plugin install ships prebuilt assets — never run pnpm here.
  if (isPackagedInstall()) return

  const indexHtml = join(mindMapRoot, 'apps', 'web', 'dist', 'index.html')
  const watchSrc = [
    join(mindMapRoot, 'apps', 'web', 'src', 'TopologyCanvas.tsx'),
    join(mindMapRoot, 'apps', 'web', 'src', 'store.ts'),
    join(mindMapRoot, 'apps', 'web', 'src', 'App.tsx'),
    join(mindMapRoot, 'apps', 'web', 'src', 'drag-subtree.ts'),
  ]
  let needsBuild = !existsSync(indexHtml)
  if (!needsBuild && existsSync(indexHtml)) {
    try {
      const distM = statSync(indexHtml).mtimeMs
      for (const src of watchSrc) {
        if (existsSync(src) && statSync(src).mtimeMs > distM) {
          needsBuild = true
          break
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!needsBuild) return

  if (!existsSync(join(mindMapRoot, 'pnpm-workspace.yaml'))) {
    throw new Error(
      'mind-map web UI is missing and this is not a monorepo checkout. ' +
        'Reinstall a release that includes packages/dsh-plugin/bundle ' +
        '(github:hansjone/mind-map#path:packages/dsh-plugin after maintainer runs pnpm pack:plugin), ' +
        'or clone the full repo and link locally.',
    )
  }

  console.log('[dsh-mind-map] building web UI (apps/web/dist missing or stale)…')
  try {
    execSync('pnpm --filter @mind-map/web build', {
      cwd: mindMapRoot,
      stdio: 'inherit',
      env: process.env,
      windowsHide: true,
    })
  } catch (e) {
    throw new Error(
      `failed to build mind-map web UI: ${e?.message || e}. Run manually: pnpm --filter @mind-map/web build`,
    )
  }
  if (!existsSync(indexHtml)) {
    throw new Error('web build finished but apps/web/dist/index.html is still missing')
  }
}

async function probeMindMap(url) {
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1500) })
    if (!res.ok) return null
    const body = await res.json().catch(() => null)
    if (body && body.ok === true) return body
  } catch {
    /* not up */
  }
  return null
}

/** Kill a PID and its children (Windows needs /T). */
function killPidTree(pid) {
  if (!pid || !Number.isFinite(pid)) return
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' })
    } else {
      try {
        process.kill(pid, 'SIGTERM')
      } catch {
        /* ignore */
      }
      try {
        process.kill(pid, 'SIGKILL')
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* already gone */
  }
}

/** Free listeners on bind:port so DSH can own a fresh child. */
function killListenersOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync('netstat -ano', { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes(`:${port}`) || !/LISTENING/i.test(line)) continue
        const parts = line.trim().split(/\s+/)
        const pid = Number(parts[parts.length - 1])
        if (pid > 0) pids.add(pid)
      }
      for (const pid of pids) {
        // Never kill ourselves
        if (pid === process.pid) continue
        console.log(`[dsh-mind-map] freeing port ${port} (pid ${pid})`)
        killPidTree(pid)
      }
    } else {
      try {
        execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' })
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
}

export function createRuntime() {
  let child = null
  let last = { port: 17890, url: 'http://127.0.0.1:17890', running: false }
  let exitHooksInstalled = false

  function killOwnedChildSync() {
    const c = child
    child = null
    if (!c) return
    killPidTree(c.pid)
  }

  function installExitHooks() {
    if (exitHooksInstalled) return
    exitHooksInstalled = true
    const onExit = () => {
      killOwnedChildSync()
    }
    process.on('exit', onExit)
    for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK']) {
      try {
        process.on(sig, () => {
          killOwnedChildSync()
        })
      } catch {
        /* unsupported signal on this platform */
      }
    }
  }

  async function start({ port = 17890, bridgeUrl, internalToken, dataDir } = {}) {
    const url = `http://127.0.0.1:${port}`
    installExitHooks()

    if (child && !child.killed) {
      last = { ...last, port, url, running: true }
      return last
    }

    ensureWebDist()

    // Stale orphan from a previous DSH run: kill it so we own the next child
    // and can tear it down when DSH exits.
    if (await probeMindMap(url)) {
      console.log(`[dsh-mind-map] stopping leftover server on ${url}`)
      killListenersOnPort(port)
      await new Promise((r) => setTimeout(r, 400))
    }

    const packaged = isPackagedInstall()
    const env = {
      ...process.env,
      PORT: String(port),
      BIND: '127.0.0.1',
      MINDMAP_DSH_BRIDGE: bridgeUrl || '',
      MINDMAP_INTERNAL_TOKEN: internalToken || '',
      MINDMAP_LLM_SOURCE: 'dsh',
    }
    if (dataDir) env.DATA_DIR = dataDir

    let cwd
    let args
    if (packaged) {
      cwd = pluginRoot
      env.MINDMAP_ROOT = pluginRoot
      env.MINDMAP_WEB_DIST = join(pluginRoot, 'bundle', 'web')
      args = [bundledServer()]
      console.log('[dsh-mind-map] starting packaged bundle/server.mjs')
    } else {
      cwd = mindMapRoot
      const entryAbs = join(mindMapRoot, 'apps/server/src/index.ts')
      const distAbs = join(mindMapRoot, 'apps/server/dist/index.js')
      const useTs = existsSync(entryAbs)
      const scriptAbs = useTs ? entryAbs : distAbs
      if (!existsSync(scriptAbs)) {
        throw new Error(`mind-map server entry not found under ${mindMapRoot}`)
      }
      const scriptRel = useTs ? 'apps/server/src/index.ts' : 'apps/server/dist/index.js'
      if (useTs) {
        const tsxCli = resolveTsxCliRel()
        if (!tsxCli) throw new Error('tsx not found; run pnpm install in mind-map')
        args = [tsxCli, scriptRel]
      } else {
        args = [scriptRel]
      }
    }

    child = spawn(process.execPath, args, {
      cwd,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      // Keep attached to parent so closing DSH can reap it; do NOT detach.
      detached: false,
    })

    let spawnError = null
    child.stdout?.on('data', (buf) => {
      const line = String(buf).trim()
      if (line) console.log(`[dsh-mind-map:server] ${line}`)
    })
    child.stderr?.on('data', (buf) => {
      const line = String(buf).trim()
      if (line) {
        console.error(`[dsh-mind-map:server] ${line}`)
        if (line.includes('EADDRINUSE')) spawnError = new Error(`port ${port} already in use`)
      }
    })
    child.on('exit', (code) => {
      console.warn(`[dsh-mind-map] server exited code=${code}`)
      if (child) child = null
      last = { ...last, running: false }
    })

    const deadline = Date.now() + 20000
    let ok = false
    while (Date.now() < deadline) {
      if (!child) break
      if (await probeMindMap(url)) {
        ok = true
        break
      }
      await new Promise((r) => setTimeout(r, 200))
    }

    if (!ok) {
      killOwnedChildSync()
      killListenersOnPort(port)
      throw spawnError || new Error(`mind-map server failed to become healthy on ${url}`)
    }

    last = { port, url, running: true }
    return last
  }

  async function stop() {
    const port = last.port
    killOwnedChildSync()
    // Belt-and-suspenders: anything still listening on our canvas port goes down with DSH.
    killListenersOnPort(port)
    await new Promise((r) => setTimeout(r, 200))
    last = { ...last, running: false }
  }

  function status() {
    return {
      ...last,
      running: Boolean(child && !child.killed),
      pid: child?.pid || null,
      packaged: isPackagedInstall(),
    }
  }

  return { start, stop, status, mindMapRoot, pluginRoot }
}
