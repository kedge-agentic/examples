import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type Database from 'better-sqlite3';
import { Problem, SyncField, SYNC_FIELDS } from './problems.types';
import { CreateProblemDto, UpdateProblemDto } from './dto/create-problem.dto';

@Injectable()
export class ProblemsService {
  constructor(@Inject('DATABASE') private db: Database.Database) {}

  private mapRowToProblem(row: any): Problem {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      content: row.content,
      imageUrl: row.image_url || undefined,
      subject: row.subject,
      gradeLevel: row.grade_level,
      problemType: row.problem_type,
      knowledgePoints: JSON.parse(row.knowledge_points || '[]'),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  findAll(tenantId: string): Problem[] {
    const stmt = this.db.prepare(
      'SELECT * FROM problems WHERE tenant_id = ? ORDER BY created_at DESC',
    );
    const rows = stmt.all(tenantId);
    return rows.map((row) => this.mapRowToProblem(row));
  }

  findOne(id: string): Problem | null {
    const stmt = this.db.prepare('SELECT * FROM problems WHERE id = ?');
    const row = stmt.get(id);
    return row ? this.mapRowToProblem(row) : null;
  }

  create(tenantId: string, dto: CreateProblemDto): Problem {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO problems (
        id, tenant_id, content, image_url, subject, grade_level,
        problem_type, knowledge_points, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      tenantId,
      dto.content,
      dto.imageUrl || null,
      dto.subject,
      dto.gradeLevel,
      dto.problemType || 'general',
      JSON.stringify(dto.knowledgePoints || []),
      'pending',
      now,
      now,
    );

    return this.findOne(id)!;
  }

  update(id: string, dto: UpdateProblemDto): Problem {
    const existing = this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Problem ' + id + ' not found');
    }

    const now = new Date().toISOString();
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    if (dto.content !== undefined) {
      updates.push('content = ?');
      values.push(dto.content);
    }
    if (dto.imageUrl !== undefined) {
      updates.push('image_url = ?');
      values.push(dto.imageUrl);
    }
    if (dto.subject !== undefined) {
      updates.push('subject = ?');
      values.push(dto.subject);
    }
    if (dto.gradeLevel !== undefined) {
      updates.push('grade_level = ?');
      values.push(dto.gradeLevel);
    }
    if (dto.problemType !== undefined) {
      updates.push('problem_type = ?');
      values.push(dto.problemType);
    }
    if (dto.knowledgePoints !== undefined) {
      updates.push('knowledge_points = ?');
      values.push(JSON.stringify(dto.knowledgePoints));
    }
    if (dto.status !== undefined) {
      updates.push('status = ?');
      values.push(dto.status);
    }

    values.push(id);
    const sql = 'UPDATE problems SET ' + updates.join(', ') + ' WHERE id = ?';
    const stmt = this.db.prepare(sql);
    stmt.run(...values);

    return this.findOne(id)!;
  }

  updateField(id: string, field: SyncField, value: unknown): Problem {
    const existing = this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Problem ' + id + ' not found');
    }

    if (!SYNC_FIELDS.includes(field)) {
      throw new Error('Invalid sync field: ' + field);
    }

    // For problems, we only update status through this
    // Explanation fields are updated through ExplanationsService
    if (field === 'difficulty') {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(
        'UPDATE problems SET updated_at = ? WHERE id = ?',
      );
      stmt.run(now, id);
    }

    return this.findOne(id)!;
  }

  delete(id: string): void {
    const stmt = this.db.prepare('DELETE FROM problems WHERE id = ?');
    stmt.run(id);
  }
}
