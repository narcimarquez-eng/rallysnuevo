// Vegetación con modelos .glb: todos los árboles de todos los bosques se dibujan por instancias, con tres
// niveles de detalle según la distancia a la cámara:
//   cerca  → el modelo completo (nodos «tronco» y «copa» del .glb)
//   medio  → la versión simplificada (nodos «tronco_medio» y «copa_medio», ver tools/preparar-arboles.mjs)
//   lejos  → un impostor: una tarjeta que mira a la cámara con la foto del árbol hecha desde 8 ángulos
// Cada 0,1 s se reparte cada árbol en su nivel y se descartan los que quedan fuera de la vista.
import * as THREE from 'three';

// Distancias (m) de cambio de nivel y distancia máxima, por calidad
export const DISTANCIAS = {
  baja: { cerca: 25, medio: 90, max: 1500, frame: 128, sombraMedio: false },
  media: { cerca: 45, medio: 150, max: 3000, frame: 256, sombraMedio: false },
  alta: { cerca: 90, medio: 300, max: 5000, frame: 384, sombraMedio: true }
};
const FRAMES = 8;

// Atributos a Float32 sin intercalar (los .glb vienen cuantizados y comprimidos con meshopt)
function aDecimal(geo) {
  for (const [n, a] of Object.entries(geo.attributes)) {
    if (a.isBufferAttribute && a.array instanceof Float32Array && !a.normalized) continue;
    const k = a.itemSize, out = new Float32Array(a.count * k);
    const get = [a.getX, a.getY, a.getZ, a.getW];
    for (let i = 0; i < a.count; i++) for (let c = 0; c < k; c++) out[i * k + c] = get[c].call(a, i);
    geo.setAttribute(n, new THREE.BufferAttribute(out, k));
  }
  return geo;
}

// Normales «de copa»: en vez de la normal de cada tarjeta (que deja medio follaje a oscuras), la dirección desde el
// centro de la copa hacia fuera, mezclada con la original. La copa se ilumina como un volumen, igual por las dos caras.
function normalesDeCopa(geos, mezcla) {
  const caja = new THREE.Box3().setFromBufferAttribute(geos[0].attributes.position);
  const c = caja.getCenter(new THREE.Vector3()), e = caja.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  e.max(new THREE.Vector3(0.05, 0.05, 0.05));
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  for (const g of geos) {
    const P = g.attributes.position, N = g.attributes.normal;
    for (let i = 0; i < P.count; i++) {
      v.set((P.getX(i) - c.x) / e.x, (P.getY(i) - c.y) / e.y + 0.25, (P.getZ(i) - c.z) / e.z).normalize();
      n.set(N.getX(i), N.getY(i), N.getZ(i));
      n.lerp(v, mezcla).normalize();
      N.setXYZ(i, n.x, n.y, n.z);
    }
    N.needsUpdate = true;
  }
}
const NORMAL_SIN_GIRO = THREE.ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0');

