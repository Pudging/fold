// Little-endian basis: bit 0 = site A, bit 1 = B, bit 2 = C.
// Amplitudes are interleaved real/imaginary components; no probability pruning.
export class QuantumState {
  constructor(qubits = 3) {
    this.qubits = qubits;
    this.data = new Float64Array(2 * (1 << qubits));
    this.data[0] = 1;
    this.operations = [];
  }
  clone() {
    const result = new QuantumState(this.qubits);
    result.data.set(this.data);
    result.operations = this.operations.map(op => ({ ...op }));
    return result;
  }
  apply(gate, target, control) {
    if (!Number.isInteger(target) || target < 0 || target >= this.qubits) throw new Error('Invalid target');
    if (!['h', 'z', 's', 'x', 'cx', 'cz'].includes(gate)) throw new Error('Unknown gate');
    if (['cx', 'cz'].includes(gate) && (!Number.isInteger(control) || control < 0 || control >= this.qubits || control === target)) throw new Error('Invalid control');
    const mask = 1 << target;
    for (let i = 0; i < (1 << this.qubits); i++) {
      if (i & mask) continue;
      if (control !== undefined && !(i & (1 << control))) continue;
      const a = i * 2, b = (i | mask) * 2;
      const ar = this.data[a], ai = this.data[a + 1], br = this.data[b], bi = this.data[b + 1];
      if (gate === 'h') {
        const k = Math.SQRT1_2;
        this.data[a] = (ar + br) * k; this.data[a + 1] = (ai + bi) * k;
        this.data[b] = (ar - br) * k; this.data[b + 1] = (ai - bi) * k;
      } else if (gate === 'z' || gate === 'cz') {
        this.data[b] = -br; this.data[b + 1] = -bi;
      } else if (gate === 's') {
        this.data[b] = -bi; this.data[b + 1] = br;
      } else {
        this.data[a] = br; this.data[a + 1] = bi; this.data[b] = ar; this.data[b + 1] = ai;
      }
    }
    this.operations.push({ gate, target, ...(control === undefined ? {} : { control }) });
    return this;
  }
  probabilities() {
    return Array.from({ length: 1 << this.qubits }, (_, i) => this.data[2 * i] ** 2 + this.data[2 * i + 1] ** 2);
  }
  marginal(target) {
    return this.probabilities().reduce((p, v, i) => p + ((i & (1 << target)) ? v : 0), 0);
  }
  purity(target) {
    let p0 = 0, p1 = 0, cr = 0, ci = 0;
    for (let i = 0; i < (1 << this.qubits); i++) {
      if (i & (1 << target)) continue;
      const j = i | (1 << target), ar = this.data[2*i], ai = this.data[2*i+1], br = this.data[2*j], bi = this.data[2*j+1];
      p0 += ar*ar + ai*ai; p1 += br*br + bi*bi;
      cr += ar*br + ai*bi; ci += ai*br - ar*bi;
    }
    return Math.min(1, Math.max(0.5, p0*p0 + p1*p1 + 2*(cr*cr+ci*ci)));
  }
  bloch(target) {
    let p0 = 0, p1 = 0, cr = 0, ci = 0;
    for (let i = 0; i < (1 << this.qubits); i++) {
      if (i & (1 << target)) continue;
      const j = i | (1 << target), ar = this.data[2*i], ai = this.data[2*i+1], br = this.data[2*j], bi = this.data[2*j+1];
      p0 += ar*ar + ai*ai; p1 += br*br + bi*bi;
      cr += ar*br + ai*bi; ci += ar*bi - ai*br;
    }
    return { x: 2*cr, y: 2*ci, z: p0 - p1 };
  }
  reducedPair(a,b) {
    if(a===b||a<0||b<0||a>=this.qubits||b>=this.qubits)throw new Error('Invalid pair');
    const rho=new Float64Array(32),mask=(1<<a)|(1<<b);
    for(let base=0;base<(1<<this.qubits);base++){
      if(base&mask)continue;
      for(let i=0;i<4;i++)for(let j=0;j<4;j++){
        const x=2*(base|((i&1)<<a)|((i>>1)<<b)),y=2*(base|((j&1)<<a)|((j>>1)<<b)),k=2*(i*4+j);
        rho[k]+=this.data[x]*this.data[y]+this.data[x+1]*this.data[y+1];
        rho[k+1]+=this.data[x+1]*this.data[y]-this.data[x]*this.data[y+1];
      }
    }
    return rho;
  }
  pairCorrelation(a,b) {
    const rho=this.reducedPair(a,b),ra=new Float64Array(8),rb=new Float64Array(8);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)for(let c=0;c<2;c++){
      ra[2*(i*2+j)+c]+=rho[2*((i+2*k)*4+j+2*k)+c];
      rb[2*(i*2+j)+c]+=rho[2*((k+2*i)*4+k+2*j)+c];
    }
    let distance=0;
    for(let i=0;i<4;i++)for(let j=0;j<4;j++){
      const aIndex=2*((i&1)*2+(j&1)),bIndex=2*((i>>1)*2+(j>>1)),index=2*(i*4+j);
      const real=ra[aIndex]*rb[bIndex]-ra[aIndex+1]*rb[bIndex+1],imag=ra[aIndex]*rb[bIndex+1]+ra[aIndex+1]*rb[bIndex];
      distance+=(rho[index]-real)**2+(rho[index+1]-imag)**2;
    }
    return Math.sqrt(distance);
  }
  measure(random = Math.random) {
    const r = random();
    if (!Number.isFinite(r) || r < 0 || r >= 1) throw new Error('Random sample must be in [0, 1)');
    const probabilities = this.probabilities();
    let cumulative = 0, outcome = probabilities.length - 1;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (r < cumulative) { outcome = i; break; }
    }
    this.data.fill(0); this.data[outcome * 2] = 1;
    return outcome;
  }
  phase(index) { return Math.atan2(this.data[index*2+1], this.data[index*2]); }
}

export function preparedState(qubits = 3) {
  const state = new QuantumState(qubits);
  for (let q = 0; q < qubits; q++) state.apply('h', q);
  return state;
}

export function circuitPython(operations, shots = 1024, qubits = 3) {
  const lines = operations.map(({ gate, target, control }) => `circuit.${gate}(${control === undefined ? target : `${control}, ${target}`})`);
  return `# Fold: Qollab supplies backend from the selected device.\nfrom qiskit import QuantumCircuit\n\ncircuit = QuantumCircuit(${qubits})\n${lines.join('\n')}\ncircuit.measure_all()\njob = backend.run(circuit, shots=${shots})\ncounts = job.result().get_counts()\nprint(counts)\n# Little-endian: rightmost bit is Q1; 0 selects location A, 1 selects B.\n`;
}
