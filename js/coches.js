// Catálogo con los 5 coches reales del garaje de narcimarquez-eng/Hacer-coches-
// más el importador de archivos .glb exportados desde Parametric Car 3D Studio.
// Convención de ejes compartida con Hacer-coches- y Mundos-:
//   +Z = frente del coche, +Y = arriba, Y = 0 = apoyo inferior de neumáticos, -X = lado volante.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { construirCocheHacerCoches } from '../vendor/hacer-coches/motor-coches.js';

export const COCHES_CATALOGO = [
  {
    id: 'urban',
    nombre: 'Urban Speedster',
    etiqueta: 'Compacto · 4x4 Ágil',
    descripcion: 'Voladizos mínimos y chasis corto de Hacer-coches-: ideal para horquillas de rally.',
    color: '#e8a800',
    specs: {
      masa: 1180,
      potencia: 325,
      traccion: '4x4',
      repartoTrasero: 0.56,
      velMaxKmh: 188,
      agarreBase: 1.05,
      recorridoSusp: 0.24,
      alturaLibre: 0.20,
      frenada: 1.06
    }
  },
  {
    id: 'offroad',
    nombre: 'Baja 4x4',
    etiqueta: 'SUV · Tacos y Vados',
    descripcion: 'Parachoques a cero, ruedas grandes y neumáticos de tacos para grava y agua.',
    color: '#3c4737',
    specs: {
      masa: 1580,
      potencia: 345,
      traccion: '4x4',
      repartoTrasero: 0.52,
      velMaxKmh: 174,
      agarreBase: 1.02,
      recorridoSusp: 0.34,
      alturaLibre: 0.32,
      frenada: 0.96
    }
  },
  {
    id: 'supercar',
    nombre: 'Cyber Wedge',
    etiqueta: 'Cupé · Derrape Rápido',
    descripcion: 'Morro en cuña deportiva, mucha potencia y trasera nerviosa para cruzarlo.',
    color: '#d81420',
    specs: {
      masa: 1210,
      potencia: 390,
      traccion: '4x4',
      repartoTrasero: 0.72,
      velMaxKmh: 205,
      agarreBase: 0.99,
      recorridoSusp: 0.20,
      alturaLibre: 0.18,
      frenada: 1.08
    }
  },
  {
    id: 'gt',
    nombre: 'Gran Turismo Royale',
    etiqueta: 'Cupé · Pista Rápida',
    descripcion: 'Comba clásica de Hacer-coches- con gran aplomo en asfalto y pistas rápidas.',
    color: '#091c3d',
    specs: {
      masa: 1310,
      potencia: 350,
      traccion: '4x4',
      repartoTrasero: 0.60,
      velMaxKmh: 196,
      agarreBase: 1.06,
      recorridoSusp: 0.21,
      alturaLibre: 0.18,
      frenada: 1.05
    }
  },
  {
    id: 'phantom',
    nombre: 'Phantom V8',
    etiqueta: 'Sedán V8 · Potencia',
    descripcion: 'Capó largo y batalla amplia: empuje V8 muy estable a alta velocidad.',
    color: '#111215',
    specs: {
      masa: 1520,
      potencia: 410,
      traccion: '4x4',
      repartoTrasero: 0.58,
      velMaxKmh: 194,
      agarreBase: 1.03,
      recorridoSusp: 0.22,
      alturaLibre: 0.22,
      frenada: 1.02
    }
  }
];

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

/** Envuelve un nodo Wheel en pivotes de dirección, suspensión y giro manteniendo su escala/rotación local. */
function envolverNodoRueda(nodoWheel, raizEscena) {
  raizEscena.updateMatrixWorld(true);
  const caja = new THREE.Box3().setFromObject(nodoWheel);
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
  giro.attach(nodoWheel);

  return { base: pivoteBase, dir, susp, giro, centroMundo, radio };
}

/** Prepara las 4 ruedas de cualquier coche (garaje Hacer-coches- o .glb importado) para física y animación. */
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
        if (!aro && o.isMesh && o.geometry && o.geometry.type === 'TorusGeometry') {
          const p = o.geometry.parameters;
          if (p && p.radius > 0.12 && p.radius < 0.22) aro = o;
        }
      });
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

/** Construye uno de los 5 coches del garaje real de Hacer-coches-. */
export function crearCocheDeGaraje(defId = 'urban') {
  const def = COCHES_CATALOGO.find(c => c.id === defId) || COCHES_CATALOGO[0];
  const { grupo: modelo, P, taillightMat } = construirCocheHacerCoches(def.id);

  const raiz = new THREE.Group();
  raiz.name = `RallyHacerCoches_${def.id}`;
  const chasis = new THREE.Group();
  chasis.name = 'Chassis';
  raiz.add(chasis);
  chasis.add(modelo);

  const info = prepararRuedasYCaja(modelo, raiz, chasis);

  // Posiciones exactas para capó y cabina según la geometría real de Hacer-coches-
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
    capoPos: new THREE.Vector3(0, P.beltY + offsetY + 0.16, P.cabinFrontZ + offsetZ + 0.08),
    cabinaPos: new THREE.Vector3(asientoX, eyeCabinaY, eyeCabinaZ)
  };

  return crearControladorVisual({
    id: def.id,
    nombre: def.nombre,
    raiz,
    chasis,
    ruedas: info.ruedas,
    volante: info.volante,
    matFreno: taillightMat,
    intensidadFrenoBase: taillightMat ? taillightMat.emissiveIntensity : 3.5,
    medidas,
    ruedasDetectadas: info.ruedasDetectadas,
    specs: def.specs
  });
}

// Alias para mantener compatibilidad con llamadas existentes
export const crearCocheProcedural = crearCocheDeGaraje;

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

  // Limpiar posibles wireframes de selección exportados desde Hacer-coches-
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
    specs: {
      masa: 1320,
      potencia: 340,
      traccion: '4x4',
      repartoTrasero: 0.58,
      velMaxKmh: 192,
      agarreBase: 1.03,
      recorridoSusp: 0.24,
      alturaLibre: 0.20,
      frenada: 1.04
    }
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

      // Cabeceo y balanceo dinámico del chasis sobre su suspensión
      cfg.chasis.position.y = estado.reboteChasis;
      cfg.chasis.rotation.x = estado.pitchDinamico;
      cfg.chasis.rotation.z = estado.rollDinamico;

      // Rodadura de las 4 ruedas
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
        // El volante de Hacer-coches- tiene su aro orientado en XY local con rotación en X; giramos alrededor de Z local
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
