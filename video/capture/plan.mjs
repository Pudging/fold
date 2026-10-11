// Plans a fully legal two-player Fold match that reaches every demo beat.
// The only steering is the choice of dice totals (never 7) and setup/build choices.
// Measurements use the seeded PRNG through the engine's own Born-rule sampler.
import { writeFileSync } from 'node:fs';
import { KEYS, COSTS } from '../../src/board.js';
import { newGame, apply } from './replay.mjs';

const pips = (n) => (n ? 6 - Math.abs(7 - n) : 0);
const A = 0, B = 1;

function plan(seed) {
  const { game, random } = newGame(seed);
  const actions = [];
  const act = (a) => { apply(game, random, a); actions.push(a); };
  const beat = (name, extra = {}) => actions.push({ type: 'beat', name, turn: game.turn, ...extra });
  const nodes = game.board.nodes, tiles = game.board.tiles;
  const nodeValue = (id, kinds = new Set()) => nodes[id].tiles.reduce((s, t) => {
    const k = tiles[t].kind; return s + pips(tiles[t].number) + (k !== 'desert' && !kinds.has(k) ? 1.2 : 0);
  }, 0);
  const owned = new Set([[], []]);
  const kindsOf = (p) => new Set(nodes.filter((n) => n.owner === p).flatMap((n) => n.tiles.map((t) => tiles[t].kind)));
  // --- setup
  while (game.phase.startsWith('setup')) {
    const p = game.active;
    const want = p === A ? ['ore', 'wheat'] : ['wood', 'brick'];
    const legal = nodes.filter((n) => game.legalSettlement(n.id, true));
    const score = (n) => nodeValue(n.id, kindsOf(p)) + n.tiles.filter((t) => want.includes(tiles[t].kind)).length * 1.5 + (n.tiles.length === 3 ? 1 : 0);
    const best = legal.sort((x, y) => score(y) - score(x))[0];
    act({ type: 'setupSettlement', node: best.id, player: p });
    const edges = game.board.edges.filter((e) => game.legalRoad(e.id, true));
    const far = (e) => (e.a === best.id ? e.b : e.a);
    const reach = (e) => nodes[far(e)].neighbors.filter((j) => j !== best.id && game.vacant(j)).reduce((s, j) => s + nodeValue(j) + 2, 0);
    act({ type: 'setupRoad', edge: edges.sort((x, y) => reach(y) - reach(x))[0].id, player: p });
  }
  beat('setupDone');
  void owned;

  // Goals in story order.
  const goals = [
    { id: 'road', owner: A }, { id: 'trade', owner: B }, { id: 'city', owner: A }, { id: 'split', owner: A },
    { id: 'quantum', owner: B }, { id: 'z', owner: A }, { id: 'hA', owner: B }, { id: 'hB', owner: A },
    { id: 'split2', owner: B }, { id: 'quantum2', owner: A }, { id: 'cz', owner: B }, { id: 'bell', owner: A },
  ];
  let gi = 0;
  const pendingOf = (p) => game.pending.filter((q) => q.owner === p);
  const sites = () => new Set(game.pending.flatMap((q) => q.sites));
  const touches = (total) => game.pending.some((q) => q.sites.some((id) => nodes[id].tiles.some((t) => tiles[t].number === total && t !== game.robber)));
  const goalCost = (g) => {
    if (!g) return {};
    if (g.id === 'road') return COSTS.road;
    if (g.id === 'city') return COSTS.city;
    if (g.id === 'split' || g.id === 'split2') return { ore: 1, ...(game.splitCandidates().length ? {} : COSTS.road) };
    if (g.id === 'quantum' || g.id === 'quantum2') return COSTS.quantum;
    return {};
  };
  const needsFor = (p) => {
    const need = Object.fromEntries(KEYS.map((k) => [k, 0]));
    for (const g of goals.slice(gi).filter((g) => g.owner === p).slice(0, 2)) for (const [k, n] of Object.entries(goalCost(g))) need[k] += n;
    if (p === A && gi <= 3) need.ore += 1; // city + split
    if (p === B && gi <= 4) { need.wood += 2; need.brick += 2; } // roads to reach two quantum sites
    if (p === A && gi >= 8) { need.wood += 1; need.brick += 1; }
    return need;
  };
  const deficit = (p) => { const n = needsFor(p), h = game.players[p].hand; return KEYS.reduce((s, k) => s + Math.max(0, n[k] - h[k]), 0); };
  const gain = (total, p) => {
    const need = needsFor(p), h = game.players[p].hand; let v = 0;
    for (const t of tiles) if (t.number === total && t.id !== game.robber) for (const id of t.nodes) if (nodes[id].owner === p) {
      v += (h[t.kind] < need[t.kind] ? 3 : 0.4) * nodes[id].level;
    }
    return v;
  };
  const roll = (wantCollapse = false, collapseFavor = null) => {
    const totals = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].filter((t) => (wantCollapse ? touches(t) : !touches(t)));
    if (!totals.length) throw Error('no legal total');
    const score = (t) => gain(t, game.active) * 1.0 + gain(t, 1 - game.active) * 0.8 + pips(t) * 0.05 + (collapseFavor ? collapseFavor(t) : 0);
    const total = totals.sort((x, y) => score(y) - score(x))[0];
    const d1 = Math.max(1, total - 6), dice = [Math.min(6, Math.max(d1, Math.ceil(total / 2))), 0];
    dice[1] = total - dice[0];
    act({ type: 'roll', dice, total });
  };
  const bankFill = (p) => {
    const need = needsFor(p), h = game.players[p].hand;
    for (let guard = 0; guard < 4; guard++) {
      const lack = KEYS.find((k) => h[k] < need[k] && game.bank[k] > 0);
      const surplus = KEYS.find((k) => h[k] - need[k] >= game.tradeRate(k) && k !== lack);
      if (!lack || !surplus) return;
      act({ type: 'bank', give: surplus, take: lack });
    }
  };
  const roadTowardSites = (p, keepFor = {}) => {
    if (!game.affordable('road')) return false;
    for (const [k, n] of Object.entries(keepFor)) if (game.player.hand[k] - (COSTS.road[k] || 0) < n) return false;
    const cands = game.board.edges.filter((e) => game.legalRoad(e.id));
    const val = (e) => {
      const ends = [e.a, e.b].filter((id) => !nodes[id].edges.some((j) => game.board.edges[j].owner === p && j !== e.id) || nodes[id].owner === null);
      return ends.reduce((s, id) => s + (game.vacant(id) ? 5 + nodeValue(id) : 0) + nodes[id].neighbors.filter((j) => game.vacant(j)).length, 0) + e.id * 1e-6;
    };
    if (!cands.length) return false;
    act({ type: 'road', edge: cands.sort((x, y) => val(y) - val(x))[0].id });
    return true;
  };
  const legalSites = () => nodes.filter((n) => game.legalSettlement(n.id)).map((n) => n.id);

  for (let turnGuard = 0; turnGuard < 60 && gi < goals.length; turnGuard++) {
    const p = game.active;
    const g = goals[gi];
    const mine = g.owner === p;
    // Pre-roll quantum actions
    if (mine && g.id === 'z') { const q = pendingOf(p)[0]; act({ type: 'gate', gate: 'z', slot: q.slot }); beat('z', { slot: q.slot }); gi++; }
    else if (mine && g.id === 'hA') { const q = pendingOf(p)[0]; act({ type: 'gate', gate: 'h', slot: q.slot }); beat('hA', { slot: q.slot }); gi++; }
    else if (mine && g.id === 'cz') {
      const q = pendingOf(p)[0], o = pendingOf(1 - p)[0];
      if (q && o && q.born !== game.turn) { act({ type: 'gate', gate: 'cz', slot: q.slot, other: o.slot }); beat('cz', { slot: q.slot, other: o.slot }); gi++; }
    }
    let collapseRoll = false;
    const cur = goals[gi];
    if (cur && cur.owner === p && (cur.id === 'hB' || cur.id === 'bell')) {
      const q = pendingOf(p)[0];
      if (q && q.born !== game.turn) { act({ type: 'gate', gate: 'h', slot: q.slot }); beat(cur.id, { slot: q.slot }); collapseRoll = true; }
    }
    if (collapseRoll) {
      beat(cur.id === 'hB' ? 'harvest1Roll' : 'harvest2Roll');
      const before = game.players.map((pl) => ({ ...pl.hand }));
      roll(true, (t) => gain(t, p) * 2);
      beat(cur.id === 'hB' ? 'harvest1' : 'harvest2', { before });
      gi++;
    } else roll(false);

    // Actions phase
    const tryGoal = () => {
      const g2 = goals[gi]; if (!g2 || g2.owner !== game.active) return false;
      if (g2.id === 'road') {
        const before = game.players[p].hand;
        if (!game.affordable('road')) return false;
        const cands = game.board.edges.filter((e) => game.legalRoad(e.id));
        // A road whose far end is a vacant legal site (future split destination)
        const target = cands.find((e) => [e.a, e.b].some((id) => game.vacant(id))) || cands[0];
        beat('roadBefore'); act({ type: 'road', edge: target.id }); beat('road'); void before; gi++; return true;
      }
      if (g2.id === 'trade') {
        const me = game.players[B].hand, them = game.players[A].hand, needB = needsFor(B), needA = needsFor(A);
        const give = KEYS.filter((k) => me[k] > 0).sort((x, y) => (me[y] - needB[y]) - (me[x] - needB[x]) + (needA[y] - them[y]) - (needA[x] - them[x]))[0];
        const take = KEYS.filter((k) => them[k] > 0 && k !== give).sort((x, y) => (needB[y] - me[y]) - (needB[x] - me[x]) + (them[y] - needA[y]) - (them[x] - needA[x]))[0];
        if (!give || !take) return false;
        const gh = Object.fromEntries(KEYS.map((k) => [k, k === give ? 1 : 0])), th = Object.fromEntries(KEYS.map((k) => [k, k === take ? 1 : 0]));
        act({ type: 'trade', to: A, give: gh, take: th }); beat('trade'); gi++; return true;
      }
      if (g2.id === 'city') {
        if (!game.affordable('city')) return false;
        const mineNodes = nodes.filter((n) => game.legalCity(n.id));
        const best = mineNodes.sort((x, y) => nodeValue(y.id) - nodeValue(x.id))[0];
        act({ type: 'city', node: best.id }); beat('city', { node: best.id }); gi++; return true;
      }
      if (g2.id === 'split' || g2.id === 'split2') {
        if (game.quantumUsed || game.player.hand.ore < 1) return false;
        const origins = game.splitCandidates();
        if (!origins.length) { roadTowardSites(game.active, { ore: 1 }); return false; }
        // Prefer a nearby destination for a readable shot
        let best = null;
        for (const o of origins) for (const d of game.splitCandidates(o)) {
          const dist = Math.hypot(nodes[o].x - nodes[d].x, nodes[o].y - nodes[d].y);
          const s = -Math.abs(dist - 130) + nodeValue(d) * 3;
          if (!best || s > best.s) best = { o, d, s };
        }
        act({ type: 'split', a: best.o, b: best.d }); beat(g2.id, { slot: game.pending.at(-1).slot }); gi++; return true;
      }
      if (g2.id === 'quantum' || g2.id === 'quantum2') {
        if (game.quantumCandidates().length < 2) { if (!game.affordable('quantum') || game.player.hand.wood > 1) roadTowardSites(game.active, COSTS.quantum); return false; }
        if (!game.affordable('quantum')) return false;
        const cands = game.quantumCandidates();
        let best = null;
        for (const a of cands) for (const b of game.quantumCandidates(a)) {
          const s = nodeValue(a) + nodeValue(b) - Math.abs(Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y) - 140) / 40;
          if (!best || s > best.s) best = { a, b, s };
        }
        act({ type: 'quantum', a: best.a, b: best.b }); beat(g2.id, { slot: game.pending.at(-1).slot }); gi++; return true;
      }
      return false;
    };
    bankFill(p);
    for (let i = 0; i < 3; i++) if (!tryGoal()) break;
    // Opportunistic prep: roads toward sites for upcoming quantum builds
    const upcoming = goals.slice(gi).filter((x) => x.owner === p).map((x) => x.id);
    if ((upcoming.includes('quantum') || upcoming.includes('quantum2')) && legalSites().length < 3) roadTowardSites(p, upcoming[0] === 'city' ? COSTS.city : {});
    if (game.winner !== null) throw Error('someone won');
    act({ type: 'end' });
  }
  if (gi < goals.length) throw Error('incomplete at goal ' + goals[gi].id);
  return { seed, actions, game, random, turns: game.turn, deficitA: deficit(A), nodeValue };
}

