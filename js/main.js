// Punto de entrada de Rallys divertidos: une Escena3D (Mundos-), coches (Hacer-coches-), física, carrera y HUD.
import * as THREE from 'three';
import { Escena3D } from '../vendor/mundos/js/escena-3d.js';
import {
  ESCENARIOS_PREDEFINIDOS,
  obtenerEscenarioPredefinido,
  cargarEscenarioDesdeArchivo,
  cargarEscenarioDesdeUrl,
  analizarCircuito
} from './escenarios.js';
import { COCHES_CATALOGO, crearCocheProcedural, cargarCocheGLB } from './coches.js';
import { MundoFisica } from './mundo-fisica.js';
import { SistemaColisiones } from './colisiones.js';
import { FisicaCoche } from './fisica.js';
import { GestorCarrera, formatearTiempo } from './carrera.js';
import { GestorCamaras } from './camaras.js';
import { GestorControles } from './controles.js';
import { GestorSonido } from './sonido.js';
import { SistemaParticulas, Minimapa } from './efectos.js';

const dom = {
  lienzo: document.getElementById('lienzo'),
  menu: document.getElementById('pantalla-menu'),
  hud: document.getElementById('hud'),
  estadoCarga: document.getElementById('estado-carga'),
  selEscenario: document.getElementById('sel-escenario'),
  btnAbrirEscenario: document.getElementById('btn-abrir-escenario'),
  inpArchivoEscenario: document.getElementById('inp-archivo-escenario'),
  inpUrlEscenario: document.getElementById('inp-url-escenario'),
  btnUrlEscenario: document.getElementById('btn-url-escenario'),
  resumenEscenario: document.getElementById('resumen-escenario'),
  listaCoches: document.getElementById('lista-coches'),
  btnAbrirCoche: document.getElementById('btn-abrir-coche'),
  inpArchivoCoche: document.getElementById('inp-archivo-coche'),
  chkInvertirGlb: document.getElementById('chk-invertir-glb'),
  infoCoche: document.getElementById('info-coche'),
  selCalidad: document.getElementById('sel-calidad'),
  chkSonido: document.getElementById('chk-sonido'),
  selTactil: document.getElementById('sel-tactil'),
  btnCorrer: document.getElementById('btn-correr'),
  btnReanudar: document.getElementById('btn-reanudar'),
  hudVuelta: document.getElementById('hud-vuelta'),
  hudCrono: document.getElementById('hud-crono'),
  hudMejor: document.getElementById('hud-mejor'),
  hudControl: document.getElementById('hud-control'),
  hudParcial: document.getElementById('hud-parcial'),
  minimapa: document.getElementById('minimapa'),
  btnCamara: document.getElementById('btn-camara'),
  lblCamara: document.getElementById('lbl-camara'),
  btnRecolocar: document.getElementById('btn-recolocar'),
  btnMenu: document.getElementById('btn-menu'),
  semaforo: document.getElementById('semaforo'),
  avisoCentral: document.getElementById('aviso-central'),
  hudSuperficie: document.getElementById('hud-superficie'),
  hudMarcha: document.getElementById('hud-marcha'),
  hudVelocidad: document.getElementById('hud-velocidad'),
  hudRpm: document.getElementById('hud-rpm'),
  hudDerrape: document.getElementById('hud-derrape'),
  hudMando: document.getElementById('hud-mando'),
  controlesTactiles: document.getElementById('controles-tactiles'),
  btnTIzq: document.getElementById('btn-t-izq'),
  btnTDer: document.getElementById('btn-t-der'),
  btnTGas: document.getElementById('btn-t-gas'),
  btnTFreno: document.getElementById('btn-t-freno'),
  btnTMano: document.getElementById('btn-t-mano')
};

// --- Escena Three.js ---
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
dom.lienzo.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.25, 6500);

let modelosEmbebidos = {};
let escena3d = crearEscena3D(dom.selCalidad.value);

function crearEscena3D(calidad) {
  return new Escena3D({
    scene,
    renderer,
    editor: false,
    calidad,
    etiquetas: false,
    mostrarAreas: false,
    pueblosReales: true,
    cargarModeloLocal: async id => modelosEmbebidos[id] || null,
    alCargar: pendientes => {
      dom.estadoCarga.textContent = pendientes > 0 ? `Cargando modelos (${pendientes})…` : 'Escenario listo';
    },
    alAviso: msg => mostrarAviso(msg, 3500)
  });
}

