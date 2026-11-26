// Dibujo 3D de un escenario con three.js. Lo usan el editor (index.html) y el visor (visor.html).
// Cada tipo de elemento tiene una función de dibujo registrada en DIBUJOS: para añadir tipos nuevos basta con
// registrarTipo() en escenario-core.js y registrarDibujo() aquí.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { Vegetacion } from './vegetacion.js';
import { Pradera } from './pradera.js';
import { cargarGeneradorPueblos, construirPueblo, reservasDePueblo } from './pueblos3d.js';
import { geoRocaForma, materialRoca, piedrasDe, tinteRoca, formaAzar } from './rocas.js';
import { materialAgua, ponerHondura, EntornoAgua } from './agua.js';
import { cargarSuelos, crearMezcla, actualizarMezcla, materialTerreno, materialCamino, escalaCamino, uvEnMetros } from './suelos.js';

const E = window.Escenario;
const DEG = Math.PI / 180;

// ---------------------------------------------------------------------------
// Utilidades de geometría con color por vértice
// ---------------------------------------------------------------------------
function pintarGeo(geo, color, variacion, semilla) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(color), n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3);
  const rnd = E.mulberry32(semilla || 7);
  for (let k = 0; k < n; k += 3) {
    const v = variacion ? 1 + (rnd() - 0.5) * variacion : 1;
    for (let q = 0; q < 3 && k + q < n; q++) { arr[(k + q) * 3] = c.r * v; arr[(k + q) * 3 + 1] = c.g * v; arr[(k + q) * 3 + 2] = c.b * v; }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  return geo;
}
function unir(geos) { const g = mergeGeometries(geos, false); g.computeVertexNormals(); return g; }
function mover(geo, x, y, z) { geo.translate(x, y, z); return geo; }

// Árboles a 10 m de alto (se escalan): una geometría por especie con tronco y copa en colores
const GEO_ARBOL = {};
function geoArbol(especie) {
  if (GEO_ARBOL[especie]) return GEO_ARBOL[especie];
  const T = '#6b4a2f', partes = [];
  switch (especie) {
    case 'pino':
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.25, 0.4, 4, 6), 0, 2, 0), T, 0.1));
      partes.push(pintarGeo(mover(new THREE.ConeGeometry(2.6, 4.5, 7), 0, 4.6, 0), '#2f5d33', 0.18, 1));
      partes.push(pintarGeo(mover(new THREE.ConeGeometry(2.0, 3.8, 7), 0, 6.6, 0), '#356a39', 0.18, 2));
      partes.push(pintarGeo(mover(new THREE.ConeGeometry(1.3, 3.0, 7), 0, 8.5, 0), '#3b7440', 0.18, 3));
      break;
    case 'abeto':
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.2, 0.35, 3, 6), 0, 1.5, 0), T, 0.1));
      partes.push(pintarGeo(mover(new THREE.ConeGeometry(2.2, 8.5, 8), 0, 5.6, 0), '#24472c', 0.2, 4));
      break;
    case 'palmera': {
      const tr = new THREE.CylinderGeometry(0.22, 0.38, 9, 6, 6);
      const p = tr.attributes.position;
      for (let k = 0; k < p.count; k++) { const y = p.getY(k) + 4.5; p.setX(k, p.getX(k) + Math.pow(y / 9, 2) * 1.4); }
      partes.push(pintarGeo(mover(tr, 0, 4.5, 0), '#8a6b45', 0.15));
      for (let h = 0; h < 7; h++) {
        const hoja = new THREE.ConeGeometry(0.6, 4.2, 4, 1);
        hoja.scale(1, 1, 0.25); hoja.rotateZ(-Math.PI / 2 + 0.55); hoja.translate(2, 0, 0); hoja.rotateY(h / 7 * Math.PI * 2);
        partes.push(pintarGeo(mover(hoja, 1.4, 9, 0), h % 2 ? '#3f8a3a' : '#4f9a40', 0.15, h));
      }
      break;
    }
    case 'abedul':
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.18, 0.3, 6.5, 6), 0, 3.25, 0), '#e8e4da', 0.08));
      partes.push(pintarGeo(mover(new THREE.IcosahedronGeometry(2.2, 1), 0, 7.2, 0).scale(1, 1.35, 1), '#7fae4a', 0.2, 5));
      break;
    case 'seco':
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.2, 0.45, 7, 5), 0, 3.5, 0), '#5a4636', 0.1));
      for (let r = 0; r < 4; r++) { const b = new THREE.CylinderGeometry(0.06, 0.14, 3, 4); b.rotateZ(0.9); b.translate(1.1, 5 + r * 0.6, 0); b.rotateY(r * 1.7); partes.push(pintarGeo(b, '#5a4636', 0.1)); }
      break;
    case 'cactus':
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.55, 0.6, 6, 8), 0, 3, 0), '#4f8a43', 0.12));
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 7), 1.1, 3.6, 0), '#4f8a43', 0.12));
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 7).rotateZ(Math.PI / 2), 0.6, 2.6, 0), '#4f8a43', 0.12));
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.3, 0.3, 1.8, 7), -1.0, 4.2, 0), '#4f8a43', 0.12));
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 7).rotateZ(Math.PI / 2), -0.5, 3.4, 0), '#4f8a43', 0.12));
      break;
    default: // roble
      partes.push(pintarGeo(mover(new THREE.CylinderGeometry(0.35, 0.55, 4.5, 6), 0, 2.25, 0), T, 0.1));
      partes.push(pintarGeo(mover(new THREE.IcosahedronGeometry(3.0, 1), 0, 6.6, 0), '#4c7d32', 0.22, 6));
      partes.push(pintarGeo(mover(new THREE.IcosahedronGeometry(2.0, 1), 1.6, 5.6, 0.8), '#558a37', 0.22, 7));
      partes.push(pintarGeo(mover(new THREE.IcosahedronGeometry(1.9, 1), -1.5, 5.9, -0.6), '#477530', 0.22, 8));
  }
  return (GEO_ARBOL[especie] = unir(partes));
}
// Especie que se dibuja: las de modelo .glb pasan a su versión sencilla si los árboles realistas están desactivados
function especieReal(sp, ctx) { const g = E.ARBOLES_GLB[sp]; return g && !ctx.realistas ? g.sencillo : sp; }
function mezcla(ctx) { return (E.MEZCLA_BIOMA[ctx.esc.terreno.bioma] || E.MEZCLA_BIOMA.templado).map(sp => especieReal(sp, ctx)); }
// Árbol con modelo: lo dibuja la vegetación por instancias; el elemento solo lleva un cilindro invisible para poder tocarlo
function arbolesGlb(el, ctx, lista) {
  const g = new THREE.Group();
  ctx.vegetacion.registrar(el.id, lista);
  g.userData.alQuitar = () => ctx.vegetacion.quitar(el.id);
  return g;
}

// Rocas: 4 variantes de radio 1
const GEO_ROCA = [];
function geoRoca(v) {
  v = v % 4;
  if (GEO_ROCA[v]) return GEO_ROCA[v];
  const g = new THREE.IcosahedronGeometry(1, 1);
  const N = E.crearRuido(31 + v * 17), p = g.attributes.position;
  for (let k = 0; k < p.count; k++) {
    const x = p.getX(k), y = p.getY(k), z = p.getZ(k);
    const f = 1 + N.ruido(x * 1.7 + v, z * 1.7 + y) * 0.35;
    p.setXYZ(k, x * f * (1 + v * 0.1), Math.max(-0.3, y * f * 0.65), z * f);
  }
  g.translate(0, 0.25, 0);
  return (GEO_ROCA[v] = unir([pintarGeo(g, '#ffffff', 0.25, v + 3)]));
}

// Rampa (cuña) de ancho x alto x largo, con la base en y = 0 y la subida hacia +z
function geoRampa(ancho, alto, largo) {
  const a = ancho / 2, l = largo / 2;
  const v = [
    -a, 0, -l, a, 0, -l, a, 0, l, -a, 0, l, // base
    -a, alto, l, a, alto, l // arista alta
  ];
  const idx = [0, 2, 1, 0, 3, 2, /* base */ 0, 1, 5, 0, 5, 4, /* rampa */ 3, 4, 5, 3, 5, 2, /* trasera */ 0, 4, 3, /* lado */ 1, 2, 5];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  return ng;
}

// Texturas pequeñas generadas en un lienzo
function texturaRuido(tam, base, amp, semilla) {
  const c = document.createElement('canvas'); c.width = c.height = tam;
  const ctx = c.getContext('2d'), img = ctx.createImageData(tam, tam);
  const N = E.crearRuido(semilla || 5);
  for (let y = 0; y < tam; y++) for (let x = 0; x < tam; x++) {
    // ruido periódico: suma de dos octavas sobre un toro
    const a = x / tam * Math.PI * 2, b = y / tam * Math.PI * 2;
    const n = N.fbm(Math.cos(a) * 3 + 10, Math.sin(a) * 3 + Math.cos(b) * 3, 4) * 0.6 + N.ruido(Math.sin(b) * 9 + 3, Math.cos(a) * 9) * 0.4;
    const v = Math.max(0, Math.min(255, base + n * amp));
    const k = (y * tam + x) * 4; img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
function texturaAjedrez() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const ctx = c.getContext('2d');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 8; x++) { ctx.fillStyle = (x + y) % 2 ? '#111' : '#fff'; ctx.fillRect(x * 16, y * 16, 16, 16); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter;
  return t;
}
export function crearEtiqueta(texto, opts) {
  opts = opts || {};
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  const fs = 44;
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  const w = Math.ceil(ctx.measureText(texto).width) + 36;
  c.width = w; c.height = fs + 26;
  ctx.font = `bold ${fs}px system-ui, sans-serif`;
  ctx.fillStyle = opts.fondo || 'rgba(15,20,30,0.72)';
  const r = 16; ctx.beginPath(); ctx.roundRect(0, 0, w, c.height, r); ctx.fill();
  ctx.fillStyle = opts.color || '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(texto, 18, c.height / 2 + 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: opts.depthTest !== false, transparent: true }));
  const alto = opts.alto || 3;
  s.scale.set(alto * w / c.height, alto, 1);
  s.renderOrder = 10;
  if (opts.tamPantalla) { s.material.sizeAttenuation = false; s.scale.set(opts.tamPantalla * w / c.height, opts.tamPantalla, 1); }
  return s;
}
function texturaTexto(texto, fondo, color) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = fondo; ctx.fillRect(0, 0, 512, 256);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 12; ctx.strokeRect(6, 6, 500, 244);
  ctx.fillStyle = color || '#fff8e8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let fs = 90; ctx.font = `bold ${fs}px Georgia, serif`;
  while (ctx.measureText(texto).width > 470 && fs > 20) { fs -= 6; ctx.font = `bold ${fs}px Georgia, serif`; }
  ctx.fillText(texto, 256, 132);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const BLANCO_SUELO = new THREE.Color(1.02, 1.02, 1.0);
const COLOR_VEG = { hierba: new THREE.Color('#8fe04a'), trigo: new THREE.Color('#f0c43a'), flores: new THREE.Color('#ef5fae'), hierbaAlta: new THREE.Color('#2f8f3a'), bambu: new THREE.Color('#b6ef6a') };
const COLOR_AREA = { pueblo: '#f5c542', zona: '#e74c3c', bosque: '#2ecc71', rocas: '#95a5a6', lago: '#3498db' };
const COLOR_ZONA = { caza: '#e67e22', elite: '#9b59b6', jefe: '#c0392b', pvp: '#e84393', segura: '#2ecc71', arena: '#3498db' };

// ---------------------------------------------------------------------------
// Registro de dibujos por tipo de elemento
// ---------------------------------------------------------------------------
export const DIBUJOS = {};
export function registrarDibujo(tipo, fn) { DIBUJOS[tipo] = fn; }

const matCache = new Map();
function mat(color, extra) {
  const k = color + JSON.stringify(extra || {});
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.85 }, extra || {})));
  return matCache.get(k);
}
const MAT_VC = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
const MAT_VC_SUAVE = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 });
function malla(geo, material, sombra) { const m = new THREE.Mesh(geo, material); m.castShadow = sombra !== false; m.receiveShadow = true; return m; }

