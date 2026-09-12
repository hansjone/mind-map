# dsh-mind-map

DSH 插件：自建画布 Web；**对话 = DSH 会话镜像**（输入转发，历史由 DSH 管）。

## 架构

- Host：注册 `mindmap_*`、启停本机 Web、会话绑定
- Client：设置卡（端口 / 打开画布 / 绑定）
- Web 右栏：零持久化镜像，不做独立 chat

详见仓库 `docs/dsh-bridge.md` 与设计稿 v2.9。
