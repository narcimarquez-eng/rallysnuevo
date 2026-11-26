// Consultas rápidas de terreno, superficies, puentes, rampas y agua para física a 120 Hz.
const E = window.Escenario;

export const PROPIEDADES_SUPERFICIE = {
  asfalto: { nombre: 'Asfalto', agarre: 1.08, traccion: 1.06, arrastre: 0.008, baches: 0.004, particula: 'humo' },
  piedra:  { nombre: 'Calzada / Piedra', agarre: 0.94, traccion: 0.95, arrastre: 0.012, baches: 0.014, particula: 'polvo' },
  adoquin: { nombre: 'Adoquín', agarre: 0.92, traccion: 0.94, arrastre: 0.012, baches: 0.016, particula: 'polvo' },
  grava:   { nombre: 'Grava', agarre: 0.76, traccion: 0.82, arrastre: 0.022, baches: 0.026, particula: 'polvo' },
  tierra:  { nombre: 'Tierra', agarre: 0.70, traccion: 0.78, arrastre: 0.026, baches: 0.032, particula: 'polvo' },
  arena:   { nombre: 'Arena', agarre: 0.58, traccion: 0.68, arrastre: 0.055, baches: 0.030, particula: 'polvo' },
  hierba:  { nombre: 'Hierba', agarre: 0.52, traccion: 0.64, arrastre: 0.048, baches: 0.042, particula: 'hierba' },
  nieve:   { nombre: 'Nieve', agarre: 0.48, traccion: 0.58, arrastre: 0.038, baches: 0.022, particula: 'nieve' },
  barro:   { nombre: 'Barro', agarre: 0.40, traccion: 0.50, arrastre: 0.095, baches: 0.045, particula: 'barro' },
  agua:    { nombre: 'Agua (Vado)', agarre: 0.44, traccion: 0.54, arrastre: 0.140, baches: 0.020, particula: 'agua' }
};

// Mapeo de id de material de terreno (Escenario.MATERIALES) a nombre de superficie física
const MATERIAL_A_SUPERFICIE = {
  1: 'hierba',
  2: 'hierba',
  3: 'tierra',
  4: 'piedra',
  5: 'arena',
  6: 'nieve',
  7: 'asfalto',
  8: 'barro',
  9: 'grava',
  10: 'hierba',
  11: 'tierra',
  12: 'nieve',
  13: 'piedra'
};

function smoothstep(x) {
  const t = Math.max(0, Math.min(1, x));
  return t * t * (3 - 2 * t);
}

export class MundoFisica {
  constructor(escenario) {
    this.esc = escenario;
    this.celda = 20;
    this.rejillaCaminos = new Map();
    this.rejillaRios = new Map();
    this.puentes = [];
    this.lagos = [];
    this.pueblos = [];
    this._indexar();
  }

  _clave(ix, iz) { return ix + ',' + iz; }

