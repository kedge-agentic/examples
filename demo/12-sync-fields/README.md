# Demo 12: Sync Fields

演示 syncFields -- 将 output 字段分组，前端可按组选择性订阅，实现局部同步。

## 核心概念

- **syncFields**：在 solution.json 中定义字段分组，前端按需订阅特定分组
- 避免前端接收全部字段更新，减少不必要的渲染和数据传输
- 本例将 5 个档案字段分为 `basic`（基础信息）和 `detail`（详细信息）两组
- 前端可仅订阅 `basic` 组获取姓名/邮箱/部门，或订阅 `detail` 组获取角色/简介

## 文件结构

```
12-sync-fields/
├── solution.json                        # Solution 配置（含 syncFields）
├── skills/
│   └── profile-filler/
│       └── SKILL.md                     # 档案填写 skill
└── mcp-server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── index.ts                     # write_output 工具（5 个档案字段）
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-12-sync-fields"
  },
  "syncFields": {
    "basic": ["name", "email", "department"],   // 基础信息组
    "detail": ["role", "bio"]                    // 详细信息组
  }
}
```

- 分组名称（basic/detail）由开发者自定义
- 前端通过分组名订阅，仅接收该组内字段的 output_update 事件

## Skill 说明

**profile-filler** -- 档案填写助手。引导用户逐步提供 5 个字段（name、email、department、role、bio），每收集一个字段即调用 `write_output` 写入。字段更新通过 syncFields 分组推送给前端。

## 运行

```bash
# 1. 构建 MCP Server
cd solutions/demo/12-sync-fields/mcp-server && npm install && npm run build

# 2. 运行 REPL
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-12-sync-fields
```
