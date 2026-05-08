import fs from 'fs';
import path from 'path';

const repoRoot = process.cwd();
const nodeModules = path.join(repoRoot, 'node_modules');
const sharedDir = path.join(repoRoot, 'shared');
const linkPath = path.join(nodeModules, 'shared');

try {
  if (!fs.existsSync(sharedDir)) {
    console.warn('[link-shared] shared directory not found at', sharedDir);
    process.exit(0);
  }
  if (!fs.existsSync(nodeModules)) fs.mkdirSync(nodeModules, { recursive: true });

  if (fs.existsSync(linkPath)) {
    // existing path - check if it's our expected symlink
    const stat = fs.lstatSync(linkPath);
    if (stat.isSymbolicLink()) {
      const target = fs.readlinkSync(linkPath);
      if (path.resolve(repoRoot, target) === path.resolve(sharedDir)) {
        console.log('[link-shared] symlink already correct');
        process.exit(0);
      }
    }
    console.log('[link-shared] removing existing node_modules/shared');
    fs.rmSync(linkPath, { recursive: true, force: true });
  }

  // Create symlink node_modules/shared -> ../shared
  fs.symlinkSync(sharedDir, linkPath, 'dir');
  console.log('[link-shared] created symlink', linkPath, '->', sharedDir);
} catch (err) {
  console.error('[link-shared] failed to create symlink', err);
  process.exit(1);
}
