import { preparedState } from './quantum.js';

export const RESOURCES = {
  wood: { name: 'Timber', color: '#476849', short: 'T' },
  brick: { name: 'Clay', color: '#ae6047', short: 'C' },
  wheat: { name: 'Grain', color: '#ac822e', short: 'G' },
  wool: { name: 'Wool', color: '#6e8160', short: 'W' },
  ore: { name: 'Stone', color: '#667782', short: 'S' },
};
export const SITES = [
  { name: 'West reach', letter: 'A', options: ['wood', 'brick'], tiles: [3, 7] },
  { name: 'East reach', letter: 'B', options: ['wheat', 'wool'], tiles: [6, 11] },
  { name: 'South reach', letter: 'C', options: ['ore', 'wood'], tiles: [15, 17] },
];
export const CONTRACTS = [1, 6, 3, 5];
export function yieldsFor(basis) { return SITES.map((site, i) => site.options[(basis >> i) & 1]); }
export function matching(basis, target) { return SITES.reduce((n, _, i) => n + (((basis >> i) & 1) === ((target >> i) & 1) ? 1 : 0), 0); }
export class Game {
  constructor() { this.reset(); }
  reset() {
    this.round = 0; this.score = 0; this.bank = Object.fromEntries(Object.keys(RESOURCES).map(key => [key, 0]));
    this.harvests = []; this.startRound();
  }
  startRound() {
    this.state = preparedState(); this.history = []; this.moves = 4; this.resolved = false; this.outcome = null;
    this.message = 'Three settlements. Eight possible islands. Choose a reach to shape its future.';
  }
  get target() { return CONTRACTS[this.round]; }
  get complete() { return this.resolved && this.round === CONTRACTS.length - 1; }
  act(gate, target, control) {
    if (this.resolved || this.moves === 0) return false;
    const previous = this.state.clone();
    this.state.apply(gate, target, control);
    this.history.push(previous); this.moves--;
    return true;
  }
  undo() {
    if (this.resolved || this.history.length === 0) return false;
    this.state = this.history.pop(); this.moves++; return true;
  }
  harvest(random) {
    if (this.resolved) return null;
    this.lastCircuit = this.state.operations.map(op => ({ ...op }));
    this.lastProbabilities = this.state.probabilities();
    this.outcome = this.state.measure(random); this.resolved = true;
    const resources = yieldsFor(this.outcome);
    resources.forEach(key => this.bank[key]++);
    const matches = matching(this.outcome, this.target), points = matches + (matches === 3 ? 2 : 0);
    this.score += points;
    const result = { round: this.round, outcome: this.outcome, matches, points, resources };
    this.harvests.push(result);
    this.message = `${matches === 3 ? 'A perfect harvest.' : `${matches} of 3 orders filled.`} +${points} points. This island is now settled.`;
    return result;
  }
  next() {
    if (!this.resolved || this.complete) return false;
    this.round++; this.startRound(); return true;
  }
}
