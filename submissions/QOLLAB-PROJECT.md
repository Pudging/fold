# Fold — one settlement, two possible locations

Fold is a local 2–4 player Catan-style game where quantum mechanics changes the board you build. Spend ore to split a settlement across two legal locations, change its phase, interfere its amplitudes, or link it with another player's settlement. Production measures the shared state and decides which locations survive.

**Theme:** Quantum Playground.
**License:** MIT.
**Demo video:** Link forthcoming.
**Source repository:** https://github.com/Pudging/fold
**Play online:** https://fold-kgveritrade.vercel.app
**Contributors:** Kevin Gao (@pudging), Nash Pillai, and @dguo.

![Actual gameplay: a selected settlement occupies sites A and B with 50/50 probabilities.](https://pub.qollab.xyz/assets/01a12ced-d85d-7d22-8e06-371555d75c81@292)

## What the game explores

Quantum phase is difficult to understand when probabilities look unchanged. Fold makes that distinction playable: a location phase shift changes how a later interference action resolves a building. Entanglement turns independently placed settlements into a shared state. Measurement has an economic consequence, because only surviving sites produce resources.

The ordinary game remains recognizable: roads, resource production, accepted player trades, ports, cities, development cards, robber, longest road, largest army and a ten-point goal.

## Why quantum is essential

A new location qubit starts in |+⟩. Applying H selects A with probability one. Applying Z first and then H selects B with probability one, despite identical starting location odds. This is phase-dependent interference rather than a random-location generator.

CZ can entangle two pending settlements without changing their immediate individual 50/50 odds. Correlation indicators come from reduced density matrices. Producing terrain touching either candidate triggers one joint measurement before resources are awarded. See [the mathematical model](https://github.com/Pudging/fold/blob/main/docs/QUANTUM.md).

## How to run and play

1. Choose a free simulator in Qollab and press Run.
2. Use **Learn by playing** for guided practice, or enter 2–4 player names and start a normal local match.
3. Place two settlements and roads in snake order; roll, trade and build.
4. For the quantum mechanic, extend roads to a second legal site and split a level-one settlement for one ore, or buy a new quantum settlement for the ordinary settlement cost plus ore.
5. Starting on a later turn, select your pending settlement and use H, Z or CZ; definite gate-port buildings unlock X/CX.
6. Let a relevant production roll resolve the pending register and inspect the actual resource result.
7. Open **ψ** to inspect/export the circuit and request one 1,024-shot backend verification job.

This is pass-and-play on a shared screen. Practice grants extra supplies and is labeled; it is separate from the real match.

The public Vercel site runs the same browser game without signing in and supports local simulation and Qiskit circuit export. The backend verification button is available only inside Qollab. The website does not replace the required published Qollab project.

## Technical execution and reproduction

The browser uses an exact eight-qubit statevector. JavaScript handles the board/economy; Python reconstructs gate logs as Qiskit circuits. Qollab supplies the selected backend. Live gameplay remains local; verification compares backend counts against the captured ideal distribution and does not control gameplay.

Local checks on October 11 passed 29 tests, 80 circuit comparisons / 2,000 gates at 1e-12 tolerance, and three legal classical games through ten-point victory with resource conservation. Those complete-game runs used no quantum builds; quantum rules have separate unit coverage.

Qollab built-in simulator verification passed on October 11: 1,024 shots for an eight-qubit circuit with H on the split settlement, with total-variation distance 0.0098 from the ideal distribution. Free IonQ Aria 1 and Forte 1 simulator attempts failed at the provider network request with “Failed to fetch”; IonQ counts are not yet verified. See [architecture and reproduction](https://github.com/Pudging/fold/blob/main/docs/ARCHITECTURE.md).

## Original contribution and intended impact

Fold integrates quantum location states with settlement legality, piece limits, roads, turn permissions and finite resource production. Players encounter phase, interference and entanglement as consequential decisions on a familiar board. The intended educational value is learning through play; user-study evidence and competitive balance are future work.

This is an independent prototype, not an official CATAN product. It uses original SVG terrain, and claims neither physical time travel nor quantum computational advantage. Two-player play is a house variant; networking and saved matches are not implemented.

## Attribution and provenance

This effort is supported by Qollab & IonQ

Original code and documentation are MIT. AI-assisted development and prior prototype work are disclosed in [attribution and development history](https://github.com/Pudging/fold/blob/main/docs/ATTRIBUTION.md). The team must finalize the exact build-window boundary and contributor details before submitting.
