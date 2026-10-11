// Renders contact sheets of candidate seeds with the app's own board renderer.
import { readFileSync, writeFileSync } from 'node:fs';
import { boardSVG } from '../../src/catan-board.js';
import { newGame, apply } from './replay.mjs';

const css = readFileSync(new URL('../../main.css', import.meta.url), 'utf8');
const [, , from = '0', count = '16', w = '420'] = process.argv;
const cands = JSON.parse(readFileSync(new URL('./candidates.json', import.meta.url), 'utf8')).slice(Number(from), Number(from) + Number(count));
let html = `<html><head><style>${css} body{background:#1b4551;display:block} .row{display:flex;gap:8px;align-items:flex-start;margin:10px} .row svg{width:${w}px;height:${w * 0.816}px;background:#1b4551} .lab{color:#fff;font:14px monospace;width:200px}</style></head><body>`;
for (const c of cands) {
  const { game, random } = newGame(c.seed);
  const shots = [];
  let info = '';
  for (const a of c.actions) {
    apply(game, random, a);
    if (a.type !== 'beat') continue;
    if (a.name === 'split') shots.push(boardSVG(game, null, null, a.slot));
    if (a.name === 'harvest1Roll') shots.push(boardSVG(game, null, null, null));
    if (a.name === 'cz') shots.push(boardSVG(game, null, null, a.slot));
    if (a.name === 'harvest1' || a.name === 'harvest2') { shots.push(boardSVG(game, null, null, null)); info += `${a.name}: dice ${game.dice} prod ${JSON.stringify(game.production)}<br>`; }
  }
  html += `<div class="row"><div class="lab">seed ${c.seed} turns ${c.turns}<br>${info}</div>${shots.join('')}</div>`;
}
writeFileSync(new URL('./preview.html', import.meta.url), html + '</body></html>');
console.log('ok');
