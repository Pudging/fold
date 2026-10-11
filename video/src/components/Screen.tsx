import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { clamp, EASE, keyed, OUT, type Key } from "./anim";

export type Cam = Key<{ x: number; y: number; z: number; rx: number; ry: number; rz: number }>;
export type ShotKey = { f: number; src: string; fade?: number };
export type CursorKey = { f: number; x: number; y: number; click?: boolean };

export const cam = (f: number, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0): Cam => ({ f, x, y, z, rx, ry, rz });

const Arrow: React.FC<{ press: number }> = ({ press }) => (
  <svg width="30" height="38" viewBox="0 0 30 38" style={{ display: "block", scale: String(1 - 0.18 * press), transformOrigin: "4px 4px" }}>
    <path d="M3 2 L3 30 L10 23.5 L15 35 L20 33 L15 21.5 L25 21.5 Z" fill="#fff" stroke="#111" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

const CursorLayer: React.FC<{ keys: CursorKey[]; frame: number; z: number }> = ({ keys, frame, z }) => {
  if (!keys.length || frame < keys[0].f - 6) return null;
  const x = keyed(frame, keys as Key<{ x: number; y: number }>[], "x", EASE);
  const y = keyed(frame, keys as Key<{ x: number; y: number }>[], "y", EASE);
  const s = 1 / Math.pow(z, 0.75);
  const last = [...keys].reverse().find((k) => k.click && k.f <= frame);
  const since = last ? frame - last.f : 99;
  const press = since < 6 ? Math.sin((since / 6) * Math.PI) : 0;
  const ring = since < 16 ? since / 16 : 1;
  return (
    <div style={{ position: "absolute", left: x, top: y, width: 0, height: 0, zIndex: 50 }}>
      {last && since < 16 ? (
        <div
          style={{
            position: "absolute",
            left: -40 * ring * s - 6,
            top: -40 * ring * s - 6,
            width: (80 * ring + 12) * s,
            height: (80 * ring + 12) * s,
            borderRadius: "50%",
            border: `${3 * s}px solid rgba(255,255,255,${0.9 * (1 - ring)})`,
            boxShadow: `0 0 ${30 * s}px rgba(201,178,245,${0.8 * (1 - ring)})`,
          }}
        />
      ) : null}
      <div style={{ position: "absolute", left: -3 * s, top: -2 * s, scale: String(s), transformOrigin: "0 0", filter: "drop-shadow(0 4px 8px rgba(0,0,0,.5))" }}>
        <Arrow press={press} />
      </div>
    </div>
  );
};

// A framed viewport onto a Screen; the Screen's camera point lands at the crop centre.
export const Crop: React.FC<{ x: number; y: number; w: number; h: number; radius?: number; opacity?: number; children: React.ReactNode; border?: string }> = ({ x, y, w, h, radius = 20, opacity = 1, children, border = "rgba(255,255,255,.12)" }) => (
  <div style={{ position: "absolute", left: x, top: y, width: w, height: h, overflow: "hidden", borderRadius: radius, opacity, boxShadow: `0 40px 120px rgba(0,0,0,.6), 0 0 0 1px ${border}`, background: C.table }}>
    <div style={{ position: "absolute", left: w / 2 - 960, top: h / 2 - 540, width: 1920, height: 1080 }}>{children}</div>
  </div>
);

export const Screen: React.FC<{
  shots: ShotKey[];
  cams: Cam[];
  cursor?: CursorKey[];
  children?: (frame: number) => React.ReactNode;
  radius?: number;
  glow?: string;
  dim?: number;
}> = ({ shots, cams, cursor = [], children, radius = 18, glow, dim = 0 }) => {
  const frame = useCurrentFrame();
  const v = (p: keyof Cam) => keyed(frame, cams, p as never, EASE);
  const x = v("x"), y = v("y"), z = v("z"), rx = v("rx"), ry = v("ry"), rz = v("rz");
  let current = 0;
  shots.forEach((s, i) => { if (s.f <= frame) current = i; });
  const cur = shots[current], prev = shots[current - 1];
  const fadeT = cur.fade && prev ? interpolate(frame, [cur.f, cur.f + cur.fade], [0, 1], { ...clamp, easing: OUT }) : 1;
  return (
    <AbsoluteFill style={{ perspective: 2600, perspectiveOrigin: "50% 50%", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 960 - x,
          top: 540 - y,
          width: 1920,
          height: 1080,
          transformOrigin: `${x}px ${y}px`,
          transform: `scale(${z}) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            overflow: "hidden",
            boxShadow: `0 60px 140px rgba(0,0,0,.65), 0 0 0 1px rgba(255,255,255,.10)${glow ? `, 0 0 120px ${glow}` : ""}`,
            background: C.table,
          }}
        >
          {prev && fadeT < 1 ? <Img src={staticFile(`capture/${prev.src}`)} style={{ position: "absolute", width: 1920, height: 1080 }} /> : null}
          <Img src={staticFile(`capture/${cur.src}`)} style={{ position: "absolute", width: 1920, height: 1080, opacity: fadeT }} />
          {dim ? <div style={{ position: "absolute", inset: 0, background: `rgba(4,10,14,${dim})` }} /> : null}
        </div>
        {children ? children(frame) : null}
        <CursorLayer keys={cursor} frame={frame} z={z} />
      </div>
    </AbsoluteFill>
  );
};
