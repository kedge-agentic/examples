import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import Database from 'better-sqlite3';
import { DATABASE_TOKEN } from '../database/database.module';

@Injectable()
export class FarmersService {
  constructor(@Inject(DATABASE_TOKEN) private readonly db: Database.Database) {}

  findAll() {
    return this.db.prepare('SELECT * FROM farmers ORDER BY created_at DESC').all();
  }

  findById(id: string) {
    const farmer = this.db.prepare('SELECT * FROM farmers WHERE id = ?').get(id);
    if (!farmer) {
      throw new NotFoundException(`Farmer with id ${id} not found`);
    }
    return farmer;
  }

  findByPhone(phone: string) {
    const farmer = this.db.prepare('SELECT * FROM farmers WHERE phone = ?').get(phone);
    if (!farmer) {
      throw new NotFoundException(`Farmer with phone ${phone} not found`);
    }
    return farmer;
  }

  getLandParcels(farmerId: string) {
    this.ensureFarmerExists(farmerId);
    return this.db.prepare('SELECT * FROM land_parcels WHERE farmer_id = ?').all(farmerId);
  }

  getCropRecords(farmerId: string) {
    this.ensureFarmerExists(farmerId);
    return this.db
      .prepare('SELECT * FROM crop_records WHERE farmer_id = ? ORDER BY year DESC, season')
      .all(farmerId);
  }

  getEquipment(farmerId: string) {
    this.ensureFarmerExists(farmerId);
    return this.db.prepare('SELECT * FROM equipment WHERE farmer_id = ?').all(farmerId);
  }

  getLoanHistory(farmerId: string) {
    this.ensureFarmerExists(farmerId);
    return this.db
      .prepare('SELECT * FROM loan_history WHERE farmer_id = ? ORDER BY start_date DESC')
      .all(farmerId);
  }

  getSummary(farmerId: string) {
    const farmer = this.findById(farmerId) as any;

    // Total land area
    const landResult = this.db
      .prepare('SELECT COALESCE(SUM(area_mu), 0) as total_area, COUNT(*) as parcel_count FROM land_parcels WHERE farmer_id = ?')
      .get(farmerId) as any;

    // Latest year crop summary
    const latestYear = this.db
      .prepare('SELECT MAX(year) as year FROM crop_records WHERE farmer_id = ?')
      .get(farmerId) as any;

    let cropSummary = { total_revenue: 0, total_cost: 0, total_profit: 0, crop_count: 0 };
    if (latestYear?.year) {
      cropSummary = this.db
        .prepare(`
          SELECT
            COALESCE(SUM(revenue), 0) as total_revenue,
            COALESCE(SUM(cost), 0) as total_cost,
            COALESCE(SUM(profit), 0) as total_profit,
            COUNT(*) as crop_count
          FROM crop_records
          WHERE farmer_id = ? AND year = ?
        `)
        .get(farmerId, latestYear.year) as any;
    }

    // Equipment value
    const equipResult = this.db
      .prepare(`
        SELECT
          COALESCE(SUM(current_value), 0) as total_value,
          COALESCE(SUM(subsidy_received), 0) as total_subsidy,
          COUNT(*) as equipment_count
        FROM equipment
        WHERE farmer_id = ? AND status != '报废'
      `)
      .get(farmerId) as any;

    // Active loans
    const loanResult = this.db
      .prepare(`
        SELECT
          COALESCE(SUM(remaining_amount), 0) as total_remaining,
          COALESCE(SUM(amount), 0) as total_borrowed,
          COUNT(*) as active_loan_count
        FROM loan_history
        WHERE farmer_id = ? AND status = '正常还款'
      `)
      .get(farmerId) as any;

    // Overdue check
    const overdueResult = this.db
      .prepare(`
        SELECT COUNT(*) as overdue_count, COALESCE(SUM(remaining_amount), 0) as overdue_amount
        FROM loan_history
        WHERE farmer_id = ? AND is_overdue = 1
      `)
      .get(farmerId) as any;

    return {
      farmer,
      land: {
        total_area_mu: landResult.total_area,
        parcel_count: landResult.parcel_count,
      },
      crops: {
        latest_year: latestYear?.year || null,
        total_revenue: cropSummary.total_revenue,
        total_cost: cropSummary.total_cost,
        total_profit: cropSummary.total_profit,
        crop_count: cropSummary.crop_count,
      },
      equipment: {
        total_value: equipResult.total_value,
        total_subsidy: equipResult.total_subsidy,
        equipment_count: equipResult.equipment_count,
      },
      loans: {
        active_loan_count: loanResult.active_loan_count,
        total_borrowed: loanResult.total_borrowed,
        total_remaining: loanResult.total_remaining,
        has_overdue: overdueResult.overdue_count > 0,
        overdue_count: overdueResult.overdue_count,
        overdue_amount: overdueResult.overdue_amount,
      },
    };
  }

  private ensureFarmerExists(farmerId: string) {
    const exists = this.db.prepare('SELECT id FROM farmers WHERE id = ?').get(farmerId);
    if (!exists) {
      throw new NotFoundException(`Farmer with id ${farmerId} not found`);
    }
  }
}
