"""Original score for the Fold demo, synthesized from scratch (no samples).

120 BPM, one bar = 2 s = 60 frames at 30 fps. Section bars mirror src/timeline.ts.
Writes public/audio/score_raw.wav; master.py loudness-normalizes it.
"""
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
from pathlib import Path

SR = 44100
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
TOTAL_BARS = 53
N = int((TOTAL_BARS * BAR + 3) * SR)
rng = np.random.default_rng(7)

OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def at(bar, beat=0.0):
    return int(round((bar * BAR + beat * BEAT) * SR))


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, d, s, r, sustain_dur=None):
    a_n, d_n, r_n = int(a * SR), int(d * SR), int(r * SR)
    hold = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([
        np.linspace(0, 1, max(a_n, 1)),
        np.linspace(1, s, max(d_n, 1)),
        np.full(hold, s),
        np.linspace(s, 0, max(r_n, 1)),
    ])
    return e[:n] if len(e) >= n else np.pad(e, (0, n - len(e)))


def saw(freq, dur, phase=0.0):
    t = tvec(dur)
    x = (t * freq + phase) % 1.0
    return 2 * x - 1


def lp(x, f, order=2):
    sos = butter(order, min(f, SR / 2 - 100) / (SR / 2), "low", output="sos")
    return sosfilt(sos, x, axis=0)


def hp(x, f, order=2):
    sos = butter(order, f / (SR / 2), "high", output="sos")
    return sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), min(hi, SR / 2 - 100) / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x, axis=0)


def sweep_filter(x, f0, f1, kind="low", block=512, curve="exp"):
    out = np.zeros_like(x)
    n = len(x)
    zi = None
    for i in range(0, n, block):
        p = i / max(n - 1, 1)
        f = f0 * (f1 / f0) ** p if curve == "exp" else f0 + (f1 - f0) * p
        f = float(np.clip(f, 30, SR / 2 - 200))
        sos = butter(2, f / (SR / 2), kind, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        out[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return out


class Bus:
    def __init__(self):
        self.L = np.zeros(N)
        self.R = np.zeros(N)

    def add(self, sig, start, gain=1.0, pan=0.0):
        if start >= N:
            return
        if sig.ndim == 2:
            l, r = sig[:, 0], sig[:, 1]
        else:
            l = r = sig
        end = min(N, start + len(l))
        k = end - start
        gl = gain * np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
        gr = gain * np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
        self.L[start:end] += l[:k] * gl
        self.R[start:end] += r[:k] * gr

    def stereo(self):
        return np.stack([self.L, self.R], axis=1)


pads, bass, arps, drums, fx, bells, verb_send = Bus(), Bus(), Bus(), Bus(), Bus(), Bus(), Bus()

# ---------------------------------------------------------------- instruments

def pad_chord(notes, bar, bars, cutoff=1800, gain=0.09, attack=0.8):
    dur = bars * BAR + 1.5
    n = int(dur * SR)
    L = np.zeros(n)
    R = np.zeros(n)
    for m in notes:
        f = mtof(m)
        for k, det in enumerate([-11, -5, 0, 6, 12]):
            v = saw(f * 2 ** (det / 1200), dur, phase=rng.random())
            pan = (k - 2) / 2.2
            L += v * np.cos((pan + 1) * np.pi / 4)
            R += v * np.sin((pan + 1) * np.pi / 4)
    e = env_adsr(n, attack, 0.5, 0.85, 1.5)
    s = np.stack([L * e, R * e], axis=1)
    s = lp(s, cutoff, 2)
    s = lp(s, cutoff * 1.6, 2)
    pads.add(s, at(bar), gain / len(notes))
    verb_send.add(s, at(bar), gain / len(notes) * 0.5)


def sub(m, bar, beats, gain=0.35, beat=0):
    dur = beats * BEAT
    t = tvec(dur + 0.2)
    f = mtof(m)
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(4 * np.pi * f * t)
    x *= env_adsr(len(t), 0.01, 0.1, 0.9, 0.18)
    bass.add(np.tanh(1.4 * x), at(bar, beat), gain)


def bass_pluck(m, bar, beat, gain=0.22, length=0.22):
    dur = length + 0.1
    t = tvec(dur)
    f = mtof(m)
    x = saw(f, dur) + 0.5 * saw(f * 1.005, dur)
    x = sweep_filter(x, 2200, 180, "low", 256)
    x *= np.exp(-t / (length * 0.6))
    x += 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t / length)
    bass.add(x, at(bar, beat), gain)


def arp_note(m, bar, beat, gain=0.08, cutoff=3000, pan=0.0, decay=0.11):
    dur = 0.35
    t = tvec(dur)
    f = mtof(m)
    sq = np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + saw(f * 1.003, dur) * 0.5
    x = lp(sq, cutoff) * np.exp(-t / decay)
    x[:40] *= np.linspace(0, 1, 40)
    start = at(bar, beat)
    arps.add(x, start, gain, pan)
    # dotted-eighth ping-pong delay
    d = int(0.75 * BEAT * SR)
    for k in range(1, 4):
        arps.add(lp(x, cutoff * 0.7 ** k), start + d * k, gain * 0.42 ** k, pan=(-1) ** k * 0.7)
    verb_send.add(x, start, gain * 0.35)


def kick(bar, beat, gain=0.9):
    dur = 0.5
    t = tvec(dur)
    f = 45 + 120 * np.exp(-t / 0.03)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t / 0.28)
    x[:200] += rng.standard_normal(200) * np.linspace(0.5, 0, 200)
    drums.add(np.tanh(1.8 * x), at(bar, beat), gain)


