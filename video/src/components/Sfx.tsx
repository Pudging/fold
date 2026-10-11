import React from "react";
import { Audio } from "@remotion/media";
import { Sequence, staticFile } from "remotion";

export type SfxName = "click" | "whoosh" | "dice" | "type" | "collapse" | "shimmer" | "data" | "coin";

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 1 }) => (
  <Sequence from={at} durationInFrames={90} layout="none">
    <Audio src={staticFile(`audio/${name}.wav`)} volume={volume * 0.8} />
  </Sequence>
);
