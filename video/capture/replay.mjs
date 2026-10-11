import { Catan } from '../../src/catan.js';
import { makeRandom, dieSample } from './rng.mjs';

export function newGame(seed) {
  const random = makeRandom(seed);
  new Catan(['Player 1', 'Player 2'], random); // main.js constructs a default table at load
  const game = new Catan(['Alice', 'Bob'], random);
  return { game, random };
}

export function apply(game, random, a) {
  const ok = (() => {
    switch (a.type) {
      case 'setupSettlement': case 'settlement': return game.placeSettlement(a.node);
      case 'setupRoad': case 'road': return game.placeRoad(a.edge);
      case 'roll': random.force(dieSample(a.dice[0]), dieSample(a.dice[1])); return game.roll();
      case 'city': return game.upgrade(a.node);
      case 'split': return game.splitSettlement(a.a, a.b);
      case 'quantum': return game.buildQuantum(a.a, a.b);
      case 'gate': return game.gate(a.gate, a.slot, a.other ?? null);
      case 'trade': return game.proposeTrade(a.to, a.give, a.take) && game.respondTrade(true);
      case 'bank': return game.bankTrade(a.give, a.take);
      case 'end': return game.endTurn();
      case 'beat': return true;
      default: throw Error('unknown ' + a.type);
    }
  })();
  if (!ok) throw Error('Illegal action ' + JSON.stringify(a));
}
