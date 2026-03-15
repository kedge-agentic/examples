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

export interface Problem {
  id: string;
  tenantId: string;
  content: string;
  imageUrl?: string;
  subject: string;
  gradeLevel: string;
  problemType: string;
  knowledgePoints: string[];
  status: 'pending' | 'explaining' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface SolutionStep {
  stepNumber: number;
  description: string;
  formula?: string;
  explanation: string;
}

export interface Explanation {
  id: string;
  problemId: string;
  problemAnalysis: string;
  keyKnowledge: string[];
  solutionSteps: SolutionStep[];
  answer: string;
  commonMistakes: string[];
  relatedProblems: string[];
  hints: string[];
  difficulty: string;
  createdAt: string;
}

export interface OutputUpdate {
  field: SyncField;
  value: unknown;
  preview: string;
  synced?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  outputUpdates?: OutputUpdate[];
  createdAt: string;
}

export interface Subject {
  id: string;
  name: string;
  hasFormula: boolean;
}

export interface UndoEntry {
  field: SyncField;
  previousValue: unknown;
  timestamp: number;
}

export interface SolutionConfig {
  name: string;
  slug: string;
  syncFields: string[];
  subjects: Subject[];
  backend: {
    port: number;
    ccaasUrl: string;
  };
  frontend: {
    port: number;
    apiBaseUrl: string;
  };
}
