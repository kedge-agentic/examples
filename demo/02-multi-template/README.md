# Demo 02: Multi-Template

演示 sessionTemplates 机制 -- 同一个 Solution 通过不同模板切换 Skill 和行为风格。

## 核心概念

- **sessionTemplates**：为同一 Solution 定义多种会话模式
- 每个模板可指定 `enabledSkills`（激活哪些 Skill）和 `appendSystemPrompt`（追加系统提示词）
- 创建会话时通过 `--template` 参数选择模板

## 文件结构

```
02-multi-template/
├── solution.json                         # Solution 配置（含两个模板）
└── skills/
    ├── formal-responder/
    │   └── SKILL.md                      # 正式风格 Skill
    └── casual-responder/
        └── SKILL.md                      # 轻松风格 Skill
```

## 配置说明

```jsonc
{
  "sessionTemplates": {
    "formal": {
      "enabledSkills": ["formal-responder"],    // 仅激活正式 Skill
      "appendSystemPrompt": "Respond in a formal, professional tone."
    },
    "casual": {
      "enabledSkills": ["casual-responder"],    // 仅激活轻松 Skill
      "appendSystemPrompt": "Respond in a casual, friendly tone."
    }
  }
}
```

- `enabledSkills` 控制该模板下哪些 Skill 可用
- `appendSystemPrompt` 在 Skill 的 SKILL.md 之后追加额外指令

## Skill 说明

- **formal-responder** -- 正式风格助手。使用完整句子、避免缩写和俚语，结构化回复。
- **casual-responder** -- 轻松风格助手。口语化表达、简洁直接、语气温暖。

## 运行

```bash
# 正式模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-04-multi-template --template formal

# 轻松模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-04-multi-template --template casual
```
