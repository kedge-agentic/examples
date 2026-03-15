# Demo 03: SSE Events

SSE 事件流调试工具 -- 让 Agent 主动产生多种事件类型，用于学习和调试 CCAAS 事件协议。

## 核心概念

- **CCAAS 事件协议**：理解平台通过 SSE 推送的各种事件类型
- 可观测的事件包括：`text_delta`、`subagent_started`、`subagent_completed`、`tool_activity` 等
- 配合 `solution-repl.ts` 实时观察完整事件流

## 文件结构

```
03-sse-events/
├── solution.json                        # Solution 配置
└── skills/
    └── event-demo/
        └── SKILL.md                     # 事件演示 Skill
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-03-sse-events"
  },
  "skills": [
    { "slug": "event-demo" }
  ]
}
```

无 MCP、无模板，与 01-pure-chat 结构相同。重点在 Skill prompt 的设计。

## Skill 说明

**event-demo** -- 按步骤生成多种 SSE 事件：

1. 逐步思考（产生 `text_delta` 事件）
2. 启动后台任务（产生 `subagent_started` / `subagent_completed` 事件）
3. 使用文件工具（产生 `tool_activity` 事件）
4. 总结产生了哪些事件类型

## 运行

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-03-sse-events --test "demonstrate events" --timeout 120
```
