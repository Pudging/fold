import test from 'node:test';
import assert from 'node:assert/strict';
import { Catan } from '../src/catan.js';
import { KEYS, emptyHand } from '../src/board.js';
const rng=()=>{let seed=913;return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};};
const fresh=(n=2)=>new Catan(Array.from({length:n},(_,i)=>'P'+i),rng());
const finishSetup=g=>{while(g.phase.startsWith('setup')){if(g.phase==='setup-settlement')g.placeSettlement(g.board.nodes.find(n=>g.legalSettlement(n.id,true)).id);else g.placeRoad(g.board.edges.find(e=>g.legalRoad(e.id,true)).id);}return g;};
const fund=(g,id,n=5)=>{for(const k of KEYS){g.bank[k]-=n;g.players[id].hand[k]+=n;}};
const conserved=g=>KEYS.forEach(k=>assert.equal(g.bank[k]+g.players.reduce((s,p)=>s+p.hand[k],0),19,k));
const approx=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
function pair(g){
 const a=g.board.nodes.find(n=>g.vacant(n.id)),b=g.board.nodes.find(n=>n.id!==a.id&&!n.neighbors.includes(a.id)&&g.vacant(n.id));
 for(const n of[a,b])g.board.edges[n.edges[0]].owner=g.active;
 return[a.id,b.id];
}
test('board has standard topology, resource supply and nonadjacent red numbers',()=>{
 const g=fresh();assert.equal(g.board.nodes.length,54);assert.equal(g.board.edges.length,72);assert.equal(g.board.tiles.length,19);
 for(const e of g.board.edges)if(e.tiles.length===2)assert.ok(!e.tiles.every(t=>[6,8].includes(g.board.tiles[t].number)));
 for(const p of g.board.ports)assert.equal(p.nodes.length,2);
 assert.deepEqual(Object.fromEntries(['wood','brick','wool','wheat','ore','desert'].map(k=>[k,g.board.tiles.filter(t=>t.kind===k).length])),{wood:4,brick:3,wool:4,wheat:4,ore:3,desert:1});
});
test('four-player snake setup creates two free networks each, with starting resources',()=>{
 const g=fresh(4);assert.deepEqual(g.setupOrder,[0,1,2,3,3,2,1,0]);finishSetup(g);
 assert.equal(g.phase,'roll');for(let i=0;i<4;i++){assert.equal(g.count('settlement',i),2);assert.equal(g.count('road',i),2);assert.equal(g.score(i),2);}
 conserved(g);
});
test('settlement distance and connectivity apply; illegal actions do not spend cards',()=>{
 const g=fresh(),id=0;assert.ok(g.placeSettlement(id));
 const neighbor=g.board.nodes[id].neighbors[0];assert.equal(g.legalSettlement(neighbor,true),false);
 finishSetup(g);fund(g,0);g.phase='actions';const before={...g.player.hand};
 assert.equal(g.placeSettlement(id),false);assert.deepEqual(g.player.hand,before);conserved(g);
});
test('dice produce for every adjacent owner, with city doubling and robber blocking',()=>{
 const g=fresh(),t=g.board.tiles.find(t=>t.number===8);g.phase='roll';g.board.nodes[t.nodes[0]].owner=0;g.board.nodes[t.nodes[0]].level=1;g.board.nodes[t.nodes[3]].owner=1;g.board.nodes[t.nodes[3]].level=2;
 g.random=()=>.51;g.roll();assert.equal(g.players[0].hand[t.kind],1);assert.equal(g.players[1].hand[t.kind],2);conserved(g);
 g.phase='roll';g.robber=t.id;g.roll();assert.equal(g.players[0].hand[t.kind],1);assert.equal(g.players[1].hand[t.kind],2);
});
test('seven requires exact player-selected discard before robber; theft conserves cards',()=>{
 const g=fresh();g.phase='roll';g.players[0].hand.wood=8;g.bank.wood-=8;g.random=(()=>{let i=0;return()=>i++%2? .51:.34;})();
 g.roll();assert.equal(g.phase,'discard');const bad=emptyHand();bad.wood=3;assert.equal(g.discard(bad),false);bad.wood=4;assert.equal(g.discard(bad),true);assert.equal(g.phase,'robber');
 const t=g.board.tiles.find(t=>t.id!==g.robber),n=g.board.nodes[t.nodes[0]];n.owner=1;n.level=1;g.players[1].hand.ore=1;g.bank.ore--;
 g.moveRobber(t.id);assert.equal(g.phase,'steal');g.steal(1);assert.equal(g.players[0].hand.ore,1);assert.equal(g.phase,'actions');conserved(g);
});
test('roads cannot continue through an opponent settlement',()=>{
 const g=fresh(),n=g.board.nodes.find(n=>n.edges.length===3),[a,b]=n.edges;
 g.board.edges[a].owner=0;g.board.nodes[n.id].owner=1;g.board.nodes[n.id].level=1;
 assert.equal(g.legalRoad(b),false);g.board.nodes[n.id].owner=null;assert.equal(g.legalRoad(b),true);
});
test('bank, ports and explicit player trade acceptance conserve resources',()=>{
 const g=fresh();g.phase='actions';fund(g,0);fund(g,1);
 assert.equal(g.tradeRate('wood'),4);assert.equal(g.bankTrade('wood','ore'),true);conserved(g);
 const port=g.board.ports.find(p=>p.kind==='brick');g.board.nodes[port.nodes[0]].owner=0;g.board.nodes[port.nodes[0]].level=1;assert.equal(g.tradeRate('brick'),2);
 const give=emptyHand(),take=emptyHand();give.wheat=2;take.ore=1;const before=g.player.hand.wheat;
 assert.ok(g.proposeTrade(1,give,take));assert.equal(g.player.hand.wheat,before);assert.ok(g.respondTrade(false));assert.equal(g.player.hand.wheat,before);
 g.proposeTrade(1,give,take);g.respondTrade(true);assert.equal(g.player.hand.wheat,before-2);conserved(g);
});
test('development purchase cannot be played immediately; only one play per turn',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);g.deck=['knight'];assert.ok(g.buyDevelopment());assert.equal(g.playDevelopment(0),false);
 g.turn=3;assert.ok(g.playDevelopment(0));assert.equal(g.phase,'robber');assert.equal(g.player.knights,1);
 g.phase='actions';g.player.cards.push({kind:'roads',turn:1});assert.equal(g.playDevelopment(0),false);conserved(g);
});
test('plenty respects bank supply and monopoly transfers all selected cards',()=>{
 const g=fresh();g.phase='development';g.effect='plenty';g.bank.ore=1;assert.equal(g.resolveDevelopment(['ore','ore']),false);
 g.bank.ore=19;assert.ok(g.resolveDevelopment(['ore','wheat']));g.players[1].hand.wood=4;g.bank.wood-=4;g.effect='monopoly';g.phase='development';assert.ok(g.resolveDevelopment(['wood']));assert.equal(g.player.hand.wood,4);assert.equal(g.players[1].hand.wood,0);conserved(g);
});
test('quantum settlement pays once, reserves both sites, and scores once',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);const[a,b]=pair(g);
 assert.ok(g.buildQuantum(a,b));assert.equal(g.score(0),1);assert.equal(g.count('settlement'),1);assert.equal(g.player.hand.ore,4);
 assert.equal(g.vacant(a),false);assert.equal(g.vacant(b),false);assert.equal(g.gate('h',0),false);conserved(g);
});
test('phase then interference changes location deterministically without random-only behavior',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);const[a,b]=pair(g);g.buildQuantum(a,b);
 g.turn=3;assert.ok(g.gate('z',0));approx(g.quantum.marginal(0),.5);assert.equal(g.gate('h',0),false);
 g.turn=5;g.quantumUsed=false;assert.ok(g.gate('h',0));approx(g.quantum.marginal(0),1);
 g.collapse();assert.equal(g.board.nodes[b].owner,0);assert.equal(g.board.nodes[a].owner,null);assert.equal(g.pending.length,0);assert.equal(g.score(0),1);conserved(g);
});
test('CZ entangles different owners; gate ports grant X and CX only to their owner',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);fund(g,1);g.buildQuantum(...pair(g));
 g.active=1;g.buildQuantum(...pair(g));g.active=0;g.turn=3;
 assert.equal(g.gate('x',0),false);assert.ok(g.gate('cz',0,1));approx(g.quantum.purity(0),.5);approx(g.quantum.purity(1),.5);
 g.quantumUsed=false;const port=g.board.ports.find(p=>p.gate==='x');g.board.nodes[port.nodes[0]].owner=0;g.board.nodes[port.nodes[0]].level=1;assert.ok(g.gate('x',0));
});
test('production measures pending locations before creating any resource record',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);const[a,b]=pair(g);g.buildQuantum(a,b);
 // Prepare location B exactly; force a die roll touching B.
 g.turn=3;g.gate('z',0);g.turn=5;g.quantumUsed=false;g.gate('h',0);
 const t=g.board.tiles[g.board.nodes[b].tiles.find(id=>g.board.tiles[id].kind!=='desert')];t.number=2;
 const before={...g.player.hand};g.phase='roll';g.random=()=>0;g.roll();
 assert.equal(g.pending.length,0);assert.equal(g.board.nodes[b].owner,0);assert.equal(g.board.nodes[a].owner,null);
 assert.equal(g.player.hand[t.kind],before[t.kind]+g.board.nodes[b].tiles.filter(id=>g.board.tiles[id].number===2&&id!==g.robber&&g.board.tiles[id].kind===t.kind).length);conserved(g);
});
test('longest road counts a path, is cut by an opponent, and victory requires own turn',()=>{
 const g=fresh();
 const find=(node,path=[],seen=new Set())=>{if(path.length===5)return path;for(const id of g.board.nodes[node].edges){const e=g.board.edges[id],other=e.a===node?e.b:e.a;if(seen.has(other))continue;const result=find(other,[...path,id],new Set([...seen,node,other]));if(result)return result;}};
 const path=find(0);path.forEach(id=>g.board.edges[id].owner=0);g.updateAwards();assert.equal(g.longest,0);assert.equal(g.longestRoad(0),5);
 const e1=g.board.edges[path[1]],e2=g.board.edges[path[2]],cut=[e1.a,e1.b].find(n=>[e2.a,e2.b].includes(n));g.board.nodes[cut].owner=1;g.board.nodes[cut].level=1;g.updateAwards();assert.equal(g.longest,null);
 g.players[1].cards=Array.from({length:9},()=>({kind:'victory',turn:0}));g.phase='actions';g.checkWin();assert.equal(g.winner,null);g.endTurn();assert.equal(g.winner,1);
});

