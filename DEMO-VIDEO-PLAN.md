# Fold — 90-second demo script and edit plan

> Submission correction, October 11: official Qollab rules require a public **2–3 minute** demo. The short cuts below are promotional alternatives, not compliant submission lengths. Current `video/src/Fold.tsx` defines a 148-second film; the existing MP4 is an older 106-second render. Render and inspect the current film, then host a sign-in-free public link. See `submissions/README.md` and `submissions/VALIDATION.md`.

**Format:** proposed 90-second, 16:9 submission demo. Two people at one computer, one readable screen recording, short live reactions. Gameplay supplies the visual interest. Working title: **One settlement. Two places.**

## Script / timeline

| Time | Picture and edit | Spoken audio |
| --- | --- | --- |
| 0:00–0:07 | Open directly on the board: selected settlement, ghost A and ghost B both visible. Cut to a tight two-shot of the players looking at the same screen. | **Player 2:** “Wait. Which one is your settlement?” **Player 1:** “Both.” **Player 2:** “That feels illegal.” |
| 0:07–0:18 | Return to a clean full-board view. Three quick, readable moments: build a road; accept a player trade; upgrade a settlement to a city. Keep the actual resource deductions visible. Small title: **FOLD**. | **Narrator:** “This is Fold: a quantum twist on Catan. Build roads, trade resources, upgrade cities, and race to ten points.” |
| 0:18–0:31 | Select an existing settlement, click Split, then choose its second legal site. Hold the resulting two ghosts and their 50/50 probabilities. A single overlay: **1 settlement · 2 possible locations**. | **Narrator:** “Spend one ore to split a settlement between two legal sites. It still counts as one building and one point. Where it survives decides what it can produce.” |
| 0:31–0:49 | Controlled comparison, explicitly labeled **Same starting state · two test takes**. First take: fresh equal superposition → H → A 100%. Second take: same preparation → Z → a later own turn → H → B 100%. Brief **Next own turn** label at the cut. Show both candidate sites throughout; crop controls into an inset if needed. | **Narrator:** “Here’s why this is more than a coin flip. From the same starting state, interference sends the settlement to A. Change its phase first, then interfere, and it goes to B. The phase changes the result.” |
| 0:49–1:01 | Separate genuine match clip: two pending settlements → select one → Link/CZ → show the calculated correlation connection and entangled status. Keep each settlement’s location pair identifiable. Overlay: **Shared quantum state**. | **Narrator:** “Settlements can also become entangled. Their joint outcomes are connected—even when the individual odds still read fifty-fifty.” |
| 1:01–1:16 | Actual qualifying roll: dice → producing tile → ghosts collapse → resource count changes. Let the game animation play without a cut through measurement. Cut to the players reacting to the outcome they actually got. | **Narrator:** “When a tile touching either location produces, the shared state is measured. One location survives for each settlement, and production follows the surviving board.” **Player 2, if Player 1 benefits:** “Okay. I’m putting the robber there.” |
| 1:16–1:25 | Open ψ. Show the circuit and state, then the exported Qiskit code. Use a short close crop instead of scrolling through an entire file. Overlay: **8-qubit statevector · Qiskit-validated**. | **Narrator:** “Underneath, it’s an eight-qubit statevector with real quantum gates. The circuits export to Qiskit, and we checked the simulation against Qiskit locally.” |
| 1:25–1:30 | Back to the two players. One clicks End turn; the other reaches for the mouse. Finish on the playable board with a small Fold title and the verified submission link, once available. | **Player 1:** “Your turn.” **Player 2:** “Give me the ore.” |

The spoken lines are a starting script. Keep natural pauses and genuine reactions; shorten the narration if the players' exchange is better. Do not add a high-five unless the real moment earns it.

## Capture plan

Record these clips before assembling the edit:

1. **People:** one locked landscape two-shot of both players at the same computer. Record the opening, closing, and real reactions. Faces need about 15 seconds of the final cut; the board carries the rest.
2. **Catan foundation:** a legal road purchase, accepted trade, city upgrade, and visible scores. Record enough lead-in to see which player acted and what they paid.
3. **Split:** an existing level-one settlement, one ore available, and a second distance-legal site connected to that player's roads. Capture the click, cost, second-site selection, and unchanged victory points.
4. **Interference A:** from a newly prepared equal-superposition settlement, wait until a later own turn and apply H. Record A becoming certain.
5. **Interference B:** from the same reproducible preparation in a separate take, apply Z on a later own turn, then H on another own turn. Record B becoming certain. Keep the original continuous recordings as evidence; trim waiting turns with explicit turn labels.
6. **Entanglement:** prepare two independent pending settlements in equal superposition and apply CZ on a permitted later turn. Capture the resulting status and correlation line. CZ need not change either individual 50/50 display.
7. **Harvest:** capture an actual roll touching a pending location, the joint collapse, and resulting resource cards. Use the players' reaction to that result.
8. **Technical proof:** ψ inspector, readable gate sequence, exported Python. Only add an IonQ/Qollab result if a real successful backend run has been captured.

The quantum clips need preparation: a relevant production roll or robber contact can resolve pending settlements before the planned gate sequence. If that happens, prepare another take. Never edit Z and H to look like two actions in one turn. If using tutorial supplies, label the clip **Practice match**; use a normal match for the main competitive sequence.

For the A/B comparison, use identical legal checkpoints if available. Otherwise label it **Circuit demonstration** and demonstrate the two sequences in the inspector/Qiskit rather than pretending they came from identical gameplay. Do not silently add an unimplemented checkpoint or replay feature to the shoot plan.

## Edit decisions

- **Screen composition:** record a dedicated 16:9 browser window at 1920×1080 or higher. Hide browser chrome if convenient. Frame the board, current player, resources and action controls; remove unrelated desktop content. Check readability at 1080p before the shoot.
- **Cuts:** mostly hard cuts. J-cut the players' voices over gameplay. Use at most one short push-in per important action, roughly 1.2×; keep both ghost sites visible when discussing superposition. No glitch effects, particle backgrounds, or floating equations.
- **Overlays:** use the game's player colors and one plain sans-serif. Maximum one short explanatory overlay at a time. Include A/B and 100% in the comparison. Keep overlays away from costs, probabilities, dice and resource counts. Instructions belong in this demonstration only where the shot needs them.
- **Comparison:** use matched full-frame takes or two large crops; do not squeeze two unreadable full interfaces side by side. A small **H → A** / **Z then H → B** label is enough. The two takes are an editorial comparison, not two physical timelines.
- **Audio:** capture players and narration in a quiet room; clap once if screen and camera audio need synchronization. Keep game clicks and a little room sound. Optional instrumental music stays low under speech and dips further for the measurement/reaction. No trailer booms. Proposed final mix target: about −14 LUFS integrated, true peak no higher than −1 dBTP.
- **Export:** proposed H.264 MP4, 1920×1080, 30 fps, AAC audio. Use the same frame rate for face-camera capture if possible. Review the actual export on a laptop and phone, checking small UI text, speech clarity and the full measurement sequence.

## Claims and recording checks

The browser performs live simulation locally. Qollab backend verification is a separate sampled job; it does not drive live gameplay. An authenticated Qollab/IonQ run remains unverified. The current video should say **Qiskit-validated**, not **running live on IonQ**. Once the team obtains a real backend result, replace the technical shot with that result and accurately identify it as simulator verification.

Before locking the edit, confirm:

- Viewers can recognize roads, trading, resources and the ten-point goal before the quantum explanation.
- One settlement remains one building and one point while occupying two possible sites.
- H versus Z-then-H is shown from a known equal-superposition preparation, with turn timing represented honestly.
- The CZ shot demonstrates entanglement without claiming immediate changes to local odds or controllable remote outcomes.
- The actual joint measurement and card change are visible in one continuous shot.
- Every feature shown exists in the build; no network multiplayer, quantum advantage or physical time travel claims.
- The end link opens the actual published project. This document is a script and edit plan; no footage or video export has been produced yet.

## If the submission limit is 60 seconds

Keep the opening (5s), classical foundation (7s), split (10s), A/B interference comparison (17s), measurement and reaction (13s), technical proof/end (8s). Omit the entanglement segment rather than rushing both explanations. Check the organizer's actual video limit before final export.