// Plays on from the last story beat to a winner with a simple strategy for both
// players. Dice are drawn from the real two-dice distribution, minus 7 (no robber
// sequence in the capture), from a separate seeded stream.
function finish(r) {
  const { game, random, actions, nodeValue } = r;
  const act = (a) => { apply(game, random, a); actions.push(a); };
  actions.push({ type: 'beat', name: 'storyDone', turn: game.turn });
  const nodes = game.board.nodes, tiles = game.board.tiles;
  let s = 0x9e3779b9 ^ r.seed;
  const rng = () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const value = (id) => nodeValue(id);
  const bestBy = (list, f) => list.slice().sort((x, y) => f(y) - f(x))[0];
  for (let guard = 0; guard < 90 && game.winner === null; guard++) {
    const p = game.active;
    const mine = game.pending.find((q) => q.owner === p && q.born !== game.turn);
    if (mine && !game.quantumUsed && game.quantum.purity(mine.slot) > 0.99999) {
      const b = game.quantum.bloch(mine.slot), wantB = value(mine.sites[1]) > value(mine.sites[0]);
      const settled = wantB ? b.z < -0.999 : b.z > 0.999;
      if (!settled && Math.abs(b.z) < 0.001) {
        const gate = (wantB ? b.x < -0.999 : b.x > 0.999) ? 'h' : 'z';
        act({ type: 'gate', gate, slot: mine.slot, late: true });
      }
    }
    if (!game.quantumUsed && !game.pending.some((q) => q.owner === p) && game.player.hand.ore > 0 && game.usedSlots < 8) {
      let best = null;
      for (const o of game.splitCandidates()) for (const d of game.splitCandidates(o)) {
        const v = value(d) - value(o) * 0.5;
        if (value(d) >= value(o) - 4 && (!best || v > best.v)) best = { o, d, v };
      }
      if (best) act({ type: 'split', a: best.o, b: best.d, late: true });
    }
    const weights = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12].map((t) => {
      let g = 0;
      for (const tile of tiles) if (tile.number === t && tile.id !== game.robber) for (const id of tile.nodes) if (nodes[id].owner !== null) g += nodes[id].level;
      const ghost = game.pending.some((q) => q.sites.some((id) => nodes[id].tiles.some((k) => tiles[k].number === t && k !== game.robber)));
      return [t, (6 - Math.abs(7 - t)) * (1 + 0.35 * g) * (ghost ? 0.3 : 1)];
    });
    let x = rng() * weights.reduce((a, w) => a + w[1], 0), total = 6;
    for (const [t, w] of weights) { if ((x -= w) <= 0) { total = t; break; } }
    const d0 = Math.min(6, Math.max(total - 6, 1 + Math.floor(rng() * 6))), dice = [Math.max(total - 6, Math.min(d0, total - 1)), 0];
    dice[1] = total - dice[0];
    act({ type: 'roll', dice, total, late: true });
    if (game.winner !== null) break;
    for (let step = 0; step < 8 && game.winner === null; step++) {
      const cities = nodes.filter((n) => game.legalCity(n.id)), sites = nodes.filter((n) => game.legalSettlement(n.id));
      const pend = game.pending.some((q) => q.owner === p);
      if (game.affordable('city') && cities.length) { act({ type: 'city', node: bestBy(cities, (n) => value(n.id)).id, late: true }); continue; }
      if (game.affordable('quantum') && !pend && game.usedSlots < 8 && game.quantumCandidates().length > 1) {
        let best = null;
        for (const a of game.quantumCandidates()) for (const b2 of game.quantumCandidates(a)) { const v = value(a) + value(b2); if (!best || v > best.v) best = { a, b: b2, v }; }
        act({ type: 'quantum', a: best.a, b: best.b, late: true }); continue;
      }
      if (game.affordable('settlement') && sites.length) { act({ type: 'settlement', node: bestBy(sites, (n) => value(n.id)).id, late: true }); continue; }
      const roads = game.board.edges.filter((e) => game.legalRoad(e.id));
      if (game.affordable('road') && roads.length && sites.length < 3) {
        const val = (e) => [e.a, e.b].reduce((v, id) => v + (game.vacant(id) ? 4 + value(id) : 0) + nodes[id].neighbors.filter((j) => game.vacant(j)).length * 0.5, 0) + rng() * 0.1;
        act({ type: 'road', edge: bestBy(roads, val).id, late: true }); continue;
      }
      const h = game.player.hand, target = cities.length && h.ore + h.wheat >= 3 ? { wheat: 2, ore: 3 } : !pend && game.quantumCandidates().length > 1 ? { wood: 1, brick: 1, wool: 1, wheat: 1, ore: 1 } : { wood: 1, brick: 1, wool: 1, wheat: 1 };
      const lack = KEYS.find((k) => h[k] < (target[k] || 0) && game.bank[k] > 0);
      const surplus = KEYS.find((k) => k !== lack && h[k] - (target[k] || 0) >= game.tradeRate(k));
      if (lack && surplus) { act({ type: 'bank', give: surplus, take: lack, late: true }); continue; }
      break;
    }
    if (game.winner !== null) break;
    act({ type: 'end', late: true });
  }
  if (game.winner === null) throw Error('no winner');
  actions.push({ type: 'beat', name: 'winner', turn: game.turn, player: game.winner });
}

