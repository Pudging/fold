# Fold — one settlement, two possible locations

Fold is a local 2–4 player Catan-style game where quantum mechanics changes the board you build. Spend ore to split a settlement across two legal locations, change its phase, interfere its amplitudes, or link it with another player's settlement. Production measures the shared state and decides which locations survive.

**Theme:** Quantum Playground.
**License:** MIT.
**Demo video:** https://youtu.be/lPDDzQZaRXU.
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

![A two-player match with roads, settlements, resource cards and the active player’s turn.](https://pub.qollab.xyz/assets/01a12cfc-7ae2-7431-857c-092fc3797263)

## How to run and play

### Quickest route to backend verification

1. In **Select QPU**, choose **IonQ Forte 1 (29q) — Noise model — Free**, then **Run**. The console stays on **Running...** while you play; it should not print **Done.** when the board appears.
2. Choose **Learn by playing** and complete the four starting settlement-and-road pairs on highlighted legal sites. Practice supplies extra resources after setup.
3. **Roll dice** (resolve discard/robber prompts if you roll seven). Build a **Road** toward a legal second settlement site. Click **Split settlement**, choose your settlement and its highlighted second location. Do not end the turn or roll again before verifying.
4. Open **ψ (Quantum inspector)** in the top bar, then press **Verify on Qollab backend**. The button shows **Running…** while one eight-qubit, 1,024-shot job runs. The inspector displays **1024 shots. Distance from the ideal distribution: ...** when it returns; only then does the console print **Done.**
5. Start a fresh Run and choose the **Built-in simulator** to repeat the check. Each Run permits one verification attempt.

### Normal play

1. Choose a free simulator in Qollab and press Run.
2. Use **Learn by playing** for guided practice, or enter 2–4 player names and start a normal local match.
3. Place two settlements and roads in snake order; roll, trade and build.
4. For the quantum mechanic, extend roads to a second legal site and split a level-one settlement for one ore, or buy a new quantum settlement for the ordinary settlement cost plus ore.
5. Starting on a later turn, select your pending settlement and use H, Z or CZ; definite gate-port buildings unlock X/CX.
6. Let a relevant production roll resolve the pending register and inspect the actual resource result.
7. Open **ψ** to inspect/export the circuit and request one 1,024-shot backend verification job.

This is pass-and-play on a shared screen. Practice grants extra supplies and is labeled; it is separate from the real match.

The public Vercel site runs the same browser game without signing in and supports local simulation and Qiskit circuit export. The backend verification button is available only inside Qollab. The website does not replace the required published Qollab project.

![Quantum inspector: a split settlement has two amplitudes of 0.707, each with 50% probability, produced by an H gate.](https://pub.qollab.xyz/assets/01a12cfc-befa-7cf1-b89c-1599c0becaef)

The inspector exposes the actual amplitudes and circuit. This screenshot uses the browser game’s local simulator; backend verification is a separate Qollab action.

## Technical execution and reproduction

The browser uses an exact eight-qubit statevector. JavaScript handles the board/economy; Python reconstructs gate logs as Qiskit circuits. Qollab supplies the selected backend. Live gameplay remains local; verification compares backend counts against the captured ideal distribution and does not control gameplay.

Local checks on October 11 passed 29 tests, 80 circuit comparisons / 2,000 gates at 1e-12 tolerance, and three legal classical games through ten-point victory with resource conservation. Those complete-game runs used no quantum builds; quantum rules have separate unit coverage.

Backend verification rechecked on **November 10, 2026** after fixing the Qollab run lifetime: **IonQ Forte 1 (29q), free noise-model simulator: 1,024 shots, total-variation distance 0.0264**; **Built-in ideal simulator: 1,024 shots, distance 0.0059**. Both used eight qubits with H on the split settlement. In both cases the console stayed on Running while the player prepared the circuit and printed Done only after verification returned. Earlier IonQ attempts had failed; the entry point now waits for verification instead of ending the run when the board loads. See [architecture and reproduction](https://github.com/Pudging/fold/blob/main/docs/ARCHITECTURE.md).

## Dependencies and environment

- **Qollab runtime:** HTML/CSS/JavaScript with Qollab’s JS/Qiskit wrapper. Python dependency: `qiskit>=2.5.2,<3.0.0`. Qollab provides the selected simulator backend.
- **Local development and build:** Node.js 22.x, npm, and Vite `^8.3.4` (`npm ci` installs the locked versions).
- **Independent quantum validation:** Python, Qiskit `2.5.2`, and NumPy `>=2,<3`, installed from `requirements-dev.txt`.
- **Browser:** JavaScript, SVG and CSS support. No database, server, API keys or environment variables are required.
- **Compute:** verified on the free IonQ Forte 1 (29q) noise-model simulator and the free built-in ideal simulator. No paid hardware is needed.

## Original contribution and intended impact

Fold integrates quantum location states with settlement legality, piece limits, roads, turn permissions and finite resource production. Players encounter phase, interference and entanglement as consequential decisions on a familiar board. The intended educational value is learning through play; user-study evidence and competitive balance are future work.

This is an independent prototype, not an official CATAN product. It uses original SVG terrain, and claims neither physical time travel nor quantum computational advantage. Two-player play is a house variant; networking and saved matches are not implemented.

## Attribution and provenance

This effort is supported by Qollab & IonQ

Original code and documentation are MIT. The only work prepared before the hackathon consisted of a picture illustrating a quantum Catan idea and a project name, drafted approximately 20 minutes before the October 9, 2026, 7 PM Eastern start: approximately **October 9, 2026, 6:40 PM Eastern**. This was a concept image and name, rather than a playable software prototype.

David Guo led the mathematics, ideas and conceptual work. Kevin Gao and Nash Pillai wrote the project implementation. See [attribution and development history](https://github.com/Pudging/fold/blob/main/docs/ATTRIBUTION.md) for sources and dependencies.