// Formas básicas: color y, si se elige, una foto de la biblioteca repetida cada ~1,5 m (no se estira con el tamaño)
const matForma = (p, color) => p.textura ? matFoto(p.textura, color || p.color) : mat(color || p.color);
const geoForma = (g, p) => p.textura ? uvEnMetros(g, p.repeticion || 1.5) : g;
registrarDibujo('caja', (el) => { const p = el.props; const m = malla(geoForma(new THREE.BoxGeometry(p.ancho, p.alto, p.fondo), p), matForma(p)); m.position.y = p.alto / 2; return m; });
registrarDibujo('plataforma', (el) => {
  const p = el.props, g = new THREE.Group();
  const cuerpo = malla(geoForma(new THREE.BoxGeometry(p.ancho, p.grosor * 0.8, p.fondo), p), matForma(p)); cuerpo.position.y = p.grosor * 0.4;
  const tapa = malla(new THREE.BoxGeometry(p.ancho + 0.1, p.grosor * 0.2, p.fondo + 0.1), mat(p.borde)); tapa.position.y = p.grosor * 0.9;
  g.add(cuerpo, tapa); return g;
});
registrarDibujo('rampa', (el) => { const p = el.props; return malla(geoForma(geoRampa(p.ancho, p.alto, p.largo), p), matForma(p)); });
registrarDibujo('cilindro', (el) => { const p = el.props; const m = malla(geoForma(new THREE.CylinderGeometry(p.radio, p.radio, p.alto, 24), p), matForma(p)); m.position.y = p.alto / 2; return m; });
registrarDibujo('esfera', (el) => { const p = el.props; const m = malla(new THREE.SphereGeometry(p.radio, 24, 16), mat(p.color)); m.position.y = p.radio; return m; });
registrarDibujo('muro', (el) => { const p = el.props; const m = malla(geoForma(new THREE.BoxGeometry(p.largo, p.alto, p.grosor), p), matForma(p)); m.position.y = p.alto / 2 - 0.3; return m; });
registrarDibujo('arbol', (el, ctx) => {
  const sp = especieReal(el.props.especie, ctx), glb = E.ARBOLES_GLB[sp];
  if (!glb) { const m = malla(geoArbol(sp), MAT_VC); m.scale.setScalar((el.props.alto || 9) / 10); return m; }
  const datos = () => [{ e: sp, x: el.x, y: E.alturaEn(ctx.esc, el.x, el.z) + (el.y || 0) - 0.15, z: el.z, alto: (el.props.alto || glb.alto) * (el.escala || 1), rot: (el.rotY || 0) * DEG, tinte: 1 }];
  const g = arbolesGlb(el, ctx, datos());
  const alto = (el.props.alto || glb.alto);
  const toque = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.22, alto * 0.22, alto, 8).translate(0, alto / 2, 0), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(toque);
  g.userData.alColocar = () => ctx.vegetacion.registrar(el.id, datos());
  return g;
});
registrarDibujo('roca', (el, ctx) => {
  const h = E.hashTexto(el.id), p = el.props;
  const forma = !p.forma || p.forma === 'variada' ? formaAzar((h % 1000) / 1000) : p.forma;
  const ps = piedrasDe(p.piedra, h), mat = materialRoca(ps[h % ps.length], 0, tinteRoca(p.color));
  const m = malla(geoRocaForma(forma, h % 3), mat);
  m.scale.setScalar(p.tam); m.rotation.y = (h % 360) * DEG; void ctx; return m;
});

// Dispersión en un área (bosque, pedregal) con InstancedMesh; la altura sigue al terreno.
function dispersar(el, ctx, cantidad, crearInstancias) {
  const rng = E.crearAzar(el.props.semilla || 1), r = el.props.radio, esc = ctx.esc;
  const pts = [];
  const agua = esc.terreno.agua.activa ? esc.terreno.agua.nivel : -Infinity;
  const caminos = ctx.muestrasCaminos();
  for (let k = 0; k < cantidad * 3 && pts.length < cantidad; k++) {
    const a = rng.next() * Math.PI * 2, d = Math.sqrt(rng.next()) * r;
    const x = el.x + Math.cos(a) * d, z = el.z + Math.sin(a) * d;
    if (!E.dentro(esc, x, z)) continue;
    const h = E.alturaEn(esc, x, z);
    if (h < agua + 0.6) continue;
    if (caminos.some(c => c.cerca(x, z))) continue;
    pts.push({ x, z, y: h, s: rng.next(), rot: rng.next() * Math.PI * 2, v: rng.next() });
  }
  return crearInstancias(pts, rng);
}
registrarDibujo('bosque', (el, ctx) => {
  const p = el.props, area = Math.PI * p.radio * p.radio;
  const n = Math.min(4000, Math.round(area / 1000 * p.densidad));
  return dispersar(el, ctx, n, (pts, rng) => {
    const g = new THREE.Group();
    const especies = p.especie === 'mixto' ? mezcla(ctx) : [especieReal(p.especie, ctx)];
    const porEspecie = {};
    const rocas = [];
    for (const q of pts) {
      if (q.v < (p.rocas || 0) * 0.5) { rocas.push(q); continue; }
      const sp = especies[Math.floor(q.v * 997) % especies.length];
      (porEspecie[sp] = porEspecie[sp] || []).push(q);
    }
    const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), ejeY = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
    const conModelo = [];
    for (const [sp, lista] of Object.entries(porEspecie)) {
      const glb = E.ARBOLES_GLB[sp];
      if (glb) {
        for (const q of lista) conModelo.push({ e: sp, x: q.x, y: q.y - 0.15, z: q.z, alto: glb.alto * (p.tamano || 1) * (0.78 + q.s * 0.44), rot: q.rot, tinte: 0.85 + q.v * 0.3 });
        continue;
      }
      const im = new THREE.InstancedMesh(geoArbol(sp), MAT_VC, lista.length);
      lista.forEach((q, k) => {
        const alto = p.altoMin + (p.altoMax - p.altoMin) * q.s;
        p3.set(q.x - el.x, q.y - ctx.baseY - 0.2, q.z - el.z); q4.setFromAxisAngle(ejeY, q.rot); s3.setScalar(alto / 10);
        im.setMatrixAt(k, m4.compose(p3, q4, s3));
        col.setScalar(0.82 + q.v * 0.3); im.setColorAt(k, col);
      });
      im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere();
      g.add(im);
    }
    if (rocas.length) g.add(instanciasRocas(rocas, el, ctx, 0.5, 2.2, '#7d7a74', { piedra: 'mezcla', semilla: (p.semilla || 1) + 3 }));
    if (conModelo.length) { ctx.vegetacion.registrar(el.id, conModelo); g.userData.alQuitar = () => ctx.vegetacion.quitar(el.id); }
    g.userData.sinEscala = true;
    return g;
  });
});
// Rocas instanciadas: se agrupan por forma (canto, losa, bloque…, dos variantes de cada) y por foto de piedra.
// opts: { forma: 'variada' | 'canto' | …, piedra: 'mezcla' | 'granito' | …, semilla }
function instanciasRocas(pts, el, ctx, tMin, tMax, color, opts) {
  opts = opts || {};
  const g = new THREE.Group();
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), p3 = new THREE.Vector3(), eu = new THREE.Euler(), col = new THREE.Color();
  const piedras = piedrasDe(opts.piedra, opts.semilla != null ? opts.semilla : (el.props.semilla || 1));
  const tinte = tinteRoca(color);
  const grupos = new Map();
  pts.forEach(q => {
    const t = (q.v * 7.13) % 1, forma = !opts.forma || opts.forma === 'variada' ? formaAzar(t) : opts.forma;
    const variante = Math.floor(q.v * 977) % 2, piedra = piedras[Math.floor(q.v * 313) % piedras.length];
    const k = forma + variante + piedra;
    if (!grupos.has(k)) grupos.set(k, { forma, variante, piedra, lista: [] });
    grupos.get(k).lista.push(q);
  });
  for (const gr of grupos.values()) {
    const im = new THREE.InstancedMesh(geoRocaForma(gr.forma, gr.variante), materialRoca(gr.piedra), gr.lista.length);
    gr.lista.forEach((q, k) => {
      const t = tMin + (tMax - tMin) * q.s * q.s;
      const incl = gr.forma === 'aguja' ? 0.12 : 0.18; // algo ladeadas, no todas rectas
      eu.set((q.v - 0.5) * incl, q.rot, (((q.v * 13.7) % 1) - 0.5) * incl);
      p3.set(q.x - el.x, q.y - ctx.baseY, q.z - el.z); q4.setFromEuler(eu); s3.setScalar(t);
      im.setMatrixAt(k, m4.compose(p3, q4, s3));
      col.copy(tinte).multiplyScalar(0.82 + ((q.v * 31.1) % 1) * 0.3); im.setColorAt(k, col);
    });
    im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere();
    g.add(im);
  }
  return g;
}
registrarDibujo('rocas', (el, ctx) => {
  const p = el.props;
  const g = dispersar(el, ctx, Math.min(2000, p.cantidad | 0), pts => instanciasRocas(pts, el, ctx, p.tamMin, p.tamMax, p.color, { forma: p.forma, piedra: p.piedra, semilla: p.semilla }));
  g.userData.sinEscala = true; return g;
});
registrarDibujo('lago', (el, ctx) => {
  const p = el.props;
  // disco con anillos (para que la hondura varíe de la orilla al centro) y uv en metros
  const geo = new THREE.RingGeometry(0.01, p.radio * 1.35, 72, 18).rotateX(-Math.PI / 2); // la orilla la marca el terreno
  const uvs = geo.attributes.uv, pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) uvs.setXY(i, pos.getX(i) / 9, pos.getZ(i) / 9);
  const nivel = ctx.baseY + (p.nivel || 0) + 0.05;
  ponerHondura(geo, ctx.esc, nivel, (x, z) => ({ x: el.x + x, z: el.z + z }));
  const hp = geo.attributes.aProf; // el anillo de fuera, siempre fuera del agua: así no flota sobre terreno más bajo
  for (let i = 0; i < pos.count; i++) if (Math.hypot(pos.getX(i), pos.getZ(i)) > p.radio * 1.3) hp.setX(i, Math.min(-0.35, hp.getX(i)));
  const hondo = new THREE.Color(p.color || '#2f6f8f').multiplyScalar(0.45);
  const m = new THREE.Mesh(geo, ctx.materialAgua({ colorHondo: '#' + hondo.getHexString(), colorSomero: '#4f8a80', hondura: 1.6, clave: 'lago' + hondo.getHexString() }));
  m.position.y = (p.nivel || 0) + 0.05; m.receiveShadow = true; m.renderOrder = 2;
  const g = new THREE.Group(); g.add(m); g.userData.sinEscala = true; return g;
});