def clap(bar, beat, gain=0.35):
    dur = 0.4
    t = tvec(dur)
    noise = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for off in (0, 0.011, 0.022):
        i = int(off * SR)
        e[i:] += np.exp(-(t[: len(t) - i]) / (0.012 if off < 0.02 else 0.13))
    x = bp(noise * e, 900, 3500)
    drums.add(x, at(bar, beat), gain)
    verb_send.add(x, at(bar, beat), gain * 0.6)


def hat(bar, beat, gain=0.09, open_=False, pan=0.25):
    dur = 0.25 if open_ else 0.06
    t = tvec(dur)
    x = hp(rng.standard_normal(len(t)), 7500) * np.exp(-t / (0.07 if open_ else 0.015))
    drums.add(x, at(bar, beat), gain, pan)


def tom(m, bar, beat, gain=0.4):
    t = tvec(0.6)
    f = mtof(m) * (1 + 0.6 * np.exp(-t / 0.04))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22)
    drums.add(np.tanh(2 * x), at(bar, beat), gain)
    verb_send.add(x, at(bar, beat), gain * 0.4)


def impact(bar, beat=0, gain=1.0):
    dur = 4.0
    t = tvec(dur)
    f = 30 + 60 * np.exp(-t / 0.25)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 1.1)
    noise = lp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.35)
    crack = hp(rng.standard_normal(len(t)), 2000) * np.exp(-t / 0.05)
    x = np.tanh(2.2 * boom) * 0.9 + noise * 0.35 + crack * 0.25
    fx.add(x, at(bar, beat), gain)
    verb_send.add(noise * 0.5 + crack * 0.3, at(bar, beat), gain * 0.8)


def riser(bar_start, bars, gain=0.25, end_beat=0.0):
    dur = bars * BAR + end_beat * BEAT
    t = tvec(dur)
    p = t / dur
    noise = rng.standard_normal(len(t))
    x = sweep_filter(noise, 250, 9000, "low", 512)
    x = hp(x, 200) * p ** 2.2
    tone_f = mtof(50) * 2 ** (p * 1.0)
    tone = (np.cumsum(tone_f) / SR) % 1.0 * 2 - 1
    tone = lp(tone, 4000) * p ** 3 * 0.35
    s = x + tone
    fx.add(s, at(bar_start), gain)
    verb_send.add(s, at(bar_start), gain * 0.5)


def reverse_cymbal(bar_end, beats=4, gain=0.25):
    dur = beats * BEAT
    t = tvec(dur)
    x = hp(rng.standard_normal(len(t)), 5000) * (t / dur) ** 3
    fx.add(np.stack([x, np.roll(x, 37)], axis=1), at(bar_end) - len(t), gain)


def tick(bar, beat, gain=0.18, high=True):
    t = tvec(0.03)
    x = bp(rng.standard_normal(len(t)), 2500 if high else 1600, 5000 if high else 3000) * np.exp(-t / 0.004)
    fx.add(x, at(bar, beat), gain, pan=0.2 if high else -0.2)


