# Fold demo video

This separate Remotion project visualizes Fold gameplay and quantum mechanics. The root game is in `../`; the video is not required to play it. Original video source is MIT; dependencies retain their licenses, including Remotion's own terms.

Use `npm ci` here, `npm run dev` to preview, and `npm run render` to render `FoldDemo` to `out/fold-demo.mp4`. `npm run lint` checks ESLint and TypeScript. `npm run plan`, `npm run capture` and `npm run score` regenerate planned captures/music; inspect their scripts and inputs before running them, since they replace generated assets.

The official submission needs a 120–180 second public video. Current composition source defines 148 seconds; the existing rendered file was measured at 106.005 seconds and needs updating. Probe and review the exported file rather than assuming its length from source. See `../submissions/VALIDATION.md`.

This is a code-rendered film with captured/replayed game states, not evidence of an authenticated IonQ job or filmed human play. Generated outputs are ignored by Git. The following upstream template information describes Remotion itself.

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i --loglevel=error
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).