// Marcas de juego
registrarDibujo('inicio', (el) => {
  const g = new THREE.Group(), c = el.props.color;
  const poste = malla(new THREE.CylinderGeometry(0.08, 0.08, 4, 8), mat('#dddddd')); poste.position.y = 2;
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 3.9, 0, 0, 2.9, 0, 0, 3.4, 1.6], 3)); tri.computeVertexNormals();
  const bandera = new THREE.Mesh(tri, new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide }));
  const flecha = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 3).rotateX(Math.PI / 2), mat(c, { emissive: c, emissiveIntensity: 0.25 }));
  flecha.position.set(0, 0.3, 2.2); flecha.scale.y = 0.2;
  const aro = new THREE.Mesh(new THREE.RingGeometry(1.4, 1.8, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.7 }));
  aro.position.y = 0.08;
  g.add(poste, bandera, flecha, aro); return g;
});
function arco(ancho, alto, materialBanda, colorPoste) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { const p = malla(new THREE.BoxGeometry(0.5, alto, 0.5), mat(colorPoste)); p.position.set(s * ancho / 2, alto / 2, 0); g.add(p); }
  const banda = malla(new THREE.BoxGeometry(ancho + 0.5, 1.1, 0.3), materialBanda); banda.position.y = alto;
  g.add(banda); return g;
}
let TEX_AJEDREZ = null;
registrarDibujo('meta', (el) => {
  if (!TEX_AJEDREZ) TEX_AJEDREZ = texturaAjedrez();
  const t = TEX_AJEDREZ.clone(); t.wrapS = THREE.RepeatWrapping; t.repeat.set(Math.max(1, el.props.ancho / 8), 1); t.needsUpdate = true;
  const g = arco(el.props.ancho, el.props.alto, new THREE.MeshStandardMaterial({ map: t }), '#eeeeee');
  const linea = new THREE.Mesh(new THREE.PlaneGeometry(el.props.ancho, 1.2).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: t, polygonOffset: true, polygonOffsetFactor: -4 }));
  linea.position.y = 0.12; g.add(linea);
  return g;
});
registrarDibujo('checkpoint', (el) => {
  const g = arco(el.props.ancho, el.props.alto, mat(el.props.color, { emissive: el.props.color, emissiveIntensity: 0.35 }), '#dcdcdc');
  const et = crearEtiqueta(String(el.props.orden), { alto: 1.6, fondo: 'rgba(0,0,0,0)' }); et.position.y = el.props.alto + 1.3; g.add(et);
  return g;
});
registrarDibujo('moneda', (el) => {
  const m = malla(new THREE.CylinderGeometry(0.6, 0.6, 0.15, 24).rotateX(Math.PI / 2), mat(el.props.color, { metalness: 0.8, roughness: 0.3, emissive: el.props.color, emissiveIntensity: 0.2 }));
  m.position.y = 1; m.scale.setScalar(el.props.tam || 1); m.userData.girar = true;
  const g = new THREE.Group(); g.add(m); return g;
});
registrarDibujo('luz', (el, ctx) => {
  const g = new THREE.Group(), p = el.props;
  const bombilla = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: p.color }));
  bombilla.position.y = 3;
  const poste = malla(new THREE.CylinderGeometry(0.07, 0.1, 3, 8), mat('#333333')); poste.position.y = 1.5;
  const luz = new THREE.PointLight(p.color, p.intensidad, p.alcance, 2); luz.position.y = 3;
  g.add(bombilla, poste, luz); void ctx; return g;
});
registrarDibujo('cartel', (el) => {
  const g = new THREE.Group();
  const poste = malla(new THREE.BoxGeometry(0.25, 2.6, 0.25), mat('#5a3d22')); poste.position.y = 1.3;
  const tabla = malla(new THREE.BoxGeometry(2.6, 1.3, 0.12), [mat(el.props.color), mat(el.props.color), mat(el.props.color), mat(el.props.color),
    new THREE.MeshStandardMaterial({ map: texturaTexto(el.props.texto || '', el.props.color) }), new THREE.MeshStandardMaterial({ map: texturaTexto(el.props.texto || '', el.props.color) })]);
  tabla.position.y = 2.5;
  g.add(poste, tabla); return g;
});
registrarDibujo('camara', (el, ctx) => {
  const g = new THREE.Group();
  if (!ctx.editor) return g;
  const c = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.6, 4).rotateX(-Math.PI / 2), mat('#222', { emissive: '#3498db', emissiveIntensity: 0.6 }));
  c.position.y = el.props.altura; c.rotation.x = el.props.inclinacion * DEG;
  const palo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, el.props.altura, 4), new THREE.MeshBasicMaterial({ color: '#3498db' })); palo.position.y = el.props.altura / 2;
  g.add(c, palo); return g;
});

