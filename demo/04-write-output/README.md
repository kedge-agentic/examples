# Demo 04: write_output

演示 `write_output` MCP 工具的正确实现 -- Agent 通过 MCP 工具将结构化数据写入前端表单字段。

## 核心概念

- **write_output 模式**：MCP 工具通过 SSE 实时填充前端表单字段
- **关键规则**：`value` 必须放在 `content[].text` 的 JSON 中，**不是** `_meta`
- 每个字段需要单独调用一次 `write_output`
- 本 demo 包含一个完整的 MCP Server 实现

## 文件结构

```
04-write-output/
├── solution.json                        # Solution 配置（含 MCP Server 声明）
├── skills/
│   └── demo-writer/
│       └── SKILL.md                     # 演示 write_output 调用的 Skill
└── mcp-server/
    ├── package.json                     # MCP Server 依赖
    ├── tsconfig.json
    └── src/
        └── index.ts                     # MCP Server 实现（write_output 工具）
```

## 配置说明

```jsonc
{
  "mcpServers": {
    "demo-tools": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"],    // 指向编译后的 JS
      "type": "stdio"                           // 通过 stdio 通信
    }
  }
}
```

- `mcpServers` 声明 MCP Server，平台启动会话时自动拉起
- `type: "stdio"` 表示通过标准输入输出与 MCP Server 通信

## Skill 说明

**demo-writer** -- 调用 `write_output(field, value, preview)` 分别填充 `title` 和 `summary` 两个字段，演示前端表单实时填充的完整流程。

## 运行

```bash
# 1. 先构建 MCP Server
cd solutions/demo/04-write-output/mcp-server
npm install
npm run build

# 2. 运行 Solution
cd ../../../..
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-01-write-output --test "fill the demo form"
```
