import { RESOURCES,COLORS } from './board.js';
const tones={wood:'#6e9561',brick:'#ba7855',wool:'#a5bc75',wheat:'#d9b75e',ore:'#8d9a9e',desert:'#d9c48e'};
export function piece(x,y,owner,level=1,ghost=false,label=''){
 const color=COLORS[owner];
 return `<g transform="translate(${x} ${y})" class="piece" opacity="${ghost?.72:1}"><path d="${level===2?'M-15 10v-18l9-8 9 8v4l9-8 12 10v14z':'M-12 10V-5L0-15 12-5v15z'}" fill="${color}" stroke="#192b33" stroke-width="2.5" ${ghost?'stroke-dasharray="4 2"':''}/><path d="M-3 10V1h6v9" fill="#25363c"/>${label?`<text y="-21" text-anchor="middle" class="ghost-label">${label}</text>`:''}</g>`;
}
function art(t){
 const x=t.x,y=t.y-28,c=tones[t.kind];
 if(t.kind==='wood')return `<path d="M${x-31} ${y+13}l11-22 11 22zm23-6 10-25 13 25zm23 9 10-20 11 20z" fill="#355b38" opacity=".7"/>`;
 if(t.kind==='ore')return `<path d="M${x-33} ${y+13}l21-32 22 32zm29 0 17-25 21 25z" fill="#586970"/><path d="M${x-12} ${y-19}l-7 11 7-3 6 4z" fill="#e8e7d9"/>`;
 if(t.kind==='wheat')return `<path d="M${x-26} ${y+8}l44-17 11 8-44 17z" fill="#aa8339"/><path d="M${x-19} ${y+8}l43-16m-36 20 42-16m-35 21 42-16" stroke="#f1d783" stroke-width="3"/>`;
 if(t.kind==='brick')return `<g fill="#934d36" stroke="#dba086" stroke-width="1.4"><path d="M${x-24} ${y-5}h28v13h-28zm15-11h28v12h-28zm15 12h24v12h-24z"/></g>`;
 if(t.kind==='wool')return `<g fill="#f4f0d7" stroke="#738357"><ellipse cx="${x-15}" cy="${y}" rx="13" ry="8"/><ellipse cx="${x+16}" cy="${y+8}" rx="13" ry="8"/></g><g fill="#3b5140"><circle cx="${x-3}" cy="${y+1}" r="4"/><circle cx="${x+28}" cy="${y+9}" r="4"/></g>`;
 return `<path d="M${x-34} ${y+10}q18-20 36-2t30-3M${x-24} ${y+18}q25-13 49-1" fill="none" stroke="#bba56d" stroke-width="3"/>`;
}
const RING=2*Math.PI*17;
function ghost(n,p,bit,prob,selected,from){
 const o=.22+.78*prob,o0=from===undefined?o:.22+.78*from,arc=v=>`${(v*RING).toFixed(2)} ${RING.toFixed(2)}`;
 const anim=from!==undefined&&Math.abs(from-prob)>.001;
 return `<g class="quantum-target ghost ${selected?'selected':''}" data-q="${p.slot}" role="button" tabindex="0" aria-label="Quantum settlement ${p.slot+1}, location ${bit?'B':'A'}, ${Math.round(prob*100)} percent">
<circle cx="${n.x}" cy="${n.y}" r="17" class="ghost-well"/>
<circle cx="${n.x}" cy="${n.y}" r="17" class="ghost-arc ${anim?'shift':''}" transform="rotate(-90 ${n.x} ${n.y})" style="stroke-dasharray:${arc(prob)};--from:${arc(from??prob)};--to:${arc(prob)}"/>
<g class="ghost-body ${anim?'shift':''}" style="opacity:${o.toFixed(3)};--o-from:${o0.toFixed(3)};--o-to:${o.toFixed(3)}">${piece(n.x,n.y,p.owner,1,true)}</g>
<g class="ghost-tag"><rect x="${n.x-19}" y="${n.y-40}" width="38" height="16" rx="8"/><text x="${n.x}" y="${n.y-28.5}" text-anchor="middle">Q${p.slot+1}·${bit?'B':'A'}</text></g>
<text x="${n.x}" y="${n.y+33}" text-anchor="middle" class="ghost-prob">${Math.round(prob*100)}%</text></g>`;
}
export function boardSVG(game,mode,first=null,selectedQ=null,fx={}){
 const {tiles,nodes,edges,ports}=game.board;
 const setup=game.phase==='setup-settlement',road=game.phase==='setup-road'||mode==='road',settlement=setup||mode==='settlement',city=mode==='city',quantum=mode==='quantum',robber=game.phase==='robber';
 const candidates=quantum?game.quantumCandidates(first):mode==='split'?game.splitCandidates(first):[];
 const tileSVG=tiles.map(t=>{
  const total=game.dice?.reduce((a,b)=>a+b),producing=total===t.number&&game.robber!==t.id&&total!==7;
  const pts=t.nodes.map(id=>`${nodes[id].x},${nodes[id].y}`).join(' ');
  return `<g class="hex ${robber&&t.id!==game.robber?'clickable':''} ${producing?'producing':''} ${producing&&fx.fresh?'fresh':''}" ${robber&&t.id!==game.robber?`data-tile="${t.id}" tabindex="0" role="button" aria-label="Move robber to ${t.kind} ${t.number||'desert'}"`:''}><title>${t.kind==='desert'?'Desert':RESOURCES[t.kind].name+' · roll '+t.number}${game.robber===t.id?' · blocked by robber':''}</title><polygon points="${pts}" fill="${tones[t.kind]}" stroke="${producing?'#fff3b8':'#d4c8a3'}" stroke-width="${producing?5:2.5}"/>${art(t)}${t.number?`<circle cx="${t.x}" cy="${t.y+12}" r="20" fill="#f4ebd3" stroke="#645b4433" stroke-width="1.5"/><text x="${t.x}" y="${t.y+16}" text-anchor="middle" class="number ${[6,8].includes(t.number)?'red':''}">${t.number}</text><text x="${t.x}" y="${t.y+28}" text-anchor="middle" class="pips ${[6,8].includes(t.number)?'red':''}">${'•'.repeat(6-Math.abs(7-t.number))}</text>`:''}${game.robber===t.id?`<g transform="translate(${t.x+27} ${t.y+5})" class="robber"><circle cy="-13" r="7"/><path d="M-7-6h14l5 23h-24z"/></g>`:''}</g>`;
 }).join('');
 const portSVG=ports.map(p=>`<g class="port"><path d="${p.nodes.map(id=>`M${nodes[id].x} ${nodes[id].y}L${p.x} ${p.y}`).join(' ')}" stroke="#91a4a5" stroke-width="2"/><rect x="${p.x-24}" y="${p.y-14}" width="48" height="28" rx="5" fill="#243e48" stroke="#7b969c"/><text x="${p.x}" y="${p.y+5}" text-anchor="middle">${p.kind==='any'?'3:1':RESOURCES[p.kind].symbol+' 2:1'}</text><text x="${p.x}" y="${p.y+27}" text-anchor="middle" class="port-gate">${p.gate.toUpperCase()}</text></g>`).join('');
 const roadSVG=edges.map(e=>{
  const a=nodes[e.a],b=nodes[e.b],legal=road&&game.legalRoad(e.id,game.phase==='setup-road'),exists=e.owner!==null;
  if(!exists&&!legal)return '';
  return `<g ${legal?`class="road-target" data-edge="${e.id}" role="button" tabindex="0" aria-label="Build road ${e.id+1}"`:''}><path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="${exists?'#233138':'#f7e8be'}" stroke-width="${exists?11:8}" stroke-linecap="round" ${exists?'':'stroke-dasharray="8 7"'}/>${exists?`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="${COLORS[e.owner]}" stroke-width="7" stroke-linecap="round"/>`:`<path d="M${a.x} ${a.y}L${b.x} ${b.y}" stroke="transparent" stroke-width="25"/><circle cx="${(a.x+b.x)/2}" cy="${(a.y+b.y)/2}" r="14" fill="transparent"/>`}</g>`;
 }).join('');
 const nodeSVG=nodes.map(n=>{
  const legal=(settlement&&game.legalSettlement(n.id,setup))||(city&&game.legalCity(n.id))||((quantum||mode==='split')&&candidates.includes(n.id));
  const settled=fx.fresh&&game.resolved?.some(r=>r.kept===n.id);
  return `${n.owner!==null?(settled?`<g class="settle">${piece(n.x,n.y,n.owner,n.level)}</g>`:piece(n.x,n.y,n.owner,n.level)):''}${first===n.id?`<circle cx="${n.x}" cy="${n.y}" r="16" fill="none" stroke="#fff1a8" stroke-width="3"/>`:''}${legal?`<g class="node-target" data-node="${n.id}" role="button" tabindex="0" aria-label="${city?'Upgrade city':mode==='split'?'Split location':quantum?'Quantum location':'Build settlement'} ${n.id+1}"><circle cx="${n.x}" cy="${n.y}" r="12" fill="#fcf5dc" stroke="#243d47" stroke-width="3"/><path d="M${n.x-4} ${n.y}h8m-4-4v8" stroke="#243d47" stroke-width="1.5"/></g>`:''}`;
 }).join('');
 const mid=p=>{const a=nodes[p.sites[0]],b=nodes[p.sites[1]];return {a,b,x:(a.x+b.x)/2,y:(a.y+b.y)/2};};
 const threads=game.pending.map(p=>{const {a,b,x,y}=mid(p);return `<path class="quantum-thread ${p.slot===selectedQ?'selected':''}" d="M${a.x} ${a.y}Q${x+25} ${y-25} ${b.x} ${b.y}"/>`;}).join('');
 const links=game.pending.flatMap((p,i)=>game.pending.slice(i+1).filter(q=>game.quantum.pairCorrelation(p.slot,q.slot)>1e-8).map(q=>{
  const m=mid(p),k=mid(q);
  return `<path class="correlation-thread ${[p.slot,q.slot].includes(selectedQ)?'selected':''}" d="M${m.x} ${m.y}Q${(m.x+k.x)/2} ${Math.min(m.y,k.y)-40} ${k.x} ${k.y}"><title>Q${p.slot+1} and Q${q.slot+1} have correlated states</title></path>`;
 })).join('');
 const ghosts=game.pending.map(p=>p.sites.map((id,bit)=>{
  const m=game.quantum.marginal(p.slot),prob=bit?m:1-m,before=fx.prev?.get(p.slot);
  return ghost(nodes[id],p,bit,prob,selectedQ===p.slot,before===undefined?undefined:bit?before:1-before);
 }).join('')).join('');
 const total=game.dice?.reduce((a,b)=>a+b);
 const chips=game.dice&&total!==7&&!['roll','discard','robber'].includes(game.phase)?tiles.filter(t=>t.number===total&&t.id!==game.robber).flatMap(t=>t.nodes.filter(id=>nodes[id].owner!==null).map(id=>{
  const n=nodes[id],x=n.x+(t.x-n.x)*.42,y=n.y+(t.y-n.y)*.42;
  return `<g class="yield ${fx.fresh?'fresh':''}" style="--d:${(fx.fresh?.55:0)+(t.id%5)*.06}s"><rect x="${x-19}" y="${y-11}" width="38" height="22" rx="11" fill="${COLORS[n.owner]}"/><text x="${x-4}" y="${y+5}" text-anchor="middle">+${n.level}</text><text x="${x+9}" y="${y+5}" text-anchor="middle" class="yield-icon">${RESOURCES[t.kind].symbol}</text></g>`;
 })).join(''):'';
 const collapse=fx.fresh&&game.resolved?game.resolved.map((r,i)=>{
  const k=nodes[r.kept],l=nodes[r.lost];
  return `<g class="collapse" style="--d:${i*.12}s"><path class="collapse-thread" d="M${k.x} ${k.y}L${l.x} ${l.y}"/><g class="collapse-lost">${piece(l.x,l.y,r.owner,1,true)}</g><circle class="collapse-ring lost" cx="${l.x}" cy="${l.y}" r="17"/><circle class="collapse-ring kept" cx="${k.x}" cy="${k.y}" r="17"/><circle class="collapse-ring kept late" cx="${k.x}" cy="${k.y}" r="17"/></g>`;
 }).join(''):'';
 return `<svg viewBox="0 0 760 620" class="game-board" role="group" aria-label="Island with numbered resource hexes, roads, settlements and ports">${portSVG}${tileSVG}${roadSVG}${threads}${links}${nodeSVG}${ghosts}${collapse}${chips}</svg>`;
}

