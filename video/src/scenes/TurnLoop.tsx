import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { EASE, IN, OUT, ramp } from "../components/anim";
import { Background, Flash, Slam } from "../components/Type";
import { cam, Crop, Screen, type Cam, type CursorKey, type ShotKey } from "../components/Screen";
import { Box, Ring } from "../components/Viz";
import { Sfx } from "../components/Sfx";

// Ten bars: the turn track gains one quantum move, then four moves shown in real play.
const TRACK = ["ROLL", "TRADE", "BUILD", "END TURN"];
const MOVES = [
  { n: "01", key: "HEDGE", from: 120, title: "One settlement,\ntwo spots.", sub: "Counts as a point now. Lands wherever\nthe dice first measure it.", tag: "BOB · TURN 10 · QUANTUM SETTLEMENT", card: "BUILD PANEL", cardH: 300, main: [695, 408, 1.85, 2.05], cardCam: [1751, 521, 1.0] },
  { n: "02", key: "STEER", from: 240, title: "Tilt the odds\nwith a gate.", sub: "Gates move the amplitudes, not the dice.\nBob sends Q2 to location A: 100%.", tag: "BOB · TURN 12 · INTERFERE (H)", card: "SETTLEMENT Q2 · LIVE ODDS", cardH: 360, main: [695, 408, 2.15, 2.3], cardCam: [1751, 395, 1.0] },
  { n: "03", key: "LINK", from: 360, title: "Entangle with\na rival.", sub: "Odds don't move. The two settlements\nnow share one quantum state.", tag: "BOB · TURN 16 · LINK (CZ)", card: "Q1 · ENTANGLED WITH ALICE'S Q2", cardH: 480, main: [790, 572, 1.7, 1.85], cardCam: [1751, 500, 1.0] },
  { n: "04", key: "COLLAPSE", from: 480, title: "The dice decide\nwhen.", sub: "A roll touching any ghost measures every\nghost first. Then the table gets paid.", tag: "ALICE · TURN 13 · ROLL 6", card: "TABLE HEADER AFTER THE ROLL", cardH: 90, main: [760, 535, 1.55, 1.7], cardCam: [263, 84, 1.15] },
] as const;

const burst = (base: string, f0: number, step: number, count: number): ShotKey[] =>
  Array.from({ length: count }, (_, i) => ({ f: f0 + i * step, src: `b-${base}-${i}.jpg`, fade: 3 }));

const SHOTS: ShotKey[] = [
  { f: 0, src: "085-quantum-tip.jpg" },
  { f: 134, src: "086-quantum-mode.jpg" },
  { f: 150, src: "087-quantum-hover-a.jpg" },
  { f: 166, src: "088-quantum-a.jpg" },
  { f: 182, src: "089-quantum-hover-b.jpg" },
  { f: 198, src: "090-quantum-done.jpg", fade: 4 },
  { f: 214, src: "091-quantum-selected.jpg", fade: 6 },
  { f: 240, src: "104-gate-h-panel.jpg" },
  { f: 262, src: "105-gate-h-tip.jpg" },
  { f: 280, src: "106-gate-h-applied.jpg" },
  ...burst("106-gate-h-applied", 284, 6, 5),
  { f: 330, src: "107-hA-after.jpg", fade: 6 },
  { f: 360, src: "151-gate-cz-panel.jpg" },
  { f: 382, src: "152-gate-cz-selected.jpg" },
  { f: 398, src: "153-gate-cz-tip.jpg" },
  { f: 414, src: "154-gate-cz-applied.jpg" },
  ...burst("154-gate-cz-applied", 418, 5, 5),
  { f: 446, src: "155-cz-after.jpg", fade: 6 },
  { f: 480, src: "118-harvest1Roll-ready.jpg" },
  { f: 494, src: "119-roll-hover.jpg" },
  { f: 506, src: "120-rolled.jpg" },
  ...burst("120-rolled", 509, 6, 6),
];

const camsFor = (pick: (m: (typeof MOVES)[number]) => readonly number[], push: boolean): Cam[] =>
  MOVES.flatMap((m) => {
    const [x, y, z0, z1] = pick(m) as number[];
    return [cam(m.from, x, y, z0), cam(m.from + 119, x, y, push ? z1 : z0)];
  });
const MAIN = camsFor((m) => m.main, true);
const CARD = camsFor((m) => m.cardCam, false);

