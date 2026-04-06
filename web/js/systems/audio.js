// ─── Audio System ─────────────────────────────────────────────────────────────
// All sounds synthesized via Web Audio API — no asset files needed.
// Singleton export `audio` is imported wherever a sound needs to play.

class AudioSystem {
  constructor() {
    this._actx = null;
  }

  // Lazy-init context; safe to call any time
  _ctx() {
    if (!this._actx) {
      this._actx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._actx;
  }

  // Call on first user gesture to unblock browser autoplay policy
  unlock() {
    try {
      const ctx = this._ctx();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
  }

  // ─ Internal helpers ──────────────────────────────────────────────────────

  _master(vol = 0.4) {
    const ctx = this._ctx();
    const g = ctx.createGain();
    g.gain.value = vol;
    g.connect(ctx.destination);
    return g;
  }

  // Single oscillator with frequency + gain envelope
  _osc(dest, type, freqStart, freqEnd, dur, gainPeak, startOffset = 0) {
    const ctx = this._ctx();
    const now = ctx.currentTime + startOffset;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), now + dur);
    }
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + dur + 0.01);
  }

  // White noise burst through a bandpass filter
  _noise(dest, dur, gainPeak, filterFreq = 1200, filterQ = 1, startOffset = 0) {
    const ctx = this._ctx();
    const now = ctx.currentTime + startOffset;
    const sr  = ctx.sampleRate;
    const buf = ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const src    = ctx.createBufferSource();
    src.buffer   = buf;
    const filter = ctx.createBiquadFilter();
    filter.type  = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = filterQ;
    const gain   = ctx.createGain();
    gain.gain.setValueAtTime(gainPeak, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(now);
    src.stop(now + dur + 0.01);
  }

  // ─ Sounds ────────────────────────────────────────────────────────────────

  punchLight() {
    try {
      this.unlock();
      const m = this._master(0.38);
      this._noise(m, 0.07, 1.1, 1300, 1.2);
      this._osc(m, 'sine', 190, 75, 0.07, 0.5);
    } catch (e) {}
  }

  punchHeavy() {
    try {
      this.unlock();
      const m = this._master(0.55);
      this._noise(m, 0.14, 1.4, 650, 0.8);
      this._osc(m, 'sine', 110, 40, 0.14, 0.9);
      // Extra low thud
      this._osc(m, 'sine', 60, 30, 0.18, 0.5);
    } catch (e) {}
  }

  kick() {
    try {
      this.unlock();
      const m = this._master(0.42);
      this._noise(m, 0.09, 1.0, 950, 1.0);
      this._osc(m, 'sine', 170, 65, 0.09, 0.65);
    } catch (e) {}
  }

  jumpAtk() {
    try {
      this.unlock();
      const m = this._master(0.4);
      this._noise(m, 0.1, 1.1, 1100, 1.0);
      this._osc(m, 'sine', 200, 80, 0.1, 0.6);
    } catch (e) {}
  }

  propHit() {
    try {
      this.unlock();
      const m = this._master(0.28);
      this._noise(m, 0.06, 0.9, 2000, 1.5);
      this._osc(m, 'square', 380, 180, 0.06, 0.3);
    } catch (e) {}
  }

  propBreak() {
    try {
      this.unlock();
      const m = this._master(0.6);
      this._noise(m, 0.35, 1.8, 900, 0.7);
      this._osc(m, 'sawtooth', 220, 55, 0.25, 0.45);
    } catch (e) {}
  }

  enemyHurt() {
    try {
      this.unlock();
      const m = this._master(0.22);
      this._osc(m, 'sawtooth', 230, 140, 0.1, 0.5);
      this._noise(m, 0.04, 0.35, 700, 1.0);
    } catch (e) {}
  }

  playerHurt() {
    try {
      this.unlock();
      const m = this._master(0.38);
      this._osc(m, 'sawtooth', 190, 95, 0.16, 0.75);
      this._noise(m, 0.09, 0.55, 500, 0.9);
    } catch (e) {}
  }

  pickup() {
    try {
      this.unlock();
      const m = this._master(0.28);
      this._osc(m, 'sine', 523, 523, 0.12, 0.6, 0.00);
      this._osc(m, 'sine', 659, 659, 0.12, 0.6, 0.09);
      this._osc(m, 'sine', 784, 784, 0.15, 0.6, 0.18);
    } catch (e) {}
  }

  jump() {
    try {
      this.unlock();
      const m = this._master(0.18);
      this._osc(m, 'sine', 280, 480, 0.1, 0.4);
    } catch (e) {}
  }

  waveClear() {
    try {
      this.unlock();
      const m = this._master(0.28);
      const notes = [[392, 0], [523, 0.10], [659, 0.20], [784, 0.32]];
      for (const [freq, t] of notes) {
        this._osc(m, 'square', freq, freq, 0.22, 0.38, t);
      }
    } catch (e) {}
  }

  neebsSuper() {
    try {
      this.unlock();
      const m = this._master(0.55);
      // Rising scream
      this._osc(m, 'sawtooth', 200, 800, 0.5, 0.6);
      this._osc(m, 'sine',     300, 1200, 0.5, 0.4);
      // Noise burst impact
      this._noise(m, 0.4, 1.2, 1500, 0.8, 0.1);
    } catch (e) {}
  }

  appsroSuper() {
    try {
      this.unlock();
      const m = this._master(0.6);
      // Deep rumble
      this._osc(m, 'sine', 55, 30, 0.7, 0.8);
      // Mid crackle
      this._noise(m, 0.6, 1.4, 600, 0.6);
      // High sci-fi sweep
      this._osc(m, 'sawtooth', 800, 200, 0.4, 0.35, 0.05);
    } catch (e) {}
  }

  gameOver() {
    try {
      this.unlock();
      const m = this._master(0.28);
      const notes = [[523, 0], [440, 0.22], [349, 0.46], [261, 0.72]];
      for (const [freq, t] of notes) {
        this._osc(m, 'sawtooth', freq, freq * 0.95, 0.32, 0.32, t);
      }
    } catch (e) {}
  }
}

export const audio = new AudioSystem();
