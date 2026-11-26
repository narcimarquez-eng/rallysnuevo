// Generación y carga de coches desde narcimarquez-eng/Hacer-coches- (ccr-b02f9bfd-g5ar6l):
//   - Generador principal: "Aleatorio realista" (randomize + isPlausibleCar + car_parts.q.glb)
//   - Los 6 modelos prediseñados de FIVE_CARS (Fastback, Crossover, Retro, GT4, MPV, Tucson)
//   - Cargador externo de archivos .glb exportados desde Parametric Car 3D Studio.
// Ejes: +Z = frente, +Y = arriba, Y = 0 = apoyo inferior de neumáticos, -X = lado volante.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import {
  cargarPiezasHacerCoches,
  FIVE_CARS,
  construirCocheAleatorioRealista,
  construirCocheHacerCoches
} from '../vendor/hacer-coches/motor-coches.js';

export const COCHES_CATALOGO = [
  {
    id: 'gt4',
    nombre: 'GT4 Retro',
    etiqueta: 'Cupé · Rápido',
    descripcion: FIVE_CARS.gt4.desc,
    color: '#991b1b',
    specs: specsPorModelo('coupe')
  },
  {
    id: 'tucson',
    nombre: 'SUV Urbano',
    etiqueta: 'SUV · Vados y Grava',
    descripcion: FIVE_CARS.tucson.desc,
    color: '#0f766e',
    specs: specsPorModelo('suv')
  },
  {
    id: 'crossover',
    nombre: 'Crossover Boxy',
    etiqueta: 'SUV · Robusto',
    descripcion: FIVE_CARS.crossover.desc,
    color: '#6b7280',
    specs: specsPorModelo('suv')
  },
  {
    id: 'fastback',
    nombre: 'Fastback Eléctrico',
    etiqueta: 'Sedán · Equilibrado',
    descripcion: FIVE_CARS.fastback.desc,
    color: '#e5e7eb',
    specs: specsPorModelo('sedan')
  },
  {
    id: 'retro',
    nombre: 'Sedán Clásico 70s',
    etiqueta: 'Clásico · Derrapón',
    descripcion: FIVE_CARS.retro.desc,
    color: '#7c2d12',
    specs: specsPorModelo('sedan')
  },
  {
    id: 'mpv',
    nombre: 'Monovolumen',
    etiqueta: 'MPV · Estable',
    descripcion: FIVE_CARS.mpv.desc,
    color: '#1e3a8a',
    specs: specsPorModelo('limo')
  }
];

function specsPorModelo(modelo) {
  switch (modelo) {
    case 'compact':
      return {
        masa: 1180, potencia: 325, traccion: '4x4', repartoTrasero: 0.56,
        velMaxKmh: 188, agarreBase: 1.05, recorridoSusp: 0.24, alturaLibre: 0.20, frenada: 1.06
      };
    case 'coupe':
      return {
        masa: 1240, potencia: 375, traccion: '4x4', repartoTrasero: 0.68,
        velMaxKmh: 202, agarreBase: 1.02, recorridoSusp: 0.21, alturaLibre: 0.18, frenada: 1.07
      };
    case 'suv':
      return {
        masa: 1560, potencia: 345, traccion: '4x4', repartoTrasero: 0.52,
        velMaxKmh: 178, agarreBase: 1.03, recorridoSusp: 0.34, alturaLibre: 0.30, frenada: 0.98
      };
    case 'limo':
      return {
        masa: 1620, potencia: 360, traccion: '4x4', repartoTrasero: 0.55,
        velMaxKmh: 185, agarreBase: 1.01, recorridoSusp: 0.23, alturaLibre: 0.21, frenada: 1.00
      };
    default: // sedan
      return {
        masa: 1360, potencia: 345, traccion: '4x4', repartoTrasero: 0.58,
        velMaxKmh: 194, agarreBase: 1.04, recorridoSusp: 0.23, alturaLibre: 0.20, frenada: 1.04
      };
  }
}

export async function prepararMotorCoches() {
  return await cargarPiezasHacerCoches('vendor/hacer-coches/car_parts.q.glb');
}

let loaderCompartido = null;
function obtenerLoader() {
  if (loaderCompartido) return loaderCompartido;
  const loader = new GLTFLoader();
  const draco = new DRACOLoader();
  draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/libs/draco/gltf/');
  loader.setDRACOLoader(draco);
  loader.setMeshoptDecoder(MeshoptDecoder);
  loaderCompartido = loader;
  return loader;
}

/**
 * Envuelve cada rueda en pivotes de dirección, suspensión y rodadura.
 * Si la rueda tiene hijos WheelSpin_* y BrakeCaliper_* (Hacer-coches- ccr),
 * solo rueda WheelSpin_* y la pinza de freno queda fija.
 */
