# Demo Solutions — 渐进式教学示例

12 个按功能点渐进排列的示例，从最简单的纯对话到复杂的同步字段订阅，覆盖 KedgeAgentic 平台全部核心能力。

## 学习路径

```
01 纯对话 → 02 多模板 → 03 SSE事件 → 04 write_output → 05 Frontmatter → 06 路由
                                           ↓
12 同步字段 ← 11 事件触发器 ← 10 追加提示 ← 09 提示模式 ← 08 输出操作 ← 07 工作流
```

**建议按顺序学习**，每个 Demo 只引入一个新概念。

## 前置条件

- 一个有效的 API Key（admin 或 builder scope）
- CCAAS 后端可访问（默认 `https://ccaas.zhushou.one`，核心后端不开源）

## Demo 列表

### 01 — 纯对话（Pure Chat）

> 最简单的 Solution：一个 Skill，无 MCP 工具。

- **Skill**: `friendly-chat` — 友好的对话助手
- **学习重点**: Solution 最小结构 = `solution.json` + `skills/*/SKILL.md`
- **关键文件**: `solution.json`, `skills/friendly-chat/SKILL.md`

---

### 02 — 多模板（Multi-Template）

> 同一 Solution 通过 sessionTemplates 切换不同行为模式。

- **模板**: `formal`（正式模式）、`casual`（轻松模式）
- **Skill**: `formal-responder`, `casual-responder`
- **学习重点**: `sessionTemplates` 配置不同 enabledSkills + appendSystemPrompt
- **关键配置**:
  ```json
  "sessionTemplates": {
    "formal": { "enabledSkills": ["formal-responder"], "appendSystemPrompt": "..." },
    "casual": { "enabledSkills": ["casual-responder"], "appendSystemPrompt": "..." }
  }
  ```

---

### 03 — SSE 事件流（SSE Events）

> 生成丰富的事件流，用于调试和理解 CCAAS 事件协议。

- **Skill**: `event-demo` — 依次演示 text_delta、tool_activity、subagent 等事件
- **学习重点**: CCAAS SSE 事件类型（text_delta, tool_activity, agent_status, token_usage）
- **调试技巧**: 浏览器 DevTools → Network → EventStream 查看实时事件

---

### 04 — write_output 模式

> MCP 工具通过 `write_output` 实时填充前端表单字段。

- **MCP 服务器**: `demo-tools` — 提供 `write_output(field, value, preview)` 工具
- **Skill**: `demo-writer` — 调用 write_output 填充 title 和 summary 字段
- **学习重点**: write_output 的正确实现方式 — value 必须在 `content[].text` JSON 中
- **常见错误**: 把 value 放在 `_meta` 中（EventMapper 不会读取 _meta）

---

### 05 — Skill Frontmatter

> 在 SKILL.md 的 YAML frontmatter 中定义 Skill 元数据和触发器。

- **Skill**: `greeting-bot` — 多语言问候机器人
- **学习重点**: YAML frontmatter 定义 name、slug、triggers、scope 等配置
- **关键格式**:
  ```yaml
  ---
  name: Greeting Bot
  slug: greeting-bot
  triggers:
    - type: keyword
      value: "hello"
      priority: 10
  ---
  ```

---

### 06 — Skill 路由（Skill Routing）

> 基于触发器将消息路由到不同的专业 Skill。

- **Skill**: `translator`（翻译）、`calculator`（计算）、`default-chat`（兜底）
- **学习重点**: keyword 触发器（"翻译"、"计算"）+ pattern 正则触发器 + 优先级 + 兜底路由
- **路由逻辑**: 用户输入 → 匹配触发器 → 选择最高优先级 Skill → 未匹配则走 default-chat

---

### 07 — 工作流 Skill（Workflow Skill）

> 强制顺序执行的多步骤对话流程。

- **Skill**: `survey-bot`（类型 `type: workflow`）— 调查问卷收集
- **步骤**: 姓名 → 主题 → 确认
- **学习重点**: `type: workflow` 强制严格步骤顺序，不允许跳步或合并提问
- **关键规则**: 用户跳步时礼貌引导回当前步骤

---

### 08 — 输出操作（Output Operations）

> write_output 的三种操作模式：set（替换）、append（追加）、merge（合并）。

- **MCP 服务器**: `demo-tools` — write_output 支持 operation 参数
- **Skill**: `list-builder` — 待办列表构建器
- **学习重点**:
  | 操作 | 用途 | 示例 |
  |------|------|------|
  | `set` | 替换整个字段 | 设置标题（string） |
  | `append` | 向数组追加 | 添加待办项（array） |
  | `merge` | 合并对象字段 | 更新配置（object） |