// Baliza discreta sobre el próximo punto de control o meta
const balizaGeo = new THREE.RingGeometry(2.5, 3.2, 32).rotateX(-Math.PI / 2);
const balizaMat = new THREE.MeshBasicMaterial({ color: '#ffd21f', transparent: true, opacity: 0.72, side: THREE.DoubleSide });
const balizaObjetivo = new THREE.Mesh(balizaGeo, balizaMat);
balizaObjetivo.visible = false;
scene.add(balizaObjetivo);

// --- Estado del juego ---
let paqueteEscenario = null;
let circuito = null;
let mundoFisica = null;
let colisiones = null;
let cocheActual = null;
let fisica = null;
let carrera = null;
let enCarrera = false;
let carreraIniciada = false;
let idCocheSeleccionado = COCHES_CATALOGO[0].id;
let cocheGlbPersonalizado = null; // { archivo, nombre }

const camaras = new GestorCamaras(camera, null);
const controles = new GestorControles({
  izq: dom.btnTIzq,
  der: dom.btnTDer,
  gas: dom.btnTGas,
  freno: dom.btnTFreno,
  mano: dom.btnTMano,
  camara: dom.btnCamara,
  recolocar: dom.btnRecolocar,
  pausa: dom.btnMenu
});
const sonido = new GestorSonido();
const particulas = new SistemaParticulas(scene, 240);
const minimapa = new Minimapa(dom.minimapa);

let temporizadorAviso = null;
function mostrarAviso(texto, ms = 2200) {
  dom.avisoCentral.textContent = texto;
  dom.avisoCentral.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => { dom.avisoCentral.hidden = true; }, ms);
}

let temporizadorParcial = null;
function mostrarParcial(texto, esMejor) {
  dom.hudParcial.textContent = texto;
  dom.hudParcial.className = 'parcial ' + (esMejor ? 'mejor' : 'peor');
  dom.hudParcial.hidden = false;
  clearTimeout(temporizadorParcial);
  temporizadorParcial = setTimeout(() => { dom.hudParcial.hidden = true; }, 3200);
}

function actualizarVisibilidadTactil() {
  const pref = dom.selTactil.value;
  const mostrar = pref === 'si' || (pref === 'auto' && controles.modoTactil);
  dom.controlesTactiles.hidden = !mostrar;
  document.body.classList.toggle('con-tactil', Boolean(enCarrera && mostrar));
}

// --- Carga de escenarios y coches ---
function aplicarEscenario(paquete) {
  paqueteEscenario = paquete;
  modelosEmbebidos = paquete.modelos || {};
  dom.estadoCarga.textContent = 'Construyendo terreno…';

  escena3d.construir(paquete.escenario);
  circuito = analizarCircuito(paquete.escenario);
  if (circuito.salida?.elemento && escena3d.objetos) {
    const objIni = escena3d.objetos.get(circuito.salida.elemento.id);
    if (objIni) objIni.visible = false;
  }
  mundoFisica = new MundoFisica(paquete.escenario);
  colisiones = new SistemaColisiones(paquete.escenario, mundoFisica);

  camaras.setMundo(mundoFisica);
  minimapa.configurar(paquete.escenario, circuito);

  if (cocheActual) {
    fisica = new FisicaCoche(mundoFisica, colisiones, cocheActual.specs, cocheActual.medidas);
    fisica.colocarEn(circuito.salida.x, circuito.salida.z, circuito.salida.rotY);
    cocheActual.actualizarVisual(fisica.estado, 0);
    camaras.reiniciarEn(fisica.estado);
  }

  carrera = new GestorCarrera(circuito, paquete.id, cocheActual ? cocheActual.id : idCocheSeleccionado);
  carreraIniciada = false;
  dom.btnReanudar.hidden = true;

  // Resumen informativo en el menú
  const largoKm = (circuito.largoTotal / 1000).toFixed(2);
  const nCtrl = circuito.controles.length;
  const nPuentes = circuito.puentes.length;
  const nPueblos = circuito.pueblos.length;
  dom.resumenEscenario.innerHTML =
    `<b>${paquete.nombre}</b><br>` +
    `Longitud: <b>${largoKm} km</b> · Controles: <b>${nCtrl}</b> · Puentes: <b>${nPuentes}</b> · Pueblos: <b>${nPueblos}</b><br>` +
    `Récord actual: <b>${formatearTiempo(carrera.mejorTiempoMs)}</b>`;

  dom.estadoCarga.textContent = 'Escenario listo';
}