function envolverNodoRueda(nodoWheel, raizEscena) {
  raizEscena.updateMatrixWorld(true);
  const spinChild = nodoWheel.children.find(c => /^WheelSpin_/i.test(c.name)) || null;
  const cajaTarget = spinChild || nodoWheel;
  const caja = new THREE.Box3().setFromObject(cajaTarget);
  const centroMundo = new THREE.Vector3();
  const tam = new THREE.Vector3();
  caja.getCenter(centroMundo);
  caja.getSize(tam);
  const radio = Math.max(0.18, tam.y * 0.5);

  const padre = nodoWheel.parent;
  const centroEnPadre = padre.worldToLocal(centroMundo.clone());
  const pivoteBase = new THREE.Group();
  pivoteBase.name = 'WheelPivot';
  pivoteBase.position.copy(centroEnPadre);

  const dir = new THREE.Group();
  const susp = new THREE.Group();
  const giro = new THREE.Group();
  pivoteBase.add(dir);
  dir.add(susp);
  susp.add(giro);

  padre.add(pivoteBase);

  if (spinChild) {
    // Mover spinChild al grupo giratorio y el resto (BrakeCaliper_*) a susp para que no gire con la rueda
    const otros = nodoWheel.children.filter(c => c !== spinChild);
    giro.attach(spinChild);
    for (const o of otros) susp.attach(o);
    padre.remove(nodoWheel);
  } else {
    giro.attach(nodoWheel);
  }

  return { base: pivoteBase, dir, susp, giro, centroMundo, radio };
}

/** Prepara las 4 ruedas de cualquier coche (garaje/aleatorio Hacer-coches- o .glb importado) para física y animación. */
function prepararRuedasYCaja(escenaModelo, raiz, chasis) {
  escenaModelo.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(escenaModelo);
  const tam = new THREE.Vector3();
  const centro = new THREE.Vector3();
  caja.getSize(tam);
  caja.getCenter(centro);

  // Centrar en X/Z y apoyar la parte inferior de los neumáticos en Y = 0
  escenaModelo.position.x -= centro.x;
  escenaModelo.position.z -= centro.z;
  escenaModelo.position.y -= caja.min.y;
  escenaModelo.updateMatrixWorld(true);

  const candidatosRueda = [];
  const grupoWheels = escenaModelo.getObjectByName('Wheels');
  if (grupoWheels && grupoWheels.children.length >= 4) {
    for (const hijo of grupoWheels.children) candidatosRueda.push(hijo);
  } else {
    escenaModelo.traverse(o => {
      if (/^wheel(\b|_|-|\d)/i.test(o.name) || /^rueda/i.test(o.name)) {
        if (!candidatosRueda.some(c => c === o)) candidatosRueda.push(o);
      }
    });
  }

  // Separar Wheels de Chassis para que el balanceo de carrocería no hunda las ruedas en el suelo
  if (grupoWheels && candidatosRueda.length >= 4) {
    const grupoWheelsRaiz = new THREE.Group();
    grupoWheelsRaiz.name = 'WheelsRoot';
    raiz.add(grupoWheelsRaiz);
    grupoWheelsRaiz.attach(grupoWheels);
  }

  const ruedasEnv = candidatosRueda.slice(0, 4).map(n => envolverNodoRueda(n, raiz));
  const ruedas = { fl: null, fr: null, rl: null, rr: null };
  let radioMedio = 0.35;
  let batalla = Math.max(2.2, tam.z * 0.6);
  let via = Math.max(1.4, tam.x * 0.85);

  if (ruedasEnv.length === 4) {
    ruedasEnv.sort((a, b) => b.centroMundo.z - a.centroMundo.z); // primeros = delanteros (+Z)
    const delanteras = ruedasEnv.slice(0, 2).sort((a, b) => a.centroMundo.x - b.centroMundo.x);
    const traseras = ruedasEnv.slice(2, 4).sort((a, b) => a.centroMundo.x - b.centroMundo.x);
    ruedas.fl = delanteras[0];
    ruedas.fr = delanteras[1];
    ruedas.rl = traseras[0];
    ruedas.rr = traseras[1];
    radioMedio = ruedasEnv.reduce((s, r) => s + r.radio, 0) / 4;
    batalla = Math.max(1.6, Math.abs(delanteras[0].centroMundo.z - traseras[0].centroMundo.z));
    via = Math.max(1.2, Math.abs(delanteras[1].centroMundo.x - delanteras[0].centroMundo.x));
  }

  // Buscar volante en Interior (o pivote ya creado) para girarlo en vista cabina
  let volante = escenaModelo.getObjectByName('SteeringWheelPivot') || null;
  if (!volante) {
    const interior = escenaModelo.getObjectByName('Interior');
    if (interior) {
      let aro = null;
      interior.traverse(o => {
        if (!aro && /steering/i.test(o.name)) aro = o;
      });
      if (!aro) {
        interior.traverse(o => {
          if (!aro && o.isMesh && o.geometry && o.geometry.type === 'TorusGeometry') {
            const p = o.geometry.parameters;
            if (p && p.radius > 0.12 && p.radius < 0.22) aro = o;
          }
        });
      }
      if (aro) {
        const piv = new THREE.Group();
        piv.name = 'SteeringWheelPivot';
        piv.position.copy(aro.position);
        piv.rotation.copy(aro.rotation);
        aro.parent.add(piv);
        piv.attach(aro);
        volante = piv;
      }
    }
  }

  chasis.updateMatrixWorld(true);
  return { tam, ruedas, ruedasDetectadas: ruedasEnv.length, radioMedio, batalla, via, volante };
}

