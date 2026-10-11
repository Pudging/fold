# Architecture and reproduction

## Execution paths

```text
Player action → main.js → src/catan.js → legal board/economy update
                                  └→ src/quantum.js → shared amplitudes
                                       └→ SVG ghosts/odds/correlations

ψ → captured operation log → Qollab JS/Python bridge
  → quantum/verify.py → injected Qiskit backend → counts vs ideal
```

The browser path needs no external API, database, authentication or persistent storage. The separate verification path requires a Qollab runtime and selected simulator.

## Source map

| File | Purpose |
| --- | --- |
| main.js / main.css | Match UI, tutorial, actions, tooltips, inspector |
| src/board.js | Terrain, numbers, ports and board graph |
| src/catan.js | Turn state machine, legal actions, card bank and awards |
| src/catan-board.js | Original SVG terrain and placement targets |
| src/quantum.js | Complex statevector, gates, joint measurement, reduced states |
| quantum/verify.py | Qiskit construction and backend adapter |
| scripts/package-qollab.mjs | Builds the Qollab upload files |
| scripts/verify-qiskit.mjs + verify_qiskit.py | Independent numerical comparison |
| scripts/playthrough.mjs | Complete legal classical matches |
| tests/ | Rules and mathematics tests |
| video/ | Separate Remotion demo-video project |

Historical seasonal-puzzle modules `src/game.js`, `src/match.js`, `src/island.js` are not the current app. Some tests still cover them.

## Local reproduction

Use Node 22.12+:

```sh
npm ci
npm run dev
npm test
node scripts/playthrough.mjs
npm run build
```

To independently compare against Qiskit, create a Python virtual environment and install `requirements-dev.txt`. On Windows:

```powershell
python -m venv .venv
.venv/Scripts/python.exe -m pip install -r requirements-dev.txt
node scripts/verify-qiskit.mjs
```

On macOS/Linux the script uses `.venv/bin/python` instead; create that environment with `python3 -m venv .venv`.

The verification compares all complex amplitudes, all single-qubit purities and one reduced pair per circuit against Qiskit, across 80 seeded circuits and 2,000 gates at 3/6/8 qubits. It also checks complete Python adapter calls against BasicSimulator.

## Extending Fold

Add or change a gate in both the JS simulator and Python circuit builder, then compare its complex amplitudes with Qiskit. Keep rule legality in `src/catan.js`; rejected moves must not spend cards or mutate the board. Derive visual indicators from quantum state. Keep joint collapse before production so unrealized sites cannot generate cards.

For new multiplayer/storage features, treat the current shared-device implementation as the baseline; neither networking nor saved matches currently exists.

## Accessibility and scope

The UI includes labeled controls, keyboard placement, hover/focus instructions, responsive board zoom, reduced-motion handling and textual resource names alongside color. Previous browser checks covered a 390px viewport and keyboard placement. This is not a claim of a completed WCAG conformance audit.

Two-player play is a house variant. Development actions follow rolling. Balance and long human quantum matches still need testing.
