import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, IN, OUT, ramp } from "./anim";

export const Background: React.FC<{ tint?: string; grid?: number }> = ({ tint = "rgba(60,110,130,0.18)", grid = 0.06 }) => {
  const frame = useCurrentFrame();
  const drift = frame * 0.15;
  const R = 34, w = Math.sqrt(3) * R, h = 1.5 * R;
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${tint}, transparent 70%), ${C.ink}` }}>
      <svg width="1920" height="1080" style={{ position: "absolute", opacity: grid }}>
        <defs>
          <pattern id="hex" width={w} height={h * 2} patternUnits="userSpaceOnUse" patternTransform={`translate(${drift} ${drift * 0.4})`}>
            <path
              d={`M${w / 2} 0 L${w} ${R / 2} L${w} ${R * 1.5} L${w / 2} ${R * 2} L0 ${R * 1.5} L0 ${R / 2} Z M${w / 2} ${R * 2} L${w / 2} ${h * 2}`}
              fill="none"
              stroke="#cfe3ea"
              strokeWidth="1"
            />
          </pattern>
          <radialGradient id="fade" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="m"><rect width="1920" height="1080" fill="url(#fade)" /></mask>
        </defs>
        <rect width="1920" height="1080" fill="url(#hex)" mask="url(#m)" />
      </svg>
    </AbsoluteFill>
  );
};

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2);
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "overlay", opacity }}>
      <svg width="1920" height="1080">
        <filter id={`g${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.2" />
        </filter>
        <rect width="1920" height="1080" filter={`url(#g${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.75 }) => (
  <AbsoluteFill style={{ pointerEvents: "none", background: `radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(0,0,0,${strength}))` }} />
);

export const Tex: React.FC<{ expr: string; size?: number; color?: string; style?: React.CSSProperties; display?: boolean }> = ({ expr, size = 48, color = C.text, style, display }) => (
  <span
    style={{ fontSize: size, color, lineHeight: 1.1, whiteSpace: "nowrap", ...style }}
    dangerouslySetInnerHTML={{ __html: katex.renderToString(expr, { throwOnError: true, displayMode: !!display, output: "html", trust: true, strict: false }) }}
  />
);

// Section kicker: "01 — INTERFERENCE"
export const Kicker: React.FC<{ n?: string; text: string; from: number; to: number; x?: number; y?: number; color?: string }> = ({ n, text, from, to, x = 96, y = 84, color = C.q }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, from, from + 14);
  const o = Math.min(t, 1 - ramp(frame, to - 8, to, IN));
  const chars = Math.round(interpolate(frame, [from, from + 18], [0, text.length], clamp));
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: MONO, fontSize: 22, letterSpacing: 4, color, opacity: o, display: "flex", gap: 18, alignItems: "center" }}>
      {n ? <span style={{ color: C.text, opacity: 0.55 }}>{n}</span> : null}
      <span style={{ width: 60 * t, height: 1, background: color, display: "inline-block" }} />
      <span>{text.slice(0, chars)}</span>
    </div>
  );
};

// Big kinetic line with blur-in
export const Slam: React.FC<{
  children: React.ReactNode;
  from: number;
  to: number;
  size?: number;
  x?: number | string;
  y?: number | string;
  align?: "left" | "center" | "right";
  color?: string;
  weight?: number;
  style?: React.CSSProperties;
  inLen?: number;
}> = ({ children, from, to, size = 120, x = "50%", y = "50%", align = "center", color = C.text, weight = 800, style, inLen = 9 }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;
  const t = ramp(frame, from, from + inLen);
  const out = ramp(frame, to - 7, to, IN);
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: `${tx} -50%`,
        fontFamily: SANS,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: -size * 0.035,
        lineHeight: 1.0,
        color,
        whiteSpace: "pre",
        textAlign: align,
        opacity: t * (1 - out),
        filter: `blur(${(1 - t) * 14 + out * 10}px)`,
        scale: String(1.12 - 0.12 * t + out * 0.04),
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Speaker line for the dialogue beats
export const Line: React.FC<{ who: "ALICE" | "BOB"; text: string; from: number; to: number; y?: number; size?: number }> = ({ who, text, from, to, y = 540, size = 92 }) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;
  const chars = Math.round(interpolate(frame, [from + 4, from + 4 + text.length * 1.3], [0, text.length], clamp));
  const o = Math.min(ramp(frame, from, from + 6), 1 - ramp(frame, to - 6, to, IN));
  const color = who === "ALICE" ? C.alice : C.bob;
  const caret = Math.floor(frame / 8) % 2 === 0 || chars < text.length;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, translate: "0 -50%", textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 6, color, marginBottom: 26, display: "flex", justifyContent: "center", alignItems: "center", gap: 14 }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 18px ${color}` }} />
        {who}
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: size, letterSpacing: -size * 0.03, color: C.text }}>
        {text.slice(0, chars)}
        <span style={{ opacity: caret ? 1 : 0, color, fontWeight: 400 }}>▍</span>
      </div>
    </div>
  );
};

export const Caption: React.FC<{ children: React.ReactNode; from: number; to: number; x?: number; y?: number; align?: "left" | "center" | "right"; size?: number; color?: string; mono?: boolean }> = ({
  children, from, to, x = 960, y = 980, align = "center", size = 30, color = C.text, mono,
}) => {
  const frame = useCurrentFrame();
  if (frame < from - 1 || frame > to + 1) return null;
  const t = ramp(frame, from, from + 10);
  const o = Math.min(t, 1 - ramp(frame, to - 8, to, IN));
  const tx = align === "center" ? "-50%" : align === "right" ? "-100%" : "0";
  return (
    <div
      style={{
        position: "absolute", left: x, top: y, translate: `${tx} ${(1 - t) * 16}px`, opacity: o,
        fontFamily: mono ? MONO : SANS, fontWeight: mono ? 500 : 600, fontSize: size, color, letterSpacing: mono ? 1 : -0.3, whiteSpace: "pre", textAlign: align,
      }}
    >
      {children}
    </div>
  );
};

export const Flash: React.FC<{ at: number; len?: number; color?: string; peak?: number }> = ({ at, len = 14, color = "#fff", peak = 0.85 }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [at, at + 1, at + len], [0, peak, 0], { ...clamp, easing: OUT });
  if (o <= 0) return null;
  return <AbsoluteFill style={{ background: color, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};

export const Scramble: React.FC<{ text: string; from: number; dur?: number; style?: React.CSSProperties }> = ({ text, from, dur = 18, style }) => {
  const frame = useCurrentFrame();
  const glyphs = "01ψ⟩⟨|+−HZX∑√";
  const done = Math.floor(interpolate(frame, [from, from + dur], [0, text.length], clamp));
  const s = text
    .split("")
    .map((ch, i) => (i < done || ch === " " ? ch : glyphs[Math.floor(random(`${i}-${Math.floor(frame / 2)}`) * glyphs.length)]))
    .join("");
  return <span style={{ fontFamily: MONO, ...style }}>{frame < from ? "" : s}</span>;
};

export { OUT };