function envolverResultadoMotor(id, nombre, resMotor, esAleatorio = false) {
  const { grupo: modelo, P, taillightMat, modelo: tipoModelo, etiquetaModelo, colorPintura, tipoPintura } = resMotor;

  const raiz = new THREE.Group();
  raiz.name = `RallyHacerCoches_${id}`;
  const chasis = new THREE.Group();
  chasis.name = 'Chassis';
  raiz.add(chasis);
  chasis.add(modelo);

  const info = prepararRuedasYCaja(modelo, raiz, chasis);

  const offsetZ = modelo.position.z;
  const offsetY = modelo.position.y;
  const spanCabina = Math.max(0.5, P.cabinFrontZ - P.cabinRearZ);
  const asientoX = -P.cabinW * 0.42;
  const eyeCabinaY = Math.min(P.roofY - 0.19, P.beltY + (P.roofY - P.beltY) * 0.56) + offsetY;
  const eyeCabinaZ = P.cabinFrontZ - spanCabina * 0.48 + offsetZ;

  const medidas = {
    largo: info.tam.z,
    ancho: info.tam.x,
    alto: info.tam.y,
    batalla: info.batalla,
    via: info.via,
    radioRueda: info.radioMedio,
    capoPos: new THREE.Vector3(0, P.beltY + offsetY + 0.24, P.cabinFrontZ + offsetZ + 0.24),
    cabinaPos: new THREE.Vector3(asientoX, eyeCabinaY, eyeCabinaZ)
  };

  return crearControladorVisual({
    id,
    nombre,
    modeloBase: tipoModelo,
    etiquetaModelo,
    colorPintura,
    tipoPintura,
    esAleatorio,
    raiz,
    chasis,
    ruedas: info.ruedas,
    volante: info.volante,
    matFreno: taillightMat,
    intensidadFrenoBase: taillightMat ? taillightMat.emissiveIntensity : 3.5,
    medidas,
    ruedasDetectadas: info.ruedasDetectadas,
    specs: specsPorModelo(tipoModelo)
  });
}

/** Genera un coche nuevo con el modo "Aleatorio realista" de Hacer-coches-. */
export function crearCocheAleatorioRealista() {
  const res = construirCocheAleatorioRealista();
  const id = 'aleatorio-' + Date.now().toString(36).slice(-5);
  const nombre = `${res.etiquetaModelo} (Aleatorio realista)`;
  return envolverResultadoMotor(id, nombre, res, true);
}

/** Construye uno de los 6 modelos prediseñados de FIVE_CARS en Hacer-coches-. */
export function crearCocheDeGaraje(defId = 'gt4') {
  const def = COCHES_CATALOGO.find(c => c.id === defId) || COCHES_CATALOGO[0];
  const res = construirCocheHacerCoches(def.id);
  return envolverResultadoMotor(def.id, def.nombre, res, false);
}

export const crearCocheProcedural = crearCocheAleatorioRealista;

/**
 * Carga un archivo .glb exportado por Hacer-coches- (File, ArrayBuffer o URL),
 * detecta sus 4 ruedas y medidas, y devuelve un controlador visual listo para conducir.
 */