def bell(m, bar, beat, gain=0.12, decay=2.5, pan=0.0):
    dur = decay * 2
    t = tvec(dur)
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.5 * np.exp(-t / 0.4)
    x = np.sin(2 * np.pi * f * t + mod) * np.exp(-t / decay)
    x += 0.3 * np.sin(2 * np.pi * f * 2.01 * t) * np.exp(-t / (decay * 0.5))
    x[:60] *= np.linspace(0, 1, 60)
    bells.add(x, at(bar, beat), gain, pan)
    verb_send.add(x, at(bar, beat), gain * 0.9)


def blip(bar, beat, gain=0.05):
    m = rng.integers(84, 100)
    t = tvec(0.05)
    x = np.sign(np.sin(2 * np.pi * mtof(m) * t)) * np.exp(-t / 0.012)
    fx.add(lp(x, 6000), at(bar, beat), gain, pan=float(rng.uniform(-0.8, 0.8)))


# ---------------------------------------------------------------- harmony
Dm = [50, 53, 57, 62]
Bb = [46, 50, 53, 58]
F = [45, 48, 53, 57]
C = [43, 48, 52, 55]
Gm = [43, 50, 55, 58]
A = [45, 49, 52, 57]
ROOT = {id(Dm): 38, id(Bb): 34, id(F): 41, id(C): 36, id(Gm): 31, id(A): 33}
PROG = [Dm, Bb, F, C]


def arp_bar(chord, bar, gain=0.07, cutoff=2600, sixteenths=True, octave=12):
    tones = [chord[1] + octave, chord[2] + octave, chord[3] + octave, chord[1] + octave + 12]
    pattern = [0, 1, 2, 3, 2, 1, 2, 3] * 2
    steps = 16 if sixteenths else 8
    for i in range(steps):
        arp_note(tones[pattern[i]], bar, i * (4 / steps), gain, cutoff, pan=0.35 * np.sin(i))


def groove_bar(bar, chord, kick_pattern="four", clap_on=True, hats=True, bassline=True, gain=1.0):
    root = ROOT[id(chord)]
    if kick_pattern == "four":
        for b in range(4):
            kick(bar, b, 0.85 * gain)
    elif kick_pattern == "half":
        kick(bar, 0, 0.9 * gain)
        kick(bar, 2.5, 0.6 * gain)
    if clap_on:
        clap(bar, 1, 0.3 * gain)
        clap(bar, 3, 0.3 * gain)
    if hats:
        for b in range(4):
            hat(bar, b + 0.5, 0.08 * gain, open_=(b == 3))
            hat(bar, b + 0.25, 0.03 * gain)
            hat(bar, b + 0.75, 0.03 * gain)
    if bassline:
        for e in range(8):
            if e % 2 == 1 or kick_pattern != "four":
                bass_pluck(root + (12 if e in (3, 7) else 0), bar, e * 0.5, 0.2 * gain)


kick_times = []


def mark_kicks(bar0, bar1, pattern="four"):
    for b in range(bar0, bar1):
        if pattern == "four":
            kick_times.extend(at(b, k) for k in range(4))
        else:
            kick_times.extend([at(b, 0), at(b, 2.5)])


# ---------------------------------------------------------------- arrangement
# 0-4  cold open
pad_chord([38, 50, 57], 0, 4, cutoff=500, gain=0.10, attack=2.5)
sub(26, 0, 16, gain=0.18)
for b in range(0, 4):
    for k in range(4):
        tick(b, k, 0.14, high=(k % 2 == 0))
bell(74, 2, 0, 0.10, 3.5)  # "Both."
bell(81, 2, 0.02, 0.05, 3.5, pan=0.4)
riser(3, 1, 0.22)
reverse_cymbal(4, 4, 0.25)

# 4-6  title impact
impact(4, 0, 1.0)
pad_chord(Dm, 4, 2, cutoff=1400, gain=0.12, attack=0.05)
sub(38, 4, 8, 0.30)
bell(86, 4, 0, 0.07, 4.0, pan=-0.3)
bell(81, 4, 1.5, 0.05, 4.0, pan=0.3)
for k in range(4):
    tick(5, k, 0.08, high=(k % 2 == 0))

# 6-12 Catan basics: groove
for i, b in enumerate(range(6, 12)):
    ch = PROG[i % 4]
    groove_bar(b, ch)
    pad_chord(ch, b, 1, cutoff=1200 + 200 * i, gain=0.07, attack=0.05)
    arp_bar(ch, b, 0.055, cutoff=1500 + 350 * i)
    sub(ROOT[id(ch)], b, 4, 0.18)
