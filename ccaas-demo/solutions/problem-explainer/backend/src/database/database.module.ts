import { Module, Global, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'problem-explainer.db');

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE',
      useFactory: () => {
        // Ensure data directory exists
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }

        const db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');

        // Initialize tables
        db.exec(`
          CREATE TABLE IF NOT EXISTS problems (
            id TEXT PRIMARY KEY,
            tenant_id TEXT NOT NULL,
            content TEXT NOT NULL,
            image_url TEXT,
            subject TEXT NOT NULL,
            grade_level TEXT NOT NULL,
            problem_type TEXT DEFAULT 'general',
            knowledge_points TEXT DEFAULT '[]',
            status TEXT DEFAULT 'pending',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          );

          CREATE TABLE IF NOT EXISTS explanations (
            id TEXT PRIMARY KEY,
            problem_id TEXT NOT NULL,
            problem_analysis TEXT,
            key_knowledge TEXT DEFAULT '[]',
            solution_steps TEXT DEFAULT '[]',
            answer TEXT,
            common_mistakes TEXT DEFAULT '[]',
            related_problems TEXT DEFAULT '[]',
            hints TEXT DEFAULT '[]',
            difficulty TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (problem_id) REFERENCES problems(id)
          );

          CREATE INDEX IF NOT EXISTS idx_problems_tenant ON problems(tenant_id);
          CREATE INDEX IF NOT EXISTS idx_problems_subject ON problems(subject);
          CREATE INDEX IF NOT EXISTS idx_explanations_problem ON explanations(problem_id);
        `);

        console.log('Database initialized at:', DB_PATH);
        return db;
      },
    },
  ],
  exports: ['DATABASE'],
})
export class DatabaseModule {}
