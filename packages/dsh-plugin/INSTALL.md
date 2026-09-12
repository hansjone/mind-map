# dsh-mind-map 安装

## 远程安装（推荐）

仓库需包含预构建 `packages/dsh-plugin/bundle`（维护者执行 `pnpm pack:plugin` 后推送）。

```bash
dsh plugin --profile web add -w "github:hansjone/mind-map#path:packages/dsh-plugin"
```

装好后重启 `dsh web`，硬刷新浏览器。依赖：`dsh-better-sidebar`。

启动日志应出现：

```text
[dsh-mind-map] starting packaged bundle/server.mjs
```

若仍出现 `building web UI…`，说明装到的版本没有 `bundle/`，请更新插件或改用本地完整仓库。

## 本地开发（link 整个 monorepo）

```powershell
cd d:\project\chatgpt\mind-map
pnpm install
pnpm pack:plugin
dsh plugin --profile web add -w "d:\project\chatgpt\mind-map\packages\dsh-plugin"
```

开发改 UI 时可继续用 monorepo 源码启动（无 bundle 时会自动 `pnpm --filter @mind-map/web build`）。
