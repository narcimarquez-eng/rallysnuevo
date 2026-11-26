// Descarga y adapta la versión más reciente de narcimarquez-eng/Hacer-coches-
// (rama ccr-b02f9bfd-g5ar6l: carrocería lofted por secciones, piezas de Blender y "Aleatorio realista")
// a vendor/hacer-coches/motor-coches.js y vendor/hacer-coches/car_parts.q.glb.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const DIR_DESTINO = path.join(RAIZ, 'vendor', 'hacer-coches');
const DESTINO_JS = path.join(DIR_DESTINO, 'motor-coches.js');
const DESTINO_GLB = path.join(DIR_DESTINO, 'car_parts.q.glb');

const RAMA = 'ccr-b02f9bfd-g5ar6l';
const BASE_RAW = `https://raw.githubusercontent.com/narcimarquez-eng/Hacer-coches-/${RAMA}/`;
const URL_HTML = BASE_RAW + 'Parametric%20Car%203D%20Studio%20(2).html';
const URL_GLB = BASE_RAW + 'blender/car_parts.q.glb';

function extraerEntre(texto, inicio, fin, incluirFin = false) {
  const i0 = texto.indexOf(inicio);
  if (i0 < 0) throw new Error('No se encontró marcador de inicio: ' + inicio);
  const i1 = texto.indexOf(fin, i0);
  if (i1 < 0) throw new Error('No se encontró marcador de fin: ' + fin);
  return texto.slice(i0, incluirFin ? i1 + fin.length : i1);
}

