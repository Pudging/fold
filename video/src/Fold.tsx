import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Sequence, staticFile, useVideoConfig } from "remotion";
import { BAR, C } from "./theme";
import { Grain, Vignette } from "./components/Type";
import { ColdOpen, RuleBreak, Title } from "./scenes/Opening";
import { Classic } from "./scenes/Classic";
import { Split } from "./scenes/Split";
import { Interference } from "./scenes/Interference";
import { Harvest1 } from "./scenes/Harvest";
import { Entangle } from "./scenes/Entangle";
import { Measure } from "./scenes/Measure";
import { Outro, UnderHood } from "./scenes/Ending";
import { TurnLoop } from "./scenes/TurnLoop";
import { Timelapse } from "./scenes/Timelapse";

// Scene boundaries are bar-locked to the score (audio/score.py).
export const SCENES = [
  { name: "Cold open", bar: 0, bars: 4, C: ColdOpen },
  { name: "Title", bar: 4, bars: 2, C: Title },
  { name: "Classic Catan", bar: 6, bars: 5, C: Classic },
  { name: "Rule break", bar: 11, bars: 2, C: RuleBreak },
  { name: "Turn loop", bar: 13, bars: 10, C: TurnLoop },
  { name: "Split", bar: 23, bars: 5, C: Split },
  { name: "Interference", bar: 28, bars: 9, C: Interference },
  { name: "Harvest", bar: 37, bars: 3, C: Harvest1 },
  { name: "Entanglement", bar: 40, bars: 8, C: Entangle },
  { name: "Measurement", bar: 48, bars: 5, C: Measure },
  { name: "Timelapse", bar: 53, bars: 12, C: Timelapse },
  { name: "Under the hood", bar: 65, bars: 5, C: UnderHood },
  { name: "Outro", bar: 70, bars: 4, C: Outro },
] as const;

export const TOTAL_FRAMES = 74 * BAR;

export const Fold: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      {SCENES.map((s) => (
        <Sequence key={s.name} name={s.name} from={s.bar * BAR} durationInFrames={s.bars * BAR} premountFor={fps}>
          <s.C />
        </Sequence>
      ))}
      <Vignette strength={0.55} />
      <Grain opacity={0.05} />
      <Audio src={staticFile("audio/score.wav")} volume={0.8} />
    </AbsoluteFill>
  );
};
