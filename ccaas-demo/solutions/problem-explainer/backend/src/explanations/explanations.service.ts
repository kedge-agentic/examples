import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import { Explanation, SyncField, SYNC_FIELDS, SolutionStep } from '../problems/problems.types';

@Injectable()
export class ExplanationsService {
  constructor(@Inject('DATABASE') private db: Database.Database) {}

  private mapRowToExplanation(row: any): Explanation {
    return {
      id: row.id,
      problemId: row.problem_id,
      problemAnalysis: row.problem_analysis || '',
      keyKnowledge: JSON.parse(row.key_knowledge || '[]'),
      solutionSteps: JSON.parse(row.solution_steps || '[]'),
      answer: row.answer || '',
      commonMistakes: JSON.parse(row.common_mistakes || '[]'),
      relatedProblems: JSON.parse(row.related_problems || '[]'),
      hints: JSON.parse(row.hints || '[]'),
      difficulty: row.difficulty || '',
      createdAt: row.created_at,
    };
  }

  findByProblemId(problemId: string): Explanation | null {
    const stmt = this.db.prepare(
      'SELECT * FROM explanations WHERE problem_id = ? ORDER BY created_at DESC LIMIT 1',
    );
    const row = stmt.get(problemId);
    return row ? this.mapRowToExplanation(row) : null;
  }

  findOne(id: string): Explanation | null {
    const stmt = this.db.prepare('SELECT * FROM explanations WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRowToExplanation(row) : null;
  }

  create(problemId: string): Explanation {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO explanations (
        id, problem_id, created_at
      ) VALUES (?, ?, ?)
    `);

    stmt.run(id, problemId, now);
    return this.findOne(id)!;
  }

  updateField(id: string, field: SyncField, value: unknown): Explanation {
    const existing = this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Explanation ' + id + ' not found');
    }

    if (!SYNC_FIELDS.includes(field)) {
      throw new Error('Invalid sync field: ' + field);
    }

    const columnMap: Record<SyncField, string> = {
      problemAnalysis: 'problem_analysis',
      keyKnowledge: 'key_knowledge',
      solutionSteps: 'solution_steps',
      answer: 'answer',
      commonMistakes: 'common_mistakes',
      relatedProblems: 'related_problems',
      hints: 'hints',
      difficulty: 'difficulty',
    };

    const column = columnMap[field];
    const serializedValue =
      typeof value === 'string' ? value : JSON.stringify(value);

    const sql = 'UPDATE explanations SET ' + column + ' = ? WHERE id = ?';
    const stmt = this.db.prepare(sql);
    stmt.run(serializedValue, id);

    return this.findOne(id)!;
  }

  getOrCreate(problemId: string): Explanation {
    const existing = this.findByProblemId(problemId);
    if (existing) {
      return existing;
    }
    return this.create(problemId);
  }
}
