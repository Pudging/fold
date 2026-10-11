// Copies the game's own engine/renderer and the capture data into the video bundle.
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const dest = new URL('../src/engine/', import.meta.url);
mkdirSync(dest, { recursive: true });
for (const f of ['catan.js', 'board.js', 'quantum.js', 'catan-board.js']) copyFileSync(new URL(`src/${f}`, root), new URL(f, dest));
copyFileSync(new URL('capture/rng.mjs', new URL('../', import.meta.url)), new URL('rng.js', dest));
const replay = readFileSync(new URL('../capture/replay.mjs', import.meta.url), 'utf8')
  .replace("'../../src/catan.js'", "'./catan.js'").replace("'./rng.mjs'", "'./rng.js'");
writeFileSync(new URL('replay.js', dest), replay);
copyFileSync(new URL('../capture/plan.json', import.meta.url), new URL('plan.json', dest));
copyFileSync(new URL('../public/capture/manifest.json', import.meta.url), new URL('manifest.json', dest));
// The app's board styles, scoped for embedding
const css = readFileSync(new URL('main.css', root), 'utf8');
const keep = css.match(/(?<=^|\}|\n)\.(number|pips|red|port|robber|ghost[\w-]*|quantum-thread|correlation-thread|yield)[^{]*\{[^}]*\}/g).join('\n');
writeFileSync(new URL('board.css', dest), keep);
console.log('synced');
