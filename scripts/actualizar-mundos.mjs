// Descarga y adapta los módulos necesarios de narcimarquez-eng/Mundos- a vendor/mundos/js/.
// Por defecto los assets pesados (.jpg, .png, .glb) se cargan desde GitHub Pages de Mundos-
// (con CORS habilitado); pasa --con-assets para copiarlos también a vendor/mundos/.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');
const DESTINO_JS = path.join(RAIZ, 'vendor', 'mundos', 'js');

const RAMA = 'claude/world-generator-viewer-kk0hn3';
const BASE_RAW = `https://raw.githubusercontent.com/narcimarquez-eng/Mundos-/${RAMA}/`;
const BASE_ASSETS_REMOTA = 'https://narcimarquez-eng.github.io/Mundos-/';

const ARCHIVOS_JS = [
  'escenario-core.js',
  'escena-3d.js',
  'vegetacion.js',
  'pradera.js',
  'pradera-atlas.js',
  'pueblos3d.js',
  'rocas.js',
  'agua.js',
  'suelos.js',
  'texturas-lib.js',
  'casas-glb.js',
  'casa-madera.js',
  'puestos-datos.js',
  'three-puente.js',
  'arboles.js',
  'pueblo-edits.js',
  'village-core.js',
  'catalogo-rpg.js',
  'almacen.js'
];

const conAssets = process.argv.includes('--con-assets');
const PREFIJO_ASSETS = conAssets
  ? `(globalThis.MUNDOS_ASSETS || 'vendor/mundos/')`
  : `(globalThis.MUNDOS_ASSETS || '${BASE_ASSETS_REMOTA}')`;

function adaptarRutas(codigo, nombre) {
  let out = codigo;

  if (nombre === 'pueblos3d.js') {
    // Apunta los scripts del generador de pueblos a vendor/mundos/js/
    out = out.replace(/(['"])js\//g, "$1vendor/mundos/js/");
    return out;
  }

  // No tocar arboles.js ni pradera-atlas.js ni puestos-datos.js ni casa-madera.js ni pueblo-edits.js
  // (arboles.js tiene bloques base64 largos donde podría aparecer texto aleatorio)
  if (['arboles.js', 'pradera-atlas.js', 'puestos-datos.js', 'casa-madera.js', 'pueblo-edits.js', 'three-puente.js', 'catalogo-rpg.js', 'almacen.js', 'escenario-core.js', 'pradera.js'].includes(nombre)) {
    return out;
  }

  // En suelos.js hay que añadir crossOrigin = 'anonymous' para que DataArrayTexture pueda leer pixels con getImageData
  if (nombre === 'suelos.js') {
    out = out.replace(
      'const im = new Image();',
      "const im = new Image(); im.crossOrigin = 'anonymous';"
    );
  }

  // En escena-3d.js, resolverRuta resuelve rutas relativas de GLB contra la base de assets de Mundos-
  if (nombre === 'escena-3d.js') {
    out = out.replace(
      "if (ruta.startsWith('rpg:')) return (this.esc.enlaces.rpgBase || E.RPG_BASE).replace(/\\/?$/, '/') + ruta.slice(4);\n    return ruta;",
      `if (ruta.startsWith('rpg:')) return (this.esc.enlaces.rpgBase || E.RPG_BASE).replace(/\\/?$/, '/') + ruta.slice(4);\n    if (!/^(https?:|blob:|data:|local:|\\/)/i.test(ruta)) return ${PREFIJO_ASSETS} + ruta;\n    return ruta;`
    );
  }

  // En vegetacion.js, def.archivo es relativo ('glb/arboles/...')
  if (nombre === 'vegetacion.js') {
    out = out.replace(
      'this.o.loader.loadAsync(def.archivo)',
      `this.o.loader.loadAsync(/^(https?:|\\/)/i.test(def.archivo) ? def.archivo : ${PREFIJO_ASSETS} + def.archivo)`
    );
  }

  // Reemplazo seguro de literales 'assets/...' y 'glb/...' (siempre con barra detrás, nunca el string suelto 'glb')
  out = out.replace(/(["'`])((?:assets|glb)\/[^"'`]*)\1/g, (_, comilla, ruta) => {
    return `${PREFIJO_ASSETS} + ${comilla}${ruta}${comilla}`;
  });

  return out;
}

async function descargarTexto(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  return await res.text();
}

async function main() {
  await fs.mkdir(DESTINO_JS, { recursive: true });
  console.log(`Descargando ${ARCHIVOS_JS.length} módulos de Mundos- (${RAMA})...`);

  for (const nombre of ARCHIVOS_JS) {
    const url = `${BASE_RAW}js/${nombre}`;
    const original = await descargarTexto(url);
    const adaptado = adaptarRutas(original, nombre);
    await fs.writeFile(path.join(DESTINO_JS, nombre), adaptado, 'utf8');
    console.log(`  ✓ vendor/mundos/js/${nombre} (${Math.round(adaptado.length / 1024)} KB)`);
  }

  if (conAssets) {
    console.log('Descargando assets y glb de Mundos- a vendor/mundos/...');
    const treeUrl = `https://api.github.com/repos/narcimarquez-eng/Mundos-/git/trees/${RAMA}?recursive=1`;
    const tree = await (await fetch(treeUrl, { headers: { 'User-Agent': 'rallys-divertidos' } })).json();
    const archivos = (tree.tree || []).filter(n => n.type === 'blob' && /^(assets|glb)\//.test(n.path));
    for (const item of archivos) {
      const dest = path.join(RAIZ, 'vendor', 'mundos', item.path);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      const res = await fetch(BASE_RAW + item.path);
      if (!res.ok) throw new Error(`HTTP ${res.status} en ${item.path}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await fs.writeFile(dest, buf);
    }
    console.log(`  ✓ ${archivos.length} archivos de assets/glb copiados en local.`);
  }

  console.log('Listo.');
}

main().catch(err => {
  console.error('Error actualizando Mundos-:', err);
  process.exit(1);
});
