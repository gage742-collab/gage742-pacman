class ArcadeAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private wakaToggle: boolean = false;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.2;
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain) {
      this.masterGain.gain.value = muted ? 0 : 0.2;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // Classic alternating Waka tone
  public playWaka() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const now = this.ctx.currentTime;
      this.wakaToggle = !this.wakaToggle;
      const freq = this.wakaToggle ? 260 : 490;

      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Ignore audio synthesis errors
    }
  }

  // Energizer Power Pellet eat
  public playPowerPellet() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(320, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch {
      // Ignore
    }
  }

  // Eat ghost sound (rising arpeggio chime)
  public playGhostEaten() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const freqs = [350, 480, 600, 780, 950];
      const now = this.ctx.currentTime;

      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        const start = now + idx * 0.04;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.07);
      });
    } catch {
      // Ignore
    }
  }

  // Fruit eaten sound
  public playFruitEaten() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.06;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch {
      // Ignore
    }
  }

  // Classic Pac-Man Death sequence
  public playDeath() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const now = this.ctx.currentTime;
      // 12 descending pitches
      const baseFreq = 500;
      for (let i = 0; i < 11; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = now + i * 0.08;
        const freq = baseFreq - i * 32;

        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.linearRampToValueAtTime(freq - 25, start + 0.07);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.075);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.08);
      }

      // Final pop
      const popOsc = this.ctx.createOscillator();
      const popGain = this.ctx.createGain();
      popOsc.type = 'square';
      const popTime = now + 11 * 0.08;
      popOsc.frequency.setValueAtTime(100, popTime);
      popGain.gain.setValueAtTime(0.2, popTime);
      popGain.gain.exponentialRampToValueAtTime(0.001, popTime + 0.15);

      popOsc.connect(popGain);
      popGain.connect(this.masterGain);
      popOsc.start(popTime);
      popOsc.stop(popTime + 0.16);
    } catch {
      // Ignore
    }
  }

  // Classic game start jingle
  public playStartJingle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      // Authentic Pac-Man intro melody notes:
      // B4, B5, F#5, D#5, B5, F#5, D#5, C5, C6, G5, E5, C6, G5, E5, B4, B5, F#5, D#5, B5, F#5, D#5, D#5, E5, F5, F5, F#5, G5, G#5, A5, B5
      const notes = [
        { f: 493.88, d: 0.12 },
        { f: 987.77, d: 0.12 },
        { f: 739.99, d: 0.12 },
        { f: 622.25, d: 0.12 },
        { f: 987.77, d: 0.08 },
        { f: 739.99, d: 0.15 },
        { f: 523.25, d: 0.12 },
        { f: 1046.5, d: 0.12 },
        { f: 783.99, d: 0.12 },
        { f: 659.25, d: 0.12 },
        { f: 1046.5, d: 0.08 },
        { f: 783.99, d: 0.15 },
        { f: 493.88, d: 0.12 },
        { f: 987.77, d: 0.12 },
        { f: 739.99, d: 0.12 },
        { f: 622.25, d: 0.12 },
        { f: 659.25, d: 0.08 },
        { f: 698.46, d: 0.08 },
        { f: 739.99, d: 0.08 },
        { f: 880.00, d: 0.10 },
        { f: 987.77, d: 0.25 },
      ];

      let t = this.ctx.currentTime + 0.05;
      notes.forEach((n) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';

        osc.frequency.setValueAtTime(n.f, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.d - 0.01);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(t);
        osc.stop(t + n.d);
        t += n.d;
      });
    } catch {
      // Ignore
    }
  }

  // Level Clear fanfare
  public playLevelClear() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    try {
      const melody = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      let t = this.ctx.currentTime;
      melody.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const start = t + idx * 0.12;

        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.18, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(start);
        osc.stop(start + 0.2);
      });
    } catch {
      // Ignore
    }
  }
}

export const arcadeAudio = new ArcadeAudioEngine();