// Modelos GLB (importados o de la biblioteca del Creador RPG)
function marcadorFalta(texto) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshStandardMaterial({ color: '#c0392b', wireframe: true }));
  m.position.y = 0.75; g.add(m);
  const et = crearEtiqueta(texto, { alto: 0.8 }); et.position.y = 2.2; g.add(et);
  return g;
}
function dibujarModelo(el, ctx, ruta, altura) {
  const g = new THREE.Group();
  if (!ruta) { g.add(marcadorFalta('Sin modelo')); return g; }
  const temporal = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: '#888', wireframe: true }));
  temporal.position.y = 0.5; temporal.scale.setScalar(Math.max(1, altura || 2)); g.add(temporal);
  ctx.cargarModelo(ruta).then(res => {
    g.remove(temporal);
    if (!res) { g.add(marcadorFalta('No se pudo cargar')); return; }
    const obj = SkeletonUtils.clone(res.escena);
    // base en y = 0, centrado en x/z y, si se pide, escalado a una altura
    const caja = new THREE.Box3().setFromObject(obj), tam = caja.getSize(new THREE.Vector3());
    const s = altura > 0 && tam.y > 0 ? altura / tam.y : 1;
    obj.scale.multiplyScalar(s);
    const c = caja.getCenter(new THREE.Vector3());
    obj.position.set(-c.x * s, -caja.min.y * s, -c.z * s);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = el.props.sombras !== false; o.receiveShadow = true; } });
    g.add(obj);
    if (res.animaciones && res.animaciones.length) ctx.animar(obj, res.animaciones);
    ctx.alCambiar();
  });
  return g;
}
// Puentes: el .glb tal cual (cruza a lo largo de su X), estirado al largo y al ancho de la calzada
registrarDibujo('puente', (el, ctx) => {
  const def = E.PUENTES[el.props.modelo] || E.PUENTES.romano;
  const g = new THREE.Group();
  const sx = (el.props.largo || def.vano) / def.vano, sz = (el.props.ancho || def.calzada) / def.calzada;
  const tmp = new THREE.Mesh(new THREE.BoxGeometry(def.vano * sx, def.centro, def.calzada * sz), new THREE.MeshBasicMaterial({ color: '#888', wireframe: true }));
  tmp.position.y = def.centro / 2; g.add(tmp);
  ctx.cargarModelo(def.archivo).then(res => {
    g.remove(tmp);
    if (!res) { g.add(marcadorFalta('No se pudo cargar el puente')); return; }
    const obj = SkeletonUtils.clone(res.escena);
    obj.scale.set(sx, 1, sz);
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    g.add(obj);
    ctx.alCambiar();
  });
  return g;
});
// Edificios de esta app (glb/edificios/) con su altura real: se usa si el elemento no pide otra
export const EDIFICIOS = [
  { ruta: (globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'glb/edificios/iglesia_granada_moguer.glb', nombre: 'Iglesia de la Granada (Moguer) · torre de 48 m', alto: 48 }
];
registrarDibujo('glb', (el, ctx) => dibujarModelo(el, ctx, el.props.modelo, el.props.alturaObjetivo || (EDIFICIOS.find(e => e.ruta === el.props.modelo) || {}).alto || 0));
registrarDibujo('enemigo', (el, ctx) => {
  const g = dibujarModelo(el, ctx, el.props.modelo, el.props.alturaObjetivo || 2.4);
  if (ctx.editor || ctx.etiquetas) { const et = crearEtiqueta((el.nombre || 'Enemigo') + ' · Nv ' + el.props.nivel, { alto: 0.9 }); et.position.y = (el.props.alturaObjetivo || 2.4) + 1; g.add(et); }
  return g;
});

// RPG: maqueta del pueblo (casas y muralla a partir de su configuración del Creador de Pueblos)
const PALETAS_PUEBLO = {
  andaluz: ['#f5f2ea', '#b4532a'], l2_fantasy: ['#d9cdb4', '#8b3a2f'], european: ['#e8dcc6', '#9c4a30'], fortified: ['#b8ad9c', '#5d4a3a'], trade: ['#e6d2a8', '#a4532d'],
  dwarven: ['#8f8577', '#4b4038'], elven: ['#e9efe0', '#3f7a5a'], desert: ['#e3c99a', '#c9a46a'], nordic: ['#8a6a4a', '#3e4a52'], oriental: ['#e7dcc8', '#7a2a2a'], swamp: ['#7a6a52', '#4a5a3a']
};
registrarDibujo('pueblo', (el, ctx) => {
  const cfg = el.props.cfg || E.cfgPuebloPorDefecto(1, 3), R = el.props.radio, esc = ctx.esc;
  const g = new THREE.Group(); g.userData.sinEscala = true;
  const [pared, tejado] = PALETAS_PUEBLO[cfg.style] || PALETAS_PUEBLO.european;
  const rng = E.crearAzar(cfg.seed || 1);
  const yLocal = (x, z) => E.alturaEn(esc, el.x + x, el.z + z) - ctx.baseY;
  // Suelo de la plaza y calles principales
  const suelo = new THREE.CircleGeometry(R * 0.2, 40).rotateX(-Math.PI / 2);
  const ps = suelo.attributes.position;
  for (let k = 0; k < ps.count; k++) ps.setY(k, yLocal(ps.getX(k), ps.getZ(k)) + 0.08);
  const mSuelo = malla(pintarGeo(suelo, '#b3a48e', 0.05), MAT_VC_SUAVE, false); mSuelo.userData.maqueta = true; g.add(mSuelo);
  const geos = [];
  const rot = (cfg.rotation || 0) * DEG;
  // calles: las 4 principales y, hasta el borde del terreno del pueblo, las de salida hacia los caminos
  const calles = [0, 1, 2, 3].map(s => ({ a: rot + s * Math.PI / 2, largo: R * 0.95 }));
  for (const ex of (cfg.exits || [])) calles.push({ a: rot + ex.angle * DEG, largo: E.mitadTerrenoPueblo(cfg) / Math.max(Math.abs(Math.cos(ex.angle * DEG)), Math.abs(Math.sin(ex.angle * DEG))) });
  calles.forEach((cl, s) => {
    const a = cl.a, ancho = cfg.roadWidth || 7, n = Math.ceil(cl.largo / 4);
    const calle = new THREE.PlaneGeometry(ancho, cl.largo, 1, n).rotateX(-Math.PI / 2);
    calle.translate(0, 0, cl.largo / 2); calle.rotateY(-a + Math.PI / 2);
    const pc = calle.attributes.position;
    for (let k = 0; k < pc.count; k++) pc.setY(k, yLocal(pc.getX(k), pc.getZ(k)) + 0.07);
    geos.push(pintarGeo(calle, '#9c8f7c', 0.05, s));
  });
  // Casas en anillos, sin pisar las calles
  const nCasas = Math.round((cfg.size || 3) * 9 * (cfg.houseDensity || 80) / 80);
  // sin casas en los solares de los edificios del escenario (la iglesia…)
  const solares = reservasDePueblo(esc, el, E.dentroTerrenoPueblo).pols;
  const enSolar = (x, z) => solares.some(P => { let d = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) d = !d; } return d; });
  const casas = [];
  for (let k = 0; k < nCasas * 6 && casas.length < nCasas; k++) {
    const a = rng.next() * Math.PI * 2, d = R * (0.24 + rng.next() * 0.58);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    // distancia a las calles (4 rectas desde el centro)
    let lejos = true;
    for (let s = 0; s < 4; s++) { const b = rot + s * Math.PI / 2; const dist = Math.abs(-Math.sin(b) * x + Math.cos(b) * z); const proy = Math.cos(b) * x + Math.sin(b) * z; if (proy > 0 && dist < (cfg.roadWidth || 7) / 2 + 5) lejos = false; }
    if (!lejos || casas.some(c => Math.hypot(c.x - x, c.z - z) < 11)) continue;
    if ([[0, 0], [6, 6], [-6, 6], [6, -6], [-6, -6]].some(([ox, oz]) => enSolar(el.x + x + ox, el.z + z + oz))) continue;
    casas.push({ x, z, w: 6 + rng.next() * 4, f: 6 + rng.next() * 3, pisos: 1 + Math.floor(rng.next() * (cfg.maxFloors || 2)), a: Math.atan2(z, x) });
  }
  for (const c of casas) {
    const h = c.pisos * 3.2, y = yLocal(c.x, c.z);
    const cuerpo = new THREE.BoxGeometry(c.w, h + 1, c.f); cuerpo.translate(0, (h + 1) / 2 - 1, 0);
    const techo = new THREE.ConeGeometry(Math.hypot(c.w, c.f) / 2 + 0.4, 3.4, 4); techo.rotateY(Math.PI / 4); techo.scale(c.w / Math.hypot(c.w, c.f) * 1.41, 1, c.f / Math.hypot(c.w, c.f) * 1.41); techo.translate(0, h + 1.7, 0);
    for (const [geo, col] of [[cuerpo, pared], [techo, tejado]]) { geo.rotateY(-c.a); geo.translate(c.x, y, c.z); geos.push(pintarGeo(geo, col, 0.12, Math.round(c.x * 13))); }
  }
  // Muralla con 4 puertas y torres
  if (cfg.hasWalls) {
    const rm = R * 0.88, segs = 48;
    for (let k = 0; k < segs; k++) {
      const a0 = k / segs * Math.PI * 2, a1 = (k + 1) / segs * Math.PI * 2, am = (a0 + a1) / 2;
      const enPuerta = [0, 1, 2, 3].some(s => { let d = Math.abs(((am - rot - s * Math.PI / 2) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI); return d < 0.07; });
      if (enPuerta) continue;
      const x0 = Math.cos(a0) * rm, z0 = Math.sin(a0) * rm, x1 = Math.cos(a1) * rm, z1 = Math.sin(a1) * rm;
      const largo = Math.hypot(x1 - x0, z1 - z0) + 0.4, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
      const w = new THREE.BoxGeometry(largo, 7, 1.6); w.translate(0, 2.5, 0); w.rotateY(-Math.atan2(z1 - z0, x1 - x0)); w.translate(mx, yLocal(mx, mz), mz);
      geos.push(pintarGeo(w, '#8d8478', 0.08, k));
      if (k % 6 === 0) { const t = new THREE.CylinderGeometry(2.4, 2.6, 11, 8); t.translate(x0, yLocal(x0, z0) + 4, z0); geos.push(pintarGeo(t, '#7f776b', 0.08, k + 99)); }
    }
  }
  if (geos.length) { const mq = malla(unir(geos), MAT_VC); mq.userData.maqueta = true; g.add(mq); }
  if (ctx.editor || ctx.etiquetas) { const et = crearEtiqueta('🏘 ' + el.nombre + ' · Nv ' + (el.props.nivel || 1), { alto: Math.max(4, R * 0.06) }); et.position.y = yLocal(0, 0) + 22; g.add(et); }
  return g;
});
registrarDibujo('zona', (el, ctx) => {
  const p = el.props, g = new THREE.Group(); g.userData.sinEscala = true;
  const col = COLOR_ZONA[p.subtipo] || '#e74c3c';
  // Enemigos colocados en la zona
  const lista = (p.enemigos || []).filter(e => e && e.modelo);
  const rng = E.crearAzar(p.semilla || 1);
  let total = 0;
  for (const en of lista) {
    for (let k = 0; k < Math.min(20, en.cantidad || 1) && total < 40; k++, total++) {
      const a = rng.next() * Math.PI * 2, d = Math.sqrt(rng.next()) * p.radio * 0.75;
      const x = Math.cos(a) * d, z = Math.sin(a) * d;
      const m = dibujarModelo({ props: { sombras: true } }, ctx, en.modelo, en.alto || 2.4);
      m.position.set(x, E.alturaEn(ctx.esc, el.x + x, el.z + z) - ctx.baseY, z);
      m.rotation.y = rng.next() * Math.PI * 2;
      g.add(m);
    }
  }
  if (ctx.editor || ctx.etiquetas) {
    const et = crearEtiqueta('⚔ ' + el.nombre + ' · Nv ' + p.nivelMin + '–' + p.nivelMax, { alto: Math.max(3, p.radio * 0.05), fondo: 'rgba(80,10,10,0.7)' });
    et.position.y = E.alturaEn(ctx.esc, el.x, el.z) - ctx.baseY + 12; g.add(et);
  }
  g.userData.colorArea = col;
  return g;
});
registrarDibujo('mazmorra', (el, ctx) => {
  const g = new THREE.Group();
  const piedra = '#6f6a63';
  for (const s of [-1, 1]) { const p = malla(new THREE.BoxGeometry(1.6, 6, 1.6), mat(piedra)); p.position.set(s * 3, 3, 0); g.add(p); }
  const din = malla(new THREE.BoxGeometry(8.2, 1.6, 2), mat('#5d5852')); din.position.y = 6.6; g.add(din);
  const hueco = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6), new THREE.MeshBasicMaterial({ color: '#050505' })); hueco.position.set(0, 3, -0.2); g.add(hueco);
  const fondo = malla(new THREE.BoxGeometry(9, 8, 6), mat('#57524b')); fondo.position.set(0, 3.5, -3.4); g.add(fondo);
  for (let k = 0; k < 5; k++) { const r = malla(geoRoca(k), mat('#6a655d', { vertexColors: true, flatShading: true })); r.scale.setScalar(1.5 + (k % 3)); r.position.set(-5 + k * 2.5, 0, -6 - (k % 2) * 2); g.add(r); }
  if (ctx.editor || ctx.etiquetas) { const et = crearEtiqueta('🕳 ' + el.nombre + ' · Nv ' + el.props.nivel, { alto: 2.4 }); et.position.y = 10; g.add(et); }
  return g;
});

// ---------------------------------------------------------------------------
// Vallas y barreras a lado y lado de los caminos (por instancias; las piezas largas van de un poste al siguiente)
// ---------------------------------------------------------------------------
const BLANCO = new THREE.Color(1, 1, 1);
function texturaRayas(c1, c2, n) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 8;
  const ctx = cv.getContext('2d');
  for (let k = 0; k < n * 2; k++) { ctx.fillStyle = k % 2 ? c2 : c1; ctx.fillRect(k * 64 / (n * 2), 0, 64 / (n * 2) + 1, 8); }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// Material con una foto de la biblioteca del Creador de Pueblos (assets/texturas, js/texturas-lib.js)
const cacheFotos = new Map();
function matFoto(id, color, extra) {
  const k = id + color + JSON.stringify(extra || {});
  if (cacheFotos.has(k)) return cacheFotos.get(k);
  const T = window.TexturasLib;
  let map = T ? T.textura(THREE, id) : null;
  if (!map) { // grupos que no están en el catálogo de TexturasLib (setos, hierba): se cargan por su ruta
    map = new THREE.TextureLoader().load((globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'assets/texturas/' + id + '.jpg');
    map.wrapS = map.wrapT = THREE.RepeatWrapping; map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8;
  }
  const m = new THREE.MeshStandardMaterial(Object.assign({ color: map ? color : '#9a8a78', map, roughness: 0.9 }, extra || {}));
  cacheFotos.set(k, m);
  return m;
}
const cachePiezas = {};
const pieza = (id, crear) => () => cachePiezas[id] || (cachePiezas[id] = crear());
const PIEZAS = {
  poste_madera: pieza('poste_madera', () => ({ geo: new THREE.BoxGeometry(0.14, 1.15, 0.14).translate(0, 0.5, 0), mat: matFoto('madera/t01', '#c9b49a') })),
  riel_madera: pieza('riel_madera', () => ({ geo: new THREE.BoxGeometry(1, 0.11, 0.05), mat: matFoto('madera/t07', '#d8c6ae') })),
  poste_metal: pieza('poste_metal', () => ({ geo: new THREE.BoxGeometry(0.1, 0.8, 0.12).translate(0, 0.3, 0), mat: mat('#9aa1a8', { metalness: 0.15, roughness: 0.55 }) })),
  bionda: pieza('bionda', () => ({ geo: new THREE.BoxGeometry(1, 0.32, 0.07), mat: mat('#d3d8de', { metalness: 0.2, roughness: 0.35 }) })),
  neumatico: pieza('neumatico', () => ({ geo: new THREE.CylinderGeometry(0.34, 0.34, 0.24, 14).translate(0, 0.12, 0), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.92 }) })),
  muro: pieza('muro', () => {
    const f = new THREE.Shape([[-0.3, 0], [0.3, 0], [0.3, 0.08], [0.12, 0.3], [0.09, 0.9], [-0.09, 0.9], [-0.12, 0.3], [-0.3, 0.08]].map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ExtrudeGeometry(f, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5).rotateY(Math.PI / 2);
    return { geo: uvEnMetros(g, 1.5), mat: Object.assign(matFoto('piedra/t07', '#ffffff'), {}) };
  }),
  poste_cinta: pieza('poste_cinta', () => ({ geo: new THREE.CylinderGeometry(0.025, 0.03, 1.0, 6).translate(0, 0.5, 0), mat: mat('#e8e8e8'), sombra: false })),
  cinta: pieza('cinta', () => { const t = texturaRayas('#e3262b', '#ffffff', 4); return { geo: new THREE.PlaneGeometry(1, 0.08), mat: new THREE.MeshStandardMaterial({ map: t, side: THREE.DoubleSide, roughness: 0.6 }), sombra: false }; }),
  bala_paja: pieza('bala_paja', () => ({ geo: uvEnMetros(new THREE.BoxGeometry(1.2, 0.6, 0.6).translate(0, 0.3, 0), 0.6), mat: matFoto('hierba/t03', '#f2e2b0') })),
  cono: pieza('cono', () => ({ geo: unir([pintarGeo(new THREE.ConeGeometry(0.17, 0.5, 12).translate(0, 0.27, 0), '#f26a1b', 0), pintarGeo(new THREE.BoxGeometry(0.4, 0.03, 0.4).translate(0, 0.015, 0), '#222222', 0)]), mat: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }) })),
  panel_publi: pieza('panel_publi', () => ({ geo: new THREE.BoxGeometry(2.8, 0.9, 0.06).translate(0, 0.85, 0), mat: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }) })),
  seto: pieza('seto', () => ({ geo: uvEnMetros(new THREE.BoxGeometry(1, 1.3, 0.9).translate(0, 0.62, 0), 1.2), mat: matFoto('setos/t01', '#ffffff', { roughness: 1 }) })),
  muro_piedra: pieza('muro_piedra', () => ({ geo: uvEnMetros(new THREE.BoxGeometry(1, 1.0, 0.6).translate(0, 0.45, 0), 1.2), mat: matFoto('piedra/t01', '#ffffff') })),
  pata_publi: pieza('pata_publi', () => ({ geo: new THREE.BoxGeometry(0.06, 0.45, 0.4).translate(0, 0.22, 0), mat: mat('#555a60') }))
};
const COLORES_PUBLI = ['#1f6fd1', '#d62a2a', '#f2c12e', '#2c9a4b', '#ffffff', '#111111'].map(c => new THREE.Color(c));