const MAIN_CURSOR: CursorKey[] = [
  { f: 140, x: 820, y: 300 },
  { f: 150, x: 727, y: 354 },
  { f: 165, x: 727, y: 354, click: true },
  { f: 182, x: 664, y: 463 },
  { f: 197, x: 664, y: 463, click: true },
  { f: 232, x: 760, y: 560 },
];
const CARD_CURSOR: CursorKey[] = [
  { f: 120, x: 1800, y: 640 },
  { f: 132, x: 1751, y: 521, click: true },
  { f: 146, x: 1640, y: 640 },
  { f: 240, x: 1840, y: 560 },
  { f: 262, x: 1751, y: 470 },
  { f: 279, x: 1751, y: 470, click: true },
  { f: 300, x: 1660, y: 560 },
  { f: 362, x: 1840, y: 700 },
  { f: 380, x: 1751, y: 655, click: true },
  { f: 398, x: 1751, y: 715 },
  { f: 413, x: 1751, y: 715, click: true },
  { f: 440, x: 1660, y: 730 },
  { f: 476, x: 1660, y: 730 },
];

const Track: React.FC<{ frame: number }> = ({ frame }) => {
  const open = ramp(frame, 58, 80, EASE);
  const out = ramp(frame, 112, 122, IN);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 560, display: "flex", justifyContent: "center", alignItems: "center", opacity: 1 - out, filter: `blur(${out * 8}px)` }}>
      {TRACK.map((t, i) => {
        const a = ramp(frame, 8 + i * 7, 20 + i * 7);
        const chip = (
          <div key={t} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: C.text, padding: "18px 30px", border: "1.5px solid rgba(237,241,237,.35)", borderRadius: 12, background: "rgba(20,45,55,.55)", opacity: a, translate: `0 ${(1 - a) * 24}px` }}>{t}</div>
            {i < TRACK.length - 1 ? <div style={{ width: 54, height: 2, background: "rgba(237,241,237,.3)", opacity: a }} /> : null}
          </div>
        );
        if (i !== 1) return chip;
        return (
          <React.Fragment key={t}>
            <div style={{ width: open * 330, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", alignItems: "center", opacity: ramp(frame, 66, 80), scale: String(0.8 + 0.2 * ramp(frame, 66, 84, OUT)) }}>
                <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 5, color: "#fff", padding: "18px 26px", borderRadius: 12, background: "linear-gradient(135deg,#6d55b8,#9a7fe6)", boxShadow: `0 0 50px rgba(201,178,245,${0.55 * ramp(frame, 66, 90)})`, whiteSpace: "nowrap" }}>◇ QUANTUM</div>
                <div style={{ width: 54, height: 2, background: "rgba(201,178,245,.6)" }} />
              </div>
            </div>
            {chip}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const MoveLabel: React.FC<{ frame: number; m: (typeof MOVES)[number] }> = ({ frame, m }) => {
  const f = frame - m.from;
  if (f < -2 || f > 122) return null;
  const a = ramp(f, 0, 14), out = ramp(f, 110, 120, IN), o = a * (1 - out);
  return (
    <div style={{ position: "absolute", left: 110, top: 250, width: 700, opacity: o, translate: `${(1 - a) * -40}px 0` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, fontFamily: MONO, letterSpacing: 6 }}>
        <span style={{ fontSize: 26, color: C.text, opacity: 0.5 }}>{m.n}</span>
        <span style={{ fontSize: 30, color: C.q }}>{m.key}</span>
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 96, letterSpacing: -3.4, lineHeight: 1.02, color: C.text, marginTop: 26, whiteSpace: "pre", filter: `blur(${(1 - a) * 10}px)` }}>{m.title}</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 28, lineHeight: 1.5, color: "#b7c6cc", marginTop: 34, whiteSpace: "pre", opacity: ramp(f, 10, 24) }}>{m.sub}</div>
      <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 3, color: C.muted, marginTop: 40, opacity: ramp(f, 16, 30) }}>{m.tag}</div>
    </div>
  );
};

