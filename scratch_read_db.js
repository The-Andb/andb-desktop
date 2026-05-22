const Database = require('better-sqlite3');
const db = new Database('./andb-storage.db');

try {
  console.log('--- CONNECTIONS ---');
  const conns = db.prepare('SELECT * FROM project_connections').all();
  console.log(conns.map(c => ({ id: c.id, name: c.name, environment: c.environment, database: c.database })));

  console.log('--- DDL EXPORTS (first 10) ---');
  const ddl = db.prepare('SELECT environment, database_name, export_type, export_name, file_path, ddl_content FROM ddl_exports LIMIT 10').all();
  console.log(ddl);

  console.log('--- SEARCHING test_l2025_getLinkedObjectsForMembersV2 ---');
  const matched = db.prepare("SELECT * FROM ddl_exports WHERE export_name LIKE '%test_l2025_getLinkedObjectsForMembersV2%'").all();
  console.log(matched);
} catch (e) {
  console.error(e);
} finally {
  db.close();
}