async function main() {
  await fs.mkdir(DIR_DESTINO, { recursive: true });

  console.log('Descargando piezas Blender (car_parts.q.glb)...');
  const resGlb = await fetch(URL_GLB);
  if (!resGlb.ok) throw new Error(`HTTP ${resGlb.status} en ${URL_GLB}`);
  const bufGlb = Buffer.from(await resGlb.arrayBuffer());
  await fs.writeFile(DESTINO_GLB, bufGlb);
  console.log(`  ✓ vendor/hacer-coches/car_parts.q.glb (${(bufGlb.length / 1048576).toFixed(2)} MB)`);

  console.log(`Descargando Parametric Car 3D Studio (2).html (${RAMA})...`);
  const resHtml = await fetch(URL_HTML);
  if (!resHtml.ok) throw new Error(`HTTP ${resHtml.status} en ${URL_HTML}`);
  const html = await resHtml.text();

  // 1. Bloque principal: desde const CONFIG hasta antes de const car = new THREE.Group();
  let bloquePrincipal = extraerEntre(html, 'const CONFIG = {', '\nconst car = new THREE.Group();');

  // Reemplazar loadParts() para cargar car_parts.q.glb desde archivo local (no <script id="carPartsGlb"> incrustado)
  const loadPartsInicio = 'async function loadParts(){';
  const loadPartsFin = '\nfunction partMaterial(role){';
  const lp0 = bloquePrincipal.indexOf(loadPartsInicio);
  const lp1 = bloquePrincipal.indexOf(loadPartsFin, lp0);
  if (lp0 < 0 || lp1 < 0) throw new Error('No se pudo localizar loadParts()');

  const nuevoLoadParts = `let promesaPiezas = null;
export function cargarPiezasHacerCoches(url = 'vendor/hacer-coches/car_parts.q.glb') {
  if (promesaPiezas) return promesaPiezas;
  promesaPiezas = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    for (const root of gltf.scene.children) {
      if (!root.name.startsWith('part_')) continue;
      root.traverse(o => {
        if (o.isMesh) {
          o.userData.role = o.material.name;
          o.userData.sharedGeometry = true;
        }
      });
      PARTS.set(root.name.slice(5), root);
    }
    return PARTS;
  })().catch(err => {
    promesaPiezas = null;
    throw err;
  });
  return promesaPiezas;
}`;
  bloquePrincipal = bloquePrincipal.slice(0, lp0) + nuevoLoadParts + bloquePrincipal.slice(lp1);

  // Limpiar referencias a luces de showroom en updateMaterials()
  bloquePrincipal = bloquePrincipal
    .replace(/wheelLightL\.intensity\s*=\s*C\.wheelLight;\s*/g, '')
    .replace(/wheelLightR\.intensity\s*=\s*C\.wheelLight;\s*/g, '');

  // 2. Helpers de mezcla y cristales
  const bloqueHelpers = extraerEntre(
    html,
    'function deepMerge(target, src){',
    '\nfunction buildShowroomCar(presetKey, posX){'
  );
  const bloqueGlass = extraerEntre(
    html,
    'function applyPresetGlass(model, presetKey){',
    '\nconst raycaster = new THREE.Raycaster();'
  );

  // 3. Generador "Aleatorio realista" (REALISM + isPlausibleCar + wheelsCovered + randomize + pickPaint)
  const bloqueAleatorio = extraerEntre(
    html,
    'const REALISM = {',
    '\n// DISEÑOS ESTRAMBÓTICOS:'
  );

  const modulo = `// Motor paramétrico extraído automáticamente de narcimarquez-eng/Hacer-coches- (${RAMA}).
// Incluye carrocerías lofted por secciones, piezas Blender (car_parts.q.glb) y "Aleatorio realista".
// No editar a mano: regenerar con \`npm run actualizar-coches\`.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const lockSnapshot = () => ({});
const lockRestore = () => {};
const syncUI = () => {};
const markDirty = () => {};

${bloquePrincipal}

${bloqueHelpers}

${bloqueGlass}

${bloqueAleatorio}

let materialesIniciados = false;
function asegurarMateriales() {
  if (materialesIniciados) return;
  createMaterials();
  materialesIniciados = true;
}

function armarYClonarCoche(nombreGrupo, modeloId, extraInfo = {}) {
  const P = derive(PRESETS[CONFIG.model]);
  const grupo = new THREE.Group();
  grupo.name = nombreGrupo;

  const parts = [
    buildBody(P),
    buildCabin(P),
    buildFrontDetails(P),
    buildRearDetails(P),
    buildSideDetails(P),
    buildAccessories(P)
  ];
  const interior = buildInterior(P);
  applyShapeField([...parts, interior], P);
  for (const part of parts) {
    part.rotation.x = CONFIG.stance.rake || 0;
    grupo.add(part);
  }
  grupo.add(interior);

  const wg = buildWheels(P);
  grupo.add(wg.group);

  // Clonar materiales propios para que cada coche conserve sus colores/acabados
  const matClonados = new Map();
  grupo.traverse(o => {
    if (o.isMesh && o.material) {
      if (Array.isArray(o.material)) {
        o.material = o.material.map(m => {
          if (!matClonados.has(m)) matClonados.set(m, m.clone());
          return matClonados.get(m);
        });
      } else {
        if (!matClonados.has(o.material)) matClonados.set(o.material, o.material.clone());
        o.material = matClonados.get(o.material);
      }
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    grupo,
    P,
    modelo: modeloId,
    etiquetaModelo: PRESETS[modeloId]?.label || modeloId,
    colorPintura: CONFIG.paint.color,
    tipoPintura: CONFIG.paint.type,
    taillightMat: matClonados.get(MAT.taillight) || null,
    ...extraInfo
  };
}

export { PRESETS, FIVE_CARS };

/** Construye un coche usando exactamente el generador "Aleatorio realista" de Hacer-coches-. */
export function construirCocheAleatorioRealista() {
  asegurarMateriales();
  const originalConfig = JSON.parse(JSON.stringify(CONFIG));
  try {
    randomize();
    updateMaterials();
    return armarYClonarCoche('HacerCoches_AleatorioRealista', CONFIG.model);
  } finally {
    for (const k of Object.keys(originalConfig)) {
      CONFIG[k] = originalConfig[k];
    }
  }
}

/** Construye uno de los 6 coches prediseñados de FIVE_CARS en Hacer-coches-. */
export function construirCocheHacerCoches(presetKey) {
  const p = FIVE_CARS[presetKey];
  if (!p) throw new Error('Preset desconocido de Hacer-coches-: ' + presetKey);

  asegurarMateriales();
  const originalConfig = JSON.parse(JSON.stringify(CONFIG));
  try {
    Object.assign(CONFIG, presetConfig(presetKey));
    applyPresetGlass(p.model, presetKey);
    updateMaterials();
    return armarYClonarCoche('HacerCoches_' + presetKey, CONFIG.model, { preset: p });
  } finally {
    for (const k of Object.keys(originalConfig)) {
      CONFIG[k] = originalConfig[k];
    }
  }
}
`;

  await fs.writeFile(DESTINO_JS, modulo, 'utf8');
  console.log(`  ✓ vendor/hacer-coches/motor-coches.js (${Math.round(modulo.length / 1024)} KB)`);
}

main().catch(err => {
  console.error('Error actualizando Hacer-coches-:', err);
  process.exit(1);
});
