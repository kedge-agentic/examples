# Demo 09: Skill Prompt Mode

演示 skillPromptMode 配置 -- 对比 protocol（运行时获取）与 inline（嵌入系统提示词）两种加载方式。

## 核心概念

- **protocol 模式**：agent 在运行时通过协议请求读取 SKILL.md 内容
- **inline 模式**：SKILL.md 内容直接嵌入系统提示词，agent 启动即可用
- 使用海盗人设（pirate-chat）作为辨识度极高的测试 skill，便于验证加载是否成功
- 通过两个 sessionTemplate 对比同一 skill 在不同模式下的行为差异

## 文件结构

```
09-skill-prompt-mode/
├── solution.json                        # Solution 配置（含两个模板）
└── skills/
    └── pirate-chat/
        └── SKILL.md                     # 海盗人设 skill
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-09-skill-prompt-mode"
  },
  "sessionTemplates": {
    "protocol": {                        // protocol 模式
      "enabledSkills": ["pirate-chat"],
      "skillPromptMode": "protocol"
    },
    "inline": {                          // inline 模式
      "enabledSkills": ["pirate-chat"],
      "skillPromptMode": "inline"
    }
  },
  "skills": [
    { "slug": "pirate-chat" }
  ]
}
```

- `skillPromptMode: "protocol"` -- agent 运行时主动请求 SKILL.md
- `skillPromptMode: "inline"` -- SKILL.md 预嵌入 system prompt

## Skill 说明

**pirate-chat** -- 海盗船长 Captain Demo 人设。每条回复以 "Ahoy!" 开头、以签名结尾。如果 agent 用海盗腔说话，说明 skill 加载成功；否则加载失败。

## 运行

```bash
# 使用 protocol 模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-09-skill-prompt-mode --template protocol

# 使用 inline 模式
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-09-skill-prompt-mode --template inline
```
