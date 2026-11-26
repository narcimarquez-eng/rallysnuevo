// Audio procedural con Web Audio API: motor por RPM, rodadura/derrape por superficie, agua, impactos y avisos.
export class GestorSonido {
  constructor() {
    this.ctx = null;
    this.activo = true;
    this.iniciado = false;
    this.master = null;
  }

  setActivo(v) {
    this.activo = Boolean(v);
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.activo ? 0.36 : 0, this.ctx.currentTime, 0.05);
    }
  }

  iniciar() {
    if (this.iniciado) {
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.activo ? 0.36 : 0;
      this.master.connect(this.ctx.destination);

      // 1. Motor: dos osciladores graves filtrados por paso bajo
      this.motorOsc1 = this.ctx.createOscillator();
      this.motorOsc1.type = 'sawtooth';
      this.motorOsc1.frequency.value = 55;

      this.motorOsc2 = this.ctx.createOscillator();
      this.motorOsc2.type = 'triangle';
      this.motorOsc2.frequency.value = 110;

      this.motorFiltro = this.ctx.createBiquadFilter();
      this.motorFiltro.type = 'lowpass';
      this.motorFiltro.frequency.value = 260;
      this.motorFiltro.Q.value = 2.4;

      this.motorGanancia = this.ctx.createGain();
      this.motorGanancia.gain.value = 0.001;

      this.motorOsc1.connect(this.motorFiltro);
      this.motorOsc2.connect(this.motorFiltro);
      this.motorFiltro.connect(this.motorGanancia);
      this.motorGanancia.connect(this.master);

      this.motorOsc1.start();
      this.motorOsc2.start();

      // 2. Superficie / derrape / agua: ruido continuo filtrado
      const bufSize = this.ctx.sampleRate * 2;
      const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      let b0 = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.92 * b0 + 0.08 * white;
        data[i] = white * 0.5 + b0 * 0.8;
      }

      this.ruidoSrc = this.ctx.createBufferSource();
      this.ruidoSrc.buffer = buf;
      this.ruidoSrc.loop = true;

      this.ruidoFiltro = this.ctx.createBiquadFilter();
      this.ruidoFiltro.type = 'bandpass';
      this.ruidoFiltro.frequency.value = 800;
      this.ruidoFiltro.Q.value = 1.2;

      this.ruidoGanancia = this.ctx.createGain();
      this.ruidoGanancia.gain.value = 0;

      this.ruidoSrc.connect(this.ruidoFiltro);
      this.ruidoFiltro.connect(this.ruidoGanancia);
      this.ruidoGanancia.connect(this.master);
      this.ruidoSrc.start();

      this.iniciado = true;
    } catch {
      this.iniciado = false;
    }
  }

  actualizar(estado, gas = 0, enPausa = false) {
    if (!this.iniciado || !this.ctx) return;
    const t = this.ctx.currentTime;

    if (!this.activo || enPausa) {
      this.motorGanancia.gain.setTargetAtTime(0, t, 0.05);
      this.ruidoGanancia.gain.setTargetAtTime(0, t, 0.05);
      return;
    }

    // Motor según RPM y aceleración
    const rpmNorm = Math.max(0, Math.min(1, (estado.rpm - 900) / 6500));
    const freq = 36 + rpmNorm * 135;
    this.motorOsc1.frequency.setTargetAtTime(freq, t, 0.03);
    this.motorOsc2.frequency.setTargetAtTime(freq * 2.01, t, 0.03);
    this.motorFiltro.frequency.setTargetAtTime(180 + rpmNorm * 950 + gas * 320, t, 0.04);
    this.motorGanancia.gain.setTargetAtTime(0.14 + rpmNorm * 0.16 + gas * 0.08, t, 0.04);

    // Sonido de superficie y derrape
    const velNorm = Math.min(1, estado.velocidadKmh / 95);
    let volSup = 0;
    let freqSup = 900;
    let qSup = 1.0;

    if (estado.enSuelo && estado.velocidadKmh > 3) {
      const sup = estado.superficie;
      if (sup === 'agua' || estado.profundidadAgua > 0.08) {
        freqSup = 650 + velNorm * 650;
        qSup = 0.7;
        volSup = Math.min(0.45, velNorm * 0.42);
      } else if (sup === 'asfalto') {
        freqSup = 1850;
        qSup = 3.2;
        volSup = estado.derrapando ? Math.min(0.35, estado.deslizamiento * 0.25) : velNorm * 0.03;
      } else if (sup === 'barro') {
        freqSup = 420;
        qSup = 0.9;
        volSup = velNorm * 0.22 + (estado.derrapando ? 0.12 : 0);
      } else if (sup === 'grava' || sup === 'tierra' || sup === 'arena') {
        freqSup = 1150 + velNorm * 600;
        qSup = 1.1;
        volSup = velNorm * 0.16 + (estado.derrapando ? 0.18 : 0);
      } else {
        freqSup = 750;
        qSup = 0.85;
        volSup = velNorm * 0.14 + (estado.derrapando ? 0.14 : 0);
      }
    }

    this.ruidoFiltro.frequency.setTargetAtTime(freqSup, t, 0.05);
    this.ruidoFiltro.Q.setTargetAtTime(qSup, t, 0.05);
    this.ruidoGanancia.gain.setTargetAtTime(volSup, t, 0.05);
  }

  tocarTono(freq, duracion = 0.12, tipo = 'sine', volumen = 0.24) {
    if (!this.iniciado || !this.ctx || !this.activo) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(volumen, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + duracion);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + duracion + 0.02);
  }

  sonarImpacto(intensidad = 4) {
    if (!this.iniciado || !this.ctx || !this.activo) return;
    const t = this.ctx.currentTime;
    const vol = Math.min(0.48, 0.1 + intensidad * 0.035);
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(34, t + 0.18);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  sonarCuenta(numero) {
    if (numero > 0) this.tocarTono(520, 0.14, 'triangle', 0.24);
    else this.tocarTono(880, 0.34, 'triangle', 0.32);
  }

  sonarCheckpoint() {
    this.tocarTono(660, 0.09, 'sine', 0.22);
    setTimeout(() => this.tocarTono(990, 0.14, 'sine', 0.22), 75);
  }

  sonarMeta() {
    this.tocarTono(523.25, 0.11, 'triangle', 0.26);
    setTimeout(() => this.tocarTono(659.25, 0.11, 'triangle', 0.26), 95);
    setTimeout(() => this.tocarTono(783.99, 0.14, 'triangle', 0.28), 190);
    setTimeout(() => this.tocarTono(1046.5, 0.32, 'triangle', 0.30), 290);
  }
}