  _insertarSegmento(mapa, seg) {
    const pad = seg.radio + 2;
    const x0 = Math.floor((Math.min(seg.ax, seg.bx) - pad) / this.celda);
    const x1 = Math.floor((Math.max(seg.ax, seg.bx) + pad) / this.celda);
    const z0 = Math.floor((Math.min(seg.az, seg.bz) - pad) / this.celda);
    const z1 = Math.floor((Math.max(seg.az, seg.bz) + pad) / this.celda);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const k = this._clave(ix, iz);
        let arr = mapa.get(k);
        if (!arr) { arr = []; mapa.set(k, arr); }
        arr.push(seg);
      }
    }
  }

  _indexar() {
    const esc = this.esc;
    this.pueblos = (esc.elementos || []).filter(e => e.tipo === 'pueblo' && e.props?.cfg);

    // 1. Indexar caminos y puentes asociados
    for (const c of esc.caminos || []) {
      if ((c.puntos || []).length < 2) continue;
      const mu = E.muestrearCamino(c, 2);
      if (mu.length < 2) continue;

      if (E.esRio(c)) {
        const niv = E.nivelesRio(esc, c, mu);
        for (let i = 0; i < mu.length - 1; i++) {
          const a = mu[i], b = mu[i + 1];
          const dx = b.x - a.x, dz = b.z - a.z;
          const len2 = dx * dx + dz * dz || 1;
          this._insertarSegmento(this.rejillaRios, {
            ax: a.x, az: a.z, bx: b.x, bz: b.z, dx, dz, len2,
            nivA: niv[i], nivB: niv[i + 1],
            radio: c.ancho * 0.72
          });
        }
        continue;
      }

      const total = mu[mu.length - 1].d;
      const puentesC = this._construirPuentesDeCamino(c, mu);
      this.puentes.push(...puentesC);

      for (let i = 0; i < mu.length - 1; i++) {
        const a = mu[i], b = mu[i + 1];
        const dx = b.x - a.x, dz = b.z - a.z;
        const len2 = dx * dx + dz * dz || 1;
        this._insertarSegmento(this.rejillaCaminos, {
          camino: c, total,
          ax: a.x, az: a.z, bx: b.x, bz: b.z, dx, dz, len2,
          dA: a.d, dB: b.d,
          radio: c.ancho * 0.56,
          anchoMitad: c.ancho * 0.5,
          puentes: puentesC
        });
      }
    }

    // 2. Precalcular lagos
    for (const el of esc.elementos || []) {
      if (el.tipo !== 'lago') continue;
      const base = E.alturaEn(esc, el.x, el.z);
      this.lagos.push({
        x: el.x, z: el.z,
        radio: (el.props?.radio || 30) * 1.25,
        nivel: base + (el.props?.nivel || 0) + 0.05
      });
    }
  }

  _construirPuentesDeCamino(camino, mu) {
    const esc = this.esc;
    const out = [];
    for (const el of esc.elementos || []) {
      if (el.tipo !== 'puente' || el.props?.camino !== camino.id) continue;
      const def = E.PUENTES[el.props.modelo] || E.PUENTES.romano;
      const pr = E.proyectarEnCamino(camino, el.x, el.z, mu);
      if (!pr || pr.dist > camino.ancho) continue;
      const largo = el.props.largo || def.vano;
      const ancho = el.props.ancho || def.calzada;
      const yBase = E.alturaEn(esc, el.x, el.z) + (el.y || 0);
      const altoExtremo = yBase + def.extremo;
      const arcoExtra = Math.max(0, def.centro - def.extremo);
      const rad = (el.rotY || 0) * Math.PI / 180;
      // En Mundos-, el puente cruza a lo largo de su X local (rotY=0 => eje +X)
      const dirX = Math.cos(rad);
      const dirZ = -Math.sin(rad);
      const normX = Math.sin(rad);
      const normZ = Math.cos(rad);
      out.push({
        id: el.id,
        modelo: el.props.modelo,
        cx: el.x, cz: el.z,
        dirX, dirZ, normX, normZ,
        largo, mitadLargo: largo * 0.5,
        ancho, mitadAncho: ancho * 0.5,
        d0: pr.d - largo * 0.5,
        d1: pr.d + largo * 0.5,
        alto: altoExtremo,
        arcoExtra,
        rampa: Math.max(4, def.extremo * 3)
      });
    }
    return out;
  }

  _consultarSegmentos(mapa, x, z) {
    const ix = Math.floor(x / this.celda);
    const iz = Math.floor(z / this.celda);
    const lista = mapa.get(this._clave(ix, iz));
    if (!lista) return null;

    let mejor = null;
    for (let i = 0; i < lista.length; i++) {
      const s = lista[i];
      const px = x - s.ax, pz = z - s.az;
      const t = Math.max(0, Math.min(1, (px * s.dx + pz * s.dz) / s.len2));
      const cx = s.ax + s.dx * t;
      const cz = s.az + s.dz * t;
      const dist = Math.hypot(x - cx, z - cz);
      if (dist <= s.radio && (!mejor || dist < mejor.dist)) {
        mejor = { seg: s, t, dist };
      }
    }
    return mejor;
  }

  /** Devuelve el nivel del agua en (x, z) o -Infinity si está seco. */
  nivelAguaEn(x, z) {
    let nivel = -Infinity;
    const ag = this.esc.terreno.agua;
    if (ag && ag.activa) nivel = Math.max(nivel, ag.nivel);

    for (const l of this.lagos) {
      if (Math.hypot(x - l.x, z - l.z) <= l.radio) {
        nivel = Math.max(nivel, l.nivel);
      }
    }

    const rHit = this._consultarSegmentos(this.rejillaRios, x, z);
    if (rHit) {
      const nivRio = rHit.seg.nivA + (rHit.seg.nivB - rHit.seg.nivA) * rHit.t;
      nivel = Math.max(nivel, nivRio);
    }
    return nivel;
  }

  /**
   * Muestrea altura de conducción, pendiente aproximada, superficie y agua bajo una rueda o el coche.
   */
  muestrear(x, z) {
    const yTerreno = E.alturaEn(this.esc, x, z);
    let y = yTerreno;
    let enPuente = false;
    let superficie = MATERIAL_A_SUPERFICIE[E.materialEn(this.esc, x, z)] || 'hierba';
    let camino = null;
    let dCamino = 0;
    let lateral = Infinity;
    let enPueblo = false;

    for (const pu of this.pueblos) {
      if (E.dentroTerrenoPueblo(pu, x, z, 0)) {
        enPueblo = true;
        break;
      }
    }

    const cHit = this._consultarSegmentos(this.rejillaCaminos, x, z);
    if (cHit) {
      const s = cHit.seg;
      camino = s.camino;
      dCamino = s.dA + (s.dB - s.dA) * cHit.t;
      lateral = cHit.dist;
      const dentroCalzada = cHit.dist <= s.anchoMitad;

      if (enPueblo) {
        superficie = 'piedra';
      } else if (dentroCalzada) {
        superficie = E.superficieEn(camino, dCamino);
      }

      // Comprobar rampas y tablero de puente exactamente igual que Escena3D._mallaCamino
      if (s.puentes.length && cHit.dist <= s.anchoMitad + 1.2) {
        let mejorRampa = null;
        for (const b of s.puentes) {
          const fuera = dCamino < b.d0 ? b.d0 - dCamino : dCamino > b.d1 ? dCamino - b.d1 : 0;
          if (fuera <= b.rampa) {
            const f = smoothstep(1 - fuera / b.rampa);
            if (!mejorRampa || f > mejorRampa.f) {
              // Arco suave del tablero en el tramo del puente
              let extra = 0;
              if (fuera === 0 && b.d1 > b.d0) {
                const u = (dCamino - b.d0) / (b.d1 - b.d0);
                extra = Math.sin(Math.PI * Math.max(0, Math.min(1, u))) * b.arcoExtra;
              }
              mejorRampa = { alto: b.alto + extra, f, fuera };
            }
          }
        }
        if (mejorRampa) {
          const yTablero = yTerreno + (mejorRampa.alto + 0.08 - yTerreno) * mejorRampa.f;
          if (yTablero > y) y = yTablero;
          if (mejorRampa.fuera === 0) {
            enPuente = true;
            superficie = 'piedra';
          }
        }
      }
    }

    // También comprobar por geometría directa del puente (por si la proyección de curva difiere unos cm)
    if (!enPuente) {
      for (const b of this.puentes) {
        const dx = x - b.cx, dz = z - b.cz;
        const along = dx * b.dirX + dz * b.dirZ;
        const across = Math.abs(dx * b.normX + dz * b.normZ);
        if (Math.abs(along) <= b.mitadLargo && across <= b.mitadAncho + 0.4) {
          const u = (along + b.mitadLargo) / Math.max(1, b.largo);
          const yTablero = b.alto + Math.sin(Math.PI * Math.max(0, Math.min(1, u))) * b.arcoExtra + 0.08;
          if (yTablero > y) {
            y = yTablero;
            enPuente = true;
            superficie = 'piedra';
          }
        }
      }
    }

    const nivelAgua = enPuente ? -Infinity : this.nivelAguaEn(x, z);
    const profundidadAgua = nivelAgua > y + 0.03 ? nivelAgua - y : 0;
    if (profundidadAgua > 0.05) {
      superficie = 'agua';
    }

    return {
      y,
      yTerreno,
      enPuente,
      enPueblo,
      superficie,
      props: PROPIEDADES_SUPERFICIE[superficie] || PROPIEDADES_SUPERFICIE.hierba,
      profundidadAgua,
      camino,
      dCamino,
      lateral
    };
  }
}