function instalarCoche(coche) {
  if (cocheActual) scene.remove(cocheActual.raiz);
  cocheActual = coche;
  scene.add(cocheActual.raiz);

  if (mundoFisica && colisiones) {
    if (!fisica) {
      fisica = new FisicaCoche(mundoFisica, colisiones, cocheActual.specs, cocheActual.medidas);
    } else {
      fisica.actualizarConfig(cocheActual.specs, cocheActual.medidas);
    }
    fisica.colocarEn(circuito.salida.x, circuito.salida.z, circuito.salida.rotY);
    cocheActual.actualizarVisual(fisica.estado, 0);
    camaras.reiniciarEn(fisica.estado);
  }
  if (carrera) {
    carrera.cambiarCoche(cocheActual.id);
    if (dom.resumenEscenario && paqueteEscenario) {
      const largoKm = (circuito.largoTotal / 1000).toFixed(2);
      dom.resumenEscenario.innerHTML =
        `<b>${paqueteEscenario.nombre}</b><br>` +
        `Longitud: <b>${largoKm} km</b> · Controles: <b>${circuito.controles.length}</b> · Puentes: <b>${circuito.puentes.length}</b> · Pueblos: <b>${circuito.pueblos.length}</b><br>` +
        `Récord actual: <b>${formatearTiempo(carrera.mejorTiempoMs)}</b>`;
    }
  }
  actualizarInfoCoche();
}

function seleccionarCocheCatalogo(id) {
  idCocheSeleccionado = id;
  cocheGlbPersonalizado = null;
  for (const btn of dom.listaCoches.querySelectorAll('.tarjeta-coche')) {
    btn.classList.toggle('activa', btn.dataset.id === id);
  }
  instalarCoche(crearCocheProcedural(id));
}

async function seleccionarCocheGLB(origen, nombre) {
  try {
    dom.estadoCarga.textContent = 'Importando coche .glb…';
    const coche = await cargarCocheGLB(origen, {
      nombre,
      invertirZ: dom.chkInvertirGlb.checked
    });
    cocheGlbPersonalizado = { origen, nombre };
    for (const btn of dom.listaCoches.querySelectorAll('.tarjeta-coche')) {
      btn.classList.remove('activa');
    }
    instalarCoche(coche);
    dom.estadoCarga.textContent = 'Coche .glb listo';
  } catch (e) {
    console.error(e);
    dom.estadoCarga.textContent = 'Error en .glb';
    mostrarAviso('No se pudo cargar el coche .glb: ' + e.message, 4000);
  }
}

function actualizarInfoCoche() {
  if (!cocheActual) return;
  const s = cocheActual.specs;
  const m = cocheActual.medidas;
  const extra = cocheActual.esGLB
    ? `<br>Modelo .glb importado · Ruedas detectadas: <b>${cocheActual.ruedasDetectadas}</b> · ${m.largo.toFixed(2)}×${m.ancho.toFixed(2)} m`
    : `<br>${COCHES_CATALOGO.find(c => c.id === cocheActual.id)?.descripcion || ''}`;
  dom.infoCoche.innerHTML =
    `<b>${cocheActual.nombre}</b> · ${s.potencia} CV · ${s.masa} kg · Vel. máx ${s.velMaxKmh} km/h${extra}`;
}

// --- Navegación menú <-> carrera ---
function empezarCarrera() {
  sonido.iniciar();
  sonido.setActivo(dom.chkSonido.checked);
  if (!fisica || !circuito) return;

  fisica.colocarEn(circuito.salida.x, circuito.salida.z, circuito.salida.rotY);
  cocheActual.actualizarVisual(fisica.estado, 0);
  camaras.reiniciarEn(fisica.estado);
  carrera.reiniciar(true);

  enCarrera = true;
  carreraIniciada = true;
  dom.menu.hidden = true;
  dom.hud.hidden = false;
  dom.btnReanudar.hidden = false;
  actualizarVisibilidadTactil();
  actualizarHud(0);
}

