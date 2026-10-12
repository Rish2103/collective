/**
 * Sensory Audio Feedback via Native Web Audio API
 * - 100% synthetic (zero external audio files or network requests)
 * - Persisted in localStorage (collective_sound_enabled)
 * - Muted by default
 * - Async AudioContext resume handling (fixes browser autoplay suspensions)
 * - Clean ADSR envelopes (smooth attack/decay prevents speaker pop)
 * - Calibrated volume levels (~0.22 peak) clearly audible on laptop/monitor speakers
 */

const AUDIO_STORAGE_KEY = 'collective_sound_enabled';

export function isAudioEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(AUDIO_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setAudioEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AUDIO_STORAGE_KEY, enabled ? 'true' : 'false');
  } catch {
    // Ignore localStorage quota errors
  }
}

let audioCtx: AudioContext | null = null;

async function getAudioContext(): Promise<AudioContext | null> {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Toggle sound effect played immediately upon clicking the sound toggle button in Navbar.
 * Always plays when enabling so the user immediately verifies sound is working.
 */
export async function playToggleSound(enabled: boolean): Promise<void> {
  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    if (enabled) {
      // Bright ascending 2-note chime: C5 (523Hz) -> G5 (784Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.015);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(783.99, now + 0.09);
      gain2.gain.setValueAtTime(0.001, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.24, now + 0.105);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.28);
    } else {
      // Soft descending 2-note chime: E5 (659Hz) -> C5 (523Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.10);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    }
  } catch {
    // Fail silently
  }
}

/**
 * Crisp, clear tactile double-ping for clipboard copy actions (addresses, links, invites)
 */
export async function playCopyChime(): Promise<void> {
  if (!isAudioEnabled()) return;

  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Note 1: E5 (659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.linearRampToValueAtTime(0.22, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.08);

    // Note 2: A5 (880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.0, now + 0.06);
    gain2.gain.setValueAtTime(0.001, now + 0.06);
    gain2.gain.linearRampToValueAtTime(0.24, now + 0.075);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.20);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.20);
  } catch {
    // Fail silently
  }
}

/**
 * Subtle tactile click for template buttons, tab switches, and dialog triggers
 */
export async function playClickSound(): Promise<void> {
  if (!isAudioEnabled()) return;

  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.16, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {
    // Fail silently
  }
}

/**
 * Rich ascending arpeggio for successful contributions, faucet claims, or pool creations
 */
export async function playSuccessChime(): Promise<void> {
  if (!isAudioEnabled()) return;

  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.14 },    // C5
      { freq: 659.25, time: 0.08, dur: 0.14 }, // E5
      { freq: 783.99, time: 0.16, dur: 0.18 }, // G5
      { freq: 1046.50, time: 0.24, dur: 0.28 },// C6
    ];

    notes.forEach(({ freq, time, dur }) => {
      const start = now + time;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.20, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur);
    });
  } catch {
    // Fail silently
  }
}

/**
 * Celebratory resolution chord for payouts and milestone completions
 */
export async function playPayoutChime(): Promise<void> {
  if (!isAudioEnabled()) return;

  try {
    const ctx = await getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Harmonic triad: C5 (523Hz), G5 (784Hz), C6 (1046Hz)
    const freqs = [523.25, 783.99, 1046.50];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === 2 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      const start = now + idx * 0.04;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + 0.45);
    });
  } catch {
    // Fail silently
  }
}
