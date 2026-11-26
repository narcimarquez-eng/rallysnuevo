// Rocas del campo con fotos reales de roca (assets/rocas/, recortadas del atlas del terreno: ambientCG, CC0)
// y formas variadas hechas por código: canto rodado, losa, bloque fracturado, aguja y roca partida.
// La textura se proyecta desde los tres ejes del mundo (sin costuras ni estiramientos), con su mapa de relieve,
// y una segunda pasada a otra escala rompe la repetición. Cada roca puede llevar su tinte (color de instancia).
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const FORMAS_ROCA = [['variada', 'Variadas'], ['canto', 'Canto rodado'], ['losa', 'Losa'], ['bloque', 'Bloque fracturado'], ['aguja', 'Aguja'], ['partida', 'Roca partida']];
export const PIEDRAS = [['mezcla', 'Mezcla'], ['granito', 'Granito con líquenes'], ['gris', 'Caliza gris'], ['musgo', 'Con musgo'], ['estratos', 'En estratos'], ['ocre', 'Arenisca ocre'], ['oscura', 'Pizarra oscura']];
const FORMAS = ['canto', 'losa', 'bloque', 'aguja', 'partida'];
// las fotos tienen distinto brillo medio (luminancia lineal 0,10–0,28): se igualan para que ninguna salga negra
const GANANCIA = { granito: 0.95, gris: 1.35, musgo: 1.35, estratos: 1.0, ocre: 1.3, oscura: 1.6 };

// Ruido de valor 3D sencillo (determinista)
function ruido3(semilla) {
  const h = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + semilla * 17.3) * 43758.5453; return s - Math.floor(s); };
  const n = (x, y, z) => {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    let fx = x - ix, fy = y - iy, fz = z - iz;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h(ix, iy, iz), h(ix + 1, iy, iz), fx), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy),
      l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy), fz) * 2 - 1;
  };
  return (x, y, z) => n(x, y, z) * 0.6 + n(x * 2.1, y * 2.1, z * 2.1) * 0.28 + n(x * 4.7, y * 4.7, z * 4.7) * 0.12;
}

