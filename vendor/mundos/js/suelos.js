// Texturas reales del suelo y de los caminos, en una sola textura por capas (DataArrayTexture):
//   - 12 texturas del atlas de terreno de ambientCG (assets/terreno/atlas.jpg, CC0), una por material del suelo
//   - fotos de la biblioteca del Creador de Pueblos (assets/texturas/suelo/…) para caminos y baldosa
// El terreno mezcla las capas con un «mapa de mezcla» (pesos por punto de la rejilla, filtrados para que las
// transiciones sean suaves) y los caminos llevan su capa por vértice. Se repiten en metros y se muestrean dos veces
// a escalas distintas para que no se note la repetición.
import * as THREE from 'three';

const E = window.Escenario;

// Fuentes de cada capa: { atlas: celda } o { foto: 'grupo/tNN' }
export const CAPAS = [
  { atlas: 0 },   // 0 hierba
  { atlas: 37 },  // 1 hierba seca
  { atlas: 34 },  // 2 tierra
  { atlas: 57 },  // 3 roca
  { atlas: 41 },  // 4 arena
  { atlas: 90 },  // 5 nieve
  { atlas: 79 },  // 6 asfalto
  { atlas: 25 },  // 7 barro
  { atlas: 72 },  // 8 grava
  { atlas: 10 },  // 9 musgo
  { atlas: 63 },  // 10 ceniza
  { atlas: 94 },  // 11 hielo
  { foto: 'suelo/t02' }, // 12 baldosa / adoquín
  { foto: 'suelo/t03' }, // 13 camino de grava (tierra con grava)
  { foto: 'suelo/t07' }, // 14 camino de tierra (tierra con piedras)
  { foto: 'suelo/t08' }  // 15 empedrado
];
// Material del suelo (id de Escenario.MATERIALES) → capa
export const CAPA_MATERIAL = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11, 13: 12 };
// Tipo de camino → capa y metros que ocupa cada repetición de la textura
export const CAPA_CAMINO = { tierra: [14, 4], grava: [13, 3.2], asfalto: [6, 3], piedra: [15, 3.5], arena: [4, 4], barro: [7, 4], nieve: [5, 4], adoquin: [12, 2.5] };
const ESCALA_TERRENO = 4; // m por repetición en el terreno

function cargarImagen(src) {
  return new Promise((ok, mal) => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => mal(new Error('No se pudo cargar ' + src)); im.src = src; });
}

