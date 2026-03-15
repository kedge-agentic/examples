# KedgeAgentic Examples

基于 [KedgeAgentic](https://github.com/kedge-agentic) 平台构建的 Solution 示例集合。

## 目录结构

```
examples/
├── demo/               # 渐进式教学示例（12 个）
├── solutions/           # 生产级业务 Solution（2 个）
└── README.md            # 本文件
```

## Demo Solutions（教学示例）

按功能点渐进排列的 12 个示例，从最简单的纯对话到复杂的同步字段，覆盖平台全部核心能力：

| 编号 | 名称 | 核心概念 | MCP |
|------|------|----------|-----|
| 01 | [纯对话](demo/01-pure-chat/) | 最小 Skill，无工具 | 无 |
| 02 | [多模板](demo/02-multi-template/) | sessionTemplates 切换行为 | 无 |
| 03 | [SSE 事件流](demo/03-sse-events/) | 事件协议调试 | 无 |
| 04 | [write_output](demo/04-write-output/) | MCP 工具写入前端表单 | 有 |
| 05 | [Skill Frontmatter](demo/05-skill-frontmatter/) | YAML 元数据与触发器 | 无 |
| 06 | [Skill 路由](demo/06-skill-routing/) | 关键词 + 正则触发器路由 | 无 |
| 07 | [工作流 Skill](demo/07-workflow-skill/) | 顺序多步骤对话流程 | 无 |
| 08 | [输出操作](demo/08-output-operations/) | set/append/merge 三种写入模式 | 有 |
| 09 | [Skill 提示模式](demo/09-skill-prompt-mode/) | protocol vs inline 对比 | 无 |
| 10 | [追加系统提示](demo/10-append-prompt/) | 同一 Skill 不同行为叠加 | 无 |
| 11 | [工具事件触发器](demo/11-tool-event-triggers/) | MCP 结果自动映射为事件 | 有 |
| 12 | [同步字段](demo/12-sync-fields/) | 字段分组订阅 | 有 |

详见 [demo/README.md](demo/README.md)。

## Business Solutions（业务方案）

| Solution | 说明 | MCP | 模板数 | Skill 数 |
|----------|------|-----|--------|----------|
| [智慧农服](solutions/smart-agri-service/) | 农户咨询 + 信贷评估 | agri-tools (10 工具) | 2 | 2 |
| [麦肯锡顾问](solutions/mckinsey-cli/) | 结构化商业分析 | 无 | 0 | — |

## 快速上手

### 1. 启动 KedgeAgentic 后端

```bash
# 参考 KedgeAgentic 平台文档部署后端
# 默认 http://localhost:3001
```

### 2. 运行 Demo

Demo 不需要额外服务，直接通过 API 测试：

```bash
# 导入 demo solution
curl -X POST http://localhost:3001/api/v1/admin/solutions/import \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d @demo/01-pure-chat/solution.json
```

### 3. 运行 Business Solution

每个 Business Solution 都有 `setup.sh` 自动化脚本：

```bash
cd solutions/smart-agri-service
./setup.sh
```

setup.sh 会自动完成：创建 tenant → 注册 MCP → 注册 Skill → 创建 API Key → 启动服务。

## 架构原则

- **KedgeAgentic 核心** = Agent 中继 + Skill 路由 + 认证鉴权
- **Solution** = 业务逻辑 + MCP 工具 + 前端界面
- Solution 通过 `solution.json` 声明配置，通过 API 注册到平台
- Skill 定义在 `skills/*/SKILL.md`，MCP 工具在 `mcp-server/` 实现
