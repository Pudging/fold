// Tiny complex linear algebra for animating gates as continuous unitaries.
// U(t) = e^{iπt/2}(cos(πt/2) I − i sin(πt/2) G) for Hermitian involutory G, so U(1) = G exactly.
export type Cx = [number, number];
export type Vec = Cx[];

const mul = (a: Cx, b: Cx): Cx => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const add = (a: Cx, b: Cx): Cx => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Cx, s: number): Cx => [a[0] * s, a[1] * s];

type Gate = { name: "h" | "z" | "x" | "cz"; target: number; control?: number };

function applyGate(v: Vec, g: Gate): Vec {
  const out = v.map((c) => [...c] as Cx);
  const n = v.length;
  const m = 1 << g.target;
  for (let i = 0; i < n; i++) {
    if (i & m) continue;
    const j = i | m;
    if (g.name === "h") {
      const k = Math.SQRT1_2;
      out[i] = scale(add(v[i], v[j]), k);
      out[j] = scale(add(v[i], scale(v[j], -1)), k);
    } else if (g.name === "z") {
      out[j] = scale(v[j], -1);
    } else if (g.name === "x") {
      out[i] = v[j]; out[j] = v[i];
    } else if (g.name === "cz") {
      if (j & (1 << (g.control as number))) out[j] = scale(v[j], -1);
    }
  }
  return out;
}

export function partial(v: Vec, g: Gate, t: number): Vec {
  if (t <= 0) return v;
  if (t >= 1) return applyGate(v, g);
  const gv = applyGate(v, g);
  const c = Math.cos((Math.PI * t) / 2), s = Math.sin((Math.PI * t) / 2);
  const ph: Cx = [Math.cos((Math.PI * t) / 2), Math.sin((Math.PI * t) / 2)];
  return v.map((a, i) => mul(ph, add(scale(a, c), mul([0, -s], gv[i]))));
}

export type Step = { f0: number; f1: number; gate: Gate };

export function evolve(start: Vec, steps: Step[], frame: number, ease: (x: number) => number = (x) => x): Vec {
  let v = start;
  for (const s of steps) {
    const t = Math.max(0, Math.min(1, (frame - s.f0) / (s.f1 - s.f0)));
    if (t <= 0) break;
    v = partial(v, s.gate, ease(t));
  }
  return v;
}

export const bloch = (v: Vec): [number, number, number] => {
  const [a, b] = v;
  const ab: Cx = mul([a[0], -a[1]], b);
  return [2 * ab[0], 2 * ab[1], a[0] ** 2 + a[1] ** 2 - (b[0] ** 2 + b[1] ** 2)];
};

export const mag = (c: Cx) => Math.hypot(c[0], c[1]);
export const arg = (c: Cx) => Math.atan2(c[1], c[0]);
export const PLUS: Vec = [[Math.SQRT1_2, 0], [Math.SQRT1_2, 0]];
export const PLUSPLUS: Vec = [[0.5, 0], [0.5, 0], [0.5, 0], [0.5, 0]];
