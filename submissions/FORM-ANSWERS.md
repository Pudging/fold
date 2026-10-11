# Paste-ready submission answers

Prepared October 11, 2026. These are reusable answers, **not a claim to have inspected the unknown second form's fields**. Use only the lengths/fields that actually appear.

## Identity and links

| Field | Answer / action |
| --- | --- |
| Project title | Fold — Quantum Settlers |
| Theme | Quantum Playground |
| Node | Georgia Tech |
| License | MIT |
| Team name | PENDING: registered team name |
| Captain and members | PENDING: names and Qollab usernames |
| Student/professional track | PENDING: match existing registration |
| Published Qollab project URL | PENDING: actual public default-version URL |
| GitHub URL | https://github.com/Pudging/fold |
| Project website | https://fold-kgveritrade.vercel.app — public browser game; Qollab backend verification is separate |
| Demo URL | PENDING: public 2–3 minute video, no sign-in |
| Second form URL | PENDING: supply link from organizer announcement |

## One-line pitch

A Catan-style game where settlements occupy two locations, players manipulate phase and entanglement, and production measures which board survives.

## Short abstract

Fold brings real quantum mechanics into a familiar resource-and-building game. Players build roads, trade resources and race to ten points, while quantum settlements occupy two legal locations as one building. H, Z, CZ and gate-port X/CX actions manipulate an eight-qubit shared state. Phase changes future interference; entanglement changes joint outcomes. Resource production measures the register before awarding cards at surviving locations. The game includes local 2–4 player play, guided practice, circuit inspection and Qiskit export.

## What makes it novel / beyond a tutorial?

The contribution is integrating location-qubit settlements into a playable economy: road connectivity, settlement-spacing reservations, single-piece scoring, per-turn gate permissions, gate ports and joint measurement before production. This gives standard quantum gates strategic consequences instead of presenting an isolated circuit exercise. Indicators derive from the actual quantum state, and a phase change can alter future outcomes without changing immediate location odds.

## How is quantum essential?

From the same equal-superposition state, H makes location A certain, while Z followed by H makes B certain. A classical coin flip would not reproduce this phase-dependent response. CZ couples the shared state; later operations and joint measurement use the resulting amplitudes. Only surviving locations generate resource cards. No quantum computational advantage is claimed.

## Technical stack

Vanilla JavaScript, SVG, CSS and Vite for the game; an exact eight-qubit complex statevector; Python/Qiskit circuit reconstruction; Qollab's injected backend for sampled verification. The separate demo-video project uses React/Remotion.

## Validation

29 tests passed. Independent comparisons checked 80 seeded circuits / 2,000 gates against Qiskit amplitudes, purities and reduced pair states at 1e-12 tolerance. Python adapter checks passed on BasicSimulator. Three complete legal classical matches reached victory with resource conservation; they are not full quantum-match evidence.

## Intended impact

Fold is designed for people who understand board games but find quantum phase and entanglement abstract. Players can discover these concepts through consequential choices, then inspect the underlying circuit. Educational outcomes and competitive balance have not yet been measured.

## Challenges / limitations

Integrating joint measurement with classical production required resolving every pending settlement before awarding any resources and preserving piece/card accounting. Correlation visualization also needed reduced-state calculations rather than drawing links from gate history. Current scope is local pass-and-play; networking, saves and long human balance studies remain future work. Authenticated Qollab/IonQ validation is pending.

## Originality / AI disclosure — finalize with team

AI assistance included Codex. Earlier design work and a seasonal prototype existed before the current Catan implementation. The team must specify its actual pre-window starting point, in-window contributions, additional tools, reused code/assets and contributor roles. Do not paste an unverified statement that all work began at kickoff.

## Suggested release notes

Initial hackathon release: local 2–4 player Catan-style game, quantum settlements and splitting, phase/interference/link actions, gate ports, joint production measurement, guided practice, state inspection and Qiskit export.

## Required support attribution

This effort is supported by Qollab & IonQ