function reanudarCarrera() {
  if (!carreraIniciada) return empezarCarrera();
  sonido.iniciar();
  sonido.setActivo(dom.chkSonido.checked);
  enCarrera = true;
  dom.menu.hidden = true;
  dom.hud.hidden = false;
  actualizarVisibilidadTactil();
}

function abrirMenu() {
  enCarrera = false;
  controles.limpiarTactil();
  sonido.actualizar(fisica?.estado || { rpm: 900, velocidadKmh: 0 }, 0, true);
  dom.hud.hidden = true;
  dom.menu.hidden = false;
}

// --- Construcción inicial de UI ---
function inicializarUI() {
  for (const def of ESCENARIOS_PREDEFINIDOS) {
    const opt = document.createElement('option');
    opt.value = def.id;
    opt.textContent = def.nombre;
    dom.selEscenario.appendChild(opt);
  }

  for (const c of COCHES_CATALOGO) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tarjeta-coche' + (c.id === idCocheSeleccionado ? ' activa' : '');
    btn.dataset.id = c.id;
    btn.innerHTML =
      `<span class="coche-nombre"><span class="punto-color" style="background:${c.color}"></span>${c.nombre}</span>` +
      `<span class="coche-etiq">${c.etiqueta}</span>`;
    btn.addEventListener('click', () => seleccionarCocheCatalogo(c.id));
    dom.listaCoches.appendChild(btn);
  }

  dom.selEscenario.addEventListener('change', () => {
    aplicarEscenario(obtenerEscenarioPredefinido(dom.selEscenario.value));
  });

  dom.btnAbrirEscenario.addEventListener('click', () => dom.inpArchivoEscenario.click());
  dom.inpArchivoEscenario.addEventListener('change', async () => {
    const f = dom.inpArchivoEscenario.files?.[0];
    if (!f) return;
    try {
      const paq = await cargarEscenarioDesdeArchivo(f);
      aplicarEscenario(paq);
    } catch (e) {
      mostrarAviso('Escenario no válido: ' + e.message, 4000);
    }
    dom.inpArchivoEscenario.value = '';
  });

  dom.btnUrlEscenario.addEventListener('click', async () => {
    const url = dom.inpUrlEscenario.value.trim();
    if (!url) return;
    try {
      dom.estadoCarga.textContent = 'Descargando escenario…';
      const paq = await cargarEscenarioDesdeUrl(url);
      aplicarEscenario(paq);
    } catch (e) {
      dom.estadoCarga.textContent = 'Error de carga';
      mostrarAviso('No se pudo cargar la URL: ' + e.message, 4000);
    }
  });

  dom.btnAbrirCoche.addEventListener('click', () => dom.inpArchivoCoche.click());
  dom.inpArchivoCoche.addEventListener('change', async () => {
    const f = dom.inpArchivoCoche.files?.[0];
    if (!f) return;
    await seleccionarCocheGLB(f, f.name);
    dom.inpArchivoCoche.value = '';
  });

  dom.chkInvertirGlb.addEventListener('change', async () => {
    if (cocheGlbPersonalizado) {
      await seleccionarCocheGLB(cocheGlbPersonalizado.origen, cocheGlbPersonalizado.nombre);
    }
  });

  dom.selCalidad.addEventListener('change', () => {
    const cal = dom.selCalidad.value;
    renderer.shadowMap.enabled = cal !== 'baja';
    if (escena3d) {
      scene.remove(escena3d.raiz);
      scene.remove(escena3d.cielo);
      scene.remove(escena3d.sol);
      scene.remove(escena3d.sol.target);
    }
    escena3d = crearEscena3D(cal);
    if (paqueteEscenario) aplicarEscenario(paqueteEscenario);
  });

  dom.chkSonido.addEventListener('change', () => {
    sonido.setActivo(dom.chkSonido.checked);
  });

  dom.selTactil.addEventListener('change', actualizarVisibilidadTactil);
  dom.btnCorrer.addEventListener('click', empezarCarrera);
  dom.btnReanudar.addEventListener('click', reanudarCarrera);

  controles.alPulsar('camara', () => {
    const m = camaras.siguienteModo();
    dom.lblCamara.textContent = m.nombre;
    mostrarAviso('Cámara: ' + m.nombre, 1200);
  });
  controles.alPulsar('recolocar', () => {
    if (!enCarrera || !fisica) return;
    fisica.recolocarSeguro(circuito);
    mostrarAviso('Coche recolocado en pista', 1400);
  });
  controles.alPulsar('pausa', () => {
    if (enCarrera) abrirMenu();
    else if (carreraIniciada) reanudarCarrera();
  });

  // Arrastrar y soltar .escenario.json o .glb sobre la pantalla
  window.addEventListener('dragover', e => e.preventDefault());
  window.addEventListener('drop', async e => {
    e.preventDefault();
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    if (/\.glb$/i.test(f.name)) {
      await seleccionarCocheGLB(f, f.name);
    } else if (/\.json$/i.test(f.name)) {
      try {
        aplicarEscenario(await cargarEscenarioDesdeArchivo(f));
      } catch (err) {
        mostrarAviso('Error al leer escenario: ' + err.message, 4000);
      }
    }
  });
}

