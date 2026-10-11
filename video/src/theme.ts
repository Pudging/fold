import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

export const { fontFamily: SANS } = loadManrope("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
export const { fontFamily: MONO } = loadMono("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

export const C = {
  ink: "#060d11",
  deep: "#0a161c",
  table: "#142d37",
  text: "#edf1ed",
  muted: "#8fa3ab",
  dim: "#4d6169",
  alice: "#ea824b",
  bob: "#60b0df",
  q: "#c9b2f5",
  qBright: "#e6dbff",
  gold: "#f2d38a",
  line: "rgba(237,241,237,0.14)",
};

export const BAR = 60; // frames per bar at 120 BPM, 30 fps
export const bars = (n: number) => Math.round(n * BAR);
