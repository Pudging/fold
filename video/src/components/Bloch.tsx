import React, { useMemo } from "react";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { useCurrentFrame } from "remotion";
import { C, MONO } from "../theme";
import { Tex } from "./Type";

type V3 = [number, number, number];
// Bloch (x, y, z) -> three (x, z, -y): |A⟩ = |0⟩ points up
const toThree = ([x, y, z]: V3): V3 => [x, z, -y];

const CAM_POS: V3 = [3.6, 1.7, 3.0];
const FOV = 32;

function ringPoints(axis: "xy" | "xz" | "yz", r = 1, n = 128) {
  const pts: number[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const c = Math.cos(a) * r, s = Math.sin(a) * r;
    const p: V3 = axis === "xy" ? [c, s, 0] : axis === "xz" ? [c, 0, s] : [0, c, s];
    pts.push(...toThree(p));
  }
  return new Float32Array(pts);
}

const Line: React.FC<{ points: Float32Array; color: string; opacity: number; width?: number }> = ({ points, color, opacity }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(points, 3));
    return g;
  }, [points]);
  return (
    // @ts-expect-error three line element
    <line geometry={geo}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </line>
  );
};

const Arrow: React.FC<{ v: V3; color: string }> = ({ v, color }) => {
  const t = toThree(v);
  const dir = new THREE.Vector3(...t);
  const len = dir.length();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return (
    <group quaternion={q}>
      <mesh position={[0, (len - 0.14) / 2, 0]}>
        <cylinderGeometry args={[0.022, 0.022, len - 0.14, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, len - 0.07, 0]}>
        <coneGeometry args={[0.065, 0.16, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, len, 0]}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, len, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.25} />
      </mesh>
    </group>
  );
};

export const BlochSphere: React.FC<{
  size: number;
  v: V3;
  trail: V3[];
  color?: string;
  spin?: number;
  labels?: boolean;
}> = ({ size, v, trail, color = C.q, labels = true }) => {
  const frame = useCurrentFrame();
  const camera = useMemo(() => {
    const c = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    c.position.set(...CAM_POS);
    c.lookAt(0, 0, 0);
    c.updateMatrixWorld();
    return c;
  }, []);
  const project = (p: V3) => {
    const w = new THREE.Vector3(...toThree(p)).project(camera);
    return { x: ((w.x + 1) / 2) * size, y: ((1 - w.y) / 2) * size };
  };
  const rings = useMemo(() => {
    const out: { p: Float32Array; o: number }[] = [
      { p: ringPoints("xy"), o: 0.55 },
      { p: ringPoints("xz"), o: 0.28 },
      { p: ringPoints("yz"), o: 0.2 },
    ];
    for (const lat of [-0.66, -0.33, 0.33, 0.66]) {
      const r = Math.sqrt(1 - lat * lat);
      const pts: number[] = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        pts.push(...toThree([Math.cos(a) * r, Math.sin(a) * r, lat]));
      }
      out.push({ p: new Float32Array(pts), o: 0.1 });
    }
    return out;
  }, []);
  const axes = useMemo(
    () => [
      new Float32Array([...toThree([-1.25, 0, 0]), ...toThree([1.25, 0, 0])]),
      new Float32Array([...toThree([0, -1.25, 0]), ...toThree([0, 1.25, 0])]),
      new Float32Array([...toThree([0, 0, -1.25]), ...toThree([0, 0, 1.25])]),
    ],
    [],
  );
  const trailPts = useMemo(() => new Float32Array(trail.flatMap((p) => toThree(p))), [trail]);
  const lab = (p: V3, node: React.ReactNode, dx = 0, dy = 0) => {
    const s = project(p);
    return <div style={{ position: "absolute", left: s.x + dx, top: s.y + dy, translate: "-50% -50%" }}>{node}</div>;
  };
  void frame;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <ThreeCanvas width={size} height={size} camera={{ position: CAM_POS, fov: FOV }} gl={{ antialias: true }}>
        <ambientLight intensity={1} />
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshBasicMaterial color="#9fc6d6" transparent opacity={0.05} depthWrite={false} />
        </mesh>
        {rings.map((r, i) => <Line key={i} points={r.p} color="#cfe3ea" opacity={r.o} />)}
        {axes.map((a, i) => <Line key={`a${i}`} points={a} color="#cfe3ea" opacity={0.35} />)}
        {trail.length > 1 ? <Line points={trailPts} color={color} opacity={0.95} /> : null}
        <Arrow v={v} color={color} />
      </ThreeCanvas>
      {labels ? (
        <>
          {lab([0, 0, 1.3], <Tex expr="|A\rangle" size={34} color={C.text} />, 0, -10)}
          {lab([0, 0, -1.3], <Tex expr="|B\rangle" size={34} color={C.text} />, 0, 10)}
          {lab([1.32, 0, 0], <Tex expr="|+\rangle" size={28} color={C.muted} />, 0, 0)}
          {lab([-1.32, 0, 0], <Tex expr="|-\rangle" size={28} color={C.muted} />, 0, 0)}
          <div style={{ position: "absolute", left: 0, bottom: -6, fontFamily: MONO, fontSize: 16, letterSpacing: 3, color: C.dim }}>BLOCH SPHERE</div>
        </>
      ) : null}
    </div>
  );
};
