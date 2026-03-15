import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConfigService {
  private solutionConfig: any;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const configPath = path.join(process.cwd(), '..', 'solution.json');
    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      this.solutionConfig = JSON.parse(content);
    } catch (error) {
      console.warn('Could not load solution.json:', error.message);
      this.solutionConfig = {
        name: 'Problem Explainer',
        slug: 'problem-explainer',
        syncFields: [
          'problemAnalysis',
          'keyKnowledge',
          'solutionSteps',
          'answer',
          'commonMistakes',
          'relatedProblems',
          'hints',
          'difficulty',
        ],
        subjects: [
          { id: 'math', name: '数学', hasFormula: true },
          { id: 'physics', name: '物理', hasFormula: true },
          { id: 'chemistry', name: '化学', hasFormula: true },
          { id: 'biology', name: '生物', hasFormula: false },
          { id: 'chinese', name: '语文', hasFormula: false },
          { id: 'english', name: '英语', hasFormula: false },
          { id: 'history', name: '历史', hasFormula: false },
          { id: 'geography', name: '地理', hasFormula: false },
          { id: 'politics', name: '政治', hasFormula: false },
        ],
      };
    }
  }

  getSolutionConfig() {
    return this.solutionConfig;
  }

  getSyncFields(): string[] {
    return this.solutionConfig.syncFields || [];
  }

  getSubjects() {
    return this.solutionConfig.subjects || [];
  }

  getCcaasUrl(): string {
    return this.solutionConfig.backend?.ccaasUrl || 'http://localhost:3001';
  }
}
