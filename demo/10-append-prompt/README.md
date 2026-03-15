# Demo 10: Append System Prompt

演示 appendSystemPrompt -- 在可复用的基础 Skill 上叠加行为约束，无需修改 SKILL.md。

## 核心概念

- **appendSystemPrompt**：在 sessionTemplate 中追加系统提示词，作为行为覆盖层
- 同一个基础 skill（general-assistant）配合不同模板产生截然不同的行为
- 三种模板演示：简洁模式（<50 字）、详细模式（含示例）、JSON 格式模式
- 实现 skill 复用：一个 SKILL.md + 多个 sessionTemplate = 多种行为变体

## 文件结构

```
10-append-prompt/
├── solution.json                        # Solution 配置（含三个模板）
└── skills/
    └── general-assistant/
        └── SKILL.md                     # 通用助手基础 skill
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-10-append-prompt"
  },
  "sessionTemplates": {
    "concise": {                         // 简洁模式
      "enabledSkills": ["general-assistant"],
      "appendSystemPrompt": "Keep all responses under 50 words."
    },
    "detailed": {                        // 详细模式
      "enabledSkills": ["general-assistant"],
      "appendSystemPrompt": "Provide detailed answers. Include examples."
    },
    "json": {                            // JSON 格式模式
      "enabledSkills": ["general-assistant"],
      "appendSystemPrompt": "Always respond in valid JSON format."
    }
  }
}
```

- `appendSystemPrompt` 追加在 SKILL.md 内容之后，不替换原有提示词

## Skill 说明

**general-assistant** -- 极简通用助手。无特殊人设或格式要求，专为搭配 `appendSystemPrompt` 设计，体现 "基础 skill + 行为叠加" 的复用模式。

## 运行

```bash
# 简洁模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-10-append-prompt --template concise

# 详细模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-10-append-prompt --template detailed

# JSON 格式模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-10-append-prompt --template json
```