export async function cargarCocheGLB(origen, opciones = {}) {
  const loader = obtenerLoader();
  let gltf;
  let nombre = opciones.nombre || 'Coche GLB';

  if (origen instanceof ArrayBuffer) {
    gltf = await loader.parseAsync(origen, '');
  } else if (typeof Blob !== 'undefined' && origen instanceof Blob) {
    nombre = origen.name || nombre;
    const buf = await origen.arrayBuffer();
    gltf = await loader.parseAsync(buf, '');
  } else if (typeof origen === 'string') {
    gltf = await loader.loadAsync(origen);
    nombre = opciones.nombre || origen.split('/').pop() || 'Coche GLB';
  } else {
    throw new Error('Origen de coche GLB no válido');
  }

  const escenaModelo = gltf.scene;
  if (opciones.invertirZ) escenaModelo.rotation.y = Math.PI;

  const aQuitar = [];
  escenaModelo.traverse(o => {
    if (o.isMesh && o.material && o.material.wireframe && o.material.isMeshBasicMaterial) {
      aQuitar.push(o);
    }
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  for (const o of aQuitar) o.parent && o.parent.remove(o);

  const raiz = new THREE.Group();
  raiz.name = 'ImportedGLBCar';
  const chasis = new THREE.Group();
  chasis.name = 'Chassis';
  raiz.add(chasis);
  chasis.add(escenaModelo);

  const info = prepararRuedasYCaja(escenaModelo, raiz, chasis);

  const cajaTrasCentrado = new THREE.Box3().setFromObject(escenaModelo);
  const cabinObj = escenaModelo.getObjectByName('Cabin');
  const cabinBox = cabinObj ? new THREE.Box3().setFromObject(cabinObj) : null;

  const beltY = cabinBox ? cabinBox.min.y : cajaTrasCentrado.max.y * 0.62;
  const roofY = cabinBox ? cabinBox.max.y : cajaTrasCentrado.max.y;
  const cabinFrontZ = cabinBox ? cabinBox.max.z : info.tam.z * 0.16;
  const cabinCenterZ = cabinBox ? (cabinBox.min.z + cabinBox.max.z) * 0.5 : -info.tam.z * 0.05;

  const medidas = {
    largo: Math.max(3.0, info.tam.z),
    ancho: Math.max(1.4, info.tam.x),
    alto: Math.max(1.1, info.tam.y),
    batalla: info.batalla,
    via: info.via,
    radioRueda: info.radioMedio,
    capoPos: new THREE.Vector3(0, beltY + 0.16, Math.min(info.tam.z * 0.42, cabinFrontZ + 0.35)),
    cabinaPos: new THREE.Vector3(-info.tam.x * 0.20, roofY - 0.25, cabinCenterZ)
  };

  return crearControladorVisual({
    id: 'glb-' + Date.now().toString(36),
    nombre: nombre.replace(/\.glb$/i, ''),
    raiz,
    chasis,
    ruedas: info.ruedas,
    volante: info.volante,
    matFreno: null,
    intensidadFrenoBase: 3.0,
    medidas,
    esGLB: true,
    ruedasDetectadas: info.ruedasDetectadas,
    specs: specsPorModelo('coupe')
  });
}

function crearControladorVisual(cfg) {
  let anguloRodadura = 0;

  return {
    ...cfg,
    /** Sincroniza posición/orientación del coche y anima ruedas, suspensión, balanceo y volante. */
    actualizarVisual(estado, dt) {
      cfg.raiz.position.set(estado.x, estado.y, estado.z);
      cfg.raiz.rotation.set(0, 0, 0);
      cfg.raiz.rotateY(estado.yaw);
      cfg.raiz.rotateX(estado.pitchTerreno);
      cfg.raiz.rotateZ(estado.rollTerreno);

      cfg.chasis.position.y = estado.reboteChasis;
      cfg.chasis.rotation.x = estado.pitchDinamico;
      cfg.chasis.rotation.z = estado.rollDinamico;

      const radio = cfg.medidas.radioRueda || 0.35;
      anguloRodadura = (anguloRodadura + (estado.vLong * dt) / radio) % (Math.PI * 200);

      const mapaRuedas = [
        [cfg.ruedas.fl, estado.anguloDireccion, estado.compresionRuedas?.fl || 0],
        [cfg.ruedas.fr, estado.anguloDireccion, estado.compresionRuedas?.fr || 0],
        [cfg.ruedas.rl, 0, estado.compresionRuedas?.rl || 0],
        [cfg.ruedas.rr, 0, estado.compresionRuedas?.rr || 0]
      ];
      for (const [r, dirY, suspY] of mapaRuedas) {
        if (!r) continue;
        r.dir.rotation.y = dirY;
        r.susp.position.y = suspY;
        r.giro.rotation.x = anguloRodadura;
      }

      if (cfg.volante) {
        cfg.volante.rotation.z = -estado.anguloDireccion * 2.6;
      }
      if (cfg.matFreno) {
        cfg.matFreno.emissiveIntensity = estado.frenando
          ? Math.max(6.0, cfg.intensidadFrenoBase * 1.8)
          : cfg.intensidadFrenoBase;
      }
    }
  };
}
