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
| Qollab file limits | PASS locally | 13 upload files; largest 449,265 bytes, below 2 MB; no video/environment included |
| Authenticated Qollab built-in simulator | NOT VERIFIED | Must test the uploaded runtime and bridge |
| Authenticated Qollab IonQ simulator | NOT VERIFIED | Local Python success does not prove browser/provider integration |
| Public project / video / repo access | NOT VERIFIED | Links not supplied yet; no Git remote configured |

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
