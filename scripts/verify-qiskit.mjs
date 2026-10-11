import { spawnSync } from 'node:child_process';
import { QuantumState } from '../src/quantum.js';
let seed=913;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const cases=[];
for(let i=0;i<80;i++){
  const qubits=i<20?3:i<40?6:8, state=new QuantumState(qubits);
  for(let j=0;j<25;j++){
    const gate=['h','z','s','x','cx','cz'][Math.floor(random()*6)],target=Math.floor(random()*qubits);
    const control=(target+1+Math.floor(random()*(qubits-1)))%qubits;
    state.apply(gate,target,['cx','cz'].includes(gate)?control:undefined);
  }
  cases.push({pair:[...state.reducedPair(0,qubits-1)],qubits,operations:state.operations,amplitudes:[...state.data],purities:Array.from({length:qubits},(_,q)=>state.purity(q))});
}
const python=process.platform==='win32'?'.venv/Scripts/python.exe':'.venv/bin/python';
const run=spawnSync(python,['scripts/verify_qiskit.py'],{input:JSON.stringify(cases),encoding:'utf8'});
process.stdout.write(run.stdout||'');process.stderr.write(run.stderr||'');
if(run.error)throw run.error;
process.exit(run.status??1);
