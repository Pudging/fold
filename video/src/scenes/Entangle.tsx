import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, EASE, IN, ramp } from "../components/anim";
import { Background, Caption, Flash, Kicker, Slam, Tex } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { Box, JointBars } from "../components/Viz";
import { evolve, PLUSPLUS, type Step } from "../components/qmath";
import { Sfx } from "../components/Sfx";
import { stateAtBeat } from "../engine";

// Bit 0 = Bob's Q1, bit 1 = Alice's Q2 (matches the engine's register slots)
const STEPS: Step[] = [
  { f0: 124, f1: 164, gate: { name: "cz", target: 1, control: 0 } },
  { f0: 252, f1: 292, gate: { name: "h", target: 1 } },
];

export const Entangle: React.FC = () => {
  const frame = useCurrentFrame();
  const v = evolve(PLUSPLUS, STEPS, frame, EASE);
  const cz = stateAtBeat("cz");
  const purity = cz.quantum.purity(0) as number;
  const pT = ramp(frame, 130, 170, EASE);
  const uiZoomOut = frame >= 360;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(201,178,245,0.12)" />
      <Kicker n="02" text="ENTANGLEMENT" from={0} to={480} />
      <AbsoluteFill style={{ opacity: 1 - ramp(frame, 352, 362) }}>
        <div style={{ position: "absolute", left: 70, top: 170, width: 1920 * 0.52, height: 1080 * 0.52, borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)" }}>
          <div style={{ width: 1920, height: 1080, scale: "0.52", transformOrigin: "0 0", position: "relative" }}>
            <Screen
              shots={[
                { f: 0, src: "151-gate-cz-panel.jpg" },
                { f: 34, src: "152-gate-cz-selected.jpg" },
                { f: 80, src: "153-gate-cz-tip.jpg" },
                { f: 121, src: "154-gate-cz-applied.jpg" },
                ...[0, 1, 2, 3, 4].map((i) => ({ f: 124 + i * 6, src: `b-154-gate-cz-applied-${i}.jpg`, fade: 3 })),
                { f: 156, src: "155-cz-after.jpg", fade: 4 },
                { f: 186, src: "156-cz-after-other.jpg" },
                { f: 236, src: "164-gate-h-panel.jpg", fade: 6 },
                { f: 251, src: "166-gate-h-applied.jpg" },
                ...[0, 1, 2, 3, 4].map((i) => ({ f: 254 + i * 6, src: `b-166-gate-h-applied-${i}.jpg`, fade: 3 })),
                { f: 290, src: "167-bell-after.jpg", fade: 4 },
              ]}
              cams={[
                cam(0, 1210, 560, 1.38),
                cam(110, 1210, 560, 1.45),
                cam(130, 1210, 560, 1.42),
                cam(186, 790, 572, 2.15),
                cam(230, 790, 572, 2.25),
                cam(236, 1210, 560, 1.38),
                cam(352, 1210, 560, 1.46),
              ]}
              cursor={[
                { f: 4, x: 1500, y: 700 },
                { f: 26, x: 1751, y: 655, click: true },
                { f: 70, x: 1751, y: 715 },
                { f: 120, x: 1751, y: 715, click: true },
                { f: 170, x: 790, y: 681 },
                { f: 184, x: 790, y: 681, click: true },
                { f: 236, x: 1500, y: 640 },
                { f: 250, x: 1751, y: 470, click: true },
                { f: 270, x: 1660, y: 600 },
              ]}
            >
              {() => (
                <>
                  <Box x={1593} y={276} w={176} h={34} from={132} to={186} color={C.q} />
                  <Box x={1601} y={310} w={300} h={66} from={292} to={352} color={C.q} />
                </>
              )}
            </Screen>
          </div>
        </div>
        <div style={{ position: "absolute", left: 70, top: 760, fontFamily: MONO, fontSize: 24, letterSpacing: 2, display: "flex", gap: 24 }}>
          <span style={{ color: frame < 236 ? C.bob : C.alice }}>{frame < 236 ? "BOB · TURN 16 · LINK (CZ)" : "ALICE · TURN 17 · INTERFERE (H)"}</span>
        </div>
        <div style={{ position: "absolute", left: 70, top: 820, width: 1000 }}>
          <div style={{ opacity: ramp(frame, 130, 144) * (1 - ramp(frame, 236, 246, IN)), position: "absolute" }}>
            <Tex expr="CZ = \mathrm{diag}(1,\,1,\,1,\,-1)" size={58} />
            <div style={{ fontFamily: MONO, fontSize: 24, color: C.muted, marginTop: 20, display: "flex", gap: 40 }}>
              <span>PURITY Q1 <span style={{ color: C.text }}>{interpolate(pT, [0, 1], [1, purity], clamp).toFixed(3)}</span></span>
              <span>PURITY Q2 <span style={{ color: C.text }}>{interpolate(pT, [0, 1], [1, purity], clamp).toFixed(3)}</span></span>
            </div>
          </div>
          <div style={{ opacity: ramp(frame, 262, 276) * (1 - ramp(frame, 352, 360, IN)), position: "absolute" }}>
            <Tex expr="|\psi\rangle = \tfrac{1}{\sqrt2}\big(|{\color{#60b0df}A}{\color{#ea824b}A}\rangle + |{\color{#60b0df}B}{\color{#ea824b}B}\rangle\big)" size={58} />
          </div>
        </div>
        {/* Joint distribution */}
        <div style={{ position: "absolute", left: 1170, top: 150 }}>
          <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.muted, marginBottom: 14 }}>
            JOINT OUTCOMES · <span style={{ color: C.bob }}>BOB</span> <span style={{ color: C.alice }}>ALICE</span>
          </div>
          <JointBars v={v} height={330} />
        </div>
        <Caption from={140} to={240} x={1420} y={830} size={34}>{"Individual odds: still 50 / 50."}</Caption>
        <Caption from={160} to={240} x={1420} y={884} size={26} mono color={C.q}>{"…but the BB amplitude flipped sign"}</Caption>
        <Caption from={268} to={352} x={1420} y={830} size={34}>{"AB and BA cancel to zero."}</Caption>
        <Caption from={4} to={110} x={70} y={850} align="left" size={40}>{"Link Bob's settlement to Alice's."}</Caption>
      </AbsoluteFill>
      {uiZoomOut ? (
        <AbsoluteFill style={{ opacity: ramp(frame, 360, 370) }}>
          <Slam from={362} to={478} y="40%" size={130}>Unknown alone.</Slam>
          <Slam from={378} to={478} y="58%" size={130} color={C.q} style={{ textShadow: `0 0 50px ${C.q}55` }}>Certain together.</Slam>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: SANS, fontSize: 30, color: C.muted, opacity: ramp(frame, 396, 410) * (1 - ramp(frame, 470, 478)) }}>
            Each settlement is 50/50 on its own. Measured together, they always agree.
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 860, textAlign: "center", fontFamily: MONO, fontSize: 22, color: C.dim, opacity: ramp(frame, 404, 418) * (1 - ramp(frame, 470, 478)) }}>
            Neither player can steer the other's result by local moves alone.
          </div>
        </AbsoluteFill>
      ) : null}
      <Flash at={122} len={12} peak={0.4} color={C.q} />
      <Flash at={252} len={10} peak={0.3} color={C.alice} />
      <Flash at={362} len={10} peak={0.4} />
      <Sfx name="click" at={26} />
      <Sfx name="click" at={120} />
      <Sfx name="shimmer" at={124} volume={0.7} />
      <Sfx name="click" at={184} />
      <Sfx name="click" at={250} />
      <Sfx name="data" at={254} volume={0.5} />
      <Sfx name="whoosh" at={356} volume={0.5} />
    </AbsoluteFill>
  );
};
