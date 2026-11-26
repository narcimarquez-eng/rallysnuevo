// Almacén del navegador (IndexedDB): escenarios guardados y modelos .glb importados.
// Lo comparten el editor y el visor (mismo origen). Todo asíncrono.
(function (raiz) {
  'use strict';
  const NOMBRE = 'escenarios-3d', VERSION = 1;
  let dbP = null;
  function abrir() {
    if (dbP) return dbP;
    dbP = new Promise((ok, mal) => {
      const req = indexedDB.open(NOMBRE, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('escenarios')) db.createObjectStore('escenarios', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('resumen')) db.createObjectStore('resumen', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('modelos')) db.createObjectStore('modelos', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('ajustes')) db.createObjectStore('ajustes', { keyPath: 'k' });
      };
      req.onsuccess = () => ok(req.result);
      req.onerror = () => mal(req.error);
    });
    return dbP;
  }
  function tx(almacen, modo, fn) {
    return abrir().then(db => new Promise((ok, mal) => {
      const t = db.transaction(almacen, modo);
      let res;
      const r = fn(t);
      if (r && 'onsuccess' in r) r.onsuccess = () => { res = r.result; };
      t.oncomplete = () => ok(res);
      t.onerror = () => mal(t.error);
      t.onabort = () => mal(t.error || new Error('Transacción cancelada'));
    }));
  }
  const Almacen = {
    // datos: escenario serializado (Escenario.serializar)
    guardarEscenario(datos) {
      const resumen = { id: datos.id, nombre: datos.nombre, plantilla: datos.plantilla, actualizado: datos.actualizado || new Date().toISOString(),
        tam: datos.terreno && datos.terreno.tam, elementos: (datos.elementos || []).length };
      return tx(['escenarios', 'resumen'], 'readwrite', t => { t.objectStore('escenarios').put(datos); t.objectStore('resumen').put(resumen); });
    },
    cargarEscenario(id) { return tx('escenarios', 'readonly', t => t.objectStore('escenarios').get(id)); },
    listar() { return tx('resumen', 'readonly', t => t.objectStore('resumen').getAll()).then(l => (l || []).sort((a, b) => String(b.actualizado).localeCompare(String(a.actualizado)))); },
    borrarEscenario(id) { return tx(['escenarios', 'resumen'], 'readwrite', t => { t.objectStore('escenarios').delete(id); t.objectStore('resumen').delete(id); }); },
    guardarModelo(id, nombre, bytes) { return tx('modelos', 'readwrite', t => t.objectStore('modelos').put({ id, nombre, bytes, tam: bytes.byteLength })); },
    cargarModelo(id) { return tx('modelos', 'readonly', t => t.objectStore('modelos').get(id)).then(r => r ? r.bytes : null); },
    listarModelos() { return tx('modelos', 'readonly', t => t.objectStore('modelos').getAll()).then(l => (l || []).map(m => ({ id: m.id, nombre: m.nombre, tam: m.tam }))); },
    borrarModelo(id) { return tx('modelos', 'readwrite', t => t.objectStore('modelos').delete(id)); },
    ajuste(k, v) {
      if (v === undefined) return tx('ajustes', 'readonly', t => t.objectStore('ajustes').get(k)).then(r => r ? r.v : undefined);
      return tx('ajustes', 'readwrite', t => t.objectStore('ajustes').put({ k, v }));
    }
  };
  raiz.Almacen = Almacen;
})(window);