function actualizarHud() {
  if (!fisica || !carrera) return;
  const e = fisica.estado;

  dom.hudVuelta.textContent = String(carrera.vuelta);
  dom.hudCrono.textContent = formatearTiempo(carrera.tiempoVueltaMs);
  dom.hudMejor.textContent = formatearTiempo(carrera.mejorTiempoMs);
  const totCtrl = circuito.controles.length;
  dom.hudControl.textContent = `${Math.min(carrera.siguienteControlIdx, totCtrl)}/${totCtrl}`;

  dom.hudVelocidad.textContent = String(Math.round(e.velocidadKmh));
  dom.hudMarcha.textContent = String(e.marcha);
  dom.hudRpm.style.width = `${Math.max(6, Math.min(100, ((e.rpm - 900) / 6500) * 100))}%`;
  dom.hudSuperficie.textContent = e.enPuente ? 'Puente' : e.nombreSuperficie;
  dom.hudDerrape.hidden = !e.derrapando;
  dom.hudMando.hidden = !controles.mandoActivo;
  dom.lblCamara.textContent = camaras.modoActual().nombre;

  if (carrera.fase === 'cuenta') {
    const n = Math.max(1, Math.ceil(carrera.cuentaSeg));
    dom.semaforo.textContent = String(n);
    dom.semaforo.hidden = false;
  } else {
    dom.semaforo.hidden = true;
  }

  const obj = carrera.siguienteObjetivo();
  if (obj && mundoFisica) {
    balizaObjetivo.visible = true;
    const yObj = mundoFisica.muestrear(obj.x, obj.z).y;
    balizaObjetivo.position.set(obj.x, yObj + 0.28, obj.z);
    balizaMat.color.set(obj.tipo === 'meta' ? '#ffffff' : '#ffd21f');
  } else {
    balizaObjetivo.visible = false;
  }

  minimapa.dibujar(e, obj);
}

