export const SYNC_FIELDS = [
  'problemAnalysis',
  'keyKnowledge',
  'solutionSteps',
  'answer',
  'commonMistakes',
  'relatedProblems',
  'hints',
  'difficulty',
] as const;

export type SyncField = (typeof SYNC_FIELDS)[number];

export interface WriteOutputInput {
  field: SyncField;
  value: unknown;
  preview: string;
}

export interface WriteOutputResult {
  data: {
    field: SyncField;
    value: unknown;
    preview: string;
  };
  status: 'success';
}

export interface Subject {
  id: string;
  name: string;
  hasFormula: boolean;
}

export interface KnowledgePoint {
  id: string;
  subject: string;
  grade?: string;
  name: string;
  description?: string;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  formula?: string;
  explanation: string;
}
