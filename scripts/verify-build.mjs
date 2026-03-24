import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

async function verify() {
  console.log('\n[Verify] Starting packaged binary verification without debugger overhead...');

  const pkg = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf8'));
  const productName = pkg.build?.productName || pkg.productName || 'TheAndb';

  let appPath;
  if (process.platform === 'darwin') {
    const archDir = process.arch === 'arm64' ? 'mac-arm64' : 'mac';
    appPath = path.resolve(`dist/${archDir}/${productName}.app/Contents/MacOS/${productName}`);
  } else if (process.platform === 'win32') {
    appPath = path.resolve(`dist/win-unpacked/${productName}.exe`);
  } else {
    appPath = path.resolve(`dist/linux-unpacked/${productName.toLowerCase()}`);
  }

  if (!fs.existsSync(appPath)) {
    console.error(`[Verify] Executable not found at:\n${appPath}\nPackaging step likely failed.`);
    process.exit(1);
  }

  console.log(`[Verify] Launching native executable:\n${appPath}`);

  const child = spawn(appPath, [], { stdio: 'pipe' });
  child.stdout.on('data', d => console.log(`[App] ${d.toString().trim()}`));
  child.stderr.on('data', d => console.error(`[App Error] ${d.toString().trim()}`));

  // If the app stays alive for 5 seconds without crashing, it is considered a pristine boot.
  const successTimer = setTimeout(() => {
    console.log('\n[Verify] ✅ SUCCESS! App initialized and remained stable for 5 seconds.');
    child.kill('SIGTERM');
    process.exit(0);
  }, 5000);

  child.on('close', code => {
    clearTimeout(successTimer);
    if (code !== 0 && code !== null) {
      console.error(`\n[Verify] ❌ FAILURE: App crashed immediately with exit code ${code}`);
      process.exit(1);
    } else {
      console.log(`[Verify] App exited cleanly with code 0.`);
      process.exit(0);
    }
  });
}

verify();