// --- Bucle principal ---
let ultimoTiempo = performance.now();
function bucle(ahora) {
  requestAnimationFrame(bucle);
  const dt = Math.min(0.05, Math.max(0.001, (ahora - ultimoTiempo) / 1000));
  ultimoTiempo = ahora;

  if (colisiones && escena3d) {
    colisiones.sincronizarEscena(escena3d, THREE);
  }

  if (enCarrera && fisica && cocheActual && carrera) {
    const entrada = controles.leer();

    // En cuenta atrás solo permite acelerar en vacío; cuando empieza, conducción total
    const entradaFisica = carrera.fase === 'cuenta'
      ? { acelerar: 0, frenar: 1, giro: entrada.giro, frenoMano: true }
      : entrada;

    const estado = fisica.avanzar(dt, entradaFisica);
    if (carrera.fase === 'cuenta') {
      estado.rpm = 950 + entrada.acelerar * 4800;
    }

    cocheActual.actualizarVisual(estado, dt);
    camaras.actualizar(dt, estado, cocheActual);
    particulas.actualizarDesdeCoche(dt, estado, cocheActual.medidas);
    sonido.actualizar(estado, entrada.acelerar, false);

    const eventos = carrera.actualizar(dt, estado.x, estado.z);
    for (const ev of eventos) {
      if (ev.tipo === 'cuenta') {
        sonido.sonarCuenta(ev.valor);
      } else if (ev.tipo === 'salida') {
        sonido.sonarCuenta(0);
        mostrarAviso('¡YA!', 950);
      } else if (ev.tipo === 'checkpoint') {
        sonido.sonarCheckpoint();
        const deltaTxt = ev.deltaMs != null
          ? ` (${ev.deltaMs <= 0 ? '' : '+'}${(ev.deltaMs / 1000).toFixed(2)}s)`
          : '';
        mostrarAviso(`Control ${ev.indice}/${ev.total}`, 1500);
        mostrarParcial(`P${ev.indice}: ${formatearTiempo(ev.tiempoMs)}${deltaTxt}`, ev.deltaMs == null || ev.deltaMs <= 0);
      } else if (ev.tipo === 'vuelta') {
        sonido.sonarMeta();
        const txt = ev.esRecord
          ? `🏆 ¡Nuevo récord! ${formatearTiempo(ev.tiempoMs)}`
          : `🏁 Vuelta ${ev.vuelta}: ${formatearTiempo(ev.tiempoMs)}`;
        mostrarAviso(txt, 3200);
      }
    }

    if (estado.ultimoImpacto) {
      sonido.sonarImpacto(estado.ultimoImpacto.intensidad);
    }

    actualizarHud();
  } else if (fisica && cocheActual) {
    camaras.actualizarMenu(dt, { x: fisica.estado.x, y: fisica.estado.y, z: fisica.estado.z });
  }

  escena3d.actualizar(dt, camera);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  actualizarVisibilidadTactil();
});

