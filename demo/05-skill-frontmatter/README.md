# Demo 05: Skill Frontmatter

演示 SKILL.md 的 YAML frontmatter 机制 -- 在 Skill 文件中直接声明触发器、元数据和作用域等配置。

## 核心概念

- **YAML frontmatter**：在 SKILL.md 顶部用 `---` 包裹的 YAML 块
- 支持声明 `triggers`（触发条件）、`scope`（作用域）、`allowedTools`（工具白名单）等
- 无需额外 JSON 配置文件，所有 Skill 配置集中在 SKILL.md 一个文件中

## 文件结构

```
05-skill-frontmatter/
├── solution.json                        # Solution 配置
└── skills/
    └── greeting-bot/
        └── SKILL.md                     # 含 YAML frontmatter 的 Skill
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-05-skill-frontmatter"
  },
  "skills": [
    { "slug": "greeting-bot" }
  ]
}
```

Solution 本身无特殊配置，核心在 SKILL.md 的 frontmatter。

## Skill 说明

**greeting-bot** -- 多语言问候机器人。SKILL.md 的 frontmatter 示例：

```yaml
---
name: Greeting Bot
slug: greeting-bot
type: prompt
scope: tenant
triggers:
  - type: keyword
    value: "hello"
    priority: 10
  - type: keyword
    value: "你好"
    priority: 10
allowedTools: []
---
```

- `triggers`：定义关键词触发，输入 "hello" 或 "你好" 时激活此 Skill
- `scope: tenant`：Skill 在租户级别生效
- `allowedTools: []`：不使用任何 MCP 工具

## 运行

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-05-skill-frontmatter
```
