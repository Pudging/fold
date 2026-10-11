import assert from 'node:assert/strict';
import { Catan } from '../src/catan.js';
import { KEYS, COSTS, emptyHand } from '../src/board.js';
const seeds=[913,42,1701];
for(const initial of seeds){
 let seed=initial;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const game=new Catan(['Amber','Blue'],random);let turns=0,builds=0,quantumBuilds=0,trades=0;
 const verify=()=>{for(const k of KEYS){assert.equal(game.bank[k]+game.players.reduce((n,p)=>n+p.hand[k],0),19);assert.ok(game.bank[k]>=0);for(const p of game.players)assert.ok(p.hand[k]>=0);}assert.ok(game.players.every(p=>game.count('road',p.id)<=15&&game.count('settlement',p.id)<=5&&game.count('city',p.id)<=4));};
 const value=n=>n.tiles.reduce((s,id)=>s+(game.board.tiles[id].number?6-Math.abs(7-game.board.tiles[id].number):0),0)+new Set(n.tiles.map(id=>game.board.tiles[id].kind)).size;
 while(game.phase.startsWith('setup')){
  if(game.phase==='setup-settlement'){const n=game.board.nodes.filter(n=>game.legalSettlement(n.id,true)).sort((a,b)=>value(b)-value(a))[0];assert.ok(game.placeSettlement(n.id));}
  else{const e=game.board.edges.filter(e=>game.legalRoad(e.id,true)).sort((a,b)=>{const center=e=>{const n=game.board.nodes[e.a===game.setupNode?e.b:e.a];return Math.hypot(n.x-380,n.y-310);};return center(a)-center(b);})[0];assert.ok(game.placeRoad(e.id));}
 }
 const resolve=()=>{
  while(['discard','robber','steal','development'].includes(game.phase)){
   if(game.phase==='discard'){const d=game.discards[0],hand={...game.players[d.player].hand},out=emptyHand();for(let i=0;i<d.count;i++){const k=KEYS.toSorted((a,b)=>hand[b]-hand[a])[0];hand[k]--;out[k]++;}assert.ok(game.discard(out));}
   else if(game.phase==='robber'){const t=game.board.tiles.filter(t=>t.id!==game.robber).sort((a,b)=>{const score=t=>t.nodes.reduce((s,id)=>{const n=game.board.nodes[id];return s+(n.owner!==null?(n.owner===game.active?-2:1)*n.level:0);},0);return score(b)-score(a);})[0];assert.ok(game.moveRobber(t.id));}
   else if(game.phase==='steal')assert.ok(game.steal(game.stealFrom[0]));
   else{const available=KEYS.filter(k=>game.bank[k]>0).sort((a,b)=>game.player.hand[a]-game.player.hand[b]);if(game.effect==='monopoly')assert.ok(game.resolveDevelopment([KEYS.toSorted((a,b)=>game.players[1-game.active].hand[b]-game.players[1-game.active].hand[a])[0]]));else{const a=available[0],b=available.find(k=>k!==a||game.bank[k]>1);assert.ok(game.resolveDevelopment([a,b]));}}
   verify();
  }
 };
 function targetRoad(){
  // Search outwards from a legal first road for the nearest distance-legal settlement.
  let best=null;
  for(const start of game.board.edges.filter(e=>game.legalRoad(e.id))){
   const queue=[[start.a,1],[start.b,1]],seen=new Set();
   while(queue.length){const[node,dist]=queue.shift();if(seen.has(node)||dist>6)continue;seen.add(node);
    if(game.vacant(node)&&(!best||dist<best.dist)){best={id:start.id,dist};break;}
    if(game.board.nodes[node].owner!==null&&game.board.nodes[node].owner!==game.active)continue;
    for(const id of game.board.nodes[node].edges){const e=game.board.edges[id];if(e.owner!==null&&e.owner!==game.active)continue;queue.push([e.a===node?e.b:e.a,dist+1]);}
   }
  }return best?.id??game.board.edges.find(e=>game.legalRoad(e.id))?.id;
 }
 while(game.winner===null&&turns<1200){
  assert.equal(game.phase,'roll');game.roll();resolve();if(game.winner!==null)break;
  const card=game.player.cards.findIndex(c=>c.turn!==game.turn&&c.kind!=='victory');if(card>=0){game.playDevelopment(card);resolve();}
  if(game.winner!==null)break;
  const ghost=game.pending.find(p=>p.owner===game.active&&p.born!==game.turn);
  if(ghost&&!game.quantumUsed)game.gate('h',ghost.slot);
  for(let action=0;action<5&&game.phase==='actions';action++){
   let type,id;
   const candidates=game.quantumCandidates();
   if(quantumBuilds<2&&candidates.length>1){type='quantum';id=candidates[0];}
   else if(game.board.nodes.some(n=>game.legalCity(n.id))){type='city';id=game.board.nodes.filter(n=>game.legalCity(n.id)).sort((a,b)=>value(b)-value(a))[0].id;}
   else if(game.board.nodes.some(n=>game.legalSettlement(n.id))){type='settlement';id=game.board.nodes.filter(n=>game.legalSettlement(n.id)).sort((a,b)=>value(b)-value(a))[0].id;}
   else if(game.count('road')<15){type='road';id=targetRoad();}
   if(id===undefined&&type!=='quantum')type='development';
   for(let i=0;i<8&&!game.affordable(type);i++){
    const missing=KEYS.find(k=>(COSTS[type][k]||0)>game.player.hand[k]&&game.bank[k]>0);
    if(!missing)break;
    const extra=KEYS.find(k=>k!==missing&&game.player.hand[k]-(COSTS[type][k]||0)>=game.tradeRate(k));
    if(!extra||!game.bankTrade(extra,missing))break;trades++;
   }
   let success=false;
   if(type==='road'&&(game.affordable(type)||game.freeRoads)&&id!==undefined)success=game.placeRoad(id);
   if(type==='city'&&game.affordable(type))success=game.upgrade(id);
   if(type==='settlement'&&game.affordable(type))success=game.placeSettlement(id);
   if(type==='quantum'&&game.affordable(type)){success=game.buildQuantum(id,game.quantumCandidates(id)[0]);if(success)quantumBuilds++;}
   if(type==='development'&&game.affordable(type))success=game.buyDevelopment();
   if(!success)break;builds++;verify();
  }
  if(game.winner!==null)break;
  game.endTurn();turns++;verify();
 }
 assert.notEqual(game.winner,null,'No winner within bounded playthrough');
 console.log(`Seed ${initial}: winner ${game.players[game.winner].name}, ${game.score(game.winner)} points, ${turns+1} turns, ${builds} builds, ${trades} bank trades, ${quantumBuilds} quantum settlements. Resource conservation passed.`);
}