// --- API de diagnóstico y pruebas Playwright ---
window.__RALLY__ = {
  estado() {
    return {
      enCarrera,
      escenario: paqueteEscenario?.id,
      coche: cocheActual?.id,
      ruedasDetectadas: cocheActual?.ruedasDetectadas ?? 4,
      camara: camaras.modoActual().id,
      fisica: fisica ? { ...fisica.estado } : null,
      carrera: carrera ? {
        fase: carrera.fase,
        vuelta: carrera.vuelta,
        tiempoVueltaMs: carrera.tiempoVueltaMs,
        mejorTiempoMs: carrera.mejorTiempoMs,
        siguienteControlIdx: carrera.siguienteControlIdx,
        totalControles: circuito?.controles?.length || 0
      } : null,
      colisiones: colisiones ? {
        totalObstaculos: colisiones.obstaculos.length,
        pueblosIndexados: Array.from(colisiones.pueblosIndexados),
        glbsIndexados: Array.from(colisiones.glbsIndexados)
      } : null
    };
  },
  empezarSinCuenta() {
    if (!enCarrera) empezarCarrera();
    carrera.saltarCuentaAtras();
  },
  setCamara(id) {
    const m = camaras.setModo(id);
    dom.lblCamara.textContent = m.nombre;
    return m;
  },
  teletransportar(x, z, rotY = 0) {
    if (!fisica) return;
    fisica.colocarEn(x, z, rotY);
    cocheActual.actualizarVisual(fisica.estado, 0);
    camaras.reiniciarEn(fisica.estado);
  },
  irAPuente(indice = 0) {
    const pu = mundoFisica?.puentes?.[indice];
    if (!pu) return null;
    // Colocar justo antes de la entrada del puente apuntando hacia el puente
    const distInicio = -(pu.mitadLargo + pu.rampa * 0.55);
    const x = pu.cx + pu.dirX * distInicio;
    const z = pu.cz + pu.dirZ * distInicio;
    const rot = Math.atan2(pu.dirX, pu.dirZ) * 180 / Math.PI;
    this.teletransportar(x, z, rot);
    return { x, z, rot, puente: pu };
  },
  irAVado() {
    if (!circuito?.muestras?.length || !mundoFisica) return null;
    const mu = circuito.muestras;
    for (let i = 0; i < mu.length; i++) {
      const m = mundoFisica.muestrear(mu[i].x, mu[i].z);
      if (!m.enPuente && m.profundidadAgua > 0.08) {
        const prev = mu[Math.max(0, i - 6)];
        const sig = mu[Math.min(mu.length - 1, i + 2)];
        const rot = Math.atan2(sig.x - prev.x, sig.z - prev.z) * 180 / Math.PI;
        this.teletransportar(prev.x, prev.z, rot);
        return { vadoX: mu[i].x, vadoZ: mu[i].z, salidaX: prev.x, salidaZ: prev.z, rot };
      }
    }
    return null;
  },
  irAPueblo() {
    const p = circuito?.pueblos?.[0];
    if (!p || !circuito?.muestras?.length) return null;
    const iglesia = (paqueteEscenario?.escenario?.elementos || []).find(
      e => e.tipo === 'glb' && /iglesia/i.test(e.props?.modelo || e.nombre || '')
    );
    // Colocar en la plaza (a unos metros de la fuente central) mirando hacia la iglesia y el pueblo
    const targetX = iglesia ? iglesia.x : p.x;
    const targetZ = iglesia ? iglesia.z : p.z + 30;
    const dx = targetX - p.x, dz = targetZ - p.z;
    const dl = Math.hypot(dx, dz) || 1;
    const ux = dx / dl, uz = dz / dl;
    // Empezar a un lado de la plaza (radio ~12 m, lejos de la fuente central de radio 4m) mirando hacia la iglesia
    const px = p.x - uz * 11 - ux * 8;
    const pz = p.z + ux * 11 - uz * 8;
    const rot = Math.atan2(targetX - px, targetZ - pz) * 180 / Math.PI;
    this.teletransportar(px, pz, rot);
    return { pueblo: p, x: px, z: pz, rot };
  },
  irAControl(indice = 0) {
    const cp = circuito?.controles?.[indice];
    if (!cp) return null;
    const rad = (cp.rotY || 0) * Math.PI / 180;
    const x = cp.x - Math.sin(rad) * 16;
    const z = cp.z - Math.cos(rad) * 16;
    this.teletransportar(x, z, cp.rotY || 0);
    return cp;
  },
  irAMeta() {
    const meta = circuito?.meta;
    if (!meta || !carrera) return null;
    // Dejar todos los controles marcados para probar el cruce real de meta
    carrera.siguienteControlIdx = circuito.controles.length;
    const rad = (meta.rotY || 0) * Math.PI / 180;
    const x = meta.x - Math.sin(rad) * 15;
    const z = meta.z - Math.cos(rad) * 15;
    this.teletransportar(x, z, meta.rotY || 0);
    return meta;
  },
  irABarreraSalida() {
    if (!circuito?.salida) return null;
    // Apuntar lateralmente hacia la barrera de neumáticos de la salida
    const s = circuito.salida;
    this.teletransportar(s.x, s.z, (s.rotY || 0) + 90);
    return s;
  },
  async cargarCocheBase64(b64, nombre = 'coche-test.glb') {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    await seleccionarCocheGLB(bytes.buffer, nombre);
    return this.estado();
  },
  cargarCoche: null
};

// --- Arranque ---
async function iniciar() {
  inicializarUI();
  seleccionarCocheCatalogo(idCocheSeleccionado);

  const params = new URLSearchParams(window.location.search);
  const urlEsc = params.get('escenario');
  const urlCoche = params.get('coche');

  if (urlEsc) {
    try {
      dom.inpUrlEscenario.value = urlEsc;
      aplicarEscenario(await cargarEscenarioDesdeUrl(urlEsc));
    } catch (e) {
      mostrarAviso('No se pudo cargar ?escenario: ' + e.message, 4000);
      aplicarEscenario(obtenerEscenarioPredefinido(ESCENARIOS_PREDEFINIDOS[0].id));
    }
  } else {
    aplicarEscenario(obtenerEscenarioPredefinido(ESCENARIOS_PREDEFINIDOS[0].id));
  }

  if (urlCoche) {
    await seleccionarCocheGLB(urlCoche, urlCoche);
  }

  requestAnimationFrame(bucle);
}

iniciar();