let promesa = null;
// Carga las texturas una vez: Promise<{ capas: DataArrayTexture, atlasCelda(i) → CanvasTexture }>
export function cargarSuelos(tam) {
  if (promesa) return promesa;
  tam = tam || 512;
  promesa = (async () => {
    const atlas = await cargarImagen((globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'assets/terreno/atlas.jpg');
    const fotos = {};
    await Promise.all(CAPAS.filter(c => c.foto).map(async c => { fotos[c.foto] = await cargarImagen((globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'assets/texturas/' + c.foto + '.jpg'); }));
    const cv = document.createElement('canvas'); cv.width = cv.height = tam;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    const datos = new Uint8Array(tam * tam * 4 * CAPAS.length);
    const celda = atlas.width / 10;
    CAPAS.forEach((c, i) => {
      ctx.clearRect(0, 0, tam, tam);
      if (c.atlas != null) ctx.drawImage(atlas, (c.atlas % 10) * celda, Math.floor(c.atlas / 10) * celda, celda, celda, 0, 0, tam, tam);
      else ctx.drawImage(fotos[c.foto], 0, 0, tam, tam);
      datos.set(ctx.getImageData(0, 0, tam, tam).data, i * tam * tam * 4);
    });
    const tex = new THREE.DataArrayTexture(datos, tam, tam, CAPAS.length);
    tex.format = THREE.RGBAFormat; tex.type = THREE.UnsignedByteType;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = true; tex.anisotropy = 4;
    // Sin espacio de color sRGB en la textura (algunas gráficas de móvil no generan mipmaps de capas sRGB):
    // los colores se pasan a lineal en el shader
    tex.colorSpace = THREE.NoColorSpace;
    tex.needsUpdate = true;
    const cacheCelda = {};
    const atlasCelda = i => {
      if (cacheCelda[i]) return cacheCelda[i];
      const c2 = document.createElement('canvas'); c2.width = c2.height = 256;
      c2.getContext('2d').drawImage(atlas, (i % 10) * celda, Math.floor(i / 10) * celda, celda, celda, 0, 0, 256, 256);
      const t = new THREE.CanvasTexture(c2); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return (cacheCelda[i] = t);
    };
    return { capas: tex, atlasCelda };
  })();
  promesa.catch(e => { console.warn('Texturas del suelo:', e); promesa = null; });
  return promesa;
}

// Trozo de GLSL común: muestra una capa dos veces a escalas distintas (rompe la repetición)
// textureGrad con derivadas calculadas fuera de los bucles: dentro de un «if» las derivadas implícitas no están
// definidas y algunas gráficas de móvil fallan.
const GLSL_CAPA = /* glsl */`
  uniform highp sampler2DArray uCapas;
  vec3 aLineal(vec3 c) { return pow(c, vec3(2.2)); }
  vec3 muestraCapa(float capa, vec2 uv, vec2 dx, vec2 dy) {
    vec3 a = textureGrad(uCapas, vec3(uv, capa), dx, dy).rgb;
    mat2 giro = mat2(0.8, -0.6, 0.6, 0.8);
    vec2 uv2 = giro * uv * 0.37 + vec2(0.31, 0.17);
    vec3 b = textureGrad(uCapas, vec3(uv2, capa), giro * dx * 0.37, giro * dy * 0.37).rgb;
    return aLineal(mix(a, b, 0.42));
  }
  float ruidoSuelo(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }`;

// --- Terreno: mapa de mezcla (4 capas RGBA = 16 pesos por punto de la rejilla) ---
export function crearMezcla(res) {
  const datos = new Uint8Array(res * res * 4 * 4);
  const t = new THREE.DataArrayTexture(datos, res, res, 4);
  t.format = THREE.RGBAFormat; t.type = THREE.UnsignedByteType;
  t.minFilter = t.magFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}
// Escribe en la mezcla el material de cada punto de la región (uno de 16 canales a 255)
export function actualizarMezcla(mezcla, esc, reg, rango) {
  const r = esc.terreno.res, d = mezcla.image.data, capa = r * r * 4;
  for (let j = reg.j0; j <= reg.j1; j++) for (let i = reg.i0; i <= reg.i1; i++) {
    const k = j * r + i;
    for (let c = 0; c < 4; c++) { const o = c * capa + k * 4; d[o] = d[o + 1] = d[o + 2] = d[o + 3] = 0; }
    const ci = CAPA_MATERIAL[E.materialEn(esc, i, j, rango)] ?? 0;
    d[(ci >> 2) * capa + k * 4 + (ci & 3)] = 255;
  }
  mezcla.needsUpdate = true;
}

export function materialTerreno(suelos, mezcla, esc) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 });
  const u = { uCapas: { value: suelos.capas }, uMezcla: { value: mezcla }, uTam: { value: esc.terreno.tam }, uRes: { value: esc.terreno.res }, uEscala: { value: ESCALA_TERRENO } };
  m.userData.u = u;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'varying vec3 vPosMundo;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vPosMundo = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `varying vec3 vPosMundo;
      uniform highp sampler2DArray uMezcla;
      uniform float uTam, uRes, uEscala;
      ${GLSL_CAPA}
    ` + sh.fragmentShader.replace('#include <map_fragment>', `
      {
        // borde de las manchas un poco irregular para que no se vea la rejilla
        vec2 q = vPosMundo.xz;
        vec2 ruido = vec2(ruidoSuelo(q * 0.21), ruidoSuelo(q * 0.21 + 17.3)) - 0.5;
        vec2 su = (q + uTam * 0.5) / uTam * (uRes - 1.0) / uRes + 0.5 / uRes + ruido * 1.4 / uRes;
        vec4 w0 = texture(uMezcla, vec3(su, 0.0)), w1 = texture(uMezcla, vec3(su, 1.0)), w2 = texture(uMezcla, vec3(su, 2.0)), w3 = texture(uMezcla, vec3(su, 3.0));
        float pesos[16] = float[16](w0.r, w0.g, w0.b, w0.a, w1.r, w1.g, w1.b, w1.a, w2.r, w2.g, w2.b, w2.a, w3.r, w3.g, w3.b, w3.a);
        vec2 tuv = q / uEscala;
        vec2 tdx = dFdx(tuv), tdy = dFdy(tuv);
        vec3 acc = vec3(0.0); float tot = 0.0;
        for (int i = 0; i < 16; i++) { float w = pesos[i]; if (w > 0.01) { w = w * w; acc += muestraCapa(float(i), tuv, tdx, tdy) * w; tot += w; } }
        diffuseColor.rgb *= tot > 0.0 ? acc / tot : vec3(0.5);
      }`);
  };
  m.customProgramCacheKey = () => 'terreno-capas-2';
  return m;
}

// --- Caminos: pesos de cada superficie por vértice (aPesosA/aPesosB, en el orden de Escenario.TIPOS_CAMINO, así la
// transición entre tramos se interpola bien), aExtra.y = línea blanca, aExtra.z = opacidad (borde difuminado)
export function materialCamino(suelos) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, alphaHash: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const capas = E.TIPOS_CAMINO.map(t => capaCamino(t[0])).concat([0]).slice(0, 8);
  const u = { uCapas: { value: suelos.capas }, uCapaTipo: { value: capas } };
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = `attribute vec4 aPesosA; attribute vec4 aPesosB; attribute vec3 aExtra; varying vec4 vPa; varying vec4 vPb; varying vec3 vExtra; varying vec2 vUvCam;
    ` + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\n vPa = aPesosA; vPb = aPesosB; vExtra = aExtra; vUvCam = uv;');
    sh.fragmentShader = `varying vec4 vPa; varying vec4 vPb; varying vec3 vExtra; varying vec2 vUvCam;
      uniform float uCapaTipo[8];
      ${GLSL_CAPA}
    ` + sh.fragmentShader
      .replace('#include <map_fragment>', `
        {
          float pw[8] = float[8](vPa.x, vPa.y, vPa.z, vPa.w, vPb.x, vPb.y, vPb.z, vPb.w);
          vec3 acc = vec3(0.0); float tot = 0.0;
          vec2 cdx = dFdx(vUvCam), cdy = dFdy(vUvCam);
          for (int i = 0; i < 8; i++) { if (pw[i] > 0.01) { acc += muestraCapa(uCapaTipo[i], vUvCam, cdx, cdy) * pw[i]; tot += pw[i]; } }
          diffuseColor.rgb *= tot > 0.0 ? acc / tot : vec3(0.5);
          diffuseColor.a *= vExtra.z;
        }`)
      .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86), clamp(vExtra.y, 0.0, 1.0));');
  };
  m.customProgramCacheKey = () => 'camino-capas-2';
  return m;
}
export const escalaCamino = tipo => (CAPA_CAMINO[tipo] || CAPA_CAMINO.tierra)[1];
export const capaCamino = tipo => (CAPA_CAMINO[tipo] || CAPA_CAMINO.tierra)[0];

// UV en metros para formas básicas (proyección según la normal de cada cara): la textura no se estira con el tamaño
export function uvEnMetros(geo, metros) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  if (!p || !n) return geo;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let a, b;
    if (ay >= ax && ay >= az) { a = p.getX(i); b = p.getZ(i); } else if (ax >= az) { a = p.getZ(i); b = p.getY(i); } else { a = p.getX(i); b = p.getY(i); }
    uv[i * 2] = a / metros; uv[i * 2 + 1] = b / metros;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}
