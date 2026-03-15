# Demo 08: Output Operations

演示 write_output 的三种操作模式 -- set（替换）、append（追加到数组）、merge（合并到对象）。

## 核心概念

- **set 操作**：整体替换字段值，适用于标题等标量字段
- **append 操作**：向数组字段追加元素，适用于列表项
- **merge 操作**：将对象浅合并到现有对象字段，适用于配置项
- MCP 工具通过 `operation` 参数指定操作类型，平台按类型执行不同的数据更新逻辑

## 文件结构

```
08-output-operations/
├── solution.json                        # Solution 配置（含 MCP Server）
├── skills/
│   └── list-builder/
│       └── SKILL.md                     # Todo 列表构建 skill
└── mcp-server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts                     # write_output 工具（支持 set/append/merge）
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-08-output-operations"
  },
  "mcpServers": {
    "demo-tools": {
      "command": "node",
      "args": ["mcp-server/dist/index.js"]  // 需要先构建
    }
  },
  "skills": [
    { "slug": "list-builder" }
  ]
}
```

## Skill 说明

**list-builder** -- Todo 列表构建助手：
- `set` 设置列表标题（title 字段）
- `append` 逐条添加待办项（items 数组）
- `merge` 更新列表配置如优先级、截止日期（config 对象）

## 运行

```bash
# 1. 构建 MCP Server
cd solutions/demo/08-output-operations/mcp-server && npm install && npm run build

# 2. 运行 REPL
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-08-output-operations
```
