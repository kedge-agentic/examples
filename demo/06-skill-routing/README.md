# Demo 06: Skill Routing

演示基于触发器的 Skill 路由机制 -- 关键词和正则匹配将消息路由到专业 Skill，无匹配时走兜底 Skill。

## 核心概念

- **trigger 路由**：平台根据用户输入自动选择匹配的 Skill
- **keyword 触发**：精确关键词匹配（如 "翻译"、"计算"）
- **pattern 触发**：正则表达式匹配（如 `translate.*to`、`\d+.*[+\-*/].*\d+`）
- **priority 优先级**：数值越高优先级越高，多个匹配时选最高优先级
- **fallback 兜底**：无触发器的 Skill 作为默认兜底

## 文件结构

```
06-skill-routing/
├── solution.json                        # Solution 配置（声明三个 Skill）
└── skills/
    ├── translator/
    │   └── SKILL.md                     # 翻译 Skill（keyword + pattern 触发）
    ├── calculator/
    │   └── SKILL.md                     # 计算 Skill（keyword + pattern 触发）
    └── default-chat/
        └── SKILL.md                     # 兜底 Skill（无触发器）
```

## 配置说明

```jsonc
{
  "skills": [
    { "slug": "translator" },            // 有触发器：翻译、translate...to
    { "slug": "calculator" },            // 有触发器：计算、数学表达式
    { "slug": "default-chat" }           // 无触发器：兜底处理
  ]
}
```

路由逻辑由各 Skill 的 YAML frontmatter 中的 `triggers` 定义，solution.json 只声明 Skill 列表。

## Skill 说明

- **translator** -- 翻译助手。触发条件：关键词 "翻译"（priority 10）或正则 `translate.*to`（priority 5）
- **calculator** -- 计算助手。触发条件：关键词 "计算"（priority 10）或正则 `\d+.*[+\-*/].*\d+`（priority 5）
- **default-chat** -- 通用对话兜底。无触发器，处理所有未匹配的消息

## 运行

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-06-skill-routing

# 测试路由：
# > 翻译 hello world        → 命中 translator
# > 123 + 456               → 命中 calculator
# > 今天天气怎么样           → 命中 default-chat（兜底）
```
