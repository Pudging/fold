// Shared between the planner (Node) and the browser capture (injected as source).
export function makeRandom(seed) {
  let s = seed >>> 0;
  const forced = [];
  const prng = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const random = () => (forced.length ? forced.shift() : prng());
  random.force = (...values) => forced.push(...values);
  return random;
}

export const dieSample = (d) => (d - 1) / 6 + 1 / 12;
