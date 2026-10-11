import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, MONO } from "../theme";
import { clamp, EASE, ramp } from "../components/anim";
import { Background, Caption, Flash, Kicker, Tex } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { AmpPanel, BoardVector, Ring } from "../components/Viz";
import { PLUS } from "../components/qmath";
import { Sfx } from "../components/Sfx";
import { node, stateAtBeat, svgFor } from "../engine";

export const Leader: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number; color?: string }> = ({ x1, y1, x2, y2, t, color = C.q }) => {
  const mx = (x1 + x2) / 2 + 80, my = Math.min(y1, y2) - 40;
  const d = `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`;
  return (
    <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <path d={d} fill="none" stroke={color} strokeWidth="3" strokeDasharray="1400" strokeDashoffset={1400 * (1 - t)} style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      <circle cx={x1} cy={y1} r={6 * t} fill={color} />
      <circle cx={x2} cy={y2} r={9 * t} fill="none" stroke={color} strokeWidth="3" />
    </svg>
  );
};

export const Split: React.FC = () => {
  const frame = useCurrentFrame();
  const g = stateAtBeat("split");
  const svg = svgFor(g, 0);
  const A = node(g, 44), B = node(g, 29);
  // Vector half: board on the left, math on the right
  const s = interpolate(frame, [150, 300], [2.25, 2.4], { ...clamp, easing: EASE });
  const ox = 330 - 380 * s + 260, oy = 560 - 401 * s;
  const pa = { x: ox + A.x * s, y: oy + A.y * s }, pb = { x: ox + B.x * s, y: oy + B.y * s };
  const vec = ramp(frame, 150, 166);
  const lt = ramp(frame, 190, 222, EASE), lt2 = ramp(frame, 200, 232, EASE);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(120,90,190,0.14)" />
      {frame < 158 ? (
        <AbsoluteFill style={{ opacity: 1 - ramp(frame, 150, 158) }}>
          <Screen
            shots={[
              { f: 0, src: "071-split-tip.jpg" },
              { f: 24, src: "072-split-mode.jpg" },
              { f: 44, src: "073-split-hover-a.jpg" },
              { f: 59, src: "074-split-a.jpg" },
              { f: 82, src: "075-split-hover-b.jpg" },
              { f: 99, src: "076-split-done.jpg" },
              { f: 124, src: "077-split-selected.jpg" },
            ]}
            cams={[
              cam(0, 1600, 600, 1.9, 6, -14),
              cam(26, 1300, 620, 1.4, 4, -6),
              cam(60, 830, 690, 1.95, 2, 4),
              cam(100, 790, 650, 2.3, 0, 0),
              cam(130, 1000, 520, 1.6, 4, -6),
              cam(158, 900, 560, 1.75, 4, -6),
            ]}
            cursor={[
              { f: 0, x: 1600, y: 700 },
              { f: 20, x: 1751, y: 623, click: true },
              { f: 42, x: 853, y: 718 },
              { f: 58, x: 853, y: 718, click: true },
              { f: 80, x: 727, y: 572 },
              { f: 98, x: 727, y: 572, click: true },
              { f: 118, x: 853, y: 716 },
              { f: 122, x: 853, y: 716, click: true },
            ]}
          >
            {() => (
              <>
                <Ring x={853} y={718} r={30} from={100} color={C.qBright} />
                <Ring x={727} y={572} r={30} from={104} color={C.qBright} />
              </>
            )}
          </Screen>
          <Caption from={4} to={56} x={110} y={920} align="left" size={40}>{"Spend 1 ore. Split a settlement."}</Caption>
          <Caption from={60} to={150} x={110} y={920} align="left" size={40}>{"Pick a second legal site."}</Caption>
        </AbsoluteFill>
      ) : null}
      {frame >= 150 ? (
        <AbsoluteFill style={{ opacity: vec }}>
          <div style={{ position: "absolute", left: ox, top: oy, filter: `blur(${(1 - vec) * 10}px)` }}>
            <BoardVector svg={svg} width={760 * s} />
          </div>
          <AbsoluteFill style={{ background: "linear-gradient(90deg, transparent 24%, rgba(6,13,17,.95) 50%), radial-gradient(ellipse 50% 60% at 30% 55%, transparent 50%, rgba(6,13,17,.8))" }} />
          <Ring x={pa.x} y={pa.y} r={44} from={176} color={C.qBright} />
          <Ring x={pb.x} y={pb.y} r={44} from={182} color={C.qBright} />
          <Leader x1={1385} y1={322} x2={pa.x + 30} y2={pa.y - 30} t={lt} />
          <Leader x1={1665} y1={322} x2={pb.x + 30} y2={pb.y - 30} t={lt2} />
          <div style={{ position: "absolute", left: 1010, top: 200, opacity: ramp(frame, 160, 176), translate: `${(1 - ramp(frame, 160, 180)) * 30}px 0` }}>
            <Tex expr="|\psi\rangle = \tfrac{1}{\sqrt{2}}\big(\,|A\rangle \;+\; |B\rangle\,\big)" size={64} />
          </div>
          <div style={{ position: "absolute", left: 1030, top: 430, opacity: ramp(frame, 214, 230) }}>
            <AmpPanel v={PLUS} labels={["|A\\rangle", "|B\\rangle"]} colors={[C.alice, C.alice]} width={780} />
          </div>
          <div style={{ position: "absolute", left: 1030, top: 680, fontFamily: MONO, fontSize: 24, lineHeight: 1.9, color: C.muted, opacity: ramp(frame, 236, 252) }}>
            <div><span style={{ color: C.text }}>1</span> building · <span style={{ color: C.text }}>1</span> victory point · <span style={{ color: C.q }}>2</span> reserved sites</div>
            <div><Tex expr="P(A) = |\alpha|^2 = \tfrac12" size={30} color={C.text} />{"    "}<Tex expr="P(B) = |\beta|^2 = \tfrac12" size={30} color={C.text} /></div>
          </div>
          <Kicker text="SUPERPOSITION" from={160} to={300} x={1030} y={130} />
        </AbsoluteFill>
      ) : null}
      <Flash at={150} len={10} peak={0.4} color={C.q} />
      <Sfx name="click" at={20} />
      <Sfx name="click" at={58} />
      <Sfx name="click" at={98} />
      <Sfx name="shimmer" at={100} volume={0.7} />
      <Sfx name="click" at={122} />
      <Sfx name="whoosh" at={146} volume={0.5} />
      <Sfx name="data" at={190} volume={0.5} />
    </AbsoluteFill>
  );
};
