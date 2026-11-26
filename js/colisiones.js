// Sistema de colisiones 2D con rejilla espacial para barreras, pueblos, iglesia, árboles, rocas y puentes.
const E = window.Escenario;

export class SistemaColisiones {
  constructor(escenario, mundoFisica) {
    this.esc = escenario;
    this.mundo = mundoFisica;
    this.celda = 16;
    this.rejilla = new Map();
    this.obstaculos = [];
    this.pueblosIndexados = new Set();
    this.glbsIndexados = new Set();
    this._reconstruirEstaticos();
  }

  _clave(ix, iz) { return ix + ',' + iz; }

  _agregarAabb(minX, maxX, minZ, maxZ, obj) {
    this.obstaculos.push(obj);
    const x0 = Math.floor(minX / this.celda);
    const x1 = Math.floor(maxX / this.celda);
    const z0 = Math.floor(minZ / this.celda);
    const z1 = Math.floor(maxZ / this.celda);
    for (let ix = x0; ix <= x1; ix++) {
      for (let iz = z0; iz <= z1; iz++) {
        const k = this._clave(ix, iz);
        let arr = this.rejilla.get(k);
        if (!arr) { arr = []; this.rejilla.set(k, arr); }
        arr.push(obj);
      }
    }
  }

  agregarCirculo(x, z, r, mat = 'duro', etiqueta = '') {
    this._agregarAabb(x - r, x + r, z - r, z + r, {
      tipo: 'circulo', x, z, r, mat, etiqueta
    });
  }

  agregarSegmento(ax, az, bx, bz, r, mat = 'duro', etiqueta = '') {
    const dx = bx - ax, dz = bz - az;
    const len2 = dx * dx + dz * dz || 1;
    this._agregarAabb(
      Math.min(ax, bx) - r, Math.max(ax, bx) + r,
      Math.min(az, bz) - r, Math.max(az, bz) + r,
      { tipo: 'segmento', ax, az, bx, bz, dx, dz, len2, r, mat, etiqueta }
    );
  }

  /** OBB orientado en XZ. cos = cos(theta), sin = sin(theta) donde local -> mundo es: wx = cx + lx*cos - lz*sin, wz = cz + lx*sin + lz*cos */
  agregarOBB(cx, cz, hx, hz, cos, sin, mat = 'duro', etiqueta = '') {
    const ex = Math.abs(hx * cos) + Math.abs(hz * sin);
    const ez = Math.abs(hx * sin) + Math.abs(hz * cos);
    this._agregarAabb(cx - ex, cx + ex, cz - ez, cz + ez, {
      tipo: 'obb', cx, cz, hx, hz, cos, sin, mat, etiqueta
    });
  }

