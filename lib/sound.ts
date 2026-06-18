let audioCtx: AudioContext | null = null;
const NOTE_CACHE: Record<string, AudioBuffer> = {};

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function createTone(freq: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function playMoveSound() {
  try { createTone(600, 0.08, 'sine'); } catch {}
}

export function playCaptureSound() {
  try { createTone(300, 0.12, 'triangle'); } catch {}
}

export function playCheckSound() {
  try { createTone(800, 0.15, 'square'); } catch {}
}

export function playGameOverSound() {
  try {
    createTone(523, 0.2, 'sine');
    setTimeout(() => createTone(659, 0.2, 'sine'), 150);
    setTimeout(() => createTone(784, 0.3, 'sine'), 300);
  } catch {}
}

export function playNotifySound() {
  try { createTone(1000, 0.1, 'sine'); setTimeout(() => createTone(1200, 0.1, 'sine'), 100); } catch {}
}
