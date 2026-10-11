import { Easing, interpolate } from "remotion";

export const EASE = Easing.bezier(0.65, 0, 0.35, 1);
export const OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const IN = Easing.bezier(0.7, 0, 0.84, 0);

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const ramp = (frame: number, a: number, b: number, easing = OUT) =>
  interpolate(frame, [a, b], [0, 1], { ...clamp, easing });

// Envelope that fades in over [a, a+inLen] and out over [b-outLen, b]
export const window_ = (frame: number, a: number, b: number, inLen = 8, outLen = 8) =>
  Math.min(ramp(frame, a, a + inLen), 1 - ramp(frame, b - outLen, b, IN));

export type Key<T> = { f: number } & T;

export function keyed<T extends Record<string, number>>(frame: number, keys: Key<T>[], prop: keyof T, easing = EASE): number {
  if (frame <= keys[0].f) return keys[0][prop] as number;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (frame <= b.f) {
      return interpolate(frame, [a.f, b.f], [a[prop] as number, b[prop] as number], { ...clamp, easing });
    }
  }
  return keys[keys.length - 1][prop] as number;
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