mark_kicks(6, 12)
for b in (7, 8, 9, 10):
    impact(b, 0, 0.18)  # punctuate each word
reverse_cymbal(12, 2, 0.2)

# 12-14 the rule break
impact(12, 0, 0.8)
pad_chord([38, 45, 50, 53], 12, 2, cutoff=700, gain=0.1, attack=0.1)
sub(26, 12, 8, 0.25)
riser(12, 2, 0.28)
bell(77, 13, 0, 0.08, 2.5)
bell(81, 13, 2, 0.08, 2.5)

# 14-19 split: half-time
impact(14, 0, 0.75)
for i, b in enumerate(range(14, 19)):
    ch = PROG[i % 4]
    groove_bar(b, ch, kick_pattern="half", clap_on=True, hats=True, bassline=False, gain=0.85)
    clap(b, 1, 0.0)
    pad_chord(ch, b, 1, cutoff=1500, gain=0.08, attack=0.1)
    arp_bar(ch, b, 0.05, cutoff=2200, sixteenths=False)
    sub(ROOT[id(ch)], b, 4, 0.24)
mark_kicks(14, 19, "half")
bell(86, 16, 0, 0.08, 3)  # ghosts appear
bell(93, 16, 0.5, 0.05, 3, pan=0.5)
reverse_cymbal(19, 4, 0.22)

# 19-28 interference: build
for i, b in enumerate(range(19, 28)):
    ch = [Dm, Bb, F, C, Dm, Bb, Gm, A, A][i]
    full = b >= 21
    groove_bar(b, ch, kick_pattern="four" if full else "half", clap_on=full, hats=True, bassline=full, gain=0.9)
    pad_chord(ch, b, 1, cutoff=1300 + 120 * i, gain=0.075, attack=0.08)
    arp_bar(ch, b, 0.055, cutoff=1800 + 300 * i, sixteenths=full)
    sub(ROOT[id(ch)], b, 4, 0.2)
mark_kicks(19, 21, "half")
mark_kicks(21, 28)
for b, m in ((20, 86), (22, 81), (24, 86), (26, 89)):
    bell(m, b, 0, 0.09, 2.5)  # gate hits
    impact(b, 0, 0.25)
riser(27, 1, 0.24)

# 28-31 harvest 1
impact(28, 0, 0.9)
for k in range(8):
    tom(45 - k, 27, 2 + k * 0.25, 0.25)
for i, b in enumerate(range(28, 31)):
    ch = [Dm, Bb, C][i]
    groove_bar(b, ch, gain=0.95)
    pad_chord(ch, b, 1, cutoff=2200, gain=0.075, attack=0.05)
    arp_bar(ch, b, 0.05, cutoff=3200)
    sub(ROOT[id(ch)], b, 4, 0.2)
mark_kicks(28, 31)
reverse_cymbal(31, 2, 0.2)

# 31-39 entanglement: lift
impact(31, 0, 0.7)
for i, b in enumerate(range(31, 39)):
    ch = [Bb, F, C, Dm, Bb, F, Gm, A][i]
    groove_bar(b, ch, kick_pattern="half" if b < 33 else "four", clap_on=b >= 33, gain=0.9)
    pad_chord([n + 12 for n in ch[:3]] + ch, b, 1, cutoff=1700 + 100 * i, gain=0.08, attack=0.1)
    arp_bar(ch, b, 0.05, cutoff=2400 + 200 * i, octave=24 if b >= 35 else 12)
    sub(ROOT[id(ch)], b, 4, 0.22)
mark_kicks(31, 33, "half")
mark_kicks(33, 39)
for b, m in ((33, 81), (35, 86), (37, 88)):
    bell(m, b, 0, 0.09, 3)
    bell(m + 7, b, 0.03, 0.05, 3, pan=0.6)

# 39-44 measurement climax
for b in (39, 40):
    pad_chord(A, b, 1, cutoff=900 + 600 * (b - 39), gain=0.09, attack=0.1)
    sub(33, b, 4, 0.25)
    for k in range(4):
        kick(b, k, 0.7)
    for k in range(8 if b == 39 else 16):
        tom(57, b, k * (4 / (8 if b == 39 else 16)), 0.14 + 0.1 * (b - 39))
riser(39, 2, 0.32)
# bar 41: silence except clock
for k in range(4):
    tick(41, k, 0.22, high=(k % 2 == 0))
