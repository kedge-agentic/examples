# Demo 01: Pure Chat

最简可运行 Solution -- 仅一个 Skill，无 MCP，无模板。新手入门的最佳起点。

## 核心概念

- **最小可行 Solution 结构**：只需 `solution.json` + 一个 `SKILL.md` 即可运行
- 不依赖 MCP Server、sessionTemplates 或任何外部工具
- 演示 `schemaVersion: "3.0"` 的最简配置

## 文件结构

```
01-pure-chat/
├── solution.json                        # Solution 配置
└── skills/
    └── friendly-chat/
        └── SKILL.md                     # Skill prompt（友好对话助手）
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-02-pure-chat"        // 唯一标识符
  },
  "skills": [
    { "slug": "friendly-chat" }         // 引用 skills/ 目录下的 Skill
  ]
}
```

- `slug` 是 Solution 在平台中的唯一 ID
- `skills` 数组中每个条目对应 `skills/{slug}/SKILL.md`

## Skill 说明

**friendly-chat** -- 友好对话助手。无工具调用，纯文本对话。收到问候则回应问候，收到问题则简洁回答。

## 运行

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-02-pure-chat
```
