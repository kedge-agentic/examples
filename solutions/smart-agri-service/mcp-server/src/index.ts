#!/usr/bin/env node
/**
 * Smart Agricultural Service MCP Server (慧农服 MCP 服务器)
 *
 * Provides tools for:
 * 1. write_output - Send structured data to the frontend views
 * 2. get_farmer_by_phone - Look up farmer by phone number
 * 3. get_farmer_land - Get farmer's land parcels
 * 4. get_farmer_crops - Get farmer's crop records
 * 5. get_farmer_equipment - Get farmer's equipment
 * 6. get_farmer_loans - Get farmer's loan history
 * 7. get_farmer_summary - Get computed financial/asset summary
 * 8. search_gov_policies - Search government agricultural policies
 * 9. search_loan_products - Search available loan products
 * 10. get_market_prices - Get current market prices
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { SYNC_FIELDS, type SyncField, type WriteOutputInput, type WriteOutputResult } from './types.js';
import { getDb } from './db.js';

// Create the MCP server
const server = new Server(
  {
    name: 'smart-agri-service',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ===== Tool Definitions =====

// Tool 1: write_output
const writeOutputTool: Tool = {
  name: 'write_output',
  description: `将结构化数据写入前端视图。前端将显示"同步到表单"按钮，允许用户应用更改。
Write structured data to the frontend view. The frontend will display a "Sync to Form" button.

**Farmer view fields (农户视图):**
- narrative_profile: 农户画像叙述 (string, markdown)
- farming_analysis: 种植经营分析 (string, markdown)
- opportunity_list: 发展机遇清单 (string, markdown)
- policy_matches: 政策匹配结果 (string, markdown)
- action_plan: 行动计划建议 (string, markdown)
- risk_factors: 风险因素分析 (string, markdown)
- market_outlook: 市场行情展望 (string, markdown)

**Bank view fields (银行视图):**
- credit_narrative: 信用评估叙述 (string, markdown)
- farmer_background: 农户背景信息 (string, markdown)
- asset_summary: 资产概况 (string, markdown)
- income_analysis: 收入分析 (string, markdown)
- repayment_history: 还款历史 (string, markdown)
- risk_assessment: 风险评估 (string, markdown)
- loan_recommendation: 贷款建议 (string, markdown)
- collateral_evaluation: 抵押物评估 (string, markdown)

Example:
{
  "field": "narrative_profile",
  "value": "## 农户画像\\n张三，山东省济宁市汶上县农民...",
  "preview": "农户画像: 张三"
}`,
  inputSchema: {
    type: 'object',
    properties: {
      field: {
        type: 'string',
        enum: [...SYNC_FIELDS],
        description: 'The field to update (农户视图或银行视图字段)',
      },
      value: {
        oneOf: [
          { type: 'string', description: 'Markdown text content' },
          { type: 'object', description: 'Structured object data' },
          { type: 'array', description: 'Array data' },
        ],
        description: 'The value for the field',
      },
      preview: {
        type: 'string',
        description: 'Human-readable summary shown on the sync button (同步按钮上显示的摘要)',
      },
    },
    required: ['field', 'value', 'preview'],
  },
};

// Tool 2: get_farmer_by_phone
const getFarmerByPhoneTool: Tool = {
  name: 'get_farmer_by_phone',
  description: `通过手机号查询农户信息。
Look up a farmer by their phone number.

Returns: farmer record with id, name, phone, id_number, gender, birth_date, address, village, township, county, province, farming_years, education, family_size, household_income, credit_score.

Returns error if farmer not found.

Example: { "phone": "13800138001" }`,
  inputSchema: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        description: '农户手机号 (e.g., "13800138001")',
      },
    },
    required: ['phone'],
  },
};

// Tool 3: get_farmer_land
const getFarmerLandTool: Tool = {
  name: 'get_farmer_land',
  description: `查询农户的土地信息。
Get all land parcels for a farmer.

Returns: array of land parcels with id, farmer_id, parcel_name, area_mu, land_type (耕地/林地/园地), ownership_type (自有/租赁), soil_quality, irrigation_type, location, certificate_no.

Example: { "farmer_id": "F001" }`,
  inputSchema: {
    type: 'object',
    properties: {
      farmer_id: {
        type: 'string',
        description: '农户ID (e.g., "F001")',
      },
    },
    required: ['farmer_id'],
  },
};

// Tool 4: get_farmer_crops
const getFarmerCropsTool: Tool = {
  name: 'get_farmer_crops',
  description: `查询农户的种植记录，可选按年份筛选。
Get crop records for a farmer, optionally filtered by year.

Returns: array of crop records with id, farmer_id, parcel_id, crop_name, year, season, area_mu, yield_kg, revenue_yuan, cost_yuan, subsidy_yuan.

Example: { "farmer_id": "F001" }
Example with year: { "farmer_id": "F001", "year": 2025 }`,
  inputSchema: {
    type: 'object',
    properties: {
      farmer_id: {
        type: 'string',
        description: '农户ID (e.g., "F001")',
      },
      year: {
        type: 'number',
        description: '年份筛选 (可选, e.g., 2025)',
      },
    },
    required: ['farmer_id'],
  },
};

// Tool 5: get_farmer_equipment
const getFarmerEquipmentTool: Tool = {
  name: 'get_farmer_equipment',
  description: `查询农户的农机设备信息。
Get equipment owned by a farmer.

Returns: array of equipment with id, farmer_id, equipment_name, equipment_type, brand, purchase_date, purchase_price, current_value, subsidy_amount, status (在用/闲置/报废).

Example: { "farmer_id": "F001" }`,
  inputSchema: {
    type: 'object',
    properties: {
      farmer_id: {
        type: 'string',
        description: '农户ID (e.g., "F001")',
      },
    },
    required: ['farmer_id'],
  },
};

// Tool 6: get_farmer_loans
const getFarmerLoansTool: Tool = {
  name: 'get_farmer_loans',
  description: `查询农户的贷款历史记录。
Get loan history for a farmer.

Returns: array of loans with id, farmer_id, bank_name, product_name, loan_amount, remaining_amount, interest_rate, start_date, end_date, status (正常/已结清/逾期), repaid_amount, overdue_days, collateral_type, collateral_value.

Example: { "farmer_id": "F001" }`,
  inputSchema: {
    type: 'object',
    properties: {
      farmer_id: {
        type: 'string',
        description: '农户ID (e.g., "F001")',
      },
    },
    required: ['farmer_id'],
  },
};

// Tool 7: get_farmer_summary
const getFarmerSummaryTool: Tool = {
  name: 'get_farmer_summary',
  description: `获取农户综合概况，包括计算汇总数据。
Get a computed financial and asset summary for a farmer.

Returns:
- total_land_mu: 总土地面积(亩)
- total_owned_land_mu: 自有土地面积
- total_rented_land_mu: 租赁土地面积
- latest_year_revenue: 最近年度总收入
- latest_year_cost: 最近年度总成本
- latest_year_profit: 最近年度利润
- avg_yield_per_mu: 平均亩产(公斤)
- total_equipment_value: 设备总价值
- total_subsidy_received: 设备补贴总额
- active_loans_count: 活跃贷款数
- active_loans_total: 活跃贷款总额
- total_repaid: 已还款总额
- has_overdue: 是否有逾期
- farming_years: 务农年数
- credit_score_factors: 信用评分因素

Example: { "farmer_id": "F001" }`,
  inputSchema: {
    type: 'object',
    properties: {
      farmer_id: {
        type: 'string',
        description: '农户ID (e.g., "F001")',
      },
    },
    required: ['farmer_id'],
  },
};

// Tool 8: search_gov_policies
const searchGovPoliciesTool: Tool = {
  name: 'search_gov_policies',
  description: `搜索政府农业政策。
Search government agricultural policies with optional filters.

Returns: array of policies with id, title, category, region, crop_type, summary, subsidy_amount, eligibility, start_date, end_date, source.

Filters (all optional):
- category: 政策类别 (e.g., "种植补贴", "农机补贴", "保险", "贷款贴息")
- region: 地区 (e.g., "山东省", "济宁市")
- crop_type: 作物类型 (e.g., "小麦", "玉米")
- keyword: 关键词搜索标题和摘要

Example: { "category": "种植补贴", "region": "山东省" }
Example: { "keyword": "小麦" }`,
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: '政策类别 (e.g., "种植补贴", "农机补贴", "保险", "贷款贴息")',
      },
      region: {
        type: 'string',
        description: '地区 (e.g., "山东省", "济宁市")',
      },
      crop_type: {
        type: 'string',
        description: '作物类型 (e.g., "小麦", "玉米")',
      },
      keyword: {
        type: 'string',
        description: '关键词搜索标题和摘要',
      },
    },
  },
};

// Tool 11: get_policy_document
const getPolicyDocumentTool: Tool = {
  name: 'get_policy_document',
  description: `获取政策文件完整原文。
Get the full text of a government policy document.

Returns the complete policy document including:
- doc_number: 文号 (e.g., "冀农办发〔2026〕3号")
- full_text: 完整政策原文（含条款编号、附则）
- attachments: 附件列表

Only available for policies that have full_text (check has_full_text field from search_gov_policies).
Use this to cite specific articles/clauses when advising farmers or assessing credit.

Example: { "policy_id": "uuid-of-policy" }`,
  inputSchema: {
    type: 'object',
    properties: {
      policy_id: {
        type: 'string',
        description: '政策ID (from search_gov_policies results)',
      },
    },
    required: ['policy_id'],
  },
};

// Tool 9: search_loan_products
const searchLoanProductsTool: Tool = {
  name: 'search_loan_products',
  description: `搜索可用的贷款产品。
Search available loan products with optional filters.

Returns: array of loan products with id, bank_name, product_name, min_amount, max_amount, interest_rate_min, interest_rate_max, term_months_min, term_months_max, collateral_required, description, eligibility, features.

Filters (all optional):
- bank_name: 银行名称 (e.g., "农业银行", "邮储银行")
- min_amount: 最低贷款金额
- max_amount: 最高贷款金额
- keyword: 关键词搜索产品名称和描述

Example: { "bank_name": "农业银行" }
Example: { "max_amount": 100000 }`,
  inputSchema: {
    type: 'object',
    properties: {
      bank_name: {
        type: 'string',
        description: '银行名称 (e.g., "农业银行", "邮储银行")',
      },
      min_amount: {
        type: 'number',
        description: '最低贷款金额筛选',
      },
      max_amount: {
        type: 'number',
        description: '最高贷款金额筛选',
      },
      keyword: {
        type: 'string',
        description: '关键词搜索产品名称和描述',
      },
    },
  },
};

// Tool 10: get_market_prices
const getMarketPricesTool: Tool = {
  name: 'get_market_prices',
  description: `获取当前农产品和农资市场价格。
Get current market prices for agricultural products and inputs.

Returns:
- grains: 粮食价格 (水稻、油菜籽、毛豆、蔬菜)
- inputs: 农资价格 (尿素、复合肥、柴油)
- update_date: 数据更新日期

No parameters required.`,
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

// ===== Request Handlers =====

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      writeOutputTool,
      getFarmerByPhoneTool,
      getFarmerLandTool,
      getFarmerCropsTool,
      getFarmerEquipmentTool,
      getFarmerLoansTool,
      getFarmerSummaryTool,
      searchGovPoliciesTool,
      getPolicyDocumentTool,
      searchLoanProductsTool,
      getMarketPricesTool,
    ],
  };
});

// Handle call_tool request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // ===== Tool 1: write_output =====
  if (name === 'write_output') {
    const input = args as unknown as WriteOutputInput;

    // Validate the field name
    if (!SYNC_FIELDS.includes(input.field as SyncField)) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Invalid field: ${input.field}. Valid fields are: ${SYNC_FIELDS.join(', ')}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }

    // Return the result - EventMapper looks for { data: ..., status: ... } structure
    const result: WriteOutputResult = {
      data: {
        field: input.field,
        value: input.value,
        preview: input.preview,
      },
      status: 'success',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result),
        },
      ],
    };
  }

  // ===== Tool 2: get_farmer_by_phone =====
  if (name === 'get_farmer_by_phone') {
    const { phone } = args as { phone: string };

    try {
      const db = getDb();
      const farmer = db.prepare('SELECT * FROM farmers WHERE phone = ?').get(phone);

      if (!farmer) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                data: { error: `未找到手机号为 ${phone} 的农户 (Farmer not found with phone: ${phone})` },
                status: 'error',
              } satisfies WriteOutputResult),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(farmer, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_by_phone] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 3: get_farmer_land =====
  if (name === 'get_farmer_land') {
    const { farmer_id } = args as { farmer_id: string };

    try {
      const db = getDb();
      const parcels = db.prepare('SELECT * FROM land_parcels WHERE farmer_id = ?').all(farmer_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              farmer_id,
              count: parcels.length,
              parcels,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_land] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 4: get_farmer_crops =====
  if (name === 'get_farmer_crops') {
    const { farmer_id, year } = args as { farmer_id: string; year?: number };

    try {
      const db = getDb();
      let crops;

      if (year !== undefined) {
        crops = db.prepare('SELECT * FROM crop_records WHERE farmer_id = ? AND year = ? ORDER BY year DESC, season').all(farmer_id, year);
      } else {
        crops = db.prepare('SELECT * FROM crop_records WHERE farmer_id = ? ORDER BY year DESC, season').all(farmer_id);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              farmer_id,
              year: year ?? 'all',
              count: crops.length,
              crops,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_crops] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 5: get_farmer_equipment =====
  if (name === 'get_farmer_equipment') {
    const { farmer_id } = args as { farmer_id: string };

    try {
      const db = getDb();
      const equipment = db.prepare('SELECT * FROM equipment WHERE farmer_id = ?').all(farmer_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              farmer_id,
              count: equipment.length,
              equipment,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_equipment] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 6: get_farmer_loans =====
  if (name === 'get_farmer_loans') {
    const { farmer_id } = args as { farmer_id: string };

    try {
      const db = getDb();
      const loans = db.prepare('SELECT * FROM loan_history WHERE farmer_id = ?').all(farmer_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              farmer_id,
              count: loans.length,
              loans,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_loans] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 7: get_farmer_summary =====
  if (name === 'get_farmer_summary') {
    const { farmer_id } = args as { farmer_id: string };

    try {
      const db = getDb();

      // Get farmer record
      const farmer = db.prepare('SELECT * FROM farmers WHERE id = ?').get(farmer_id) as Record<string, unknown> | undefined;
      if (!farmer) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                data: { error: `未找到农户ID: ${farmer_id} (Farmer not found)` },
                status: 'error',
              } satisfies WriteOutputResult),
            },
          ],
          isError: true,
        };
      }

      // Land summary
      const landRows = db.prepare('SELECT * FROM land_parcels WHERE farmer_id = ?').all(farmer_id) as Record<string, unknown>[];
      const totalLandMu = landRows.reduce((sum, r) => sum + (Number(r.area_mu) || 0), 0);
      const totalOwnedLandMu = landRows
        .filter(r => r.ownership_type === '自有')
        .reduce((sum, r) => sum + (Number(r.area_mu) || 0), 0);
      const totalRentedLandMu = landRows
        .filter(r => r.ownership_type === '租赁')
        .reduce((sum, r) => sum + (Number(r.area_mu) || 0), 0);

      // Crop summary - find latest year
      const allCrops = db.prepare('SELECT * FROM crop_records WHERE farmer_id = ? ORDER BY year DESC').all(farmer_id) as Record<string, unknown>[];
      const latestYear = allCrops.length > 0 ? Number(allCrops[0].year) : null;
      const latestYearCrops = latestYear
        ? allCrops.filter(c => Number(c.year) === latestYear)
        : [];
      const latestYearRevenue = latestYearCrops.reduce((sum, c) => sum + (Number(c.revenue_yuan) || 0), 0);
      const latestYearCost = latestYearCrops.reduce((sum, c) => sum + (Number(c.cost_yuan) || 0), 0);
      const latestYearProfit = latestYearRevenue - latestYearCost;

      // Average yield per mu across all crops
      const cropsWithYield = allCrops.filter(c => Number(c.yield_kg) > 0 && Number(c.area_mu) > 0);
      const avgYieldPerMu = cropsWithYield.length > 0
        ? cropsWithYield.reduce((sum, c) => sum + (Number(c.yield_kg) / Number(c.area_mu)), 0) / cropsWithYield.length
        : 0;

      // Equipment summary
      const equipmentRows = db.prepare('SELECT * FROM equipment WHERE farmer_id = ?').all(farmer_id) as Record<string, unknown>[];
      const totalEquipmentValue = equipmentRows.reduce((sum, e) => sum + (Number(e.current_value) || 0), 0);
      const totalSubsidyReceived = equipmentRows.reduce((sum, e) => sum + (Number(e.subsidy_amount) || 0), 0);

      // Loan summary
      const loanRows = db.prepare('SELECT * FROM loan_history WHERE farmer_id = ?').all(farmer_id) as Record<string, unknown>[];
      const activeLoans = loanRows.filter(l => l.status !== '已结清');
      const activeLoansCount = activeLoans.length;
      const activeLoansTotal = activeLoans.reduce((sum, l) => sum + (Number(l.remaining_amount) || 0), 0);
      const totalRepaid = loanRows.reduce((sum, l) => sum + (Number(l.repaid_amount) || 0), 0);
      const hasOverdue = loanRows.some(l => l.status === '逾期' || (Number(l.overdue_days) || 0) > 0);

      // Credit score factors
      const creditScoreFactors = {
        has_land: landRows.length > 0,
        has_equipment: equipmentRows.length > 0,
        has_history: loanRows.length > 0,
        no_overdue: !hasOverdue,
      };

      const summary = {
        farmer_id,
        farmer_name: farmer.name,
        total_land_mu: Math.round(totalLandMu * 100) / 100,
        total_owned_land_mu: Math.round(totalOwnedLandMu * 100) / 100,
        total_rented_land_mu: Math.round(totalRentedLandMu * 100) / 100,
        latest_year: latestYear,
        latest_year_revenue: Math.round(latestYearRevenue * 100) / 100,
        latest_year_cost: Math.round(latestYearCost * 100) / 100,
        latest_year_profit: Math.round(latestYearProfit * 100) / 100,
        avg_yield_per_mu: Math.round(avgYieldPerMu * 100) / 100,
        total_equipment_value: Math.round(totalEquipmentValue * 100) / 100,
        total_subsidy_received: Math.round(totalSubsidyReceived * 100) / 100,
        active_loans_count: activeLoansCount,
        active_loans_total: Math.round(activeLoansTotal * 100) / 100,
        total_repaid: Math.round(totalRepaid * 100) / 100,
        has_overdue: hasOverdue,
        farming_years: farmer.farming_years,
        credit_score_factors: creditScoreFactors,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_farmer_summary] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 8: search_gov_policies =====
  if (name === 'search_gov_policies') {
    const { category, region, crop_type, keyword } = args as {
      category?: string;
      region?: string;
      crop_type?: string;
      keyword?: string;
    };

    try {
      const db = getDb();
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (category) {
        conditions.push('category = ?');
        params.push(category);
      }
      if (region) {
        conditions.push('(region = ? OR region LIKE ?)');
        params.push(region, `%${region}%`);
      }
      if (crop_type) {
        conditions.push('(crop_type = ? OR crop_type LIKE ?)');
        params.push(crop_type, `%${crop_type}%`);
      }
      if (keyword) {
        conditions.push('(policy_name LIKE ? OR description LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT * FROM gov_policies ${whereClause} ORDER BY publish_date DESC`;
      const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];

      // Add has_full_text flag, exclude full_text from list results to save bandwidth
      const policies = rows.map(row => {
        const { full_text, ...rest } = row;
        return { ...rest, has_full_text: !!full_text };
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: policies.length,
              filters: { category, region, crop_type, keyword },
              policies,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[search_gov_policies] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 11: get_policy_document =====
  if (name === 'get_policy_document') {
    const { policy_id } = args as { policy_id: string };

    try {
      const db = getDb();
      const policy = db.prepare('SELECT * FROM gov_policies WHERE id = ?').get(policy_id) as Record<string, unknown> | undefined;

      if (!policy) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                data: { error: `未找到政策ID: ${policy_id} (Policy not found)` },
                status: 'error',
              } satisfies WriteOutputResult),
            },
          ],
          isError: true,
        };
      }

      if (!policy.full_text) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                policy_id,
                policy_name: policy.policy_name,
                has_full_text: false,
                message: '该政策暂无完整原文，仅有简要描述。',
                description: policy.description,
              }, null, 2),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              policy_id,
              policy_name: policy.policy_name,
              doc_number: policy.doc_number,
              has_full_text: true,
              full_text: policy.full_text,
              attachments: policy.attachments ? JSON.parse(policy.attachments as string) : [],
              category: policy.category,
              benefit_amount: policy.benefit_amount,
              deadline: policy.deadline,
              source: policy.source,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[get_policy_document] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 9: search_loan_products =====
  if (name === 'search_loan_products') {
    const { bank_name, min_amount, max_amount, keyword } = args as {
      bank_name?: string;
      min_amount?: number;
      max_amount?: number;
      keyword?: string;
    };

    try {
      const db = getDb();
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (bank_name) {
        conditions.push('bank_name = ?');
        params.push(bank_name);
      }
      if (min_amount !== undefined) {
        conditions.push('max_amount >= ?');
        params.push(min_amount);
      }
      if (max_amount !== undefined) {
        conditions.push('min_amount <= ?');
        params.push(max_amount);
      }
      if (keyword) {
        conditions.push('(product_name LIKE ? OR description LIKE ?)');
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sql = `SELECT * FROM loan_products ${whereClause} ORDER BY bank_name, product_name`;
      const products = db.prepare(sql).all(...params);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              count: products.length,
              filters: { bank_name, min_amount, max_amount, keyword },
              products,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[search_loan_products] Error:`, message);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              data: { error: `Database error: ${message}` },
              status: 'error',
            } satisfies WriteOutputResult),
          },
        ],
        isError: true,
      };
    }
  }

  // ===== Tool 10: get_market_prices =====
  if (name === 'get_market_prices') {
    const marketData = {
      grains: [
        { name: '单季稻', price_per_kg: 2.86, unit: '元/公斤', trend: '稳中有升', note: '最低收购价1.31元/斤（中晚籼稻）' },
        { name: '油菜籽', price_per_kg: 5.10, unit: '元/公斤', trend: '小幅波动', note: '菜籽油需求支撑' },
        { name: '毛豆', price_per_kg: 4.20, unit: '元/公斤', trend: '季节性波动', note: '上海本地需求旺盛' },
        { name: '青菜', price_per_kg: 3.50, unit: '元/公斤', trend: '稳定', note: '上海市民菜篮子工程保障' },
      ],
      inputs: [
        { name: '尿素', price: 2100, unit: '元/吨', trend: '下降' },
        { name: '复合肥', price: 2800, unit: '元/吨', trend: '稳定' },
        { name: '柴油', price: 7.5, unit: '元/升', trend: '稳定' },
      ],
      update_date: '2026-03-01',
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(marketData, null, 2),
        },
      ],
    };
  }

  // Unknown tool
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          data: { error: `Unknown tool: ${name}` },
          status: 'error',
        }),
      },
    ],
    isError: true,
  };
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr since stdout is used for MCP communication
  console.error('Smart Agricultural Service MCP Server started');
}

main().catch((error) => {
  console.error('Failed to start MCP server:', error);
  process.exit(1);
});