const GEOS = {};
// Geometría de una roca de radio ~1, apoyada en y = 0 (con un poco enterrado). variante: 0, 1, 2…
export function geoRocaForma(forma, variante) {
  if (!FORMAS.includes(forma)) forma = FORMAS[variante % FORMAS.length];
  const clave = forma + variante;
  if (GEOS[clave]) return GEOS[clave];
  const sem = variante * 7.31 + FORMAS.indexOf(forma) * 3.17 + 1;
  const N = ruido3(sem);
  let azarS = Math.floor(sem * 1000) + 7;
  const azar = () => { azarS = (azarS * 16807) % 2147483647; return azarS / 2147483647; };
  let g = new THREE.IcosahedronGeometry(1, 5);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position;
  const esc = { canto: [1, 0.72, 0.86], losa: [1.35, 0.32, 1.0], bloque: [1, 0.9, 0.85], aguja: [0.5, 1.9, 0.55], partida: [1.05, 0.8, 0.9] }[forma];
  const amp = { canto: 0.12, losa: 0.08, bloque: 0.16, aguja: 0.14, partida: 0.12 }[forma];
  // planos de fractura: caras planas como de roca rota (los cantos rodados casi no tienen)
  const nPlanos = { canto: 1, losa: 4, bloque: 7, aguja: 5, partida: 4 }[forma];
  const planos = [];
  for (let k = 0; k < nPlanos; k++) {
    const t = azar() * Math.PI * 2, f = Math.acos(azar() * 1.6 - 0.6);
    const n = new THREE.Vector3(Math.sin(f) * Math.cos(t), Math.cos(f), Math.sin(f) * Math.sin(t));
    planos.push({ n, d: forma === 'canto' ? 0.85 : 0.55 + azar() * 0.3, dureza: forma === 'canto' ? 0.5 : 0.92 });
  }
  const v = new THREE.Vector3();
  const grieta = forma === 'partida' ? new THREE.Vector3(Math.cos(sem), 0.15, Math.sin(sem)).normalize() : null;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = 1 + N(v.x * 1.6, v.y * 1.6, v.z * 1.6) * amp * 2.2;
    v.multiplyScalar(r);
    for (const pl of planos) { const d = v.dot(pl.n); if (d > pl.d) v.addScaledVector(pl.n, -(d - pl.d) * pl.dureza); }
    if (grieta) { // la grieta: un surco profundo que parte la roca en dos
      const d = v.dot(grieta), w = 0.09;
      if (Math.abs(d) < w) v.addScaledVector(v.clone().setY(0).normalize(), -0.45 * (1 - Math.abs(d) / w) * Math.max(0, v.y + 0.3));
      v.addScaledVector(grieta, Math.sign(d) * 0.06);
    }
    v.set(v.x * esc[0], v.y * esc[1], v.z * esc[2]);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeBoundingBox();
  const y0 = g.boundingBox.min.y, alto = g.boundingBox.max.y - y0;
  g.translate(0, -y0 - alto * 0.24, 0); // bien enterrada: en las laderas no se queda en el aire
  // aplana lo que queda bajo el suelo para que no asome por las laderas
  for (let i = 0; i < p.count; i++) if (p.getY(i) < -alto * 0.14) p.setY(i, -alto * 0.14 + (p.getY(i) + alto * 0.14) * 0.6);
  g.computeVertexNormals();
  // color por vértice: más oscuro abajo (suciedad y sombra de contacto), algo más claro arriba
  const col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i) / alto;
    const c = Math.min(1.08, 0.58 + Math.min(1, Math.max(0, y + 0.1) * 2.2) * 0.42 + N(p.getX(i) * 3, p.getY(i) * 3, p.getZ(i) * 3) * 0.08);
    col[i * 3] = c; col[i * 3 + 1] = c * 0.98; col[i * 3 + 2] = c * 0.95;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(p.count * 2), 2));
  return (GEOS[clave] = g);
}

