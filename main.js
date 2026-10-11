import { Catan } from './src/catan.js';
import { KEYS, RESOURCES, COSTS, COLORS, emptyHand } from './src/board.js';
import { boardSVG } from './src/catan-board.js';
import { circuitPython } from './src/quantum.js';
const app=document.querySelector('#app');
let game=new Catan(), mode=null, first=null, selectedQ=null, panel='new', tutorial=false, savedGame=null, practiceSupplies=false;
let zoom=1;
let backendUsed=false,backendBusy=false,backendResult='',keyboard=false,tipTimer;
let fxKey='',prevOdds=new Map(),fx={};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tip=s=>`data-tip="${esc(s)}" aria-description="${esc(s)}"`;
const icon=k=>`<span class="res-icon" style="--resource:${RESOURCES[k].color}" aria-label="${RESOURCES[k].name}">${RESOURCES[k].symbol}</span>`;
const cardNames={knight:'Knight',roads:'Road building',plenty:'Year of plenty',monopoly:'Monopoly',victory:'Victory point'};
const actionNames={road:'Road',settlement:'Settlement',city:'City',development:'Development',quantum:'Quantum settlement'};
const cost=type=>`<span class="cost">${Object.entries(COSTS[type]).map(([k,n])=>`<span class="${game.player.hand[k]<n?'missing':''}">${n>1?n:''}${icon(k)}</span>`).join('')}</span>`;
const sum=hand=>KEYS.reduce((s,k)=>s+hand[k],0);
const actualPanel=()=>['discard','steal','trade','development'].includes(game.phase)?game.phase:panel;
function task(){
 if(game.winner!==null)return `${game.players[game.winner].name} wins`;
 if(game.phase==='setup-settlement')return `Place settlement ${game.setupIndex>=game.players.length?'2':'1'} of 2`;
 if(game.phase==='setup-road')return 'Place a starting road';
 if(mode==='split')return first===null?'Choose a settlement to split':'Choose its second location';
 if(game.phase==='roll')return 'Roll for resources';
 if(game.phase==='robber')return 'Move the robber';
 if(game.phase==='discard')return 'Discard excess resources';
 if(game.phase==='steal')return 'Choose a player to rob';
 if(game.phase==='trade')return 'Trade offer';
 if(game.phase==='development')return 'Resolve development card';
 if(mode==='quantum')return first===null?'Choose location A':'Choose location B';
 if(mode)return `Build ${actionNames[mode].toLowerCase()}`;
 return 'Trade & build';
}
function news(){
 if(!game.dice||['roll','discard','robber'].includes(game.phase))return '';
 const measured=game.resolved?.length?`<span class="measured ${fx.fresh?'fresh':''}" ${tip('Rolled terrain touched a possible location, so every pending settlement was measured jointly before production.')}>◇ Measured first<b>${game.resolved.map(r=>`Q${r.slot+1} → ${r.bit?'B':'A'}`).join(' · ')}</b></span>`:'';
 const yields=game.players.map(p=>{const got=game.production.filter(g=>g.player===p.id);return got.length?`<span class="yield-note" style="--player:${COLORS[p.id]}">${esc(p.name)} ${got.map(g=>`+${g.n}${icon(g.key)}`).join(' ')}</span>`:'';}).join('');
 return measured+(yields||(game.dice[0]+game.dice[1]===7?'':'<span class="yield-note muted">No production</span>'));
}
function lesson(){
 const phase=game.phase;
 const texts={
  'setup-settlement':'Click a highlighted intersection. Its adjoining terrain produces resources when that number is rolled. Dots show how often a number comes up. Leave at least one empty intersection between settlements.',
  'setup-road':'Click a highlighted edge to place your free road. Roads connect future settlements. Setup runs forward, then backward, so everyone places two settlements and two roads.',
  roll:'Roll two dice. Every player collects from matching terrain: one card per settlement, two per city. Your second starting settlement supplied your opening hand.',
  actions:'Spend your resource cards to extend roads, build settlements, or upgrade cities. Trade with the bank or another player. End your turn when you are done. First to 10 points wins.',
  robber:'A seven produces nothing. Players holding more than seven cards discard half. Move the robber to block a different terrain hex and steal from an adjacent opponent.',
  discard:'Choose exactly the required number of cards. The active player then moves the robber.',
  steal:'Choose an adjacent opponent. One random resource moves into your hand.',
 };
 let text=texts[phase]||'Finish this action to continue your turn.';
 if(mode==='road')text='A road costs one lumber and one brick. Click an available edge connected to your network. You cannot build through another player’s settlement.';
 if(mode==='settlement')text='A settlement costs lumber, brick, grain and wool. It must connect to your road and leave one empty intersection beside every other settlement.';
 if(mode==='split')text='Spend one ore and this turn’s quantum action to split an existing settlement between its current site and another legal site connected to your roads. It remains one building and one point. Your existing resource cards stay classical.';
 if(mode==='city')text='A city replaces your settlement for two grain and three ore. It is worth two points and collects two cards when its terrain produces.';
 if(mode==='quantum')text='Pay a normal settlement plus one ore. Choose two legal locations connected to your roads. They share one settlement and one point. When either location’s terrain produces, all pending quantum settlements are measured before any cards are paid.';
 if(selectedQ!==null)text='A quantum settlement has two location amplitudes. Before or after rolling on a later turn, use one quantum action: Interfere (H), Phase (Z), or Link (CZ). Owned ports unlock X or controlled-X. Probabilities follow the shared quantum state.';
 return `<section class="tutorial"><div><strong>LEARN AT THE TABLE</strong><button data-action="exit-tutorial">Exit ×</button></div><p>${text}</p>${practiceSupplies&&game.phase==='actions'?'<small>Practice only: each player received two extra cards of every resource.</small>':''}</section>`;
}
function render(){
 clearTimeout(tipTimer);
 const previousBoard=app.querySelector('.board-wrap'), scrollX=previousBoard?.scrollLeft||0, scrollY=previousBoard?.scrollTop||0;
 const modal=actualPanel(), setup=game.phase.startsWith('setup'), count=sum(game.player.hand);
 const key=game.dice?`${game.turn}:${game.dice}`:'',odds=new Map(game.pending.map(p=>[p.slot,game.quantum.marginal(p.slot)]));
 fx={fresh:!!key&&key!==fxKey,prev:new Map([...odds.keys()].filter(s=>prevOdds.has(s)).map(s=>[s,prevOdds.get(s)]))};fxKey=key;prevOdds=odds;
 app.innerHTML=`<div class="game-shell"><header class="topbar" ${modal?'inert':''}><button class="brand" data-panel="new" ${tip('Create a new local table')}>FOLD<span>QUANTUM CATAN</span></button><div class="turn-label">${setup?'SETUP':`TURN ${game.turn}`}<span class="player-dot" style="background:${COLORS[game.active]}"></span>${esc(game.player.name)}</div><nav><button data-action="tutorial" ${tip('Guided practice, without changing your match')}>Tutorial</button><button data-panel="rules" aria-label="Rules" ${tip('Rules and quantum modifications')}>?</button><button data-panel="science" aria-label="Quantum inspector" ${tip('Statevector and Qiskit verification')}>ψ</button><button data-panel="log" aria-label="Game log" ${tip('Game log')}>☷</button></nav></header>
 <div class="table-layout" ${modal?'inert':''}><main class="table"><div class="board-hud"><span class="task">${esc(task())}</span>${mode?'<button data-action="cancel">Cancel ×</button>':''}${news()}<span class="zoom-tools"><button data-action="zoom-out" aria-label="Zoom out" ${zoom===1?'disabled':''}>−</button><button data-action="zoom-in" aria-label="Zoom in" ${zoom===2?'disabled':''}>+</button></span><span class="dice" ${tip('Two six-sided dice. Matching terrain pays every adjacent player.')}>${game.dice?game.dice.map(n=>`<b>${['','⚀','⚁','⚂','⚃','⚄','⚅'][n]}</b>`).join(''):'<small>Not rolled</small>'}${game.dice?`<strong>${game.dice[0]+game.dice[1]}</strong>`:''}</span></div>
 <div class="board-wrap ${zoom>1?'zoomed':''}" style="--zoom:${zoom}">${boardSVG(game,mode,first,selectedQ,fx)}</div>
 <div class="hand" aria-label="${esc(game.player.name)} resource cards"><div class="hand-label">YOUR HAND<span>${count} cards</span></div>${KEYS.map(k=>{const gain=game.production.filter(g=>g.player===game.active&&g.key===k).reduce((s,g)=>s+g.n,0);return `<div class="resource-card ${gain?'gained':''}" ${tip(`${RESOURCES[k].name}. Bank has ${game.bank[k]} remaining.`)}>${gain?`<em class="gain ${fx.fresh?'fresh':''}">+${gain}</em>`:''}${icon(k)}<strong>${game.player.hand[k]}</strong><span>${RESOURCES[k].name}</span></div>`;}).join('')}</div></main>
 <aside class="sidebar"><section class="players">${game.players.map(p=>`<div class="player-row ${p.id===game.active?'active':''}" style="--player:${COLORS[p.id]}"><span class="avatar">${p.id+1}</span><div><strong>${esc(p.name)}</strong><small>${sum(p.hand)} cards · ${game.count('road',p.id)} roads${game.longest===p.id?' · Longest road':''}${game.army===p.id?' · Largest army':''}</small></div><b ${tip('Settlements 1 point, cities 2. Longest road and largest army 2 each. First to 10 wins.')}>${game.score(p.id)-(p.id===game.active||game.winner!==null?0:p.cards.filter(c=>c.kind==='victory').length)}<small>/10</small></b></div>`).join('')}</section>
 ${tutorial?lesson():''}
 <section class="action-panel">${actions()}</section>
 <div class="last-event" role="status" aria-live="polite">${esc(game.message)}</div>
 </aside></div></div>${modal?drawer(modal):''}<div id="tooltip" role="tooltip" hidden></div>`;
 bind();
 const nextBoard=app.querySelector('.board-wrap');nextBoard.scrollLeft=scrollX;nextBoard.scrollTop=scrollY;
}
function actions(){
 if(game.winner!==null){
  const parts=p=>[[game.count('settlement',p.id)-game.pending.filter(q=>q.owner===p.id).length,'settlement'],[game.pending.filter(q=>q.owner===p.id).length,'quantum settlement'],[game.count('city',p.id),'city','cities'],[game.longest===p.id?1:0,'longest road'],[game.army===p.id?1:0,'largest army'],[p.cards.filter(c=>c.kind==='victory').length,'victory card']].filter(([n])=>n).map(([n,one,many])=>`${n} ${n===1?one:many||one+'s'}`).join(' · ');
  return `<div class="winner" style="--player:${COLORS[game.winner]}"><small>WINNER · TURN ${game.turn}</small>${esc(game.players[game.winner].name)}<strong>${game.score(game.winner)} points</strong></div><ol class="final-score">${game.players.slice().sort((a,b)=>game.score(b.id)-game.score(a.id)).map(p=>`<li style="--player:${COLORS[p.id]}"><b>${esc(p.name)}</b><span>${parts(p)}</span><strong>${game.score(p.id)}</strong></li>`).join('')}</ol><button class="primary" data-panel="new">New game</button>`;
 }
 if(game.phase.startsWith('setup'))return `<div class="phase-label">${game.setupIndex+1} / ${game.setupOrder.length} STARTING PLACEMENTS</div><div class="setup-piece">${game.phase==='setup-road'?'━':'⌂'}</div><h2>${esc(task())}</h2><button class="quiet" data-panel="rules">Building rules ↗</button>`;

 if(game.phase==='robber')return '<h2>Move the robber</h2>';
 if(!['roll','actions'].includes(game.phase))return '';
 if(selectedQ!==null){
  const p=game.pending.find(p=>p.slot===selectedQ);
  if(p){
   const mine=p.owner===game.active,can=mine&&!game.quantumUsed&&p.born!==game.turn,st=game.quantum,prob=st.marginal(p.slot),before=fx.prev.get(p.slot)??prob;
   const linked=game.pending.filter(q=>q.slot!==p.slot&&st.pairCorrelation(p.slot,q.slot)>1e-8),pure=st.purity(p.slot)>.99999,b=st.bloch(p.slot);
   const phase=!pure?`Shared with ${linked.map(q=>'Q'+(q.slot+1)).join(', ')||'register'}`:Math.abs(b.z)>.9999?'Definite':b.x>.9999?'In step  +':b.x<-.9999?'Opposite  −':`${Math.round(Math.atan2(b.y,b.x)*180/Math.PI)}°`;
   const after=g=>{if(g==='cz'||g==='cx')return 'odds unchanged';const s=st.clone();s.apply(g,p.slot);const m=s.marginal(p.slot);return m<.005?'→ A 100%':m>.995?'→ B 100%':Math.abs(m-prob)<.005?'odds unchanged':`→ A ${Math.round((1-m)*100)}%`;};
   const gate=(g,glyph,label,help,ok)=>`<button data-gate="${g}" ${can&&ok?'':'disabled'} ${tip(help)}><i>${glyph}</i><span>${label}<small>${after(g)}</small></span></button>`;
   return `<div class="panel-title"><h2>Settlement Q${p.slot+1}</h2><button data-action="cancel">×</button></div><div class="quantum-state"><span class="state-chip ${pure?'':'entangled'}">${pure?'Coherent':'Entangled'}</span>${linked.map(q=>`<span>with Q${q.slot+1} · ${esc(game.players[q.owner].name)}</span>`).join('')}</div><div class="odds-bar" style="--a:${((1-prob)*100).toFixed(2)}%;--a0:${((1-before)*100).toFixed(2)}%"><i></i></div><div class="quantum-odds"><span>A <b>${Math.round((1-prob)*100)}%</b></span><span>B <b>${Math.round(prob*100)}%</b></span></div><div class="phase-row" ${tip('The sign between the two location amplitudes. Odds ignore it; the next Interfere uses it.')}><span>Relative phase</span><b>${phase}</b></div><div class="gate-grid">${gate('h','H','Interfere','H mixes the two location amplitudes.',true)}${gate('z','Z','Phase','Z flips location B’s amplitude sign.',true)}${gate('x','X','Port swap','X swaps the location amplitudes. Requires an owned X port.',game.ports().some(p=>p.gate==='x'))}</div><label for="quantum-other">Link with</label><select id="quantum-other">${game.pending.filter(q=>q.slot!==p.slot).map(q=>`<option value="${q.slot}">${esc(game.players[q.owner].name)} · Q${q.slot+1}</option>`).join('')}</select><div class="gate-grid">${gate('cz','CZ','Link','CZ flips the joint B/B amplitude. It can entangle the two settlements without changing immediate odds.',game.pending.length>1)}${gate('cx','CX','Port link','Controlled-X flips the target location only when this settlement is at B. Requires an owned CX port.',game.pending.length>1&&game.ports().some(p=>p.gate==='cx'))}</div><button class="quiet" data-action="cancel">Back to table</button>`;
  }
 }
 if(game.phase==='roll')return `<button class="primary roll-button" data-action="roll">Roll dice <span>⚄ ⚂</span></button><button class="quiet" data-panel="cards">Development cards <b>${game.player.cards.length}</b></button>${quantumTools()}`;
 return `<div class="panel-title"><h2>Build</h2><span>${game.freeRoads?`${game.freeRoads} free roads`:''}</span></div><div class="build-list">${['road','settlement','city','development','quantum'].map(type=>{
  const available=(type==='road'&&game.freeRoads)||game.affordable(type),stock=type==='road'?game.count('road')<15:type==='city'?game.count('city')<4:type==='development'?game.deck.length>0:game.count('settlement')<5;
  return `<button class="${mode===type?'selected':''}" data-build="${type}" ${available&&stock&&(type==='development'||type==='road'&&game.board.edges.some(e=>game.legalRoad(e.id))||type==='settlement'&&game.board.nodes.some(n=>game.legalSettlement(n.id))||type==='city'&&game.board.nodes.some(n=>game.legalCity(n.id))||type==='quantum'&&game.quantumCandidates().length>1)?'':'disabled'} ${tip(type==='quantum'?'One settlement at two legal connected locations. Costs a normal settlement plus one ore. Producing terrain or robber contact measures the pending state.':type==='development'?'Draw a development card. It cannot be played on the turn it is bought.':`Build a ${type} on a highlighted legal ${type==='road'?'edge':'intersection'}.`)}><span>${type==='quantum'?'◇':type==='road'?'━':type==='city'?'▥':type==='development'?'▤':'⌂'}</span><b>${actionNames[type]}</b>${cost(type)}</button>`;
 }).join('')}</div><div class="secondary-actions"><button data-panel="exchange" ${tip('Exchange cards with the bank, use an owned port, or propose a player trade.')}>Trade ↔</button><button data-panel="cards">Cards <b>${game.player.cards.length}</b></button></div>${quantumTools()}<button class="primary" data-action="end">End turn →</button>`;
}
function quantumTools(){
 return `<div class="quantum-tools"><button data-action="split" ${!game.quantumUsed&&game.player.hand.ore>0&&game.usedSlots<8&&game.splitCandidates().length?'':'disabled'} ${tip('One ore + your quantum action. Split an existing settlement between its current site and a legal road-connected site; no new victory point.')}><span>◇ Split settlement</span><span>1 ${icon('ore')}</span></button>${game.pending.some(p=>p.owner===game.active)?`<button data-action="quantum-controls" ${tip('One quantum operation per turn, before or after rolling. New settlements wait until a later turn.')}><span>${game.quantumUsed?'Quantum action used':'Interfere / link'}</span><span>ψ</span></button>`:''}</div>`;
}
const options=(selected='wood')=>KEYS.map(k=>`<option value="${k}" ${k===selected?'selected':''}>${RESOURCES[k].name}</option>`).join('');
function drawer(which){
 let body='',forced=['discard','steal','trade','development'].includes(which);
 if(which==='new')body=`<h2 id="dialog-title">Local table</h2><form id="new-game"><label for="player-count">Players</label><select id="player-count"><option value="2">2 — head-to-head house variant</option><option value="3">3 players</option><option value="4">4 players</option></select><div class="name-fields">${[0,1,2,3].map(i=>`<label class="name-field" ${i>1?'hidden':''}>Player ${i+1}<input name="name${i}" maxlength="20" value="${esc(game.players[i]?.name||`Player ${i+1}`)}" autocomplete="off"></label>`).join('')}</div><button class="primary" type="submit">Start game</button><button type="button" class="quiet" data-action="tutorial">Learn by playing ↗</button></form>`;
 if(which==='rules')body=`<h2 id="dialog-title">At the table</h2><details open><summary>Play Catan</summary><p>Place one settlement and adjacent road in player order, then another pair in reverse order. Your second settlement supplies its adjacent resources.</p><p>Roll two dice on each turn. Matching terrain gives one resource per settlement or two per city, to all players. The robber blocks its terrain. Trade, build, then end your turn.</p><p>Road: lumber + brick. Settlement: lumber + brick + wool + grain. City: two grain + three ore. Development: wool + grain + ore. Settlements must connect to your roads and leave one empty intersection between buildings.</p><p>A seven makes players with more than seven cards discard half, rounded down. Move the robber and steal one random card from an adjacent opponent.</p><p>Bank trades cost four matching cards for one. Owned ports improve this to 3:1 or resource-specific 2:1. Player trades require the other player’s acceptance.</p><p>Settlements score one, cities two. Longest continuous road (at least five) and largest army (at least three knights) add two each. Victory-point cards add one. First to 10 on your own turn wins.</p></details><details><summary>Quantum settlements & gate ports</summary><p>A quantum settlement costs the normal settlement resources plus one ore. Choose two separate legal locations connected to your roads. One building, one point, two location amplitudes. Both locations reserve their distance-rule space; no roads can extend through a pending location.</p><p>Each starts in equal superposition. Starting on a later turn, take one H, Z or CZ action before or after rolling. This is one shared allowance per turn. You can also spend one ore and that allowance to split an existing settlement between its current site and one legal road-connected site. It remains one piece and one point; previously earned cards stay classical. An owned gate port also permits X or controlled-X. H mixes amplitudes; Z flips B’s sign; CZ flips the joint B/B sign. These operations can alter future interference and correlations.</p><p>If a rolled, unblocked terrain touches either possible location, all pending settlements are measured jointly before resources are awarded. Robber contact also measures them before theft. Only the surviving locations produce. No classical inventory is secretly retained for discarded branches.</p><p>Up to eight settlements may share a register. Location A/B are the qubit basis states; resource names are ordinary outputs of the terrain at the measured location.</p></details><details><summary>Table conventions</summary><p>Local pass-and-play for 2–4 people. Two players is a house variant, without official neutral settlements. Development actions follow the roll; the interface keeps all scores public except opponents’ unplayed victory-point cards. No network multiplayer or saved matches yet.</p><p>Ports and quantum settlements are house rules. This is an independent prototype, not an official CATAN product. Terrain artwork is original.</p></details>`;
 if(which==='log')body=`<h2 id="dialog-title">Game log</h2><ol class="history">${game.log.map(l=>`<li>${esc(l)}</li>`).join('')}</ol>`;
 if(which==='exchange')body=`<h2 id="dialog-title">Trade</h2><form id="bank-trade"><h3>Bank & ports</h3><div class="form-row"><label>Give<select name="give">${options()}</select></label><span>→</span><label>Receive<select name="take">${options('brick')}</select></label></div><div class="rates">${KEYS.map(k=>`<span>${icon(k)} ${game.tradeRate(k)}:1</span>`).join('')}</div><button class="primary">Exchange</button></form><form id="player-trade"><h3>Player trade</h3><label>With<select name="to">${game.players.filter(p=>p.id!==game.active).map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><div class="form-row"><label>You give<select name="give">${options()}</select><input name="giveCount" type="number" min="1" max="19" value="1" aria-label="Cards offered"></label><span>↔</span><label>You receive<select name="take">${options('brick')}</select><input name="takeCount" type="number" min="1" max="19" value="1" aria-label="Cards requested"></label></div><button class="secondary">Propose trade</button></form><p id="form-error" role="alert"></p>`;
 if(which==='trade'){
  const o=game.offer,bundle=h=>KEYS.filter(k=>h[k]).map(k=>`${h[k]} ${RESOURCES[k].name}`).join(', ');
  body=`<h2 id="dialog-title">${esc(game.players[o.to].name)}, trade?</h2><p>${esc(game.players[o.from].name)} offers <b>${bundle(o.give)}</b> for <b>${bundle(o.take)}</b>.</p><button class="primary" data-action="accept-trade">Accept</button><button class="secondary" data-action="decline-trade">Decline</button>`;
 }
 if(which==='discard'){
  const d=game.discards[0],p=game.players[d.player];
  body=`<h2 id="dialog-title">${esc(p.name)}: discard ${d.count}</h2><form id="discard-form">${KEYS.map(k=>`<label class="discard-row">${icon(k)} ${RESOURCES[k].name}<span>${p.hand[k]} held</span><input type="number" name="${k}" min="0" max="${p.hand[k]}" value="0"></label>`).join('')}<button class="primary">Discard selected cards</button><p id="form-error" role="alert"></p></form>`;
 }
 if(which==='steal')body=`<h2 id="dialog-title">Steal one resource</h2>${game.stealFrom.map(id=>`<button class="secondary" data-steal="${id}">${esc(game.players[id].name)} <span>${sum(game.players[id].hand)} cards</span></button>`).join('')}`;
 if(which==='cards')body=`<h2 id="dialog-title">Development cards</h2>${game.player.cards.length?game.player.cards.map((c,i)=>`<button class="development-card" data-dev="${i}" ${game.phase==='actions'&&!game.devUsed&&c.turn!==game.turn&&c.kind!=='victory'?'':'disabled'}><b>${cardNames[c.kind]}</b><span>${c.kind==='victory'?'+1 victory point':c.turn===game.turn?'Available next turn':game.devUsed?'One card per turn':'Play card'}</span></button>`).join(''):'<p>No development cards yet.</p>'}<p>${game.deck.length} cards left in the deck.</p>`;
 if(which==='development'){
  const count=game.effect==='plenty'?Math.min(2,sum(game.bank)):1;
  const available=KEYS.filter(k=>game.effect!=='plenty'||game.bank[k]>0).map(k=>`<option value="${k}">${RESOURCES[k].name}</option>`).join('');
  body=`<h2 id="dialog-title">${cardNames[game.effect]}</h2><form id="development-form">${Array.from({length:count},(_,i)=>`<label>${i?'Second resource':'Resource'}<select name="${i?'two':'one'}">${available}</select></label>`).join('')}${count===0?'<p>The bank is empty.</p>':''}<button class="primary">Confirm</button><p id="form-error" role="alert"></p></form>`;
 }
 if(which==='science'){
  const state=game.pending.length?game.quantum:game.lastState||game.quantum,ops=state.operations;
  body=`<h2 id="dialog-title">Quantum register</h2><p>Eight qubits; ${game.pending.length} active settlements. Each bit selects a settlement’s location A or B. Unused qubits stay at zero.</p><div class="facts">${game.pending.map(p=>`<div>Q${p.slot+1} · ${esc(game.players[p.owner].name)} <b>purity ${state.purity(p.slot).toFixed(4)}</b></div>`).join('')}<div>Normalization <b>${state.probabilities().reduce((a,b)=>a+b,0).toFixed(8)}</b></div></div><details><summary>Nonzero amplitudes ${game.pending.length?'':'before last measurement'}</summary><table><thead><tr><th>Q8…Q1</th><th>Amplitude</th><th>Probability</th></tr></thead><tbody>${state.probabilities().map((p,i)=>p>1e-10?`<tr><td>${i.toString(2).padStart(8,'0')}</td><td>${state.data[2*i].toFixed(3)} + ${state.data[2*i+1].toFixed(3)}i</td><td>${(p*100).toFixed(2)}%</td></tr>`:'').join('')}</tbody></table></details><details><summary>Circuit</summary><pre>${ops.map(o=>`${o.gate.toUpperCase()} ${o.control===undefined?'':o.control+' → '}${o.target}`).join('\n')||'|00000000⟩'}</pre></details><button class="secondary" data-action="export">Download Qiskit circuit</button><button class="secondary" data-action="verify" ${backendUsed||backendBusy||!window.foldBackend?'disabled':''}>${backendBusy?'Running…':backendUsed?'Backend job used':window.foldBackend?'Verify on Qollab backend':'Backend available inside Qollab'}</button><p>The game runs locally. Qollab verification submits one 1,024-shot job per Run; it does not change gameplay.</p><div role="status">${backendResult}</div>`;
 }
 return `<div class="backdrop" ${forced?'':'data-action="close"'}></div><section class="dialog ${which==='new'?'lobby':''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabindex="-1">${forced?'':'<button class="close" data-action="close" aria-label="Close panel">×</button>'}${body}</section>`;
}
function focusDialog(){app.querySelector('.dialog')?.focus({preventScroll:true});}
function changed(success=true){
 if(!success)return false;
 if(tutorial&&!practiceSupplies&&!game.phase.startsWith('setup')){
  for(const p of game.players)for(const k of KEYS){p.hand[k]+=2;game.bank[k]-=2;}
  practiceSupplies=true;
 }
 mode=null;first=null;selectedQ=null;panel=null;render();if(actualPanel())focusDialog();return true;
}
function error(text){const el=app.querySelector('#form-error');if(el)el.textContent=text;}
function bind(){
 app.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{panel=el.dataset.panel;render();focusDialog();});
 app.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>action(el.dataset.action));
 app.querySelectorAll('[data-build]').forEach(el=>el.onclick=()=>{
  if(el.dataset.build==='development'){changed(game.buyDevelopment());return;}
  mode=el.dataset.build;first=null;selectedQ=null;render();
 });
 app.querySelectorAll('[data-node]').forEach(el=>activate(el,()=>{
  const id=Number(el.dataset.node);
  if(mode==='split'){if(first===null){first=id;render();}else changed(game.splitSettlement(first,id));}
  else if(mode==='quantum'){if(first===null){first=id;render();}else changed(game.buildQuantum(first,id));}
  else changed(mode==='city'?game.upgrade(id):game.placeSettlement(id));
 }));
 app.querySelectorAll('[data-edge]').forEach(el=>activate(el,()=>changed(game.placeRoad(Number(el.dataset.edge)))));
 app.querySelectorAll('[data-tile]').forEach(el=>activate(el,()=>changed(game.moveRobber(Number(el.dataset.tile)))));
 app.querySelectorAll('[data-q]').forEach(el=>activate(el,()=>{if(['roll','actions'].includes(game.phase)){selectedQ=Number(el.dataset.q);mode=null;first=null;render();}}));
 app.querySelectorAll('[data-gate]').forEach(el=>el.onclick=()=>{const q=selectedQ;if(game.gate(el.dataset.gate,q,Number(app.querySelector('#quantum-other')?.value))){mode=null;first=null;panel=null;render();}else selectedQ=q;});
 app.querySelectorAll('[data-steal]').forEach(el=>el.onclick=()=>changed(game.steal(Number(el.dataset.steal))));
 app.querySelectorAll('[data-dev]').forEach(el=>el.onclick=()=>changed(game.playDevelopment(Number(el.dataset.dev))));
 app.querySelector('#player-count')?.addEventListener('change',e=>app.querySelectorAll('.name-field').forEach((el,i)=>el.hidden=i>=Number(e.target.value)));
 app.querySelector('#new-game')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget,n=Number(f.querySelector('#player-count').value);game=new Catan(Array.from({length:n},(_,i)=>f.elements['name'+i].value));tutorial=false;savedGame=null;changed();});
 app.querySelector('#bank-trade')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;if(game.bankTrade(f.give.value,f.take.value)){render();focusDialog();}else error('Not enough cards, empty bank supply, or matching resources.');});
 app.querySelector('#player-trade')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements,give=emptyHand(),take=emptyHand();give[f.give.value]=Number(f.giveCount.value);take[f.take.value]=Number(f.takeCount.value);if(!changed(game.proposeTrade(Number(f.to.value),give,take)))error('Both players must have the offered cards. Choose different resources.');});
 app.querySelector('#discard-form')?.addEventListener('submit',e=>{e.preventDefault();const hand=Object.fromEntries(KEYS.map(k=>[k,Number(e.currentTarget.elements[k].value)]));if(!changed(game.discard(hand)))error('Select exactly the required number, using cards you hold.');});
 app.querySelector('#development-form')?.addEventListener('submit',e=>{e.preventDefault();const f=e.currentTarget.elements;if(!changed(game.resolveDevelopment(f.two?[f.one.value,f.two.value]:f.one?[f.one.value]:[])))error('The bank cannot supply those resources.');});
 app.querySelectorAll('[data-tip]').forEach(el=>{
  el.onmouseenter=()=>{tipTimer=setTimeout(()=>showTip(el),300);};el.onmouseleave=hideTip;
  el.onfocus=()=>{if(keyboard)showTip(el);};el.onblur=hideTip;
 });
}
function activate(el,fn){el.onclick=fn;el.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();fn();}};}
function showTip(el){
 const t=app.querySelector('#tooltip');if(!t||!el.isConnected)return;t.textContent=el.dataset.tip;t.hidden=false;
 const r=el.getBoundingClientRect(),b=t.getBoundingClientRect();t.style.left=Math.max(10,Math.min(innerWidth-b.width-10,r.left+r.width/2-b.width/2))+'px';t.style.top=(r.bottom+b.height+12<innerHeight?r.bottom+8:Math.max(8,r.top-b.height-8))+'px';
}
function hideTip(){clearTimeout(tipTimer);const t=app.querySelector('#tooltip');if(t)t.hidden=true;}
async function action(name){
 if(name==='zoom-in'||name==='zoom-out'){zoom=Math.max(1,Math.min(2,zoom+(name==='zoom-in'?.5:-.5)));render();return;}
 if(name==='close'){if(['discard','steal','trade','development'].includes(game.phase))return;panel=null;render();return;}
 if(name==='split'){mode='split';first=null;selectedQ=null;render();return;}
 if(name==='cancel'){mode=null;first=null;selectedQ=null;render();return;}
 if(name==='roll')return changed(game.roll());
 if(name==='end')return changed(game.endTurn());
 if(name==='accept-trade')return changed(game.respondTrade(true));
 if(name==='decline-trade')return changed(game.respondTrade(false));
 if(name==='quantum-controls'){selectedQ=game.pending.find(p=>p.owner===game.active)?.slot??null;render();return;}
 if(name==='tutorial'){
  if(!tutorial)savedGame=game;
  game=new Catan(['You','Player 2']);tutorial=true;practiceSupplies=false;changed();return;
 }
 if(name==='exit-tutorial'){game=savedGame||new Catan();savedGame=null;tutorial=false;changed();return;}
 if(name==='export'){
  const state=game.pending.length?game.quantum:game.lastState||game.quantum;
  const url=URL.createObjectURL(new Blob([circuitPython(state.operations,1024,8)],{type:'text/x-python'})),a=document.createElement('a');a.href=url;a.download='fold_quantum_settlements.py';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;
 }
 if(name==='verify'){
  if(!window.foldBackend||backendUsed||backendBusy)return;
  const state=game.pending.length?game.quantum:game.lastState||game.quantum,ops=state.operations.map(o=>({...o})),expected=state.probabilities();
  backendUsed=true;backendBusy=true;render();focusDialog();
  try{
   const {counts}=await window.foldBackend(ops,8),total=Object.values(counts).reduce((a,b)=>a+b,0);
   if(!total||Object.entries(counts).some(([k,v])=>!/^[01]{8}$/.test(k)||!Number.isInteger(v)||v<0))throw Error('Invalid backend counts');
   const distance=expected.reduce((s,p,i)=>s+Math.abs(p-(counts[i.toString(2).padStart(8,'0')]||0)/total),0)/2;
   backendResult=`<p>${total} shots. Distance from the ideal distribution: ${distance.toFixed(4)}.</p>`;
  }catch(e){backendResult=`<p>${esc(e.message)}. Stop and Run in Qollab to retry.</p>`;}
  backendBusy=false;render();focusDialog();
 }
}
document.addEventListener('pointerdown',()=>{keyboard=false;hideTip();});
document.addEventListener('keydown',e=>{
 keyboard=true;
 if(e.key==='Escape'){hideTip();action(actualPanel()?'close':'cancel');}
 if(actualPanel()&&e.key==='Tab'){
  const items=[...app.querySelectorAll('.dialog button:not(:disabled),.dialog input,.dialog select,.dialog summary')].filter(el=>el.getClientRects().length),first=items[0],last=items.at(-1);
  if(e.shiftKey&&(document.activeElement===first||document.activeElement===app.querySelector('.dialog'))){e.preventDefault();last?.focus();}
  else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
 }
});
render();focusDialog();

