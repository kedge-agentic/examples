# McKinsey CLI (McKinsey 顾问式问题解决系统)

McKinsey 风格的结构化商业问题分析与解决方案生成器。

## 功能概述

提供两种交互方式：CLI 命令行工具和 Vue Web 前端。用户描述商业问题，AI 以 McKinsey 顾问的思维框架进行结构化分析（问题定义、假设树、MECE 分解、数据收集方案、综合建议），输出专业的咨询报告。

## 架构

| 组件 | 说明 |
|------|------|
| `cli/` | Node.js CLI 客户端，通过 Socket.IO 连接 CCAAS |
| `frontend/` | Vue 3 Web 前端 |
| `skills/` | mckinsey-consultant Skill 定义 |
| CCAAS 核心后端 | :3001 |

> 本方案无 MCP 工具和会话模板，AI 仅依赖 Skill 提示词进行分析。

## 技能

| 技能 | 说明 |
|------|------|
| `mckinsey-consultant` | McKinsey 风格商业顾问，结构化分析与解决方案生成 |

## 快速启动

### CLI 模式

```bash
cd solutions/business/mckinsey-cli/cli
npm install && npm run build
node dist/index.js           # 连接 CCAAS 后端
node dist/index.js --new     # 新建会话
```

### Web 前端

```bash
cd solutions/business/mckinsey-cli/frontend
npm install && npm run dev
```

> 前提：CCAAS 核心后端已在 `localhost:3001` 运行。
