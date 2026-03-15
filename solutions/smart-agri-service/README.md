# 慧农服 (Smart Agricultural Service)

基于 KedgeAgentic 平台的农业社会化服务 AI 助手 Demo。输入农户手机号，AI 自动调用 10 个 MCP 工具查询数据，生成个性化的农户分析报告或银行信贷评估报告。

## 双模式体验

| 模式 | 入口 | AI 角色 | 输出 |
|------|------|---------|------|
| **农户端** | 选择农户端 → 输入手机号 | 亲切的农技顾问 | 画像叙述、机会清单、政策匹配、行动方案、风险评估等 7 个维度 |
| **银行端** | 选择银行端 → 输入手机号 | 专业的信贷评估师 | 授信叙述、资产摘要、收入分析、还款记录、贷款建议等 8 个维度 |

## 快速开始

### 前提条件

CCAAS 核心后端已在 `localhost:3001` 运行：

```bash
cd packages/backend && npm run start:dev
```

### 一键启动

```bash
cd solutions/business/smart-agri-service
bash setup.sh
```

`setup.sh` 自动完成：安装依赖 → 构建 MCP Server → Seed 数据库 → 注册租户/Skill/MCP → 启动服务。

启动后：

- 前端: http://localhost:5281
- 后端: http://localhost:3003

### 体验流程

1. 打开 http://localhost:5281
2. 选择模式（农户端 / 银行端）
3. 点击"快速体验"中的预设农户，或手动输入手机号
4. AI 自动查询数据并生成分析报告，实时同步到右侧面板

## 预设测试号

界面提供 6 个快速体验按钮，覆盖所有农户类型：

| 按钮 | 手机号 | 类型 | 特征 |
|------|--------|------|------|
| 种植大户 | 13812345001 | 大户 | 50-200亩、高收入、多农机 |
| 普通农户 | 13812345011 | 中等 | 20-50亩、典型小农户 |
| 小农户 | 13812345026 | 小农 | 5-20亩、低收入 |
| 合作社 | 13812345036 | 合作社 | 200-500亩、合作经营 |
| 新农人 | 13812345041 | 新农人 | 25-35岁、经验少 |
| 经济作物 | 13812345046 | 经济作物 | 蔬果专业户 |

手机号范围 `13812345001` ~ `13812345050`，共 50 个农户均可查询。

## 架构

```
┌──────────────────────────────────────────────────────┐
│  Frontend (:5281)              React + Tailwind      │
│  ┌──────────┐  ┌──────────────────────────────────┐  │
│  │ ChatPanel│  │ FarmerProfilePanel / CreditReport │  │
│  │  (SSE)   │  │   (7~8 个结构化字段实时渲染)       │  │
│  └────┬─────┘  └──────────────────────────────────┘  │
│       │ SSE                                          │
├───────┼──────────────────────────────────────────────┤
│  CCAAS Core (:3001)           NestJS                 │
│       │ MCP (stdio)                                  │
├───────┼──────────────────────────────────────────────┤
│  MCP Server                   10 tools               │
│       │ SQLite (read-only)                           │
├───────┼──────────────────────────────────────────────┤
│  Solution Backend (:3003)     NestJS + SQLite        │
│  farmers / land / crops / equipment / loans          │
│  gov_policies / loan_products                        │
└──────────────────────────────────────────────────────┘
```

**数据流**: 用户输入手机号 → CCAAS 调度 Skill → Skill 通过 MCP 调用工具 → 工具查询 SQLite → `write_output` 将结构化数据推到前端面板

## MCP 工具

| 工具 | 用途 |
|------|------|
| `write_output` | 将结构化字段同步到前端面板 |
| `get_farmer_by_phone` | 按手机号查询农户 |
| `get_farmer_land` | 查询土地地块 |
| `get_farmer_crops` | 查询种植记录 |
| `get_farmer_equipment` | 查询农机设备 |
| `get_farmer_loans` | 查询贷款历史 |
| `get_farmer_summary` | 计算汇总指标（总面积、总收入、信用因子等） |
| `search_gov_policies` | 搜索涉农政策 |
| `search_loan_products` | 搜索贷款产品 |
| `get_market_prices` | 查询农产品市场行情 |

## Skill 定义

- **farmer-advisor** (`skills/farmer-advisor/SKILL.md`): 农户顾问角色，输出 7 个字段 — 画像叙述、机会清单、政策匹配、行动方案、经营分析、风险因素、市场展望
- **bank-assessor** (`skills/bank-assessor/SKILL.md`): 信贷评估角色，输出 8 个字段 — 授信叙述、背景信息、资产摘要、收入分析、还款记录、风险评估、贷款建议、抵押评估

## Demo 数据

`seed.ts` 生成完整的模拟数据：

- **50 个农户** — 6 种类型，随机生成姓名、年龄、地址、家庭信息
- **土地地块** — 每户 1-3 块，含面积、地类、灌溉、权属
- **种植记录** — 3 年数据，含产量、收入、成本、利润
- **农机设备** — 含品牌、购入价、现值、补贴金额
- **贷款历史** — 含银行、金额、利率、期限、逾期状态
- **15 项涉农政策** — 含政策全文，可按类别/地区/作物搜索
- **10 款贷款产品** — 含准入条件、利率、抵押要求

重新生成数据：

```bash
cd backend && npm run seed
```

## 目录结构

```
smart-agri-service/
├── solution.json          # 租户、Skill、MCP 配置
├── solution.config        # 端口配置
├── setup.sh               # 一键启动脚本
├── frontend/              # React 前端
│   └── src/
│       ├── components/    # ChatPanel, PhoneInput, Header, ...
│       ├── hooks/         # useAgriSession, useSessionHistory
│       └── types.ts       # ViewMode, DisplayData
├── backend/               # NestJS 后端 + SQLite
│   └── src/
│       ├── farmers/       # 农户数据服务
│       ├── policies/      # 政策查询服务
│       ├── loan-products/ # 贷款产品服务
│       ├── database/      # SQLite 连接与 Schema
│       └── seed.ts        # 数据生成器
├── mcp-server/            # MCP Server (10 tools)
│   └── src/
│       ├── index.ts       # 工具实现
│       ├── types.ts       # 同步字段定义
│       └── db.ts          # 数据库连接
└── skills/
    ├── farmer-advisor/    # 农户顾问 Skill
    └── bank-assessor/     # 信贷评估 Skill
```

## 技术栈

| 组件 | 技术 |
|------|------|
| 前端 | React 18, Vite, Tailwind CSS, React Router, Lucide Icons |
| 后端 | NestJS, better-sqlite3, ConfigModule |
| MCP Server | @modelcontextprotocol/sdk, better-sqlite3, Zod |
| 数据库 | SQLite (WAL mode) |
