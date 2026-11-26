// Núcleo de los escenarios, sin interfaz ni three.js: funciona en el navegador (window.Escenario) y en Node (require).
// Un escenario es un lienzo: terreno por mapa de alturas, materiales pintados, agua, caminos (curvas) y
// elementos colocados (formas básicas, naturaleza, marcas de juego, modelos .glb, pueblos, zonas, mazmorras…).
// Unidades en metros. El terreno está centrado en el origen: x y z van de -tam/2 a tam/2.
(function (raiz) {
  'use strict';

  const FORMATO = 'escenario-3d';
  const VERSION = 1;
  const RPG_BASE = 'https://narcimarquez-eng.github.io/Creador-de-mundos-Rpg/';

  // ---------------------------------------------------------------------------
  // 1. Utilidades: azar determinista, ruido, codificación
  // ---------------------------------------------------------------------------
  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function crearAzar(semilla) {
    const r = mulberry32(semilla);
    return {
      next: r,
      range: (a, b) => a + (b - a) * r(),
      int: (a, b) => Math.floor(a + (b - a + 1) * r()),
      pick: arr => arr[Math.floor(r() * arr.length)],
      chance: p => r() < p
    };
  }
  function hashTexto(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h;
  }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const suave = t => t * t * (3 - 2 * t);

  // Ruido de Perlin 2D con semilla
  function crearRuido(semilla) {
    const rng = mulberry32(semilla);
    const perm = new Uint8Array(256);
    for (let i = 0; i < 256; i++) perm[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); const t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    const p = new Uint8Array(512);
    for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
    const GX = [1, -1, 1, -1, 1, -1, 0, 0], GY = [1, 1, -1, -1, 0, 0, 1, -1];
    const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
    function grad(h, x, y) { const g = h & 7; return GX[g] * x + GY[g] * y; }
    function ruido(x, y) {
      const X = Math.floor(x), Y = Math.floor(y);
      const xf = x - X, yf = y - Y;
      const xi = X & 255, yi = Y & 255;
      const u = fade(xf), v = fade(yf);
      const aa = p[p[xi] + yi], ab = p[p[xi] + yi + 1], ba = p[p[xi + 1] + yi], bb = p[p[xi + 1] + yi + 1];
      const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
      const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
      return lerp(x1, x2, v) * 1.414; // ~[-1, 1]
    }
    function fbm(x, y, oct, lac, gan) {
      let a = 1, f = 1, s = 0, n = 0;
      for (let o = 0; o < oct; o++) { s += a * ruido(x * f, y * f); n += a; a *= (gan || 0.5); f *= (lac || 2); }
      return s / n;
    }
    function crestas(x, y, oct) {
      let a = 1, f = 1, s = 0, n = 0, peso = 1;
      for (let o = 0; o < oct; o++) {
        let v = 1 - Math.abs(ruido(x * f, y * f));
        v *= v; v *= peso; peso = clamp(v * 2, 0, 1);
        s += a * v; n += a; a *= 0.5; f *= 2.05;
      }
      return s / n; // [0, 1]
    }
    return { ruido, fbm, crestas };
  }

  function bytesABase64(bytes) {
    if (typeof Buffer !== 'undefined' && typeof window === 'undefined') return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
    let s = '';
    const trozo = 0x8000;
    for (let i = 0; i < bytes.length; i += trozo) s += String.fromCharCode.apply(null, bytes.subarray(i, i + trozo));
    return btoa(s);
  }
  function base64ABytes(b64) {
    if (typeof Buffer !== 'undefined' && typeof window === 'undefined') { const b = Buffer.from(b64, 'base64'); return new Uint8Array(b.buffer, b.byteOffset, b.byteLength).slice(); }
    const s = atob(b64);
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }
  const f32ABase64 = a => bytesABase64(new Uint8Array(a.buffer, a.byteOffset, a.byteLength));
  const base64AF32 = b => { const u = base64ABytes(b); return new Float32Array(u.buffer, u.byteOffset, u.byteLength / 4).slice(); };

  // ---------------------------------------------------------------------------
  // 2. Materiales del suelo y biomas
  // ---------------------------------------------------------------------------
  // id 0 = automático (según altura, pendiente y bioma)
  const MATERIALES = [
    { id: 0, nombre: 'Automático', color: '#888888' },
    { id: 1, nombre: 'Hierba', color: '#5b8a39' },
    { id: 2, nombre: 'Hierba seca', color: '#9c9a52' },
    { id: 3, nombre: 'Tierra', color: '#7b5b3b' },
    { id: 4, nombre: 'Roca', color: '#7c7873' },
    { id: 5, nombre: 'Arena', color: '#d9c58d' },
    { id: 6, nombre: 'Nieve', color: '#eef2f6' },
    { id: 7, nombre: 'Asfalto', color: '#4a4b4f' },
    { id: 8, nombre: 'Barro', color: '#4f3c2b' },
    { id: 9, nombre: 'Grava', color: '#9d958b' },
    { id: 10, nombre: 'Musgo', color: '#3d5c2b' },
    { id: 11, nombre: 'Ceniza', color: '#34302e' },
    { id: 12, nombre: 'Hielo', color: '#b9d9ea' },
    { id: 13, nombre: 'Baldosa', color: '#b3a48e' }
  ];
  const BIOMAS = {
    templado: { nombre: 'Templado', bajo: 5, medio: 1, alto: 4, cima: 6, empinado: 4, agua: '#2f6f8f' },
    desierto: { nombre: 'Desierto', bajo: 5, medio: 5, alto: 2, cima: 4, empinado: 4, agua: '#2b8a8f' },
    tropical: { nombre: 'Tropical', bajo: 5, medio: 1, alto: 10, cima: 4, empinado: 4, agua: '#1f9fa8' },
    nevado: { nombre: 'Nevado', bajo: 9, medio: 6, alto: 6, cima: 12, empinado: 4, agua: '#3d6f86' },
    volcanico: { nombre: 'Volcánico', bajo: 11, medio: 11, alto: 4, cima: 11, empinado: 4, agua: '#4a5a62' },
    otono: { nombre: 'Otoñal', bajo: 3, medio: 2, alto: 4, cima: 6, empinado: 4, agua: '#356b7d' }
  };

  // ---------------------------------------------------------------------------
  // 3. Tipos de elemento (registro ampliable)
  // ---------------------------------------------------------------------------
  // Cada tipo: id, nombre, icono, grupo, forma ('punto' o 'area'), props por defecto y campos que se editan en el panel.
  // Campo: { k: 'ruta.de.la.prop', n: 'Nombre', t: 'num'|'rango'|'color'|'bool'|'texto'|'sel'|'glb'|'modelo', min, max, paso, op: [[valor, texto]] }
  const TIPOS = {};
  const GRUPOS = [
    { id: 'basicos', nombre: 'Formas básicas' },
    { id: 'naturaleza', nombre: 'Naturaleza' },
    { id: 'juego', nombre: 'Marcas de juego' },
    { id: 'modelos', nombre: 'Modelos GLB' },
    { id: 'puentes', nombre: 'Puentes' },
    { id: 'rpg', nombre: 'RPG (pueblos, zonas, mazmorras)' }
  ];
  function registrarTipo(def) {
    if (!def || !def.id) throw new Error('Tipo sin id');
    TIPOS[def.id] = Object.assign({ forma: 'punto', grupo: 'basicos', props: {}, campos: [], icono: '•' }, def);
    return TIPOS[def.id];
  }
  const COLOR = (k, n) => ({ k, n: n || 'Color', t: 'color' });
  const NUM = (k, n, min, max, paso) => ({ k, n, t: 'num', min, max, paso: paso || 0.5 });
  // Foto de la biblioteca del Creador de Pueblos (assets/texturas: 'madera/t01', 'piedra/t03'…); '' = solo color
  const TEX = { k: 'textura', n: 'Textura', t: 'textura' };

  registrarTipo({ id: 'caja', nombre: 'Caja', icono: '📦', grupo: 'basicos', props: { ancho: 4, alto: 4, fondo: 4, color: '#ffffff', textura: 'madera/t01' },
    campos: [NUM('ancho', 'Ancho', 0.1, 500), NUM('alto', 'Alto', 0.1, 500), NUM('fondo', 'Fondo', 0.1, 500), TEX, COLOR('color', 'Color (tiñe la textura)')] });
  registrarTipo({ id: 'plataforma', nombre: 'Plataforma', icono: '▬', grupo: 'basicos', props: { ancho: 8, grosor: 1, fondo: 8, color: '#8c7a6b', borde: '#5fa04a' },
    campos: [NUM('ancho', 'Ancho', 0.5, 500), NUM('fondo', 'Fondo', 0.5, 500), NUM('grosor', 'Grosor', 0.1, 50, 0.1), TEX, COLOR('color', 'Color'), COLOR('borde', 'Color de arriba')] });
  registrarTipo({ id: 'rampa', nombre: 'Rampa', icono: '◢', grupo: 'basicos', props: { ancho: 8, alto: 3, largo: 12, color: '#9a8f80' },
    campos: [NUM('ancho', 'Ancho', 0.5, 200), NUM('alto', 'Alto', 0.1, 100), NUM('largo', 'Largo', 0.5, 300), TEX, COLOR('color')] });
  registrarTipo({ id: 'cilindro', nombre: 'Cilindro', icono: '⬭', grupo: 'basicos', props: { radio: 2, alto: 6, color: '#a0a4a8' },
    campos: [NUM('radio', 'Radio', 0.1, 200), NUM('alto', 'Alto', 0.1, 500), TEX, COLOR('color')] });
  registrarTipo({ id: 'esfera', nombre: 'Esfera', icono: '⚪', grupo: 'basicos', props: { radio: 3, color: '#c9b37a' },
    campos: [NUM('radio', 'Radio', 0.1, 200), COLOR('color')] });
  registrarTipo({ id: 'muro', nombre: 'Muro', icono: '🧱', grupo: 'basicos', props: { largo: 20, alto: 4, grosor: 1.2, color: '#ffffff', textura: 'piedra/t01' },
    campos: [NUM('largo', 'Largo', 0.5, 500), NUM('alto', 'Alto', 0.1, 100), NUM('grosor', 'Grosor', 0.1, 20, 0.1), TEX, COLOR('color', 'Color (tiñe la textura)')] });

  // Árboles con modelo .glb (glb/arboles/, preparados con tools/preparar-arboles.mjs). alto: altura del modelo en m.
  // sencillo: especie dibujada por código que los sustituye si se desactivan los árboles realistas.
  const ARBOLES_GLB = {
    liquidambar: { nombre: 'Liquidámbar', archivo: 'glb/arboles/liquidambar.glb', alto: 17.7, sencillo: 'roble' },
    pinsapo: { nombre: 'Pinsapo', archivo: 'glb/arboles/pinsapo.glb', alto: 19.3, sencillo: 'abeto' },
    pino_pinonero: { nombre: 'Pino piñonero', archivo: 'glb/arboles/pino_pinonero.glb', alto: 13.7, sencillo: 'pino' },
    palmera_datilera: { nombre: 'Palmera datilera', archivo: 'glb/arboles/palmera_datilera.glb', alto: 13.6, sencillo: 'palmera' }
  };
  function registrarArbolGlb(id, def) { ARBOLES_GLB[id] = def; ESPECIES.splice(ESPECIES.length - 1, 0, [id, def.nombre + ' (modelo)']); }
  // Mezcla de especies de «mixto» según el bioma: realistas y, si están desactivadas, sencillas
  const MEZCLA_BIOMA = {
    templado: ['liquidambar', 'pinsapo', 'pino_pinonero'], desierto: ['palmera_datilera', 'cactus', 'seco'], tropical: ['palmera_datilera'],
    nevado: ['pinsapo', 'abeto'], volcanico: ['seco', 'pino_pinonero'], otono: ['liquidambar', 'abedul', 'seco']
  };
  const ESPECIES = Object.entries(ARBOLES_GLB).map(([k, v]) => [k, v.nombre + ' (modelo)'])
    .concat([['roble', 'Roble sencillo'], ['pino', 'Pino sencillo'], ['abeto', 'Abeto sencillo'], ['palmera', 'Palmera sencilla'], ['abedul', 'Abedul sencillo'], ['seco', 'Árbol seco'], ['cactus', 'Cactus'], ['mixto', 'Mezcla según el bioma']]);
  registrarTipo({ id: 'arbol', nombre: 'Árbol', icono: '🌳', grupo: 'naturaleza', props: { especie: 'liquidambar', alto: 0 },
    campos: [{ k: 'especie', n: 'Especie', t: 'sel', op: ESPECIES.filter(e => e[0] !== 'mixto') }, NUM('alto', 'Altura (m, 0 = la del modelo)', 0, 60)] });
  // Rocas: forma (js/rocas.js la hace por código) y foto de piedra (assets/rocas/). El color tiñe la foto (el gris la deja igual).
  const FORMAS_ROCA = [['variada', 'Variadas'], ['canto', 'Canto rodado'], ['losa', 'Losa'], ['bloque', 'Bloque fracturado'], ['aguja', 'Aguja'], ['partida', 'Roca partida']];
  const PIEDRAS = [['mezcla', 'Mezcla'], ['granito', 'Granito con líquenes'], ['gris', 'Caliza gris'], ['musgo', 'Con musgo'], ['estratos', 'En estratos'], ['ocre', 'Arenisca ocre'], ['oscura', 'Pizarra oscura']];
  registrarTipo({ id: 'roca', nombre: 'Roca', icono: '🪨', grupo: 'naturaleza', props: { tam: 3, color: '#7d7a74', forma: 'variada', piedra: 'mezcla' },
    campos: [NUM('tam', 'Tamaño', 0.2, 100), { k: 'forma', n: 'Forma', t: 'sel', op: FORMAS_ROCA }, { k: 'piedra', n: 'Piedra', t: 'sel', op: PIEDRAS }, COLOR('color', 'Tinte')] });
  registrarTipo({ id: 'bosque', nombre: 'Bosque (área)', icono: '🌲', grupo: 'naturaleza', forma: 'area', radioDefecto: 40,
    props: { radio: 40, especie: 'mixto', densidad: 6, tamano: 1, altoMin: 6, altoMax: 13, rocas: 0.15, semilla: 1 },
    campos: [NUM('radio', 'Radio', 5, 2000, 1), { k: 'especie', n: 'Especie', t: 'sel', op: ESPECIES }, NUM('densidad', 'Árboles cada 1000 m²', 0.2, 40, 0.2),
      NUM('tamano', 'Tamaño de los árboles con modelo (×)', 0.3, 3, 0.05),
      NUM('altoMin', 'Altura mínima (sencillos)', 1, 60), NUM('altoMax', 'Altura máxima (sencillos)', 1, 60), NUM('rocas', 'Rocas (proporción)', 0, 1, 0.05), NUM('semilla', 'Semilla', 1, 99999, 1)] });
  registrarTipo({ id: 'rocas', nombre: 'Pedregal (área)', icono: '⛰', grupo: 'naturaleza', forma: 'area', radioDefecto: 25,
    props: { radio: 25, cantidad: 30, tamMin: 0.6, tamMax: 4, color: '#7d7a74', forma: 'variada', piedra: 'mezcla', semilla: 1 },
    campos: [NUM('radio', 'Radio', 2, 1000, 1), NUM('cantidad', 'Cantidad', 1, 600, 1), NUM('tamMin', 'Tamaño mínimo', 0.1, 50, 0.1), NUM('tamMax', 'Tamaño máximo', 0.1, 80, 0.1),
      { k: 'forma', n: 'Formas', t: 'sel', op: FORMAS_ROCA }, { k: 'piedra', n: 'Piedra', t: 'sel', op: PIEDRAS }, COLOR('color', 'Tinte'), NUM('semilla', 'Semilla', 1, 99999, 1)] });
  registrarTipo({ id: 'lago', nombre: 'Lago (área)', icono: '💧', grupo: 'naturaleza', forma: 'area', radioDefecto: 30,
    props: { radio: 30, nivel: 0, color: '#2f6f8f', excavar: true, forma: 1 },
    campos: [NUM('radio', 'Radio', 3, 2000, 1), NUM('nivel', 'Altura del agua (sobre el suelo del centro)', -20, 20, 0.1), COLOR('color', 'Color del agua'),
      NUM('forma', 'Semilla de la forma de la orilla', 1, 99999, 1)] });

  // Puentes (.glb del Creador de Pueblos y del puerto de Riotinto/Odiel). Todos cruzan a lo largo de su eje X local.
  // vano: largo del modelo (m); calzada: ancho transitable; extremo / centro: altura del tablero en los extremos y en
  // el centro sobre su base; rampa: hace falta subir el camino hasta el tablero.
  const PUENTES = {
    romano: { nombre: 'Romano de dos arcos', archivo: 'glb/puente0.glb', vano: 16.07, calzada: 3.12, extremo: 3.63, centro: 4.1 },
    torreon: { nombre: 'Medieval con torreón', archivo: 'glb/puente1.glb', vano: 22, calzada: 2.72, extremo: 0.91, centro: 3.31 },
    madera: { nombre: 'Madera con arcos', archivo: 'glb/puente3.glb', vano: 11.49, calzada: 2.96, extremo: 1.18, centro: 2.0 },
    riotinto: { nombre: 'Muelle de Riotinto (Odiel)', archivo: 'glb/muelle_riotinto_odiel_juego_web.glb', vano: 16.2, calzada: 3.6, extremo: 2.26, centro: 2.26 },
    muelle: { nombre: 'Muelle recto de hierro', archivo: 'glb/muelle_recto_juego_web.glb', vano: 12.2, calzada: 3.6, extremo: 2.26, centro: 2.26 }
  };
  registrarTipo({ id: 'puente', nombre: 'Puente', icono: '🌉', grupo: 'puentes', props: { modelo: 'romano', largo: 0, ancho: 0, camino: '' },
    campos: [{ k: 'modelo', n: 'Modelo', t: 'sel', op: Object.entries(PUENTES).map(([k, v]) => [k, v.nombre]) },
      NUM('largo', 'Largo (m, 0 = el del modelo)', 0, 200, 0.5), NUM('ancho', 'Ancho de la calzada (m, 0 = el del modelo)', 0, 40, 0.5)] });

  registrarTipo({ id: 'inicio', nombre: 'Punto de inicio', icono: '🚩', grupo: 'juego', props: { color: '#2ecc71' }, campos: [COLOR('color')] });
  registrarTipo({ id: 'meta', nombre: 'Meta', icono: '🏁', grupo: 'juego', props: { ancho: 14, alto: 6 }, campos: [NUM('ancho', 'Ancho', 2, 80), NUM('alto', 'Alto', 2, 30)] });
  registrarTipo({ id: 'checkpoint', nombre: 'Punto de control', icono: '⛳', grupo: 'juego', props: { orden: 1, ancho: 12, alto: 5, color: '#3498db' },
    campos: [NUM('orden', 'Orden', 1, 999, 1), NUM('ancho', 'Ancho', 2, 80), NUM('alto', 'Alto', 2, 30), COLOR('color')] });
  registrarTipo({ id: 'moneda', nombre: 'Coleccionable', icono: '🪙', grupo: 'juego', props: { color: '#f1c40f', tam: 1 }, campos: [COLOR('color'), NUM('tam', 'Tamaño', 0.2, 10, 0.1)] });
  registrarTipo({ id: 'luz', nombre: 'Luz', icono: '💡', grupo: 'juego', props: { color: '#ffd38a', intensidad: 40, alcance: 30 },
    campos: [COLOR('color'), NUM('intensidad', 'Intensidad', 0, 2000, 1), NUM('alcance', 'Alcance (m)', 1, 300, 1)] });
  registrarTipo({ id: 'cartel', nombre: 'Cartel', icono: '🪧', grupo: 'juego', props: { texto: 'Cartel', color: '#8b5a2b' }, campos: [{ k: 'texto', n: 'Texto', t: 'texto' }, COLOR('color')] });
  registrarTipo({ id: 'camara', nombre: 'Punto de vista', icono: '🎥', grupo: 'juego', props: { altura: 12, inclinacion: -20 },
    campos: [NUM('altura', 'Altura de la cámara', 0, 500, 0.5), NUM('inclinacion', 'Inclinación (°)', -89, 45, 1)] });

  registrarTipo({ id: 'glb', nombre: 'Modelo GLB', icono: '🧊', grupo: 'modelos', props: { modelo: '', alturaObjetivo: 0, sombras: true },
    campos: [{ k: 'modelo', n: 'Modelo', t: 'glb' }, NUM('alturaObjetivo', 'Ajustar a altura (m, 0 = original)', 0, 500, 0.1), { k: 'sombras', n: 'Sombras', t: 'bool' }] });

  const ESTILOS_PUEBLO = [['andaluz', 'Andaluz (casas encaladas)'], ['l2_fantasy', 'Fantasía (L2)'], ['european', 'Europeo'], ['fortified', 'Fortificado'], ['trade', 'Comercio'], ['dwarven', 'Enano'], ['elven', 'Élfico'], ['desert', 'Desierto'], ['nordic', 'Nórdico'], ['oriental', 'Oriental'], ['swamp', 'Pantano']];
  registrarTipo({ id: 'pueblo', nombre: 'Pueblo', icono: '🏘', grupo: 'rpg', forma: 'area', radioDefecto: 100,
    props: { radio: 100, nivel: 1, cfg: null, notas: '' },
    campos: [{ k: 'cfg.size', n: 'Tamaño (2 aldea – 5 ciudadela)', t: 'rango', min: 2, max: 5, paso: 1 }, { k: 'cfg.style', n: 'Estilo', t: 'sel', op: ESTILOS_PUEBLO },
      { k: 'cfg.casas', n: 'Casas', t: 'sel', op: [['variada', 'Las del estilo'], ['andaluza', 'Andaluzas encaladas'], ['glb', 'Entramado y cabaña'], ['original', 'Piedra y tejado'], ['madera', 'Madera'], ['mixta', 'Piedra y madera']] },
      { k: 'cfg.seed', n: 'Semilla', t: 'num', min: 1, max: 99999, paso: 1 }, { k: 'cfg.hasWalls', n: 'Murallas', t: 'bool' }, { k: 'cfg.hasRiver', n: 'Río', t: 'bool' },
      NUM('nivel', 'Nivel', 1, 99, 1), { k: 'notas', n: 'Notas', t: 'texto' }],
    accion: 'pueblo' });
  registrarTipo({ id: 'zona', nombre: 'Zona de combate', icono: '⚔', grupo: 'rpg', forma: 'area', radioDefecto: 60,
    props: { radio: 60, subtipo: 'caza', nivelMin: 1, nivelMax: 5, enemigos: [], semilla: 1 },
    campos: [NUM('radio', 'Radio', 5, 2000, 1), { k: 'subtipo', n: 'Tipo', t: 'sel', op: [['caza', 'Caza'], ['elite', 'Élite'], ['jefe', 'Jefe'], ['pvp', 'PvP'], ['segura', 'Segura'], ['arena', 'Arena / circuito']] },
      NUM('nivelMin', 'Nivel mínimo', 1, 99, 1), NUM('nivelMax', 'Nivel máximo', 1, 99, 1), NUM('semilla', 'Semilla de colocación', 1, 99999, 1)],
    accion: 'zona' });
  registrarTipo({ id: 'mazmorra', nombre: 'Mazmorra', icono: '🕳', grupo: 'rpg', props: { nivel: 10, dungeon: null },
    campos: [NUM('nivel', 'Nivel', 1, 99, 1)], accion: 'mazmorra' });
  registrarTipo({ id: 'enemigo', nombre: 'Enemigo', icono: '🐉', grupo: 'rpg', props: { modelo: '', alturaObjetivo: 2.4, nivel: 1 },
    campos: [{ k: 'modelo', n: 'Modelo', t: 'modelo', grupo: 'enemigos' }, NUM('alturaObjetivo', 'Altura (m)', 0.2, 60, 0.1), NUM('nivel', 'Nivel', 1, 99, 1)] });

  function leerRuta(obj, ruta) { return ruta.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj); }
  function escribirRuta(obj, ruta, valor) {
    const ks = ruta.split('.');
    let o = obj;
    for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = {}; o = o[ks[i]]; }
    o[ks[ks.length - 1]] = valor;
  }

  // Configuración del Creador de Pueblos (misma forma que defaultTownCfg de Creador-de-mundos-Rpg/js/world-core.js)
  function cfgPuebloPorDefecto(semilla, size) {
    const r = crearAzar(semilla || 1);
    const style = r.pick(['l2_fantasy', 'european', 'fortified', 'trade']);
    size = size || 3;
    return {
      style, terrainType: r.pick(['plains', 'valley', 'hills']), relief: r.int(20, 60), seed: r.int(1, 99999), size,
      houseDensity: r.int(65, 95), specialCount: clamp(size * 2 + r.int(-1, 1), 2, 10), maxFloors: r.int(2, 3), roadWidth: 7.0,
      trazado: 'manzanas', curve: Math.round(r.range(2, 9) * 2) / 2, treeDensity: r.int(55, 85),
      hasWalls: size >= 3, hasRiver: false, hasMagic: true, hasProps: true, hasLamps: true, hasFences: true, hasGardens: true,
      time: 'day', rotation: 0, exits: []
    };
  }
  function radioPueblo(size) { return 42 + size * 14 + 30; }

  // ---------------------------------------------------------------------------
  // 4. Escenario: creación, terreno y alturas
  // ---------------------------------------------------------------------------
  function nuevoId(esc, pref) { return (pref || 'e') + '_' + (esc.nextId++); }

  function crearVacio(opts) {
    opts = opts || {};
    const tam = clamp(Math.round(opts.tam || 1024), 64, 16384);
    const res = [65, 129, 257, 513].includes(opts.res) ? opts.res : 257;
    const ahora = new Date().toISOString();
    return {
      format: FORMATO, version: VERSION,
      id: opts.id || ('esc-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36)),
      nombre: opts.nombre || 'Escenario sin nombre',
      descripcion: opts.descripcion || '',
      plantilla: opts.plantilla || 'vacio',
      semilla: opts.semilla || 1,
      nextId: 1,
      creado: ahora, actualizado: ahora,
      terreno: {
        tam, res,
        bioma: opts.bioma || 'templado',
        gen: Object.assign({ tipo: 'plano', escala: 300, altura: 40, octavas: 5, base: 0, semilla: opts.semilla || 1 }, opts.gen || {}),
        alturas: new Float32Array(res * res),
        materiales: new Uint8Array(res * res),
        vegetacion: new Uint8Array(res * res), // hierba, trigo, flores… pintados (ver codVegetacion); 0 = automático
        hierbaAuto: 0.6,                        // densidad de la hierba automática sobre los suelos de hierba (0 = sin)
        agua: { activa: false, nivel: 0, color: null },
        bordes: 'cortado' // 'cortado' (se ve el borde) o 'infinito' (suelo que se extiende)
      },
      ambiente: { hora: 13, niebla: 0.35, nubes: 0.4, cielo: 'auto' },
      caminos: [],
      elementos: [],
      enlaces: { rpgBase: RPG_BASE },
      glbs: {} // modelos importados: { id: { nombre, bytes(base64 solo al exportar con modelos) } }
    };
  }

  function paso(esc) { return esc.terreno.tam / (esc.terreno.res - 1); }
  function idx(esc, i, j) { return j * esc.terreno.res + i; }
  function xDe(esc, i) { return -esc.terreno.tam / 2 + i * paso(esc); }
  function aRejilla(esc, x, z) { const p = paso(esc), m = esc.terreno.tam / 2; return { gi: (x + m) / p, gj: (z + m) / p }; }
  function dentro(esc, x, z) { const m = esc.terreno.tam / 2; return x >= -m && x <= m && z >= -m && z <= m; }

  // Altura del terreno en un punto (interpolación bilineal)
  function alturaEn(esc, x, z) {
    const t = esc.terreno, r = t.res, h = t.alturas;
    const g = aRejilla(esc, x, z);
    const gi = clamp(g.gi, 0, r - 1.0001), gj = clamp(g.gj, 0, r - 1.0001);
    const i = Math.floor(gi), j = Math.floor(gj), fx = gi - i, fz = gj - j;
    const a = h[j * r + i], b = h[j * r + i + 1], c = h[(j + 1) * r + i], d = h[(j + 1) * r + i + 1];
    return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
  }
  // Altura del suelo visible: terreno o agua (lo que esté más alto)
  function sueloEn(esc, x, z) {
    const h = alturaEn(esc, x, z);
    const a = esc.terreno.agua;
    return a && a.activa ? Math.max(h, a.nivel) : h;
  }
  function pendienteIdx(esc, i, j) {
    const t = esc.terreno, r = t.res, h = t.alturas, p = paso(esc);
    const i0 = Math.max(0, i - 1), i1 = Math.min(r - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(r - 1, j + 1);
    const dx = (h[j * r + i1] - h[j * r + i0]) / ((i1 - i0) * p);
    const dz = (h[j1 * r + i] - h[j0 * r + i]) / ((j1 - j0) * p);
    return Math.hypot(dx, dz);
  }
  // Rango de alturas guardado (para los materiales automáticos punto a punto). Se olvida al cambiar el terreno.
  const cacheRango = new WeakMap();
  function rangoCache(esc) {
    let r = cacheRango.get(esc.terreno.alturas);
    if (!r) { r = rangoAlturas(esc); cacheRango.set(esc.terreno.alturas, r); }
    return r;
  }
  function olvidarRango(esc) { cacheRango.delete(esc.terreno.alturas); }
  function rangoAlturas(esc) {
    const h = esc.terreno.alturas;
    let mn = Infinity, mx = -Infinity;
    for (let k = 0; k < h.length; k++) { if (h[k] < mn) mn = h[k]; if (h[k] > mx) mx = h[k]; }
    return { min: mn, max: mx };
  }

  // Material automático según bioma, altura y pendiente
  function materialAuto(esc, i, j, rango) {
    const t = esc.terreno, b = BIOMAS[t.bioma] || BIOMAS.templado;
    const h = t.alturas[j * t.res + i];
    const s = pendienteIdx(esc, i, j);
    if (s > 0.85) return b.empinado;
    const agua = t.agua && t.agua.activa ? t.agua.nivel : -Infinity;
    if (h < agua + 1.2) return b.bajo;
    const r = rango || rangoAlturas(esc);
    const base = Math.max(r.min, agua === -Infinity ? r.min : agua);
    const span = Math.max(1, r.max - base);
    const rel = (h - base) / span;
    if (rel > 0.82 && r.max - base > 40) return b.cima;
    if (rel > 0.6 && s > 0.45) return b.alto;
    return b.medio;
  }
  function materialEn(esc, i, j, rango) {
    const m = esc.terreno.materiales[j * esc.terreno.res + i];
    return m || materialAuto(esc, i, j, rango);
  }

  // Genera las alturas a partir de los parámetros de esc.terreno.gen
  const TIPOS_TERRENO = [['plano', 'Plano'], ['colinas', 'Colinas'], ['montanas', 'Montañas'], ['isla', 'Isla'], ['archipielago', 'Archipiélago'],
    ['valle', 'Valle'], ['dunas', 'Dunas'], ['mesetas', 'Mesetas (escalones)'], ['canon', 'Cañón'], ['crater', 'Cráter / volcán']];

  function generarTerreno(esc, gen) {
    const t = esc.terreno;
    if (gen) t.gen = Object.assign({}, t.gen, gen);
    const g = t.gen, r = t.res, m = t.tam / 2;
    const N = crearRuido((g.semilla || 1) * 7919 + 13);
    const esc1 = 1 / Math.max(10, g.escala || 300);
    const H = g.altura == null ? 40 : g.altura, oct = clamp(g.octavas || 5, 1, 8), base = g.base || 0;
    for (let j = 0; j < r; j++) {
      for (let i = 0; i < r; i++) {
        const x = -m + i * t.tam / (r - 1), z = -m + j * t.tam / (r - 1);
        const nx = x * esc1, nz = z * esc1;
        const d = Math.hypot(x, z) / m; // 0 centro, 1 borde
        let h = 0;
        switch (g.tipo) {
          case 'plano': h = N.fbm(nx * 2, nz * 2, 3) * 0.3; break;
          case 'colinas': h = (N.fbm(nx, nz, oct) * 0.5 + 0.5) * H; break;
          case 'montanas': { const c = N.crestas(nx, nz, oct); h = Math.pow(c, 1.6) * H + N.fbm(nx * 3, nz * 3, 3) * H * 0.05; break; }
          case 'isla': { const f = N.fbm(nx, nz, oct) * 0.45 + 0.55 - Math.pow(d, 2.2) * 1.1; h = f * H; break; }
          case 'archipielago': { const f = N.fbm(nx * 1.6, nz * 1.6, oct) * 0.9 + 0.12 - Math.pow(d, 3) * 0.8; h = f * H; break; }
          case 'valle': { const v = Math.abs(x + N.fbm(nz * 0.7, 3.1, 3) * m * 0.25) / m; h = (Math.pow(v, 1.4) * 0.9 + N.fbm(nx, nz, oct) * 0.18) * H; break; }
          case 'dunas': { const w = N.fbm(nx * 0.6, nz * 0.6, 2) * 3; h = (Math.abs(Math.sin(nx * 9 + w + nz * 2.5)) * 0.55 + N.fbm(nx * 1.5, nz * 1.5, oct) * 0.45) * H * 0.5; break; }
          case 'mesetas': { const f = (N.fbm(nx, nz, oct) * 0.5 + 0.5) * H; const st = Math.max(2, H / 6); const k = Math.floor(f / st); const fr = (f - k * st) / st; h = (k + suave(clamp((fr - 0.75) * 4, 0, 1))) * st; break; }
          case 'canon': { const c = 1 - Math.abs(N.fbm(nx * 0.8, nz * 0.8, 3)); const v = Math.pow(c, 10); h = (1 - v) * H + N.fbm(nx * 4, nz * 4, 3) * H * 0.04; break; }
          case 'crater': { const anillo = Math.exp(-Math.pow((d - 0.18) / 0.09, 2)); const cono = Math.max(0, 1 - d * 1.6); h = (cono * 0.75 + anillo * 0.35 - (d < 0.18 ? (0.18 - d) * 2.4 : 0)) * H + N.fbm(nx * 2, nz * 2, oct) * H * 0.08; break; }
          default: h = 0;
        }
        t.alturas[j * r + i] = h + base;
      }
    }
    return esc;
  }

  // ---------------------------------------------------------------------------
  // 5. Pinceles (esculpir y pintar). Devuelven la región cambiada en índices de rejilla.
  // ---------------------------------------------------------------------------
  function regionPincel(esc, x, z, radio) {
    const r = esc.terreno.res, p = paso(esc), g = aRejilla(esc, x, z), rr = radio / p;
    return { i0: clamp(Math.floor(g.gi - rr), 0, r - 1), i1: clamp(Math.ceil(g.gi + rr), 0, r - 1), j0: clamp(Math.floor(g.gj - rr), 0, r - 1), j1: clamp(Math.ceil(g.gj + rr), 0, r - 1) };
  }
  function caida(d, radio) { if (d >= radio) return 0; return 0.5 * (Math.cos(Math.PI * d / radio) + 1); }

  // op: { modo: 'subir'|'bajar'|'suavizar'|'aplanar'|'ruido'|'nivel', x, z, radio, fuerza (m por aplicación o 0–1), objetivo }
  function esculpir(esc, op) {
    const t = esc.terreno, r = t.res, h = t.alturas, p = paso(esc);
    const reg = regionPincel(esc, op.x, op.z, op.radio);
    const f0 = op.fuerza == null ? 1 : op.fuerza;
    const N = op.modo === 'ruido' ? crearRuido(op.semilla || 99) : null;
    const orig = op.modo === 'suavizar' ? h.slice() : null;
    for (let j = reg.j0; j <= reg.j1; j++) {
      for (let i = reg.i0; i <= reg.i1; i++) {
        const x = -t.tam / 2 + i * p, z = -t.tam / 2 + j * p;
        const w = caida(Math.hypot(x - op.x, z - op.z), op.radio);
        if (w <= 0) continue;
        const k = j * r + i;
        switch (op.modo) {
          case 'subir': h[k] += f0 * w; break;
          case 'bajar': h[k] -= f0 * w; break;
          case 'suavizar': {
            let s = 0, n = 0;
            for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
              const ii = i + di, jj = j + dj;
              if (ii < 0 || jj < 0 || ii >= r || jj >= r) continue;
              s += orig[jj * r + ii]; n++;
            }
            h[k] = lerp(orig[k], s / n, clamp(f0, 0, 1) * w);
            break;
          }
          case 'aplanar': case 'nivel': h[k] = lerp(h[k], op.objetivo, clamp(f0, 0, 1) * w); break;
          case 'ruido': h[k] += N.ruido(x * 0.08, z * 0.08) * f0 * w; break;
        }
      }
    }
    return reg;
  }

  // Pinta material (0 = volver a automático). Borde con algo de mezcla para que no quede recortado.
  function pintar(esc, op) {
    const t = esc.terreno, r = t.res, p = paso(esc);
    const reg = regionPincel(esc, op.x, op.z, op.radio);
    const rnd = mulberry32(Math.floor((op.x * 31 + op.z * 17) * 100) ^ 0x9e3779b9);
    for (let j = reg.j0; j <= reg.j1; j++) {
      for (let i = reg.i0; i <= reg.i1; i++) {
        const x = -t.tam / 2 + i * p, z = -t.tam / 2 + j * p;
        const w = caida(Math.hypot(x - op.x, z - op.z), op.radio);
        if (w <= 0) continue;
        if (w > 0.45 || rnd() < w * 2) t.materiales[j * r + i] = op.material | 0;
      }
    }
    return reg;
  }

  // Allana un área circular hacia una altura (por defecto la media del centro), con transición suave en el borde.
  function allanarArea(esc, x, z, radio, objetivo, margen) {
    const t = esc.terreno, r = t.res, p = paso(esc);
    margen = margen == null ? Math.max(6, radio * 0.35) : margen;
    if (objetivo == null) {
      let s = 0, n = 0;
      for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2; s += alturaEn(esc, x + Math.cos(ang) * radio * 0.5, z + Math.sin(ang) * radio * 0.5); n++; }
      s += alturaEn(esc, x, z) * 4; n += 4;
      objetivo = s / n;
    }
    const reg = regionPincel(esc, x, z, radio + margen);
    for (let j = reg.j0; j <= reg.j1; j++) for (let i = reg.i0; i <= reg.i1; i++) {
      const d = Math.hypot(-t.tam / 2 + i * p - x, -t.tam / 2 + j * p - z);
      if (d > radio + margen) continue;
      const w = d <= radio ? 1 : suave(1 - (d - radio) / margen);
      const k = j * r + i;
      t.alturas[k] = lerp(t.alturas[k], objetivo, w);
    }
    return { region: reg, altura: objetivo };
  }

  // ---------------------------------------------------------------------------
  // 5b. Vegetación baja: hierba, trigo, flores, hierba alta y bambú (se dibuja con js/pradera.js)
  // ---------------------------------------------------------------------------
  // Cada punto de la rejilla guarda un byte: 0 = automático (hierba según el suelo), 255 = nada (borrado a mano),
  // 1–250 = tipo pintado y densidad: 1 + tipo·50 + (densidad − 1), con densidad 1–50.
  const PRADERA = [['hierba', 'Hierba'], ['trigo', 'Trigo'], ['flores', 'Flores'], ['hierbaAlta', 'Hierba alta'], ['bambu', 'Bambú']];
  const VEG_NADA = 255;
  function codVegetacion(tipo, densidad) {
    const t = typeof tipo === 'number' ? tipo : PRADERA.findIndex(p => p[0] === tipo);
    if (t < 0) return 0;
    return 1 + t * 50 + (clamp(Math.round(densidad * 50), 1, 50) - 1);
  }
  function decodVegetacion(v) {
    if (v === 0) return null;
    if (v === VEG_NADA) return { tipo: null, d: 0 };
    v -= 1;
    return { tipo: PRADERA[Math.floor(v / 50)][0], d: (v % 50 + 1) / 50 };
  }
  const SUELOS_CON_HIERBA = { 1: 1, 2: 0.8, 10: 0.7 }; // hierba, hierba seca, musgo → cuánta hierba automática
  const ruidosVeg = new WeakMap();
  // Qué crece en un punto: { tipo, d (0–1), tinte (material del suelo) } o null
  function vegetacionEn(esc, x, z) {
    const t = esc.terreno, r = t.res;
    if (!dentro(esc, x, z)) return null;
    const g = aRejilla(esc, x, z), i = Math.round(g.gi), j = Math.round(g.gj), k = j * r + i;
    const mat = t.materiales[k] || 0;
    const pint = t.vegetacion ? decodVegetacion(t.vegetacion[k]) : null;
    const agua = t.agua && t.agua.activa ? t.agua.nivel : -Infinity;
    if (pint) {
      if (!pint.tipo) return null;
      if (alturaEn(esc, x, z) < agua + 0.2) return null;
      return { tipo: pint.tipo, d: pint.d, suelo: mat || materialAuto(esc, i, j, rangoCache(esc)) };
    }
    if (!(t.hierbaAuto > 0)) return null;
    const suelo = mat || materialAuto(esc, i, j, rangoCache(esc));
    const f = SUELOS_CON_HIERBA[suelo];
    if (!f) return null;
    if (pendienteIdx(esc, i, j) > 0.75) return null;
    if (alturaEn(esc, x, z) < agua + 0.4) return null;
    let N = ruidosVeg.get(t);
    if (!N || N.semilla !== t.gen.semilla) { N = crearRuido((t.gen.semilla || 1) * 13 + 5); N.semilla = t.gen.semilla; ruidosVeg.set(t, N); }
    const manchas = N.fbm(x / 45, z / 45, 3) * 0.5 + 0.5;               // claros y zonas tupidas
    const prado = N.ruido(x / 90 + 40, z / 90 - 17);                   // praderas con flores
    const alta = N.ruido(x / 70 - 9, z / 70 + 23);                     // matorral de hierba alta
    const d = clamp(t.hierbaAuto * f * (0.35 + manchas * 0.9), 0, 1);
    const tipo = prado > 0.5 ? 'flores' : alta > 0.5 && suelo !== 2 ? 'hierbaAlta' : 'hierba';
    return { tipo, d: tipo === 'hierbaAlta' ? d * 0.7 : d, suelo };
  }
  // op: { x, z, radio, tipo: 'hierba'|'trigo'|'flores'|'hierbaAlta'|'bambu'|'auto'|'nada', densidad (0–1) }
  function pintarVegetacion(esc, op) {
    const t = esc.terreno, r = t.res, p = paso(esc);
    if (!t.vegetacion) t.vegetacion = new Uint8Array(r * r);
    const reg = regionPincel(esc, op.x, op.z, op.radio);
    const rnd = mulberry32(Math.floor((op.x * 29 + op.z * 13) * 100) ^ 0x51ed27);
    for (let j = reg.j0; j <= reg.j1; j++) for (let i = reg.i0; i <= reg.i1; i++) {
      const w = caida(Math.hypot(-t.tam / 2 + i * p - op.x, -t.tam / 2 + j * p - op.z), op.radio);
      if (w <= 0) continue;
      if (!(w > 0.45 || rnd() < w * 2)) continue;
      const k = j * r + i;
      if (op.tipo === 'auto') t.vegetacion[k] = 0;
      else if (op.tipo === 'nada') t.vegetacion[k] = VEG_NADA;
      else t.vegetacion[k] = codVegetacion(op.tipo, (op.densidad == null ? 0.7 : op.densidad) * Math.min(1, 0.4 + w));
    }
    return reg;
  }

  // ---------------------------------------------------------------------------
  // 6. Caminos y pistas (curvas Catmull-Rom por puntos de control)
  // ---------------------------------------------------------------------------
  const TIPOS_CAMINO = [['tierra', 'Tierra', 3], ['grava', 'Grava', 9], ['asfalto', 'Asfalto (carretera)', 7], ['piedra', 'Empedrado', 13], ['arena', 'Arena', 5], ['barro', 'Barro', 8], ['nieve', 'Nieve pisada', 6], ['adoquin', 'Adoquín', 13], ['riachuelo', 'Riachuelo (agua)', 8]];
  // El riachuelo es el último tipo: no es una superficie de camino, es agua que corre en el sentido de los puntos
  const esRio = c => c && c.tipo === 'riachuelo';
  function profundidadRio(c) { return c.profundidad || clamp(c.ancho * 0.22, 0.5, 2); }

  function crearCamino(esc, opts) {
    opts = opts || {};
    const c = {
      id: nuevoId(esc, 'c'), nombre: opts.nombre || ('Camino ' + (esc.caminos.length + 1)),
      tipo: opts.tipo || 'tierra', ancho: opts.ancho || 6, cerrado: !!opts.cerrado,
      bordes: opts.bordes == null ? (opts.tipo === 'asfalto') : !!opts.bordes, // líneas blancas en los bordes
      puntos: (opts.puntos || []).map(p => ({ x: p.x, z: p.z })),
      tramos: (opts.tramos || []).map(t => Object.assign({}, t)),     // superficie distinta por tramos: [{ desde, hasta, tipo }]
      barreras: (opts.barreras || []).map(b => Object.assign({}, b))  // vallas y barreras: [{ tipo, lado, desde, hasta, separacion }]
    };
    esc.caminos.push(c);
    return c;
  }

  // Vallas y barreras que se ponen a los lados de un camino. paso: metros entre piezas. alto: m.
  const TIPOS_BARRERA = [
    ['cinta', 'Cinta de balizar', { paso: 4, alto: 1.0 }],
    ['valla_madera', 'Valla de madera', { paso: 2.5, alto: 1.1 }],
    ['guardarrail', 'Guardarraíl', { paso: 2, alto: 0.75 }],
    ['neumaticos', 'Muro de neumáticos', { paso: 0.75, alto: 0.75 }],
    ['muro', 'Muro de hormigón', { paso: 2, alto: 0.9 }],
    ['balas_paja', 'Balas de paja', { paso: 1.3, alto: 0.6 }],
    ['conos', 'Conos', { paso: 3, alto: 0.5 }],
    ['valla_publi', 'Vallas publicitarias', { paso: 3, alto: 1.2 }],
    ['seto', 'Seto', { paso: 2, alto: 1.3 }],
    ['muro_piedra', 'Muro de piedra', { paso: 2, alto: 1.0 }]
  ];
  const LADOS = [['ambos', 'Los dos lados'], ['izq', 'Izquierda'], ['der', 'Derecha']];
  function largoCamino(camino, muestras) { const mu = muestras || muestrearCamino(camino, 2); return mu.length ? mu[mu.length - 1].d : 0; }
  // ¿Está la distancia d (m desde el inicio) dentro del tramo [desde, hasta]? En un circuito el tramo puede dar la vuelta.
  function enTramo(t, d, cerrado) {
    if (t.hasta >= t.desde) return d >= t.desde && d <= t.hasta;
    return cerrado && (d >= t.desde || d <= t.hasta);
  }
  // Superficie del camino a d metros del inicio (el último tramo que la cubre manda)
  function superficieEn(camino, d) {
    const ts = camino.tramos || [];
    for (let k = ts.length - 1; k >= 0; k--) if (enTramo(ts[k], d, camino.cerrado)) return ts[k].tipo;
    return camino.tipo;
  }
  // Punto del camino más cercano a (x, z): { d, dist, lado (+1 izquierda, −1 derecha según el sentido), x, z }
  function proyectarEnCamino(camino, x, z, muestras) {
    const mu = muestras || muestrearCamino(camino, 1.5);
    let best = null;
    for (let k = 0; k + 1 < mu.length; k++) {
      const a = mu[k], b = mu[k + 1];
      const dx = b.x - a.x, dz = b.z - a.z, l2 = dx * dx + dz * dz || 1e-9;
      const t = clamp(((x - a.x) * dx + (z - a.z) * dz) / l2, 0, 1);
      const px = a.x + dx * t, pz = a.z + dz * t, dist = Math.hypot(x - px, z - pz);
      if (!best || dist < best.dist) best = { d: a.d + (b.d - a.d) * t, dist, lado: (dx * (z - a.z) - dz * (x - a.x)) > 0 ? 1 : -1, x: px, z: pz };
    }
    return best;
  }
  // Camino que pisa un punto (para el juego: agarre, ruido, polvo): { camino, d, tipo, lateral } o null
  const cacheMuestras = new WeakMap();
  function caminoEn(esc, x, z) {
    let mejor = null;
    for (const c of esc.caminos) {
      if (c.puntos.length < 2) continue;
      let mu = cacheMuestras.get(c);
      const firma = JSON.stringify(c.puntos) + c.cerrado;
      if (!mu || mu.firma !== firma) { mu = muestrearCamino(c, 1.5); mu.firma = firma; cacheMuestras.set(c, mu); }
      const p = proyectarEnCamino(c, x, z, mu);
      if (p && p.dist <= c.ancho / 2 && (!mejor || p.dist < mejor.lateral)) mejor = { camino: c, d: p.d, tipo: superficieEn(c, p.d), lateral: p.dist };
    }
    return mejor;
  }

  // Muestrea la curva cada ~paso metros: [{ x, z, d (distancia acumulada) }]
  function muestrearCamino(camino, pasoM) {
    const P = camino.puntos;
    pasoM = pasoM || 2;
    if (P.length < 2) return P.map(p => ({ x: p.x, z: p.z, d: 0 }));
    const n = P.length, cerr = camino.cerrado && n >= 3;
    const get = k => cerr ? P[(k + n) % n] : P[clamp(k, 0, n - 1)];
    const segs = cerr ? n : n - 1;
    const out = [];
    let dAcum = 0, prev = null;
    for (let s = 0; s < segs; s++) {
      const p0 = get(s - 1), p1 = get(s), p2 = get(s + 1), p3 = get(s + 2);
      const largo = Math.hypot(p2.x - p1.x, p2.z - p1.z);
      const pasos = Math.max(1, Math.ceil(largo / pasoM));
      for (let q = 0; q < pasos; q++) {
        const t = q / pasos, t2 = t * t, t3 = t2 * t;
        const cr = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        const pt = { x: cr(p0.x, p1.x, p2.x, p3.x), z: cr(p0.z, p1.z, p2.z, p3.z) };
        if (prev) dAcum += Math.hypot(pt.x - prev.x, pt.z - prev.z);
        pt.d = dAcum; out.push(pt); prev = pt;
      }
    }
    const ult = cerr ? P[0] : P[n - 1];
    dAcum += Math.hypot(ult.x - prev.x, ult.z - prev.z);
    out.push({ x: ult.x, z: ult.z, d: dAcum });
    return out;
  }

  // Alturas suavizadas a lo largo del camino (la rasante): media móvil de la altura del terreno
  function rasante(esc, muestras, ventana, cerrado) {
    const n = muestras.length;
    const base = muestras.map(m => alturaEn(esc, m.x, m.z));
    const w = ventana || 6, out = new Float32Array(n);
    for (let k = 0; k < n; k++) {
      let s = 0, c = 0;
      for (let q = -w; q <= w; q++) {
        let kk = k + q;
        if (cerrado) kk = (kk + n) % n; else if (kk < 0 || kk >= n) continue;
        s += base[kk]; c++;
      }
      out[k] = s / c;
    }
    if (esc.terreno.agua && esc.terreno.agua.activa) for (let k = 0; k < n; k++) out[k] = Math.max(out[k], esc.terreno.agua.nivel + 0.4);
    return out;
  }

  // Ajusta el terreno al camino: lo allana a lo ancho con su rasante y suaviza los taludes.
  function ajustarTerrenoACamino(esc, camino, opts) {
    opts = opts || {};
    const mu = muestrearCamino(camino, Math.max(1, paso(esc) * 0.75));
    if (mu.length < 2) return null;
    const ras = rasante(esc, mu, opts.ventana || Math.round(10 / Math.max(1, paso(esc) * 0.75)), camino.cerrado);
    const t = esc.terreno, r = t.res, p = paso(esc);
    const rio = esRio(camino), prof = rio ? profundidadRio(camino) : 0;
    let margenK = null;
    if (rio) { // el agua solo baja: rasante que nunca sube en el sentido del río; el cauce se excava por debajo
      const orig = Float32Array.from(ras);
      for (let k = 1; k < ras.length; k++) ras[k] = Math.min(ras[k], ras[k - 1]);
      // donde atraviesa una loma corta más hondo: allí las laderas son más anchas (un valle, no una zanja)
      margenK = new Float32Array(ras.length);
      for (let k = 0; k < ras.length; k++) { margenK[k] = Math.max(4, camino.ancho * 1.2) + (orig[k] - ras[k]) * 4; ras[k] -= prof; }
    }
    const medio = camino.ancho / 2 + (rio ? 0.3 : 0.6);
    let margen = opts.margen == null ? Math.max(4, camino.ancho * 0.8) : opts.margen;
    if (margenK) margen = Math.min(80, Math.max(...margenK));
    const celda = 8, cubos = new Map();
    mu.forEach((m, k) => { const key = Math.floor(m.x / celda) + ',' + Math.floor(m.z / celda); if (!cubos.has(key)) cubos.set(key, []); cubos.get(key).push(k); });
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of mu) { minX = Math.min(minX, m.x); maxX = Math.max(maxX, m.x); minZ = Math.min(minZ, m.z); maxZ = Math.max(maxZ, m.z); }
    const lim = medio + margen;
    const g0 = aRejilla(esc, minX - lim, minZ - lim), g1 = aRejilla(esc, maxX + lim, maxZ + lim);
    const reg = { i0: clamp(Math.floor(g0.gi), 0, r - 1), i1: clamp(Math.ceil(g1.gi), 0, r - 1), j0: clamp(Math.floor(g0.gj), 0, r - 1), j1: clamp(Math.ceil(g1.gj), 0, r - 1) };
    const alcance = Math.ceil(lim / celda);
    const nuevas = t.alturas.slice();
    for (let j = reg.j0; j <= reg.j1; j++) for (let i = reg.i0; i <= reg.i1; i++) {
      const x = -t.tam / 2 + i * p, z = -t.tam / 2 + j * p;
      const cx = Math.floor(x / celda), cz = Math.floor(z / celda);
      let best = Infinity, bk = -1;
      for (let a = -alcance; a <= alcance; a++) for (let b = -alcance; b <= alcance; b++) {
        const l = cubos.get((cx + a) + ',' + (cz + b));
        if (!l) continue;
        for (const k of l) { const d = Math.hypot(mu[k].x - x, mu[k].z - z); if (d < best) { best = d; bk = k; } }
      }
      if (bk < 0 || best > lim) continue;
      const mk = margenK ? Math.min(80, margenK[bk]) : margen;
      if (best > medio + mk) continue;
      const w = best <= medio ? 1 : suave(1 - (best - medio) / mk);
      const k = j * r + i;
      if (rio) {
        // cauce redondeado: más hondo en el centro; solo excava, nunca levanta
        const fondo = ras[bk] + prof * 0.45 * Math.min(1, best / medio) ** 2;
        nuevas[k] = Math.min(t.alturas[k], lerp(t.alturas[k], fondo, w));
        if (opts.pintar !== false && best <= medio + 1 && !t.materiales[k]) t.materiales[k] = best <= medio * 0.7 ? 9 : 8;
        continue;
      }
      // Si hay varios caminos cerca, nos quedamos con el cambio de mayor peso
      nuevas[k] = lerp(t.alturas[k], ras[bk], w);
      if (opts.pintar && best <= camino.ancho / 2) t.materiales[k] = materialCamino(camino, mu[bk].d);
    }
    t.alturas.set(nuevas);
    return reg;
  }
  // Altura del agua a lo largo de un riachuelo (por muestra): fondo suavizado, que nunca sube, + 60 % de la hondura
  function nivelesRio(esc, camino, muestras) {
    const mu = muestras || muestrearCamino(camino, 1.5);
    const ras = rasante(esc, mu, 4, false);
    for (let k = 1; k < ras.length; k++) ras[k] = Math.min(ras[k], ras[k - 1]);
    const prof = profundidadRio(camino);
    return ras.map(v => v + prof * 0.6);
  }
  function materialCamino(c, d) { const tipo = d == null ? c.tipo : superficieEn(c, d); const t = TIPOS_CAMINO.find(x => x[0] === tipo); return t ? t[2] : 3; }
  function distanciaACamino(camino, x, z, muestras) {
    const mu = muestras || muestrearCamino(camino, 3);
    let best = Infinity;
    for (const m of mu) { const d = Math.hypot(m.x - x, m.z - z); if (d < best) best = d; }
    return best;
  }

  // ---------------------------------------------------------------------------
  // 7. Elementos
  // ---------------------------------------------------------------------------
  function copiaProfunda(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }

  function crearElemento(esc, tipo, x, z, props) {
    const def = TIPOS[tipo];
    if (!def) throw new Error('Tipo de elemento desconocido: ' + tipo);
    const el = {
      id: nuevoId(esc, tipo.slice(0, 3)), tipo,
      nombre: (props && props.nombre) || def.nombre,
      x: +x || 0, y: 0, z: +z || 0, rotY: 0, escala: 1,
      props: Object.assign(copiaProfunda(def.props), copiaProfunda(props || {}))
    };
    delete el.props.nombre;
    if (tipo === 'pueblo') {
      if (!el.props.cfg) el.props.cfg = cfgPuebloPorDefecto(hashTexto(el.id + esc.semilla), 3);
      if (!props || props.radio == null) el.props.radio = radioPueblo(el.props.cfg.size);
    }
    if (tipo === 'mazmorra' && !el.props.dungeon) el.props.dungeon = { id: el.id, name: el.nombre, nivel: el.props.nivel };
    if (def.forma === 'area' && el.props.semilla === 1) el.props.semilla = 1 + (hashTexto(el.id + esc.id) % 99998);
    esc.elementos.push(el);
    return el;
  }
  function buscarElemento(esc, id) { return esc.elementos.find(e => e.id === id) || null; }
  function buscarCamino(esc, id) { return esc.caminos.find(c => c.id === id) || null; }
  function quitar(esc, id) {
    const a = esc.elementos.length, b = esc.caminos.length;
    esc.elementos = esc.elementos.filter(e => e.id !== id);
    esc.caminos = esc.caminos.filter(c => c.id !== id);
    return a !== esc.elementos.length || b !== esc.caminos.length;
  }
  function duplicarElemento(esc, id) {
    const e = buscarElemento(esc, id);
    if (!e) return null;
    const n = copiaProfunda(e);
    n.id = nuevoId(esc, e.tipo.slice(0, 3));
    n.x += 6; n.z += 6;
    esc.elementos.push(n);
    return n;
  }
  function radioElemento(el) {
    const p = el.props || {};
    if (p.radio) return p.radio * (el.escala || 1);
    switch (el.tipo) {
      case 'caja': case 'plataforma': return Math.hypot(p.ancho || 4, p.fondo || 4) / 2 * (el.escala || 1);
      case 'rampa': return Math.hypot(p.ancho || 8, p.largo || 12) / 2 * (el.escala || 1);
      case 'muro': return (p.largo || 20) / 2 * (el.escala || 1);
      case 'roca': return (p.tam || 3) * (el.escala || 1);
      case 'meta': case 'checkpoint': return (p.ancho || 12) / 2;
      default: return 3 * (el.escala || 1);
    }
  }

  // --- Lagos: vaso de orilla irregular excavado en el terreno ---
  function excavarLago(esc, el) {
    const t = esc.terreno, r = t.res, p = paso(esc), R = el.props.radio;
    const N = crearRuido((el.props.forma || 1) * 977 + 3);
    const rr = a => R * (0.78 + 0.34 * (N.fbm(Math.cos(a) * 1.4 + 5, Math.sin(a) * 1.4 + 5, 3) * 0.5 + 0.5));
    // nivel del agua: un poco por debajo del suelo más bajo de la orilla, para que no se salga
    let minOrilla = Infinity, suma = 0;
    for (let k = 0; k < 32; k++) { const a = k / 32 * Math.PI * 2, x = el.x + Math.cos(a) * rr(a), z = el.z + Math.sin(a) * rr(a); const h = alturaEn(esc, x, z); minOrilla = Math.min(minOrilla, h); suma += h; }
    const W = Math.max(minOrilla, suma / 32 - 2) - 0.35;
    const prof = clamp(R * 0.07, 1.2, 6);
    const reg = regionPincel(esc, el.x, el.z, R * 2);
    const rios = esc.caminos.filter(c => esRio(c) && c.puntos.length >= 2).map(c => ({ c, mu: muestrearCamino(c, 3) }));
    const enRio = (x, z) => rios.some(o => distanciaACamino(o.c, x, z, o.mu) < o.c.ancho * 1.2);
    for (let j = reg.j0; j <= reg.j1; j++) for (let i = reg.i0; i <= reg.i1; i++) {
      const x = -t.tam / 2 + i * p, z = -t.tam / 2 + j * p, dx = x - el.x, dz = z - el.z;
      const dd = Math.hypot(dx, dz), tt = dd / rr(Math.atan2(dz, dx));
      const enDisco = dd < R * 1.4; // hasta donde se dibuja el agua del lago
      if (tt > 1.75 && !enDisco) continue;
      const k = j * r + i, h = t.alturas[k];
      if (tt < 1) {
        // vaso: hondo en el centro y subiendo suave hasta la orilla (justo por debajo del agua)
        t.alturas[k] = Math.min(h, W - 0.15 - prof * Math.pow(1 - tt * tt, 0.8));
      } else if (tt < 1.35) {
        // orilla: del nivel del agua al terreno, en suave
        const orilla = lerp(W + 0.08, h, suave((tt - 1) / 0.35));
        t.alturas[k] = h > W + 0.08 ? Math.min(h, orilla) : (enRio(x, z) ? h : W + 0.08); // reborde que contiene el agua, salvo donde entra un río
      } else if (h < W + 0.1 && !enRio(x, z)) {
        // más reborde donde el terreno baja por fuera (entero mientras quede dentro del disco de agua)
        t.alturas[k] = lerp(W + 0.1, h, enDisco ? 0 : suave(clamp((tt - 1.35) / 0.4, 0, 1)));
      }
      if (!t.materiales[k] && tt > 0.75 && tt < 1.15) t.materiales[k] = 5; // arena en la orilla
      else if (!t.materiales[k] && tt <= 0.75) t.materiales[k] = 8;      // barro en el fondo
    }
    el.props.nivel = Math.round((W - alturaEn(esc, el.x, el.z)) * 100) / 100;
    return reg;
  }

  // --- Puentes sobre caminos ---
  // Cruces de caminos con riachuelos: [{ camino, rio, d (m en el camino), x, z, dx, dz (dirección del camino) }]
  function crucesCaminoRio(esc) {
    const out = [];
    const rios = esc.caminos.filter(c => esRio(c) && c.puntos.length >= 2);
    for (const c of esc.caminos) {
      if (esRio(c) || c.puntos.length < 2) continue;
      const mc = muestrearCamino(c, 2);
      for (const rio of rios) {
        const mr = muestrearCamino(rio, 2);
        for (let a = 0; a + 1 < mc.length; a++) for (let b = 0; b + 1 < mr.length; b++) {
          const p = mc[a], q = mc[a + 1], u = mr[b], v = mr[b + 1];
          const d1x = q.x - p.x, d1z = q.z - p.z, d2x = v.x - u.x, d2z = v.z - u.z;
          const den = d1x * d2z - d1z * d2x;
          if (Math.abs(den) < 1e-9) continue;
          const s1 = ((u.x - p.x) * d2z - (u.z - p.z) * d2x) / den, s2 = ((u.x - p.x) * d1z - (u.z - p.z) * d1x) / den;
          if (s1 < 0 || s1 > 1 || s2 < 0 || s2 > 1) continue;
          const l = Math.hypot(d1x, d1z) || 1;
          const x = p.x + d1x * s1, z = p.z + d1z * s1;
          if (out.some(o => o.camino === c && o.rio === rio && Math.hypot(o.x - x, o.z - z) < 5)) continue; // el mismo cruce en el borde de dos tramos
          out.push({ camino: c, rio, d: p.d + (q.d - p.d) * s1, x, z, dx: d1x / l, dz: d1z / l });
        }
      }
    }
    return out;
  }
  // Coloca un puente en el camino más cercano: centrado, a lo largo de él, ancho como el camino y largo para cubrir el
  // cauce; la base a la altura de las orillas. Devuelve el camino o null.
  function ajustarPuenteACamino(esc, el, rioAncho) {
    let best = null;
    for (const c of esc.caminos) {
      if (esRio(c) || c.puntos.length < 2) continue;
      const pr = proyectarEnCamino(c, el.x, el.z);
      if (pr && pr.dist < Math.max(12, c.ancho) && (!best || pr.dist < best.pr.dist)) best = { c, pr };
    }
    if (!best) return null;
    const { c, pr } = best, def = PUENTES[el.props.modelo] || PUENTES.romano;
    const mu = muestrearCamino(c, 1);
    let k = mu.findIndex(m => m.d >= pr.d); if (k < 1) k = 1;
    const dx = mu[k].x - mu[k - 1].x, dz = mu[k].z - mu[k - 1].z, l = Math.hypot(dx, dz) || 1;
    el.x = Math.round(pr.x * 10) / 10; el.z = Math.round(pr.z * 10) / 10;
    el.rotY = Math.round(Math.atan2(-dz / l, dx / l) * 1800 / Math.PI) / 10;
    el.props.camino = c.id;
    if (!el.props.ancho) el.props.ancho = Math.max(def.calzada, c.ancho + 1);
    if (!el.props.largo) el.props.largo = Math.max(def.vano, (rioAncho || 5) * 2.2 + 8);
    const L = el.props.largo / 2;
    const hA = alturaEn(esc, el.x - dx / l * L, el.z - dz / l * L), hB = alturaEn(esc, el.x + dx / l * L, el.z + dz / l * L);
    el.y = Math.round((Math.max(hA, hB) - 0.2 - alturaEn(esc, el.x, el.z)) * 100) / 100;
    return c;
  }
  // Pone un puente en cada cruce de camino y riachuelo que no lo tenga. modelos: lista de modelos a repartir;
  // vados: cuántos cruces (los primeros de cada camino) se dejan como vado. Devuelve los puentes nuevos.
  function ponerPuentes(esc, opts) {
    opts = opts || {};
    const modelos = opts.modelos || ['romano'];
    const nuevos = [];
    let n = 0;
    const cruces = crucesCaminoRio(esc).sort((a, b) => a.camino === b.camino ? a.d - b.d : 0);
    const vistos = new Map();
    for (const cr of cruces) {
      const ya = esc.elementos.some(e => e.tipo === 'puente' && Math.hypot(e.x - cr.x, e.z - cr.z) < 15);
      const iC = (vistos.get(cr.camino.id) || 0); vistos.set(cr.camino.id, iC + 1);
      if (ya || iC < (opts.vados || 0)) continue;
      const el = crearElemento(esc, 'puente', cr.x, cr.z, { modelo: modelos[n++ % modelos.length], nombre: 'Puente ' + (esc.elementos.filter(e => e.tipo === 'puente').length + 1) });
      ajustarPuenteACamino(esc, el, cr.rio.ancho);
      nuevos.push(el);
    }
    return nuevos;
  }
  // Tramos de un camino que van por un puente: [{ d0, d1, alto (altura del tablero en los extremos), rampa }]
  function puentesDeCamino(esc, c) {
    const out = [];
    for (const el of esc.elementos) {
      if (el.tipo !== 'puente' || el.props.camino !== c.id) continue;
      const def = PUENTES[el.props.modelo] || PUENTES.romano;
      const pr = proyectarEnCamino(c, el.x, el.z);
      if (!pr || pr.dist > c.ancho) continue;
      const L = (el.props.largo || def.vano) / 2;
      out.push({ d0: pr.d - L, d1: pr.d + L, alto: alturaEn(esc, el.x, el.z) + (el.y || 0) + def.extremo, rampa: Math.max(4, def.extremo * 3) });
    }
    return out;
  }

  // --- Salidas del pueblo y caminos del escenario ---
  // El Creador de Pueblos hace cada salida como una calle recta desde la plaza hasta el borde de su terreno (un
  // cuadrado de lado max(240, (42 + 14·size + 65)·2) m), girado cfg.rotation grados. Ángulos locales con atan2(z, x).
  function mitadTerrenoPueblo(cfg) { return Math.max(240, (42 + 14 * ((cfg && cfg.size) || 3) + 65) * 2) / 2; }
  function puntoSalidaPueblo(el, angulo) {
    const cfg = el.props.cfg || {}, r = (cfg.rotation || 0) * Math.PI / 180, a = angulo * Math.PI / 180, h = mitadTerrenoPueblo(cfg);
    // la calle de salida llega hasta el borde del cuadrado: en diagonal, más lejos
    const lado = h / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a)));
    const lx = Math.cos(a) * lado, lz = Math.sin(a) * lado;
    return { x: el.x + lx * Math.cos(r) - lz * Math.sin(r), z: el.z + lx * Math.sin(r) + lz * Math.cos(r) };
  }
  function anguloLocalPueblo(el, x, z) {
    const r = ((el.props.cfg && el.props.cfg.rotation) || 0) * Math.PI / 180, dx = x - el.x, dz = z - el.z;
    const lx = dx * Math.cos(r) + dz * Math.sin(r), lz = -dx * Math.sin(r) + dz * Math.cos(r);
    return Math.round((((Math.atan2(lz, lx) * 180 / Math.PI) % 360 + 360) % 360) * 10) / 10;
  }
  // ¿Está (x, z) dentro del cuadrado de terreno del pueblo (donde mandan sus calles)?
  function dentroTerrenoPueblo(el, x, z, margen) {
    const cfg = el.props.cfg; if (!cfg) return false;
    const r = (cfg.rotation || 0) * Math.PI / 180, dx = x - el.x, dz = z - el.z;
    const lx = dx * Math.cos(r) + dz * Math.sin(r), lz = -dx * Math.sin(r) + dz * Math.cos(r);
    const h = mitadTerrenoPueblo(cfg) - (margen || 0);
    return Math.abs(lx) < h && Math.abs(lz) < h;
  }
  // Un camino que pasa por el pueblo: entra por una salida, rodea la plaza y sale por otra. Pone esas dos salidas al
  // pueblo y cambia los puntos del camino que quedaban dentro por el recorrido por sus calles. Devuelve true si lo hace.
  function atravesarPueblo(esc, el, c) {
    const cfg = el.props.cfg; if (!cfg || c.puntos.length < 2) return false;
    const mu = muestrearCamino(c, 2), n = mu.length;
    let k0 = 0;
    mu.forEach((m, k) => { if (Math.hypot(m.x - el.x, m.z - el.z) < Math.hypot(mu[k0].x - el.x, mu[k0].z - el.z)) k0 = k; });
    if (!dentroTerrenoPueblo(el, mu[k0].x, mu[k0].z)) return false;
    let a = k0, b = k0;
    while (a > 0 && dentroTerrenoPueblo(el, mu[a].x, mu[a].z)) a--;
    while (b < n - 1 && dentroTerrenoPueblo(el, mu[b].x, mu[b].z)) b++;
    if (dentroTerrenoPueblo(el, mu[a].x, mu[a].z) || dentroTerrenoPueblo(el, mu[b].x, mu[b].z)) return false; // pasa por la salida: no
    const angA = anguloLocalPueblo(el, mu[a].x, mu[a].z), angB = anguloLocalPueblo(el, mu[b].x, mu[b].z);
    cfg.exits = [{ angle: angA, gate: null, to: c.nombre, roadId: c.id }, { angle: angB, gate: null, to: c.nombre, roadId: c.id }];
    // recorrido por dentro: borde → calle de salida → alrededor de la plaza (radio 11 m) → calle de salida → borde
    const r = (cfg.rotation || 0) * Math.PI / 180;
    const polar = (angDeg, dist) => { const t = angDeg * Math.PI / 180, lx = Math.cos(t) * dist, lz = Math.sin(t) * dist; return { x: el.x + lx * Math.cos(r) - lz * Math.sin(r), z: el.z + lx * Math.sin(r) + lz * Math.cos(r) }; };
    let delta = ((angB - angA + 540) % 360) - 180;
    const dentro = [puntoSalidaPueblo(el, angA), polar(angA, 30), polar(angA, 13)];
    const pasos = Math.max(2, Math.ceil(Math.abs(delta) / 45));
    for (let k = 1; k < pasos; k++) dentro.push(polar(angA + delta * k / pasos, 11));
    dentro.push(polar(angB, 13), polar(angB, 30), puntoSalidaPueblo(el, angB));
    const dA = mu[a].d, dB = mu[b].d;
    const dP = c.puntos.map(p => proyectarEnCamino(c, p.x, p.z, mu).d);
    const antes = c.puntos.filter((p, i) => dP[i] <= dA), despues = c.puntos.filter((p, i) => dP[i] >= dB);
    const red = p => ({ x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10 });
    c.puntos = antes.concat(dentro.map(red), despues);
    return true;
  }

  // Une los caminos que llegan al pueblo con sus salidas. desdeSalidas = true: los caminos van a las salidas que ya
  // tiene el pueblo (las elegidas en el Creador de Pueblos); si no, se crean salidas donde llegan los caminos.
  // Devuelve cuántos caminos se han conectado.
  function conectarCaminosPueblo(esc, el, opts) {
    opts = opts || {};
    const cfg = el.props.cfg; if (!cfg) return 0;
    const h = mitadTerrenoPueblo(cfg), dentroT = p => { const a = anguloLocalPueblo(el, p.x, p.z) * Math.PI / 180; const lado = h / Math.max(Math.abs(Math.cos(a)), Math.abs(Math.sin(a))); return Math.hypot(p.x - el.x, p.z - el.z) < lado * 0.995; };
    const usarSalidas = opts.desdeSalidas && Array.isArray(cfg.exits) && cfg.exits.length;
    const nuevas = [];
    let n = 0;
    for (const c of esc.caminos) {
      if (esRio(c) || c.puntos.length < 2) continue;
      for (const fin of [0, 1]) {
        const pts = fin ? c.puntos.slice().reverse() : c.puntos.slice();
        if (!dentroT(pts[0])) continue;
        const j = pts.findIndex(p => !dentroT(p));
        if (j < 0) continue; // el camino está entero dentro del pueblo
        const fuera = pts[j];
        let q, ang;
        if (usarSalidas) {
          let best = null;
          for (const e of cfg.exits) { const pq = puntoSalidaPueblo(el, e.angle); const d = Math.hypot(pq.x - fuera.x, pq.z - fuera.z); if (!best || d < best.d) best = { d, pq, e }; }
          q = best.pq; ang = best.e.angle; best.e.roadId = c.id; best.e.to = c.nombre;
        } else {
          // dirección por la que llega el camino: del centro al primer punto de fuera
          ang = anguloLocalPueblo(el, fuera.x, fuera.z);
          q = puntoSalidaPueblo(el, ang);
          nuevas.push({ angle: ang, gate: null, to: c.nombre, roadId: c.id });
        }
        const resto = pts.slice(j);
        const nuevo = [{ x: Math.round(q.x * 10) / 10, z: Math.round(q.z * 10) / 10 }].concat(resto);
        c.puntos = fin ? nuevo.reverse() : nuevo;
        n++;
      }
    }
    if (!usarSalidas && nuevas.length) cfg.exits = nuevas;
    return n;
  }

  // Coloca un pueblo: allana su terreno. Devuelve la región cambiada.
  function prepararPueblo(esc, el) {
    if (el.tipo !== 'pueblo') return null;
    const cfg = el.props.cfg || (el.props.cfg = cfgPuebloPorDefecto(1, 3));
    el.props.radio = el.props.radio || radioPueblo(cfg.size);
    return allanarArea(esc, el.x, el.z, el.props.radio * 0.9).region;
  }

  // ---------------------------------------------------------------------------
  // 8. Plantillas
  // ---------------------------------------------------------------------------
  const PLANTILLAS = {};
  function registrarPlantilla(def) { PLANTILLAS[def.id] = def; return def; }

  function buscarSitio(esc, rng, filtro, intentos) {
    const m = esc.terreno.tam / 2;
    for (let k = 0; k < (intentos || 200); k++) {
      const x = rng.range(-m * 0.85, m * 0.85), z = rng.range(-m * 0.85, m * 0.85);
      if (filtro(x, z)) return { x, z };
    }
    return null;
  }
  function sobreAgua(esc, x, z, margen) { const a = esc.terreno.agua; return !a.activa || alturaEn(esc, x, z) > a.nivel + (margen || 0); }

  registrarPlantilla({ id: 'vacio', nombre: 'Lienzo vacío', icono: '⬜', desc: 'Suelo plano de hierba. Empieza desde cero.',
    aplicar(esc) { generarTerreno(esc, { tipo: 'plano', altura: 0 }); } });

  registrarPlantilla({ id: 'rpg', nombre: 'Mundo RPG', icono: '🏰', desc: 'Isla grande con montañas, pueblos unidos por caminos, zonas de combate, bosques y una mazmorra.',
    tam: 2048,
    aplicar(esc, rng) {
      esc.terreno.agua = { activa: true, nivel: 2, color: null };
      generarTerreno(esc, { tipo: 'isla', escala: 520, altura: 110, octavas: 6 });
      const pueblos = [];
      for (let k = 0; k < 4; k++) {
        const s = buscarSitio(esc, rng, (x, z) => {
          const h = alturaEn(esc, x, z);
          return h > 8 && h < 45 && pueblos.every(p => Math.hypot(p.x - x, p.z - z) > esc.terreno.tam * 0.22) && pendienteIdx(esc, Math.round(aRejilla(esc, x, z).gi), Math.round(aRejilla(esc, x, z).gj)) < 0.25;
        }, 600) || buscarSitio(esc, rng, (x, z) => sobreAgua(esc, x, z, 6), 400);
        if (!s) continue;
        const el = crearElemento(esc, 'pueblo', s.x, s.z, { nombre: ['Valdris', 'Lorrin', 'Ostmark', 'Elarion', 'Brennhal'][k], nivel: 1 + k * 5,
          cfg: cfgPuebloPorDefecto(rng.int(1, 99999), k === 0 ? 4 : rng.int(2, 3)) });
        el.props.radio = radioPueblo(el.props.cfg.size);
        prepararPueblo(esc, el);
        pueblos.push(el);
      }
      // Caminos entre pueblos seguidos y una mazmorra al final
      for (let k = 0; k + 1 < pueblos.length; k++) {
        const a = pueblos[k], b = pueblos[k + 1];
        const mx = (a.x + b.x) / 2 + rng.range(-80, 80), mz = (a.z + b.z) / 2 + rng.range(-80, 80);
        const c = crearCamino(esc, { tipo: 'tierra', ancho: 6, puntos: [{ x: a.x, z: a.z }, { x: mx, z: mz }, { x: b.x, z: b.z }], nombre: a.nombre + ' – ' + b.nombre });
        ajustarTerrenoACamino(esc, c);
        const z = crearElemento(esc, 'zona', mx + rng.range(-40, 40), mz + rng.range(-40, 40), { nombre: 'Zona ' + (k + 1), nivelMin: 1 + k * 5, nivelMax: 5 + k * 5, radio: 70,
          subtipo: k === pueblos.length - 2 ? 'jefe' : 'caza' });
        void z;
      }
      for (const p of pueblos) { prepararPueblo(esc, p); conectarCaminosPueblo(esc, p); }
      const alto = buscarSitio(esc, rng, (x, z) => alturaEn(esc, x, z) > 55, 800);
      if (alto) crearElemento(esc, 'mazmorra', alto.x, alto.z, { nombre: 'Cripta de la montaña', nivel: 20 });
      for (let k = 0; k < 10; k++) {
        const s = buscarSitio(esc, rng, (x, z) => { const h = alturaEn(esc, x, z); return h > 6 && h < 50 && pueblos.every(p => Math.hypot(p.x - x, p.z - z) > p.props.radio + 60); });
        if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: rng.int(40, 110), densidad: rng.range(3, 8) });
      }
      if (pueblos[0]) crearElemento(esc, 'inicio', pueblos[0].x + pueblos[0].props.radio * 0.3, pueblos[0].z);
    } });

  registrarPlantilla({ id: 'rally', nombre: 'Circuito de rally', icono: '🏎', desc: 'Colinas con un circuito de grava y asfalto que cruza un pueblo andaluz con su iglesia, barreras, riachuelos con puentes y un vado, lagos y bosques.',
    tam: 1536, bioma: 'templado',
    aplicar(esc, rng) {
      generarTerreno(esc, { tipo: 'colinas', escala: 380, altura: 45, octavas: 5 });
      const R = esc.terreno.tam * 0.3, n = 14, pts = [];
      const N = crearRuido(rng.int(1, 1e6));
      for (let k = 0; k < n; k++) {
        const a = k / n * Math.PI * 2;
        const rr = R * (0.72 + 0.45 * (N.ruido(Math.cos(a) * 1.3, Math.sin(a) * 1.3) * 0.5 + 0.5));
        pts.push({ x: Math.cos(a) * rr * 1.15, z: Math.sin(a) * rr * 0.85 });
      }
      const c = crearCamino(esc, { tipo: 'grava', ancho: 11, cerrado: true, puntos: pts, nombre: 'Circuito' });
      ajustarTerrenoACamino(esc, c, { margen: 12 });
      const m = esc.terreno.tam / 2;
      // Pueblo blanco andaluz EN la pista: el circuito entra por una salida, rodea la plaza y sale por la otra
      const cfgP = cfgPuebloPorDefecto(rng.int(1, 99999), 5); // grande: muchas casas
      Object.assign(cfgP, { style: 'andaluz', casas: 'andaluza', trazado: 'adosadas', houseDensity: 100, maxFloors: 2, puestos: false, hasWalls: false, hasRiver: false, hasMagic: false, specialCount: 0, treeDensity: 35, relief: 0, rotation: 0 });
      const hP = mitadTerrenoPueblo(cfgP);
      let mu0 = muestrearCamino(c, 2);
      const total0 = mu0[mu0.length - 1].d;
      // el tramo más recto entre el 30 % y el 75 % de la vuelta (lejos de la salida)
      let mejor = null;
      for (const q of mu0) {
        if (q.d < total0 * 0.3 || q.d > total0 * 0.75) continue;
        const k = mu0.indexOf(q), A = mu0[Math.max(0, k - 40)], B = mu0[Math.min(mu0.length - 1, k + 40)];
        const recta = Math.hypot(B.x - A.x, B.z - A.z) / Math.max(1, B.d - A.d);
        if (!mejor || recta > mejor.recta) mejor = { q, recta };
      }
      const pueblo = crearElemento(esc, 'pueblo', Math.round(mejor.q.x), Math.round(mejor.q.z), { nombre: 'Villarrally', nivel: 1, cfg: cfgP });
      atravesarPueblo(esc, pueblo, c);
      prepararPueblo(esc, pueblo);
      ajustarTerrenoACamino(esc, c, { margen: 12 });
      prepararPueblo(esc, pueblo);
      // Iglesia de la Granada (Moguer): torre de 48 m, en el centro, junto a la plaza y con la fachada mirando a ella.
      // Ocupa un solar de 81 × 64 m (props.huella): el pueblo no pone casas, calles ni árboles ahí.
      const cfgPu = pueblo.props.cfg; // el elemento guarda su propia copia
      const HUELLA = [81, 64], dIg = 16.4 + 4 + HUELLA[1] / 2;
      const muP = muestrearCamino(c, 3).filter(q => Math.hypot(q.x - pueblo.x, q.z - pueblo.z) < hP);
      let ig = null;
      for (let k = 0; k < 24; k++) { // el lado de la plaza más lejos de la pista
        const a = k / 24 * Math.PI * 2, ux = Math.cos(a), uz = Math.sin(a);
        const cx = pueblo.x + ux * dIg, cz = pueblo.z + uz * dIg;
        let holgura = Infinity; // distancia de la pista al rectángulo del solar
        for (const q of muP) {
          const dx = q.x - cx, dz = q.z - cz, a1 = Math.abs(dx * ux + dz * uz) - HUELLA[1] / 2, a2 = Math.abs(-dx * uz + dz * ux) - HUELLA[0] / 2;
          holgura = Math.min(holgura, Math.hypot(Math.max(a1, 0), Math.max(a2, 0)) + Math.min(Math.max(a1, a2), 0));
        }
        if (!ig || holgura > ig.holgura) ig = { x: cx, z: cz, ux, uz, holgura };
      }
      allanarArea(esc, ig.x, ig.z, Math.hypot(HUELLA[0], HUELLA[1]) / 2 + 2, alturaEn(esc, pueblo.x, pueblo.z), 14);
      const iglesia = crearElemento(esc, 'glb', Math.round(ig.x), Math.round(ig.z), { nombre: 'Iglesia de Ntra. Sra. de la Granada (Moguer)', modelo: 'glb/edificios/iglesia_granada_moguer.glb', alturaObjetivo: 48, huella: HUELLA });
      iglesia.rotY = Math.round(Math.atan2(-ig.ux, -ig.uz) * 180 / Math.PI); // la fachada (+z del modelo) mira a la plaza
      // Lo que va a lo largo de la vuelta, con la pista ya pasando por el pueblo
      const mu = muestrearCamino(c, 2), total = mu[mu.length - 1].d;
      const enD = d => { let k = 0; while (k < mu.length - 1 && mu[k].d < d) k++; const a = mu[Math.max(0, k - 1)], b = mu[Math.min(mu.length - 1, k + 1)]; return { x: mu[k].x, z: mu[k].z, rot: Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI }; };
      const s0 = enD(4);
      const meta = crearElemento(esc, 'meta', s0.x, s0.z, { ancho: 16 }); meta.rotY = s0.rot;
      const ini = crearElemento(esc, 'inicio', enD(total - 14).x, enD(total - 14).z); ini.rotY = s0.rot;
      const enPueblo = d => { const p = enD(d); return dentroTerrenoPueblo(pueblo, p.x, p.z, -20); };
      for (let k = 1; k <= 5; k++) { let d = total * k / 6; while (enPueblo(d) && d < total - 30) d += 20; const p = enD(d); const cp = crearElemento(esc, 'checkpoint', p.x, p.z, { orden: k, ancho: 15, nombre: 'Control ' + k }); cp.rotY = p.rot; }
      // Superficie mixta: un tramo de asfalto y un charco de barro (fuera del pueblo)
      let r1 = Math.round(total * 0.12), r2 = Math.round(total * 0.27);
      c.tramos.push({ desde: r1, hasta: r2, tipo: 'asfalto' }, { desde: Math.round(total * 0.86), hasta: Math.round(total * 0.89), tipo: 'barro' });
      // Barreras: neumáticos en la salida, guardarraíl en el asfalto, cinta para el público y paja en dos controles
      // (dentro del pueblo no se ponen: allí mandan sus calles)
      const red = v => Math.round(v);
      c.barreras.push(
        { tipo: 'neumaticos', lado: 'ambos', desde: red(total - 40), hasta: 40, separacion: 1.2 },
        { tipo: 'guardarrail', lado: 'ambos', desde: r1, hasta: r2, separacion: 0.8 },
        { tipo: 'cinta', lado: 'ambos', desde: 45, hasta: r1 - 5, separacion: 5 },
        { tipo: 'cinta', lado: 'ambos', desde: r2 + 5, hasta: red(total - 45), separacion: 5 },
        { tipo: 'balas_paja', lado: 'ambos', desde: red(total * 2 / 6 - 18), hasta: red(total * 2 / 6 + 18), separacion: 1.5 },
        { tipo: 'balas_paja', lado: 'ambos', desde: red(total * 5 / 6 - 18), hasta: red(total * 5 / 6 + 18), separacion: 1.5 },
        { tipo: 'valla_publi', lado: 'izq', desde: 12, hasta: 36, separacion: 3 });
      const cercaIglesia = (x, z) => Math.hypot(x - ig.x, z - ig.z) < 70;
      // Riachuelo de un lado a otro del mapa, lejos del pueblo: cruza la pista por dos vados
      const N2 = crearRuido(rng.int(1, 1e6));
      const zR = pueblo.z > 0 ? -m * 0.5 : m * 0.5, rpts = [];
      for (let k = 0; k <= 10; k++) {
        const x = -m * 0.97 + k * m * 0.194;
        rpts.push({ x, z: zR + N2.ruido(k * 0.6, 3.3) * m * 0.12 });
      }
      if (alturaEn(esc, rpts[0].x, rpts[0].z) < alturaEn(esc, rpts[rpts.length - 1].x, rpts[rpts.length - 1].z)) rpts.reverse(); // nace en el lado alto
      const rio = crearCamino(esc, { tipo: 'riachuelo', ancho: 5, nombre: 'Riachuelo', puntos: rpts });
      ajustarTerrenoACamino(esc, rio);
      // Lagos de tres tamaños, y un segundo riachuelo que baja desde lo alto hasta el más grande
      const lagos = [];
      for (const R of [70, 40, 22]) {
        const s2 = buscarSitio(esc, rng, (x, z) => Math.abs(x) < m - R * 1.6 && Math.abs(z) < m - R * 1.6 && distanciaACamino(c, x, z, mu) > R * 1.5 + 20 &&
          Math.hypot(x - pueblo.x, z - pueblo.z) > hP + R * 1.5 && !cercaIglesia(x, z) && distanciaACamino(rio, x, z) > R * 1.5 + 10 && lagos.every(l => Math.hypot(l.x - x, l.z - z) > (l.props.radio + R) * 1.8), 1500);
        if (!s2) continue;
        const lago = crearElemento(esc, 'lago', s2.x, s2.z, { radio: R, nombre: R > 50 ? 'Lago grande' : R > 30 ? 'Lago' : 'Charca', forma: rng.int(1, 99999) });
        excavarLago(esc, lago);
        lagos.push(lago);
      }
      let rio2 = null;
      if (lagos[0]) {
        const L = lagos[0];
        let alto = null;
        for (let k = 0; k < 300; k++) {
          const a = rng.next() * Math.PI * 2, d = rng.range(m * 0.45, m * 0.8), x = L.x + Math.cos(a) * d, z = L.z + Math.sin(a) * d;
          if (Math.abs(x) > m * 0.95 || Math.abs(z) > m * 0.95 || Math.hypot(x - pueblo.x, z - pueblo.z) < hP + 30) continue;
          const h = alturaEn(esc, x, z);
          if (!alto || h > alto.h) alto = { x, z, h };
        }
        if (alto) {
          const pts2 = [];
          for (let k = 0; k <= 6; k++) {
            const f = k / 6, x = alto.x + (L.x - alto.x) * f, z = alto.z + (L.z - alto.z) * f;
            const off = k > 0 && k < 6 ? N2.ruido(k * 0.8, 9.1) * 60 : 0, dx = L.x - alto.x, dz = L.z - alto.z, dl = Math.hypot(dx, dz) || 1;
            pts2.push({ x: x - dz / dl * off, z: z + dx / dl * off });
          }
          rio2 = crearCamino(esc, { tipo: 'riachuelo', ancho: 3.5, nombre: 'Arroyo del lago', puntos: pts2 });
          ajustarTerrenoACamino(esc, rio2);
          excavarLago(esc, L); // que el arroyo desemboque en el lago
        }
      }
      // Puentes donde los caminos cruzan los riachuelos (el muelle de Riotinto el primero); un cruce de la pista queda como vado
      const puentes = ponerPuentes(esc, { modelos: ['riotinto', 'romano', 'madera', 'torreon', 'muelle'] });
      const dePista = puentes.filter(pu => pu.props.camino === c.id);
      if (dePista.length > 1) quitar(esc, dePista[dePista.length - 1].id);
      const libre = (x, z) => distanciaACamino(c, x, z, mu) > 45 && Math.hypot(x - pueblo.x, z - pueblo.z) > hP + 25 && !cercaIglesia(x, z) && distanciaACamino(rio, x, z) > 15 &&
        (!rio2 || distanciaACamino(rio2, x, z) > 12) && lagos.every(l => Math.hypot(l.x - x, l.z - z) > l.props.radio * 1.4 + 10);
      for (let k = 0; k < 14; k++) {
        const s = buscarSitio(esc, rng, libre);
        if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: rng.int(30, 80), densidad: rng.range(4, 10), especie: rng.pick(['pinsapo', 'pino_pinonero', 'mixto']) });
      }
      for (let k = 0; k < 8; k++) {
        const s = buscarSitio(esc, rng, (x, z) => { const d = distanciaACamino(c, x, z, mu); return d > 12 && d < 30 && Math.hypot(x - pueblo.x, z - pueblo.z) > hP && !cercaIglesia(x, z); });
        if (s) crearElemento(esc, 'rocas', s.x, s.z, { radio: 10, cantidad: 8, tamMax: 2.5 });
      }
    } });

  registrarPlantilla({ id: 'plataformas', nombre: 'Plataformas', icono: '🍄', desc: 'Lago con una cadena de plataformas flotantes que suben hasta la meta.',
    tam: 512, bioma: 'tropical',
    aplicar(esc, rng) {
      esc.terreno.agua = { activa: true, nivel: 0, color: null };
      generarTerreno(esc, { tipo: 'archipielago', escala: 160, altura: 14, octavas: 4, base: -3 });
      allanarArea(esc, -150, 0, 30, 4);
      crearElemento(esc, 'inicio', -150, 0).rotY = 90;
      let x = -120, z = 0, y = 4, dir = 0;
      const colores = ['#c0392b', '#e67e22', '#8e44ad', '#16a085', '#2980b9'];
      for (let k = 0; k < 22; k++) {
        dir += rng.range(-0.6, 0.6);
        x += Math.cos(dir) * rng.range(9, 14); z += Math.sin(dir) * rng.range(9, 14);
        y += rng.range(0.5, 2.6);
        const suelo = alturaEn(esc, x, z);
        const p = crearElemento(esc, 'plataforma', x, z, { ancho: rng.pick([5, 6, 8]), fondo: rng.pick([5, 6, 8]), grosor: 1.2, borde: rng.pick(['#5fa04a', '#7bc96f', '#e9d8a6']), color: colores[k % colores.length] });
        p.y = Math.max(1, y - Math.max(0, suelo));
        if (k % 3 === 1) { const m = crearElemento(esc, 'moneda', x, z); m.y = p.y + 2; }
      }
      const meta = crearElemento(esc, 'meta', x + 8, z, { ancho: 8, alto: 5 });
      const pf = crearElemento(esc, 'plataforma', x + 8, z, { ancho: 12, fondo: 12, grosor: 1.5, color: '#f1c40f', borde: '#ffffff' });
      pf.y = Math.max(1, y - Math.max(0, alturaEn(esc, x + 8, z)));
      meta.y = pf.y; meta.rotY = 90;
      for (let k = 0; k < 6; k++) { const s = buscarSitio(esc, rng, (xx, zz) => alturaEn(esc, xx, zz) > 1.5); if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: 18, especie: 'palmera_datilera', densidad: 5 }); }
    } });

  registrarPlantilla({ id: 'islas', nombre: 'Archipiélago', icono: '🏝', desc: 'Islas tropicales con playas y palmeras.', tam: 2048, bioma: 'tropical',
    aplicar(esc, rng) {
      esc.terreno.agua = { activa: true, nivel: 0, color: null };
      generarTerreno(esc, { tipo: 'archipielago', escala: 420, altura: 60, octavas: 6, base: -6 });
      for (let k = 0; k < 16; k++) { const s = buscarSitio(esc, rng, (x, z) => { const h = alturaEn(esc, x, z); return h > 3 && h < 30; }); if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: rng.int(20, 60), especie: 'palmera_datilera', densidad: rng.range(2, 6) }); }
    } });

  registrarPlantilla({ id: 'montanas', nombre: 'Cordillera', icono: '🏔', desc: 'Montañas escarpadas con cumbres nevadas y un valle.', tam: 4096, bioma: 'templado',
    aplicar(esc, rng) {
      esc.terreno.agua = { activa: true, nivel: 8, color: null };
      generarTerreno(esc, { tipo: 'montanas', escala: 1100, altura: 420, octavas: 7 });
      for (let k = 0; k < 18; k++) { const s = buscarSitio(esc, rng, (x, z) => { const h = alturaEn(esc, x, z); return h > 12 && h < 150; }); if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: rng.int(60, 160), especie: rng.pick(['pinsapo', 'pino_pinonero']), densidad: rng.range(1.5, 4) }); }
    } });

  registrarPlantilla({ id: 'desierto', nombre: 'Desierto', icono: '🏜', desc: 'Dunas, mesetas rocosas y un oasis.', tam: 2048, bioma: 'desierto',
    aplicar(esc, rng) {
      generarTerreno(esc, { tipo: 'dunas', escala: 500, altura: 50, octavas: 5 });
      const oasis = buscarSitio(esc, rng, () => true);
      if (oasis) { crearElemento(esc, 'lago', oasis.x, oasis.z, { radio: 35, color: '#2b8a8f' }); crearElemento(esc, 'bosque', oasis.x, oasis.z, { radio: 60, especie: 'palmera_datilera', densidad: 2 }); }
      for (let k = 0; k < 12; k++) { const s = buscarSitio(esc, rng, () => true); if (s) crearElemento(esc, 'bosque', s.x, s.z, { radio: rng.int(30, 80), especie: 'cactus', densidad: 0.6, rocas: 0.4 }); }
    } });

  registrarPlantilla({ id: 'volcan', nombre: 'Volcán', icono: '🌋', desc: 'Isla volcánica con cráter, ceniza y roca.', tam: 2048, bioma: 'volcanico',
    aplicar(esc) {
      esc.terreno.agua = { activa: true, nivel: 3, color: null };
      generarTerreno(esc, { tipo: 'crater', escala: 300, altura: 260, octavas: 5 });
    } });

  // Crea un escenario a partir de una plantilla
  function crear(opts) {
    opts = opts || {};
    const pl = PLANTILLAS[opts.plantilla || 'vacio'] || PLANTILLAS.vacio;
    const semilla = opts.semilla || Math.floor(Math.random() * 99999) + 1;
    const esc = crearVacio(Object.assign({}, opts, { semilla, tam: opts.tam || pl.tam || 1024, bioma: opts.bioma || pl.bioma || 'templado', plantilla: pl.id }));
    esc.terreno.gen.semilla = semilla;
    pl.aplicar(esc, crearAzar(semilla * 31 + 7));
    if (opts.nombre) esc.nombre = opts.nombre; else esc.nombre = pl.nombre + ' ' + semilla;
    return esc;
  }

  // ---------------------------------------------------------------------------
  // 9. Guardado: a objeto JSON y de vuelta
  // ---------------------------------------------------------------------------
  function serializar(esc, opts) {
    opts = opts || {};
    const o = Object.assign({}, esc);
    o.terreno = Object.assign({}, esc.terreno, { alturas: f32ABase64(esc.terreno.alturas), materiales: bytesABase64(esc.terreno.materiales),
      vegetacion: esc.terreno.vegetacion ? bytesABase64(esc.terreno.vegetacion) : undefined });
    o.caminos = copiaProfunda(esc.caminos);
    o.elementos = copiaProfunda(esc.elementos);
    o.glbs = {};
    for (const [k, v] of Object.entries(esc.glbs || {})) {
      o.glbs[k] = { nombre: v.nombre, tam: v.tam || 0 };
      if (opts.modelos && opts.modelos[k]) o.glbs[k].bytes = opts.modelos[k];
    }
    o.actualizado = new Date().toISOString();
    return o;
  }

  function deserializar(o) {
    if (typeof o === 'string') o = JSON.parse(o);
    if (!o || o.format !== FORMATO) throw new Error('No es un archivo de escenario (format = "' + FORMATO + '")');
    if ((o.version | 0) > VERSION) throw new Error('El escenario es de una versión más nueva (' + o.version + ')');
    const esc = crearVacio({ tam: o.terreno.tam, res: o.terreno.res, id: o.id });
    Object.assign(esc, copiaProfunda(Object.assign({}, o, { terreno: undefined, glbs: undefined })));
    const t = o.terreno;
    Object.assign(esc.terreno, copiaProfunda(Object.assign({}, t, { alturas: undefined, materiales: undefined, vegetacion: undefined })));
    const n = t.res * t.res;
    esc.terreno.alturas = typeof t.alturas === 'string' ? base64AF32(t.alturas) : new Float32Array(t.alturas || n);
    esc.terreno.materiales = typeof t.materiales === 'string' ? base64ABytes(t.materiales) : new Uint8Array(t.materiales || n);
    esc.terreno.vegetacion = typeof t.vegetacion === 'string' ? base64ABytes(t.vegetacion) : new Uint8Array(n);
    if (esc.terreno.alturas.length !== n || esc.terreno.materiales.length !== n || esc.terreno.vegetacion.length !== n) throw new Error('El terreno no tiene el tamaño esperado');
    esc.terreno.agua = Object.assign({ activa: false, nivel: 0, color: null }, t.agua || {});
    esc.ambiente = Object.assign(crearVacio().ambiente, o.ambiente || {});
    esc.enlaces = Object.assign({ rpgBase: RPG_BASE }, o.enlaces || {});
    esc.caminos = (o.caminos || []).map(c => Object.assign({ tramos: [], barreras: [] }, c)); esc.elementos = o.elementos || [];
    esc.glbs = {};
    const modelos = {};
    for (const [k, v] of Object.entries(o.glbs || {})) { esc.glbs[k] = { nombre: v.nombre, tam: v.tam || 0 }; if (v.bytes) modelos[k] = v.bytes; }
    // nextId seguro aunque el archivo venga editado a mano
    let max = esc.nextId | 0;
    for (const e of esc.elementos.concat(esc.caminos)) { const m = /_(\d+)$/.exec(e.id || ''); if (m) max = Math.max(max, +m[1] + 1); }
    esc.nextId = max;
    return { escenario: esc, modelos };
  }

  // Cambia la resolución o el tamaño del terreno remuestreando alturas y materiales
  function remuestrear(esc, res, tam) {
    const t = esc.terreno;
    tam = tam || t.tam; res = res || t.res;
    const viejo = { terreno: { tam: t.tam, res: t.res, alturas: t.alturas, materiales: t.materiales } };
    const nh = new Float32Array(res * res), nm = new Uint8Array(res * res), nv = new Uint8Array(res * res);
    const vv = t.vegetacion || new Uint8Array(t.res * t.res);
    for (let j = 0; j < res; j++) for (let i = 0; i < res; i++) {
      const x = -tam / 2 + i * tam / (res - 1), z = -tam / 2 + j * tam / (res - 1);
      if (dentro(viejo, x, z)) {
        nh[j * res + i] = alturaEn(viejo, x, z);
        const g = aRejilla(viejo, x, z);
        nm[j * res + i] = t.materiales[Math.round(g.gj) * t.res + Math.round(g.gi)];
        nv[j * res + i] = vv[Math.round(g.gj) * t.res + Math.round(g.gi)];
      } else nh[j * res + i] = alturaEn(viejo, x, z);
    }
    t.tam = tam; t.res = res; t.alturas = nh; t.materiales = nm; t.vegetacion = nv;
    return esc;
  }

  const API = {
    FORMATO, VERSION, RPG_BASE, MATERIALES, BIOMAS, TIPOS, GRUPOS, PLANTILLAS, TIPOS_TERRENO, TIPOS_CAMINO, ESPECIES, ESTILOS_PUEBLO, ARBOLES_GLB, MEZCLA_BIOMA, registrarArbolGlb,
    mulberry32, crearAzar, crearRuido, hashTexto, clamp, lerp,
    registrarTipo, registrarPlantilla, leerRuta, escribirRuta, cfgPuebloPorDefecto, radioPueblo,
    crearVacio, crear, generarTerreno, paso, idx, xDe, aRejilla, dentro, alturaEn, sueloEn, pendienteIdx, rangoAlturas, rangoCache, olvidarRango,
    materialAuto, materialEn, esculpir, pintar, allanarArea, caida,
    PRADERA, VEG_NADA, codVegetacion, decodVegetacion, vegetacionEn, pintarVegetacion,
    TIPOS_BARRERA, LADOS, largoCamino, enTramo, superficieEn, proyectarEnCamino, caminoEn,
    crearCamino, muestrearCamino, rasante, ajustarTerrenoACamino, materialCamino, distanciaACamino,
    dentroTerrenoPueblo, atravesarPueblo,
    PUENTES, excavarLago, crucesCaminoRio, ajustarPuenteACamino, ponerPuentes, puentesDeCamino,
    esRio, profundidadRio, nivelesRio, mitadTerrenoPueblo, puntoSalidaPueblo, anguloLocalPueblo, conectarCaminosPueblo,
    crearElemento, buscarElemento, buscarCamino, quitar, duplicarElemento, radioElemento, prepararPueblo, copiaProfunda,
    serializar, deserializar, remuestrear, bytesABase64, base64ABytes
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  else raiz.Escenario = API;
})(typeof window !== 'undefined' ? window : globalThis);
