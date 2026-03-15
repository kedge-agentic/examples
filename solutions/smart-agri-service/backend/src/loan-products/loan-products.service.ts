import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class LoanProductsService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  findAll(filters?: { bank_name?: string; max_amount?: number }) {
    let sql = 'SELECT * FROM loan_products WHERE 1=1';
    const params: any[] = [];

    if (filters?.bank_name) {
      sql += ' AND bank_name = ?';
      params.push(filters.bank_name);
    }
    if (filters?.max_amount) {
      sql += ' AND max_amount >= ?';
      params.push(filters.max_amount);
    }

    sql += ' ORDER BY interest_rate_min ASC';
    return this.db.prepare(sql).all(...params);
  }

  findById(id: string) {
    const product = this.db.prepare('SELECT * FROM loan_products WHERE id = ?').get(id);
    if (!product) {
      throw new NotFoundException(`Loan product with id ${id} not found`);
    }
    return product;
  }
}
