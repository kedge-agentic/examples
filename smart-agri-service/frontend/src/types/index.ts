export type ViewMode = 'farmer' | 'bank';

export const VIEW_MODE_TEMPLATES: Record<ViewMode, string> = {
  farmer: 'farmer-advisor',
  bank: 'bank-assessor',
};

export type FarmerSyncField =
  | 'narrative_profile'
  | 'farming_analysis'
  | 'opportunity_list'
  | 'policy_matches'
  | 'action_plan'
  | 'risk_factors'
  | 'market_outlook';

export type BankSyncField =
  | 'credit_narrative'
  | 'farmer_background'
  | 'asset_summary'
  | 'income_analysis'
  | 'repayment_history'
  | 'risk_assessment'
  | 'loan_recommendation'
  | 'collateral_evaluation';

export type SyncField = FarmerSyncField | BankSyncField;

export interface DisplayItem {
  field: SyncField;
  value: unknown;
  preview: string;
  timestamp: number;
}

export interface FieldConfig {
  field: SyncField;
  title: string;
  icon: string;
  description: string;
}

export const FARMER_FIELDS: FieldConfig[] = [
  { field: 'narrative_profile', title: '农户画像', icon: '📋', description: '综合情况描述' },
  { field: 'farming_analysis', title: '经营分析', icon: '📊', description: '种植经营分析' },
  { field: 'opportunity_list', title: '机会推荐', icon: '💡', description: '补贴和机会' },
  { field: 'policy_matches', title: '政策匹配', icon: '📜', description: '适用政策' },
  { field: 'action_plan', title: '行动计划', icon: '✅', description: '建议行动' },
  { field: 'risk_factors', title: '风险提示', icon: '⚠️', description: '注意事项' },
  { field: 'market_outlook', title: '市场展望', icon: '📈', description: '行情分析' },
];

export const BANK_FIELDS: FieldConfig[] = [
  { field: 'credit_narrative', title: '信贷评估', icon: '📊', description: '综合评估报告' },
  { field: 'farmer_background', title: '农户背景', icon: '👤', description: '借款人信息' },
  { field: 'asset_summary', title: '资产概况', icon: '💰', description: '资产负债' },
  { field: 'income_analysis', title: '收入分析', icon: '📈', description: '收入来源' },
  { field: 'repayment_history', title: '还款记录', icon: '📝', description: '信用记录' },
  { field: 'risk_assessment', title: '风险评估', icon: '⚠️', description: '风险分析' },
  { field: 'loan_recommendation', title: '贷款建议', icon: '🏦', description: '产品推荐' },
  { field: 'collateral_evaluation', title: '抵押评估', icon: '🏠', description: '抵押物估值' },
];

// ============================================================================
// Conversation Types (from backend API)
// ============================================================================

export interface Conversation {
  sessionId: string;
  title: string | null;
  templateName: string | null;
  messageCount: number;
  lastActivity: string;
  createdAt: string;
}

// ============================================================================
// Creator/Consumer Mode Types
// ============================================================================

export interface ToolTimelineEntry {
  toolId: string;
  name: string;
  startTime: number;
  endTime?: number;
  phase: string;
  turnId?: string;
}

// Consumer progress stages (farmer mode - friendly, human-readable)
export interface ConsumerStage {
  tools: string[];
  activeLabel: string;
  completedLabel: string;
  pendingLabel: string;
}

export const CONSUMER_STAGES: ConsumerStage[] = [
  {
    tools: ['get_farmer_by_phone'],
    activeLabel: '正在查询您的信息...',
    completedLabel: '已查询到您的信息',
    pendingLabel: '查询您的信息',
  },
  {
    tools: ['get_farmer_land', 'get_farmer_crops', 'get_farmer_equipment'],
    activeLabel: '正在分析农业经营数据...',
    completedLabel: '已分析农业经营数据',
    pendingLabel: '分析农业经营数据',
  },
  {
    tools: ['get_farmer_loans', 'get_farmer_summary'],
    activeLabel: '正在整理财务状况...',
    completedLabel: '已整理财务状况',
    pendingLabel: '整理财务状况',
  },
  {
    tools: ['search_gov_policies', 'get_policy_document'],
    activeLabel: '正在查阅政策文件...',
    completedLabel: '已查阅相关政策文件',
    pendingLabel: '查阅政策文件',
  },
  {
    tools: ['write_output'],
    activeLabel: '正在为您生成个性化建议...',
    completedLabel: '已生成个性化建议',
    pendingLabel: '生成个性化建议',
  },
];

// Creator tool chain config (bank mode - technical, data-source-aware)
export interface CreatorToolConfig {
  name: string;
  label: string;
  dataSource?: string;
}

export const BANK_TOOL_SEQUENCE: CreatorToolConfig[] = [
  { name: 'get_farmer_by_phone', label: '查询农户信息', dataSource: 'farmers表' },
  { name: 'get_farmer_land', label: '获取土地信息', dataSource: 'land_parcels表' },
  { name: 'get_farmer_crops', label: '获取种植记录', dataSource: 'crop_records表' },
  { name: 'get_farmer_equipment', label: '获取农机设备', dataSource: 'equipment表' },
  { name: 'get_farmer_loans', label: '获取贷款记录', dataSource: 'loan_history表' },
  { name: 'get_farmer_summary', label: '计算汇总指标', dataSource: '综合计算' },
  { name: 'search_loan_products', label: '搜索贷款产品', dataSource: 'loan_products表' },
  { name: 'search_gov_policies', label: '搜索政策文件', dataSource: 'gov_policies表' },
  { name: 'get_policy_document', label: '查阅政策原文', dataSource: 'gov_policies表' },
  { name: 'get_market_prices', label: '获取市场行情', dataSource: 'market_prices表' },
  { name: 'write_output', label: '输出分析结果' },
];
