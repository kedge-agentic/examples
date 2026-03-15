import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';

// ============================================================
// Smart Agricultural Service - Seed Data Generator
// 慧农服 - 模拟数据生成器
// ============================================================

const dbPath = resolve(__dirname, '../data/agri.db');
const dbDir = dirname(dbPath);

if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// Helper functions
// ============================================================

function uuid(): string {
  return randomUUID();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// ============================================================
// Drop & recreate tables (ensures schema is always up-to-date)
// ============================================================

db.exec('DROP TABLE IF EXISTS crop_records');
db.exec('DROP TABLE IF EXISTS land_parcels');
db.exec('DROP TABLE IF EXISTS equipment');
db.exec('DROP TABLE IF EXISTS loan_history');
db.exec('DROP TABLE IF EXISTS loan_products');
db.exec('DROP TABLE IF EXISTS gov_policies');
db.exec('DROP TABLE IF EXISTS farmers');
db.exec('DROP TABLE IF EXISTS market_prices');

db.exec(`
  CREATE TABLE farmers (
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
  CREATE TABLE land_parcels (
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
  CREATE TABLE crop_records (
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
  CREATE TABLE equipment (
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
  CREATE TABLE loan_history (
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
  CREATE TABLE gov_policies (
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
  CREATE TABLE loan_products (
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

// ============================================================
// Name pools
// ============================================================

const lastNames = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '曹',
  '程', '蔡', '彭', '潘', '袁', '田', '邓', '石', '崔', '贾',
];

const maleGivenNames = [
  '建国', '志强', '国强', '文明', '德福', '永刚', '建华', '明',
  '春生', '海涛', '国庆', '金生', '大伟', '福来', '守信', '立民',
  '振华', '保国', '有才', '长林', '正义', '宝山', '小龙', '卫国',
  '成功', '光明', '进财', '万里', '天福', '永生',
];

const femaleGivenNames = [
  '秀英', '桂兰', '玉兰', '淑芬', '秀珍', '凤英', '玉梅', '翠花',
  '春花', '美丽', '桂花', '小红', '秀云', '兰英', '金凤',
];

const youngMaleNames = [
  '浩然', '宇轩', '子墨', '博文', '天翔', '文博', '明哲', '思远',
  '嘉豪', '俊杰',
];

const counties = ['嘉定区'];
const townships: Record<string, string[]> = {
  '嘉定区': ['南翔镇', '安亭镇', '马陆镇', '徐行镇', '华亭镇', '外冈镇', '江桥镇', '嘉定镇街道', '新成路街道', '菊园新区'],
};
const villageNames = [
  '华亭村', '联华村', '双塘村', '北新村', '毛桥村', '周泾村', '葛隆村',
  '望新村', '施晋村', '泉泾村', '劳动村', '小庙村', '红星村', '曹王村',
  '新民村', '伏虎村', '大裕村', '马陆村', '北管村', '石冈村', '赵巷村',
  '方泰村', '向阳村', '永翔村', '翔华村', '新丰村', '太平村', '建华村',
  '勤丰村', '唐行村', '连浩村', '管家村', '林家村', '北虹村', '钱门塘村',
];

const irrigationTypes = ['渠灌', '渠灌', '喷灌', '滴灌', '管道灌溉'];
const soilQualities = ['优', '良', '中', '差'];
const landTypes = ['水田', '水田', '水田', '菜地', '果园']; // weighted toward 水田

const equipmentTypes = [
  { type: '拖拉机', brands: ['东方红', '雷沃', '久保田', '东风'], priceRange: [30000, 150000] },
  { type: '收割机', brands: ['久保田', '沃得', '洋马', '雷沃谷神'], priceRange: [80000, 350000] },
  { type: '插秧机', brands: ['久保田', '洋马', '井关', '东风井关'], priceRange: [20000, 80000] },
  { type: '旋耕机', brands: ['开元王', '久保田', '鑫万达'], priceRange: [8000, 25000] },
  { type: '植保无人机', brands: ['大疆', '极飞', '汉和'], priceRange: [30000, 100000] },
  { type: '喷雾器', brands: ['华丰', '利农', '台州'], priceRange: [500, 3000] },
  { type: '粮食烘干机', brands: ['中联重科', '辰宇', '三久'], priceRange: [50000, 200000] },
  { type: '微耕机', brands: ['微耕', '重庆合盛', '鑫源'], priceRange: [3000, 15000] },
];

const bankNames = ['农业银行', '建设银行', '邮储银行', '上海农商银行'];
const loanPurposes = [
  '购买农资（化肥农药）',
  '购买种子',
  '农机购置',
  '扩大种植规模',
  '土地流转费',
  '设施农业建设',
  '农产品加工设备',
  '粮食收储',
];

// ============================================================
// Generate farmers
// ============================================================

interface FarmerConfig {
  type: string;
  count: number;
  areaRange: [number, number];
  incomeRange: [number, number];
  ageRange: [number, number];
  farmingYearsRange: [number, number];
  householdRange: [number, number];
  isYoung?: boolean;
}

const farmerConfigs: FarmerConfig[] = [
  { type: '大户', count: 10, areaRange: [50, 200], incomeRange: [150000, 500000], ageRange: [40, 60], farmingYearsRange: [15, 35], householdRange: [3, 6] },
  { type: '中等', count: 15, areaRange: [20, 50], incomeRange: [50000, 150000], ageRange: [35, 58], farmingYearsRange: [10, 30], householdRange: [3, 5] },
  { type: '小农', count: 10, areaRange: [5, 20], incomeRange: [20000, 50000], ageRange: [45, 70], farmingYearsRange: [15, 45], householdRange: [2, 5] },
  { type: '合作社', count: 5, areaRange: [200, 500], incomeRange: [500000, 2000000], ageRange: [38, 55], farmingYearsRange: [10, 25], householdRange: [4, 7] },
  { type: '新农人', count: 5, areaRange: [10, 50], incomeRange: [30000, 200000], ageRange: [25, 35], farmingYearsRange: [1, 5], householdRange: [2, 4], isYoung: true },
  { type: '经济作物', count: 5, areaRange: [10, 100], incomeRange: [100000, 500000], ageRange: [35, 55], farmingYearsRange: [8, 25], householdRange: [3, 5] },
];

interface FarmerRecord {
  id: string;
  name: string;
  phone: string;
  type: string;
  county: string;
  township: string;
  totalArea: number;
}

const allFarmers: FarmerRecord[] = [];

const insertFarmer = db.prepare(`
  INSERT INTO farmers (id, name, phone, gender, age, address, village, township, county, province, city, id_number, farming_years, household_size, annual_income, farmer_type, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLand = db.prepare(`
  INSERT INTO land_parcels (id, farmer_id, parcel_name, area_mu, land_type, soil_quality, irrigation, contract_start, contract_end, rent_per_mu, is_owned)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertCrop = db.prepare(`
  INSERT INTO crop_records (id, farmer_id, land_parcel_id, crop_name, year, season, area_mu, yield_kg, yield_per_mu, revenue, cost, profit, price_per_kg)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertEquipment = db.prepare(`
  INSERT INTO equipment (id, farmer_id, equipment_type, brand, model, purchase_year, purchase_price, current_value, subsidy_received, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertLoan = db.prepare(`
  INSERT INTO loan_history (id, farmer_id, bank_name, product_name, amount, interest_rate, term_months, start_date, end_date, status, purpose, repaid_amount, remaining_amount, is_overdue, overdue_days)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let farmerIndex = 0;

console.log('Generating farmers...');

for (const config of farmerConfigs) {
  for (let i = 0; i < config.count; i++) {
    farmerIndex++;
    const farmerId = uuid();
    const gender = Math.random() > 0.2 ? '男' : '女';
    const lastName = pick(lastNames);
    let givenName: string;
    if (config.isYoung) {
      givenName = gender === '男' ? pick(youngMaleNames) : pick(femaleGivenNames);
    } else {
      givenName = gender === '男' ? pick(maleGivenNames) : pick(femaleGivenNames);
    }
    const name = lastName + givenName;
    const phone = `138123450${farmerIndex.toString().padStart(2, '0')}`;
    const age = randInt(config.ageRange[0], config.ageRange[1]);
    const county = pick(counties);
    const township = pick(townships[county]);
    const village = pick(villageNames);
    const address = `上海市${county}${township}${village}`;
    const farmingYears = randInt(config.farmingYearsRange[0], config.farmingYearsRange[1]);
    const householdSize = randInt(config.householdRange[0], config.householdRange[1]);
    const annualIncome = randFloat(config.incomeRange[0], config.incomeRange[1], 0);

    // Generate ID number (simplified)
    const birthYear = 2026 - age;
    const idNumber = `3101${randInt(14, 14)}${birthYear}${randInt(1, 12).toString().padStart(2, '0')}${randInt(1, 28).toString().padStart(2, '0')}${randInt(1000, 9999)}`;

    const createdAt = `2025-${randInt(1, 12).toString().padStart(2, '0')}-${randInt(1, 28).toString().padStart(2, '0')} ${randInt(8, 18).toString().padStart(2, '0')}:${randInt(0, 59).toString().padStart(2, '0')}:00`;

    insertFarmer.run(
      farmerId, name, phone, gender, age, address, village, township, county,
      '上海市', '上海市', idNumber, farmingYears, householdSize, annualIncome,
      config.type, createdAt,
    );

    // ---- Land parcels ----
    const totalArea = randFloat(config.areaRange[0], config.areaRange[1], 1);
    const parcelCount = config.type === '合作社' ? randInt(2, 3) : randInt(1, 3);
    const parcelIds: string[] = [];

    let remainingArea = totalArea;
    for (let p = 0; p < parcelCount; p++) {
      const parcelId = uuid();
      parcelIds.push(parcelId);
      const isLast = p === parcelCount - 1;
      const parcelArea = isLast ? remainingArea : randFloat(remainingArea * 0.2, remainingArea * 0.6, 1);
      remainingArea -= parcelArea;

      const parcelName = p === 0 ? '主耕地' : p === 1 ? '东边地' : '南边地';
      const isOwned = Math.random() > 0.3 ? 1 : 0;
      const lt = config.type === '经济作物' ? pick(['果园', '菜地']) : pick(landTypes);

      const contractStart = isOwned ? null : `${randInt(2018, 2023)}-01-01`;
      const contractEnd = contractStart ? `${parseInt(contractStart.slice(0, 4)) + randInt(5, 15)}-12-31` : null;
      const rentPerMu = isOwned ? null : randFloat(300, 800, 0);

      insertLand.run(
        parcelId, farmerId, parcelName, parcelArea, lt,
        pick(soilQualities), pick(irrigationTypes),
        contractStart, contractEnd, rentPerMu, isOwned,
      );
    }

    // ---- Crop records ----
    const years = [2023, 2024, 2025];
    const cropYears = years.slice(0, randInt(2, 3));

    for (const year of cropYears) {
      // 单季稻 (single-season rice) - primary crop for Shanghai
      const riceArea = totalArea * randFloat(0.5, 0.8, 2);
      const riceYieldPerMu = randFloat(480, 600, 0);
      const riceYield = riceArea * riceYieldPerMu;
      const ricePrice = randFloat(2.6, 3.0, 2);
      const riceRevenue = riceYield * ricePrice;
      const riceCost = riceArea * randFloat(600, 800, 0);

      insertCrop.run(
        uuid(), farmerId, pick(parcelIds), '单季稻', year, '夏秋',
        parseFloat(riceArea.toFixed(1)),
        parseFloat(riceYield.toFixed(0)),
        riceYieldPerMu,
        parseFloat(riceRevenue.toFixed(0)),
        parseFloat(riceCost.toFixed(0)),
        parseFloat((riceRevenue - riceCost).toFixed(0)),
        ricePrice,
      );

      // 油菜 (winter rapeseed) - rotated with rice
      const rapeArea = riceArea * randFloat(0.3, 0.6, 2);
      const rapeYieldPerMu = randFloat(150, 200, 0);
      const rapeYield = rapeArea * rapeYieldPerMu;
      const rapePrice = randFloat(4.5, 5.5, 2);
      const rapeRevenue = rapeYield * rapePrice;
      const rapeCost = rapeArea * randFloat(300, 500, 0);

      insertCrop.run(
        uuid(), farmerId, pick(parcelIds), '油菜', year, '冬春',
        parseFloat(rapeArea.toFixed(1)),
        parseFloat(rapeYield.toFixed(0)),
        rapeYieldPerMu,
        parseFloat(rapeRevenue.toFixed(0)),
        parseFloat(rapeCost.toFixed(0)),
        parseFloat((rapeRevenue - rapeCost).toFixed(0)),
        rapePrice,
      );

      // Additional crops based on type
      if (config.type === '经济作物') {
        const vegCrops = ['番茄', '黄瓜', '青菜', '草莓', '葡萄', '西瓜', '茄子', '嘉定白蒜'];
        const vegCrop = pick(vegCrops);
        const vegArea = totalArea * randFloat(0.2, 0.5, 2);
        const vegYieldPerMu = randFloat(2000, 5000, 0);
        const vegYield = vegArea * vegYieldPerMu;
        const vegPrice = randFloat(1.5, 6.0, 2);
        const vegRevenue = vegYield * vegPrice;
        const vegCost = vegArea * randFloat(1500, 3000, 0);

        insertCrop.run(
          uuid(), farmerId, pick(parcelIds), vegCrop, year, pick(['春', '夏', '秋']),
          parseFloat(vegArea.toFixed(1)),
          parseFloat(vegYield.toFixed(0)),
          vegYieldPerMu,
          parseFloat(vegRevenue.toFixed(0)),
          parseFloat(vegCost.toFixed(0)),
          parseFloat((vegRevenue - vegCost).toFixed(0)),
          vegPrice,
        );
      } else if (Math.random() > 0.5) {
        // Some farmers also grow edamame, sweet potato, or taro
        const extraCrop = pick(['毛豆', '油菜', '红薯', '芋头']);
        const extraArea = totalArea * randFloat(0.1, 0.3, 2);
        const extraYieldPerMu = extraCrop === '毛豆' ? randFloat(300, 500, 0) :
                                extraCrop === '油菜' ? randFloat(150, 200, 0) :
                                extraCrop === '红薯' ? randFloat(2000, 3000, 0) :
                                randFloat(1500, 2500, 0); // 芋头
        const extraYield = extraArea * extraYieldPerMu;
        const extraPrice = extraCrop === '毛豆' ? randFloat(3.0, 5.0, 2) :
                           extraCrop === '油菜' ? randFloat(4.5, 5.5, 2) :
                           extraCrop === '红薯' ? randFloat(1.0, 2.0, 2) :
                           randFloat(3.0, 5.0, 2); // 芋头
        const extraRevenue = extraYield * extraPrice;
        const extraCost = extraArea * randFloat(300, 600, 0);

        insertCrop.run(
          uuid(), farmerId, pick(parcelIds), extraCrop, year, '秋',
          parseFloat(extraArea.toFixed(1)),
          parseFloat(extraYield.toFixed(0)),
          extraYieldPerMu,
          parseFloat(extraRevenue.toFixed(0)),
          parseFloat(extraCost.toFixed(0)),
          parseFloat((extraRevenue - extraCost).toFixed(0)),
          extraPrice,
        );
      }
    }

    // ---- Equipment ----
    let equipCount = 0;
    if (config.type === '大户' || config.type === '合作社') {
      equipCount = randInt(2, 3);
    } else if (config.type === '新农人') {
      equipCount = randInt(1, 2);
    } else if (config.type === '中等') {
      equipCount = randInt(1, 2);
    } else {
      equipCount = Math.random() > 0.4 ? 1 : 0;
    }

    const usedEquipTypes = new Set<string>();
    for (let e = 0; e < equipCount; e++) {
      let eq = pick(equipmentTypes);
      // Avoid duplicates
      let attempts = 0;
      while (usedEquipTypes.has(eq.type) && attempts < 10) {
        eq = pick(equipmentTypes);
        attempts++;
      }
      usedEquipTypes.add(eq.type);

      const brand = pick(eq.brands);
      const purchaseYear = randInt(2016, 2025);
      const purchasePrice = randFloat(eq.priceRange[0], eq.priceRange[1], 0);
      const ageFactor = Math.max(0.1, 1 - (2026 - purchaseYear) * 0.1);
      const currentValue = parseFloat((purchasePrice * ageFactor).toFixed(0));
      const subsidyReceived = parseFloat((purchasePrice * randFloat(0.15, 0.35, 2)).toFixed(0));
      const status = purchaseYear < 2018 && Math.random() > 0.7 ? '报废' :
                     Math.random() > 0.9 ? '维修中' : '正常';

      insertEquipment.run(
        uuid(), farmerId, eq.type, brand, `${brand}-${randInt(100, 999)}`,
        purchaseYear, purchasePrice, currentValue, subsidyReceived, status,
      );
    }

    // ---- Loan history ----
    let loanCount = 0;
    if (config.type === '大户' || config.type === '合作社') {
      loanCount = randInt(1, 2);
    } else if (config.type === '新农人') {
      loanCount = randInt(0, 2);
    } else if (config.type === '中等' || config.type === '经济作物') {
      loanCount = Math.random() > 0.4 ? 1 : 0;
    } else {
      loanCount = Math.random() > 0.7 ? 1 : 0;
    }

    for (let l = 0; l < loanCount; l++) {
      const bank = pick(bankNames);
      const productNames: Record<string, string[]> = {
        '农业银行': ['惠农e贷', '粮农贷', '农机购置贷款'],
        '建设银行': ['裕农快贷', '土地经营权抵押贷', '乡村振兴贷'],
        '邮储银行': ['金穗惠农贷', '新型农业经营主体贷'],
        '上海农商银行': ['助农贷', '种植业保证保险贷款'],
      };
      const productName = pick(productNames[bank]);
      const amount = config.type === '合作社' ? randFloat(100000, 500000, 0) :
                     config.type === '大户' ? randFloat(50000, 200000, 0) :
                     randFloat(10000, 80000, 0);
      const interestRate = randFloat(3.45, 5.25, 2);
      const termMonths = pick([12, 24, 36]);
      const startYear = randInt(2022, 2025);
      const startMonth = randInt(1, 12);
      const startDate = `${startYear}-${startMonth.toString().padStart(2, '0')}-${randInt(1, 28).toString().padStart(2, '0')}`;

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + termMonths);
      const endDateStr = endDate.toISOString().slice(0, 10);

      const isCompleted = endDate < new Date('2026-03-01');
      const isOverdue = !isCompleted && Math.random() > 0.85;
      const monthsElapsed = Math.min(termMonths, Math.max(0, Math.floor((new Date('2026-03-01').getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))));
      const monthlyPayment = amount / termMonths;
      const repaidAmount = isCompleted ? amount : parseFloat((monthlyPayment * monthsElapsed).toFixed(0));
      const remainingAmount = parseFloat((amount - repaidAmount).toFixed(0));

      const status = isCompleted ? '已结清' :
                     isOverdue ? '逾期' :
                     '正常还款';
      const overdueDays = isOverdue ? randInt(15, 120) : 0;

      insertLoan.run(
        uuid(), farmerId, bank, productName, amount, interestRate, termMonths,
        startDate, endDateStr, status, pick(loanPurposes),
        repaidAmount, remainingAmount,
        isOverdue ? 1 : 0, overdueDays,
      );
    }

    allFarmers.push({
      id: farmerId,
      name,
      phone,
      type: config.type,
      county,
      township,
      totalArea,
    });
  }
}

// ============================================================
// Government policies
// ============================================================

console.log('Inserting government policies...');

const insertPolicy = db.prepare(`
  INSERT INTO gov_policies (id, policy_name, category, description, target_audience, benefit_amount, application_method, deadline, region, crop_type, status, source, publish_date, doc_number, full_text, attachments)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Policy full text templates for 5 key policies (realistic government document format)
const policyFullTexts: Record<string, { docNumber: string; fullText: string; attachments: string }> = {
  '耕地地力保护补贴': {
    docNumber: '沪农委发〔2026〕3号',
    fullText: `上海市农业农村委员会  上海市财政局
关于做好2026年耕地地力保护补贴工作的通知

沪农委发〔2026〕3号

各区农业农村委、财政局：

为贯彻落实党中央、国务院关于稳定和完善农业补贴政策的决策部署，切实保护耕地地力，调动农民种粮积极性，根据《财政部 农业农村部关于做好2026年粮食生产相关补贴工作的通知》（财农〔2026〕8号）精神，现就做好2026年耕地地力保护补贴工作通知如下：

一、补贴对象
补贴对象原则上为拥有耕地承包权的种地农民。对已作为畜牧养殖场使用的耕地、林地、成片粮田转为设施农业用地、非农业征（占）用耕地等已改变用途的耕地，以及长年抛荒地、占补平衡中"补"的面积和质量达不到耕种条件的耕地等不予补贴。

二、补贴标准
全市统一执行补贴标准为125元/亩。补贴资金通过"一卡（折）通"直接发放给农户。各区不得擅自调整补贴标准。

三、申报程序
（一）农户申报。符合条件的农户向所在村委会提交申请，如实申报承包耕地面积。
（二）村级公示。村委会对申报信息进行核实汇总，在村务公开栏公示不少于5个工作日。
（三）镇级审核。镇人民政府对各村上报的补贴面积进行审核，重点核查面积真实性。
（四）区级复核。区级农业农村部门会同财政部门对全区补贴面积进行复核汇总。
（五）资金拨付。经审核确认后，财政部门将补贴资金通过"一卡（折）通"直接发放到户。

四、时间安排
（一）2026年3月1日至4月15日：农户申报、村级公示。
（二）2026年4月16日至5月15日：镇级审核、区级复核。
（三）2026年5月16日至6月30日：资金拨付到户。

五、监督管理
（一）各级农业农村部门要严格审核补贴面积，确保数据真实准确。
（二）各级财政部门要及时足额拨付补贴资金，不得截留、挤占、挪用。
（三）各区要加强补贴政策宣传，确保政策家喻户晓。
（四）对骗取、套取补贴资金的行为，一经查实，追回补贴资金并依法依规追究责任。

附件：1. 耕地地力保护补贴申请表
      2. 补贴资金发放花名册模板

上海市农业农村委员会    上海市财政局
2026年1月15日`,
    attachments: JSON.stringify([
      { name: '耕地地力保护补贴申请表', type: 'form' },
      { name: '补贴资金发放花名册模板', type: 'template' },
    ]),
  },

  '农机购置与应用补贴': {
    docNumber: '农办机〔2026〕1号',
    fullText: `农业农村部办公厅  财政部办公厅
关于做好2026年农机购置与应用补贴工作的通知

农办机〔2026〕1号

各省、自治区、直辖市及计划单列市农业农村（农牧）厅（局）、财政厅（局），新疆生产建设兵团农业农村局、财政局：

为深入贯彻落实中央一号文件精神，加快推进农业机械化和农机装备产业转型升级，现就做好2026年农机购置与应用补贴工作通知如下：

一、补贴范围
（一）补贴机具范围。全国补贴范围内的机具品目为15大类42小类187个品目。各地可根据实际需要，在全国补贴范围基础上进行优化调整。
（二）补贴对象。从事农业生产的个人和农业生产经营组织，包括农户、家庭农场、农民合作社、农业企业等。

二、补贴标准
（一）中央财政农机购置补贴实行定额补贴，一般机具单机补贴额不超过购置价格的30%。
（二）对粮食生产薄弱环节、丘陵山区特色农业生产急需的机具以及智能农机，补贴额可按不超过购置价格的50%测算。
（三）单机补贴限额原则上不超过10万元。100马力以上大型拖拉机、高性能青饲料收获机、大型免耕播种机等不超过25万元。

三、申报程序
（一）购机申请。购机者自主购机后，携带身份证明、购机发票、银行账户信息等，到县级农机化主管部门或其委托的乡镇政府申请补贴。
（二）核验公示。县级农机化主管部门在3个工作日内对购机真实性进行核验，核验通过后在县级政府网站或农机化信息网公示5个工作日。
（三）资金兑付。公示无异议后，县级财政部门在15个工作日内将补贴资金兑付到购机者银行账户。

四、工作要求
（一）简化手续，提高效率，让购机者最多跑一次。
（二）加强监管，严厉打击骗套补贴行为。
（三）建立健全农机购置补贴信息公开制度。

附件：1. 2026年全国农机购置补贴机具种类范围
      2. 农机购置补贴申请表
      3. 补贴机具核验表

农业农村部办公厅    财政部办公厅
2026年1月10日`,
    attachments: JSON.stringify([
      { name: '2026年全国农机购置补贴机具种类范围', type: 'catalog' },
      { name: '农机购置补贴申请表', type: 'form' },
      { name: '补贴机具核验表', type: 'form' },
    ]),
  },

  '实际种粮农民一次性补贴': {
    docNumber: '沪财农〔2026〕15号',
    fullText: `上海市财政局  上海市农业农村委员会
关于下达2026年实际种粮农民一次性补贴资金的通知

沪财农〔2026〕15号

各区财政局、农业农村委：

为有效化解农资价格上涨对实际种粮农民增支影响，稳定农民种粮收益，保障国家粮食安全，根据《财政部关于下达2026年实际种粮农民一次性补贴资金预算的通知》（财农〔2026〕12号），现将有关事项通知如下：

一、补贴对象
（一）利用自有承包地种粮的农民。
（二）流转土地种粮的大户、家庭农场、农民合作社、农业企业等新型农业经营主体。
（三）开展粮食耕种收全程社会化服务的个人和组织。
说明：补贴对象为实际种粮者，而非土地承包者。对于土地流转的情形，补贴发放给实际种粮方。

二、补贴标准
2026年度补贴标准为20元/亩，按照实际种粮面积核定。种植两季粮食作物的，按照主粮作物面积核算，不重复计算。

三、补贴作物范围
补贴作物为水稻、小麦、大豆、薯类、杂粮等粮食作物。经济作物、蔬菜、水果、苗木等非粮食作物不在补贴范围内。

四、申报审核程序
（一）面积申报。实际种粮者向所在村委会申报种粮面积，并提供相关证明材料。流转土地种粮的，需提供土地流转合同。
（二）村级核实。村委会组织对申报面积进行实地核实，并在村务公开栏公示不少于5个工作日。
（三）镇级汇总。镇人民政府对各村核实后的面积进行汇总审核。
（四）区级审定。区级农业农村部门会同财政部门进行最终审定。

五、资金拨付
经审定后，由区级财政部门通过"一卡（折）通"在2026年9月30日前将补贴资金直接发放到实际种粮者账户。

六、监督管理
各区要加强资金监管，严禁虚报面积、骗取补贴，确保补贴资金真正惠及实际种粮农民。

附件：1. 实际种粮农民一次性补贴申报表
      2. 种粮面积核实确认书

上海市财政局    上海市农业农村委员会
2026年2月20日`,
    attachments: JSON.stringify([
      { name: '实际种粮农民一次性补贴申报表', type: 'form' },
      { name: '种粮面积核实确认书', type: 'form' },
    ]),
  },

  '新型农业经营主体贷款贴息': {
    docNumber: '沪农委办〔2026〕7号',
    fullText: `上海市农业农村委员会办公室
关于做好2026年新型农业经营主体贷款贴息工作的通知

沪农委办〔2026〕7号

各区农业农村委：

为进一步降低新型农业经营主体融资成本，支持家庭农场、农民合作社等适度规模经营发展，根据《关于支持新型农业经营主体高质量发展的若干措施》精神，现就做好2026年贷款贴息工作通知如下：

一、贴息对象
（一）经区级以上农业农村部门认定的家庭农场。
（二）在区级以上市场监管部门注册登记的农民合作社。
（三）从事农业产业化经营的农业企业（年销售收入5000万元以下）。

二、贴息范围
（一）贴息贷款须为经营性贷款，用于农业生产经营活动。
（二）贷款银行须为在本市境内注册的银行业金融机构。
（三）单笔贷款金额不超过300万元。

三、贴息标准
（一）按照实际支付利息的50%给予贴息。
（二）贴息利率上限为同期贷款市场报价利率（LPR）。实际贷款利率高于LPR的，按LPR计算贴息额。
（三）每个经营主体年度贴息金额上限为15万元。

四、申报程序
（一）经营主体申报。符合条件的经营主体向所在区农业农村部门提交申请，并提供以下材料：
  1. 贷款贴息申请表
  2. 营业执照或家庭农场认定证书
  3. 贷款合同复印件
  4. 银行利息结算单
  5. 贷款用途相关证明
（二）区级初审。区级农业农村部门对申报材料进行初审，重点审核经营主体资质和贷款真实性。
（三）市级复审。市级农业农村部门对区级上报的贴息申请进行复审汇总。
（四）市级审定。市级农业农村部门组织专家对各区上报的贴息申请进行审定。

五、时间安排
（一）2026年3月—10月：经营主体可随时提交申请。
（二）2026年11月1日—15日：区级集中初审。
（三）2026年11月16日—30日：市级审定、资金拨付。

六、工作要求
（一）加大政策宣传力度，确保符合条件的经营主体应知尽知。
（二）简化申报流程，推行线上申报。
（三）加强资金监管，严禁骗取套取贴息资金。

附件：1. 新型农业经营主体贷款贴息申请表
      2. 贴息资金审核汇总表

上海市农业农村委员会办公室
2026年1月20日`,
    attachments: JSON.stringify([
      { name: '新型农业经营主体贷款贴息申请表', type: 'form' },
      { name: '贴息资金审核汇总表', type: 'template' },
    ]),
  },

  '高标准农田建设补贴': {
    docNumber: '沪农委发〔2026〕12号',
    fullText: `上海市农业农村委员会
关于做好2026年高标准农田建设项目申报工作的通知

沪农委发〔2026〕12号

各区农业农村委：

为深入实施"藏粮于地、藏粮于技"战略，加快推进高标准农田建设，确保完成2026年度建设任务，根据《高标准农田建设规划（2021-2030年）》和农业农村部关于做好2026年高标准农田建设工作的通知要求，现就本市2026年高标准农田建设项目申报有关事项通知如下：

一、建设内容
（一）田块整治。包括土地平整、土壤改良、地力培肥等。
（二）灌溉排水。包括水源工程、输配水工程、喷灌滴灌设施、排水沟渠等。
（三）田间道路。包括机耕路、生产路等。
（四）农田防护。包括农田林网、岸坡防护等。
（五）科技服务。包括土壤监测点、气象观测站、智慧农业设施等。

二、建设标准与补贴
（一）新建高标准农田投资标准为1500元/亩。
（二）资金来源：中央财政补贴60%、市级配套25%、区级配套15%。
（三）项目区农户不需缴纳任何费用。

三、申报条件
（一）项目区集中连片面积不低于1000亩。
（二）项目区耕地质量等级原则上为中等及以下（4-10等）。
（三）项目区无权属纠纷，农民群众积极性高。
（四）项目区具备灌溉水源条件。
（五）优先安排粮食生产功能区和重要农产品保护区。

四、申报程序
（一）村级申请。项目区所在村委会征得三分之二以上农户同意后，向镇政府提交申请。
（二）镇级推荐。镇政府对项目区进行实地踏勘后，向区级农业农村部门推荐。
（三）区级申报。区级农业农村部门组织编制项目初步设计方案，报市级审核。
（四）市级审核。市级农业农村部门组织专家对各区申报项目进行审核排序。
（五）市级批复。市农业农村委对审核通过的项目进行批复立项。

五、时间安排
（一）2026年3月1日至4月30日：村级申请、镇级推荐。
（二）2026年5月1日至6月30日：区级申报、编制设计方案。
（三）2026年7月1日至8月31日：市级审核。
（四）2026年9月—10月：市级批复、开工建设。

六、质量管理
（一）严格执行项目法人制、招标投标制、建设监理制、合同管理制。
（二）项目竣工后须通过区级初验、市级复验。
（三）建立建后管护制度，明确管护主体和管护责任。

附件：1. 高标准农田建设项目申报书（模板）
      2. 项目区基本情况表
      3. 农户同意书（模板）

上海市农业农村委员会
2026年2月1日`,
    attachments: JSON.stringify([
      { name: '高标准农田建设项目申报书（模板）', type: 'template' },
      { name: '项目区基本情况表', type: 'form' },
      { name: '农户同意书（模板）', type: 'template' },
    ]),
  },
};

const policies = [
  {
    name: '耕地地力保护补贴',
    category: '种植补贴',
    description: '对拥有耕地承包权的种地农民，按照承包耕地面积发放补贴，用于支持耕地地力保护，鼓励农民采取秸秆还田、深松整地、施用有机肥等措施。',
    target: '拥有耕地承包权的种地农民',
    amount: '125元/亩',
    method: '通过村委会申报，经乡镇审核后直接发放至一卡通账户',
    deadline: '2026-06-30',
    region: '本市',
    crop: '通用',
    source: '市农业农村委',
    date: '2026-01-15',
  },
  {
    name: '农机购置与应用补贴',
    category: '农机补贴',
    description: '对购买列入补贴目录的农业机械的农户和农业经营组织，按照购买价格的一定比例给予补贴，支持农业机械化发展。',
    target: '农户、家庭农场、农民合作社、农业企业',
    amount: '购置价格的30%-50%',
    method: '先购后补，凭购机发票和相关证明到区级农机部门申请',
    deadline: '2026-12-31',
    region: '全国',
    crop: '通用',
    source: '农业农村部、财政部',
    date: '2026-01-10',
  },
  {
    name: '实际种粮农民一次性补贴',
    category: '种植补贴',
    description: '对实际承担农资价格上涨成本的实际种粮者发放一次性补贴，稳定农民种粮收益，保障国家粮食安全。',
    target: '实际种粮的农户和新型农业经营主体',
    amount: '20元/亩',
    method: '由村委会统计实际种粮面积，上报乡镇审核，直接发放',
    deadline: '2026-09-30',
    region: '本市',
    crop: '水稻、小麦、大豆',
    source: '市财政局',
    date: '2026-02-20',
  },
  {
    name: '稻谷最低收购价政策',
    category: '种植补贴',
    description: '国家对稻谷实行最低收购价政策，当市场价格低于最低收购价时，由指定收储企业按最低收购价收购。保障种粮农民基本收益。',
    target: '所有水稻种植户',
    amount: '1.31元/斤（2026年中晚籼稻）',
    method: '在收购期内到指定收储库点交售即可',
    deadline: '2026-12-31',
    region: '全国',
    crop: '水稻',
    source: '国家发展改革委',
    date: '2025-11-01',
  },
  {
    name: '水稻生态种植补贴',
    category: '种植补贴',
    description: '对采用绿色生态种植方式的水稻种植户给予补贴，鼓励减少化肥农药使用，推广稻渔综合种养等生态模式。',
    target: '水稻种植户',
    amount: '100-200元/亩',
    method: '按实际种植面积申报，经核实后发放',
    deadline: '2026-12-31',
    region: '本市',
    crop: '水稻',
    source: '市农业农村委',
    date: '2026-03-01',
  },
  {
    name: '农业保险保费补贴',
    category: '保险补贴',
    description: '中央和地方财政对种植业保险保费给予补贴，降低农民参保成本。补贴险种包括水稻、小麦、油菜等主要农作物。',
    target: '参加农业保险的种植户',
    amount: '保费的80%（中央+市+区各级补贴）',
    method: '向当地农业保险经办机构投保即可享受补贴',
    deadline: '2026-12-31',
    region: '全国',
    crop: '水稻、小麦、油菜',
    source: '财政部、农业农村部',
    date: '2026-01-05',
  },
  {
    name: '高标准农田建设补贴',
    category: '土地政策',
    description: '对符合条件的耕地进行高标准农田建设改造，包括土地平整、灌溉排水、田间道路、农田防护等工程建设。',
    target: '项目区内的农户和村集体',
    amount: '1500元/亩',
    method: '由区级农业农村部门统一规划、组织实施',
    deadline: '2026-10-31',
    region: '本市',
    crop: '通用',
    source: '市农业农村委',
    date: '2026-02-01',
  },
  {
    name: '新型农业经营主体贷款贴息',
    category: '贷款贴息',
    description: '对家庭农场、农民合作社等新型农业经营主体从金融机构获取的经营性贷款，给予利息补贴，降低融资成本。',
    target: '家庭农场、农民合作社、农业企业',
    amount: '贷款利息的50%（最高不超过同期LPR）',
    method: '向区级农业农村部门申请，提交贷款合同和利息凭证',
    deadline: '2026-11-30',
    region: '本市',
    crop: '通用',
    source: '市农业农村委',
    date: '2026-01-20',
  },
  {
    name: '农业社会化服务补贴',
    category: '技术推广',
    description: '支持农业社会化服务组织为小农户提供代耕代种、统防统治、收储加工等服务，补贴服务费用。',
    target: '接受社会化服务的小农户',
    amount: '30元/亩',
    method: '通过参与社会化服务项目自动享受',
    deadline: '2026-12-31',
    region: '本市',
    crop: '水稻、蔬菜',
    source: '市农业农村委',
    date: '2026-02-15',
  },
  {
    name: '乡村振兴产业发展资金',
    category: '技术推广',
    description: '支持农村产业融合发展、农产品加工、休闲农业、乡村旅游等新业态发展，推动乡村产业振兴。',
    target: '农业企业、合作社、家庭农场',
    amount: '5-50万/项目',
    method: '编制项目申报书，向区级乡村振兴部门申报',
    deadline: '2026-08-31',
    region: '全国',
    crop: '通用',
    source: '国家乡村振兴局',
    date: '2026-01-01',
  },
  {
    name: '农产品产地冷藏保鲜设施建设补贴',
    category: '技术推广',
    description: '支持建设产地冷藏保鲜设施，减少农产品产后损失，提高农产品商品化处理能力和市场议价能力。',
    target: '家庭农场、农民合作社',
    amount: '建设费用的30%（最高100万元）',
    method: '先建后补，向区级农业农村部门申报验收',
    deadline: '2026-10-31',
    region: '全国',
    crop: '蔬菜、水果',
    source: '农业农村部',
    date: '2025-12-15',
  },
  {
    name: '种业振兴行动补贴',
    category: '种植补贴',
    description: '鼓励使用优良品种，对采用通过审定的高产优质新品种的农户给予种子补贴，推动良种推广应用。',
    target: '使用审定良种的种植户',
    amount: '15元/亩',
    method: '凭良种购买凭证申报',
    deadline: '2026-06-30',
    region: '本市',
    crop: '水稻、蔬菜',
    source: '市农业农村委',
    date: '2026-02-10',
  },
  {
    name: '绿色防控技术推广补贴',
    category: '技术推广',
    description: '推广农作物病虫害绿色防控技术，对采用生物防治、物理防治等绿色防控措施的农户给予补贴。',
    target: '采用绿色防控技术的种植户',
    amount: '10元/亩',
    method: '通过参与绿色防控示范区建设享受补贴',
    deadline: '2026-12-31',
    region: '本市',
    crop: '通用',
    source: '市植保站',
    date: '2026-03-01',
  },
  {
    name: '秸秆综合利用补贴',
    category: '种植补贴',
    description: '对实施秸秆还田、秸秆收储加工利用的农户和经营主体给予补贴，促进秸秆资源化利用，减少焚烧污染。',
    target: '实施秸秆综合利用的农户和经营主体',
    amount: '25元/亩',
    method: '由乡镇核实秸秆还田面积后统一申报',
    deadline: '2026-11-30',
    region: '本市',
    crop: '水稻、油菜',
    source: '市农业农村委',
    date: '2026-01-25',
  },
  {
    name: '农村土地经营权抵押贷款试点',
    category: '贷款贴息',
    description: '允许农村承包土地经营权作为抵押物向金融机构申请贷款，拓宽农业融资渠道，利率给予一定优惠。',
    target: '拥有土地经营权证的农户和经营主体',
    amount: '贷款利率优惠0.5-1个百分点',
    method: '持土地经营权证到试点银行申请',
    deadline: '2026-12-31',
    region: '本市',
    crop: '通用',
    source: '中国人民银行市分行',
    date: '2025-12-20',
  },
];

for (const p of policies) {
  const fullTextData = policyFullTexts[p.name];
  insertPolicy.run(
    uuid(), p.name, p.category, p.description, p.target, p.amount,
    p.method, p.deadline, p.region, p.crop, '有效', p.source, p.date,
    fullTextData?.docNumber ?? null,
    fullTextData?.fullText ?? null,
    fullTextData?.attachments ?? null,
  );
}

// ============================================================
// Loan products
// ============================================================

console.log('Inserting loan products...');

const insertLoanProduct = db.prepare(`
  INSERT INTO loan_products (id, bank_name, product_name, description, min_amount, max_amount, interest_rate_min, interest_rate_max, term_months_min, term_months_max, collateral_required, target_audience, features, application_process)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const loanProducts = [
  {
    bank: '农业银行',
    name: '惠农e贷',
    desc: '面向农户的线上信用贷款，无需抵押担保，系统自动审批，最快当天放款。支持随借随还，按日计息。',
    min: 50000, max: 300000,
    rateMin: 3.85, rateMax: 4.35,
    termMin: 6, termMax: 36,
    collateral: '纯信用，无需抵押',
    target: '有稳定种植收入的农户',
    features: '线上申请、自动审批、当天放款、随借随还、按日计息',
    process: '1.手机银行申请 2.系统自动审核 3.签约放款 4.按期还款',
  },
  {
    bank: '农业银行',
    name: '粮农贷',
    desc: '专门面向粮食种植户的优惠贷款产品，利率低于普通涉农贷款，支持购买农资、支付土地流转费等粮食生产相关支出。',
    min: 10000, max: 500000,
    rateMin: 3.65, rateMax: 4.15,
    termMin: 3, termMax: 36,
    collateral: '30万以下免抵押，30万以上需提供担保',
    target: '粮食种植户、种粮大户',
    features: '利率优惠、审批快速、还款灵活、支持粮食收购季集中放款',
    process: '1.携带身份证、土地承包证到网点申请 2.银行调查审批 3.签约放款',
  },
  {
    bank: '建设银行',
    name: '裕农快贷',
    desc: '建设银行面向农户的全线上信贷产品，基于大数据模型评估信用额度，无需线下面签。',
    min: 10000, max: 200000,
    rateMin: 4.05, rateMax: 4.55,
    termMin: 6, termMax: 24,
    collateral: '纯信用，无需抵押担保',
    target: '有信用记录的农户',
    features: '全线上操作、秒批秒贷、额度循环使用、提前还款无违约金',
    process: '1.建行手机银行申请 2.人脸识别认证 3.系统自动审批 4.签约放款',
  },
  {
    bank: '邮储银行',
    name: '金穗惠农贷',
    desc: '邮储银行服务三农的拳头产品，覆盖面广，网点多，适合各类农业生产经营需求。',
    min: 10000, max: 300000,
    rateMin: 4.35, rateMax: 4.85,
    termMin: 6, termMax: 36,
    collateral: '10万以下免抵押，10万以上需房产或土地经营权抵押',
    target: '从事农业生产经营的农户',
    features: '网点覆盖广、审批灵活、还款方式多样、可申请展期',
    process: '1.到邮储网点提交申请材料 2.信贷员实地调查 3.审批放款 4.按约还款',
  },
  {
    bank: '上海农商银行',
    name: '助农贷',
    desc: '上海农商银行推出的小额农户贷款，审批门槛低，适合资金需求较小的普通农户。',
    min: 5000, max: 100000,
    rateMin: 4.55, rateMax: 5.25,
    termMin: 3, termMax: 24,
    collateral: '5万以下免抵押（需1名担保人），5万以上需抵押',
    target: '辖区内农户',
    features: '门槛低、放款快、手续简便、支持按季还息到期还本',
    process: '1.到农商行网点或联系信贷员 2.提交基本材料 3.3-5个工作日审批 4.放款',
  },
  {
    bank: '农业银行',
    name: '农机购置贷款',
    desc: '专项用于购置农业机械设备的贷款，可以所购农机作为抵押物，享受农机补贴配套利率优惠。',
    min: 50000, max: 1000000,
    rateMin: 3.45, rateMax: 3.95,
    termMin: 12, termMax: 60,
    collateral: '所购农机设备抵押',
    target: '购买大型农机的农户、合作社',
    features: '利率低、期限长、可配合农机补贴、最高贷款额度可达农机价格的70%',
    process: '1.确定购机意向 2.到银行申请贷款 3.审批通过后支付农机款 4.办理抵押登记',
  },
  {
    bank: '建设银行',
    name: '土地经营权抵押贷',
    desc: '以农村土地经营权作为抵押物的贷款产品，帮助农户和经营主体盘活土地资产，获取发展资金。',
    min: 50000, max: 500000,
    rateMin: 3.95, rateMax: 4.45,
    termMin: 12, termMax: 60,
    collateral: '农村土地经营权',
    target: '拥有土地经营权证的农户和经营主体',
    features: '额度较高、期限灵活、盘活土地资产、可续贷',
    process: '1.到银行咨询 2.提交土地经营权证等材料 3.评估抵押物价值 4.审批放款',
  },
  {
    bank: '邮储银行',
    name: '新型农业经营主体贷',
    desc: '面向家庭农场、农民合作社、农业企业等新型经营主体的大额贷款，支持规模化农业发展。',
    min: 100000, max: 3000000,
    rateMin: 3.75, rateMax: 4.25,
    termMin: 12, termMax: 60,
    collateral: '房产、土地经营权或信用担保',
    target: '家庭农场、农民合作社、农业企业',
    features: '额度高、期限长、利率优、支持季节性还款安排',
    process: '1.提交经营主体相关证照 2.银行实地考察 3.审批委员会审批 4.签约放款',
  },
  {
    bank: '上海农商银行',
    name: '种植业保证保险贷款',
    desc: '银行与保险公司合作，以农业保险保单作为增信手段的贷款产品，降低农户融资门槛。',
    min: 10000, max: 300000,
    rateMin: 4.15, rateMax: 4.65,
    termMin: 6, termMax: 24,
    collateral: '农业保险保单质押',
    target: '已投保农业保险的种植户',
    features: '保险增信、降低担保门槛、保险赔付优先偿还贷款',
    process: '1.购买农业保险 2.凭保单到银行申请贷款 3.银行审核 4.放款',
  },
  {
    bank: '建设银行',
    name: '乡村振兴贷',
    desc: '服务乡村振兴战略的综合金融产品，支持农业产业化、乡村基础设施建设、农村人居环境整治等。',
    min: 50000, max: 1000000,
    rateMin: 3.55, rateMax: 4.05,
    termMin: 12, termMax: 60,
    collateral: '房产抵押或信用担保',
    target: '农业产业化龙头企业、合作社、农业项目承建方',
    features: '利率优惠、额度大、期限灵活、支持项目贷款',
    process: '1.提交项目计划书 2.银行尽调评估 3.审批委员会审批 4.分期放款',
  },
];

for (const lp of loanProducts) {
  insertLoanProduct.run(
    uuid(), lp.bank, lp.name, lp.desc,
    lp.min, lp.max, lp.rateMin, lp.rateMax,
    lp.termMin, lp.termMax,
    lp.collateral, lp.target, lp.features, lp.process,
  );
}

// ============================================================
// Print summary
// ============================================================

console.log('\n========================================');
console.log('Seed data generation complete!');
console.log('========================================\n');

const counts = {
  farmers: (db.prepare('SELECT COUNT(*) as count FROM farmers').get() as any).count,
  land_parcels: (db.prepare('SELECT COUNT(*) as count FROM land_parcels').get() as any).count,
  crop_records: (db.prepare('SELECT COUNT(*) as count FROM crop_records').get() as any).count,
  equipment: (db.prepare('SELECT COUNT(*) as count FROM equipment').get() as any).count,
  loan_history: (db.prepare('SELECT COUNT(*) as count FROM loan_history').get() as any).count,
  gov_policies: (db.prepare('SELECT COUNT(*) as count FROM gov_policies').get() as any).count,
  loan_products: (db.prepare('SELECT COUNT(*) as count FROM loan_products').get() as any).count,
};

console.log('Table                Count');
console.log('─────────────────────────');
for (const [table, count] of Object.entries(counts)) {
  console.log(`${table.padEnd(20)} ${count}`);
}

// Farmer type breakdown
console.log('\nFarmer type breakdown:');
const typeBreakdown = db.prepare('SELECT farmer_type, COUNT(*) as count FROM farmers GROUP BY farmer_type').all() as any[];
for (const row of typeBreakdown) {
  console.log(`  ${row.farmer_type}: ${row.count}`);
}

// Area statistics
const areaStats = db.prepare('SELECT farmer_type, ROUND(AVG(lp.total_area), 1) as avg_area FROM farmers f JOIN (SELECT farmer_id, SUM(area_mu) as total_area FROM land_parcels GROUP BY farmer_id) lp ON f.id = lp.farmer_id GROUP BY farmer_type').all() as any[];
console.log('\nAverage area by type (mu):');
for (const row of areaStats) {
  console.log(`  ${row.farmer_type}: ${row.avg_area} 亩`);
}

console.log(`\nDatabase saved to: ${dbPath}`);
db.close();
