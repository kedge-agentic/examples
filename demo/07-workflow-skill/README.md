# Demo 07: Workflow Skill

演示 workflow 类型 Skill -- 强制多步骤按序执行，不允许跳步或合并步骤。

## 核心概念

- **workflow 类型**：在 SKILL.md frontmatter 中设置 `type: workflow`，平台会强制步骤顺序
- 与默认 `type: chat` 不同，workflow 类型要求 agent 严格按定义的步骤逐一执行
- 适用于问卷调查、表单收集、审批流程等需要严格顺序的场景

## 文件结构

```
07-workflow-skill/
├── solution.json                        # Solution 配置
└── skills/
    └── survey-bot/
        └── SKILL.md                     # Workflow skill（3 步调查问卷）
```

## 配置说明

```jsonc
{
  "schemaVersion": "3.0",
  "tenant": {
    "slug": "demo-07-workflow-skill"     // 唯一标识符
  },
  "skills": [
    { "slug": "survey-bot" }             // workflow 类型 skill
  ]
}
```

- `solution.json` 无需特殊配置，workflow 行为由 SKILL.md 的 frontmatter 控制

## Skill 说明

**survey-bot** -- 三步调查问卷助手（workflow 类型）：
1. 收集用户姓名
2. 收集反馈主题（产品质量/客服/网站体验/其他）
3. 确认并汇总

如果用户试图跳步，agent 会礼貌地引导回当前步骤。

## 运行

```bash
npx ts-node --project tools/tsconfig.json --transpile-only \
  tools/solution-repl.ts demo-07-workflow-skill
```
