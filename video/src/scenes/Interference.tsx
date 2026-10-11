import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { EASE, IN, ramp } from "../components/anim";
import { Background, Caption, Flash, Kicker, Slam, Tex } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { BlochSphere } from "../components/Bloch";
import { AmpPanel, Box } from "../components/Viz";
import { bloch, evolve, PLUS, type Step } from "../components/qmath";
import { Sfx } from "../components/Sfx";
import { Leader } from "./Split";

const BOB: Step[] = [{ f0: 62, f1: 100, gate: { name: "h", target: 0 } }];
const ALICE: Step[] = [
  { f0: 182, f1: 220, gate: { name: "z", target: 0 } },
  { f0: 302, f1: 340, gate: { name: "h", target: 0 } },
];

const useQuantum = (frame: number) => {
  const alice = frame >= 150;
  const steps = alice ? ALICE : BOB;
  const start = alice ? 150 : 0;
  const v = evolve(PLUS, steps, frame, EASE);
  const trail = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let f = start; f <= frame; f += 2) pts.push(bloch(evolve(PLUS, steps, f, EASE)));
    return pts;
  }, [frame, start, steps]);
  return { v, b: bloch(v), trail, alice };
};

const burst = (base: string, f0: number, step: number, count: number) =>
  Array.from({ length: count }, (_, i) => ({ f: f0 + i * step, src: `b-${base}-${i}.jpg`, fade: 3 }));

