# Submission preparation

Checked October 11, 2026. **Source repository:** [Pudging/fold](https://github.com/Pudging/fold). Qollab publication and competition submissions are still pending.

## Verified requirements

From the [official rules](https://qollab.xyz/programs/hackathon/terms): submit by **October 11, 7 PM Eastern**; use Qiskit and free Qollab simulators including IonQ; publish a runnable MIT project with an explanatory page; provide a public, sign-in-free **2–3 minute video**; support accessibility; disclose starting code and build-window additions. Outside project repositories must be MIT. Include “This effort is supported by Qollab & IonQ” and keep the Qollab project available for 12 months.

The [Georgia Tech page](https://qhackathon-gt.lovable.app/) separates Fall Fest registration from Qollab registration. It does not expose a second project-submission form. Its October 16 Demo Day is not the competition deadline. The second form's exact fields, URL and deadline remain unverified.

[Georgia Tech participant terms](https://qhackathon-gt.lovable.app/terms-and-conditions) defer track-specific requirements to Qollab and organizer announcements; they also require appropriate third-party rights/credits and responsibility for AI-assisted work. They do not supply another form schema.

## Prepared materials

| Deliverable | Location |
| --- | --- |
| GitHub landing page / getting started | ../README.md |
| Mathematical mechanics | ../docs/QUANTUM.md |
| Architecture and reproduction | ../docs/ARCHITECTURE.md |
| AI / sources / development disclosure | ../docs/ATTRIBUTION.md |
| Qollab project-page Markdown | QOLLAB-PROJECT.md |
| Reusable form answers | FORM-ANSWERS.md |
| Fresh Qollab runtime files | ../qollab-build/ after npm run build |
| Upload archive | ../artifacts/fold-qollab-upload.zip |
| Current verification record | VALIDATION.md |

## Publication route

[Qollab upload documentation](https://qollab.xyz/learn/docs/upload-your-files) accepts files/folders/archives. For a new project, the included top-level README becomes the project write-up. Existing-project uploads skip README, so paste QOLLAB-PROJECT.md into Project Card yourself. Limits: 100 files, 2 MB per file; do not upload node_modules, .venv or the video.

For paste into an existing project, use the generated `qollab-build/README.md`: its relative documentation paths are adjusted for the upload root. Preview the write-up after upload; if Qollab does not resolve file-relative Markdown links/images in the card, use the final public GitHub links instead.

Use the upload ZIP or qollab-build contents. Set the project title, MIT license, tags (`qiskit`, `quantum-playground`, `interference`, `entanglement`, `game`), actual contributors, repository link and demo link. Replace PENDING fields before publication.

[Publishing documentation](https://qollab.xyz/learn/docs/publish) requires publishing a version and making it the public default; a private draft is not visible to judges. Recheck public access and Run from that published version.

Publishing the project may be distinct from entering it through a competition form. The exact submission action on the registered team's dashboard is not verified here: open it and confirm the project is entered, then save a receipt. Do not equate registration, draft creation, GitHub upload, or publication alone with a confirmed competition entry.

## Final checklist / remaining inputs

- [ ] Receive second form URL; inspect every field and deadline, then map the prepared answers.
- [ ] Supply registered team name, members and correct track.
- [ ] Finalize honest build-window / reused-code disclosure.
- [x] Public GitHub repository: https://github.com/Pudging/fold
- [ ] Confirm the GitHub repo contains original source, docs and LICENSE, excluding private backups/environments and large rendered outputs.
- [ ] Finish and publicly host a 120–180 second demo. Existing rendered video is **106.005 seconds**, too short. Current Remotion source defines **148 seconds**, but that source is newer than the MP4; rerender, probe and review it. No render was performed in this preparation task.
- [ ] Replace PENDING video/source/contributor fields in the project page, then rebuild the upload ZIP.
- [ ] Test Qollab's built-in free simulator: open ψ and verify a nonempty circuit.
- [ ] Test a free IonQ **simulator**, not paid hardware. The adapter is locally validated but authenticated Qollab/IonQ execution remains unverified.
- [ ] Publish a public default version; test gameplay, inspection and tutorial on that version.
- [ ] Enter the project in both required submission destinations once their actual forms are available; capture confirmation/time/public URLs.

Backend verification is separate from live browser gameplay. It submits one 1,024-shot job per Qollab Run. [Backend documentation](https://qollab.xyz/learn/docs/compute-backends) allows multiple local jobs but limits IonQ to one job per Run. Stop/Run to start another session rather than assuming one job for the entire hackathon.