// Recorre las barreras de un camino y añade sus piezas a «piezas» (id → [{ m: Matrix4, color }])
function colocarBarreras(esc, c, piezas) {
  const mu = E.muestrearCamino(c, 1);
  const total = mu[mu.length - 1].d;
  if (total <= 0) return;
  const enD = d => {
    if (c.cerrado) d = ((d % total) + total) % total; else d = E.clamp(d, 0, total);
    let a = 0, b = mu.length - 1;
    while (b - a > 1) { const m = (a + b) >> 1; if (mu[m].d < d) a = m; else b = m; }
    const t = (d - mu[a].d) / Math.max(1e-6, mu[b].d - mu[a].d);
    let dx = mu[b].x - mu[a].x, dz = mu[b].z - mu[a].z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    return { x: mu[a].x + (mu[b].x - mu[a].x) * t, z: mu[a].z + (mu[b].z - mu[a].z) * t, dx, dz };
  };
  const meter = (id, m, color) => (piezas[id] = piezas[id] || []).push({ m, color });
  const q = new THREE.Quaternion(), eje = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0), v = new THREE.Vector3(), s = new THREE.Vector3();
  const poner = (id, p, giro, esc1, color) => meter(id, new THREE.Matrix4().compose(v.set(p.x, p.y, p.z), q.setFromAxisAngle(eje, giro), s.setScalar(esc1 || 1)), color);
  // pieza larga de a a b (a la altura h sobre el suelo), con su largo como escala en x
  const tramo = (id, a, b, h, color) => {
    const dir = new THREE.Vector3(b.x - a.x, b.y - a.y, b.z - a.z), largo = dir.length();
    if (largo < 0.05) return;
    meter(id, new THREE.Matrix4().compose(v.set((a.x + b.x) / 2, (a.y + b.y) / 2 + h, (a.z + b.z) / 2), new THREE.Quaternion().setFromUnitVectors(X, dir.normalize()), s.set(largo + 0.02, 1, 1)), color);
  };
  for (const b of c.barreras || []) {
    const def = (E.TIPOS_BARRERA.find(t => t[0] === b.tipo) || E.TIPOS_BARRERA[0])[2];
    let d0 = b.desde || 0, d1 = b.hasta == null ? total : b.hasta;
    if (d1 < d0) { if (!c.cerrado) continue; d1 += total; }
    const n = Math.max(1, Math.round((d1 - d0) / def.paso));
    const lados = b.lado === 'izq' ? [1] : b.lado === 'der' ? [-1] : [1, -1];
    for (const lado of lados) {
      const off = lado * (c.ancho / 2 + (b.separacion == null ? 1 : b.separacion));
      const pts = [];
      for (let k = 0; k <= n; k++) {
        const p = enD(d0 + (d1 - d0) * k / n);
        const x = p.x - p.dz * off, z = p.z + p.dx * off;
        pts.push({ x, z, y: E.alturaEn(esc, x, z), giro: Math.atan2(p.dx, p.dz) });
      }
      const rnd = E.mulberry32(E.hashTexto(c.id + b.tipo + lado + d0));
      const pueblos = esc.elementos.filter(e => e.tipo === 'pueblo' && e.props.cfg);
      const enPueblo = p => pueblos.some(pu => E.dentroTerrenoPueblo(pu, p.x, p.z, -2));
      pts.forEach((p, k) => {
        if (enPueblo(p)) return; // dentro del pueblo mandan sus calles
        let sig = pts[k + 1];
        if (sig && enPueblo(sig)) sig = null;
        switch (b.tipo) {
          case 'valla_madera': poner('poste_madera', p, p.giro); if (sig) { tramo('riel_madera', p, sig, 0.45); tramo('riel_madera', p, sig, 0.9); } break;
          case 'guardarrail': poner('poste_metal', p, p.giro); if (sig) tramo('bionda', p, sig, 0.55); break;
          case 'muro': if (sig) tramo('muro', p, sig, 0, new THREE.Color(k % 2 ? '#c9c4ba' : '#bdb7ac')); break;
          case 'cinta': poner('poste_cinta', p, p.giro); if (sig) tramo('cinta', p, sig, 0.92); break;
          case 'seto': if (sig) tramo('seto', p, sig, 0, new THREE.Color().setHSL(0.3, 0.2, 0.85 + rnd() * 0.15)); break;
          case 'muro_piedra': if (sig) tramo('muro_piedra', p, sig, 0); break;
          case 'neumaticos': {
            const col = k % 2 ? new THREE.Color('#1c1c1c') : (k % 4 === 0 ? new THREE.Color('#e9e9e9') : new THREE.Color('#c62828'));
            for (let h = 0; h < 3; h++) poner('neumatico', { x: p.x, y: p.y + h * 0.24, z: p.z }, rnd() * 6, 1, h === 2 ? col : new THREE.Color('#1c1c1c'));
            break;
          }
          case 'balas_paja': if (k < pts.length - 1 || pts.length === 1) poner('bala_paja', p, p.giro + Math.PI / 2 + (rnd() - 0.5) * 0.1); break;
          case 'conos': poner('cono', p, rnd() * 6); break;
          case 'valla_publi': if (k < pts.length - 1 || pts.length === 1) {
            const giro = p.giro + Math.PI / 2;
            poner('panel_publi', p, giro, 1, COLORES_PUBLI[Math.floor(rnd() * COLORES_PUBLI.length)]);
            for (const sx of [-1.1, 1.1]) poner('pata_publi', { x: p.x + Math.cos(giro) * sx, y: p.y, z: p.z - Math.sin(giro) * sx }, giro);
          } break;
        }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// La escena
// ---------------------------------------------------------------------------
export class Escena3D {
  // opts: { scene, renderer, editor, calidad: 'baja'|'media'|'alta', cargarModeloLocal(id) → Promise<ArrayBuffer>, alCambiar() }
  constructor(opts) {
    this.o = Object.assign({ editor: false, calidad: 'media', etiquetas: true, mostrarAreas: true }, opts);
    this.scene = opts.scene;
    this.renderer = opts.renderer;
    this.raiz = new THREE.Group(); this.scene.add(this.raiz);
    this.gTerreno = new THREE.Group(); this.gCaminos = new THREE.Group(); this.gElementos = new THREE.Group(); this.gAreas = new THREE.Group();
    this.gBarreras = new THREE.Group(); this.gBarreras.name = 'barreras';
    this.raiz.add(this.gTerreno, this.gCaminos, this.gElementos, this.gAreas, this.gBarreras);
    this.objetos = new Map(); // id → Object3D
    this.modelos = new Map(); // ruta → Promise<{ escena, animaciones }>
    this.mezcladores = [];
    this.reloj = 0;
    this._muestrasCaminos = null;
    this.loader = new GLTFLoader();
    const draco = new DRACOLoader(); draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/');
    this.loader.setDRACOLoader(draco); this.loader.setMeshoptDecoder(MeshoptDecoder);
    this.vegetacion = new Vegetacion({ renderer: this.renderer, loader: this.loader, calidad: this.o.calidad, especies: E.ARBOLES_GLB });
    this.raiz.add(this.vegetacion.grupo);
    this.tiempoAgua = { value: 0 };
    this.matsAgua = [];
    this.entornoAgua = new EntornoAgua(this.renderer);
    this.pradera = new Pradera({ renderer: this.renderer, calidad: this.o.calidad });
    this.raiz.add(this.pradera.grupo);
    // Texturas reales del suelo y de los caminos: mientras cargan se ven los colores planos. Si la gráfica no puede
    // con su shader, se vuelve a los colores planos y se avisa (con el error, para poder arreglarlo).
    const r0 = this.renderer;
    const antes = r0.debug.onShaderError;
    r0.debug.onShaderError = (gl, prog, vs, fs) => {
      const log = (gl.getProgramInfoLog(prog) || '') + ' ' + (gl.getShaderInfoLog(fs) || '') + ' ' + (gl.getShaderInfoLog(vs) || '');
      console.error('Error de shader:', log);
      const src = gl.getShaderSource(fs) || '';
      if (/muestraCapa/.test(src) && this.suelos) this.desactivarSuelos('La gráfica de este dispositivo no admite las texturas del suelo; se usan colores planos. (' + log.trim().slice(0, 160) + ')');
      else if (typeof antes === 'function') antes(gl, prog, vs, fs);
    };
    const tactil = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
    if (this.o.texturasSuelo !== false) cargarSuelos(this.o.calidad === 'baja' || tactil ? 256 : 512).then(s => {
      if (this._sinSuelos) return;
      this.suelos = s;
      if (this.esc) { this.construirTerreno(); this.construirCaminos(); }
    }).catch(e => this.o.alAviso && this.o.alAviso('No se pudieron cargar las texturas del suelo: ' + e.message));
    this._crearAmbiente();
    this.texSuelo = texturaRuido(256, 200, 55, 11);
  }

  desactivarSuelos(motivo) {
    if (this._sinSuelos) return;
    this._sinSuelos = true; this.suelos = null; this._matCamino = null;
    setTimeout(() => { if (this.esc) { this.construirTerreno(); this.construirCaminos(); } }, 0);
    if (motivo && this.o.alAviso) this.o.alAviso(motivo);
  }

  // --- Cielo, sol y niebla ---
  _crearAmbiente() {
    this.cielo = new Sky(); this.cielo.scale.setScalar(10000);
    const u = this.cielo.material.uniforms;
    u.turbidity.value = 2; u.rayleigh.value = 0.9; u.mieCoefficient.value = 0.004; u.mieDirectionalG.value = 0.8;
    this.scene.add(this.cielo);
    this.sol = new THREE.DirectionalLight('#fff4e0', 2.4);
    this.sol.castShadow = this.o.calidad !== 'baja';
    const sm = this.o.calidad === 'alta' ? 4096 : 2048;
    this.sol.shadow.mapSize.set(sm, sm);
    this.sol.shadow.bias = -0.0004; this.sol.shadow.normalBias = 0.6;
    this.scene.add(this.sol, this.sol.target);
    this.hemi = new THREE.HemisphereLight('#cfe3ff', '#5a5040', 0.9);
    this.scene.add(this.hemi);
    this.scene.fog = new THREE.Fog('#bcd3e6', 300, 3000);
    this.foco = new THREE.Vector3();
  }
  setHora(h) {
    this.hora = h;
    const t = (h - 6) / 12; // 0 amanecer, 0.5 mediodía, 1 anochecer
    const elev = Math.sin(t * Math.PI) * 70; // grados
    const azim = 30 + (t - 0.5) * 160; // a mediodía el sol viene del lado de la cámara inicial (+x, +z)
    const dia = THREE.MathUtils.clamp((elev + 6) / 20, 0, 1);
    const ocaso = THREE.MathUtils.clamp(1 - Math.abs(elev - 4) / 14, 0, 1) * dia;
    const sun = new THREE.Vector3().setFromSphericalCoords(1, (90 - Math.max(elev, -10)) * DEG, azim * DEG);
    this.cielo.material.uniforms.sunPosition.value.copy(sun);
    this.dirSol = sun.clone();
    this.sol.intensity = 0.15 + 2.6 * dia;
    this.sol.color.set('#fff4e0').lerp(new THREE.Color('#ff9a52'), ocaso);
    if (dia < 0.05) this.sol.color.set('#8fa6d8');
    this.hemi.intensity = 0.2 + 0.8 * dia;
    this.vegetacion.setLuz(0.12 + 0.88 * dia);
    this._entornoPendiente = true;
    if (this.matsAgua) for (const m of this.matsAgua) m.envMapIntensity = 0.12 + 0.22 * dia;
    this.hemi.color.set('#cfe3ff').lerp(new THREE.Color('#33406a'), 1 - dia);
    const niebla = new THREE.Color('#bcd3e6').lerp(new THREE.Color('#e6a77a'), ocaso).lerp(new THREE.Color('#0c1220'), 1 - dia);
    this.scene.fog.color.copy(niebla);
    this.scene.background = niebla.clone();
    this.cielo.visible = dia > 0.02;
    this.renderer.toneMappingExposure = 0.3 + 0.25 * dia;
    this._colocarSol();
  }
  setNubes(n) { // 0–1
    const u = this.cielo.material.uniforms;
    if (u.cloudCoverage) { u.cloudCoverage.value = n; u.cloudDensity.value = 0.25 + n * 0.4; }
  }
  crearMaterialAgua(opts) {
    this._cacheAgua = this._cacheAgua || {};
    if (opts && opts.clave && this._cacheAgua[opts.clave]) return this._cacheAgua[opts.clave];
    const m = materialAgua(Object.assign({ tiempo: this.tiempoAgua }, opts));
    if (this.entornoAgua.textura) m.envMap = this.entornoAgua.textura;
    this.matsAgua.push(m); this._entornoPendiente = true;
    if (opts && opts.clave) this._cacheAgua[opts.clave] = m;
    return m;
  }
  setNiebla(n) { // 0–1
    const tam = this.esc ? this.esc.terreno.tam : 1024;
    const lejos = THREE.MathUtils.lerp(Math.max(6000, tam * 3), Math.max(250, tam * 0.25), n);
    this.scene.fog.near = lejos * 0.08; this.scene.fog.far = lejos;
  }
  setFoco(x, z, radio) {
    this.foco.set(x, this.esc ? E.alturaEn(this.esc, x, z) : 0, z);
    if (radio) this.radioSombra = radio;
    this._colocarSol();
  }
  _colocarSol() {
    if (!this.dirSol) return;
    const r = this.radioSombra || 200;
    this.sol.position.copy(this.foco).addScaledVector(this.dirSol, r * 3);
    this.sol.target.position.copy(this.foco);
    const c = this.sol.shadow.camera;
    c.left = -r; c.right = r; c.top = r; c.bottom = -r; c.near = 1; c.far = r * 7;
    c.updateProjectionMatrix();
  }

  // --- Construcción completa ---
  construir(esc) {
    this.esc = esc;
    this.pradera.usar(esc, this);
    this._muestrasCaminos = null;
    this.construirTerreno();
    this.construirAgua();
    this.construirCaminos();
    this.reconstruirElementos();
    this.setHora(esc.ambiente.hora);
    this.setNiebla(esc.ambiente.niebla);
    this.setNubes(esc.ambiente.nubes == null ? 0.4 : esc.ambiente.nubes);
    this.setFoco(0, 0, Math.min(esc.terreno.tam * 0.6, this.o.editor ? 700 : 220));
  }

  construirTerreno() {
    const esc = this.esc, t = esc.terreno, r = t.res;
    if (this.terreno) { this.gTerreno.remove(this.terreno); this.terreno.geometry.dispose(); }
    if (this.falda) { this.gTerreno.remove(this.falda); this.falda.geometry.dispose(); }
    const geo = new THREE.PlaneGeometry(t.tam, t.tam, r - 1, r - 1).rotateX(-Math.PI / 2);
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(r * r * 3), 3));
    // uv en metros para la textura de detalle
    const uv = geo.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * t.tam / 6, uv.getY(k) * t.tam / 6);
    let m;
    if (this.suelos) { this.mezcla = crearMezcla(r); m = materialTerreno(this.suelos, this.mezcla, esc); }
    else { this.mezcla = null; m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, map: this.texSuelo }); }
    this.terreno = new THREE.Mesh(geo, m);
    this.terreno.receiveShadow = true; this.terreno.castShadow = this.o.calidad === 'alta';
    this.terreno.name = 'terreno';
    this.gTerreno.add(this.terreno);
    // Falda en los bordes para que el terreno parezca un bloque
    this.falda = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({ color: '#5b4a3a', roughness: 1, side: THREE.DoubleSide }));
    this.falda.visible = t.bordes !== 'infinito' || this.o.editor;
    this.gTerreno.add(this.falda);
    this._rango = E.rangoAlturas(esc);
    this.actualizarTerreno();
  }

  // Actualiza alturas y colores (en una región de la rejilla o entero)
  actualizarTerreno(reg, soloColor) {
    const esc = this.esc, t = esc.terreno, r = t.res;
    if (!this.terreno || this.terreno.geometry.attributes.position.count !== r * r) return this.construirTerreno();
    const pos = this.terreno.geometry.attributes.position, col = this.terreno.geometry.attributes.color;
    if (!reg) { reg = { i0: 0, i1: r - 1, j0: 0, j1: r - 1 }; E.olvidarRango(esc); this._rango = E.rangoCache(esc); }
    const i0 = Math.max(0, reg.i0 - 1), i1 = Math.min(r - 1, reg.i1 + 1), j0 = Math.max(0, reg.j0 - 1), j1 = Math.min(r - 1, reg.j1 + 1);
    const cols = E.MATERIALES.map(m => new THREE.Color(m.color));
    if (!this._ruidoColor || this._ruidoColor.semilla !== t.gen.semilla) { this._ruidoColor = E.crearRuido((t.gen.semilla || 1) + 555); this._ruidoColor.semilla = t.gen.semilla; }
    const N = this._ruidoColor, p = E.paso(esc), m0 = -t.tam / 2;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const k = j * r + i;
      if (!soloColor) pos.setY(k, t.alturas[k]);
      const c = this.mezcla ? BLANCO_SUELO : (cols[E.materialEn(esc, i, j, this._rango)] || cols[1]);
      // variación: grano fino por vértice + manchas grandes, para que el suelo no sea plano
      const x = m0 + i * p, z = m0 + j * p;
      const mancha = N.fbm(x / 90, z / 90, 3);
      const v = (0.94 + ((Math.imul(k, 2654435761) >>> 0) % 1000) / 1000 * 0.12) * (0.92 + mancha * 0.16);
      const calido = Math.max(0, N.ruido(x / 260 + 7, z / 260 - 3)) * 0.12;
      let cr = (c.r + calido * 0.5) * v, cg = (c.g + calido * 0.25) * v, cb = c.b * v;
      if (this.verVegetacion) { // en el editor, al pintar vegetación: color de lo que crece encima
        const veg = E.vegetacionEn(esc, x, z);
        if (veg) { const cv = COLOR_VEG[veg.tipo]; const f = 0.25 + 0.6 * veg.d; cr += (cv.r - cr) * f; cg += (cv.g - cg) * f; cb += (cv.b - cb) * f; }
      }
      col.setXYZ(k, cr, cg, cb);
    }
    pos.needsUpdate = true; col.needsUpdate = true;
    if (this.mezcla) actualizarMezcla(this.mezcla, esc, { i0, i1, j0, j1 }, this._rango);
    if (this.pradera) this.pradera.invalidar(i0 === 0 && j0 === 0 && i1 === r - 1 && j1 === r - 1 ? null : reg);
    if (!soloColor) {
      this.terreno.geometry.computeVertexNormals();
      this.terreno.geometry.computeBoundingSphere(); this.terreno.geometry.computeBoundingBox();
      this._actualizarFalda();
    }
  }
  _actualizarFalda() {
    const esc = this.esc, t = esc.terreno, r = t.res, m = t.tam / 2, p = E.paso(esc);
    const fondo = Math.min(this._rango.min, t.agua.activa ? t.agua.nivel : this._rango.min) - Math.max(10, t.tam * 0.02);
    const borde = [];
    for (let i = 0; i < r; i++) borde.push([i, 0]);
    for (let j = 1; j < r; j++) borde.push([r - 1, j]);
    for (let i = r - 2; i >= 0; i--) borde.push([i, r - 1]);
    for (let j = r - 2; j >= 0; j--) borde.push([0, j]);
    const v = [];
    for (let k = 0; k < borde.length - 1; k++) {
      const [ia, ja] = borde[k], [ib, jb] = borde[k + 1];
      const ax = -m + ia * p, az = -m + ja * p, bx = -m + ib * p, bz = -m + jb * p;
      const ha = t.alturas[ja * r + ia], hb = t.alturas[jb * r + ib];
      v.push(ax, ha, az, bx, hb, bz, bx, fondo, bz, ax, ha, az, bx, fondo, bz, ax, fondo, az);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
    this.falda.geometry.dispose(); this.falda.geometry = g;
  }

  construirAgua() {
    const esc = this.esc, a = esc.terreno.agua;
    if (this.agua) { this.gTerreno.remove(this.agua); this.agua.geometry.dispose(); this.agua = null; }
    if (!a.activa) return;
    const B = E.BIOMAS[esc.terreno.bioma] || E.BIOMAS.templado;
    const tam = this.o.editor || esc.terreno.bordes !== 'infinito' ? esc.terreno.tam : esc.terreno.tam * 8;
    const seg = Math.min(200, Math.max(64, Math.round(tam / 12)));
    const geo = new THREE.PlaneGeometry(tam, tam, seg, seg).rotateX(-Math.PI / 2);
    const uvs = geo.attributes.uv, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) uvs.setXY(i, pos.getX(i) / 12, pos.getZ(i) / 12);
    ponerHondura(geo, esc, a.nivel);
    const hondo = new THREE.Color(a.color || B.agua).multiplyScalar(0.5);
    if (!this._matMar) this._matMar = this.crearMaterialAgua({ colorHondo: '#' + hondo.getHexString(), colorSomero: '#4f8f86', hondura: 3 });
    else this._matMar.userData.u.uHondo.value.copy(hondo);
    this.agua = new THREE.Mesh(geo, this._matMar);
    this.agua.position.y = a.nivel; this.agua.receiveShadow = true; this.agua.name = 'agua'; this.agua.renderOrder = 2;
    this.gTerreno.add(this.agua);
  }

  // --- Caminos ---
  muestrasCaminos() {
    if (this._muestrasCaminos) return this._muestrasCaminos;
    this._muestrasCaminos = this.esc.caminos.filter(c => c.puntos.length >= 2).map(c => {
      const mu = E.muestrearCamino(c, 3), lim = c.ancho / 2 + 1.5;
      const celdas = new Map();
      for (const m of mu) { const k = Math.floor(m.x / 10) + ',' + Math.floor(m.z / 10); if (!celdas.has(k)) celdas.set(k, []); celdas.get(k).push(m); }
      return { cerca(x, z) {
        const cx = Math.floor(x / 10), cz = Math.floor(z / 10);
        for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = celdas.get((cx + a) + ',' + (cz + b)); if (l) for (const m of l) if (Math.hypot(m.x - x, m.z - z) < lim) return true; }
        return false;
      } };
    });
    return this._muestrasCaminos;
  }
  construirCaminos() {
    this._muestrasCaminos = null;
    this.pradera.invalidar();
    for (const o of this.gCaminos.children.slice()) { this.gCaminos.remove(o); o.geometry && o.geometry.dispose(); }
    for (const c of this.esc.caminos) this.gCaminos.add(this._mallaCamino(c));
    this.construirBarreras();
  }
  construirBarreras() {
    for (const o of this.gBarreras.children.slice()) { this.gBarreras.remove(o); o.dispose && o.dispose(); }
    const piezas = {};
    for (const c of this.esc.caminos) if (c.puntos.length >= 2 && (c.barreras || []).length) colocarBarreras(this.esc, c, piezas);
    for (const [id, lista] of Object.entries(piezas)) {
      const def = PIEZAS[id]();
      const im = new THREE.InstancedMesh(def.geo, def.mat, lista.length);
      lista.forEach((it, k) => { im.setMatrixAt(k, it.m); if (it.color) im.setColorAt(k, it.color); });
      if (lista.some(it => it.color)) for (let k = 0; k < lista.length; k++) if (!lista[k].color) im.setColorAt(k, BLANCO);
      im.castShadow = def.sombra !== false; im.receiveShadow = true; im.computeBoundingSphere();
      this.gBarreras.add(im);
    }
  }
  _mallaRio(c) {
    const esc = this.esc, mu = E.muestrearCamino(c, 1.5), g = new THREE.BufferGeometry();
    if (mu.length >= 2) {
      const niv = E.nivelesRio(esc, c, mu), cruz = [-1.1, -0.8, -0.55, -0.35, -0.15, 0, 0.15, 0.35, 0.55, 0.8, 1.1], W = cruz.length; // ancha: la orilla la marca el terreno
      const pos = [], uv = [], idx = [], prof = [];
      for (let k = 0; k < mu.length; k++) {
        const a = mu[Math.max(0, k - 1)], b = mu[Math.min(mu.length - 1, k + 1)];
        let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
        for (const u of cruz) { const x = mu[k].x - dz * u * c.ancho, z = mu[k].z + dx * u * c.ancho; pos.push(x, niv[k], z); uv.push((u + 0.5) * c.ancho / 5, mu[k].d / 5); prof.push(Math.abs(u) >= 0.8 ? Math.min(-0.35, niv[k] - E.alturaEn(esc, x, z)) : niv[k] - E.alturaEn(esc, x, z)); } // el borde exterior, siempre fuera del agua
        if (k > 0) for (let q = 0; q < W - 1; q++) { const a0 = (k - 1) * W + q, a1 = a0 + 1, b0 = k * W + q, b1 = b0 + 1; idx.push(a0, a1, b0, a1, b1, b0); }
      }
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('aProf', new THREE.Float32BufferAttribute(prof, 1));
      g.setIndex(idx); g.computeVertexNormals();
    }
    // río abajo: las ondas avanzan en el sentido del camino (v crece con la distancia)
    if (!this._matRio) this._matRio = this.crearMaterialAgua({ flujo: [0.08, -1], colorSomero: '#4d6f5c', colorHondo: '#0c2f36', hondura: 0.7 });
    const m = new THREE.Mesh(g, this._matRio);
    m.receiveShadow = true; m.userData.caminoId = c.id; m.renderOrder = 2;
    return m;
  }
  _mallaCamino(c) {
    const esc = this.esc;
    if (E.esRio(c)) return this._mallaRio(c);
    const mu = E.muestrearCamino(c, 1.5);
    const g = new THREE.BufferGeometry();
    if (mu.length < 2) { const m = new THREE.Mesh(g); m.userData.caminoId = c.id; return m; }
    // Color de la superficie en cada punto (por tramos, con 3 m de transición) y líneas blancas donde hay asfalto o bordes
    const colTipo = tp => { const t = E.TIPOS_CAMINO.find(x => x[0] === tp) || E.TIPOS_CAMINO[0]; return new THREE.Color(E.MATERIALES[t[2]].color); };
    const cache = {}, colDe = tp => cache[tp] || (cache[tp] = colTipo(tp));
    const blanco = new THREE.Color('#f2f2f2');
    const hayLineas = c.bordes || c.tipo === 'asfalto' || (c.tramos || []).some(t => t.tipo === 'asfalto');
    const tex = !!this.suelos;
    // con texturas: dos columnas más por fuera, transparentes, para fundir el borde con el terreno
    const cruz = (hayLineas ? [-0.5, -0.47, -0.462, -0.448, -0.44, -0.2, 0, 0.2, 0.44, 0.448, 0.462, 0.47, 0.5] : [-0.5, -0.42, -0.2, 0, 0.2, 0.42, 0.5]);
    if (tex) { cruz.unshift(-0.56); cruz.push(0.56); }
    const tipos = E.TIPOS_CAMINO.map(t => t[0]);
    // Puentes de este camino: bajo el tablero no se dibuja el camino y a los lados sube en rampa hasta él
    const puentes = E.puentesDeCamino(esc, c);
    const enPuente = d => puentes.some(b => d > b.d0 + 0.4 && d < b.d1 - 0.4);
    // rampa: { alto (tablero), f (0 lejos del puente … 1 en su extremo) } o null
    const rampaEn = d => {
      let r = null;
      for (const b of puentes) {
        const fuera = d < b.d0 ? b.d0 - d : d > b.d1 ? d - b.d1 : 0;
        if (fuera > b.rampa) continue;
        const f = THREE.MathUtils.smoothstep(1 - fuera / b.rampa, 0, 1);
        if (!r || f > r.f) r = { alto: b.alto, f };
      }
      return r;
    };
    const hueco = new Uint8Array(mu.length);
    const pueblos = esc.elementos.filter(e => e.tipo === 'pueblo' && e.props.cfg);
    let pesos = null;
    const pesosEn = d => { const p = new Array(8).fill(0); for (const dd of [d - 1.5, d, d, d + 1.5]) p[Math.max(0, tipos.indexOf(E.superficieEn(c, dd)))] += 0.25; return p; };
    const escTex = escalaCamino(c.tipo);
    const pA = [], pB = [], extra = [];
    let base = null, lineas = false;
    const muestraSup = d => {
      const a = colDe(E.superficieEn(c, d - 1.5)), b = colDe(E.superficieEn(c, d)), cc = colDe(E.superficieEn(c, d + 1.5));
      base = new THREE.Color((a.r + b.r * 2 + cc.r) / 4, (a.g + b.g * 2 + cc.g) / 4, (a.b + b.b * 2 + cc.b) / 4);
      lineas = c.bordes || E.superficieEn(c, d) === 'asfalto';
    };
    const colorEn = u => { const a = Math.abs(u); if (lineas && a > 0.445 && a < 0.465) return blanco; if (a > 0.466) return base.clone().multiplyScalar(0.82); return base; };
    const pos = [], col = [], uv = [], idx = [];
    const W = cruz.length;
    const agua = esc.terreno.agua.activa ? esc.terreno.agua.nivel + 0.3 : -Infinity;
    for (let k = 0; k < mu.length; k++) {
      const a = mu[Math.max(0, k - 1)], b = mu[Math.min(mu.length - 1, k + 1)];
      let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz, nz = dx;
      muestraSup(mu[k].d);
      if (tex) pesos = pesosEn(mu[k].d);
      // bajo un puente o dentro de un pueblo (allí la calzada son las calles del pueblo) no se dibuja
      hueco[k] = (puentes.length && enPuente(mu[k].d)) || pueblos.some(pu => E.dentroTerrenoPueblo(pu, mu[k].x, mu[k].z, 1)) ? 1 : 0;
      const rampa = puentes.length ? rampaEn(mu[k].d) : null;
      for (let q = 0; q < W; q++) {
        const u = cruz[q], x = mu[k].x + nx * u * c.ancho, z = mu[k].z + nz * u * c.ancho;
        let y = Math.max(E.alturaEn(esc, x, z), agua) + (Math.abs(u) > 0.49 ? 0.06 : 0.14);
        if (rampa) y = Math.max(y, THREE.MathUtils.lerp(y, rampa.alto + 0.05, rampa.f));
        pos.push(x, y, z);
        const v = 0.95 + ((k * 7 + q * 13) % 10) / 100;
        if (tex) {
          const au = Math.abs(u), linea = lineas && au > 0.445 && au < 0.465 ? 1 : 0;
          const borde = au > 0.47 ? 0.8 : 1; // arcén algo más oscuro
          col.push(v * borde, v * borde, v * borde);
          pA.push(pesos[0], pesos[1], pesos[2], pesos[3]); pB.push(pesos[4], pesos[5], pesos[6], pesos[7]);
          extra.push(0, linea, au > 0.55 ? 0 : au > 0.5 ? 0.55 : 1);
          uv.push((u + 0.5) * c.ancho / escTex, mu[k].d / escTex);
        } else {
          const cc = colorEn(u);
          col.push(cc.r * v, cc.g * v, cc.b * v);
          uv.push((u + 0.5) * c.ancho / 6, mu[k].d / 6);
        }
      }
      if (k > 0 && !(hueco[k] && hueco[k - 1])) for (let q = 0; q < W - 1; q++) { const a0 = (k - 1) * W + q, a1 = a0 + 1, b0 = k * W + q, b1 = b0 + 1; idx.push(a0, a1, b0, a1, b1, b0); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (tex) {
      g.setAttribute('aPesosA', new THREE.Float32BufferAttribute(pA, 4));
      g.setAttribute('aPesosB', new THREE.Float32BufferAttribute(pB, 4));
      g.setAttribute('aExtra', new THREE.Float32BufferAttribute(extra, 3));
    }
    g.setIndex(idx); g.computeVertexNormals();
    if (tex && !this._matCamino) this._matCamino = materialCamino(this.suelos);
    const m = new THREE.Mesh(g, tex ? this._matCamino : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: c.tipo === 'asfalto' ? 0.75 : 0.95, map: this.texSuelo, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.receiveShadow = true; m.userData.caminoId = c.id;
    return m;
  }

  // --- Elementos ---
  _ctx(el) {
    const self = this;
    return {
      esc: this.esc, editor: this.o.editor, etiquetas: this.o.etiquetas,
      baseY: this._baseY(el),
      cargarModelo: ruta => self.cargarModelo(ruta),
      animar: (obj, anims) => self._animar(obj, anims),
      muestrasCaminos: () => self.muestrasCaminos(),
      vegetacion: this.vegetacion, realistas: this.o.arbolesRealistas !== false,
      materialAgua: opts => self.crearMaterialAgua(opts),
      alCambiar: () => self.o.alCambiar && self.o.alCambiar()
    };
  }
  _baseY(el) { return E.alturaEn(this.esc, el.x, el.z) + (el.y || 0); }
  reconstruirElementos() {
    this.pradera.invalidar();
    for (const id of Array.from(this.objetos.keys())) this.quitarElemento(id);
    for (const el of this.esc.elementos) this.actualizarElemento(el);
  }
  actualizarElemento(el) {
    this.quitarElemento(el.id);
    if (el.tipo === 'puente' && this.esc) setTimeout(() => this.construirCaminos(), 0); // el camino sube al tablero
    const fn = DIBUJOS[el.tipo];
    const g = new THREE.Group();
    g.userData.elId = el.id;
    if (fn) { try { g.add(fn(el, this._ctx(el))); } catch (e) { console.error('Error dibujando', el, e); g.add(marcadorFalta('Error: ' + el.tipo)); } }
    else g.add(marcadorFalta('Tipo sin dibujo: ' + el.tipo));
    this.colocar(el, g);
    this.gElementos.add(g);
    this.objetos.set(el.id, g);
    // Contorno de las áreas
    const def = E.TIPOS[el.tipo];
    if (def && def.forma === 'area' && (this.o.editor || this.o.mostrarAreas)) {
      const col = (g.children[0] && g.children[0].userData.colorArea) || COLOR_AREA[el.tipo] || '#ffffff';
      const aro = this._aro(el.x, el.z, el.props.radio, col);
      aro.userData.elId = el.id; this.gAreas.add(aro);
      g.userData.aro = aro;
    }
    return g;
  }
  colocar(el, g) {
    g = g || this.objetos.get(el.id);
    if (!g) return;
    const def = E.TIPOS[el.tipo] || {};
    g.position.set(el.x, this._baseY(el), el.z);
    const area = def.forma === 'area';
    g.rotation.set(0, area ? 0 : (el.rotY || 0) * DEG, 0);
    g.scale.setScalar(area ? 1 : (el.escala || 1));
    g.traverse(o => { if (o.userData.alColocar) o.userData.alColocar(); });
  }
  // Pueblos completos: se construyen al acercarse la cámara (a menos de 900 m) y se quitan al alejarse (1200 m);
  // mientras tanto se ve la maqueta. Uno por vuelta, para no congelar la imagen.
  _pueblosCerca(camara, dt) {
    this._tPueblos = (this._tPueblos || 0) + dt;
    if (this._tPueblos < 0.4 || !this.esc) return;
    this._tPueblos = 0;
    this.pueblosVivos = this.pueblosVivos || new Map();
    const activos = this.o.pueblosReales !== false;
    const cp = camara.position;
    let construido = false;
    for (const el of this.esc.elementos) {
      if (el.tipo !== 'pueblo' || !el.props.cfg) continue;
      const d = Math.hypot(cp.x - el.x, cp.y - E.alturaEn(this.esc, el.x, el.z), cp.z - el.z);
      let vivo = this.pueblosVivos.get(el.id);
      if (vivo && (!activos || d > 1200)) { this._quitarPueblo(el.id); continue; }
      // si se ha movido un edificio con solar (la iglesia…) dentro del pueblo, se rehace
      if (vivo && vivo.firmaReservas != null && reservasDePueblo(this.esc, el, E.dentroTerrenoPueblo).firma !== vivo.firmaReservas && !construido) { this._quitarPueblo(el.id); vivo = null; }
      if (vivo || !activos || d > 900 || construido) continue;
      if (!window.VillageLib) {
        if (!this._cargandoPueblos) {
          this._cargandoPueblos = true;
          cargarGeneradorPueblos().catch(e => { console.warn(e); this.o.alAviso && this.o.alAviso('No se pudo cargar el generador de pueblos: ' + e.message); this.o.pueblosReales = false; })
            .finally(() => { this._cargandoPueblos = false; });
        }
        return;
      }
      const g = this.objetos.get(el.id);
      if (!g) continue;
      try {
        const rs = reservasDePueblo(this.esc, el, E.dentroTerrenoPueblo);
        const p = construirPueblo(window.VillageLib, el, g, (x, z) => E.alturaEn(this.esc, x, z), THREE, rs.pols);
        p.firmaReservas = rs.firma;
        this.pueblosVivos.set(el.id, p);
        g.traverse(o => { if (o.userData.maqueta) o.visible = false; });
      } catch (e) { console.warn('Pueblo', el.nombre, e); this.pueblosVivos.set(el.id, { destroy() {} }); }
      construido = true;
      if (this.o.alCambiar) this.o.alCambiar();
    }
  }
  _quitarPueblo(id) {
    const p = this.pueblosVivos && this.pueblosVivos.get(id);
    if (!p) return;
    p.destroy(); this.pueblosVivos.delete(id);
    const g = this.objetos.get(id);
    if (g) g.traverse(o => { if (o.userData.maqueta) o.visible = true; });
  }
  setPueblosReales(v) { this.o.pueblosReales = v; if (!v && this.pueblosVivos) for (const id of Array.from(this.pueblosVivos.keys())) this._quitarPueblo(id); }
  quitarElemento(id) {
    this._quitarPueblo(id);
    const g = this.objetos.get(id);
    if (!g) return;
    this.gElementos.remove(g);
    g.traverse(o => { if (o.userData.alQuitar) o.userData.alQuitar(); });
    if (g.userData.aro) { this.gAreas.remove(g.userData.aro); g.userData.aro.geometry.dispose(); }
    this.mezcladores = this.mezcladores.filter(m => { let dentroG = false; m.raiz.traverseAncestors(a => { if (a === g) dentroG = true; }); return !dentroG; });
    g.traverse(o => { if (o.geometry && !Object.values(GEO_ARBOL).includes(o.geometry) && !GEO_ROCA.includes(o.geometry)) o.geometry.dispose(); });
    this.objetos.delete(id);
  }
  _aro(x, z, r, color) {
    const n = Math.max(48, Math.min(256, Math.round(r))), pts = [];
    for (let k = 0; k <= n; k++) { const a = k / n * Math.PI * 2, px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; pts.push(px, E.sueloEn(this.esc, px, pz) + 0.6, pz); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color, dashSize: 4, gapSize: 2.5, transparent: true, opacity: 0.9, depthTest: false }));
    l.computeLineDistances(); l.renderOrder = 5;
    return l;
  }
  setMostrarAreas(v) { this.o.mostrarAreas = v; this.gAreas.visible = v; }

  // --- Modelos .glb ---
  // ruta: 'local:<id>' (importado, en IndexedDB), 'rpg:<ruta>' (biblioteca del Creador RPG) o una URL
  resolverRuta(ruta) {
    if (ruta.startsWith('rpg:')) return (this.esc.enlaces.rpgBase || E.RPG_BASE).replace(/\/?$/, '/') + ruta.slice(4);
    if (!/^(https?:|blob:|data:|local:|\/)/i.test(ruta)) return (globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + ruta;
    return ruta;
  }
  cargarModelo(ruta) {
    const clave = ruta.startsWith('local:') ? ruta : this.resolverRuta(ruta);
    if (this.modelos.has(clave)) return this.modelos.get(clave);
    const pr = (async () => {
      try {
        this._cargando = (this._cargando || 0) + 1; this.o.alCargar && this.o.alCargar(this._cargando);
        let gltf;
        if (ruta.startsWith('local:')) {
          const buf = this.o.cargarModeloLocal ? await this.o.cargarModeloLocal(ruta.slice(6)) : null;
          if (!buf) throw new Error('Modelo local no encontrado: ' + ruta);
          gltf = await this.loader.parseAsync(buf, '');
        } else gltf = await this.loader.loadAsync(clave);
        return { escena: gltf.scene, animaciones: gltf.animations || [] };
      } catch (e) {
        console.warn('No se pudo cargar el modelo', ruta, e);
        this.modelos.delete(clave);
        return null;
      } finally { this._cargando--; this.o.alCargar && this.o.alCargar(this._cargando); }
    })();
    this.modelos.set(clave, pr);
    return pr;
  }
  _animar(obj, anims) {
    if (this.o.editor && !this.o.animarEnEditor) return;
    const mx = new THREE.AnimationMixer(obj);
    const clip = anims.find(a => /idle|reposo|espera|stand/i.test(a.name)) || anims[0];
    const accion = mx.clipAction(clip); accion.play(); accion.time = Math.random() * clip.duration;
    mx.raiz = obj;
    this.mezcladores.push(mx);
  }
  actualizar(dt, camara) {
    this.reloj += dt;
    if (camara) { this.vegetacion.actualizar(camara, dt); this.pradera.actualizar(camara, dt); this._pueblosCerca(camara, dt); }
    this.tiempoAgua.value += dt;
    // reflejo del cielo en el agua: se rehace al cambiar la hora (como mucho cada 1,5 s)
    if (this.matsAgua.length && this._entornoPendiente && this.reloj - (this._tEntorno || -9) > 1.5) {
      this._entornoPendiente = false; this._tEntorno = this.reloj;
      const tex = this.entornoAgua.actualizar(this.cielo, this.scene.fog.color);
      for (const m of this.matsAgua) { if (!m.envMap) m.needsUpdate = true; m.envMap = tex; }
    }
    if (this.cielo.material.uniforms.time) this.cielo.material.uniforms.time.value = this.reloj;
    for (const m of this.mezcladores) m.update(dt);
    this.gElementos.traverse(o => { if (o.userData.girar) o.rotation.y += dt * 2; });
  }

  // --- Consultas ---
  // Punto del terreno bajo un rayo (marcha a lo largo del rayo sobre el mapa de alturas)
  rayoTerreno(rayo, conAgua) {
    const esc = this.esc;
    if (!esc) return null;
    const o = rayo.origin, d = rayo.direction;
    const pasoR = Math.max(0.5, E.paso(esc) * 0.5), max = esc.terreno.tam * 3;
    const suelo = (x, z) => conAgua ? E.sueloEn(esc, x, z) : E.alturaEn(esc, x, z);
    let tPrev = 0, prevSobre = o.y - suelo(o.x, o.z);
    if (prevSobre < 0) return null;
    // Avance con paso que crece con la distancia
    for (let t = pasoR; t < max; t += pasoR * (1 + t / 400)) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const m = esc.terreno.tam / 2;
      if (Math.abs(x) > m * 1.5 || Math.abs(z) > m * 1.5) { if (d.y >= 0) return null; continue; }
      const sobre = y - suelo(x, z);
      if (sobre < 0 && E.dentro(esc, x, z)) {
        let a = tPrev, b = t;
        for (let k = 0; k < 18; k++) { const c = (a + b) / 2; const yy = o.y + d.y * c, xx = o.x + d.x * c, zz = o.z + d.z * c; if (yy - suelo(xx, zz) > 0) a = c; else b = c; }
        const tt = (a + b) / 2;
        return new THREE.Vector3(o.x + d.x * tt, o.y + d.y * tt, o.z + d.z * tt);
      }
      tPrev = t; prevSobre = sobre;
    }
    return null;
  }
  // Elemento bajo un rayo (devuelve su id)
  rayoElemento(raycaster) {
    const hits = raycaster.intersectObjects(this.gElementos.children, true);
    for (const h of hits) {
      if (h.object.isSprite) continue;
      let o = h.object;
      while (o && !o.userData.elId) o = o.parent;
      if (o) return { id: o.userData.elId, punto: h.point, dist: h.distance };
    }
    return null;
  }
}
