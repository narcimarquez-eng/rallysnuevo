// Carga, generación (sin editor propio) y análisis de escenarios de Mundos- (.escenario.json).
const E = window.Escenario;

export const ESCENARIOS_PREDEFINIDOS = [
  {
    id: 'rally-7711',
    nombre: 'Villarrally · Circuito Clásico',
    descripcion: 'Grava, tramo de asfalto, barro, pueblo andaluz con su iglesia, 2 puentes y vado.',
    plantilla: 'rally',
    semilla: 7711
  },
  {
    id: 'rally-2026',
    nombre: 'Sierra del Sur · Vado y Puentes',
    descripcion: 'Colinas rápidas con curvas enlazadas, vado ancho, 2 puentes y paso por pueblo.',
    plantilla: 'rally',
    semilla: 2026
  },
  {
    id: 'rally-9103',
    nombre: 'Vado del Valle · Tramo Técnico',
    descripcion: 'Trazado técnico entre bosques, lagos, 2 puentes y zonas de derrape.',
    plantilla: 'rally',
    semilla: 9103
  }
];

const cachePredefinidos = new Map();

/** Crea o recupera de caché uno de los circuitos incluidos usando las plantillas de Mundos-. */
export function obtenerEscenarioPredefinido(id) {
  const def = ESCENARIOS_PREDEFINIDOS.find(e => e.id === id) || ESCENARIOS_PREDEFINIDOS[0];
  if (cachePredefinidos.has(def.id)) return cachePredefinidos.get(def.id);
  const esc = E.crear({ plantilla: def.plantilla, semilla: def.semilla, nombre: def.nombre });
  esc.id = def.id;
  const paquete = {
    id: def.id,
    nombre: def.nombre,
    escenario: esc,
    modelos: {},
    origen: 'predefinido'
  };
  cachePredefinidos.set(def.id, paquete);
  return paquete;
}

/** Convierte un objeto JSON (.escenario.json) al formato interno de Mundos- y extrae modelos embebidos. */
export function deserializarEscenario(textoOObjeto, etiqueta = 'Escenario importado') {
  const { escenario, modelos } = E.deserializar(textoOObjeto);
  const buffers = {};
  for (const [id, bytes] of Object.entries(modelos || {})) {
    if (bytes instanceof ArrayBuffer) {
      buffers[id] = bytes;
    } else if (ArrayBuffer.isView(bytes)) {
      buffers[id] = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    }
  }
  return {
    id: escenario.id || ('imp-' + E.hashTexto(escenario.nombre || etiqueta)),
    nombre: escenario.nombre || etiqueta,
    escenario,
    modelos: buffers,
    origen: 'externo'
  };
}

/** Descarga y deserializa un archivo .escenario.json desde una URL. */
export async function cargarEscenarioDesdeUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar el escenario (${res.status})`);
  const texto = await res.text();
  return deserializarEscenario(texto, url);
}

/** Lee un File del navegador (.escenario.json) y lo deserializa. */
export async function cargarEscenarioDesdeArchivo(archivo) {
  const texto = await archivo.text();
  return deserializarEscenario(texto, archivo.name);
}

/** Devuelve el vector director unitario en el plano XZ para una rotación rotY en grados de Mundos-. */
export function vectorAdelanteDeRotY(rotYGrados) {
  const r = (rotYGrados || 0) * Math.PI / 180;
  return { x: Math.sin(r), z: Math.cos(r) };
}

/** Analiza los elementos de carrera del escenario (inicio, meta, puntos de control y trazado principal). */
export function analizarCircuito(esc) {
  const caminosConduccion = (esc.caminos || []).filter(c => !E.esRio(c) && (c.puntos || []).length >= 2);
  const inicioEl = (esc.elementos || []).find(e => e.tipo === 'inicio') || null;
  const metaEl = (esc.elementos || []).find(e => e.tipo === 'meta') || null;
  const checkpoints = (esc.elementos || [])
    .filter(e => e.tipo === 'checkpoint')
    .slice()
    .sort((a, b) => (a.props?.orden || 0) - (b.props?.orden || 0));

  // Elegir el camino principal: el más cercano a inicio/meta o el circuito cerrado más largo
  let caminoPrincipal = null;
  if (caminosConduccion.length) {
    const ref = inicioEl || metaEl;
    if (ref) {
      let mejorDist = Infinity;
      for (const c of caminosConduccion) {
        const d = E.distanciaACamino(c, ref.x, ref.z);
        if (d < mejorDist) { mejorDist = d; caminoPrincipal = c; }
      }
    }
    if (!caminoPrincipal) {
      caminoPrincipal = caminosConduccion
        .slice()
        .sort((a, b) => (b.cerrado ? 1 : 0) - (a.cerrado ? 1 : 0) || E.largoCamino(b) - E.largoCamino(a))[0];
    }
  }

  const muestras = caminoPrincipal ? E.muestrearCamino(caminoPrincipal, 2) : [];
  const largoTotal = muestras.length ? muestras[muestras.length - 1].d : 0;

  let salida;
  if (inicioEl) {
    salida = {
      x: inicioEl.x,
      z: inicioEl.z,
      rotY: inicioEl.rotY || 0,
      elemento: inicioEl
    };
  } else if (muestras.length >= 2) {
    const a = muestras[0];
    const b = muestras[1];
    salida = {
      x: a.x,
      z: a.z,
      rotY: Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI,
      elemento: null
    };
  } else {
    salida = { x: 0, z: 0, rotY: 0, elemento: null };
  }

  let meta = metaEl ? {
    x: metaEl.x,
    z: metaEl.z,
    rotY: metaEl.rotY || 0,
    ancho: metaEl.props?.ancho || 14,
    elemento: metaEl
  } : null;

  if (!meta && muestras.length >= 2) {
    const idx = caminoPrincipal.cerrado ? Math.min(muestras.length - 1, 6) : muestras.length - 1;
    const p = muestras[idx];
    const pPrev = muestras[Math.max(0, idx - 1)];
    const pNext = muestras[Math.min(muestras.length - 1, idx + 1)];
    meta = {
      x: p.x,
      z: p.z,
      rotY: Math.atan2(pNext.x - pPrev.x, pNext.z - pPrev.z) * 180 / Math.PI,
      ancho: (caminoPrincipal?.ancho || 10) + 4,
      elemento: null
    };
  }

  const controles = checkpoints.map((cp, idx) => ({
    id: cp.id,
    orden: cp.props?.orden ?? (idx + 1),
    nombre: cp.nombre || `Control ${idx + 1}`,
    x: cp.x,
    z: cp.z,
    rotY: cp.rotY || 0,
    ancho: cp.props?.ancho || 12,
    elemento: cp
  }));

  return {
    caminoPrincipal,
    muestras,
    largoTotal,
    cerrado: Boolean(caminoPrincipal?.cerrado),
    salida,
    meta,
    controles,
    pueblos: (esc.elementos || []).filter(e => e.tipo === 'pueblo'),
    puentes: (esc.elementos || []).filter(e => e.tipo === 'puente')
  };
}
