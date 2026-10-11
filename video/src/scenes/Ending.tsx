import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, MONO, SANS } from "../theme";
import { IN, ramp } from "../components/anim";
import { Background, Flash, Kicker, Line, Tex } from "../components/Type";
import { cam, Screen } from "../components/Screen";
import { BoardVector, Circuit, Code, Counter } from "../components/Viz";
import { Sfx } from "../components/Sfx";
// @ts-expect-error untyped engine module
import { circuitPython } from "../engine/quantum.js";
import { stateAtBeat, svgFor } from "../engine";

export const UnderHood: React.FC = () => {
  const frame = useCurrentFrame();
  const bell = stateAtBeat("bell");
  const code = (circuitPython(bell.quantum.operations, 1024, 8) as string).trim();
  const stats: { n: React.ReactNode; label: string; at: number }[] = [
    { n: <Counter to={8} from={150} dur={20} />, label: "QUBITS, ONE SHARED STATEVECTOR", at: 150 },
    { n: <Counter to={256} from={160} dur={24} />, label: "COMPLEX AMPLITUDES, EXACT", at: 160 },
    { n: <Counter to={2000} from={170} dur={28} />, label: "GATES CROSS-CHECKED VS QISKIT", at: 170 },
    { n: <Tex expr="10^{-12}" size={74} color={C.text} />, label: "MAX DEVIATION ALLOWED", at: 180 },
  ];
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Background tint="rgba(96,176,223,0.08)" />
      <Kicker n="03" text="UNDER THE HOOD" from={0} to={300} />
      <div style={{ position: "absolute", left: 70, top: 160, width: 1920 * 0.42, height: 1080 * 0.42, borderRadius: 18, overflow: "hidden", boxShadow: "0 40px 120px rgba(0,0,0,.6), 0 0 0 1px rgba(255,255,255,.1)", opacity: ramp(frame, 0, 12) }}>
        <div style={{ width: 1920, height: 1080, scale: "0.42", transformOrigin: "0 0", position: "relative" }}>
          <Screen
            shots={[{ f: 0, src: "169-bell-psi.jpg" }, { f: 16, src: "170-bell-psi-open.jpg" }]}
            cams={[cam(0, 1500, 300, 1.4), cam(16, 960, 440, 2.1), cam(150, 960, 600, 2.4)]}
            cursor={[{ f: 2, x: 1700, y: 200 }, { f: 14, x: 1841, y: 29, click: true }]}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 70, top: 640, fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: C.muted, opacity: ramp(frame, 10, 24) }}>
        ψ INSPECTOR · LIVE STATE, PURITY, CIRCUIT
      </div>
      <div style={{ position: "absolute", left: 930, top: 150, width: 940, padding: "26px 28px", borderRadius: 16, background: "rgba(16,28,34,.92)", border: "1px solid rgba(255,255,255,.08)", opacity: ramp(frame, 6, 18) }}>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: 2, color: C.muted, marginBottom: 12 }}>fold_quantum_settlements.py · EXPORTED FROM THIS GAME</div>
        <Code text={code} from={14} cps={9} size={18} highlightLines={[4, 5, 6, 7]} />
      </div>
      <div style={{ position: "absolute", left: 90, top: 700, opacity: ramp(frame, 60, 70) }}>
        <Circuit
          wires={["Q1 · Bob", "Q2 · Alice"]}
          gates={[
            { kind: "h", q: 0, col: 0 },
            { kind: "h", q: 1, col: 0 },
            { kind: "cz", q: 1, c: 0, col: 1 },
            { kind: "h", q: 1, col: 2 },
          ]}
          from={62}
          perGate={8}
          colW={130}
          rowH={90}
          measureCol={3}
          labelW={170}
        />
      </div>
      <div style={{ position: "absolute", left: 960, top: 740, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "26px 50px", width: 900 }}>
        {stats.map((s, i) => (
          <div key={i} style={{ opacity: ramp(frame, s.at, s.at + 10), translate: `0 ${(1 - ramp(frame, s.at, s.at + 14)) * 20}px` }}>
            <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 74, lineHeight: 1, color: C.text, letterSpacing: -2 }}>{s.n}</div>
            <div style={{ fontFamily: MONO, fontSize: 17, letterSpacing: 2, color: C.muted, marginTop: 8 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, textAlign: "center", fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.q, opacity: ramp(frame, 200, 214) * (1 - ramp(frame, 292, 300, IN)) }}>
        BORN-RULE JOINT MEASUREMENT · QISKIT-VALIDATED · EXPORTS TO QOLLAB
      </div>
      {[14, 60, 150, 160, 170, 180].map((f) => <Sfx key={f} name={f < 100 ? "click" : "data"} at={f} volume={0.4} />)}
    </AbsoluteFill>
  );
};

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const g = stateAtBeat("harvest2");
  const svg = svgFor(g, null);
  const LOGO = 120;
  const t = ramp(frame, LOGO, LOGO + 14);
  const fadeOut = ramp(frame, 214, 240, IN);
  return (
    <AbsoluteFill style={{ background: C.ink }}>
      <Line who="ALICE" text="Your turn." from={2} to={56} size={100} />
      <Line who="BOB" text="Give me the ore." from={60} to={116} size={100} />
      {frame >= LOGO ? (
        <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
          <Background tint="rgba(120,90,190,0.14)" grid={0.05} />
          <AbsoluteFill style={{ perspective: 1800, opacity: 0.28 * t }}>
            <div style={{ position: "absolute", left: 960 - 760, top: 600 - 620, width: 1520, height: 1240, transform: `rotateX(60deg) rotateZ(${10 - (frame - LOGO) * 0.08}deg) scale(1.3)` }}>
              <BoardVector svg={svg} width={1520} />
            </div>
          </AbsoluteFill>
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 55% 45% at 50% 46%, rgba(6,13,17,.1), rgba(6,13,17,.92) 80%)" }} />
          <div style={{ position: "absolute", left: 0, right: 0, top: 300, textAlign: "center", fontFamily: SANS, fontWeight: 800, fontSize: 280, letterSpacing: -6, color: C.text, opacity: t, filter: `blur(${(1 - t) * 18}px)`, scale: String(1.08 - 0.08 * t) }}>
            F<span style={{ textShadow: `0 0 60px ${C.q}` }}>O</span>LD
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 610, textAlign: "center", fontFamily: MONO, fontSize: 30, letterSpacing: 14, color: C.q, opacity: ramp(frame, LOGO + 10, LOGO + 26) }}>QUANTUM CATAN</div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: SANS, fontWeight: 600, fontSize: 32, color: C.text, opacity: ramp(frame, LOGO + 22, LOGO + 38) }}>
            Superposition · Interference · Entanglement · Measurement
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, top: 800, textAlign: "center", fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: C.muted, opacity: ramp(frame, LOGO + 34, LOGO + 50) }}>
            QOLLAB · GEORGIA TECH QUANTUM HACKATHON
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 40, textAlign: "center", fontFamily: MONO, fontSize: 15, letterSpacing: 1.5, color: C.dim, opacity: ramp(frame, LOGO + 40, LOGO + 56) }}>
            All gameplay captured from the Fold prototype: a legal, seeded two-player match with dice chosen for the demo. Local pass-and-play. Exact statevector simulation, Qiskit-validated.
          </div>
          <Flash at={LOGO} len={18} peak={0.9} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
