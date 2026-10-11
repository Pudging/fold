import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { clamp, IN, OUT, ramp } from "../components/anim";
import { Background, Flash, Kicker, Slam } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { Sfx } from "../components/Sfx";
import { COUNTS, EVENTS, FINAL, LAST_TURN, NAMES, SHOTS, WINNER, type TLShot } from "../timelapse";

// Twelve bars: the whole seeded match, setup to the winning road, at speed.
const PCOLOR = [C.alice, C.bob];
const WIN_AT = 600; // bar 10 of the section: the winner hit in the score
const FRAME = { x: 70, y: 190, s: 0.6 };

const current = (frame: number) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (SHOTS[k].start <= frame) i = k;
  return i;
};

const ShotImage: React.FC<{ shot: TLShot; frame: number }> = ({ shot, frame }) => {
  let src = shot.src;
  if (shot.burst && frame >= shot.start) {
    const step = Math.max(2, (shot.dur * 0.75) / shot.burst.length);
    const k = Math.floor((frame - shot.start) / step);
    if (k < shot.burst.length) src = shot.burst[k];
    else src = shot.burst[shot.burst.length - 1];
  }
  return <Img src={staticFile(`capture/${src}`)} style={{ position: "absolute", width: 1920, height: 1080 }} />;
};