// Balanceo con el viento: cuanto más alto en el árbol, más se mueve. Fase distinta para cada árbol.
function conViento(mat, viento, hojas) {
  mat.onBeforeCompile = sh => {
    if (hojas) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', NORMAL_SIN_GIRO);
    sh.uniforms.uViento = viento;
    sh.vertexShader = 'uniform float uViento;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec3 vO = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
      #else
        vec3 vO = vec3(0.0);
      #endif
      float vF = transformed.y * transformed.y;
      float vFase = vO.x * 0.071 + vO.z * 0.053;
      transformed.x += sin(uViento * 1.3 + vFase) * 0.012 * vF;
      transformed.z += cos(uViento * 1.05 + vFase * 1.3) * 0.009 * vF;
      ${hojas ? 'transformed.y += sin(uViento * 4.2 + position.x * 31.0 + position.z * 17.0 + vFase) * 0.0025 * vF;' : ''}`);
  };
  mat.customProgramCacheKey = () => 'viento' + (hojas ? 'H' : 'T');
}

const VERT_IMPOSTOR = /* glsl */`
  uniform float uF, uW, uH;
  varying vec2 vUv;
  varying vec3 vTinte;
  #include <common>
  #include <fog_pars_vertex>
  void main() {
    vec3 o = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
    float esc = length(instanceMatrix[1].xyz);
    float giro = atan(-instanceMatrix[0].z, instanceMatrix[0].x);
    vec3 a = cameraPosition - o;
    float ang = atan(a.x, a.z) - giro;
    float fr = mod(floor(ang / 6.28318530718 * uF + 0.5), uF);
    vec3 der = normalize(vec3(a.z, 0.0, -a.x) + vec3(1e-5, 0.0, 0.0));
    vec3 w = o + der * position.x * uW * esc + vec3(0.0, (position.y * uH - 0.01) * esc, 0.0);
    vUv = vec2((fr + position.x + 0.5) / uF, position.y);
    #ifdef USE_INSTANCING_COLOR
      vTinte = instanceColor;
    #else
      vTinte = vec3(1.0);
    #endif
    vec4 mvPosition = viewMatrix * vec4(w, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const FRAG_IMPOSTOR = /* glsl */`
  uniform sampler2D uMapa;
  uniform float uLuz;
  varying vec2 vUv;
  varying vec3 vTinte;
  #include <common>
  #include <fog_pars_fragment>
  void main() {
    vec4 c = texture2D(uMapa, vUv);
    if (c.a < 0.5) discard;
    gl_FragColor = vec4(c.rgb / max(c.a, 0.001) * vTinte * uLuz, 1.0); // borde suavizado: se recupera el color
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }`;

export class Vegetacion {
  // opts: { renderer, loader (GLTFLoader con MeshoptDecoder), calidad, especies: { id: { archivo, alto } }, alCambiar }
  constructor(opts) {
    this.o = opts;
    this.d = DISTANCIAS[opts.calidad] || DISTANCIAS.media;
    this.grupo = new THREE.Group(); this.grupo.name = 'vegetacion';
    this.viento = { value: 0 };
    this.luz = { value: 1 };
    this.especies = new Map();   // id → Promise<especie>
    this.listas = new Map();     // especie id → estado de dibujo
    this.registros = new Map();  // clave (id del elemento) → [árboles]
    this.sucio = true; this.t = 0;
    this.frustum = new THREE.Frustum(); this.mProy = new THREE.Matrix4();
    this.m4 = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.v = new THREE.Vector3(); this.s = new THREE.Vector3(); this.eje = new THREE.Vector3(0, 1, 0);
  }

  // --- Carga de una especie: geometrías normalizadas a 1 m de alto, materiales y foto para el impostor ---
  especie(id) {
    if (this.especies.has(id)) return this.especies.get(id);
    const def = this.o.especies[id];
    const p = (async () => {
      if (!def) throw new Error('Especie desconocida: ' + id);
      const gltf = await this.o.loader.loadAsync(/^(https?:|\/)/i.test(def.archivo) ? def.archivo : (globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + def.archivo);
      gltf.scene.updateMatrixWorld(true);
      const partes = {};
      gltf.scene.traverse(o => { if (o.isMesh && /^(tronco|copa)(_medio)?$/.test(o.name)) partes[o.name] = o; });
      if (!partes.tronco || !partes.copa) throw new Error(def.archivo + ': faltan los nodos «tronco» y «copa» (prepáralo con tools/preparar-arboles.mjs)');
      const geos = {};
      for (const [n, m] of Object.entries(partes)) {
        const g = aDecimal(m.geometry.clone()); g.applyMatrix4(m.matrixWorld);
        if (!g.attributes.normal) g.computeVertexNormals();
        geos[n] = g;
      }
      const caja = new THREE.Box3();
      caja.union(new THREE.Box3().setFromBufferAttribute(geos.tronco.attributes.position));
      caja.union(new THREE.Box3().setFromBufferAttribute(geos.copa.attributes.position));
      const alto = caja.max.y - caja.min.y, cx = (caja.min.x + caja.max.x) / 2, cz = (caja.min.z + caja.max.z) / 2;
      for (const g of Object.values(geos)) { g.translate(-cx, -caja.min.y, -cz); g.scale(1 / alto, 1 / alto, 1 / alto); g.computeBoundingSphere(); }
      const ancho = Math.max(caja.max.x - caja.min.x, caja.max.z - caja.min.z) / alto;
      normalesDeCopa([geos.copa, geos.copa_medio].filter(Boolean), 0.8);
      const matTronco = partes.tronco.material.clone(), matCopa = partes.copa.material.clone();
      matCopa.alphaTest = Math.max(0.4, matCopa.alphaTest || 0.5); matCopa.transparent = false; matCopa.side = THREE.DoubleSide;
      matCopa.alphaToCoverage = true;
      // Translucidez barata: las hojas brillan un poco con su propio color (se ven a contraluz y desde debajo)
      matCopa.emissiveMap = matCopa.map; matCopa.emissive = new THREE.Color(1, 1, 1); matCopa.emissiveIntensity = 0.22 * this.luz.value;
      this.materialesCopa = (this.materialesCopa || []).concat(matCopa);
      conViento(matTronco, this.viento, false); conViento(matCopa, this.viento, true);
      const esp = {
        id, alto, ancho,
        cerca: [[geos.tronco, matTronco], [geos.copa, matCopa]],
        medio: [[geos.tronco_medio || geos.tronco, matTronco], [geos.copa_medio || geos.copa, matCopa]]
      };
      esp.impostor = this._fotografiar(esp);
      this.sucio = true;
      if (this.o.alCambiar) this.o.alCambiar();
      return esp;
    })();
    p.catch(e => console.warn('Árbol', id, e));
    this.especies.set(id, p);
    return p;
  }

  // Foto del árbol desde FRAMES ángulos alrededor, en una sola textura
  _fotografiar(esp) {
    const r = this.o.renderer;
    const W = esp.ancho * 1.04, H = 1.02;
    const fh = this.d.frame, fw = Math.max(32, Math.round(fh * W / H));
    const rt = new THREE.WebGLRenderTarget(fw * FRAMES, fh, { type: THREE.HalfFloatType, samples: 4, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    const escena = new THREE.Scene();
    // materiales opacos para la foto (con alphaToCoverage la transparencia de las hojas acabaría en la textura)
    for (const [g, m] of esp.cerca) { const mf = m.clone(); mf.alphaToCoverage = false; mf.onBeforeCompile = m.onBeforeCompile; mf.customProgramCacheKey = () => m.customProgramCacheKey() + 'foto'; escena.add(new THREE.Mesh(g, mf)); }
    escena.add(new THREE.AmbientLight('#dfe8f5', 0.95));
    const sol = new THREE.DirectionalLight('#fff4e0', 2.6); escena.add(sol, sol.target);
    const cam = new THREE.OrthographicCamera(-W / 2, W / 2, H - 0.01, -0.01, 0.01, 20);
    const antes = { rt: r.getRenderTarget(), color: r.getClearColor(new THREE.Color()), alfa: r.getClearAlpha(), auto: r.autoClear, sombras: r.shadowMap.enabled };
    r.shadowMap.enabled = false;
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear();
    r.autoClear = false;
    for (let k = 0; k < FRAMES; k++) {
      const a = k / FRAMES * Math.PI * 2;
      cam.position.set(Math.sin(a) * 5, 0, Math.cos(a) * 5); cam.lookAt(0, 0, 0);
      // la luz viene de arriba y un poco de lado respecto a la cámara, igual en todas las fotos
      sol.position.set(Math.sin(a + 0.6) * 3, 4, Math.cos(a + 0.6) * 3);
      rt.viewport.set(k * fw, 0, fw, fh); rt.scissor.set(k * fw, 0, fw, fh); rt.scissorTest = true;
      r.setRenderTarget(rt);
      r.render(escena, cam);
    }
    rt.scissorTest = false;
    r.setRenderTarget(antes.rt); r.setClearColor(antes.color, antes.alfa); r.autoClear = antes.auto; r.shadowMap.enabled = antes.sombras;
    const mat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uMapa: { value: null }, uF: { value: FRAMES }, uW: { value: W }, uH: { value: H } }]),
      vertexShader: VERT_IMPOSTOR, fragmentShader: FRAG_IMPOSTOR, fog: true
    });
    mat.uniforms.uMapa.value = rt.texture;
    mat.uniforms.uLuz = this.luz;
    const geo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
    return { mat, geo, rt };
  }

  // --- Registro de árboles. arboles: [{ e: especie, x, y, z, alto (m, 0 = el del modelo), rot (rad), tinte }] ---
  registrar(clave, arboles) {
    this.registros.set(clave, arboles);
    for (const a of arboles) this.especie(a.e);
    this.sucio = true;
  }
  quitar(clave) { if (this.registros.delete(clave)) this.sucio = true; }
  limpiar() { this.registros.clear(); this.sucio = true; }
  setLuz(f) { this.luz.value = f; for (const m of this.materialesCopa || []) m.emissiveIntensity = 0.22 * f; }

  // Rehace, por especie, el conjunto de matrices de todos los árboles registrados
  async _reconstruir() {
    this.sucio = false;
    const porEsp = new Map();
    for (const lista of this.registros.values()) for (const a of lista) { if (!porEsp.has(a.e)) porEsp.set(a.e, []); porEsp.get(a.e).push(a); }
    for (const [id, est] of this.listas) if (!porEsp.has(id)) { this._borrarMallas(est); this.listas.delete(id); }
    for (const [id, arboles] of porEsp) {
      let esp;
      try { esp = await this.especie(id); } catch (e) { continue; }
      if (this.sucio) return; // ha cambiado mientras cargaba: se rehará en la próxima vuelta
      let est = this.listas.get(id);
      const n = arboles.length;
      if (!est || est.cap < n) { if (est) this._borrarMallas(est); est = this._crearMallas(esp, Math.ceil(n * 1.25) + 8); this.listas.set(id, est); }
      est.n = n;
      const col = new THREE.Color();
      arboles.forEach((a, i) => {
        const alto = a.alto > 0 ? a.alto : esp.alto;
        this.v.set(a.x, a.y, a.z); this.q.setFromAxisAngle(this.eje, a.rot || 0); this.s.setScalar(alto);
        this.m4.compose(this.v, this.q, this.s).toArray(est.mat, i * 16);
        est.esf[i * 4] = a.x; est.esf[i * 4 + 1] = a.y + alto * 0.5; est.esf[i * 4 + 2] = a.z; est.esf[i * 4 + 3] = alto * Math.max(0.55, esp.ancho * 0.6);
        col.setScalar(a.tinte || 1); col.toArray(est.col, i * 3);
      });
    }
    this._repartir(this._ultimaCamara);
  }
  _crearMallas(esp, cap) {
    // La copa no recibe sombras: sus tarjetas se taparían unas a otras y quedaría casi negra
    const hacer = (geo, mat, sombra, recibe) => {
      const im = new THREE.InstancedMesh(geo, mat, cap);
      im.count = 0; im.frustumCulled = false; im.castShadow = sombra; im.receiveShadow = recibe !== false;
      im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      im.setColorAt(0, new THREE.Color(1, 1, 1));
      this.grupo.add(im); return im;
    };
    return {
      cap, n: 0, mat: new Float32Array(cap * 16), esf: new Float32Array(cap * 4), col: new Float32Array(cap * 3),
      cerca: esp.cerca.map(([g, m], k) => hacer(g, m, true, k === 0)),
      medio: esp.medio.map(([g, m], k) => hacer(g, m, this.d.sombraMedio, k === 0)),
      lejos: [hacer(esp.impostor.geo, esp.impostor.mat, false, false)]
    };
  }
  _borrarMallas(est) { for (const im of [...est.cerca, ...est.medio, ...est.lejos]) { this.grupo.remove(im); im.dispose(); } }

  // Reparte cada árbol en su nivel de detalle (y quita los que no se ven)
  _repartir(camara) {
    if (!camara) return;
    this.mProy.multiplyMatrices(camara.projectionMatrix, camara.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.mProy);
    const pl = this.frustum.planes, cp = camara.position;
    const d1 = this.d.cerca * this.d.cerca, d2 = this.d.medio * this.d.medio, d3 = this.d.max * this.d.max;
    for (const est of this.listas.values()) {
      let nc = 0, nm = 0, nl = 0;
      const mc = est.cerca.map(im => im.instanceMatrix.array), mm = est.medio.map(im => im.instanceMatrix.array), ml = est.lejos[0].instanceMatrix.array;
      const cc = est.cerca.map(im => im.instanceColor.array), cm = est.medio.map(im => im.instanceColor.array), cl = est.lejos[0].instanceColor.array;
      for (let i = 0; i < est.n; i++) {
        const x = est.esf[i * 4], y = est.esf[i * 4 + 1], z = est.esf[i * 4 + 2], r = est.esf[i * 4 + 3];
        let fuera = false;
        for (let k = 0; k < 6; k++) { const p = pl[k]; if (p.normal.x * x + p.normal.y * y + p.normal.z * z + p.constant < -r) { fuera = true; break; } }
        if (fuera) continue;
        const dx = x - cp.x, dy = y - cp.y, dz = z - cp.z, d = dx * dx + dy * dy + dz * dz;
        const m = est.mat.subarray(i * 16, i * 16 + 16), c = est.col.subarray(i * 3, i * 3 + 3);
        if (d < d1) { for (let k = 0; k < mc.length; k++) { mc[k].set(m, nc * 16); cc[k].set(c, nc * 3); } nc++; }
        else if (d < d2) { for (let k = 0; k < mm.length; k++) { mm[k].set(m, nm * 16); cm[k].set(c, nm * 3); } nm++; }
        else if (d < d3) { ml.set(m, nl * 16); cl.set(c, nl * 3); nl++; }
      }
      const fijar = (lista, n) => { for (const im of lista) { im.count = n; for (const [a, w] of [[im.instanceMatrix, 16], [im.instanceColor, 3]]) { a.clearUpdateRanges(); if (n) a.addUpdateRange(0, n * w); a.needsUpdate = n > 0; } } };
      fijar(est.cerca, nc); fijar(est.medio, nm); fijar(est.lejos, nl);
    }
  }

  actualizar(camara, dt) {
    this.viento.value += dt;
    this._ultimaCamara = camara;
    if (this.sucio) { this._reconstruir(); return; }
    this.t += dt;
    if (this.t < 0.1) return;
    this.t = 0;
    this._repartir(camara);
  }

  // Cuántos árboles hay y cuántos se dibujan en cada nivel (para depurar)
  resumen() {
    const r = { especies: this.listas.size, arboles: 0, cerca: 0, medio: 0, lejos: 0 };
    for (const e of this.listas.values()) { r.arboles += e.n; r.cerca += e.cerca[0].count; r.medio += e.medio[0].count; r.lejos += e.lejos[0].count; }
    return r;
  }
}
