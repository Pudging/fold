import { QuantumState } from './quantum.js';
import { makeBoard, emptyHand, KEYS, COSTS, shuffle } from './board.js';
const sum=h=>KEYS.reduce((n,k)=>n+h[k],0);
export class Catan {
 constructor(names=['Player 1','Player 2'],random=Math.random){
  this.random=random;this.board=makeBoard(random);
  this.players=names.slice(0,4).map((name,id)=>({id,name:String(name).trim().slice(0,20)||`Player ${id+1}`,hand:emptyHand(),cards:[],knights:0}));
  if(this.players.length<2)throw Error('At least two players');
  this.bank=Object.fromEntries(KEYS.map(k=>[k,19]));
  this.deck=shuffle([...Array(14).fill('knight'),...Array(5).fill('victory'),...Array(2).fill('roads'),...Array(2).fill('plenty'),...Array(2).fill('monopoly')],random);
  this.setupOrder=[...this.players.map(p=>p.id),...this.players.map(p=>p.id).reverse()];
  this.setupIndex=0;this.active=0;this.phase='setup-settlement';this.setupNode=null;
  this.turn=0;this.dice=null;this.robber=this.board.tiles.find(t=>t.kind==='desert').id;
  this.longest=null;this.army=null;this.winner=null;this.log=[];this.message='';
  this.quantum=new QuantumState(8);this.pending=[];this.usedSlots=0;this.quantumUsed=false;
  this.lastQuantum=null;this.lastDistribution=null;this.devUsed=false;this.freeRoads=0;this.effect=null;
  this.discards=[];this.offer=null;this.production=[];this.resolved=null;this.stealFrom=[];
  this.note('Place two settlements and two roads each.');
 }
 get player(){return this.players[this.active];}
 note(text){this.message=text;this.log.unshift(text);this.log=this.log.slice(0,60);}
 count(type,player=this.active){
  if(type==='road')return this.board.edges.filter(e=>e.owner===player).length;
  return this.board.nodes.filter(n=>n.owner===player&&n.level===(type==='city'?2:1)).length+(type==='settlement'?this.pending.filter(p=>p.owner===player).length:0);
 }
 score(player){
  return this.board.nodes.filter(n=>n.owner===player).reduce((s,n)=>s+n.level,0)+this.pending.filter(p=>p.owner===player).length+this.players[player].cards.filter(c=>c.kind==='victory').length+(this.longest===player?2:0)+(this.army===player?2:0);
 }
 checkWin(){this.updateAwards();if(this.score(this.active)>=10){this.winner=this.active;this.phase='finished';this.note(`${this.player.name} wins with ${this.score(this.active)} points.`);}}
 affordable(type){return Object.entries(COSTS[type]).every(([k,n])=>this.player.hand[k]>=n);}
 pay(type){for(const[k,n]of Object.entries(COSTS[type])){this.player.hand[k]-=n;this.bank[k]+=n;}}
 reserved(id){return this.pending.some(p=>p.sites.includes(id));}
 vacant(id,ignore=[]){
  const n=this.board.nodes[id];if(!n||n.owner!==null||this.reserved(id))return false;
  return n.neighbors.every(j=>this.board.nodes[j].owner===null&&!this.reserved(j)&&!ignore.includes(j));
 }
 legalSettlement(id,setup=false){
  return this.count('settlement')<5&&this.vacant(id)&&(setup||this.board.nodes[id].edges.some(e=>this.board.edges[e].owner===this.active));
 }
 legalRoad(id,setup=false){
  const e=this.board.edges[id];if(!e||e.owner!==null||this.count('road')>=15)return false;
  if(setup)return[e.a,e.b].includes(this.setupNode);
  return[e.a,e.b].some(id=>{
   const n=this.board.nodes[id];
   if(n.owner!==null)return n.owner===this.active;
   if(this.reserved(id))return false;
   return n.edges.some(j=>this.board.edges[j].owner===this.active);
  });
 }
 legalCity(id){const n=this.board.nodes[id];return n?.owner===this.active&&n.level===1&&this.count('city')<4;}
 placeSettlement(id){
  const setup=this.phase==='setup-settlement';
  if(!setup&&(this.phase!=='actions'||!this.affordable('settlement')))return false;
  if(!this.legalSettlement(id,setup))return false;
  if(!setup)this.pay('settlement');
  const n=this.board.nodes[id];n.owner=this.active;n.level=1;
  this.note(`${this.player.name} built a settlement.`);
  if(setup){
   this.setupNode=id;this.phase='setup-road';
   if(this.setupIndex>=this.players.length)for(const t of n.tiles){const key=this.board.tiles[t].kind;if(key!=='desert'&&this.bank[key]>0){this.player.hand[key]++;this.bank[key]--;}}
  }else this.checkWin();
  return true;
 }
 placeRoad(id){
  const setup=this.phase==='setup-road';
  if(!setup&&(this.phase!=='actions'||(!this.freeRoads&&!this.affordable('road'))))return false;
  if(!this.legalRoad(id,setup))return false;
  if(!setup){if(this.freeRoads)this.freeRoads--;else this.pay('road');}
  this.board.edges[id].owner=this.active;this.note(`${this.player.name} built a road.`);
  if(setup){
   this.setupIndex++;
   if(this.setupIndex===this.setupOrder.length){this.phase='roll';this.active=0;this.turn=1;this.note('Setup complete. Roll for resources.');}
   else{this.active=this.setupOrder[this.setupIndex];this.phase='setup-settlement';}
  }else this.checkWin();
  return true;
 }
 upgrade(id){
  if(this.phase!=='actions'||!this.affordable('city')||!this.legalCity(id))return false;
  this.pay('city');this.board.nodes[id].level=2;this.note(`${this.player.name} upgraded to a city.`);this.checkWin();return true;
 }
 roll(){
  if(this.phase!=='roll')return false;
  this.dice=[1+Math.floor(this.random()*6),1+Math.floor(this.random()*6)];
  const total=this.dice[0]+this.dice[1];this.production=[];this.resolved=null;
  this.note(`${this.player.name} rolled ${total}.`);
  if(total===7){
   this.discards=this.players.filter(p=>sum(p.hand)>7).map(p=>({player:p.id,count:Math.floor(sum(p.hand)/2)}));
   this.phase=this.discards.length?'discard':'robber';return true;
  }
  // A shared measurement is performed before any branch-dependent resource record.
  if(this.pending.some(p=>p.sites.some(id=>this.board.nodes[id].tiles.some(t=>this.board.tiles[t].number===total&&t!==this.robber))))this.collapse();
  const claims=this.players.map(()=>emptyHand());
  for(const tile of this.board.tiles)if(tile.number===total&&tile.id!==this.robber)for(const id of tile.nodes){
   const n=this.board.nodes[id];if(n.owner!==null)claims[n.owner][tile.kind]+=n.level;
  }
  for(const k of KEYS){
   const request=claims.reduce((s,h)=>s+h[k],0), recipients=claims.map((h,i)=>h[k]?i:-1).filter(i=>i>=0);
   if(this.bank[k]>=request)for(const i of recipients)this.grant(i,k,claims[i][k]);
   else if(recipients.length===1)this.grant(recipients[0],k,this.bank[k]);
  }
  this.phase='actions';this.checkWin();return true;
 }
 grant(player,key,n){this.players[player].hand[key]+=n;this.bank[key]-=n;if(n)this.production.push({player,key,n});}
 discard(hand){
  if(this.phase!=='discard')return false;
  const d=this.discards[0],p=this.players[d.player];if(!this.validBundle(hand,p.hand)||sum(hand)!==d.count)return false;
  for(const k of KEYS){p.hand[k]-=hand[k];this.bank[k]+=hand[k];}
  this.discards.shift();this.phase=this.discards.length?'discard':'robber';return true;
 }
 moveRobber(id){
  if(this.phase!=='robber'||!this.board.tiles[id]||id===this.robber)return false;
  // Robber contact with a ghost also settles the shared register before theft.
  if(this.pending.some(p=>p.sites.some(n=>this.board.nodes[n].tiles.includes(id))))this.collapse();
  this.robber=id;
  this.stealFrom=[...new Set(this.board.tiles[id].nodes.map(n=>this.board.nodes[n].owner))].filter(i=>i!==null&&i!==this.active&&sum(this.players[i].hand)>0);
  this.phase=this.stealFrom.length?'steal':'actions';this.note(`${this.player.name} moved the robber.`);
  if(!this.stealFrom.length)this.checkWin();return true;
 }
 steal(victim){
  if(this.phase!=='steal'||!this.stealFrom.includes(victim))return false;
  const hand=this.players[victim].hand,pool=KEYS.flatMap(k=>Array(hand[k]).fill(k)),key=pool[Math.floor(this.random()*pool.length)];
  hand[key]--;this.player.hand[key]++;this.phase='actions';this.note(`${this.player.name} stole one resource from ${this.players[victim].name}.`);this.checkWin();return true;
 }
 validBundle(bundle,available){
  return KEYS.every(k=>Number.isInteger(bundle[k])&&bundle[k]>=0&&bundle[k]<=available[k]);
 }
 ports(player=this.active){return this.board.ports.filter(p=>p.nodes.some(n=>this.board.nodes[n].owner===player));}
 tradeRate(key){const ports=this.ports();return ports.some(p=>p.kind===key)?2:ports.some(p=>p.kind==='any')?3:4;}
 bankTrade(give,take){
  if(this.phase!=='actions'||!KEYS.includes(give)||!KEYS.includes(take)||give===take)return false;
  const rate=this.tradeRate(give);if(this.player.hand[give]<rate||!this.bank[take])return false;
  this.player.hand[give]-=rate;this.bank[give]+=rate;this.player.hand[take]++;this.bank[take]--;this.note(`${this.player.name} traded ${rate} ${give} for 1 ${take}.`);return true;
 }
 proposeTrade(to,give,take){
  if(this.phase!=='actions'||to===this.active||!this.players[to]||!this.validBundle(give,this.player.hand)||!this.validBundle(take,this.players[to].hand)||!sum(give)||!sum(take))return false;
  if(KEYS.some(k=>give[k]&&take[k]))return false;
  this.offer={from:this.active,to,give:{...give},take:{...take}};this.phase='trade';return true;
 }
 respondTrade(accept){
  if(this.phase!=='trade')return false;
  const o=this.offer;
  if(accept)for(const k of KEYS){this.players[o.from].hand[k]+=o.take[k]-o.give[k];this.players[o.to].hand[k]+=o.give[k]-o.take[k];}
  this.note(accept?'Trade accepted.':'Trade declined.');this.offer=null;this.phase='actions';return true;
 }
 buyDevelopment(){
  if(this.phase!=='actions'||!this.affordable('development')||!this.deck.length)return false;
  this.pay('development');this.player.cards.push({kind:this.deck.pop(),turn:this.turn});this.note(`${this.player.name} bought a development card.`);this.checkWin();return true;
 }
 playDevelopment(index){
  const card=this.player.cards[index];
  if(this.phase!=='actions'||!card||card.kind==='victory'||card.turn===this.turn||this.devUsed)return false;
  this.player.cards.splice(index,1);this.devUsed=true;
  if(card.kind==='knight'){this.player.knights++;this.phase='robber';}
  if(card.kind==='roads')this.freeRoads=2;
  if(['plenty','monopoly'].includes(card.kind)){this.effect=card.kind;this.phase='development';}
  this.note(`${this.player.name} played ${card.kind}.`);this.updateAwards();
  if(this.phase==='actions')this.checkWin();return true;
 }
 resolveDevelopment(keys){
  if(this.phase!=='development'||keys.some(k=>!KEYS.includes(k)))return false;
  if(this.effect==='plenty'){
   if(keys.length!==Math.min(2,sum(this.bank)))return false;
   const counts=emptyHand();keys.forEach(k=>counts[k]++);if(!this.validBundle(counts,this.bank))return false;
   keys.forEach(k=>{this.player.hand[k]++;this.bank[k]--;});
  }else{
   if(keys.length!==1)return false;const key=keys[0];for(const p of this.players)if(p.id!==this.active){this.player.hand[key]+=p.hand[key];p.hand[key]=0;}
  }
  this.effect=null;this.phase='actions';this.checkWin();return true;
 }
 quantumCandidates(first=null){
  const candidates=this.board.nodes.filter(n=>this.legalSettlement(n.id));
  return candidates.filter(n=>first===null?candidates.some(other=>other.id!==n.id&&!n.neighbors.includes(other.id)):(n.id!==first&&!n.neighbors.includes(first))).map(n=>n.id);
 }
 splitCandidates(origin=null){
  const owners=this.board.nodes.filter(n=>n.owner===this.active&&n.level===1);
  const destinations=id=>this.board.nodes.filter(n=>n.id!==id&&this.vacant(n.id)&&n.edges.some(e=>this.board.edges[e].owner===this.active)).map(n=>n.id);
  return origin===null?owners.filter(n=>destinations(n.id).length).map(n=>n.id):owners.some(n=>n.id===origin)?destinations(origin):[];
 }
 splitSettlement(origin,destination){
  if(!['roll','actions'].includes(this.phase)||this.quantumUsed||this.usedSlots>=8||this.player.hand.ore<1||!this.splitCandidates(origin).includes(destination))return false;
  const node=this.board.nodes[origin],slot=this.usedSlots++;
  this.player.hand.ore--;this.bank.ore++;node.owner=null;node.level=0;
  this.quantum.apply('h',slot);this.pending.push({slot,owner:this.active,sites:[origin,destination],born:this.turn});
  this.quantumUsed=true;this.note(`${this.player.name} split a settlement into Q${slot+1}.`);this.checkWin();return true;
 }
 buildQuantum(a,b){
  if(this.phase!=='actions'||!this.affordable('quantum')||a===b||this.usedSlots>=8||this.count('settlement')>=5)return false;
  if(!this.quantumCandidates().includes(a)||!this.quantumCandidates(a).includes(b))return false;
  this.pay('quantum');const slot=this.usedSlots++;
  this.quantum.apply('h',slot);this.pending.push({slot,owner:this.active,sites:[a,b],born:this.turn});
  this.note(`${this.player.name} built one settlement across two locations.`);this.checkWin();return true;
 }
 gate(gate,slot,other=null){
  const p=this.pending.find(p=>p.slot===slot),q=this.pending.find(p=>p.slot===other);
  if(!['roll','actions'].includes(this.phase)||this.quantumUsed||!p||p.owner!==this.active||p.born===this.turn)return false;
  if(!['h','z','cz','x','cx'].includes(gate))return false;
  if(['x','cx'].includes(gate)&&!this.ports().some(p=>p.gate===gate))return false;
  if(['cz','cx'].includes(gate)&&(!q||q.slot===slot))return false;
  if(['cz','cx'].includes(gate))this.quantum.apply(gate,other,slot);else this.quantum.apply(gate,slot);
  this.quantumUsed=true;this.note(`${this.player.name} applied ${gate.toUpperCase()} to settlement Q${slot+1}.`);return true;
 }
 collapse(){
  this.lastState=this.quantum.clone();
  this.lastQuantum=this.quantum.operations.map(op=>({...op}));this.lastDistribution=this.quantum.probabilities();
  const basis=this.quantum.measure(this.random),count=this.pending.length;
  this.resolved=this.pending.map(p=>{const bit=(basis>>p.slot)&1;return {slot:p.slot,owner:p.owner,bit,kept:p.sites[bit],lost:p.sites[1-bit]};});
  for(const p of this.pending){const id=p.sites[(basis>>p.slot)&1],n=this.board.nodes[id];n.owner=p.owner;n.level=1;}
  this.pending=[];this.quantum=new QuantumState(8);this.usedSlots=0;
  this.note(`${count} quantum settlement${count===1?'':'s'} resolved before resource production.`);
  this.updateAwards();
 }
 longestRoad(player){
  const walk=(node,used)=>{
   if(used.size&&this.board.nodes[node].owner!==null&&this.board.nodes[node].owner!==player)return used.size;
   let best=used.size;
   for(const id of this.board.nodes[node].edges){const e=this.board.edges[id];if(e.owner!==player||used.has(id))continue;const next=new Set(used);next.add(id);best=Math.max(best,walk(e.a===node?e.b:e.a,next));}
   return best;
  };
  return Math.max(0,...this.board.nodes.map(n=>walk(n.id,new Set())));
 }
 updateAwards(){
  const award=(values,holder,min)=>{
   const best=Math.max(...values);if(best<min)return null;
   const leaders=values.map((v,i)=>v===best?i:-1).filter(i=>i>=0);
   if(leaders.length===1)return leaders[0];return leaders.includes(holder)?holder:null;
  };
  this.longest=award(this.players.map(p=>this.longestRoad(p.id)),this.longest,5);
  this.army=award(this.players.map(p=>p.knights),this.army,3);
 }
 endTurn(){
  if(this.phase!=='actions')return false;
  this.checkWin();if(this.winner!==null)return false;
  this.active=(this.active+1)%this.players.length;this.turn++;this.phase='roll';this.dice=null;this.production=[];this.resolved=null;this.quantumUsed=false;this.devUsed=false;this.freeRoads=0;this.note(`${this.player.name}’s turn.`);this.checkWin();return true;
 }
}
