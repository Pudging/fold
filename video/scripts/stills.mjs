// node scripts/stills.mjs 100 400 ...  -> out/stills/f<frame>.jpg
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const frames = process.argv.slice(2).map(Number);
const entry = path.resolve('src/index.ts');
const serveUrl = await bundle({ entryPoint: entry, webpackOverride: (c) => c });
const composition = await selectComposition({ serveUrl, id: 'FoldDemo' });
mkdirSync('out/stills', { recursive: true });
for (const frame of frames) {
  await renderStill({ composition, serveUrl, frame, output: `out/stills/f${frame}.jpg`, imageFormat: 'jpeg', jpegQuality: 85, scale: 0.5 });
  console.log('rendered', frame);
}
