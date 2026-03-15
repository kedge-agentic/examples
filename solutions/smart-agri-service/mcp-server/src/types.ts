/**
 * Smart Agricultural Service Sync Field Types
 * These fields can be synced from Claude to the frontend views
 */

// Farmer view fields (7)
export const FARMER_SYNC_FIELDS = [
  'narrative_profile',
  'farming_analysis',
  'opportunity_list',
  'policy_matches',
  'action_plan',
  'risk_factors',
  'market_outlook',
] as const;

// Bank view fields (8)
export const BANK_SYNC_FIELDS = [
  'credit_narrative',
  'farmer_background',
  'asset_summary',
  'income_analysis',
  'repayment_history',
  'risk_assessment',
  'loan_recommendation',
  'collateral_evaluation',
] as const;

export const SYNC_FIELDS = [...FARMER_SYNC_FIELDS, ...BANK_SYNC_FIELDS] as const;
export type SyncField = typeof SYNC_FIELDS[number];

/**
 * write_output tool input
 */
export interface WriteOutputInput {
  field: string;
  value: unknown;
  preview: string;
}

/**
 * write_output tool result format
 * This matches what CCAAS EventMapper expects
 */
export interface WriteOutputResult {
  data: {
    field?: string;
    value?: unknown;
    preview?: string;
    error?: string;
  };
  status: 'success' | 'error';
}
