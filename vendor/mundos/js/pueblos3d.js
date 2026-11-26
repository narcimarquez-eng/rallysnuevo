// Pueblos completos dentro del escenario, con el generador del Creador de Pueblos (js/village-core.js y compañía,
// copiados de Creador-de-mundos-Rpg). Se carga solo cuando hay un pueblo cerca de la cámara.
// El pueblo sigue el terreno del escenario (village.terrainBase), así casas, calles y murallas se apoyan en él.
const SCRIPTS = [
  ['vendor/mundos/js/casa-madera.js'], ['vendor/mundos/js/puestos-datos.js'], ['vendor/mundos/js/three-puente.js', 'module'], ['vendor/mundos/js/arboles.js', 'module'],
  ['vendor/mundos/js/pueblo-edits.js', 'module'], ['vendor/mundos/js/casas-glb.js'], ['vendor/mundos/js/village-core.js', 'module']
];
let carga = null;
function script(src, tipo) {
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    if (tipo) s.type = tipo;
    s.src = src; s.onload = ok; s.onerror = () => mal(new Error('No se pudo cargar ' + src));
    document.head.appendChild(s);
  });
}
export function cargarGeneradorPueblos() {
  if (window.VillageLib) return Promise.resolve(window.VillageLib);
  if (!carga) carga = (async () => {
    for (const [src, tipo] of SCRIPTS) await script(src, tipo);
    // los módulos se ejecutan al cargar; village-core deja window.VillageLib
    for (let k = 0; k < 50 && !window.VillageLib; k++) await new Promise(r => setTimeout(r, 50));
    if (!window.VillageLib) throw new Error('El generador de pueblos no se ha iniciado');
    return window.VillageLib;
  })();
  carga.catch(() => { carga = null; });
  return carga;
}

const kits = {};
function kit(V, estilo) {
  const k = V.ARCHITECTURAL_STYLES[estilo] ? estilo : 'l2_fantasy';
  return kits[k] || (kits[k] = V.createKit(k));
}

// Construye el pueblo de un elemento «pueblo» dentro de «grupo» (en coordenadas del elemento).
// alturaMundo(x, z): altura del terreno del escenario. Devuelve el objeto del generador (con destroy()).
// reservas: solares del escenario dentro del pueblo (polígonos en coordenadas del mundo, [{x, z}, …]) donde el
// pueblo no pone casas, calles, árboles ni farolas (p. ej. la iglesia). Se pasan al generador en locales.
export function construirPueblo(V, el, grupo, alturaMundo, THREE, reservas) {
  const cfg = el.props.cfg;
  const r = (cfg.rotation || 0) * Math.PI / 180, cr = Math.cos(r), sr = Math.sin(r);
  const h0 = alturaMundo(el.x, el.z);
  const g = new THREE.Group();
  g.rotation.y = -r;
  g.position.y = -(el.y || 0); // el grupo del elemento ya está a la altura del centro + el.y
  grupo.add(g);
  const k = kit(V, cfg.style);
  const pueblo = k.createVillage(g, { skipGround: true, noLights: true });
  // altura del terreno del escenario en coordenadas locales del pueblo, relativa al centro
  pueblo.terrainBase = (lx, lz) => alturaMundo(el.x + lx * cr - lz * sr, el.z + lx * sr + lz * cr) - h0;
  const aLocal = q => { const dx = q.x - el.x, dz = q.z - el.z; return { x: dx * cr + dz * sr, z: -dx * sr + dz * cr }; };
  const res = (reservas || []).map(pol => ({ puntos: pol.map(aLocal) }));
  pueblo.generate(Object.assign({}, cfg, { style: k.styleKey, hasRiver: false }, res.length ? { reservas: (cfg.reservas || []).concat(res) } : {}));
  if (pueblo.waterMesh) pueblo.waterMesh.visible = false;
  g.traverse(o => { if (o.isMesh) { o.receiveShadow = true; } });
  return { pueblo, grupo: g, destroy() { try { pueblo.destroy(); } catch (e) { /* nada */ } grupo.remove(g); } };
}

// Solares de los elementos del escenario con props.huella ([ancho, fondo] en m) que caen dentro del pueblo «el».
// Devuelve polígonos (4 esquinas, mundo) y una firma para saber si han cambiado.
export function reservasDePueblo(esc, el, dentro) {
  const pols = [];
  for (const o of esc.elementos) {
    const h = o.props && o.props.huella;
    if (o === el || !Array.isArray(h) || !dentro(el, o.x, o.z, 40)) continue;
    const t = (o.rotY || 0) * Math.PI / 180, e = o.escala || 1, c = Math.cos(t), s = Math.sin(t);
    const w = h[0] * e / 2, f = h[1] * e / 2;
    pols.push([[-w, -f], [w, -f], [w, f], [-w, f]].map(([x, z]) => ({ x: o.x + x * c + z * s, z: o.z - x * s + z * c })));
  }
  return { pols, firma: pols.map(p => p.map(q => q.x.toFixed(1) + ',' + q.z.toFixed(1)).join(';')).join('|') };
}
