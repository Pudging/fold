import { preparedState } from './quantum.js';
import { RESOURCES, yieldsFor, matching } from './game.js';

// Each player gets two four-gate and two five-gate solo orders.
const CONTRACTS = [1, 6, 2, 5];

const newPlayer = (name, index) => ({
  name: String(name || `Player ${index + 1}`).trim().slice(0, 24) || `Player ${index + 1}`,
  score: 0,
  bank: Object.fromEntries(Object.keys(RESOURCES).map(key => [key, 0])),
});

export class Match {
  constructor(names = ['Player 1', 'Player 2']) {
    this.players = names.slice(0, 2).map(newPlayer);
    if (this.players.length !== 2) throw new Error('Two players are required');
    this.round = 0;
    this.harvests = [];
    this.startRound();
  }
  startRound() {
    this.state = preparedState(6);
    this.active = this.round % 2;
    this.remaining = [4, 4];
    this.staged = false;
    this.ready = false;
    this.resolved = false;
    this.outcome = null;
    this.previous = null;
    this.events = [];
  }
  target(player = this.active) { return CONTRACTS[this.round] ^ (player ? 7 : 0); }
  get complete() { return this.resolved && this.round === CONTRACTS.length - 1; }
  act(gate, reach) {
    if (this.staged || this.ready || this.resolved || this.remaining[this.active] <= 0) return false;
    if (!['h', 'z', 'cz'].includes(gate) || !Number.isInteger(reach) || reach < 0 || reach > 2) return false;
    const before = this.state.clone(), own = this.active * 3 + reach;
    if (gate === 'cz') this.state.apply('cz', (1 - this.active) * 3 + reach, own);
    else this.state.apply(gate, own);
    this.previous = before;
    this.remaining[this.active]--;
    this.staged = true;
    this.lastMove = { player: this.active, gate, reach };
    return true;
  }
  undo() {
    if (!this.staged || this.resolved || !this.previous) return false;
    this.state = this.previous;
    this.previous = null;
    this.remaining[this.active]++;
    this.staged = false;
    return true;
  }
  endTurn() {
    if (this.ready || this.resolved) return false;
    if (!this.staged) {
      if (this.remaining[this.active] <= 0) return false;
      this.remaining[this.active]--;
      this.lastMove = { player: this.active, gate: 'pass' };
    }
    this.events.push({ ...this.lastMove });
    this.staged = false;
    this.previous = null;
    if (this.remaining.every(n => n === 0)) this.ready = true;
    else if (this.remaining[1 - this.active] > 0) this.active = 1 - this.active;
    return true;
  }
  harvest(random) {
    if (!this.ready || this.resolved) return null;
    this.lastCircuit = this.state.operations.map(op => ({ ...op }));
    this.lastProbabilities = this.state.probabilities();
    this.outcome = this.state.measure(random);
    this.resolved = true;
    const results = this.players.map((player, index) => {
      const basis = (this.outcome >> (3 * index)) & 7;
      const resources = yieldsFor(basis);
      resources.forEach(key => player.bank[key]++);
      const matches = matching(basis, this.target(index));
      const points = matches + (matches === 3 ? 2 : 0);
      player.score += points;
      return { basis, resources, matches, points };
    });
    this.harvests.push({ round: this.round, outcome: this.outcome, results });
    return results;
  }
  next() {
    if (!this.resolved || this.complete) return false;
    this.round++;
    this.startRound();
    return true;
  }
}
