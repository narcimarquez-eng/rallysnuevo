// Entrada unificada: Teclado (WASD/Flechas/Espacio/C/R), Mando (Gamepad API) y Táctil (móvil multi-touch).
export class GestorControles {
  constructor(elementosTactiles) {
    this.teclas = new Set();
    this.tactil = { izq: false, der: false, gas: false, freno: false, mano: false, ejeDesliz: null };
    this.modoTactil = this._detectarTactil();
    this.callbacks = {};
    this._prevBotonesPad = { camara: false, recolocar: false, pausa: false };
    this.mandoActivo = false;

    this._vincularTeclado();
    if (elementosTactiles) this._vincularTactil(elementosTactiles);
  }

  _detectarTactil() {
    if (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) return true;
    return typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0 && window.innerWidth <= 1024;
  }

  alPulsar(accion, fn) {
    this.callbacks[accion] = fn;
  }

  _disparar(accion) {
    if (this.callbacks[accion]) this.callbacks[accion]();
  }

  _vincularTeclado() {
    window.addEventListener('keydown', e => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const code = e.code;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
        e.preventDefault();
      }
      if (!e.repeat) {
        if (code === 'KeyC') this._disparar('camara');
        if (code === 'KeyR') this._disparar('recolocar');
        if (code === 'Escape' || code === 'KeyP') this._disparar('pausa');
      }
      this.teclas.add(code);
    }, { passive: false });

    window.addEventListener('keyup', e => {
      this.teclas.delete(e.code);
    });

    window.addEventListener('blur', () => {
      this.teclas.clear();
      this.limpiarTactil();
    });
  }

  limpiarTactil() {
    this.tactil.izq = false;
    this.tactil.der = false;
    this.tactil.gas = false;
    this.tactil.freno = false;
    this.tactil.mano = false;
    this.tactil.ejeDesliz = null;
  }

  _vincularTactil(els) {
    const enlazarBoton = (el, campo) => {
      if (!el) return;
      const punteros = new Set();
      const actualizar = () => {
        this.tactil[campo] = punteros.size > 0;
        el.classList.toggle('activo', this.tactil[campo]);
      };
      el.addEventListener('pointerdown', e => {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch { /* noop */ }
        punteros.add(e.pointerId);
        actualizar();
      }, { passive: false });
      const soltar = e => {
        punteros.delete(e.pointerId);
        actualizar();
      };
      el.addEventListener('pointerup', soltar);
      el.addEventListener('pointercancel', soltar);
      el.addEventListener('lostpointercapture', soltar);
    };

    enlazarBoton(els.izq, 'izq');
    enlazarBoton(els.der, 'der');
    enlazarBoton(els.gas, 'gas');
    enlazarBoton(els.freno, 'freno');
    enlazarBoton(els.mano, 'mano');

    if (els.camara) els.camara.addEventListener('click', () => this._disparar('camara'));
    if (els.recolocar) els.recolocar.addEventListener('click', () => this._disparar('recolocar'));
    if (els.pausa) els.pausa.addEventListener('click', () => this._disparar('pausa'));
  }

  leer() {
    let acelerar = 0;
    let frenar = 0;
    let giro = 0;
    let frenoMano = false;

    // 1. Teclado
    if (this.teclas.has('KeyW') || this.teclas.has('ArrowUp')) acelerar = 1;
    if (this.teclas.has('KeyS') || this.teclas.has('ArrowDown')) frenar = 1;
    if (this.teclas.has('KeyA') || this.teclas.has('ArrowLeft')) giro -= 1;
    if (this.teclas.has('KeyD') || this.teclas.has('ArrowRight')) giro += 1;
    if (this.teclas.has('Space')) frenoMano = true;

    // 2. Táctil
    if (this.tactil.gas) acelerar = 1;
    if (this.tactil.freno) frenar = 1;
    if (this.tactil.izq) giro -= 1;
    if (this.tactil.der) giro += 1;
    if (this.tactil.mano) frenoMano = true;

    // 3. Mando (Gamepad API)
    let padConectado = false;
    if (typeof navigator.getGamepads === 'function') {
      const pads = navigator.getGamepads();
      for (const pad of pads) {
        if (!pad || !pad.connected) continue;
        padConectado = true;
        const ejeX = pad.axes[0] || 0;
        if (Math.abs(ejeX) > 0.12) {
          const norm = (Math.abs(ejeX) - 0.12) / 0.88;
          giro += Math.sign(ejeX) * Math.min(1, norm);
        }
        const rt = pad.buttons[7]?.value || 0;
        const lt = pad.buttons[6]?.value || 0;
        if (rt > 0.05) acelerar = Math.max(acelerar, rt);
        if (lt > 0.05) frenar = Math.max(frenar, lt);
        if (pad.buttons[0]?.pressed || pad.buttons[2]?.pressed) frenoMano = true;
        if (pad.buttons[12]?.pressed) acelerar = 1;
        if (pad.buttons[13]?.pressed) frenar = 1;
        if (pad.buttons[14]?.pressed) giro -= 1;
        if (pad.buttons[15]?.pressed) giro += 1;

        const btnCam = Boolean(pad.buttons[3]?.pressed); // Y / Triángulo
        if (btnCam && !this._prevBotonesPad.camara) this._disparar('camara');
        this._prevBotonesPad.camara = btnCam;

        const btnRec = Boolean(pad.buttons[1]?.pressed); // B / Círculo
        if (btnRec && !this._prevBotonesPad.recolocar) this._disparar('recolocar');
        this._prevBotonesPad.recolocar = btnRec;

        const btnPausa = Boolean(pad.buttons[9]?.pressed); // Start
        if (btnPausa && !this._prevBotonesPad.pausa) this._disparar('pausa');
        this._prevBotonesPad.pausa = btnPausa;
        break;
      }
    }
    this.mandoActivo = padConectado;

    return {
      acelerar: Math.max(0, Math.min(1, acelerar)),
      frenar: Math.max(0, Math.min(1, frenar)),
      giro: Math.max(-1, Math.min(1, giro)),
      frenoMano
    };
  }
}
