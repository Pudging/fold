import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import "../engine/board.css";
import { clamp, OUT, ramp } from "./anim";
import { arg, mag, type Cx, type Vec } from "./qmath";
import { Tex } from "./Type";

const deg = (r: number) => {
  let d = Math.round((r * 180) / Math.PI);
  if (d <= -180) d += 360;
  return d;
};

export const Phasor: React.FC<{ c: Cx; size?: number; color?: string }> = ({ c, size = 92, color = C.q }) => {
  const r = size / 2 - 6, m = mag(c), a = arg(c);
  const x = size / 2 + Math.cos(a) * r * m, y = size / 2 - Math.sin(a) * r * m;
  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(207,227,234,.25)" strokeWidth="1.5" />
      <line x1={6} y1={size / 2} x2={size - 6} y2={size / 2} stroke="rgba(207,227,234,.15)" />
      <line x1={size / 2} y1={6} x2={size / 2} y2={size - 6} stroke="rgba(207,227,234,.15)" />
      <line x1={size / 2} y1={size / 2} x2={x} y2={y} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle cx={x} cy={y} r={5} fill="#fff" />
    </svg>
  );
};

// One row per basis state: phasor, complex amplitude, probability bar
export const AmpPanel: React.FC<{ v: Vec; labels: string[]; colors?: string[]; width?: number; highlight?: number[] }> = ({ v, labels, colors, width = 620 }) => (
  <div style={{ width, display: "flex", flexDirection: "column", gap: 18 }}>
    {v.map((c, i) => {
      const p = c[0] ** 2 + c[1] ** 2;
      const col = colors?.[i] ?? C.q;
      return (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 92 }}><Tex expr={labels[i]} size={38} /></div>
          <Phasor c={c} color={col} />
          <div style={{ fontFamily: MONO, fontSize: 24, color: C.text, width: 190, fontVariantNumeric: "tabular-nums" }}>
            {mag(c).toFixed(3)}
            <span style={{ color: C.muted }}> ∠{String(deg(arg(c)) * (mag(c) < 1e-3 ? 0 : 1)).padStart(4, " ")}°</span>
          </div>
          <div style={{ flex: 1, height: 16, background: "rgba(207,227,234,.08)", borderRadius: 8, overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: col, boxShadow: `0 0 18px ${col}`, borderRadius: 8 }} />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 26, color: C.text, width: 92, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{Math.round(p * 100)}%</div>
        </div>
      );
    })}
  </div>
);