  _reconstruirEstaticos() {
    const esc = this.esc;

    // 1. Barreras de los caminos (misma lógica geométrica que Escena3D.colocarBarreras)
    this._indexarBarreras();

    // 2. Barandillas de puentes
    for (const b of this.mundo.puentes) {
      const off = b.mitadAncho + 0.35;
      for (const s of [-1, 1]) {
        const ax = b.cx - b.dirX * b.mitadLargo + b.normX * off * s;
        const az = b.cz - b.dirZ * b.mitadLargo + b.normZ * off * s;
        const bx = b.cx + b.dirX * b.mitadLargo + b.normX * off * s;
        const bz = b.cz + b.dirZ * b.mitadLargo + b.normZ * off * s;
        this.agregarSegmento(ax, az, bx, bz, 0.35, 'duro', 'puente');
      }
    }

    // 3. Elementos individuales (rocas, árboles, marcas de arco, formas básicas)
    for (const el of esc.elementos || []) {
      const sc = el.escala || 1;
      const rad = (el.rotY || 0) * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);

      if (el.tipo === 'arbol') {
        this.agregarCirculo(el.x, el.z, 0.45 * sc, 'madera', 'arbol');
      } else if (el.tipo === 'roca') {
        this.agregarCirculo(el.x, el.z, (el.props?.tam || 1.5) * 0.72 * sc, 'roca', 'roca');
      } else if (el.tipo === 'rocas') {
        this._indexarAreaDispersa(el, Math.min(2000, el.props?.cantidad | 0), pts => {
          const tMin = el.props?.tamMin || 0.6;
          const tMax = el.props?.tamMax || 2.4;
          for (const q of pts) {
            const tam = tMin + (tMax - tMin) * q.s;
            this.agregarCirculo(q.x, q.z, tam * 0.72, 'roca', 'roca');
          }
        });
      } else if (el.tipo === 'bosque') {
        const area = Math.PI * (el.props?.radio || 40) ** 2;
        const n = Math.min(4000, Math.round(area / 1000 * (el.props?.densidad || 10)));
        this._indexarAreaDispersa(el, n, pts => {
          for (const q of pts) {
            if (q.v < (el.props?.rocas || 0) * 0.5) {
              const tam = 0.5 + (2.2 - 0.5) * q.s;
              this.agregarCirculo(q.x, q.z, tam * 0.7, 'roca', 'roca');
            } else {
              this.agregarCirculo(q.x, q.z, 0.42, 'madera', 'arbol');
            }
          }
        });
      } else if (el.tipo === 'meta' || el.tipo === 'checkpoint') {
        // Solo los dos postes laterales, dejando el centro libre para pasar
        const halfW = (el.props?.ancho || 12) * 0.5;
        for (const s of [-1, 1]) {
          const px = el.x + cos * (s * halfW);
          const pz = el.z - sin * (s * halfW);
          this.agregarCirculo(px, pz, 0.45, 'duro', el.tipo);
        }
      } else if (el.tipo === 'caja') {
        this.agregarOBB(el.x, el.z, (el.props?.ancho || 2) * sc * 0.5, (el.props?.fondo || 2) * sc * 0.5, cos, -sin, 'duro', 'caja');
      } else if (el.tipo === 'muro') {
        this.agregarOBB(el.x, el.z, (el.props?.largo || 6) * sc * 0.5, (el.props?.grosor || 0.8) * sc * 0.5, cos, -sin, 'duro', 'muro');
      } else if (el.tipo === 'cilindro' || el.tipo === 'esfera') {
        this.agregarCirculo(el.x, el.z, (el.props?.radio || 1) * sc, 'duro', el.tipo);
      }
    }
  }

  _indexarAreaDispersa(el, cantidad, cb) {
    const esc = this.esc;
    const rng = E.crearAzar(el.props?.semilla || 1);
    const r = el.props?.radio || 40;
    const agua = esc.terreno.agua.activa ? esc.terreno.agua.nivel : -Infinity;
    const caminos = (esc.caminos || []).filter(c => c.puntos && c.puntos.length >= 2).map(c => ({
      ancho: c.ancho,
      mu: E.muestrearCamino(c, 4)
    }));
    const cercaCamino = (x, z) => {
      for (const c of caminos) {
        const lim = c.ancho * 0.72 + 1.5;
        for (let i = 0; i < c.mu.length; i++) {
          if (Math.hypot(c.mu[i].x - x, c.mu[i].z - z) < lim) return true;
        }
      }
      return false;
    };

    const pts = [];
    for (let k = 0; k < cantidad * 3 && pts.length < cantidad; k++) {
      const a = rng.next() * Math.PI * 2;
      const d = Math.sqrt(rng.next()) * r;
      const x = el.x + Math.cos(a) * d;
      const z = el.z + Math.sin(a) * d;
      if (!E.dentro(esc, x, z)) continue;
      const h = E.alturaEn(esc, x, z);
      if (h < agua + 0.6) continue;
      if (cercaCamino(x, z)) continue;
      pts.push({ x, z, y: h, s: rng.next(), rot: rng.next() * Math.PI * 2, v: rng.next() });
    }
    cb(pts, rng);
  }

  _indexarBarreras() {
    const esc = this.esc;
    const pueblos = (esc.elementos || []).filter(e => e.tipo === 'pueblo' && e.props?.cfg);
    const enPueblo = p => pueblos.some(pu => E.dentroTerrenoPueblo(pu, p.x, p.z, -2));

    for (const c of esc.caminos || []) {
      if ((c.puntos || []).length < 2 || !(c.barreras || []).length) continue;
      const mu = E.muestrearCamino(c, 1);
      const total = mu[mu.length - 1].d;
      if (total <= 0) continue;

      const enD = d => {
        if (c.cerrado) d = ((d % total) + total) % total;
        else d = E.clamp(d, 0, total);
        let a = 0, b = mu.length - 1;
        while (b - a > 1) {
          const m = (a + b) >> 1;
          if (mu[m].d < d) a = m; else b = m;
        }
        const t = (d - mu[a].d) / Math.max(1e-6, mu[b].d - mu[a].d);
        let dx = mu[b].x - mu[a].x, dz = mu[b].z - mu[a].z;
        const l = Math.hypot(dx, dz) || 1;
        dx /= l; dz /= l;
        return { x: mu[a].x + (mu[b].x - mu[a].x) * t, z: mu[a].z + (mu[b].z - mu[a].z) * t, dx, dz };
      };

      for (const b of c.barreras) {
        if (b.tipo === 'cinta' || b.tipo === 'conos') continue; // cintas y conos son visuales/atravesables
        const def = (E.TIPOS_BARRERA.find(t => t[0] === b.tipo) || E.TIPOS_BARRERA[0])[2];
        let d0 = b.desde || 0, d1 = b.hasta == null ? total : b.hasta;
        if (d1 < d0) { if (!c.cerrado) continue; d1 += total; }
        const n = Math.max(1, Math.round((d1 - d0) / def.paso));
        const lados = b.lado === 'izq' ? [1] : b.lado === 'der' ? [-1] : [1, -1];
        const esBlando = b.tipo === 'neumaticos' || b.tipo === 'balas_paja';
        const mat = esBlando ? 'blando' : 'duro';

        for (const lado of lados) {
          const off = lado * (c.ancho / 2 + (b.separacion == null ? 1 : b.separacion));
          const pts = [];
          for (let k = 0; k <= n; k++) {
            const p = enD(d0 + (d1 - d0) * k / n);
            pts.push({ x: p.x - p.dz * off, z: p.z + p.dx * off, giro: Math.atan2(p.dx, p.dz) });
          }
          for (let k = 0; k < pts.length; k++) {
            const p = pts[k];
            if (enPueblo(p)) continue;
            const sig = pts[k + 1] && !enPueblo(pts[k + 1]) ? pts[k + 1] : null;
            if (b.tipo === 'neumaticos') {
              this.agregarCirculo(p.x, p.z, 0.42, mat, 'neumaticos');
            } else if (b.tipo === 'balas_paja') {
              if (k < pts.length - 1 || pts.length === 1) {
                this.agregarCirculo(p.x, p.z, 0.72, mat, 'balas_paja');
              }
            } else if (b.tipo === 'valla_publi') {
              if (k < pts.length - 1 || pts.length === 1) {
                const giro = p.giro + Math.PI / 2;
                this.agregarOBB(p.x, p.z, 1.4, 0.25, Math.cos(giro), -Math.sin(giro), 'duro', 'valla_publi');
              }
            } else if (sig) {
              const radio = b.tipo === 'muro' || b.tipo === 'muro_piedra' ? 0.38 : b.tipo === 'seto' ? 0.55 : 0.25;
              this.agregarSegmento(p.x, p.z, sig.x, sig.z, radio, mat, b.tipo);
            }
          }
        }
      }
    }
  }

  /**
   * Sincroniza colisionadores dinámicos de Escena3D: pueblos generados (casas, muros, fuente, árboles)
   * y modelos GLB cargados (iglesia de Moguer y otros edificios).
   */
  sincronizarEscena(escena3d, THREE) {
    if (!escena3d) return;

    // 1. Pueblos vivos generados por village-core.js
    if (escena3d.pueblosVivos) {
      for (const [id, vivo] of escena3d.pueblosVivos.entries()) {
        if (this.pueblosIndexados.has(id)) continue;
        const el = (this.esc.elementos || []).find(e => e.id === id);
        if (!el || !vivo.pueblo || !Array.isArray(vivo.pueblo.colliders)) continue;

        const r = ((el.props?.cfg?.rotation || 0) * Math.PI) / 180;
        const cr = Math.cos(r), sr = Math.sin(r);
        for (const col of vivo.pueblo.colliders) {
          if (col.type === 'circle') {
            const wx = el.x + col.x * cr - col.z * sr;
            const wz = el.z + col.x * sr + col.z * cr;
            this.agregarCirculo(wx, wz, col.r, 'casa', 'pueblo');
          } else if (col.type === 'box') {
            const lx = (col.minX + col.maxX) * 0.5;
            const lz = (col.minZ + col.maxZ) * 0.5;
            const hx = Math.abs(col.maxX - col.minX) * 0.5;
            const hz = Math.abs(col.maxZ - col.minZ) * 0.5;
            const wx = el.x + lx * cr - lz * sr;
            const wz = el.z + lx * sr + lz * cr;
            this.agregarOBB(wx, wz, hx, hz, cr, sr, 'casa', 'pueblo');
          }
        }
        this.pueblosIndexados.add(id);
      }
    }

    // 2. Modelos GLB (ej. Iglesia de Moguer) cuando terminan de cargar su malla real
    if (THREE && escena3d.objetos) {
      for (const el of this.esc.elementos || []) {
        if (el.tipo !== 'glb' || this.glbsIndexados.has(el.id)) continue;
        const g = escena3d.objetos.get(el.id);
        if (!g) continue;
        // Verificar que ya cargó la malla real (no solo el cubo wireframe temporal)
        let tieneMallaReal = false;
        g.traverse(o => {
          if (o.isMesh && !(o.material && o.material.wireframe)) tieneMallaReal = true;
        });
        if (!tieneMallaReal) continue;

        g.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(g);
        if (!box.isEmpty()) {
          const cx = (box.min.x + box.max.x) * 0.5;
          const cz = (box.min.z + box.max.z) * 0.5;
          const hx = Math.max(0.5, (box.max.x - box.min.x) * 0.44);
          const hz = Math.max(0.5, (box.max.z - box.min.z) * 0.44);
          this.agregarOBB(cx, cz, hx, hz, 1, 0, 'casa', el.nombre || 'edificio');
          this.glbsIndexados.add(el.id);
        }
      }
    }
  }

  _empujarCirculoContraObj(cx, cz, rCoche, obj) {
    if (obj.tipo === 'circulo') {
      const dx = cx - obj.x, dz = cz - obj.z;
      const dist = Math.hypot(dx, dz);
      const minD = rCoche + obj.r;
      if (dist >= minD) return null;
      const nx = dist > 1e-4 ? dx / dist : 1;
      const nz = dist > 1e-4 ? dz / dist : 0;
      return { pen: minD - dist, nx, nz, mat: obj.mat, etiqueta: obj.etiqueta };
    }

    if (obj.tipo === 'segmento') {
      const px = cx - obj.ax, pz = cz - obj.az;
      const t = Math.max(0, Math.min(1, (px * obj.dx + pz * obj.dz) / obj.len2));
      const sx = obj.ax + obj.dx * t;
      const sz = obj.az + obj.dz * t;
      const dx = cx - sx, dz = cz - sz;
      const dist = Math.hypot(dx, dz);
      const minD = rCoche + obj.r;
      if (dist >= minD) return null;
      const nx = dist > 1e-4 ? dx / dist : -obj.dz / Math.sqrt(obj.len2);
      const nz = dist > 1e-4 ? dz / dist : obj.dx / Math.sqrt(obj.len2);
      return { pen: minD - dist, nx, nz, mat: obj.mat, etiqueta: obj.etiqueta };
    }

    if (obj.tipo === 'obb') {
      const dx = cx - obj.cx, dz = cz - obj.cz;
      // Pasar a local del OBB (inversa de rotación: cos, sin)
      const lx = dx * obj.cos + dz * obj.sin;
      const lz = -dx * obj.sin + dz * obj.cos;
      const clx = Math.max(-obj.hx, Math.min(obj.hx, lx));
      const clz = Math.max(-obj.hz, Math.min(obj.hz, lz));
      let dlx = lx - clx, dlz = lz - clz;
      const dist = Math.hypot(dlx, dlz);
      if (dist >= rCoche) return null;

      let nlx, nlz, pen;
      if (dist > 1e-4) {
        nlx = dlx / dist; nlz = dlz / dist;
        pen = rCoche - dist;
      } else {
        // Centro dentro del OBB: sacar por la cara más cercana
        const ox = obj.hx - Math.abs(lx);
        const oz = obj.hz - Math.abs(lz);
        if (ox < oz) {
          nlx = lx >= 0 ? 1 : -1; nlz = 0; pen = ox + rCoche;
        } else {
          nlx = 0; nlz = lz >= 0 ? 1 : -1; pen = oz + rCoche;
        }
      }
      // Normal de vuelta a mundo
      const nx = nlx * obj.cos - nlz * obj.sin;
      const nz = nlx * obj.sin + nlz * obj.cos;
      return { pen, nx, nz, mat: obj.mat, etiqueta: obj.etiqueta };
    }
    return null;
  }

  /**
   * Comprueba y resuelve colisiones del coche (representado por 2 esferas en eje delantero/trasero).
   */
  resolverCoche(estado, medidas) {
    const rCoche = (medidas?.ancho || 1.85) * 0.45;
    const semiEje = (medidas?.largo || 4.2) * 0.28;
    const fx = Math.sin(estado.yaw), fz = Math.cos(estado.yaw);

    let mayorImpacto = 0;
    let matImpacto = 'duro';
    let etiquetaImpacto = '';

    for (let pasada = 0; pasada < 3; pasada++) {
      let hubo = false;
      for (const s of [-1, 1]) {
        const px = estado.x + fx * semiEje * s;
        const pz = estado.z + fz * semiEje * s;
        const ix0 = Math.floor((px - rCoche - 1) / this.celda);
        const ix1 = Math.floor((px + rCoche + 1) / this.celda);
        const iz0 = Math.floor((pz - rCoche - 1) / this.celda);
        const iz1 = Math.floor((pz + rCoche + 1) / this.celda);

        const vistos = new Set();
        for (let ix = ix0; ix <= ix1; ix++) {
          for (let iz = iz0; iz <= iz1; iz++) {
            const arr = this.rejilla.get(this._clave(ix, iz));
            if (!arr) continue;
            for (let k = 0; k < arr.length; k++) {
              const obj = arr[k];
              if (vistos.has(obj)) continue;
              vistos.add(obj);
              const hit = this._empujarCirculoContraObj(px, pz, rCoche, obj);
              if (!hit) continue;

              hubo = true;
              estado.x += hit.nx * hit.pen;
              estado.z += hit.nz * hit.pen;

              const vn = estado.vx * hit.nx + estado.vz * hit.nz;
              if (vn < 0) {
                const impacto = -vn;
                if (impacto > mayorImpacto) {
                  mayorImpacto = impacto;
                  matImpacto = hit.mat;
                  etiquetaImpacto = hit.etiqueta;
                }
                const restitucion = hit.mat === 'blando' ? 0.35 : 0.22;
                const friccionTang = hit.mat === 'blando' ? 0.65 : 0.85;
                const tx = -hit.nz, tz = hit.nx;
                const vt = estado.vx * tx + estado.vz * tz;
                const nuevoVn = -vn * restitucion;
                const nuevoVt = vt * friccionTang;
                estado.vx = hit.nx * nuevoVn + tx * nuevoVt;
                estado.vz = hit.nz * nuevoVn + tz * nuevoVt;
                // Pequeño par de giro por impacto excéntrico para que roce realísticamente
                estado.velYaw += (s * (fx * hit.nz - fz * hit.nx)) * Math.min(2.2, impacto * 0.14);
              }
            }
          }
        }
      }
      if (!hubo) break;
    }

    return mayorImpacto > 0.3 ? { intensidad: mayorImpacto, material: matImpacto, etiqueta: etiquetaImpacto } : null;
  }
}