const results = [];
for (let seed = 1; seed <= 400; seed++) {
  try {
    const r = plan(seed);
    // verify the story beats
    results.push(r);
  } catch (e) { if (process.argv.includes('-v')) console.log(seed, e.message); }
}
results.sort((a, b) => a.turns - b.turns);
console.log('successful seeds', results.length, results.slice(0, 10).map((r) => `${r.seed}:${r.turns}`).join(' '));
writeFileSync(new URL('./candidates.json', import.meta.url), JSON.stringify(results.slice(0, 16).map((r) => ({ seed: r.seed, turns: r.turns, actions: r.actions }))));
const pick = Number(process.argv.find((a) => a.startsWith('--seed='))?.slice(7)) || results[0]?.seed;
const chosen = results.find((r) => r.seed === pick);
if (chosen) {
  finish(chosen);
  writeFileSync(new URL('./plan.json', import.meta.url), JSON.stringify({ seed: chosen.seed, actions: chosen.actions }, null, 1));
  console.log('wrote plan for seed', chosen.seed, 'turns', chosen.turns, 'actions', chosen.actions.length);
  console.log(chosen.actions.filter((a) => a.type === 'beat').map((a) => `${a.name}@T${a.turn}`).join(' '));
  console.log('scores', chosen.game.players.map((p) => chosen.game.score(p.id)));
}