// Two-qubit joint distribution with signed/phased amplitudes on top of each bar
export const JointBars: React.FC<{ v: Vec; height?: number }> = ({ v, height = 300 }) => {
  const order = [0, 1, 2, 3];
  const name = (i: number) => [(i & 1 ? "B" : "A"), (i & 2 ? "B" : "A")];
  return (
    <div style={{ display: "flex", gap: 38, alignItems: "flex-end", height: height + 150 }}>
      {order.map((i) => {
        const c = v[i], p = c[0] ** 2 + c[1] ** 2, [b, a] = name(i);
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 120 }}>
            <Phasor c={c} size={70} color={p > 1e-4 ? C.q : C.dim} />
            <div style={{ fontFamily: MONO, fontSize: 22, color: C.text, fontVariantNumeric: "tabular-nums" }}>{Math.round(p * 100)}%</div>
            <div style={{ width: 84, height: height, display: "flex", alignItems: "flex-end", background: "rgba(207,227,234,.05)", borderRadius: 8 }}>
              <div style={{ width: "100%", height: `${p * 100}%`, background: `linear-gradient(${C.qBright}, ${C.q})`, borderRadius: 8, boxShadow: `0 0 30px ${C.q}88` }} />
            </div>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 34, letterSpacing: 2 }}>
              <span style={{ color: C.bob }}>{b}</span>
              <span style={{ color: C.alice }}>{a}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// All 2^8 basis states of the shared register
export const StateGrid: React.FC<{ probs: number[]; cell?: number; collapseAt?: number; winner?: number; from?: number }> = ({ probs, cell = 46, collapseAt = 1e9, winner = 0, from = 0 }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, collapseAt, collapseAt + 10);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(16, ${cell}px)`, gap: 5 }}>
      {probs.map((p0, i) => {
        const appear = ramp(frame, from + ((i * 7) % 256) * 0.12, from + ((i * 7) % 256) * 0.12 + 8);
        const p = i === winner ? p0 + (1 - p0) * t : p0 * (1 - t);
        const flick = p < 1e-6 ? 0.05 + 0.04 * random(`c${i}-${Math.floor(frame / 3)}`) : 0;
        const on = Math.sqrt(p);
        return (
          <div
            key={i}
            style={{
              width: cell, height: cell, borderRadius: 6, opacity: appear,
              background: on > 0.01 ? `rgba(230,219,255,${0.25 + 0.75 * on})` : `rgba(207,227,234,${flick})`,
              boxShadow: on > 0.01 ? `0 0 ${20 + 50 * on}px ${C.q}` : "none",
              border: "1px solid rgba(207,227,234,.10)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: MONO, fontSize: 9, color: on > 0.01 ? "#1b1530" : "rgba(207,227,234,.25)",
            }}
          >
            {i.toString(2).padStart(8, "0").slice(4)}
          </div>
        );
      })}
    </div>
  );
};

// Circuit diagram matching the exported Qiskit program
export type CGate = { kind: "h" | "z" | "cz"; q: number; c?: number; col: number; label?: string };
export const Circuit: React.FC<{ wires: string[]; gates: CGate[]; from: number; perGate?: number; colW?: number; rowH?: number; measureCol?: number; labelW?: number }> = ({ wires, gates, from, perGate = 10, colW = 120, rowH = 86, measureCol, labelW = 110 }) => {
  const frame = useCurrentFrame();
  const x0 = labelW + 40;
  const W = x0 + colW * ((measureCol ?? Math.max(...gates.map((g) => g.col))) + 1.6);
  const wireT = ramp(frame, from, from + 20);
  return (
    <svg width={W} height={rowH * wires.length + 20} style={{ overflow: "visible" }}>
      {wires.map((w, i) => (
        <g key={i}>
          <text x={0} y={30 + i * rowH + 8} fill={C.muted} fontFamily={MONO} fontSize={22}>{w}</text>
          <line x1={labelW} y1={30 + i * rowH} x2={labelW + (W - labelW) * wireT} y2={30 + i * rowH} stroke="rgba(207,227,234,.45)" strokeWidth="2" />
        </g>
      ))}
      {gates.map((g, k) => {
        const t = ramp(frame, from + 12 + k * perGate, from + 12 + k * perGate + 10);
        const x = x0 + g.col * colW, y = 30 + g.q * rowH;
        if (g.kind === "cz") {
          const yc = 30 + (g.c as number) * rowH;
          return (
            <g key={k} opacity={t}>
              <line x1={x} y1={yc} x2={x} y2={yc + (y - yc) * t} stroke={C.q} strokeWidth="3" />
              <circle cx={x} cy={yc} r={10} fill={C.q} />
              <circle cx={x} cy={y} r={10 * t} fill={C.q} />
            </g>
          );
        }
        return (
          <g key={k} opacity={t} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * t})`}>
            <rect x={-30} y={-30} width={60} height={60} rx={8} fill="#1f1a33" stroke={C.q} strokeWidth="2.5" />
            <text x={0} y={11} textAnchor="middle" fill={C.qBright} fontFamily={SANS} fontWeight={800} fontSize={30}>{g.label ?? g.kind.toUpperCase()}</text>
          </g>
        );
      })}
      {measureCol !== undefined
        ? wires.map((_, i) => {
            const t = ramp(frame, from + 12 + gates.length * perGate + i * 4, from + 22 + gates.length * perGate + i * 4);
            const x = x0 + measureCol * colW, y = 30 + i * rowH;
            return (
              <g key={`m${i}`} opacity={t} transform={`translate(${x} ${y})`}>
                <rect x={-30} y={-28} width={60} height={56} rx={6} fill="#1a2a31" stroke="rgba(207,227,234,.6)" strokeWidth="2" />
                <path d="M-18 12 A20 20 0 0 1 18 12" fill="none" stroke="#cfe3ea" strokeWidth="2" />
                <line x1={0} y1={12} x2={14} y2={-12} stroke="#cfe3ea" strokeWidth="2" />
              </g>
            );
          })
        : null}
    </svg>
  );
};

