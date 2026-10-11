import { SITES, RESOURCES } from './game.js';

const kinds = ['ore','wood','wool','wood','wheat','ore','wheat','brick','wool','wheat','wood','wool','brick','wheat','wool','ore','ore','wood','brick'];
export const TILES = [];
for (let r=-2;r<=2;r++) for(let q=Math.max(-2,-r-2);q<=Math.min(2,-r+2);q++) {
  TILES.push({ x: 470 + Math.sqrt(3)*78*(q+r/2), y: 296 + 117*r*.76, kind:kinds[TILES.length], index:TILES.length });
}
const tones = {
  wood: ['#b8c5a0','#819573'], brick:['#dfae94','#b87861'], wheat:['#e6d29d','#c6a66a'],
  wool:['#d5dcb5','#a0af8b'], ore:['#c3ccd0','#8e9fa7'],
};
function points(cx,cy,r,offset=0) {
  return Array.from({length:6},(_,i)=>{const a=(60*i-30)*Math.PI/180;return `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r*.76+offset}`;}).join(' ');
}
function tree(x,y,s=1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 4v-30" stroke="#485b42" stroke-width="2"/><path d="M-13-9L0-36 13-9z" fill="#627d54" stroke="#3f593f" stroke-width="1.2"/><path d="M-16 0L0-27 16 0z" fill="#6e8960" stroke="#3f593f" stroke-width="1.2"/><path d="M0-23v20" stroke="#9bab7c" stroke-width="1"/></g>`;
}
function mountain(x,y,s=1) {
  return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-30 12L-2-38 32 12z" fill="#879a9e" stroke="#596d73" stroke-width="1.3"/><path d="M-2-38L7 12H32z" fill="#a8b7b6"/><path d="M-2-38L-13-18-4-21 1-13 6-23 14-14z" fill="#f3eee0"/><path d="M-17 6l4-12m12 12l-4-18" stroke="#637c7f" stroke-width="1"/></g>`;
}
function illustration(tile) {
  const {x,y,kind,index}=tile;
  const shift=(index%3-1)*3;
  let shape='';
  if(kind==='wood') shape=tree(-24,-7,.77)+tree(13,-13,1)+tree(-8,13,1.05)+tree(30,13,.68);
  if(kind==='ore') shape=mountain(-16,0,.88)+mountain(16,12,.72);
  if(kind==='wheat') {
    shape='<path d="M-41 9l58-28 29 17-58 28z" fill="#d7b65f" stroke="#9c813e"/>';
    for(let i=0;i<7;i++) shape+=`<path d="M${-33+i*8} ${12-i*3.8}l21 11" stroke="#f2dea0" stroke-width="3"/>`;
    shape+='<path d="M-26-3v-22m-5 8l5 4 5-7m-10-4l5 4 5-6" stroke="#9b7930" stroke-width="1.5" fill="none"/>';
  }
  if(kind==='brick') {
    for(let i=0;i<3;i++) shape+=`<path d="M${-33+i*16} ${8-i*8}l32-13 14 9-32 13z" fill="#b6775b" stroke="#925c47"/><path d="M${-33+i*16} ${8-i*8}v8l14 9v-8z" fill="#c8896b" stroke="#925c47"/><path d="M${-19+i*16} ${17-i*8}l32-13v8l-32 13z" fill="#aa694e" stroke="#925c47"/>`;
  }
  if(kind==='wool') {
    shape='<path d="M-40 9q19-19 36-4t40-2M-30 16q19-10 36-2" stroke="#9aab80" fill="none"/>';
    for(const [sx,sy] of [[-15,-10],[20,7]]) shape+=`<g transform="translate(${sx} ${sy})"><path d="M-7 5v5m10-5v5" stroke="#5d6750" stroke-width="2"/><ellipse cx="0" cy="0" rx="12" ry="8" fill="#f7f2dc" stroke="#8c9278"/><ellipse cx="10" cy="0" rx="4" ry="5" fill="#59634c"/></g>`;
  }
  return `<g class="terrain-art" transform="translate(${x+shift} ${y-2})">${shape}</g>`;
}
export function house(x,y,letter,filled=true,small=false) {
  return `<g transform="translate(${x} ${y}) scale(${small?.65:1})" class="house"><path d="M-12 0v-17l12-10 12 10V0z" fill="${filled?'#fcf5df':'#f5efe0'}" stroke="#314c43" stroke-width="2"/><path d="M-16-16L0-30 16-16" fill="none" stroke="#314c43" stroke-width="3" stroke-linecap="round"/><path d="M-3 0v-11h6V0" fill="#668276"/><path d="M8-25v-8h4v12" fill="#b86b4b" stroke="#314c43" stroke-width="1.5"/>${small?'':`<circle cx="19" cy="-31" r="10" fill="#314c43"/><text x="19" y="-27" text-anchor="middle" fill="#fff7df" font-size="11" font-family="Manrope,sans-serif" font-weight="700">${letter}</text>`}</g>`;
}
const location = (q,bit) => { const tile=TILES[SITES[q].tiles[bit]];return {x:tile.x,y:tile.y+32}; };
export function islandMarkup(state, selected, focusBasis=null, miniature=false, offset=0, quiet=false) {
  const probabilities=state.probabilities();
  const defs=`<defs><pattern id="paper-lines" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-25)"><path d="M0 0v6" stroke="#665d46" stroke-opacity=".07" stroke-width="1"/></pattern><filter id="island-shadow" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="7" flood-color="#68604a" flood-opacity=".13"/></filter></defs>`;
  const land=TILES.map(t=>{
    const [top,side]=tones[t.kind];
    return `<g class="tile"><polygon points="${points(t.x,t.y,74,12)}" fill="${side}" stroke="#727767" stroke-width=".8"/><polygon points="${points(t.x,t.y,74)}" fill="${top}" stroke="#f8f1dc" stroke-width="2.5"/><polygon points="${points(t.x,t.y,74)}" fill="url(#paper-lines)"/>${miniature?'':illustration(t)}</g>`;
  }).join('');
  const routes=quiet?'':SITES.filter((_,q)=>q===selected).map((s)=>{
    const q=selected;
    const a=location(q,0), b=location(q,1);
    return `<path class="choice-path ${q===selected?'selected':''}" d="M${a.x} ${a.y+8} Q${(a.x+b.x)/2+25} ${(a.y+b.y)/2+30} ${b.x} ${b.y+8}" fill="none" stroke="#41594b" stroke-opacity="${q===selected?.55:.24}" stroke-width="${q===selected?2.5:1.5}" stroke-dasharray="4 5"/>`;
  }).join('');
  const settlements=quiet?'':SITES.map((site,q)=>[0,1].map(bit=>{
    const p=probabilities.reduce((a,v,i)=>a+(((i>>(q+offset))&1)===bit?v:0),0);
    const pos=location(q,bit), active=focusBasis===null?p>1e-8:((focusBasis>>(q+offset))&1)===bit;
    if(focusBasis!==null&&!active)return '';
    if(q!==selected && focusBasis===null) return bit===0?`<g class="site-target" data-site="${q}" role="button" tabindex="0" aria-label="Select ${site.name}"><circle cx="${pos.x}" cy="${pos.y-8}" r="17" fill="#f8f2e1" stroke="#607460"/><text x="${pos.x}" y="${pos.y-3}" text-anchor="middle" fill="#314c43" font-family="Manrope,sans-serif" font-size="13">${site.letter}</text></g>`:'';
    if(miniature) return active?house(pos.x,pos.y,site.letter,true,true):'';
    return `<g class="site-target ${q===selected?'is-selected':''} ${active?'':'is-absent'}" data-site="${q}" role="button" tabindex="0" aria-label="Select ${site.name}, ${RESOURCES[site.options[bit]].name}, ${Math.round(p*100)} percent"><ellipse cx="${pos.x}" cy="${pos.y+5}" rx="28" ry="14" fill="${q===selected?'#f8efcc':'#f8f2e1'}" fill-opacity=".86" stroke="#476351" stroke-width="${q===selected?2:1}" stroke-dasharray="${active?'none':'3 3'}"/><g opacity="${active?1:.2}">${house(pos.x,pos.y,site.letter)}</g></g>`;
  }).join('')).join('');
  return `<svg viewBox="70 10 800 590" class="island-svg" aria-label="Island showing the selected player’s settlement locations" xmlns="http://www.w3.org/2000/svg">${defs}<g ${miniature?'':'filter="url(#island-shadow)"'}>${land}</g>${routes}${offset===3?settlements.replaceAll('#314c43','#a75c40').replaceAll('#668276','#b97b62'):settlements}</svg>`;
}
export function miniIsland(basis, players=1) {
  const tiles=TILES.map(t=>`<polygon points="${points(t.x,t.y,74)}" fill="${tones[t.kind][0]}" stroke="#f4efdf" stroke-width="3"/>`).join('');
  const settlements=Array.from({length:players},(_,player)=>SITES.map((s,q)=>{const p=location(q,(basis>>(q+player*3))&1);return `<circle cx="${p.x+(players===2?(player?12:-12):0)}" cy="${p.y}" r="14" fill="${player?'#ae6047':'#314f42'}" stroke="#fff1ce" stroke-width="4"/>`;}).join('')).join('');
  return `<svg viewBox="100 35 750 535" aria-hidden="true">${tiles}${settlements}</svg>`;
}
