import { Module, Global, OnModuleDestroy, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Database from 'better-sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';

export const DATABASE_TOKEN = 'DATABASE_CONNECTION';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_TOKEN,
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('DatabaseModule');
        const defaultPath = resolve(__dirname, '../../data/agri.db');
        const dbPath = configService.get<string>('DB_PATH') || defaultPath;

        // Ensure data directory exists
        const dbDir = dirname(dbPath);
        if (!existsSync(dbDir)) {
          mkdirSync(dbDir, { recursive: true });
        }

        // Create database connection
        const db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        // Initialize schema
        db.exec(`
          CREATE TABLE IF NOT EXISTS farmers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            gender TEXT DEFAULT '男',
            age INTEGER,
            address TEXT,
            village TEXT,
            township TEXT,
            county TEXT,
            province TEXT DEFAULT '上海市',
            city TEXT DEFAULT '上海市',
            id_number TEXT,
            farming_years INTEGER,
            household_size INTEGER,
            annual_income REAL,
            farmer_type TEXT,
            created_at TEXT DEFAULT (datetime('now'))
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS land_parcels (
            id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            parcel_name TEXT,
            area_mu REAL NOT NULL,
            land_type TEXT,
            soil_quality TEXT,
            irrigation TEXT,
            contract_start TEXT,
            contract_end TEXT,
            rent_per_mu REAL,
            is_owned INTEGER DEFAULT 1,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS crop_records (
            id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            land_parcel_id TEXT,
            crop_name TEXT NOT NULL,
            year INTEGER NOT NULL,
            season TEXT,
            area_mu REAL,
            yield_kg REAL,
            yield_per_mu REAL,
            revenue REAL,
            cost REAL,
            profit REAL,
            price_per_kg REAL,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS equipment (
            id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            equipment_type TEXT NOT NULL,
            brand TEXT,
            model TEXT,
            purchase_year INTEGER,
            purchase_price REAL,
            current_value REAL,
            subsidy_received REAL,
            status TEXT DEFAULT '正常',
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS loan_history (
            id TEXT PRIMARY KEY,
            farmer_id TEXT NOT NULL,
            bank_name TEXT NOT NULL,
            product_name TEXT,
            amount REAL NOT NULL,
            interest_rate REAL,
            term_months INTEGER,
            start_date TEXT,
            end_date TEXT,
            status TEXT,
            purpose TEXT,
            repaid_amount REAL,
            remaining_amount REAL,
            is_overdue INTEGER DEFAULT 0,
            overdue_days INTEGER DEFAULT 0,
            FOREIGN KEY (farmer_id) REFERENCES farmers(id)
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS gov_policies (
            id TEXT PRIMARY KEY,
            policy_name TEXT NOT NULL,
            category TEXT,
            description TEXT,
            target_audience TEXT,
            benefit_amount TEXT,
            application_method TEXT,
            deadline TEXT,
            region TEXT,
            crop_type TEXT,
            status TEXT DEFAULT '有效',
            source TEXT,
            publish_date TEXT,
            doc_number TEXT,
            full_text TEXT,
            attachments TEXT
          )
        `);

        db.exec(`
          CREATE TABLE IF NOT EXISTS loan_products (
            id TEXT PRIMARY KEY,
            bank_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            description TEXT,
            min_amount REAL,
            max_amount REAL,
            interest_rate_min REAL,
            interest_rate_max REAL,
            term_months_min INTEGER,
            term_months_max INTEGER,
            collateral_required TEXT,
            target_audience TEXT,
            features TEXT,
            application_process TEXT
          )
        `);

        // Create indexes
        db.exec(`CREATE INDEX IF NOT EXISTS idx_farmers_phone ON farmers(phone)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_farmers_type ON farmers(farmer_type)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_land_parcels_farmer ON land_parcels(farmer_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_crop_records_farmer ON crop_records(farmer_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_equipment_farmer ON equipment(farmer_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_loan_history_farmer ON loan_history(farmer_id)`);
        db.exec(`CREATE INDEX IF NOT EXISTS idx_policies_category ON gov_policies(category)`);

        logger.log(`Database initialized at ${dbPath}`);
        return db;
      },
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_TOKEN],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  onModuleDestroy() {
    try {
      this.db.close();
      this.logger.log('Database connection closed');
    } catch (error) {
      this.logger.error('Failed to close database connection', error);
    }
  }
}