export const Code: React.FC<{ text: string; from: number; cps?: number; size?: number; highlightLines?: number[] }> = ({ text, from, cps = 2.2, size = 24, highlightLines = [] }) => {
  const frame = useCurrentFrame();
  const n = Math.floor(Math.max(0, frame - from) * cps);
  const shown = text.slice(0, n);
  const lines = shown.split("\n");
  const color = (line: string) => {
    if (line.trim().startsWith("#")) return [{ t: line, c: "#6f8790" }];
    const parts: { t: string; c: string }[] = [];
    const re = /(from|import|print)|(\d+)|(circuit|backend|job|counts)|([().,=])/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line))) {
      if (m.index > last) parts.push({ t: line.slice(last, m.index), c: C.text });
      parts.push({ t: m[0], c: m[1] ? C.q : m[2] ? C.alice : m[3] ? C.bob : C.muted });
      last = m.index + m[0].length;
    }
    parts.push({ t: line.slice(last), c: C.text });
    return parts;
  };
  return (
    <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.65, whiteSpace: "pre" }}>
      {lines.map((l, i) => (
        <div key={i} style={{ display: "flex", background: highlightLines.includes(i) ? "rgba(201,178,245,.12)" : "transparent", borderLeft: highlightLines.includes(i) ? `3px solid ${C.q}` : "3px solid transparent", paddingLeft: 14 }}>
          <span style={{ width: 44, color: C.dim }}>{i + 1}</span>
          <span>
            {color(l).map((p, k) => <span key={k} style={{ color: p.c }}>{p.t}</span>)}
            {i === lines.length - 1 && n < text.length ? <span style={{ color: C.q }}>▍</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
};

export const Counter: React.FC<{ to: number; from: number; dur?: number; format?: (n: number) => string; style?: React.CSSProperties }> = ({ to, from, dur = 30, format = (n) => Math.round(n).toLocaleString("en-US"), style }) => {
  const frame = useCurrentFrame();
  const v = interpolate(frame, [from, from + dur], [0, to], { ...clamp, easing: OUT });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{format(v)}</span>;
};

// Board rendered by Fold's own SVG renderer
export const BoardVector: React.FC<{ svg: string; width: number; style?: React.CSSProperties }> = ({ svg, width, style }) => (
  <div style={{ width, height: width * (620 / 760), fontFamily: SANS, ...style }} dangerouslySetInnerHTML={{ __html: svg.replace('class="game-board"', `class="game-board" width="${width}" height="${width * (620 / 760)}"`) }} />
);

// Glowing ring on a CSS-space point (inside a Screen overlay)
export const Ring: React.FC<{ x: number; y: number; r: number; from: number; to?: number; color?: string; width?: number }> = ({ x, y, r, from, to = 1e9, color = C.q, width = 3 }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, from, from + 12);
  const o = Math.min(t, 1 - ramp(frame, to - 8, to));
  if (o <= 0) return null;
  const pulse = 1 + 0.06 * Math.sin((frame - from) / 5);
  return (
    <div style={{ position: "absolute", left: x - r * pulse, top: y - r * pulse, width: 2 * r * pulse, height: 2 * r * pulse, borderRadius: "50%", border: `${width}px solid ${color}`, boxShadow: `0 0 24px ${color}, inset 0 0 18px ${color}55`, opacity: o, scale: String(1.4 - 0.4 * t) }} />
  );
};

export const Box: React.FC<{ x: number; y: number; w: number; h: number; from: number; to?: number; color?: string }> = ({ x, y, w, h, from, to = 1e9, color = C.q }) => {
  const frame = useCurrentFrame();
  const t = ramp(frame, from, from + 12);
  const o = Math.min(t, 1 - ramp(frame, to - 8, to));
  if (o <= 0) return null;
  return <div style={{ position: "absolute", left: x - 6, top: y - 6, width: w + 12, height: h + 12, borderRadius: 8, border: `2.5px solid ${color}`, boxShadow: `0 0 26px ${color}88`, opacity: o }} />;
};
