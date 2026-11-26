// Lógica de carrera: salida, cuenta atrás, detección ordenada de puntos de control, meta y récords en localStorage.
const CLAVE_RECORDS = 'rallys.records.v1';

function cargarTodosRecords() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_RECORDS) || '{}');
  } catch {
    return {};
  }
}

function guardarRecord(clave, tiempoMs) {
  const todos = cargarTodosRecords();
  if (todos[clave] == null || tiempoMs < todos[clave]) {
    todos[clave] = tiempoMs;
    try { localStorage.setItem(CLAVE_RECORDS, JSON.stringify(todos)); } catch { /* sin cuota */ }
    return true;
  }
  return false;
}

export function formatearTiempo(ms) {
  if (ms == null || !Number.isFinite(ms)) return '--:--.--';
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalS = Math.floor(totalCs / 100);
  const s = totalS % 60;
  const m = Math.floor(totalS / 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

/**
 * Comprueba si el segmento (x0,z0)->(x1,z1) cruza la línea de puerta centrada en (px,pz),
 * con orientación rotY (grados) y ancho total. También acepta proximidad directa dentro de la puerta.
 */
function cruzaPuerta(x0, z0, x1, z1, puerta) {
  const rad = (puerta.rotY || 0) * Math.PI / 180;
  const fx = Math.sin(rad), fz = Math.cos(rad); // dirección normal de paso
  const rx = Math.cos(rad), rz = -Math.sin(rad); // vector a lo largo de la puerta
  const mitad = (puerta.ancho || 12) * 0.58;

  const d0 = (x0 - puerta.x) * fx + (z0 - puerta.z) * fz;
  const d1 = (x1 - puerta.x) * fx + (z1 - puerta.z) * fz;
  const l0 = (x0 - puerta.x) * rx + (z0 - puerta.z) * rz;
  const l1 = (x1 - puerta.x) * rx + (z1 - puerta.z) * rz;

  // Cruce de plano en sentido hacia delante (d0 <= 0 && d1 >= 0) o cualquier sentido si va rápido
  if ((d0 <= 0 && d1 >= 0) || (d0 >= 0 && d1 <= 0)) {
    const denom = d1 - d0;
    const t = Math.abs(denom) > 1e-6 ? -d0 / denom : 0.5;
    const lat = l0 + (l1 - l0) * t;
    if (Math.abs(lat) <= mitad) return true;
  }
  // Respaldo por proximidad inmediata al centro de la puerta
  return Math.abs(d1) < 2.2 && Math.abs(l1) <= mitad;
}

export class GestorCarrera {
  constructor(circuito, idEscenario, idCoche) {
    this.circuito = circuito;
    this.idEscenario = idEscenario;
    this.idCoche = idCoche;
    this.reiniciar();
  }

  claveRecord() {
    return `${this.idEscenario}::${this.idCoche}`;
  }

  reiniciar(conCuentaAtras = true) {
    this.fase = conCuentaAtras ? 'cuenta' : 'corriendo'; // 'cuenta' | 'corriendo' | 'meta'
    this.cuentaSeg = conCuentaAtras ? 3.0 : 0;
    this.ultimoNumeroCuenta = 4;

    this.vuelta = 1;
    this.tiempoVueltaMs = 0;
    this.tiempoTotalMs = 0;
    this.ultimaVueltaMs = null;
    this.siguienteControlIdx = 0;
    this.parciales = [];
    this.mejoresParciales = [];
    this.mejorTiempoMs = cargarTodosRecords()[this.claveRecord()] ?? null;
    this.nuevoRecord = false;
    this.cruzadoMetaSalida = false;

    this._prevX = this.circuito.salida.x;
    this._prevZ = this.circuito.salida.z;
    this.eventos = [];
  }

  cambiarCoche(idCoche) {
    this.idCoche = idCoche;
    this.mejorTiempoMs = cargarTodosRecords()[this.claveRecord()] ?? null;
  }

  saltarCuentaAtras() {
    this.fase = 'corriendo';
    this.cuentaSeg = 0;
    this.ultimoNumeroCuenta = 0;
  }

  actualizar(dt, x, z) {
    this.eventos = [];

    if (this.fase === 'cuenta') {
      this.cuentaSeg -= dt;
      const num = Math.ceil(this.cuentaSeg);
      if (num < this.ultimoNumeroCuenta && num >= 1 && num <= 3) {
        this.ultimoNumeroCuenta = num;
        this.eventos.push({ tipo: 'cuenta', valor: num });
      }
      if (this.cuentaSeg <= 0) {
        this.fase = 'corriendo';
        this.cuentaSeg = 0;
        this.eventos.push({ tipo: 'salida' });
      }
      this._prevX = x;
      this._prevZ = z;
      return this.eventos;
    }

    const ms = dt * 1000;
    this.tiempoVueltaMs += ms;
    this.tiempoTotalMs += ms;

    const controles = this.circuito.controles || [];
    const meta = this.circuito.meta;

    // 1. Siguiente punto de control obligatorio en orden
    if (this.siguienteControlIdx < controles.length) {
      const cp = controles[this.siguienteControlIdx];
      if (cruzaPuerta(this._prevX, this._prevZ, x, z, cp)) {
        const idx = this.siguienteControlIdx;
        const tParcial = this.tiempoVueltaMs;
        const mejorP = this.mejoresParciales[idx];
        const delta = mejorP != null ? tParcial - mejorP : null;
        if (mejorP == null || tParcial < mejorP) this.mejoresParciales[idx] = tParcial;
        this.parciales[idx] = tParcial;
        this.siguienteControlIdx++;
        this.eventos.push({
          tipo: 'checkpoint',
          indice: idx + 1,
          total: controles.length,
          nombre: cp.nombre,
          tiempoMs: tParcial,
          deltaMs: delta
        });
      }
    } else if (meta && cruzaPuerta(this._prevX, this._prevZ, x, z, meta)) {
      // 2. Meta tras haber pasado todos los puntos de control en orden
      const tiempoVuelta = this.tiempoVueltaMs;
      this.ultimaVueltaMs = tiempoVuelta;
      const esRecord = guardarRecord(this.claveRecord(), tiempoVuelta);
      if (esRecord) {
        this.mejorTiempoMs = tiempoVuelta;
        this.nuevoRecord = true;
      } else {
        this.nuevoRecord = false;
      }

      this.eventos.push({
        tipo: 'vuelta',
        vuelta: this.vuelta,
        tiempoMs: tiempoVuelta,
        esRecord
      });

      this.vuelta++;
      this.tiempoVueltaMs = 0;
      this.siguienteControlIdx = 0;
      this.parciales = [];
    }

    this._prevX = x;
    this._prevZ = z;
    return this.eventos;
  }

  siguienteObjetivo() {
    const controles = this.circuito.controles || [];
    if (this.siguienteControlIdx < controles.length) {
      return { tipo: 'checkpoint', indice: this.siguienteControlIdx + 1, total: controles.length, ...controles[this.siguienteControlIdx] };
    }
    if (this.circuito.meta) {
      return { tipo: 'meta', nombre: 'Meta', ...this.circuito.meta };
    }
    return null;
  }
}
