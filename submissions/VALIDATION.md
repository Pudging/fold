# Validation record

Checked October 11, 2026, approximately 4:12 PM Eastern. These are local results, not evidence of a published submission.

| Check | Result | Scope |
| --- | --- | --- |
| `npm test` | PASS: 29 tests, zero failures | Current Catan rules / mathematics plus historical prototype tests |
| `node scripts/verify-qiskit.mjs` | PASS: 80 circuits / 2,000 gates | 3, 6, 8 qubits; complex amplitudes, reduced purities and pair matrices to 1e-12 |
| Python backend adapter via same script | PASS | BasicSimulator deterministic 3/6/8-qubit calls, 1,024 shots each |
| `node scripts/playthrough.mjs` | PASS | Seeds 913/42/1701; winners at 11/10/10 points after 101/139/71 turns; resource conservation |
| Full seeded quantum matches | NOT COVERED by those playthroughs | They built zero quantum settlements; separate unit tests cover quantum mechanics/integration |
| `npm run build` | PASS | Production web build and documented Qollab bundle generated successfully |
| Qollab file limits | PASS locally | Packaging checks every file against the 2 MB limit and enforces at most 100 files; no video/environment included |
| Authenticated Qollab built-in simulator | NOT VERIFIED | Must test the uploaded runtime and bridge |
| Authenticated Qollab IonQ simulator | NOT VERIFIED | Local Python success does not prove browser/provider integration |
| Public GitHub repository | PASS | https://github.com/Pudging/fold; initial GitHub Actions verification completed successfully |
| Public browser game | PASS, October 11 deployment check | https://fold-kgveritrade.vercel.app; unauthenticated HTTP 200 and browser gameplay checks below |
| Published Qollab project / public video | NOT VERIFIED | Final URLs still pending |

## Production browser verification — October 11, 2026

Vercel production deployment is Ready. An unauthenticated request returned HTTP 200 with title “Fold — Quantum Settlers”; the browser opened the game without a login prompt.

Created an Alice/Bob match and completed all eight starting placements. Both players had two settlements, two roads and two points. Rolled production, checked unaffordable build controls, ended the turn and confirmed the active player's resource hand changed. Opened the quantum inspector, checked normalization 1.00000000 and circuit export controls; backend verification was correctly unavailable outside Qollab. Entered the separate tutorial and exited back to the existing Bob turn with the match preserved. This production check did not exercise quantum construction or an authenticated backend job.

Screenshot: local `artifacts/fold-live.png`. Deployment configuration and redeployment instructions: [deployment guide](../docs/DEPLOYMENT.md). This site is a public playable demo, not proof of Qollab publication or competition entry.

## Existing demo file

Probed with the ffmpeg-skill `probe.py`:

- File: `video/out/fold-demo.mp4`
- Duration: **106.005 seconds** — does not meet the required 120–180 second submission range.
- Video: 1920×1080, 30 fps, H.264, full-range yuvj420p.
- Audio: AAC stereo, 48 kHz.
- Current source: `video/src/Fold.tsx` defines 74 bars × 60 frames / 30 fps = **148 seconds**. Source is newer than the rendered file. This is a planned duration, not a verified new export.
- No video was edited or rendered during submission preparation. Review the new export visually and audibly after rendering; the old file was only probed here.

## Previous browser evidence

Earlier work checked guided setup, road placement, accepted trade, city upgrade, local turn handoff, 390px mobile zoom/scroll, keyboard placement and settlement splitting. These were not repeated during this documentation task; they do not substitute for testing the published Qollab version.

## Release acceptance

After a fresh build, record build/upload archive results below. Keep the backend statuses above unresolved until a real successful run. Capture version name, backend label, counts, public URL and timestamp when testing Qollab. Confirm every required form has an actual submission receipt; publication alone is not a receipt.