const Chart: React.FC<{ frame: number; idx: number }> = ({ frame, idx }) => {
  const W = 540, H = 250, maxT = LAST_TURN, x = (t: number) => (t / maxT) * W, y = (s: number) => H - (s / 10) * H;
  const upto = SHOTS.slice(0, idx + 1);
  const path = (p: number) => {
    let d = "", last = -1;
    for (const s of upto) {
      const px = x(s.turn), py = y(s.scores[p]);
      if (last < 0) d += `M${px} ${py}`;
      else d += `H${px}V${py}`;
      last = px;
    }
    return d;
  };
  return (
    <svg width={W + 40} height={H + 34} style={{ overflow: "visible" }}>
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <g key={v}>
          <line x1={0} x2={W} y1={y(v)} y2={y(v)} stroke="rgba(237,241,237,.08)" />
          <text x={W + 10} y={y(v) + 5} fill={C.dim} fontFamily={MONO} fontSize={13}>{v}</text>
        </g>
      ))}
      <line x1={0} x2={W} y1={y(10)} y2={y(10)} stroke="rgba(242,211,138,.4)" strokeDasharray="4 6" />
      {EVENTS.filter((e) => e.start <= frame).map((e, i) => (
        <g key={i} transform={`translate(${x(e.turn)} ${H + 16})`}>
          <path d="M0 -6 L6 0 L0 6 L-6 0Z" fill={e.kind === "collapse" ? "#fff" : C.q} opacity={e.kind === "collapse" ? 0.9 : 0.75} />
        </g>
      ))}
      {[0, 1].map((p) => <path key={p} d={path(p)} fill="none" stroke={PCOLOR[p]} strokeWidth={3.5} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 6px ${PCOLOR[p]}88)` }} />)}
      {[0, 1].map((p) => {
        const s = upto[upto.length - 1];
        return <circle key={p} cx={x(s.turn)} cy={y(s.scores[p])} r={6} fill={PCOLOR[p]} />;
      })}
    </svg>
  );
};

export const Timelapse: React.FC = () => {
  const frame = useCurrentFrame();
  const idx = current(frame);
  const shot = SHOTS[idx];
  const prev = SHOTS[idx - 1];
  const sinceCut = frame - shot.start;
  const lastEvent = [...EVENTS].reverse().find((e) => e.start <= frame);
  const evAge = lastEvent ? frame - lastEvent.start : 999;
  const isWin = frame >= WIN_AT - 6;
  const mainO = 1 - ramp(frame, WIN_AT - 6, WIN_AT + 4, IN);
  const tilt = interpolate(frame, [0, 600], [9, 5], clamp);
  const pulse = shot.event ? Math.max(0, 1 - sinceCut / 14) : 0;
  const counts = EVENTS.filter((e) => e.start <= frame);
  const moves = counts.filter((e) => e.kind !== "collapse").length;
  const measured = counts.filter((e) => e.kind === "collapse").length;
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(96,176,223,0.07)" />
      <AbsoluteFill style={{ opacity: mainO }}>
        <Kicker n="05" text={`ONE FULL MATCH · ${LAST_TURN} TURNS`} from={0} to={WIN_AT} />
        <div style={{ position: "absolute", left: FRAME.x, top: FRAME.y, width: 1920 * FRAME.s, height: 1080 * FRAME.s, perspective: 2400 }}>
          <div
            style={{
              position: "absolute", inset: 0, transformStyle: "preserve-3d",
              transform: `rotateY(${tilt}deg) rotateX(${2}deg) scale(${1 + pulse * 0.012})`,
              transformOrigin: "100% 50%",
            }}
          >
            <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, scale: String(FRAME.s), transformOrigin: "0 0", borderRadius: 22, overflow: "hidden", boxShadow: `0 50px 140px rgba(0,0,0,.7), 0 0 0 2px rgba(255,255,255,.1), 0 0 ${80 + 120 * pulse}px rgba(201,178,245,${0.12 + 0.35 * pulse})` }}>
              {prev && sinceCut < 2 && !shot.burst ? <Img src={staticFile(`capture/${prev.src}`)} style={{ position: "absolute", width: 1920, height: 1080 }} /> : null}
              <div style={{ position: "absolute", inset: 0, opacity: shot.burst ? 1 : Math.min(1, (sinceCut + 1) / 2) }}>
                <ShotImage shot={shot} frame={frame} />
              </div>
              {shot.ping && sinceCut < 16 ? (
                <div
                  style={{
                    position: "absolute", left: shot.ping.x, top: shot.ping.y, width: 0, height: 0,
                  }}
                >
                  <div style={{
                    position: "absolute", left: -60 * ramp(sinceCut, 0, 16), top: -60 * ramp(sinceCut, 0, 16),
                    width: 120 * ramp(sinceCut, 0, 16), height: 120 * ramp(sinceCut, 0, 16), borderRadius: "50%",
                    border: `4px solid ${shot.ping.who < 0 ? "#fff" : PCOLOR[shot.ping.who]}`, opacity: 1 - ramp(sinceCut, 4, 16),
                    boxShadow: `0 0 30px ${shot.ping.who < 0 ? C.q : PCOLOR[shot.ping.who]}`,
                  }} />
                </div>
              ) : null}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 70%, rgba(6,13,17,.25))" }} />
            </div>
          </div>
        </div>
        {/* speed tag */}
        <div style={{ position: "absolute", left: FRAME.x + 6, top: FRAME.y - 52, fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: shot.event ? C.qBright : C.muted, display: "flex", gap: 14, alignItems: "center" }}>
          <span style={{ fontSize: 22 }}>{shot.event ? "▶" : "▶▶"}</span>
          {shot.event ? "REAL TIME · QUANTUM MOVE" : "TIMELAPSE · EVERY ACTION, IN ORDER"}
        </div>
        {/* event callout */}
        {lastEvent && evAge < 70 ? (
          <div style={{ position: "absolute", left: FRAME.x + 10, top: 880, opacity: ramp(evAge, 0, 6) * (1 - ramp(evAge, 58, 70, IN)), translate: `0 ${(1 - ramp(evAge, 0, 10, OUT)) * 18}px`, display: "flex", alignItems: "center", gap: 22 }}>
            <div style={{ width: 16, height: 16, rotate: "45deg", background: lastEvent.kind === "collapse" ? "#fff" : C.q, boxShadow: `0 0 24px ${C.q}` }} />
            <div>
              <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: PCOLOR[lastEvent.who] }}>{NAMES[lastEvent.who].toUpperCase()} · TURN {lastEvent.turn}</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 54, letterSpacing: -1.6, color: C.text, marginTop: 4 }}>
                {lastEvent.text}
                <span style={{ color: lastEvent.kind === "collapse" ? C.gold : C.q, marginLeft: 22, fontSize: 40 }}>{lastEvent.detail}</span>
              </div>
            </div>
          </div>
        ) : null}
        {/* HUD */}
        <div style={{ position: "absolute", left: 1290, top: 176, width: 560 }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 4, color: C.muted }}>{shot.turn === 0 ? "SETUP" : "TURN"}</div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 116, lineHeight: 1, color: C.text, fontVariantNumeric: "tabular-nums" }}>
                {String(shot.turn).padStart(2, "0")}<span style={{ fontSize: 40, color: C.dim }}>/{LAST_TURN}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 26, paddingBottom: 10 }}>
              {[0, 1].map((p) => (
                <div key={p} style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: PCOLOR[p] }}>{NAMES[p].toUpperCase()}</div>
                  <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, lineHeight: 1, color: PCOLOR[p], fontVariantNumeric: "tabular-nums" }}>{shot.scores[p]}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 34, fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: C.dim, marginBottom: 12 }}>VICTORY POINTS · FIRST TO 10</div>
          <Chart frame={frame} idx={idx} />
          <div style={{ display: "flex", gap: 36, marginTop: 26 }}>
            {[["QUANTUM MOVES", moves], ["MEASUREMENTS", measured]].map(([k, v]) => (
              <div key={k as string}>
                <div style={{ fontFamily: MONO, fontSize: 14, letterSpacing: 3, color: C.muted }}>{k}</div>
                <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: 44, color: C.q, fontVariantNumeric: "tabular-nums" }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 8, height: 150, overflow: "hidden" }}>
            {counts.slice(-4).reverse().map((e, i) => (
              <div key={e.start} style={{ fontFamily: MONO, fontSize: 16, letterSpacing: 1.5, color: i === 0 ? C.text : C.muted, opacity: 1 - i * 0.2, display: "flex", gap: 12 }}>
                <span style={{ color: C.dim, width: 44 }}>T{e.turn}</span>
                <span style={{ color: PCOLOR[e.who], width: 64 }}>{NAMES[e.who].toUpperCase()}</span>
                <span>{e.text} · {e.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {isWin ? (
        <AbsoluteFill style={{ opacity: ramp(frame, WIN_AT - 6, WIN_AT + 2) }}>
          <Screen shots={[{ f: 0, src: SHOTS[SHOTS.length - 1].src }]} cams={[cam(WIN_AT - 6, 1200, 480, 1.05, 6, -8), cam(WIN_AT + 60, 1500, 300, 1.45, 2, -4), cam(720, 1560, 280, 1.55, 1, -3)]} />
          <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,13,17,.92) 0%, rgba(6,13,17,.6) 36%, transparent 58%)" }} />
          <Slam from={WIN_AT + 2} to={722} x={110} y={420} align="left" size={150}>
            <span style={{ color: PCOLOR[WINNER] }}>{NAMES[WINNER]}</span>{" wins."}
          </Slam>
          <div style={{ position: "absolute", left: 114, top: 540, fontFamily: SANS, fontWeight: 800, fontSize: 64, color: C.text, opacity: ramp(frame, WIN_AT + 10, WIN_AT + 22) }}>
            {FINAL.scores[WINNER]} <span style={{ color: C.dim }}>–</span> <span style={{ color: PCOLOR[1 - WINNER] }}>{FINAL.scores[1 - WINNER]}</span>
            <span style={{ fontFamily: MONO, fontWeight: 500, fontSize: 24, letterSpacing: 4, color: C.muted, marginLeft: 28 }}>TURN {LAST_TURN}</span>
          </div>
          <div style={{ position: "absolute", left: 114, top: 660, fontFamily: MONO, fontSize: 20, letterSpacing: 3, lineHeight: 1.8, color: C.muted, opacity: ramp(frame, WIN_AT + 22, WIN_AT + 36) }}>
            {`${COUNTS.quantumMoves} QUANTUM MOVES · ${COUNTS.quantumBuilds} QUANTUM SETTLEMENTS · ${COUNTS.measurements} MEASUREMENTS`}
            <br />
            <span style={{ color: C.dim }}>SEEDED MATCH · DICE CHOSEN FOR PACING · NO ROBBER ROLLS</span>
          </div>
        </AbsoluteFill>
      ) : null}
      {EVENTS.map((e) => (e.kind === "collapse" ? <Flash key={e.start} at={Math.round(e.start)} len={8} peak={0.18} color={C.q} /> : null))}
      <Flash at={WIN_AT} len={14} peak={0.5} />
      <Sfx name="whoosh" at={4} volume={0.5} />
      {EVENTS.map((e) => <Sfx key={e.start} name={e.kind === "collapse" ? "collapse" : "shimmer"} at={Math.round(e.start)} volume={e.kind === "collapse" ? 0.45 : 0.3} />)}
      <Sfx name="coin" at={WIN_AT} volume={0.6} />
    </AbsoluteFill>
  );
};