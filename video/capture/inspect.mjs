import { readFileSync } from 'node:fs';
import { newGame, apply } from './replay.mjs';
const seed = Number(process.argv[2]);
const all = JSON.parse(readFileSync(new URL('./candidates.json', import.meta.url), 'utf8'));
const c = all.find((x) => x.seed === seed);
const { game, random } = newGame(seed);
for (const a of c.actions) {
  apply(game, random, a);
  const g = game;
  if (a.type === 'beat') {
    const q = g.pending.map((p) => `Q${p.slot + 1}(${g.players[p.owner].name}) sites ${p.sites} pB=${g.quantum.marginal(p.slot).toFixed(3)} purity=${g.quantum.purity(p.slot).toFixed(3)}`).join(' | ');
    console.log(`T${g.turn} ${g.player.name} [${a.name}] dice=${g.dice} prod=${JSON.stringify(g.production)} ${q}`);
    console.log('   hands', g.players.map((p) => JSON.stringify(p.hand)).join(' '), 'scores', g.players.map((p) => g.score(p.id)));
  } else if (a.type === 'roll') console.log(`T${g.turn} ${g.player.name} roll ${a.dice} prod=${JSON.stringify(g.production)}`);
  else if (a.type !== 'end') console.log(`T${g.turn} ${g.player.name} ${JSON.stringify(a)}`);
}
console.log('last ops', JSON.stringify(game.lastQuantum), 'dist', game.lastDistribution?.map((p, i) => (p > 1e-9 ? i.toString(2).padStart(8, '0') + ':' + p.toFixed(3) : '')).filter(Boolean));
