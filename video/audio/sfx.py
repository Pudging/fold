"""Synthesized UI sound effects for the Fold demo."""
import numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile
from pathlib import Path

SR = 48000
rng = np.random.default_rng(3)
OUT = Path(__file__).resolve().parent.parent / "public" / "audio"
OUT.mkdir(parents=True, exist_ok=True)


def t(d):
    return np.arange(int(d * SR)) / SR


def filt(x, f, kind):
    f = np.atleast_1d(f) / (SR / 2)
    return sosfilt(butter(2, f if len(f) > 1 else f[0], kind, output="sos"), x)


def write(name, x, peak=0.8):
    x = x / (np.abs(x).max() + 1e-9) * peak
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    wavfile.write(OUT / f"{name}.wav", SR, x.astype(np.float32))


# soft UI click
tt = t(0.06)
click = filt(rng.standard_normal(len(tt)), [1800, 6000], "band") * np.exp(-tt / 0.004)
click += 0.5 * np.sin(2 * np.pi * 1400 * tt) * np.exp(-tt / 0.01)
write("click", click, 0.5)

# whoosh
tt = t(0.6)
n = rng.standard_normal(len(tt))
out = np.zeros_like(n)
zi = np.zeros((1, 2))
for i in range(0, len(n), 256):
    p = i / len(n)
    f = 300 + 5000 * np.sin(np.pi * p) ** 2
    sos = butter(1, [f / (SR / 2), min(f * 2.2, 20000) / (SR / 2)], "band", output="sos")
    out[i:i + 256], zi = sosfilt(sos, n[i:i + 256], zi=zi)
out *= np.sin(np.pi * tt / tt[-1]) ** 2
write("whoosh", np.stack([out, np.roll(out, 400)], axis=1), 0.6)

# dice rattle: several clacks
tt = t(0.7)
dice = np.zeros(len(tt))
for k, when in enumerate([0.0, 0.07, 0.15, 0.21, 0.3, 0.36, 0.45]):
    i = int(when * SR)
    seg = t(0.05)
    clack = filt(rng.standard_normal(len(seg)), [1500 + 300 * k, 7000], "band") * np.exp(-seg / 0.008)
    clack += 0.6 * np.sin(2 * np.pi * (900 + 150 * k) * seg) * np.exp(-seg / 0.012)
    dice[i:i + len(seg)] += clack * (1 - when)
write("dice", dice, 0.7)

# typing tick
tt = t(0.03)
write("type", filt(rng.standard_normal(len(tt)), [2500, 8000], "band") * np.exp(-tt / 0.003), 0.35)

# collapse: descending shimmer then thud
tt = t(1.6)
f = 2400 * np.exp(-tt / 0.25) + 200
sh = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.5)
sh += 0.5 * np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * np.exp(-tt / 0.4)
thud = np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-tt / 0.05)) / SR) * np.exp(-tt / 0.3)
write("collapse", sh * 0.5 + thud, 0.8)

# rising quantum shimmer (for superposition reveal)
tt = t(1.4)
x = np.zeros(len(tt))
for k, m in enumerate([74, 77, 81, 86, 89]):
    st = int(k * 0.09 * SR)
    seg = tt[: len(tt) - st]
    fr = 440 * 2 ** ((m - 69) / 12)
    x[st:] += np.sin(2 * np.pi * fr * seg + 1.5 * np.sin(2 * np.pi * fr * 2 * seg) * np.exp(-seg / 0.3)) * np.exp(-seg / 0.6)
write("shimmer", np.stack([x, np.roll(x, 900)], axis=1), 0.5)

# glitch/data burst
tt = t(0.25)
g = np.sign(np.sin(2 * np.pi * (2000 + 1500 * np.sign(np.sin(2 * np.pi * 37 * tt))) * tt)) * np.exp(-tt / 0.08)
write("data", filt(g, 7000, "low"), 0.3)

# coin/resource gain
tt = t(0.5)
coin = sum(np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.15) for fr in (1318, 1976))
coin[int(0.08 * SR):] += sum(np.sin(2 * np.pi * fr * tt[: len(tt) - int(0.08 * SR)]) * np.exp(-tt[: len(tt) - int(0.08 * SR)] / 0.2) for fr in (1760, 2637))
write("coin", coin, 0.45)
print("sfx ok")
