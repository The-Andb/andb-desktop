import fs from 'fs';
import path from 'path';

const pkgPath = path.resolve('andb-desktop/package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Move all dependencies except better-sqlite3 to devDependencies
for (const [name, ver] of Object.entries(pkg.dependencies || {})) {
  if (name !== 'better-sqlite3') {
    pkg.devDependencies[name] = ver;
    delete pkg.dependencies[name];
  }
}

// Ensure !node_modules is NOT in files list anymore so better-sqlite3 perfectly copies over
if (pkg.build && pkg.build.files) {
    pkg.build.files = pkg.build.files.filter(f => !f.includes('node_modules'));
}

// Remove bloated extraResources that copy 100MB of Linux/Windows CLI executables to macOS Installer
if (pkg.build && pkg.build.extraResources) {
    pkg.build.extraResources = pkg.build.extraResources.map(res => {
        // We only copy mac-specific binary for mac installers or avoid bringing `.exe`/`linux` entirely
        if (res.from === '../andb-cli') {
            res.filter = ["dist/andb-cli-mac*", "package.json"];
        }
        if (res.from === '../andb-mcp') {
            res.filter = ["dist/andb-mcp-mac*", "package.json"];
        }
        return res;
    });
}

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('Dependencies & extraResources migrated perfectly. App payload will now drop drastically.');
