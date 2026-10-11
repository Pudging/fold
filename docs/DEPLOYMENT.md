# Public deployment

**Play:** https://fold-kgveritrade.vercel.app
**Repository:** https://github.com/Pudging/fold
**Vercel project:** `fold`, workspace `kgveritrade` (Kevin).
**Production status:** Ready, verified October 11, 2026.
**Initial deployed source commit:** `b596bf9` — Configure Vercel production deployment for Fold. Later deployment includes the Qollab iframe form compatibility fix.

The production domain opens without signing in. Preview and deployment-specific URLs retain Vercel authentication. This deployment runs local pass-and-play, simulation, tutorial and Qiskit circuit export. [Qollab's public project](https://qollab.xyz/u/pudging/fold-quantum-settlers) runs the Python bridge separately. Built-in simulator verification passed; IonQ simulator verification remains pending after provider connection errors.

## Build configuration

`vercel.json` selects Vite, installs with `npm ci`, builds with `npx vite build`, and serves `dist/`. Node is pinned to 22.x in package metadata and Vercel project settings. No environment variables, API credentials, database or server functions are required.

`.vercelignore` excludes video, local artifacts, environments, docs and Qollab packaging inputs from deployment uploads. `.vercel/` and `.env*` are ignored by Git. Use `npm run build` separately when preparing the Qollab bundle.

## Redeploy

From the repository root, with Vercel authenticated to the appropriate workspace:

```sh
npm ci
npm test
vercel link --yes --project fold --scope kgveritrade
vercel deploy --prod --yes --scope kgveritrade
```

Check the production domain after deployment. The first deployment was built without aliasing and explicitly promoted after it became Ready.

Automatic deployment on GitHub push is **not enabled**: Vercel could not connect `Pudging/fold` using the current Git integration's permissions. To enable it, open this project's Settings → Git and authorize/connect the Pudging repository with an account that has write/admin access. CLI deployment already works independently of that connection.

## Verification

Unauthenticated production HTTP returned 200. Browser checks completed a two-player setup, production roll, turn handoff, resource-hand change, inspector display, tutorial entry and restoration of the existing match. [Validation record](https://github.com/Pudging/fold/blob/main/submissions/VALIDATION.md) separates these results from pending Qollab/provider and video checks.

The public website does not replace Qollab publication or either competition submission.
