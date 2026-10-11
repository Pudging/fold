// Replays the captured match with the game's own engine, so every board and
// amplitude shown in the video is computed by Fold's code, not hand-drawn.
// @ts-expect-error untyped engine module
import { newGame, apply } from "./engine/replay.js";
// @ts-expect-error untyped engine module
import { boardSVG } from "./engine/catan-board.js";
import plan from "./engine/plan.json";
import manifest from "./engine/manifest.json";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Game = any;

const cache = new Map<string, Game>();

export const stateAtBeat = (name: string, occurrence = 0): Game => {
  const key = `${name}#${occurrence}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const { game, random } = newGame(plan.seed);
  let seen = 0;
  for (const a of plan.actions as any[]) {
    apply(game, random, a);
    if (a.type === "beat" && a.name === name && seen++ === occurrence) {
      cache.set(key, game);
      return game;
    }
  }
  throw new Error("beat not found " + name);
};

export const svgFor = (game: Game, selectedQ: number | null = null) =>
  boardSVG(game, null, null, selectedQ) as string;

export const node = (game: Game, id: number) => game.board.nodes[id] as { x: number; y: number };

// Board viewBox (760x620) -> CSS px in the 1920x1080 capture
export const BOARD_SCALE = 740 / 620;
export const boardToCss = (x: number, y: number) => ({ x: 336.5 + BOARD_SCALE * x, y: 166 + BOARD_SCALE * y });

type Shot = { file: string; label: string; cursor?: { x: number; y: number; w: number; h: number } };
const shots = (manifest as { shots: Shot[] }).shots;
export const shot = (prefix: string): Shot => {
  const s = shots.find((x) => x.file.startsWith(prefix));
  if (!s) throw new Error("shot not found " + prefix);
  return s;
};

export const amplitudes = (game: Game) => {
  const out: { index: number; re: number; im: number; p: number }[] = [];
  const st = game.quantum;
  for (let i = 0; i < 256; i++) {
    const re = st.data[2 * i], im = st.data[2 * i + 1];
    out.push({ index: i, re, im, p: re * re + im * im });
  }
  return out;
};

export { plan };
