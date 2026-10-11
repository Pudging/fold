// Plays the planned match through the real Fold UI and captures every step.
// The app is unmodified; a debug getter is appended to main.js in-flight so the
// harness can verify engine state, and Math.random is seeded before load.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { makeRandom, dieSample } from './rng.mjs';
import { newGame, apply } from './replay.mjs';

const URL_APP = process.env.FOLD_URL || 'http://127.0.0.1:5180/';
const OUT = new URL(process.env.CAPTURE_OUT || '../public/capture/', import.meta.url);
const plan = JSON.parse(readFileSync(new URL('./plan.json', import.meta.url), 'utf8'));
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, acceptDownloads: true });
const page = await context.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[console error]', m.text()); });
page.on('pageerror', (e) => console.log('[page error]', e.message));
await page.addInitScript(`(() => { const makeRandom = ${makeRandom.toString()}; window.__rand = makeRandom(${plan.seed}); Math.random = window.__rand; })();`);
await page.route(/\/main\.js(\?.*)?$/, async (route) => {
  const res = await route.fetch();
  const body = (await res.text()) + '\nwindow.__fold={get game(){return game},get ui(){return {mode,first,selectedQ,panel}}};\n';
  await route.fulfill({ response: res, body, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
});
await page.goto(URL_APP, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

const manifest = [], bursts = [], timelapse = [];
let n = 0, actionIndex = -1, lastClick = 0, lastFile = '';
const box = async (sel) => {
  const b = await page.locator(sel).first().boundingBox();
  return b ? { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height } : null;
};
async function shoot(label, extra = {}) {
  const file = `${String(n++).padStart(3, '0')}-${label}.jpg`;
  await page.waitForTimeout(60);
  await page.screenshot({ path: fileURLToPath(new URL(file, OUT)), type: 'jpeg', quality: 93 });
  const st = await page.evaluate(() => {
    const els = {};
    for (const [k, sel] of Object.entries({ oddsA: '.quantum-odds span:first-child', oddsB: '.quantum-odds span:last-child', oddsBar: '.odds-bar', phase: '.phase-row', measured: '.measured', panel: '.action-panel', hud: '.board-hud', hand: '.hand' })) {
      const r = document.querySelector(sel)?.getBoundingClientRect();
      if (r && r.width) els[k] = { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    }
    return { turn: __fold.game.turn, phase: __fold.game.phase, active: __fold.game.active, ui: __fold.ui, els };
  });
  manifest.push({ file, label, actionIndex, ...st, ...extra });
  lastFile = file;
}
// Extra frames of the app's own animations after the last click, timed from the click.
async function burst(delays = [220, 380, 560, 800, 1100, 1500]) {
  const base = lastFile.replace('.jpg', ''), files = [];
  await page.mouse.move(1880, 1060);
  await page.evaluate(() => { const t = document.querySelector('#tooltip'); if (t) t.hidden = true; });
  for (const [i, d] of delays.entries()) {
    const wait = lastClick + d - Date.now();
    if (wait > 0) await page.waitForTimeout(wait);
    const file = `b-${base}-${i}.jpg`;
    await page.screenshot({ path: fileURLToPath(new URL(file, OUT)), type: 'jpeg', quality: 93 });
    files.push({ file, t: Date.now() - lastClick });
  }
  bursts.push({ base: lastFile, frames: files });
}
let tl = 0;
async function tlShot(label, extra = {}) {
  const file = `tl-${String(tl++).padStart(3, '0')}-${label}.jpg`;
  await page.waitForTimeout(60);
  await page.screenshot({ path: fileURLToPath(new URL(file, OUT)), type: 'jpeg', quality: 90 });
  const st = await page.evaluate(() => ({ turn: __fold.game.turn, active: __fold.game.active, scores: __fold.game.players.map((p) => __fold.game.score(p.id)), pending: __fold.game.pending.length, resolved: __fold.game.resolved, winner: __fold.game.winner }));
  timelapse.push({ file, label, actionIndex, ...st, ...extra });
  lastFile = file;
}
async function tap(sel) {
  const b = await box(sel);
  await page.locator(sel).first().click({ force: true });
  lastClick = Date.now();
  if (b) await page.mouse.move(b.x, b.y);
}
async function hover(sel, label, wait = 120) {
  const b = await box(sel);
  await page.hover(sel, { force: true });
  await page.waitForTimeout(wait);
  if (label) await shoot(label, { cursor: b });
  return b;
}
async function click(sel, label) {
  const b = await box(sel);
  await page.locator(sel).first().click({ force: true });
  lastClick = Date.now();
  await page.mouse.move(b.x, b.y);
  await page.waitForTimeout(80);
  if (label) await shoot(label, { cursor: b, clicked: true });
  return b;
}
const shortName = (a) => a.type;

// Lobby
await shoot('lobby');
await page.fill('input[name=name0]', 'Alice');
await page.fill('input[name=name1]', 'Bob');
await shoot('lobby-filled');
await click('#new-game button[type=submit]', 'start');

// Verify the browser board matches the planner's board
const { game: ref, random: refRandom } = newGame(plan.seed);
const boardSig = (g) => g.board.tiles.map((t) => t.kind + t.number).join(',');
const browserSig = await page.evaluate(() => __fold.game.board.tiles.map((t) => t.kind + t.number).join(','));
if (browserSig !== boardSig(ref)) throw Error('Board mismatch between planner and browser');
console.log('board verified');

async function inspector(tag) {
  await click('[data-panel=science]', `${tag}-psi`);
  const summaries = page.locator('.dialog summary');
  const count = await summaries.count();
  for (let i = 0; i < count; i++) await summaries.nth(i).click();
  await page.waitForTimeout(100);
  await shoot(`${tag}-psi-open`);
  await page.locator('.dialog').evaluate((d) => d.scrollTo(0, d.scrollHeight));
  await shoot(`${tag}-psi-scrolled`);
  const dl = page.waitForEvent('download');
  await page.click('[data-action=export]');
  const file = await dl;
  await file.saveAs(fileURLToPath(new URL(`${tag}-qiskit.py`, OUT)));
  await page.click('.dialog .close');
  await page.waitForTimeout(80);
}

const beatAfter = new Map();
for (let i = 0; i < plan.actions.length; i++) {
  const a = plan.actions[i];
  actionIndex = i;
  apply(ref, refRandom, a);
  if (a.type === 'beat' && a.name === 'storyDone') {
    await click('[data-panel=log]', 'log');
    await page.click('.dialog .close');
    await click('[data-panel=rules]', 'rules');
    await page.click('.dialog .close');
    continue;
  }
  if (a.type === 'beat' && a.name === 'winner') {
    await page.mouse.move(1700, 700);
    await page.waitForTimeout(1200);
    await tlShot('winner');
    continue;
  }
  if (a.late) {
    const wait = async (ms) => { const w = lastClick + ms - Date.now(); if (w > 0) await page.waitForTimeout(w); };
    switch (a.type) {
      case 'roll': {
        await page.evaluate(([x, y]) => window.__rand.force(x, y), [dieSample(a.dice[0]), dieSample(a.dice[1])]);
        await tap('[data-action=roll]');
        const collapsed = await page.evaluate(() => !!__fold.game.resolved);
        if (collapsed) { await tlShot('collapse', { total: a.total }); await burst(); }
        else { await wait(950); await tlShot('roll', { total: a.total }); }
        break;
      }
      case 'gate':
        await tap(`[data-q="${a.slot}"]`); await page.waitForTimeout(120);
        await tap(`[data-gate="${a.gate}"]`); await tlShot(`gate-${a.gate}`); await burst([300, 600, 1000]);
        await page.keyboard.press('Escape');
        break;
      case 'split': await tap('[data-action=split]'); await tap(`[data-node="${a.a}"]`); await tap(`[data-node="${a.b}"]`); await tlShot('split'); break;
      case 'quantum': await tap('[data-build=quantum]'); await tap(`[data-node="${a.a}"]`); await tap(`[data-node="${a.b}"]`); await tlShot('quantum'); break;
      case 'road': await tap('[data-build=road]'); await tap(`[data-edge="${a.edge}"]`); await tlShot('road'); break;
      case 'settlement': case 'city': await tap(`[data-build=${a.type}]`); await tap(`[data-node="${a.node}"]`); await tlShot(a.type); break;
      case 'bank':
        await page.click('[data-panel=exchange]');
        await page.selectOption('#bank-trade select[name=give]', a.give);
        await page.selectOption('#bank-trade select[name=take]', a.take);
        await page.click('#bank-trade button');
        await page.click('.dialog .close');
        break;
      case 'end': await tap('[data-action=end]'); await tlShot('turn'); break;
      default: throw Error('late action not captured: ' + a.type);
    }
  } else if (a.type === 'beat') {
    if (a.name === 'split' || a.name === 'quantum' || a.name === 'split2' || a.name === 'quantum2') {
      await click(`[data-q="${a.slot}"]`, `${a.name}-selected`);
      await page.keyboard.press('Escape');
    }
    if (a.name === 'z' || a.name === 'hA' || a.name === 'hB' || a.name === 'cz' || a.name === 'bell') {
      await click(`[data-q="${a.slot}"]`, `${a.name}-after`);
      if (a.name === 'cz' || a.name === 'bell') await click(`[data-q="${a.other ?? 0}"]`, `${a.name}-after-other`);
      await page.keyboard.press('Escape');
    }
    if (a.name === 'split') await inspector('split');
    if (a.name === 'cz') await inspector('cz');
    if (a.name === 'harvest2Roll') await inspector('bell');
    if (a.name === 'harvest1Roll' || a.name === 'harvest2Roll') await shoot(`${a.name}-ready`);
    if (a.name === 'harvest1' || a.name === 'harvest2') { await page.mouse.move(1700, 600); await page.waitForTimeout(100); await shoot(`${a.name}-result`); }
    beatAfter.set(a.name, n);
    continue;
  }
  if (!a.late) switch (a.type) {
    case 'setupSettlement': await hover(`[data-node="${a.node}"]`, 'setup-hover'); await click(`[data-node="${a.node}"]`, 'setup-settlement'); break;
    case 'setupRoad': await click(`[data-edge="${a.edge}"]`, 'setup-road'); break;
    case 'roll':
      await page.evaluate(([x, y]) => window.__rand.force(x, y), [dieSample(a.dice[0]), dieSample(a.dice[1])]);
      await hover('[data-action=roll]', 'roll-hover');
      await click('[data-action=roll]', 'rolled');
      if (await page.evaluate(() => !!__fold.game.resolved)) await burst();
      break;
    case 'road': await click('[data-build=road]', 'road-mode'); await hover(`[data-edge="${a.edge}"]`, 'road-hover'); await click(`[data-edge="${a.edge}"]`, 'road-built'); break;
    case 'city': await click('[data-build=city]', 'city-mode'); await hover(`[data-node="${a.node}"]`, 'city-hover'); await click(`[data-node="${a.node}"]`, 'city-built'); break;
    case 'split':
      await hover('[data-action=split]', 'split-tip', 500);
      await click('[data-action=split]', 'split-mode');
      await hover(`[data-node="${a.a}"]`, 'split-hover-a');
      await click(`[data-node="${a.a}"]`, 'split-a');
      await hover(`[data-node="${a.b}"]`, 'split-hover-b');
      await click(`[data-node="${a.b}"]`, 'split-done');
      break;
    case 'quantum':
      await hover('[data-build=quantum]', 'quantum-tip', 500);
      await click('[data-build=quantum]', 'quantum-mode');
      await hover(`[data-node="${a.a}"]`, 'quantum-hover-a');
      await click(`[data-node="${a.a}"]`, 'quantum-a');
      await hover(`[data-node="${a.b}"]`, 'quantum-hover-b');
      await click(`[data-node="${a.b}"]`, 'quantum-done');
      break;
    case 'gate':
      await click(`[data-q="${a.slot}"]`, `gate-${a.gate}-panel`);
      if (a.gate === 'cz') { await page.selectOption('#quantum-other', String(a.other)); await shoot('gate-cz-selected'); }
      await hover(`[data-gate="${a.gate}"]`, `gate-${a.gate}-tip`, 500);
      await click(`[data-gate="${a.gate}"]`, `gate-${a.gate}-applied`);
      await burst([200, 380, 560, 760, 1000, 1400]);
      break;
    case 'bank':
      await page.click('[data-panel=exchange]');
      await page.selectOption('#bank-trade select[name=give]', a.give);
      await page.selectOption('#bank-trade select[name=take]', a.take);
      await shoot('bank-form');
      await page.click('#bank-trade button');
      await page.click('.dialog .close');
      await shoot('bank-done');
      break;
    case 'trade': {
      const give = Object.keys(a.give).find((k) => a.give[k]), take = Object.keys(a.take).find((k) => a.take[k]);
      await click('[data-panel=exchange]', 'trade-open');
      await page.selectOption('#player-trade select[name=to]', String(a.to));
      await page.selectOption('#player-trade select[name=give]', give);
      await page.selectOption('#player-trade select[name=take]', take);
      await hover('#player-trade button', 'trade-form');
      await click('#player-trade button', 'trade-offer');
      await hover('[data-action=accept-trade]', 'trade-accept-hover');
      await click('[data-action=accept-trade]', 'trade-accepted');
      break;
    }
    case 'end': await hover('[data-action=end]', 'end-hover'); await click('[data-action=end]', 'ended'); break;
  }
  // Cross-check engine state after every action
  const sig = await page.evaluate(() => JSON.stringify([__fold.game.turn, __fold.game.players.map((p) => p.hand), __fold.game.pending.map((p) => p.sites)]));
  const want = JSON.stringify([ref.turn, ref.players.map((p) => p.hand), ref.pending.map((p) => p.sites)]);
  if (sig !== want) throw Error(`State diverged at action ${i} ${JSON.stringify(a)}\n${sig}\n${want}`);
}
writeFileSync(new URL('manifest.json', OUT), JSON.stringify({ seed: plan.seed, shots: manifest, bursts, timelapse }, null, 1));
console.log('captured', manifest.length, 'shots', bursts.length, 'bursts', timelapse.length, 'timelapse');
await browser.close();
