/**
 * SQLite database connection for Smart Agricultural Service
 * Read-only connection to ../data/agri.db
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MCP server runs from mcp-server/dist/, database is at backend/data/agri.db
const DB_PATH = path.resolve(__dirname, '../../backend/data/agri.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true });
    db.pragma('journal_mode = WAL');
  }
  return db;
}
