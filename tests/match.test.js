import test from 'node:test';
import assert from 'node:assert/strict';
import { Match } from '../src/match.js';
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-10);

test('players alternate, own disjoint qubits, and have opposite orders',()=>{
  const game = new Match(['Alice','Bob']);
  assert.equal(game.state.qubits,6); assert.equal(game.target(0)^game.target(1),7);
  game.act('z',0); assert.equal(game.act('h',0),false);
  assert.equal(game.active,0); game.endTurn(); assert.equal(game.active,1);
  game.act('h',0); close(game.state.marginal(3),0); close(game.state.marginal(0),.5);
});
test('joint phase couples opponents without changing immediate probabilities',()=>{
  const game=new Match(), before=game.state.probabilities();
  game.act('cz',1);
  game.state.probabilities().forEach((p,i)=>close(p,before[i]));
  close(game.state.purity(1),.5); close(game.state.purity(4),.5);
  close(game.state.purity(0),1);
});
test('undo only affects the current uncommitted turn',()=>{
  const game=new Match(), before=[...game.state.data];
  game.act('h',0); assert.equal(game.undo(),true); assert.deepEqual([...game.state.data],before);
  assert.equal(game.remaining[0],4); game.act('z',1); game.endTurn(); assert.equal(game.undo(),false);
});
test('eight turns lead to one joint measurement; score and inventory awarded once',()=>{
  const game=new Match(); assert.equal(game.harvest(),null);
  for(let i=0;i<8;i++) assert.equal(game.endTurn(),true);
  assert.equal(game.ready,true); assert.equal(game.endTurn(),false); assert.equal(game.act('h',0),false);
  const result=game.harvest(()=>1/64+.001);
  assert.equal(result[0].basis,1); assert.equal(result[1].basis,0);
  assert.equal(result[0].points,5); assert.equal(result[1].points,1);
  for(const player of game.players) assert.equal(Object.values(player.bank).reduce((a,b)=>a+b),3);
  assert.equal(game.harvest(),null);
});
test('four rounds finish, alternating the starting player',()=>{
  const game=new Match();
  for(let r=0;r<4;r++) {
    assert.equal(game.active,r%2);
    for(let i=0;i<8;i++) game.endTurn();
    game.harvest(()=>.2);
    if(r<3) assert.equal(game.next(),true);
  }
  assert.equal(game.complete,true); assert.equal(game.next(),false);
});
