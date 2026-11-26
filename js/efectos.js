// Efectos visuales ligeros: partículas de polvo/barro/humo/agua con InstancedMesh y minimapa 2D.
import * as THREE from 'three';

const COLORES_SUP = {
  polvo: new THREE.Color('#c8a879'),
  barro: new THREE.Color('#5a3e28'),
  humo:  new THREE.Color('#e6e8ec'),
  agua:  new THREE.Color('#b8e6ff'),
  hierba: new THREE.Color('#6a8f45'),
  nieve: new THREE.Color('#f2f7ff')
};

export class SistemaParticulas {
  constructor(scene, maximo = 220) {
    this.maximo = maximo;
    this.indice = 0;
    this.activas = new Array(maximo).fill(null).map(() => ({
      vida: 0, maxVida: 1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, tam: 0.3, color: COLORES_SUP.polvo
    }));

    const geo = new THREE.DodecahedronGeometry(0.5, 0);
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.35,
      depthWrite: false
    });
    this.malla = new THREE.InstancedMesh(geo, mat, maximo);
    this.malla.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.malla.frustumCulled = false;

    this._m4 = new THREE.Matrix4();
    this._pos = new THREE.Vector3();
    this._q = new THREE.Quaternion();
    this._esc = new THREE.Vector3();
    for (let i = 0; i < maximo; i++) {
      this._m4.compose(this._pos.set(0, -9999, 0), this._q, this._esc.setScalar(0.001));
      this.malla.setMatrixAt(i, this._m4);
      this.malla.setColorAt(i, COLORES_SUP.polvo);
    }
    scene.add(this.malla);
    this._acum = 0;
  }

  emitir(x, y, z, vx, vy, vz, tipo = 'polvo', tam = 0.45, maxVida = 0.75) {
    const p = this.activas[this.indice];
    this.indice = (this.indice + 1) % this.maximo;
    p.vida = maxVida;
    p.maxVida = maxVida;
    p.x = x; p.y = y; p.z = z;
    p.vx = vx; p.vy = vy; p.vz = vz;
    p.tam = tam;
    p.color = COLORES_SUP[tipo] || COLORES_SUP.polvo;
  }

  actualizarDesdeCoche(dt, estado, medidas) {
    const emitirPolvo = estado.enSuelo && (
      estado.profundidadAgua > 0.06 ||
      estado.derrapando ||
      (estado.velocidadKmh > 22 && ['grava', 'tierra', 'arena', 'barro', 'hierba', 'nieve'].includes(estado.superficie))
    );

    if (emitirPolvo) {
      const tasa = estado.profundidadAgua > 0.06 ? 34 : (estado.derrapando ? 28 : 14);
      this._acum += dt * tasa;
      const fx = Math.sin(estado.yaw), fz = Math.cos(estado.yaw);
      const rx = Math.cos(estado.yaw), rz = -Math.sin(estado.yaw);
      const halfW = (medidas?.via || 1.6) * 0.48;
      const rearZ = -(medidas?.batalla || 2.5) * 0.5;
      const tipo = estado.profundidadAgua > 0.06
        ? 'agua'
        : (estado.superficie === 'asfalto' ? 'humo'
          : estado.superficie === 'barro' ? 'barro'
            : estado.superficie === 'nieve' ? 'nieve'
              : estado.superficie === 'hierba' ? 'hierba' : 'polvo');

      while (this._acum >= 1) {
        this._acum -= 1;
        for (const sx of [-1, 1]) {
          const wx = estado.x + fx * rearZ + rx * halfW * sx + (Math.random() - 0.5) * 0.35;
          const wz = estado.z + fz * rearZ + rz * halfW * sx + (Math.random() - 0.5) * 0.35;
          const vy = tipo === 'agua' ? 2.4 + Math.random() * 2.2 : 0.7 + Math.random() * 1.1;
          this.emitir(
            wx, estado.y + 0.25, wz,
            -fx * 1.5 + (Math.random() - 0.5) * 2.2,
            vy,
            -fz * 1.5 + (Math.random() - 0.5) * 2.2,
            tipo,
            tipo === 'agua' ? 0.34 : (estado.derrapando ? 0.48 : 0.34),
            tipo === 'agua' ? 0.50 : 0.72
          );
        }
      }
    }

    let sucias = false;
    for (let i = 0; i < this.maximo; i++) {
      const p = this.activas[i];
      if (p.vida <= 0) continue;
      sucias = true;
      p.vida -= dt;
      if (p.vida <= 0) {
        this._m4.compose(this._pos.set(0, -9999, 0), this._q, this._esc.setScalar(0.001));
        this.malla.setMatrixAt(i, this._m4);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.color === COLORES_SUP.agua || p.color === COLORES_SUP.barro) {
        p.vy -= 7.5 * dt;
      } else {
        p.vy += 0.45 * dt;
        p.vx *= Math.max(0, 1 - 1.8 * dt);
        p.vz *= Math.max(0, 1 - 1.8 * dt);
      }
      const prog = 1 - p.vida / p.maxVida;
      const sc = p.tam * (0.65 + prog * 1.35) * Math.min(1, p.vida * 4);
      this._m4.compose(this._pos.set(p.x, p.y, p.z), this._q, this._esc.setScalar(Math.max(0.01, sc)));
      this.malla.setMatrixAt(i, this._m4);
      this.malla.setColorAt(i, p.color);
    }
    if (sucias) {
      this.malla.instanceMatrix.needsUpdate = true;
      if (this.malla.instanceColor) this.malla.instanceColor.needsUpdate = true;
    }
  }
}

