// Hierba, trigo, flores, hierba alta y bambú alrededor de la cámara, con los atlas de js/pradera-atlas.js.
// Qué crece en cada sitio lo decide Escenario.vegetacionEn (pintado a mano o automático sobre suelos de hierba).
// El suelo se reparte en teselas de 16 m; cada tesela se calcula una vez (cerca: matas cada ~0,9 m con la
// geometría de 3 planos; lejos: matas grandes cada ~2,2 m con la de 2 planos) y se guarda. Al moverse la cámara
// solo se juntan las teselas que tocan. Los bordes se funden con la distancia en el propio shader.
import * as THREE from 'three';

const E = window.Escenario;
const L = window.PraderaAtlasLib;
const TIPOS = ['hierba', 'trigo', 'flores', 'hierbaAlta', 'bambu'];
const TESELA = 16;

// Radios (m): cerca = matas detalladas, lejos = fin de la pradera
export const RADIOS_PRADERA = {
  baja: { cerca: 26, lejos: 85, paso: 1.15, pasoLejos: 3.0 },
  media: { cerca: 45, lejos: 140, paso: 0.9, pasoLejos: 2.6 },
  alta: { cerca: 65, lejos: 210, paso: 0.85, pasoLejos: 2.5 }
};
// Color según el suelo donde crece (hierba seca más amarilla, musgo más oscuro…)
const TINTE_SUELO = { 1: [1, 1, 1], 2: [1.18, 1.03, 0.6], 10: [0.78, 0.94, 0.74], 3: [1.05, 0.96, 0.78], 5: [1.12, 1.02, 0.72], 8: [0.86, 0.86, 0.7], 6: [1.05, 1.08, 1.1] };

