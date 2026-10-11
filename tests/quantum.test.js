import test from 'node:test';
import assert from 'node:assert/strict';
import { QuantumState, preparedState } from '../src/quantum.js';
import { Game } from '../src/game.js';
const close = (a, b) => assert.ok(Math.abs(a-b) < 1e-10, `${a} != ${b}`);
test('Hadamard interference distinguishes phases with identical initial odds', () => {
  const plus = new QuantumState(1).apply('h', 0);
  const minus = plus.clone().apply('z', 0);
  close(plus.marginal(0), minus.marginal(0));
  close(plus.apply('h', 0).marginal(0), 0);
  close(minus.apply('h', 0).marginal(0), 1);
});
test('Bell state has correlated outcomes and mixed single-qubit states', () => {
  const bell = new QuantumState(2).apply('h', 0).apply('cx', 1, 0);
  const p = bell.probabilities();
  close(p[0], .5); close(p[3], .5); close(p[1] + p[2], 0);
  close(bell.purity(0), .5); close(bell.purity(1), .5);
});
test('CZ creates entanglement from plus states without changing Z-basis probabilities', () => {
  const state = preparedState(), before = state.probabilities();
  state.apply('cz', 1, 0);
  state.probabilities().forEach((p, i) => close(p, before[i]));
  close(state.purity(0), .5); close(state.purity(1), .5); close(state.purity(2), 1);
});
test('complex phase and 1000 unitary moves preserve normalization', () => {
  const state = preparedState();
  for (let i=0; i<1000; i++) state.apply(['h','s','z'][i%3], i%3);
  close(state.probabilities().reduce((a,b) => a+b), 1);
  const single = new QuantumState(1).apply('h',0).apply('s',0).apply('h',0);
  close(single.marginal(0), .5);
});
test('Born sampling excludes zero-probability branches and projects state', () => {
  for (const [r, expected] of [[0,0],[.49,0],[.51,3],[.999,3]]) {
    const state = new QuantumState(2).apply('h',0).apply('cx',1,0);
    assert.equal(state.measure(() => r), expected);
    close(state.probabilities()[expected],1);
  }
});
test('first contract has a deterministic four-gate solution', () => {
  const game = new Game();
  game.act('z',0); game.act('h',0); game.act('h',1); game.act('h',2);
  close(game.state.probabilities()[game.target],1);
  assert.equal(game.act('h',0),false);
  assert.equal(game.harvest(() => .5).points,5);
  assert.equal(game.harvest(),null); assert.equal(game.undo(),false);
  assert.equal(Object.values(game.bank).reduce((a,b)=>a+b),3);
});
test('undo restores amplitudes and move allowance; four harvests finish game', () => {
  const game = new Game(), before = [...game.state.data];
  game.act('h',0); game.undo(); assert.deepEqual([...game.state.data],before); assert.equal(game.moves,4);
  for (let i=0;i<4;i++) { game.harvest(() => .1); if(i<3) assert.equal(game.next(),true); }
  assert.equal(game.complete,true); assert.equal(game.next(),false);
});

test('correlation indicator distinguishes product, Bell and GHZ reduced states, and clears after disentangling',()=>{
 const state=new QuantumState(3).apply('h',0);
 close(state.pairCorrelation(0,1),0);
 state.apply('cx',1,0);close(state.pairCorrelation(0,1),Math.sqrt(.75));close(state.pairCorrelation(0,2),0);
 state.apply('cx',2,0);close(state.pairCorrelation(0,1),.5);
 state.apply('cx',2,0).apply('cx',1,0);close(state.pairCorrelation(0,1),0);
});
