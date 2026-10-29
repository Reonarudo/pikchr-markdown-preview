import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Unpack the VSIX and run the extension-host test against what is inside it, so a file the
// `.vscodeignore` trims by mistake fails here rather than for users.
const local = JSON.parse(await readFile('package.json', 'utf8'));
const file = resolve(process.argv[2] || `pikchr-diagram-preview-${local.version}.vsix`);
const temp = await mkdtemp(join(tmpdir(), 'pikchr-vsix-'));
try {
  execFileSync('unzip', ['-q', file, '-d', temp]);
  const root = join(temp, 'extension');
  for (const path of [
    'dist/extension.js', 'media/preview.css', 'media/preview.js', 'media/icon.png', 'readme.md', 'LICENSE.txt', 'THIRD_PARTY_NOTICES.md',
    'node_modules/@reonarudo/pikchr-renderer/package.json',
    'node_modules/@reonarudo/pikchr-renderer/dist/worker.js',
    'node_modules/@reonarudo/pikchr-renderer/vendor/pikchr/pikchr.cjs',
    'node_modules/@reonarudo/pikchr-renderer/licenses/PIKCHR-0BSD',
    'node_modules/@xmldom/xmldom/LICENSE'
  ]) assert.ok((await stat(join(root, path))).size > 0, path);
  assert.equal(execFileSync('unzip', ['-Z1', file], { encoding: 'utf8' }).split('\n').some(
    (name) => /^extension\/(vendor\/|src\/|test\/)|\.d\.ts$|\.map$/.test(name)), false, 'no sources, tests, declarations or maps');
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.publisher, 'ReoX86');
  assert.equal(manifest.version, local.version);
  execFileSync(process.execPath, ['scripts/test-extension.mjs'], {
    stdio: 'inherit', env: { ...process.env, PIKCHR_EXTENSION_PATH: root }
  });
  console.log(`Packaged extension layout and real extension-host rendering: PASS (${(await stat(file)).size} bytes)`);
} finally {
  await rm(temp, { recursive: true, force: true });
}
