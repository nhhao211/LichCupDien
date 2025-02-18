const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, '../data/poweroutages.db'));

function initializeDatabase() {
  db.serialize(() => {
    // Create power outages table
    db.run(`CREATE TABLE IF NOT EXISTS power_outages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_code TEXT NOT NULL,
      district_name TEXT NOT NULL,
      outage_date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      affected_area TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(district_code, outage_date, start_time, end_time, affected_area)
    )`);

    // Create districts table
    db.run(`CREATE TABLE IF NOT EXISTS districts (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL
    )`);

    // Insert district data
    const districts = [
      ['PB0201', 'Điện lực Phan Thiết'],
      ['PB0202', 'Điện lực Tuy Phong'],
      ['PB0203', 'Điện lực Đức Linh'],
      ['PB0205', 'Điện lực Hàm Tân'],
      ['PB0206', 'Điện lực Phú Quý'],
      ['PB0207', 'Điện lực Hàm Thuận Bắc']
    ];

    const insertDistrict = db.prepare('INSERT OR REPLACE INTO districts (code, name) VALUES (?, ?)');
    districts.forEach(district => {
      insertDistrict.run(district);
    });
    insertDistrict.finalize();
  });
}

module.exports = {
  db,
  initializeDatabase
};
