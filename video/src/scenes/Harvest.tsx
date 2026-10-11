import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, MONO } from "../theme";
import { ramp } from "../components/anim";
import { Background, Caption, Flash, Slam } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { Box, Ring } from "../components/Viz";
import { Sfx } from "../components/Sfx";
import { boardToCss, node, stateAtBeat } from "../engine";

// Harvest 1: Alice's interfered settlement (B · 100%) meets a real roll.
export const Harvest1: React.FC = () => {
  const frame = useCurrentFrame();
  const g = stateAtBeat("harvest1");
  const alice = boardToCss(node(g, 29).x, node(g, 29).y);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background />
      <Screen
        shots={[
          { f: 0, src: "118-harvest1Roll-ready.jpg" },
          { f: 24, src: "119-roll-hover.jpg" },
          { f: 46, src: "120-rolled.jpg" },
          ...[0, 1, 2, 3, 4, 5].map((i) => ({ f: 49 + i * 8, src: `b-120-rolled-${i}.jpg`, fade: 3 })),
          { f: 120, src: "121-harvest1-result.jpg", fade: 4 },
        ]}
        cams={[
          cam(0, 1100, 470, 1.45, 6, -8),
          cam(40, 1250, 380, 1.5, 4, -6),
          cam(46, 760, 520, 1.8, 0, 0),
          cam(92, 760, 540, 1.95, 0, 0),
          cam(96, 420, 150, 1.75, 2, 0),
          cam(116, 420, 150, 1.85, 2, 0),
          cam(120, 900, 760, 1.55, 6, 0),
          cam(180, 900, 800, 1.65, 6, 0),
        ]}
        cursor={[
          { f: 2, x: 1300, y: 500 },
          { f: 22, x: 1751, y: 270 },
          { f: 44, x: 1751, y: 270, click: true },
        ]}
      >
        {() => (
          <>
            <Ring x={alice.x} y={alice.y} r={40} from={70} to={96} color={C.alice} />
            <Box x={140} y={69} w={246} h={30} from={98} to={120} color={C.q} />
            <Box x={694} y={986} w={90} h={75} from={124} color={C.alice} />
          </>
        )}
      </Screen>
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(6,13,17,.85) 0%, transparent 28%)" }} />
      <Caption from={4} to={44} x={960} y={960} size={40}>{"Roll. A producing tile touches a ghost."}</Caption>
      <Slam from={50} to={110} y="88%" size={72}>{"Measured before anything is paid."}</Slam>
      <Caption from={114} to={180} x={960} y={950} size={40}>
        {"Predicted "}
        <span style={{ color: C.alice }}>B · 100%</span>
        {".  Measured "}
        <span style={{ color: C.alice }}>B</span>
        {".  Alice collects "}
        <span style={{ color: C.gold }}>+3 brick</span>
        {"."}
      </Caption>
      <div style={{ position: "absolute", right: 70, top: 60, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: C.muted, opacity: ramp(frame, 0, 12) }}>TURN 13 · ALICE</div>
      <Flash at={46} len={12} peak={0.6} color={C.qBright} />
      <Sfx name="click" at={44} />
      <Sfx name="dice" at={44} />
      <Sfx name="collapse" at={47} volume={0.9} />
      <Sfx name="coin" at={116} volume={0.7} />
    </AbsoluteFill>
  );
};