const TEX = {}, MATS = {};
function textura(nombre, normal) {
  const k = nombre + (normal ? '_n' : '');
  if (!TEX[k]) {
    const t = new THREE.TextureLoader().load((globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'assets/rocas/' + k + '.jpg');
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    if (!normal) t.colorSpace = THREE.SRGBColorSpace;
    TEX[k] = t;
  }
  return TEX[k];
}

// Material de roca con la foto «piedra» (granito, gris, musgo, estratos, ocre, oscura) proyectada en 3 ejes.
// metrosPorFoto: cuántos metros cubre una repetición de la foto.
// tinte (opcional): color que multiplica la foto (para rocas sueltas; las instanciadas lo llevan por instancia).
export function materialRoca(piedra, metrosPorFoto, tinte) {
  if (!PIEDRAS.some(p => p[0] === piedra) || piedra === 'mezcla') piedra = 'granito';
  const clave = piedra + (metrosPorFoto || 2.2) + (tinte ? '#' + tinte.getHexString() : '');
  if (MATS[clave]) return MATS[clave];
  const m = new THREE.MeshStandardMaterial({
    map: textura(piedra), normalMap: textura(piedra, true), normalScale: new THREE.Vector2(1.1, 1.1),
    vertexColors: true, roughness: 0.93, metalness: 0
  });
  if (tinte) m.color.copy(tinte);
  const esc = { value: 1 / (metrosPorFoto || 2.2) }, gan = { value: GANANCIA[piedra] || 1 };
  m.onBeforeCompile = sh => {
    sh.uniforms.uEscalaRoca = esc; sh.uniforms.uGananciaRoca = gan;
    sh.vertexShader = 'varying vec3 vPosRoca;\nvarying vec3 vNorRoca;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        vec4 pR = vec4(transformed, 1.0);
        vec3 nR = objectNormal;
        #ifdef USE_INSTANCING
          pR = instanceMatrix * pR;
          nR = mat3(instanceMatrix) * nR;
        #endif
        vPosRoca = (modelMatrix * pR).xyz;
        vNorRoca = normalize(mat3(modelMatrix) * nR);
      }`);
    sh.fragmentShader = 'uniform float uEscalaRoca;\nuniform float uGananciaRoca;\nvarying vec3 vPosRoca;\nvarying vec3 vNorRoca;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `
        vec3 nRoca = normalize(vNorRoca);
        vec3 bRoca = pow(abs(nRoca), vec3(4.0)); bRoca /= (bRoca.x + bRoca.y + bRoca.z);
        vec3 pRoca = vPosRoca * uEscalaRoca;
        vec4 cRoca = texture2D(map, pRoca.zy) * bRoca.x + texture2D(map, pRoca.xz) * bRoca.y + texture2D(map, pRoca.xy) * bRoca.z;
        vec3 qRoca = pRoca * 0.21 + 0.37;
        vec4 c2Roca = texture2D(map, qRoca.zy) * bRoca.x + texture2D(map, qRoca.xz) * bRoca.y + texture2D(map, qRoca.xy) * bRoca.z;
        cRoca.rgb *= 0.62 + 0.38 * dot(c2Roca.rgb, vec3(0.333)) / 0.42; // manchas grandes: la foto no se nota repetida
        diffuseColor *= vec4(cRoca.rgb * uGananciaRoca, cRoca.a);`)
      .replace('#include <normal_fragment_maps>', `
        {
          vec3 nx = texture2D(normalMap, pRoca.zy).xyz * 2.0 - 1.0;
          vec3 ny = texture2D(normalMap, pRoca.xz).xyz * 2.0 - 1.0;
          vec3 nz = texture2D(normalMap, pRoca.xy).xyz * 2.0 - 1.0;
          nx = vec3(nx.xy * normalScale + nRoca.zy, abs(nx.z) * nRoca.x);
          ny = vec3(ny.xy * normalScale + nRoca.xz, abs(ny.z) * nRoca.y);
          nz = vec3(nz.xy * normalScale + nRoca.xy, abs(nz.z) * nRoca.z);
          vec3 wRoca = normalize(nx.zyx * bRoca.x + ny.xzy * bRoca.y + nz.xyz * bRoca.z);
          normal = normalize((viewMatrix * vec4(wRoca, 0.0)).xyz);
        }`);
  };
  m.customProgramCacheKey = () => 'roca-triplanar-v1';
  return (MATS[clave] = m);
}

// Piedras que usa un pedregal en modo «mezcla», según su semilla (dos parecidas, como en un mismo terreno)
export function piedrasDe(piedra, semilla) {
  if (piedra && piedra !== 'mezcla') return [piedra];
  const juegos = [['granito', 'gris'], ['gris', 'musgo'], ['granito', 'musgo'], ['estratos', 'gris'], ['ocre', 'estratos'], ['oscura', 'gris']];
  return juegos[Math.abs(semilla | 0) % juegos.length];
}

// Tinte de las rocas a partir del color elegido: el gris por defecto deja la foto tal cual; otro color la tiñe
export function tinteRoca(color) {
  const c = new THREE.Color(color || '#7d7a74');
  const l = c.r * 0.3 + c.g * 0.59 + c.b * 0.11;
  return c.multiplyScalar(1 / Math.max(0.05, l)).lerp(new THREE.Color(1, 1, 1), 0.35);
}
// Forma de cada roca en el modo «variada»: más cantos y bloques, menos agujas
export function formaAzar(t) {
  return t < 0.33 ? 'canto' : t < 0.58 ? 'bloque' : t < 0.74 ? 'losa' : t < 0.9 ? 'partida' : 'aguja';
}
