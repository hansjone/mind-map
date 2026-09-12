# DSH ↔ Mind Map（大脑在 DSH，UI 自建）

## 一句话

Mind Map 是 **DSH 插件**：画布 Web 自己开端口；**对话就是 DSH 会话**。Web 右栏只做镜像显示 + 输入转发，**不保存**聊天记录。

## 分工

| 职责 | 谁管 |
|---|---|
| 模型 / Agent 循环 / 会话历史 | **DSH Session** |
| 图数据 / 布局 / 提案 | **mind-map GraphStore** |
| 画布 UI | 本机 Web（`127.0.0.1:17890`） |
| 对话 UI | 本机 Web **镜像** DSH 事件 |

## 数据流

1. 用户在 Web 输入 → 插件转发为该绑定会话的用户消息（= 在 DSH 里打字）
2. DSH 流式回复 → 插件推到 Web 右栏显示
3. Agent 调 `mindmap_*` → 改 SQLite 图 → WS 推画布
4. 用户也可以直接在 DSH 原生聊天对同一会话说话，效果相同

## 设置卡

端口、启停、打开画布、绑定会话。模型用 DSH 会话自己的选择器，不另配 Key。

## 明确不做

- 不在 mind-map 内自建 LLM runtime / 自存聊天记录
- 不把画布嵌进 DSH Web GUI
