# dsh-mind-map 本地安装到 DSH web profile（开发用）

```powershell
$plugin = "d:\project\chatgpt\mind-map\packages\dsh-plugin"
# 用 dsh plugin add 链到本地包，或在 profile 里 link
dsh plugin --profile web add -w $plugin
```

装好后：

1. 重启 `dsh web`，浏览器硬刷新（Ctrl+Shift+R）
2. 右侧栏「+」选 **思维导图**，或 设置 → Mind Map → **打开思维导图 Tab**
3. 拓扑占满右侧内容区；对话继续用中间 DSH 输入框

依赖：已安装 `dsh-better-sidebar`（提供 `ctx.betterSidebar.registerTab`）。
