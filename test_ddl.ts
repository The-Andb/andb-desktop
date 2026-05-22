import { DesktopStorageStrategy } from './electron/storage/strategy/desktop-storage.strategy';

async function main() {
  const strategy = new DesktopStorageStrategy();
  strategy.setProjectBaseDir('/Users/anph/Library/Application Support/TheAndb_v3_dev/projects/flo_api', true);
  try {
    const exports = await strategy.getDdlExports('DEV', 'preflow_41', 'PROCEDURES', undefined, 'mysql');
    console.log("Found:", exports.length);
    if (exports.length > 0) {
      console.log("First export:", exports[0].export_name);
      console.log("File path:", exports[0].file_path);
      console.log("DDL Content Length:", exports[0].ddl_content ? exports[0].ddl_content.length : 0);
      if (!exports[0].ddl_content) {
          console.log("DDL CONTENT IS EMPTY!");
          const fs = require('fs');
          const p = require('path');
          const fullPath = p.join(strategy.getProjectBaseDir(), exports[0].file_path);
          console.log("Expected full path:", fullPath);
          console.log("Exists?", fs.existsSync(fullPath));
      }
    }
  } catch(e) {
    console.error(e);
  }
}
main();