reverse_cymbal(42, 2, 0.3)
impact(42, 0, 1.1)  # MEASUREMENT
bell(74, 42, 0, 0.12, 4)
bell(86, 42, 0, 0.08, 4)
for i, b in enumerate(range(42, 44)):
    ch = [Dm, Bb][i]
    groove_bar(b, ch, gain=1.0)
    pad_chord(ch, b, 1, cutoff=2600, gain=0.085, attack=0.02)
    arp_bar(ch, b, 0.055, cutoff=3800, octave=24)
    sub(ROOT[id(ch)], b, 4, 0.24)
mark_kicks(42, 44)

# 44-49 under the hood: technical groove
for i, b in enumerate(range(44, 49)):
    ch = PROG[i % 4]
    groove_bar(b, ch, kick_pattern="four", clap_on=True, hats=True, bassline=True, gain=0.75)
    pad_chord(ch, b, 1, cutoff=1100, gain=0.06, attack=0.05)
    arp_bar(ch, b, 0.05, cutoff=2600, octave=24)
    sub(ROOT[id(ch)], b, 4, 0.18)
    for k in range(16):
        if rng.random() < 0.45:
            blip(b, k * 0.25, 0.035)
mark_kicks(44, 49)
reverse_cymbal(49, 2, 0.2)

# 49-53 outro
pad_chord(Bb, 49, 1, cutoff=1400, gain=0.1, attack=0.05)
sub(34, 49, 4, 0.25)
bell(77, 49, 0, 0.08, 3)
pad_chord(C, 50, 1, cutoff=1600, gain=0.1, attack=0.05)
sub(36, 50, 4, 0.25)
bell(79, 50, 0, 0.08, 3)
riser(50, 1, 0.2)
impact(51, 0, 1.0)  # logo
pad_chord([38, 50, 57, 62, 65, 69], 51, 2, cutoff=1800, gain=0.12, attack=0.02)
sub(26, 51, 8, 0.28)
bell(86, 51, 0, 0.1, 5)
bell(81, 51, 0.5, 0.07, 5, pan=-0.4)
bell(74, 51, 1.0, 0.07, 5, pan=0.4)

# ---------------------------------------------------------------- mix
sc = np.ones(N)
tau = 0.11 * SR
for k in sorted(set(kick_times)):
    seg = np.arange(0, min(int(0.4 * SR), N - k))
    sc[k:k + len(seg)] = np.minimum(sc[k:k + len(seg)], 1 - 0.6 * np.exp(-seg / tau))
sc2 = sc[:, None]

ir_len = int(3.2 * SR)
tir = np.arange(ir_len) / SR
ir = rng.standard_normal((ir_len, 2)) * np.exp(-tir / (2.6 / 6.91))[:, None]
ir = lp(ir, 6000)
ir[: int(0.02 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=0))
send = verb_send.stereo()
wet = np.stack([fftconvolve(send[:, c], ir[:, c])[:N] for c in range(2)], axis=1)

mix = (
    pads.stereo() * sc2 * 3.2
    + bass.stereo() * sc2 * 0.85
    + arps.stereo() * (0.5 + 0.5 * sc2) * 4.0
    + drums.stereo() * 0.55
    + fx.stereo() * 0.6
    + bells.stereo() * 2.0
    + wet * 0.8
)
for name, b in (("pads", pads), ("bass", bass), ("arps", arps), ("drums", drums), ("fx", fx), ("bells", bells)):
    s = b.stereo()
    print(f"{name:6s} peak {np.abs(s).max():.2f} rms {np.sqrt((s ** 2).mean()):.3f}")
print(f"wet    peak {np.abs(wet).max():.2f}")
mix = hp(mix, 28)
print(f"premix peak {np.abs(mix).max():.2f} rms {np.sqrt((mix ** 2).mean()):.3f}")
mix = mix / max(1.0, np.percentile(np.abs(mix), 99.9) / 0.7)
mix = np.tanh(mix * 1.3) / 1.3
fade = int(2.5 * SR)
end = at(53)
mix[end - fade:end] *= np.linspace(1, 0, fade)[:, None] ** 2
mix[end:] = 0
mix = mix[: end + int(0.2 * SR)]
mix /= np.abs(mix).max() / 0.89
wavfile.write(OUT / "score_raw.wav", SR, mix.astype(np.float32))
print("wrote", OUT / "score_raw.wav", mix.shape[0] / SR, "s")
