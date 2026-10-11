export const KEYS=['wood','brick','wool','wheat','ore'];
export const RESOURCES={wood:{name:'Lumber',color:'#487548',symbol:'♠'},brick:{name:'Brick',color:'#b35d40',symbol:'▰'},wool:{name:'Wool',color:'#86a66a',symbol:'♣'},wheat:{name:'Grain',color:'#caa54d',symbol:'≋'},ore:{name:'Ore',color:'#778895',symbol:'◆'}};
export const COSTS={road:{wood:1,brick:1},settlement:{wood:1,brick:1,wool:1,wheat:1},city:{wheat:2,ore:3},development:{wool:1,wheat:1,ore:1},quantum:{wood:1,brick:1,wool:1,wheat:1,ore:1}};
export const COLORS=['#ea824b','#60b0df','#bc92dc','#e2c459'];
export const emptyHand=()=>Object.fromEntries(KEYS.map(k=>[k,0]));
export function shuffle(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeBoard(random=Math.random){
 const kinds=shuffle(['wood','wood','wood','wood','brick','brick','brick','wool','wool','wool','wool','wheat','wheat','wheat','wheat','ore','ore','ore','desert'],random);
 const tiles=[],nodes=[],edges=[],nodeMap=new Map(),edgeMap=new Map(),R=61;
 for(let r=-2;r<=2;r++)for(let q=Math.max(-2,-r-2);q<=Math.min(2,-r+2);q++){
  const tile={id:tiles.length,x:380+Math.sqrt(3)*R*(q+r/2),y:310+1.5*R*r,kind:kinds[tiles.length],nodes:[],number:0};
  for(let i=0;i<6;i++){
   const a=(60*i-30)*Math.PI/180,x=tile.x+R*Math.cos(a),y=tile.y+R*Math.sin(a),key=`${x.toFixed(2)},${y.toFixed(2)}`;
   let id=nodeMap.get(key);
   if(id===undefined){id=nodes.length;nodeMap.set(key,id);nodes.push({id,x,y,tiles:[],edges:[],neighbors:[],owner:null,level:0});}
   nodes[id].tiles.push(tile.id);tile.nodes.push(id);
  }
  for(let i=0;i<6;i++){
   const a=tile.nodes[i],b=tile.nodes[(i+1)%6],key=[a,b].sort((x,y)=>x-y).join(',');
   let id=edgeMap.get(key);
   if(id===undefined){id=edges.length;edgeMap.set(key,id);edges.push({id,a,b,tiles:[],owner:null});nodes[a].edges.push(id);nodes[b].edges.push(id);nodes[a].neighbors.push(b);nodes[b].neighbors.push(a);}
   edges[id].tiles.push(tile.id);
  }
  tiles.push(tile);
 }
 let values;
 for(let attempt=0;attempt<1000;attempt++){
  values=shuffle([2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12],random);
  let j=0;tiles.forEach(t=>t.number=t.kind==='desert'?0:values[j++]);
  if(!edges.some(e=>e.tiles.length===2&&e.tiles.every(id=>[6,8].includes(tiles[id].number))))break;
 }
 const boundary=edges.filter(e=>e.tiles.length===1).sort((a,b)=>{
  const angle=e=>Math.atan2((nodes[e.a].y+nodes[e.b].y)/2-310,(nodes[e.a].x+nodes[e.b].x)/2-380);
  return angle(a)-angle(b);
 });
 const portKinds=['any','wood','any','brick','wool','any','wheat','any','ore'];
 const ports=[0,3,7,10,13,17,20,23,27].map((i,id)=>{
  const e=boundary[i],x=(nodes[e.a].x+nodes[e.b].x)/2,y=(nodes[e.a].y+nodes[e.b].y)/2,dx=x-380,dy=y-310,d=Math.hypot(dx,dy);
  return {id,nodes:[e.a,e.b],kind:portKinds[id],gate:id%2?'x':'cx',x:x+dx/d*48,y:y+dy/d*48};
 });
 return {tiles,nodes,edges,ports};
}

