let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) audioCtx = new AC();
  }
  return audioCtx;
}

export function beep(freq = 440, dur = 0.08, type: OscillatorType = 'sine', vol = 0.08) {
  const c = ctx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = vol;
  osc.connect(gain);
  gain.connect(c.destination);
  const now = c.currentTime;
  osc.start(now);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  osc.stop(now + dur);
}

export const sfx = {
  tick: () => beep(660, 0.04, 'square', 0.04),
  reveal: () => beep(520, 0.12, 'triangle', 0.06),
  correct: () => {
    beep(523, 0.1, 'sine', 0.08);
    setTimeout(() => beep(659, 0.1, 'sine', 0.08), 90);
    setTimeout(() => beep(784, 0.16, 'sine', 0.08), 180);
  },
  wrong: () => {
    beep(220, 0.18, 'sawtooth', 0.06);
    setTimeout(() => beep(180, 0.22, 'sawtooth', 0.06), 120);
  },
  spinStart: () => beep(330, 0.06, 'square', 0.05),
  spinEnd: () => beep(880, 0.18, 'triangle', 0.07),
  fanfare: () => {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.2, 'sine', 0.09), i * 140));
  },
};
