// Synthesised sound for Shadowtide: no audio files, everything is built
// with WebAudio — soft footsteps whose tempo follows the mouse's pace,
// a chime for a moon key, a low two-tone alarm for ALERT, and a slow
// wash of waves underneath. The context only starts after the first
// user gesture, and M toggles it silent.

export class SoundEngine {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.wavesStarted = false;
    this.lastStepAt = 0;
  }

  /** Create the context on first interaction; safe to call repeatedly. */
  ensure() {
    if (this.context) {
      if (this.context.state === 'suspended') this.context.resume();
      return;
    }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.context = new Ctx();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.context.destination);
      this.startWaves();
    } catch {
      this.context = null;
    }
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  /** A slow loop of filtered noise: tide washing over the pools. */
  startWaves() {
    if (!this.context || this.wavesStarted) return;
    this.wavesStarted = true;
    try {
      const len = this.context.sampleRate * 3;
      const buffer = this.context.createBuffer(1, len, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      const gain = this.context.createGain();
      gain.gain.value = 0.05;
      const lfo = this.context.createOscillator();
      lfo.frequency.value = 0.09;
      const lfoGain = this.context.createGain();
      lfoGain.gain.value = 0.025;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      source.start();
      lfo.start();
    } catch {
      // Waves are ambience; the game plays fine without them.
    }
  }

  /** One footstep tick. Louder and quicker when running or near a guard. */
  footstep(mode, nearestGuardDistance) {
    if (!this.context || this.muted) return;
    const now = this.context.currentTime;
    const gap = mode === 'run' ? 0.22 : mode === 'sneak' ? 0.55 : 0.34;
    if (now - this.lastStepAt < gap) return;
    this.lastStepAt = now;
    try {
      const near = Math.max(0, 1 - nearestGuardDistance / 320);
      const volume = mode === 'sneak' ? 0.03 : mode === 'run' ? 0.16 : 0.08 + near * 0.08;
      const osc = this.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = mode === 'run' ? 150 : 110;
      const gain = this.context.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(now);
      osc.stop(now + 0.1);
    } catch {
      // A missed tick is not worth interrupting the game for.
    }
  }

  /** Two-note chime when a moon key is picked up. */
  keyChime() {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      [880, 1318].forEach((freq, i) => {
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = this.context.createGain();
        const start = now + i * 0.09;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.55);
      });
    } catch {
      // Silence on failure; the chime is decoration.
    }
  }

  /** Soft two-tone alarm when a guard raises the ALERT. */
  alarm() {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      [392, 311].forEach((freq, i) => {
        const osc = this.context.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        const gain = this.context.createGain();
        const start = now + i * 0.16;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.32);
      });
    } catch {
      // Silence on failure.
    }
  }

  /** A small rising arpeggio when a level is finished. */
  levelClear() {
    if (!this.context || this.muted) return;
    try {
      const now = this.context.currentTime;
      [523, 659, 784, 1046].forEach((freq, i) => {
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const gain = this.context.createGain();
        const start = now + i * 0.1;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.14, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(this.master);
        osc.start(start);
        osc.stop(start + 0.65);
      });
    } catch {
      // Silence on failure.
    }
  }
}
