import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { EASE, IN, ramp } from "../components/anim";
import { Background, Flash, Line, Slam, Tex } from "../components/Type";
import { BoardVector, Ring } from "../components/Viz";
import { Sfx } from "../components/Sfx";
import { node, stateAtBeat, svgFor } from "../engine";

const splitGame = () => stateAtBeat("split");

// Board placed in frame by viewBox scale + offset; returns screen position of a node
const placed = (s: number, ox: number, oy: number) => (x: number, y: number) => ({ x: ox + x * s, y: oy + y * s });

export const ColdOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const g = splitGame();
  const svg = svgFor(g, 0);
  const a = node(g, 44), b = node(g, 29);
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
  const t = ramp(frame, 112, 240, EASE);
  const s = interpolate(t, [0, 1], [4.2, 2.3]);
  const ox = 960 - mx * s, oy = 540 - my * s + interpolate(t, [0, 1], [0, -40]);
  const P = placed(s, ox, oy);
  const pa = P(a.x, a.y), pb = P(b.x, b.y);
  const boardO = ramp(frame, 112, 126);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Line who="BOB" text="Which one is your settlement?" from={8} to={66} />
      <Line who="ALICE" text="Both." from={70} to={110} size={120} />
      <Sfx name="shimmer" at={72} volume={0.6} />
      {frame >= 110 ? (
        <AbsoluteFill style={{ opacity: boardO }}>
          <div style={{ position: "absolute", left: ox, top: oy, width: 760 * s, height: 620 * s, filter: `blur(${(1 - boardO) * 8}px)` }}>
            <BoardVector svg={svg} width={760 * s} />
          </div>
          <Ring x={pa.x} y={pa.y} r={20 * s} from={124} color={C.qBright} />
          <Ring x={pb.x} y={pb.y} r={20 * s} from={132} color={C.qBright} />
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 48%, transparent 40%, rgba(6,13,17,.92))" }} />
          <Flash at={112} len={10} peak={0.5} color={C.q} />
          <Sfx name="whoosh" at={108} volume={0.5} />
        </AbsoluteFill>
      ) : null}
      <Line who="BOB" text="That feels illegal." from={168} to={236} y={900} size={64} />
    </AbsoluteFill>
  );
};

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const g = splitGame();
  const svg = svgFor(g, 0);
  const letters = ["F", "O", "L", "D"];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(120,90,190,0.16)" grid={0.05} />
      <AbsoluteFill style={{ perspective: 1800 }}>
        <div
          style={{
            position: "absolute", left: 960 - 760, top: 560 - 620, width: 1520, height: 1240,
            transform: `rotateX(58deg) rotateZ(${-18 + frame * 0.08}deg) scale(${1.25 + frame * 0.0015})`,
            opacity: 0.32, filter: "saturate(.7)",
          }}
        >
          <BoardVector svg={svg} width={1520} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 45% at 50% 46%, rgba(6,13,17,.2), rgba(6,13,17,.9) 80%)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 18 }}>
        {letters.map((l, i) => {
          const f0 = i * 3;
          const tt = ramp(frame, f0, f0 + 12);
          return (
            <span
              key={l}
              style={{
                fontFamily: SANS, fontWeight: 800, fontSize: 300, lineHeight: 1, color: C.text, letterSpacing: -6,
                opacity: tt, filter: `blur(${(1 - tt) * 20}px)`, translate: `0 ${(1 - tt) * -60}px`,
                textShadow: i === 1 ? `0 0 60px ${C.q}` : "none",
              }}
            >
              {l}
            </span>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 660, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: C.q, opacity: ramp(frame, 16, 34) }}>
        QUANTUM CATAN
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 740, display: "flex", justifyContent: "center", opacity: ramp(frame, 30, 50) * (1 - ramp(frame, 108, 120, IN)) }}>
        <Tex expr="|\psi\rangle = \alpha\,|A\rangle + \beta\,|B\rangle" size={44} color={C.muted} />
      </div>
      <Flash at={0} len={16} peak={0.9} />
    </AbsoluteFill>
  );
};

export const RuleBreak: React.FC = () => {
  const frame = useCurrentFrame();
  const split = ramp(frame, 66, 92, EASE);
  const house = (dx: number, dashed: boolean, color: string, o: number) => (
    <svg width="150" height="150" viewBox="-30 -30 60 60" style={{ position: "absolute", left: 960 - 75 + dx, top: 690, opacity: o, filter: `drop-shadow(0 0 18px ${color})` }}>
      <path d="M-15 12V-6L0-18 15-6v18z" fill={dashed ? "rgba(234,130,75,.25)" : color} stroke={dashed ? color : "#192b33"} strokeWidth="2.5" strokeDasharray={dashed ? "4 2.5" : undefined} />
      <path d="M-3.5 12V1h7v11" fill="#25363c" />
    </svg>
  );
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(60,110,130,0.12)" grid={0.04} />
      <Slam from={2} to={58} size={104}>Then we broke one rule.</Slam>
      <Slam from={62} to={118} y="34%" size={132}>One settlement.</Slam>
      <Slam from={74} to={118} y="50%" size={132} color={C.q} style={{ textShadow: `0 0 50px ${C.q}66` }}>Two places.</Slam>
      {frame >= 62 && frame < 118 ? (
        <>
          {house(-170 * split, split > 0.02, C.alice, ramp(frame, 62, 70) * (1 - ramp(frame, 110, 118)))}
          {split > 0.02 ? house(170 * split, true, C.alice, split * (1 - ramp(frame, 110, 118))) : null}
          <div style={{ position: "absolute", left: 960 - 170 * split, width: 340 * split, top: 765, height: 0, borderTop: `2px dashed ${C.q}`, opacity: split * (1 - ramp(frame, 110, 118)) }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: MONO, fontSize: 24, color: C.muted, letterSpacing: 3, opacity: ramp(frame, 90, 100) * (1 - ramp(frame, 110, 118)) }}>
            <span style={{ color: C.q }}>50%</span>
            {"        ←  same building  →        "}
            <span style={{ color: C.q }}>50%</span>
          </div>
        </>
      ) : null}
      <Sfx name="shimmer" at={76} volume={0.5} />
      <Flash at={62} len={8} peak={0.35} />
    </AbsoluteFill>
  );
};