test('splitting preserves score, pieces and cards, costs ore and consumes the quantum action',()=>{
 const g=fresh();g.phase='roll';g.turn=1;fund(g,0);const[a,b]=pair(g);
 g.board.nodes[a].owner=0;g.board.nodes[a].level=1;
 const before={...g.player.hand};assert.ok(g.splitCandidates().includes(a));assert.ok(g.splitSettlement(a,b));
 assert.equal(g.phase,'roll');assert.equal(g.score(0),1);assert.equal(g.count('settlement'),1);
 for(const k of KEYS)assert.equal(g.player.hand[k],before[k]-(k==='ore'?1:0));
 assert.equal(g.board.nodes[a].owner,null);assert.equal(g.quantumUsed,true);assert.equal(g.gate('h',0),false);
 assert.equal(g.splitSettlement(a,b),false);conserved(g);
 g.turn=3;g.quantumUsed=false;assert.ok(g.gate('h',0));assert.equal(g.phase,'roll');
 approx(g.quantum.marginal(0),0);g.collapse();assert.equal(g.board.nodes[a].owner,0);assert.equal(g.score(0),1);
});
test('split rejects cities, disconnected destinations and other players buildings without payment',()=>{
 const g=fresh();g.phase='actions';g.turn=1;fund(g,0);const[a,b]=pair(g);
 g.board.nodes[a].owner=0;g.board.nodes[a].level=2;const ore=g.player.hand.ore;
 assert.equal(g.splitSettlement(a,b),false);g.board.nodes[a].level=1;g.board.nodes[a].owner=1;assert.equal(g.splitSettlement(a,b),false);
 g.board.nodes[a].owner=0;for(const e of g.board.edges)e.owner=null;assert.equal(g.splitSettlement(a,b),false);assert.equal(g.player.hand.ore,ore);
});

