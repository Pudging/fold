import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, MONO } from "../theme";
import { ramp } from "../components/anim";
import { Background, Caption, Slam } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { Ring } from "../components/Viz";
import { Sfx } from "../components/Sfx";

// Five bars: Roll / Build / Trade / Upgrade / It's Catan.
export const Classic: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background />
      <Screen
        shots={[
          { f: 0, src: "066-roll-hover.jpg" },
          { f: 30, src: "067-rolled.jpg" },
          { f: 60, src: "061-road-mode.jpg" },
          { f: 80, src: "062-road-hover.jpg" },
          { f: 97, src: "063-road-built.jpg" },
          { f: 120, src: "057-trade-form.jpg" },
          { f: 139, src: "058-trade-offer.jpg" },
          { f: 152, src: "059-trade-accept-hover.jpg" },
          { f: 165, src: "060-trade-accepted.jpg" },
          { f: 180, src: "068-city-mode.jpg" },
          { f: 196, src: "069-city-hover.jpg" },
          { f: 211, src: "070-city-built.jpg" },
        ]}
        cams={[
          cam(0, 1350, 330, 1.45, 10, -14),
          cam(56, 1560, 240, 1.75, 4, -6),
          cam(60, 900, 470, 1.45, 8, 10),
          cam(116, 690, 440, 2.15, 2, 4),
          cam(120, 960, 640, 1.35, -6, 0),
          cam(176, 960, 560, 1.75, 0, 0),
          cam(180, 1050, 560, 1.5, 8, -10),
          cam(236, 853, 575, 2.4, 2, -3),
          cam(240, 960, 540, 1.05, 14, 0),
          cam(300, 960, 560, 0.86, 18, 0, 0),
        ]}
        cursor={[
          { f: 8, x: 1500, y: 420 },
          { f: 28, x: 1751, y: 270, click: true },
          { f: 60, x: 1751, y: 289 },
          { f: 78, x: 664, y: 427 },
          { f: 96, x: 664, y: 427, click: true },
          { f: 120, x: 960, y: 760 },
          { f: 136, x: 960, y: 801, click: true },
          { f: 150, x: 960, y: 560 },
          { f: 163, x: 960, y: 560, click: true },
          { f: 180, x: 1751, y: 401 },
          { f: 194, x: 853, y: 572 },
          { f: 210, x: 853, y: 572, click: true },
          { f: 240, x: 1500, y: 360 },
        ]}
      >
        {() => <Ring x={853} y={572} r={34} from={212} to={240} color={C.gold} />}
      </Screen>
      <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,13,17,.85) 0%, rgba(6,13,17,.35) 38%, transparent 60%)" }} />
      <Slam from={4} to={58} x={110} y="74%" align="left" size={170}>Roll.</Slam>
      <Slam from={62} to={118} x={110} y="74%" align="left" size={170}>Build.</Slam>
      <Slam from={122} to={178} x={110} y="74%" align="left" size={170}>Trade.</Slam>
      <Slam from={182} to={238} x={110} y="74%" align="left" size={170}>Upgrade.</Slam>
      <Slam from={242} to={300} x={110} y="70%" align="left" size={150}>{"Every rule\nyou know."}</Slam>
      <Caption from={248} to={300} x={114} y={890} align="left" mono size={22} color={C.muted}>
        {"FIRST TO 10 · ROADS · TRADES · CITIES · ROBBER · DEV CARDS · LONGEST ROAD"}
      </Caption>
      <div style={{ position: "absolute", right: 70, top: 60, fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: C.muted, opacity: ramp(frame, 4, 20) * 0.9 }}>
        LIVE GAMEPLAY · 2 PLAYERS · ONE SCREEN
      </div>
      <Sfx name="click" at={28} />
      <Sfx name="dice" at={29} volume={0.8} />
      <Sfx name="click" at={96} />
      <Sfx name="click" at={136} />
      <Sfx name="click" at={163} />
      <Sfx name="coin" at={165} volume={0.6} />
      <Sfx name="click" at={210} />
      <Sfx name="whoosh" at={238} volume={0.4} />
    </AbsoluteFill>
  );
};
