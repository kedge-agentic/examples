import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class PoliciesService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  private enrichPolicy(policy: Record<string, unknown>) {
    return {
      ...policy,
      has_full_text: !!policy.full_text,
      attachments: policy.attachments ? JSON.parse(policy.attachments as string) : null,
    };
  }

  findAll(filters?: { category?: string; region?: string; crop_type?: string }) {
    let sql = 'SELECT * FROM gov_policies WHERE 1=1';
    const params: any[] = [];

    if (filters?.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.region) {
      sql += ' AND (region LIKE ? OR region = "全国")';
      params.push(`%${filters.region}%`);
    }
    if (filters?.crop_type) {
      sql += ' AND (crop_type LIKE ? OR crop_type IS NULL OR crop_type = "通用")';
      params.push(`%${filters.crop_type}%`);
    }

    sql += ' ORDER BY publish_date DESC';
    const rows = this.db.prepare(sql).all(...params) as Record<string, unknown>[];
    // Strip full_text from list results to reduce payload size
    return rows.map(r => {
      const { full_text, ...row } = r;
      return {
        ...row,
        has_full_text: !!full_text,
        attachments: row.attachments ? JSON.parse(row.attachments as string) : null,
      };
    });
  }

  findById(id: string) {
    const policy = this.db.prepare('SELECT * FROM gov_policies WHERE id = ?').get(id) as Record<string, unknown> | undefined;
    if (!policy) {
      throw new NotFoundException(`Policy with id ${id} not found`);
    }
    return this.enrichPolicy(policy);
  }
}
