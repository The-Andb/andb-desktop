import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const nativeNodeModulesPlugin = {
  name: 'native-node-modules',
  setup(build) {
    build.onResolve({ filter: /\.node$/, namespace: 'file' }, args => ({
      path: args.path,
      external: true,
    }))
  },
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get Core Version and Git Commit SHA
const corePkgPath = path.resolve(__dirname, '../../andb-core/package.json');
const corePkg = JSON.parse(fs.readFileSync(corePkgPath, 'utf8'));
const coreVersion = corePkg.version;

let gitSha = 'UNKNOWN';
try {
  gitSha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
} catch (e) {
  console.warn('Could not retrieve Git SHA');
}

const buildTime = new Date().toISOString();

// Define globals
const defineMap = {
  '__CORE_VERSION__': JSON.stringify(coreVersion),
  '__CORE_COMMIT__': JSON.stringify(gitSha),
  '__BUILD_TIME__': JSON.stringify(buildTime)
};

async function buildAll() {
  // Build Main (async because plugins are required)
  await esbuild.build({
    entryPoints: ['electron/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist-electron/main.cjs',
    external: ['electron', 'better-sqlite3', 'fsevents', 'path', 'fs', 'child_process', 'events', 'electron-updater', '@sentry/electron/main'],
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    format: 'cjs',
    plugins: [nativeNodeModulesPlugin],
    define: defineMap
  });

  // Build Preload (no plugins needed, but using async for consistency)
  await esbuild.build({
    entryPoints: ['electron/preload.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist-electron/preload.js',
    external: ['electron'],
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: process.env.NODE_ENV === 'production',
    format: 'cjs',
    define: defineMap
  });

  // Generate build manifest
  const manifest = {
    desktop_version: process.env.npm_package_version || 'UNKNOWN',
    core_version: coreVersion,
    core_commit: gitSha,
    build_time: buildTime
  };
  fs.writeFileSync('dist-electron/build-manifest.json', JSON.stringify(manifest, null, 2));
  console.log(`[ESBuild] Successfully bundled main + preload (Core v${coreVersion}, SHA: ${gitSha})`);
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