export class Minimapa {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.esc = null;
    this.circuito = null;
    this.escala = 1;
    this.ox = 0;
    this.oz = 0;
  }

  configurar(escenario, circuito) {
    this.esc = escenario;
    this.circuito = circuito;
    const tam = escenario?.terreno?.tam || 1536;
    const w = this.canvas.width;
    this.escala = (w - 20) / tam;
    this.ox = w * 0.5;
    this.oz = w * 0.5;
  }

  _p(x, z) {
    return [this.ox + x * this.escala, this.oz + z * this.escala];
  }

  dibujar(estadoCoche, siguienteObjetivo) {
    if (!this.esc || !this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Fondo
    ctx.fillStyle = 'rgba(13, 18, 26, 0.78)';
    ctx.fillRect(0, 0, w, h);

    // Lagos
    for (const el of this.esc.elementos || []) {
      if (el.tipo === 'lago') {
        const [px, pz] = this._p(el.x, el.z);
        ctx.fillStyle = 'rgba(54, 134, 184, 0.55)';
        ctx.beginPath();
        ctx.arc(px, pz, Math.max(3, (el.props?.radio || 20) * this.escala), 0, Math.PI * 2);
        ctx.fill();
      } else if (el.tipo === 'pueblo') {
        const [px, pz] = this._p(el.x, el.z);
        ctx.fillStyle = 'rgba(244, 232, 209, 0.35)';
        ctx.beginPath();
        ctx.arc(px, pz, Math.max(5, (el.props?.radio || 50) * this.escala * 0.7), 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Riachuelos
    const E = window.Escenario;
    for (const c of this.esc.caminos || []) {
      if (!E.esRio(c) || (c.puntos || []).length < 2) continue;
      const mu = E.muestrearCamino(c, 10);
      ctx.strokeStyle = 'rgba(72, 168, 224, 0.72)';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      mu.forEach((m, i) => {
        const [px, pz] = this._p(m.x, m.z);
        if (i === 0) ctx.moveTo(px, pz); else ctx.lineTo(px, pz);
      });
      ctx.stroke();
    }

    // Circuito principal
    const mu = this.circuito?.muestras || [];
    if (mu.length >= 2) {
      ctx.strokeStyle = '#d6c3a5';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      mu.forEach((m, i) => {
        const [px, pz] = this._p(m.x, m.z);
        if (i === 0) ctx.moveTo(px, pz); else ctx.lineTo(px, pz);
      });
      if (this.circuito.cerrado) ctx.closePath();
      ctx.stroke();
    }

    // Meta y puntos de control
    if (this.circuito?.meta) {
      const [mx, mz] = this._p(this.circuito.meta.x, this.circuito.meta.z);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(mx - 3.5, mz - 3.5, 7, 7);
    }

    for (const cp of this.circuito?.controles || []) {
      const esSiguiente = siguienteObjetivo && siguienteObjetivo.id === cp.id;
      const [cx, cz] = this._p(cp.x, cp.z);
      ctx.fillStyle = esSiguiente ? '#ffd21f' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cz, esSiguiente ? 4.8 : 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coche
    if (estadoCoche) {
      const [cx, cz] = this._p(estadoCoche.x, estadoCoche.z);
      ctx.save();
      ctx.translate(cx, cz);
      // En canvas: +X derecha, +Y abajo (= +Z mundo), rotY=0 mira +Z (abajo), giro positivo va a +X (izquierda en pantalla 3D, derecha en canvas => -yaw)
      ctx.rotate(-estadoCoche.yaw);
      ctx.fillStyle = '#ff3b30';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.lineTo(-4.5, -5);
      ctx.lineTo(4.5, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }
}
