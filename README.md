# Mind Map

挂在 **DSH** 上的 AI 无限画布：自建 Web 管画布；**对话 = DSH 会话镜像**（本地不存聊天）。

## 要求

- Node.js ≥ 22
- pnpm ≥ 9
- 正式使用：DeepSeek Harness（安装本仓 `packages/dsh-plugin` → `dsh-mind-map`）

## 用 DSH 插件（推荐）

1. 把 `packages/dsh-plugin` 装进 DSH profile（`dsh plugin` / 本地 link）
2. 设置 → **Mind Map**：端口、自动启动、「打开画布」
3. 在画布右栏输入 ≡ 向绑定的 DSH 会话发消息；模型与历史在 DSH

插件会：启停 `127.0.0.1:17890`、注册 `mindmap_*` 工具、把 `session/event` 镜像到 Web。

## 本地只调画布（无对话大脑）

```bash
pnpm install
pnpm dev
```

浏览器打开 <http://127.0.0.1:17890>。图 API / 手改可用；右栏会提示需 DSH 会话。

独立调试对话（非正式路径）才需要 `.env` 里的 `LLM_API_KEY`。

## 结构

- `apps/server` — Hono + SQLite + 图 API/WS + session 桥
- `apps/web` — React 三区 UI（右栏 = 会话镜像）
- `packages/dsh-plugin` — `dsh-mind-map` Host/Client
- `packages/*` — graph-core / store / layout / dream-skin / shared

详见 `docs/dsh-bridge.md`。