const Window: React.FC<{ children: React.ReactNode; x: number; y: number; scale: number; opacity?: number }> = ({ children, x, y, scale, opacity = 1 }) => (
  <div style={{ position: "absolute", left: x, top: y, width: 1920 * scale, height: 1080 * scale, borderRadius: 18, overflow: "hidden", opacity, boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)" }}>
    <div style={{ width: 1920, height: 1080, scale: String(scale), transformOrigin: "0 0", position: "relative" }}>{children}</div>
  </div>
);

export const Interference: React.FC = () => {
  const frame = useCurrentFrame();
  const { v, b, trail, alice } = useQuantum(frame);
  const color = alice ? C.alice : C.bob;
  const summary = frame >= 354;
  const mainO = 1 - ramp(frame, 352, 362);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint={alice ? "rgba(234,130,75,0.10)" : "rgba(96,176,223,0.10)"} />
      <Kicker n="01" text="INTERFERENCE" from={0} to={540} />
      {!summary || mainO > 0 ? (
        <AbsoluteFill style={{ opacity: mainO }}>
          {/* Bloch sphere + amplitudes */}
          <div style={{ position: "absolute", left: 60, top: 170 }}>
            <BlochSphere size={640} v={b} trail={trail} color={color} />
          </div>
          <div style={{ position: "absolute", left: 110, top: 830 }}>
            <AmpPanel v={v} labels={["|A\\rangle", "|B\\rangle"]} colors={[color, color]} width={640} />
          </div>
          {/* Real UI */}
          <Window x={800} y={200} scale={0.56}>
            <Screen
              shots={[
                { f: 0, src: "104-gate-h-panel.jpg" },
                { f: 40, src: "105-gate-h-tip.jpg" },
                { f: 61, src: "106-gate-h-applied.jpg" },
                ...burst("106-gate-h-applied", 64, 7, 5),
                { f: 104, src: "107-hA-after.jpg", fade: 6 },
                { f: 150, src: "094-gate-z-panel.jpg", fade: 8 },
                { f: 164, src: "095-gate-z-tip.jpg" },
                { f: 181, src: "096-gate-z-applied.jpg" },
                ...burst("096-gate-z-applied", 184, 7, 5),
                { f: 224, src: "097-z-after.jpg", fade: 6 },
                { f: 250, src: "114-gate-h-panel.jpg", fade: 6 },
                { f: 284, src: "115-gate-h-tip.jpg" },
                { f: 301, src: "116-gate-h-applied.jpg" },
                ...burst("116-gate-h-applied", 304, 7, 5),
              ]}
              cams={[
                cam(0, 1250, 420, 1.42),
                cam(140, 1250, 420, 1.48),
                cam(150, 1250, 480, 1.42),
                cam(352, 1250, 480, 1.5),
              ]}
              cursor={[
                { f: 6, x: 1500, y: 640 },
                { f: 38, x: 1751, y: 470 },
                { f: 60, x: 1751, y: 470, click: true },
                { f: 80, x: 1660, y: 600 },
                { f: 150, x: 1500, y: 640 },
                { f: 166, x: 1751, y: 522 },
                { f: 180, x: 1751, y: 522, click: true },
                { f: 200, x: 1660, y: 640 },
                { f: 250, x: 1500, y: 640 },
                { f: 284, x: 1751, y: 470 },
                { f: 300, x: 1751, y: 470, click: true },
                { f: 320, x: 1660, y: 600 },
              ]}
            >
              {() => (
                <>
                  <Box x={1601} y={310} w={300} h={66} from={72} to={148} color={C.bob} />
                  <Box x={1601} y={393} w={300} h={44} from={194} to={248} color={C.alice} />
                  <Box x={1601} y={310} w={300} h={66} from={312} to={352} color={C.alice} />
                </>
              )}
            </Screen>
          </Window>
          <Leader x1={385} y1={250} x2={1688} y2={455} t={ramp(frame, 96, 118, EASE) * (1 - ramp(frame, 140, 150))} color={C.bob} />
          <Leader x1={385} y1={790} x2={1817} y2={404} t={ramp(frame, 320, 338, EASE) * (1 - ramp(frame, 352, 360))} color={C.alice} />
          {/* Who / when */}
          <div style={{ position: "absolute", left: 800, top: 832, display: "flex", gap: 26, alignItems: "center", fontFamily: MONO, fontSize: 24, letterSpacing: 2 }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: color, boxShadow: `0 0 16px ${color}` }} />
            <span style={{ color }}>{alice ? "ALICE · SETTLEMENT Q1" : "BOB · SETTLEMENT Q2"}</span>
            <span style={{ color: C.muted }}>{frame < 150 ? "TURN 12" : frame < 250 ? "TURN 11" : "TURN 13"}</span>
            <span style={{ color: C.dim }}>STARTS IN |+⟩ · 50/50</span>
          </div>
          {/* Equations */}
          <div style={{ position: "absolute", left: 800, top: 900, height: 120 }}>
            <div style={{ opacity: ramp(frame, 66, 80) * (1 - ramp(frame, 140, 150, IN)), position: "absolute", whiteSpace: "nowrap" }}>
              <Tex expr="H\,|+\rangle = |A\rangle" size={70} />
              <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 700, color: C.bob, marginLeft: 40 }}>A · 100%</span>
            </div>
            <div style={{ opacity: ramp(frame, 186, 200) * (1 - ramp(frame, 240, 250, IN)), position: "absolute", whiteSpace: "nowrap" }}>
              <Tex expr="Z\,|+\rangle = |-\rangle" size={70} />
              <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 700, color: C.text, marginLeft: 40 }}>Odds unchanged. <span style={{ color: C.alice }}>Phase flipped.</span></span>
            </div>
            <div style={{ opacity: ramp(frame, 306, 320) * (1 - ramp(frame, 352, 360, IN)), position: "absolute", whiteSpace: "nowrap" }}>
              <Tex expr="H\,Z\,|+\rangle = H\,|-\rangle = |B\rangle" size={70} />
              <span style={{ fontFamily: SANS, fontSize: 40, fontWeight: 700, color: C.alice, marginLeft: 40 }}>B · 100%</span>
            </div>
          </div>
          {/* Turn skip */}
          {frame >= 240 && frame < 262 ? (
            <AbsoluteFill style={{ background: "rgba(6,13,17,.7)", opacity: 1 - ramp(frame, 254, 262) }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 500, textAlign: "center", fontFamily: MONO, fontSize: 40, letterSpacing: 8, color: C.text }}>
                TURN 11 <span style={{ color: C.alice }}>→</span> TURN 13
              </div>
              <div style={{ position: "absolute", left: 0, right: 0, top: 560, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: C.muted }}>ONE QUANTUM ACTION PER TURN</div>
            </AbsoluteFill>
          ) : null}
          <Caption from={8} to={58} x={800} y={130} align="left" size={34} color={C.text}>{"Two settlements. The same starting state."}</Caption>
        </AbsoluteFill>
      ) : null}
      {summary ? (
        <AbsoluteFill style={{ opacity: ramp(frame, 354, 366) }}>
          <div style={{ position: "absolute", left: 0, right: 0, top: 200, display: "flex", justifyContent: "center" }}>
            <Tex expr="H = \tfrac{1}{\sqrt{2}}\begin{pmatrix}1 & 1\\ 1 & -1\end{pmatrix}" size={76} />
          </div>
          <div style={{ position: "absolute", left: 230, top: 470, width: 640, opacity: ramp(frame, 372, 386), translate: `${(1 - ramp(frame, 372, 390)) * -40}px 0` }}>
            <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.bob, marginBottom: 20 }}>BOB · H</div>
            <Tex expr="\tfrac{1}{\sqrt2}\big(\tfrac{1}{\sqrt2}+\tfrac{1}{\sqrt2}\big) = 1 \;\to\; A" size={46} />
            <br />
            <Tex expr="\tfrac{1}{\sqrt2}\big(\tfrac{1}{\sqrt2}-\tfrac{1}{\sqrt2}\big) = 0 \;\to\; B" size={46} color={C.muted} />
          </div>
          <div style={{ position: "absolute", left: 1050, top: 470, width: 700, opacity: ramp(frame, 384, 398), translate: `${(1 - ramp(frame, 384, 402)) * 40}px 0` }}>
            <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.alice, marginBottom: 20 }}>ALICE · Z, THEN H</div>
            <Tex expr="\tfrac{1}{\sqrt2}\big(\tfrac{1}{\sqrt2}-\tfrac{1}{\sqrt2}\big) = 0 \;\to\; A" size={46} color={C.muted} />
            <br />
            <Tex expr="\tfrac{1}{\sqrt2}\big(\tfrac{1}{\sqrt2}+\tfrac{1}{\sqrt2}\big) = 1 \;\to\; B" size={46} />
          </div>
          <Slam from={420} to={536} y="82%" size={96}>
            {"The phase "}
            <span style={{ color: C.q }}>changed the outcome.</span>
          </Slam>
          <Caption from={398} to={536} y={720} mono size={22} color={C.muted}>{"AMPLITUDES ADD OR CANCEL — PROBABILITIES CAN'T DO THAT"}</Caption>
        </AbsoluteFill>
      ) : null}
      <Flash at={62} len={10} peak={0.3} color={C.bob} />
      <Flash at={302} len={10} peak={0.3} color={C.alice} />
      <Flash at={420} len={12} peak={0.45} />
      <Sfx name="click" at={60} />
      <Sfx name="shimmer" at={64} volume={0.6} />
      <Sfx name="click" at={180} />
      <Sfx name="whoosh" at={238} volume={0.4} />
      <Sfx name="click" at={300} />
      <Sfx name="shimmer" at={304} volume={0.6} />
      <Sfx name="whoosh" at={356} volume={0.5} />
    </AbsoluteFill>
  );
};