---

### 09 — Skill 提示模式（Skill Prompt Mode）

> 对比两种 Skill 加载方式：protocol（运行时读取）vs inline（嵌入系统提示）。

- **模板**: `protocol`（运行时读取 SKILL.md）、`inline`（SKILL.md 嵌入 system prompt）
- **Skill**: `pirate-chat` — 海盗风格对话（用显著风格验证 Skill 是否生效）
- **学习重点**: `skillPromptMode: "protocol"` vs `"inline"` 的行为差异
- **验证方法**: 相同问题，protocol 和 inline 模板应产生相同的海盗风格回复

---

### 10 — 追加系统提示（Append System Prompt）

> 同一个基础 Skill 通过不同的 appendSystemPrompt 叠加不同行为。

- **模板**: `concise`（简洁 < 50 词）、`detailed`（详细带示例）、`json`（JSON 格式输出）
- **Skill**: `general-assistant` — 极简通用助手（无特殊格式要求）
- **学习重点**: appendSystemPrompt 是行为修饰层，基础 Skill 保持通用，模板叠加具体约束
- **设计模式**: 基础 Skill 可复用 + 模板定制行为 = 组合式 Solution 设计

---

### 11 — 工具事件触发器（Tool Event Triggers）

> MCP 工具返回普通 JSON，solution.json 自动映射为 output_update 事件。

- **MCP 服务器**: `demo-tools` — `calculate_score(input, criteria)`, `generate_summary(text)`
- **Skill**: `scorer` — 评分代理
- **学习重点**: `toolEventTriggers` 配置让 MCP 工具无需实现 OutputUpdatePayloadSchema
- **关键配置**:
  ```json
  "toolEventTriggers": {
    "calculate_score": {
      "targetEvent": "output_update",
      "fieldMapping": { "score": "score", "breakdown": "breakdown" }
    }
  }
  ```
- **优势**: MCP 工具保持简单，事件映射由平台配置完成

---

### 12 — 同步字段（Sync Fields）

> 将输出字段分组，前端可选择性订阅特定分组。

- **MCP 服务器**: `demo-tools` — write_output 支持 5 个 profile 字段
- **Skill**: `profile-filler` — 用户档案收集
- **学习重点**: `syncFields` 定义字段分组，前端按组订阅而非全量监听
- **关键配置**:
  ```json
  "syncFields": {
    "basic": ["name", "email", "department"],
    "detail": ["role", "bio"]
  }
  ```
- **应用场景**: 大型表单只更新当前可见区域，减少不必要的渲染

## 运行方式

使用 `setup.sh` 一键导入 Demo 到托管后端：

```bash
# 1. 配置 API Key
cp .env.example .env
# 编辑 .env 设置 CCAAS_API_KEY

# 2. 导入 Demo（两种方式均可）
cd 01-pure-chat && ../setup.sh    # 从子目录运行
./setup.sh 01-pure-chat            # 从 demo/ 目录运行

# 3. 测试
curl -N -X POST https://ccaas.zhushou.one/api/v1/sessions/test-1/messages \
  -H "Authorization: Bearer $CCAAS_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"message":"你好","tenantId":"demo-02-pure-chat"}'
```

`setup.sh` 自动完成：导入 solution.json（创建 tenant + MCP + 模板）→ 注册 Skills。

默认连接 `https://ccaas.zhushou.one`，可通过 `.env` 中的 `CCAAS_URL` 修改。

### 有 MCP 的 Demo（04, 08, 11, 12）

MCP 服务器由平台托管，`setup.sh` 会自动注册配置，无需本地构建。

## 文件结构规范

每个 Demo 遵循统一结构：

```
solutions/demo/{N}-{name}/
├── solution.json          # 平台配置（必需）
├── skills/
│   └── {skill-name}/
│       └── SKILL.md       # Skill 定义（必需）
└── mcp-server/            # MCP 服务器（如需工具）
    ├── src/index.ts
    └── package.json
```

## solution.json 规范（v3.0）

```json
{
  "schemaVersion": "3.0",
  "tenant": { "name": "...", "slug": "...", "description": "..." },
  "mcpServers": { "server-name": { "command": "node", "args": [...], "type": "stdio" } },
  "sessionTemplates": { "template-name": { "enabledSkills": [...], "appendSystemPrompt": "..." } },
  "skills": [ { "slug": "...", "name": "..." } ],
  "syncFields": { "group-name": ["field1", "field2"] },
  "toolEventTriggers": { "tool-name": { "targetEvent": "output_update", "fieldMapping": {...} } }
}
```
