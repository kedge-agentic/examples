# Demo 11: Tool Event Triggers

演示 toolEventTriggers -- MCP 工具返回普通 JSON，平台通过配置自动映射为 output_update 事件。

## 核心概念

- **toolEventTriggers**：在 solution.json 中声明工具结果到事件的映射规则
- MCP 工具无需感知平台协议，只返回普通 JSON 即可
- 平台拦截工具返回值，按 `fieldMapping` 提取字段并发送 `output_update` 事件
- 实现 MCP 工具与平台事件系统的解耦

## 文件结构

```
11-tool-event-triggers/
├── solution.json                        # Solution 配置（含 toolEventTriggers）
├── skills/
│   └── scorer/
│       └── SKILL.md                     # 评分 skill
└── mcp-server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts                     # calculate_score + generate_summary 工具
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-11-tool-event-triggers"
  },
  "toolEventTriggers": {
    "calculate_score": {                 // 工具名
      "targetEvent": "output_update",    // 目标事件类型
      "fieldMapping": {                  // JSON 字段 -> output 字段
        "score": "score",
        "breakdown": "breakdown"
      }
    },
    "generate_summary": {
      "targetEvent": "output_update",
      "fieldMapping": {
        "summary": "summary"
      }
    }
  }
}
```

- `fieldMapping` 的 key 是工具返回 JSON 中的字段名，value 是前端接收的 output 字段名

## Skill 说明

**scorer** -- 评分助手。接收用户文本后调用 `calculate_score` 获取评分和维度分解，调用 `generate_summary` 获取摘要。工具返回纯 JSON，平台自动转为前端可消费的 output_update 事件。

## 运行

```bash
# 1. 构建 MCP Server
cd solutions/demo/11-tool-event-triggers/mcp-server && npm install && npm run build

# 2. 运行 REPL
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-11-tool-event-triggers
```
