import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { ramp } from "../components/anim";
import { Background, Caption, Flash, Slam, Tex } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { Ring, StateGrid } from "../components/Viz";
import { Sfx } from "../components/Sfx";
import { amplitudes, boardToCss, node, stateAtBeat } from "../engine";

// Bars 39–44: build-up, one bar of silence, then the measurement hit on bar 42 (local frame 180).
export const Measure: React.FC = () => {
  const frame = useCurrentFrame();
  const bell = stateAtBeat("bell");
  const probs = amplitudes(bell).map((a) => a.p);
  const after = stateAtBeat("harvest2");
  const bobAt = after.board.nodes[18].owner === 1 ? 18 : 14;
  const aliceAt = after.board.nodes[41].owner === 0 ? 41 : 43;
  const winner = (bobAt === 14 ? 1 : 0) | (aliceAt === 43 ? 2 : 0);
  const pb = boardToCss(node(after, bobAt).x, node(after, bobAt).y);
  const pa = boardToCss(node(after, aliceAt).x, node(after, aliceAt).y);
  const HIT = 180;
  const hush = ramp(frame, 120, 132) * (1 - ramp(frame, HIT, HIT + 2));
  const split = frame < 228;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(201,178,245,0.10)" />
      {split ? (
        <AbsoluteFill style={{ opacity: 1 - ramp(frame, 220, 228) }}>
          <div style={{ position: "absolute", left: 70, top: 230, width: 1920 * 0.47, height: 1080 * 0.47, borderRadius: 18, overflow: "hidden", opacity: 1 - 0.75 * hush, boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)" }}>
            <div style={{ width: 1920, height: 1080, scale: "0.47", transformOrigin: "0 0", position: "relative" }}>
              <Screen
                shots={[
                  { f: 0, src: "172-harvest2Roll-ready.jpg" },
                  { f: 96, src: "173-roll-hover.jpg" },
                  { f: HIT, src: "174-rolled.jpg" },
                  ...[0, 1, 2, 3, 4, 5].map((i) => ({ f: HIT + 3 + i * 7, src: `b-174-rolled-${i}.jpg`, fade: 3 })),
                ]}
                cams={[cam(0, 1100, 480, 1.4), cam(170, 1150, 460, 1.5), cam(HIT, 900, 560, 1.7), cam(228, 860, 580, 1.8)]}
                cursor={[
                  { f: 10, x: 1300, y: 600 },
                  { f: 94, x: 1751, y: 270 },
                  { f: HIT - 2, x: 1751, y: 270 },
                  { f: HIT, x: 1751, y: 270, click: true },
                ]}
              >
                {() => (
                  <>
                    <Ring x={pb.x} y={pb.y} r={36} from={HIT + 4} color={C.bob} />
                    <Ring x={pa.x} y={pa.y} r={36} from={HIT + 8} color={C.alice} />
                  </>
                )}
              </Screen>
            </div>
          </div>
          <div style={{ position: "absolute", left: 70, top: 160, fontFamily: MONO, fontSize: 22, letterSpacing: 3, color: C.muted, opacity: 1 - hush }}>
            TURN 17 · ALICE ROLLS · TWO LINKED SETTLEMENTS
          </div>
          <div style={{ position: "absolute", left: 70, top: 770, opacity: ramp(frame, 20, 36) * (1 - hush) * (1 - ramp(frame, HIT - 2, HIT)) }}>
            <Tex expr="P(x) = |\langle x|\psi\rangle|^2" size={66} />
            <div style={{ fontFamily: SANS, fontSize: 30, color: C.muted, marginTop: 18 }}>
              Any roll touching a ghost measures <span style={{ color: C.text }}>the whole register</span>, jointly.
            </div>
          </div>
          <div style={{ position: "absolute", left: 1040, top: 150, opacity: ramp(frame, 0, 10) }}>
            <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.muted, marginBottom: 18, opacity: 1 - hush * 0.6 }}>
              SHARED REGISTER · 2⁸ = 256 BASIS STATES
            </div>
            <StateGrid probs={probs} cell={46} collapseAt={HIT} winner={winner} from={2} />
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.q, marginTop: 18, display: "flex", justifyContent: "space-between", width: 811 }}>
              <span>{frame < HIT ? "|00000000⟩ 50%   |00000011⟩ 50%" : `|${winner.toString(2).padStart(8, "0")}⟩ 100%`}</span>
              <span style={{ color: C.dim }}>254 × 0</span>
            </div>
          </div>
        </AbsoluteFill>
      ) : null}
      {frame >= 120 && frame < HIT ? (
        <div style={{ position: "absolute", left: 70, top: 790, fontFamily: SANS, fontWeight: 800, fontSize: 130, letterSpacing: -4, color: C.text, opacity: ramp(frame, 122, 140) * (0.75 + 0.25 * Math.sin(frame / 4)) }}>
          Measure.
        </div>
      ) : null}
      {!split || frame >= 220 ? (
        <AbsoluteFill style={{ opacity: ramp(frame, 220, 230) }}>
          <Screen
            shots={[{ f: 0, src: "b-174-rolled-5.jpg" }, { f: 256, src: "175-harvest2-result.jpg" }]}
            cams={[cam(220, 800, 580, 1.9, 4, 0), cam(300, 820, 600, 2.15, 2, 0)]}
          >
            {() => (
              <>
                <Ring x={pb.x} y={pb.y} r={34} from={226} color={C.bob} />
                <Ring x={pa.x} y={pa.y} r={34} from={230} color={C.alice} />
              </>
            )}
          </Screen>
          <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(6,13,17,.9) 0%, transparent 35%)" }} />
          <Slam from={226} to={300} y="80%" size={110}>
            <span style={{ color: C.bob }}>A</span>
            {" and "}
            <span style={{ color: C.alice }}>A</span>
            {". Together."}
          </Slam>
          <Caption from={238} to={300} y={985} size={28} color={C.muted}>{"This roll: AA. The other branch, BB, was just as likely. AB or BA: never."}</Caption>
        </AbsoluteFill>
      ) : null}
      <Slam from={HIT} to={226} x={70} y={855} align="left" size={130} color={C.qBright} inLen={4}>
        {"Collapsed."}
      </Slam>
      <Flash at={HIT} len={18} peak={0.95} />
      <Sfx name="click" at={HIT} />
      <Sfx name="dice" at={HIT} />
      <Sfx name="collapse" at={HIT + 1} />
      <Sfx name="coin" at={260} volume={0.6} />
    </AbsoluteFill>
  );
};
