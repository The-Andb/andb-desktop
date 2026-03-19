const Database = require('better-sqlite3');
const db = new Database('/Users/anph/Library/Application Support/TheAndb_v3_dev/andb-storage.db');
const results = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`).all();
console.log("Tables:", results);
const ddl = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name = ?`).all('comparisons');
console.log("DDL:", ddl);