function hash(ix, iz, k) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iz, 668265263) ^ Math.imul(k + 1, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

export class Pradera {
  // opts: { renderer, calidad }
  constructor(opts) {
    this.o = opts;
    this.r = RADIOS_PRADERA[opts.calidad] || RADIOS_PRADERA.media;
    this.grupo = new THREE.Group(); this.grupo.name = 'pradera';
    this.u = { uTime: { value: 0 }, uHeroXZ: { value: new THREE.Vector2() } };
    this.cache = new Map();     // 'tx,tz,nivel' → { tipo: { m: Float32Array, c: Float32Array, col: Float32Array, n } }
    this.capas = null;
    this.centro = null;
    this.visible = true;
  }
  _crearCapas() {
    if (!L) { console.warn('Falta PraderaAtlasLib (js/pradera-atlas.js)'); return; }
    const r = this.r, rend = this.o.renderer;
    const capCerca = Math.ceil(Math.PI * (r.cerca + TESELA * 1.5) ** 2 / (r.paso * r.paso));
    const capLejos = Math.ceil(Math.PI * (r.lejos + TESELA * 1.5) ** 2 / (r.pasoLejos * r.pasoLejos));
    this.capas = {};
    for (const tipo of TIPOS) {
      const cerca = L.crearCapaPradera(THREE, tipo, capCerca, this.u, rend, { fadeStart: r.cerca - 9, fadeEnd: r.cerca });
      const lejos = L.crearCapaPradera(THREE, tipo, capLejos, this.u, rend, { esLejana: true, texCompartida: cerca.userData.atlasTex, fadeInStart: r.cerca - 9, fadeInEnd: r.cerca - 1, fadeStart: r.lejos - 30, fadeEnd: r.lejos });
      for (const m of [cerca, lejos]) { m.visible = true; m.instanceColor.setUsage(THREE.DynamicDrawUsage); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.grupo.add(m); }
      this.capas[tipo] = { cerca, lejos };
    }
  }

  // Escenario y escena (para la altura, los caminos y las áreas que no llevan hierba)
  usar(esc, escena) { this.esc = esc; this.escena = escena; this.invalidar(); }
  // Vuelve a calcular todo, o solo las teselas de una región de la rejilla del terreno
  invalidar(reg) {
    if (!reg || !this.esc) { this.cache.clear(); this.centro = null; return; }
    const p = E.paso(this.esc), m = this.esc.terreno.tam / 2;
    const x0 = Math.floor((-m + reg.i0 * p) / TESELA) - 1, x1 = Math.floor((-m + reg.i1 * p) / TESELA) + 1;
    const z0 = Math.floor((-m + reg.j0 * p) / TESELA) - 1, z1 = Math.floor((-m + reg.j1 * p) / TESELA) + 1;
    for (const k of Array.from(this.cache.keys())) { const [tx, tz] = k.split(',').map(Number); if (tx >= x0 && tx <= x1 && tz >= z0 && tz <= z1) this.cache.delete(k); }
    this.centro = null;
  }
  setVisible(v) { this.visible = v; this.grupo.visible = v; }

  // ¿Hay algo encima que impida la hierba? Caminos y plazas de los pueblos.
  _libre(x, z) {
    if (this.escena && this.escena.muestrasCaminos().some(c => c.cerca(x, z))) return false;
    for (const a of this._areas) if (Math.hypot(a.x - x, a.z - z) < a.r) return false;
    return true;
  }

  _tesela(tx, tz, lejos) {
    const clave = tx + ',' + tz + ',' + (lejos ? 1 : 0);
    let t = this.cache.get(clave);
    if (t) return t;
    // Presupuesto por fotograma: lo que no da tiempo se calcula en los siguientes (primero lo más cercano)
    if (performance.now() > this._limite) { this._pendiente = true; return null; }
    const esc = this.esc, pasoC = lejos ? this.r.pasoLejos : this.r.paso;
    const n = Math.ceil(TESELA / pasoC), pasoR = TESELA / n;
    const listas = {};
    const q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), m4 = new THREE.Matrix4(), eje = new THREE.Vector3(0, 1, 0);
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
      const ix = tx * n + a, iz = tz * n + b;
      const r1 = hash(ix, iz, lejos ? 7 : 1), r2 = hash(ix, iz, 2), r3 = hash(ix, iz, 3), r4 = hash(ix, iz, 4);
      const x = (ix + r1) * pasoR, z = (iz + hash(ix, iz, 5)) * pasoR;
      const veg = E.vegetacionEn(esc, x, z);
      if (!veg || r2 > veg.d) continue;
      if (!this._libre(x, z)) continue;
      // las flores y el trigo llevan algo de hierba entre medias; la hierba, alguna flor suelta
      let tipo = veg.tipo;
      if (tipo === 'flores' && r3 < 0.4) tipo = 'hierba';
      else if (tipo === 'hierba' && r3 < 0.03) tipo = 'flores';
      else if (tipo === 'trigo' && r3 < 0.08) tipo = 'hierba';
      const y = E.alturaEn(esc, x, z) - 0.03;
      const esc1 = (0.78 + r4 * 0.5) * (lejos ? 1 : 1);
      q.setFromAxisAngle(eje, r3 * Math.PI * 2 + r1 * 3);
      m4.compose(v.set(x, y, z), q, s.set(esc1, esc1 * (0.85 + r2 * 0.3), esc1));
      const l = listas[tipo] || (listas[tipo] = { m: [], c: [], col: [] });
      for (const e of m4.elements) l.m.push(e);
      const celda = Math.floor(hash(ix, iz, 6) * 4);
      l.c.push(celda & 1, celda < 2 ? 1 : 0);
      const ti = (tipo === 'hierba' || tipo === 'hierbaAlta') ? (TINTE_SUELO[veg.suelo] || TINTE_SUELO[1]) : [1, 1, 1];
      const bri = 0.9 + r1 * 0.2;
      l.col.push(ti[0] * bri, ti[1] * bri, ti[2] * bri);
    }
    t = {};
    for (const [tipo, l] of Object.entries(listas)) t[tipo] = { m: new Float32Array(l.m), c: new Float32Array(l.c), col: new Float32Array(l.col), n: l.c.length / 2 };
    this.cache.set(clave, t);
    if (this.cache.size > 1500) { const k = this.cache.keys().next().value; this.cache.delete(k); }
    return t;
  }

  _juntar(cx, cz) {
    if (!this.capas) this._crearCapas();
    if (!this.capas) return;
    this._areas = this.esc.elementos.filter(e => e.tipo === 'pueblo').map(e => ({ x: e.x, z: e.z, r: e.props.radio * 0.3 }))
      .concat(this.esc.elementos.filter(e => e.tipo === 'lago').map(e => ({ x: e.x, z: e.z, r: e.props.radio * 0.85 })));
    const cuenta = {};
    for (const tipo of TIPOS) cuenta[tipo] = { cerca: 0, lejos: 0 };
    const r = this.r, tMax = Math.ceil(r.lejos / TESELA) + 1;
    const tcx = Math.floor(cx / TESELA), tcz = Math.floor(cz / TESELA);
    const m = this.esc.terreno.tam / 2;
    this._limite = performance.now() + 4;
    this._pendiente = false;
    const orden = [];
    for (let a = -tMax; a <= tMax; a++) for (let b = -tMax; b <= tMax; b++) orden.push([a, b, a * a + b * b]);
    orden.sort((p, q) => p[2] - q[2]);
    for (const [a, b] of orden) {
      const tx = tcx + a, tz = tcz + b;
      const x0 = tx * TESELA, z0 = tz * TESELA;
      if (x0 > m || z0 > m || x0 + TESELA < -m || z0 + TESELA < -m) continue;
      // distancia mínima y máxima de la tesela a la cámara
      const dx = Math.max(x0 - cx, 0, cx - x0 - TESELA), dz = Math.max(z0 - cz, 0, cz - z0 - TESELA);
      const dMin = Math.hypot(dx, dz);
      const dMax = Math.hypot(Math.max(Math.abs(x0 - cx), Math.abs(x0 + TESELA - cx)), Math.max(Math.abs(z0 - cz), Math.abs(z0 + TESELA - cz)));
      if (dMin > r.lejos) continue;
      const niveles = [];
      if (dMin < r.cerca) niveles.push(false);
      if (dMax > r.cerca - 9) niveles.push(true);
      for (const lejos of niveles) {
        const t = this._tesela(tx, tz, lejos);
        if (!t) continue;
        for (const [tipo, d] of Object.entries(t)) {
          const capa = this.capas[tipo][lejos ? 'lejos' : 'cerca'], k = lejos ? 'lejos' : 'cerca';
          const i0 = cuenta[tipo][k], libre = capa.instanceMatrix.count - i0;
          const nn = Math.min(d.n, libre);
          if (nn <= 0) continue;
          capa.instanceMatrix.array.set(nn === d.n ? d.m : d.m.subarray(0, nn * 16), i0 * 16);
          capa.instanceColor.array.set(nn === d.n ? d.col : d.col.subarray(0, nn * 3), i0 * 3);
          capa.geometry.attributes.aCell.array.set(nn === d.n ? d.c : d.c.subarray(0, nn * 2), i0 * 2);
          cuenta[tipo][k] += nn;
        }
      }
    }
    for (const tipo of TIPOS) for (const k of ['cerca', 'lejos']) {
      const capa = this.capas[tipo][k];
      const n = capa.count = cuenta[tipo][k];
      // solo se sube a la GPU la parte usada de cada búfer
      for (const [a, ancho] of [[capa.instanceMatrix, 16], [capa.instanceColor, 3], [capa.geometry.attributes.aCell, 2]]) {
        a.clearUpdateRanges(); if (n) a.addUpdateRange(0, n * ancho); a.needsUpdate = n > 0;
      }
    }
    this.cuenta = cuenta;
  }

  actualizar(camara, dt) {
    this.u.uTime.value += dt;
    if (!this.esc || !this.visible) return;
    const cx = camara.position.x, cz = camara.position.z;
    this.u.uHeroXZ.value.set(cx, cz);
    // Muy alta sobre el suelo, la hierba no se distingue: no se dibuja
    const alto = camara.position.y - E.sueloEn(this.esc, cx, cz);
    const lejos = alto > this.r.lejos * 0.9;
    this.grupo.visible = !lejos;
    if (lejos) return;
    if (!this.centro || this._pendiente || Math.hypot(cx - this.centro.x, cz - this.centro.z) > 4) {
      this.centro = { x: cx, z: cz };
      this._juntar(cx, cz);
    }
  }

  resumen() {
    const r = {};
    for (const [t, c] of Object.entries(this.cuenta || {})) r[t] = c.cerca + '+' + c.lejos;
    return r;
  }
}
