// Descarga y adapta el motor paramétrico de coches de narcimarquez-eng/Hacer-coches-
// a un módulo ES limpio en vendor/hacer-coches/motor-coches.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const DESTINO = path.join(RAIZ, 'vendor', 'hacer-coches', 'motor-coches.js');
const URL_FUENTE = 'https://raw.githubusercontent.com/narcimarquez-eng/Hacer-coches-/main/parametric_car.html';

async function main() {
  console.log('Descargando motor de coches desde narcimarquez-eng/Hacer-coches-...');
  const res = await fetch(URL_FUENTE);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${URL_FUENTE}`);
  const html = await res.text();

  const marcaInicio = '   1. CONFIG';
  const marcaFin = '   7. CAR_BUILDER & SHOWROOM MULTI-COCHE';
  const i0 = html.indexOf(marcaInicio);
  const i1 = html.indexOf(marcaFin);
  if (i0 < 0 || i1 <= i0) {
    throw new Error('No se encontraron los marcadores esperados en parametric_car.html');
  }

  // Retroceder al inicio del comentario de cabecera de la sección 1
  const inicioComentario = html.lastIndexOf('/*', i0);
  const finComentario = html.lastIndexOf('/*', i1);
  let bloque = html.slice(inicioComentario, finComentario);

  // Asegurar que no dependa de las luces de showroom de parametric_car.html
  bloque = bloque.replace(/wheelLightL\.intensity\s*=\s*C\.wheelLight;\s*/g, '');
  bloque = bloque.replace(/wheelLightR\.intensity\s*=\s*C\.wheelLight;\s*/g, '');

  const modulo = `// Motor paramétrico extraído automáticamente de narcimarquez-eng/Hacer-coches- (parametric_car.html).
// No editar a mano: regenerar con \`npm run actualizar-coches\`.
import * as THREE from 'three';

${bloque}

function applyPresetGlass(model) {
  const p = PRESETS[model];
  if (!p) return;
  CONFIG.glass.frontZ = p.cabinFrontZ;
  CONFIG.glass.rearZ = p.cabinRearZ;
  CONFIG.glass.roofFrontZ = p.roofFrontZ;
  CONFIG.glass.roofRearZ = p.roofRearZ;
}

let materialesIniciados = false;
function asegurarMateriales() {
  if (materialesIniciados) return;
  createMaterials();
  materialesIniciados = true;
}

export { PRESETS, CAR_COLLECTION };

/**
 * Construye cualquiera de los 5 coches del garaje de Hacer-coches- ('phantom', 'supercar', 'offroad', 'gt', 'urban')
 * con materiales propios clonados, sin contaminar la configuración base.
 */
export function construirCocheHacerCoches(presetKey) {
  const p = CAR_COLLECTION[presetKey];
  if (!p) throw new Error('Preset desconocido de Hacer-coches-: ' + presetKey);

  asegurarMateriales();
  const originalConfig = JSON.parse(JSON.stringify(CONFIG));

  try {
    for (const k of Object.keys(p.config)) {
      if (p.config[k] && typeof p.config[k] === 'object' && !Array.isArray(p.config[k])) {
        for (const subK of Object.keys(p.config[k])) {
          if (
            p.config[k][subK] &&
            typeof p.config[k][subK] === 'object' &&
            !Array.isArray(p.config[k][subK]) &&
            CONFIG[k][subK]
          ) {
            Object.assign(CONFIG[k][subK], p.config[k][subK]);
          } else {
            CONFIG[k][subK] = p.config[k][subK];
          }
        }
      } else {
        CONFIG[k] = p.config[k];
      }
    }
    CONFIG.model = p.model;
    applyPresetGlass(p.model);
    updateMaterials();

    const P = derive(PRESETS[CONFIG.model]);
    const grupo = new THREE.Group();
    grupo.name = 'HacerCoches_' + presetKey;

    grupo.add(buildBody(P));
    grupo.add(buildCabin(P));
    grupo.add(buildFrontDetails(P));
    grupo.add(buildRearDetails(P));
    grupo.add(buildSideDetails(P));
    grupo.add(buildInterior(P));
    const wg = buildWheels(P);
    grupo.add(wg.group);

    // Clonar materiales para que cada coche conserve sus propios colores/texturas
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
      preset: p,
      taillightMat: matClonados.get(MAT.taillight) || null
    };
  } finally {
    for (const k of Object.keys(originalConfig)) {
      CONFIG[k] = originalConfig[k];
    }
  }
}
`;

  await fs.mkdir(path.dirname(DESTINO), { recursive: true });
  await fs.writeFile(DESTINO, modulo, 'utf8');
  console.log(`✓ Generado ${path.relative(RAIZ, DESTINO)} (${Math.round(modulo.length / 1024)} KB)`);
}

main().catch(err => {
  console.error('Error extrayendo Hacer-coches-:', err);
  process.exit(1);
});