const Progress: React.FC<{ frame: number }> = ({ frame }) => {
  const o = ramp(frame, 120, 134) * (1 - ramp(frame, 548, 556, IN));
  return (
    <div style={{ position: "absolute", left: 110, top: 96, display: "flex", gap: 14, opacity: o }}>
      {MOVES.map((m) => {
        const active = frame >= m.from && frame < m.from + 120;
        const done = frame >= m.from + 120;
        return (
          <div key={m.key} style={{ width: 150 }}>
            <div style={{ height: 3, borderRadius: 2, background: "rgba(237,241,237,.15)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(done ? 1 : active ? ramp(frame, m.from, m.from + 118, (x) => x) : 0) * 100}%`, background: C.q }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 15, letterSpacing: 3, marginTop: 10, color: active ? C.qBright : done ? C.muted : C.dim }}>{m.key}</div>
          </div>
        );
      })}
    </div>
  );
};

export const TurnLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const screenO = ramp(frame, 116, 130) * (1 - ramp(frame, 548, 560, IN));
  const move = [...MOVES].reverse().find((m) => frame >= m.from) ?? MOVES[0];
  const cardO = ramp(frame - move.from, 2, 12);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(201,178,245,0.08)" />
      {frame < 126 ? (
        <AbsoluteFill>
          <Img src={staticFile("capture/067-rolled.jpg")} style={{ position: "absolute", width: 1920, height: 1080, opacity: 0.16, filter: "blur(18px) saturate(.6)", scale: String(1.08 + frame * 0.0006) }} />
          <Slam from={2} to={60} y={380} size={96}>{"Your turn, as always."}</Slam>
          <Slam from={62} to={118} y={380} size={96}>{"Plus "}<span style={{ color: C.q }}>one quantum move.</span></Slam>
          <div style={{ position: "absolute", left: 0, right: 0, top: 700, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.muted, opacity: ramp(frame, 84, 98) * (1 - ramp(frame, 112, 120, IN)) }}>
            BEFORE OR AFTER YOU ROLL · ONCE PER TURN
          </div>
          <Track frame={frame} />
        </AbsoluteFill>
      ) : null}
      {frame >= 112 && frame < 562 ? (
        <AbsoluteFill style={{ opacity: screenO }}>
          <Crop x={840} y={160} w={700} h={760}>
            <Screen shots={SHOTS} cams={MAIN} cursor={MAIN_CURSOR} radius={0}>
              {() => (
                <>
                  <Ring x={727} y={354} r={40} from={200} to={236} color={C.bob} />
                  <Ring x={664} y={463} r={40} from={204} to={236} color={C.bob} />
                  <Ring x={727} y={354} r={40} from={300} to={352} color={C.qBright} />
                </>
              )}
            </Screen>
          </Crop>
          <Crop x={1570} y={160} w={310} h={move.cardH} opacity={cardO} border="rgba(201,178,245,.35)">
            <Screen shots={SHOTS} cams={CARD} cursor={CARD_CURSOR} radius={0}>
              {() => (
                <>
                  <Box x={1601} y={310} w={300} h={66} from={292} to={340} color={C.bob} />
                  <Box x={1601} y={393} w={300} h={44} from={436} to={476} color={C.q} />
                </>
              )}
            </Screen>
          </Crop>
          <div style={{ position: "absolute", left: 1572, top: 160 + move.cardH + 18, width: 310, fontFamily: MONO, fontSize: 14, letterSpacing: 2.5, color: C.muted, lineHeight: 1.6, opacity: cardO }}>{move.card}</div>
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,13,17,.9) 0%, rgba(6,13,17,.5) 30%, transparent 43%)" }} />
          {MOVES.map((m) => <MoveLabel key={m.key} frame={frame} m={m} />)}
        </AbsoluteFill>
      ) : null}
      <Progress frame={frame} />
      {frame >= 548 ? (
        <AbsoluteFill style={{ opacity: ramp(frame, 552, 562) }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 400, display: "flex", justifyContent: "center", gap: 18 }}>
            {MOVES.map((m, i) => (
              <div key={m.key} style={{ fontFamily: MONO, fontSize: 30, letterSpacing: 6, color: C.qBright, padding: "16px 28px", border: "1.5px solid rgba(201,178,245,.5)", borderRadius: 12, background: "rgba(109,85,184,.18)", opacity: ramp(frame, 552 + i * 4, 562 + i * 4), translate: `0 ${(1 - ramp(frame, 552 + i * 4, 566 + i * 4)) * 20}px` }}>
                {m.key}
              </div>
            ))}
          </div>
          <Slam from={560} to={600} y={590} size={72} inLen={8}>{"Same economy. "}<span style={{ color: C.q }}>New decisions every turn.</span></Slam>
        </AbsoluteFill>
      ) : null}
      <Flash at={62} len={12} peak={0.25} color={C.q} />
      <Flash at={506} len={10} peak={0.35} />
      <Sfx name="whoosh" at={60} volume={0.5} />
      <Sfx name="shimmer" at={66} volume={0.6} />
      <Sfx name="click" at={132} />
      <Sfx name="click" at={165} />
      <Sfx name="click" at={197} />
      <Sfx name="shimmer" at={200} volume={0.5} />
      <Sfx name="click" at={279} />
      <Sfx name="shimmer" at={282} volume={0.6} />
      <Sfx name="click" at={380} />
      <Sfx name="click" at={413} />
      <Sfx name="data" at={416} volume={0.5} />
      <Sfx name="click" at={505} />
      <Sfx name="dice" at={506} volume={0.8} />
      <Sfx name="collapse" at={510} volume={0.7} />
      <Sfx name="whoosh" at={548} volume={0.4} />
    </AbsoluteFill>
  );
};
