// Builds the full-match timelapse from the captured screenshots plus the engine's
// own replay of the same plan (scores, quantum events and measurement outcomes).
// @ts-expect-error untyped engine module
import { newGame, apply } from "./engine/replay.js";
import plan from "./engine/plan.json";
import manifest from "./engine/manifest.json";
import { boardToCss } from "./engine";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventKind = "quantum" | "gate" | "collapse";
export type TLEvent = { kind: EventKind; text: string; detail: string; who: number; turn: number };
export type TLShot = {
  src: string;
  turn: number;
  scores: [number, number];
  event?: TLEvent;
  burst?: string[];
  ping?: { x: number; y: number; who: number };
  winner?: boolean;
  dur: number;
  start: number;
};

type Snap = { turn: number; scores: [number, number]; event?: TLEvent; ping?: { x: number; y: number; who: number } };

const NAMES = ["Alice", "Bob"];
const snaps: Snap[] = [];
{
  const { game, random } = newGame(plan.seed);
  for (const a of plan.actions as any[]) {
    const who = game.active;
    apply(game, random, a);
    let event: TLEvent | undefined;
    let ping: Snap["ping"];
    const turn = game.turn;
    const node = (id: number) => boardToCss(game.board.nodes[id].x, game.board.nodes[id].y);
    if (a.type === "setupSettlement" || a.type === "settlement" || a.type === "city") ping = { ...node(a.node), who };
    if (a.type === "setupRoad" || a.type === "road") {
      const e = game.board.edges[a.edge], p = node(e.a), q = node(e.b);
      ping = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2, who };
    }
    if (a.type === "split" || a.type === "quantum") {
      const q = game.pending.at(-1);
      event = { kind: "quantum", who, turn, text: a.type === "split" ? `SPLIT → Q${q.slot + 1}` : `QUANTUM SETTLEMENT Q${q.slot + 1}`, detail: "50% · 50%" };
      const p = node(q.sites[0]), r = node(q.sites[1]);
      ping = { x: (p.x + r.x) / 2, y: (p.y + r.y) / 2, who };
    }
    if (a.type === "gate") {
      const m = game.quantum.marginal(a.slot);
      const odds = m < 0.005 ? "A 100%" : m > 0.995 ? "B 100%" : `A ${Math.round((1 - m) * 100)}%`;
      const detail = a.gate === "z" ? "odds unchanged · phase flipped" : a.gate === "cz" ? "odds unchanged · entangled" : `→ ${odds}`;
      event = { kind: "gate", who, turn, text: `${a.gate.toUpperCase()} ON Q${a.slot + 1}`, detail };
    }
    if (a.type === "roll" && game.resolved) {
      event = {
        kind: "collapse", who, turn,
        text: `ROLL ${a.total} · MEASURED`,
        detail: game.resolved.map((r: any) => `Q${r.slot + 1} → ${r.bit ? "B" : "A"}`).join("  ·  "),
      };
      const k = node(game.resolved[0].kept);
      ping = { ...k, who: -1 };
    }
    snaps.push({ turn, scores: [game.score(0), game.score(1)], event, ping });
  }
}

const KEEP = new Set(["setup-settlement", "setup-road", "rolled", "road-built", "city-built", "split-done", "quantum-done", "gate-z-applied", "gate-h-applied", "gate-cz-applied", "trade-accepted", "bank-done", "ended"]);
const bursts = new Map((manifest as any).bursts.map((b: any) => [b.base, b.frames.map((f: any) => f.file)]));
const picked = new Map<number, { src: string; winner?: boolean }>();
for (const s of (manifest as any).shots) if (s.actionIndex >= 0 && KEEP.has(s.label)) picked.set(s.actionIndex, { src: s.file });
for (const s of (manifest as any).timelapse) picked.set(s.label === "winner" ? 1e6 : s.actionIndex, { src: s.file, winner: s.label === "winner" });

const raw = [...picked.entries()].sort((a, b) => a[0] - b[0]).map(([i, p]) => {
  const snap = snaps[Math.min(i, snaps.length - 1)];
  return { ...snap, src: p.src, winner: p.winner, burst: bursts.get(p.src) as string[] | undefined };
});

export const TL_START = 24;
export const TL_END = 594;
const weight = (s: (typeof raw)[number]) => (s.event ? (s.event.kind === "collapse" ? 7 : 4.5) : 1);
const unit = (TL_END - TL_START) / raw.filter((s) => !s.winner).reduce((n, s) => n + weight(s), 0);
let t = TL_START;
export const SHOTS: TLShot[] = raw.map((s) => {
  const dur = s.winner ? 999 : weight(s) * unit;
  const out = { ...s, dur, start: t } as TLShot;
  t += dur;
  return out;
});
export const EVENTS = SHOTS.filter((s) => s.event).map((s) => ({ ...s.event!, start: s.start }));
export const FINAL = snaps[snaps.length - 1];
export const LAST_TURN = FINAL.turn;
export const WINNER = (plan.actions as any[])[plan.actions.length - 1].player as number;
export const COUNTS = {
  quantumMoves: (plan.actions as any[]).filter((a) => a.type === "split" || a.type === "gate").length,
  quantumBuilds: (plan.actions as any[]).filter((a) => a.type === "quantum").length,
  measurements: EVENTS.filter((e) => e.kind === "collapse").length,
};
export { NAMES };
