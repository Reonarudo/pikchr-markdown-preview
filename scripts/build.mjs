import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/extension.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  // `vscode` is provided by the host. The Emscripten module stays external and is shipped as
  // `vendor/pikchr/pikchr.js`, so the same relative require resolves from `src/` in development
  // and from `dist/` in the packaged extension.
  external: ['vscode', '../vendor/pikchr/pikchr.js'],
  sourcemap: false
});
