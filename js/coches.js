// Catálogo de coches de rally y cargador compatible con los .glb de narcimarquez-eng/Hacer-coches-.
// Convención de ejes compartida con Hacer-coches- y Mundos-:
//   +Z = frente del coche, +Y = arriba, Y = 0 = apoyo inferior de neumáticos, -X = lado volante.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export const COCHES_CATALOGO = [
  {
    id: 'wrc',
    nombre: 'Compacto WRC Turbo',
    etiqueta: '4x4 · Equilibrado',
    descripcion: 'Ágil en horquillas, tracción total noble y muy estable en grava y asfalto.',
    color: '#1e6bff',
    colorSecundario: '#ffd21f',
    specs: {
      masa: 1230,
      potencia: 315,
      traccion: '4x4',
      repartoTrasero: 0.56,
      velMaxKmh: 186,
      agarreBase: 1.04,
      recorridoSusp: 0.24,
      alturaLibre: 0.20,
      frenada: 1.05
    },
    estilo: {
      largo: 4.18, ancho: 1.84, alto: 1.44, batalla: 2.58,
      radioRueda: 0.33, anchoRueda: 0.25,
      carroceria: 'compacto', aleron: 'doble', farosRally: true, dorsal: '07'
    }
  },
  {
    id: 'grupoB',
    nombre: 'Cupé Grupo B Clásico',
    etiqueta: '4x4 Trasero · Derrapón',
    descripcion: 'Empuje salvaje y trasera juguetona para enlazar curvas de costado.',
    color: '#d92626',
    colorSecundario: '#f7f7f7',
    specs: {
      masa: 1090,
      potencia: 375,
      traccion: '4x4',
      repartoTrasero: 0.72,
      velMaxKmh: 198,
      agarreBase: 0.98,
      recorridoSusp: 0.22,
      alturaLibre: 0.18,
      frenada: 1.00
    },
    estilo: {
      largo: 4.34, ancho: 1.88, alto: 1.34, batalla: 2.64,
      radioRueda: 0.34, anchoRueda: 0.27,
      carroceria: 'cupe', aleron: 'alto', farosRally: true, dorsal: '14'
    }
  },
  {
    id: 'raid',
    nombre: '4x4 Baja Raid',
    etiqueta: 'Todo Terreno · Vados',
    descripcion: 'Ruedas grandes y suspensión larga: devora baches, barro y riachuelos.',
    color: '#f26b1d',
    colorSecundario: '#262b33',
    specs: {
      masa: 1580,
      potencia: 340,
      traccion: '4x4',
      repartoTrasero: 0.52,
      velMaxKmh: 172,
      agarreBase: 1.00,
      recorridoSusp: 0.34,
      alturaLibre: 0.32,
      frenada: 0.95
    },
    estilo: {
      largo: 4.62, ancho: 1.98, alto: 1.68, batalla: 2.86,
      radioRueda: 0.42, anchoRueda: 0.31,
      carroceria: 'raid', aleron: 'ninguno', farosRally: true, dorsal: '22'
    }
  },
  {
    id: 'sedanA',
    nombre: 'Sedán Grupo A',
    etiqueta: '4x4 · Rápido en Asfalto',
    descripcion: 'Línea clásica de tres volúmenes con gran aplomo en pistas rápidas.',
    color: '#f3f5f8',
    colorSecundario: '#1c4fd6',
    specs: {
      masa: 1290,
      potencia: 305,
      traccion: '4x4',
      repartoTrasero: 0.55,
      velMaxKmh: 192,
      agarreBase: 1.06,
      recorridoSusp: 0.21,
      alturaLibre: 0.18,
      frenada: 1.08
    },
    estilo: {
      largo: 4.48, ancho: 1.82, alto: 1.41, batalla: 2.70,
      radioRueda: 0.33, anchoRueda: 0.24,
      carroceria: 'sedan', aleron: 'simple', farosRally: false, dorsal: '03'
    }
  }
];

function crearTexturaDorsal(numero, fondo, texto) {
  const cv = document.createElement('canvas');
  cv.width = 128; cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#11161d';
  ctx.fillRect(0, 0, 128, 22);
  ctx.fillStyle = '#ffd21f';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('RALLY', 64, 16);
  ctx.fillStyle = texto;
  ctx.font = '900 64px sans-serif';
  ctx.fillText(numero, 64, 96);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function crearRuedaProcedural(radio, ancho, colorLlanta) {
  const base = new THREE.Group();
  base.name = 'Wheel';
  const dir = new THREE.Group();
  const susp = new THREE.Group();
  const giro = new THREE.Group();
  base.add(dir);
  dir.add(susp);
  susp.add(giro);

  const matGoma = new THREE.MeshStandardMaterial({ color: '#1b1d21', roughness: 0.9, metalness: 0.05 });
  const matLlanta = new THREE.MeshStandardMaterial({ color: colorLlanta || '#e4e7ec', roughness: 0.28, metalness: 0.65 });
  const matDisco = new THREE.MeshStandardMaterial({ color: '#78808a', roughness: 0.35, metalness: 0.85 });

  const neumatico = new THREE.Mesh(new THREE.CylinderGeometry(radio, radio, ancho, 24), matGoma);
  neumatico.rotation.z = Math.PI / 2;
  neumatico.castShadow = true;
  neumatico.receiveShadow = true;
  giro.add(neumatico);

  // Banda lateral para distinguir visualmente el giro
  const llanta = new THREE.Mesh(new THREE.CylinderGeometry(radio * 0.62, radio * 0.62, ancho + 0.014, 16), matLlanta);
  llanta.rotation.z = Math.PI / 2;
  giro.add(llanta);

  const disco = new THREE.Mesh(new THREE.CylinderGeometry(radio * 0.45, radio * 0.45, ancho * 0.4, 14), matDisco);
  disco.rotation.z = Math.PI / 2;
  giro.add(disco);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const radioBrazo = new THREE.Mesh(
      new THREE.BoxGeometry(ancho + 0.024, radio * 0.13, radio * 0.56),
      matLlanta
    );
    radioBrazo.position.set(0, Math.sin(a) * radio * 0.25, Math.cos(a) * radio * 0.25);
    radioBrazo.rotation.x = -a;
    giro.add(radioBrazo);
  }

  return { base, dir, susp, giro };
}

/** Construye un coche procedural de rally respetando la misma jerarquía y ejes que Hacer-coches-. */
export function crearCocheProcedural(defId = 'wrc') {
  const def = COCHES_CATALOGO.find(c => c.id === defId) || COCHES_CATALOGO[0];
  const st = def.estilo;
  const raiz = new THREE.Group();
  raiz.name = `RallyCar_${def.id}`;

  const chasis = new THREE.Group();
  chasis.name = 'Chassis';
  raiz.add(chasis);

  const matPintura = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.3, metalness: 0.4 });
  const matSec = new THREE.MeshStandardMaterial({ color: def.colorSecundario, roughness: 0.35, metalness: 0.25 });
  const matOscuro = new THREE.MeshStandardMaterial({ color: '#1b1f26', roughness: 0.72, metalness: 0.15 });
  const matCristal = new THREE.MeshStandardMaterial({
    color: '#1d2d3a', roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.52
  });
  const matFaro = new THREE.MeshStandardMaterial({
    color: '#fff6db', emissive: '#ffefba', emissiveIntensity: 0.75, roughness: 0.2
  });
  const matFreno = new THREE.MeshStandardMaterial({
    color: '#8f1111', emissive: '#ff1e1e', emissiveIntensity: 0.35, roughness: 0.25
  });
  const matInterior = new THREE.MeshStandardMaterial({ color: '#22262d', roughness: 0.85 });
  const matVolante = new THREE.MeshStandardMaterial({ color: '#14171c', roughness: 0.6 });

  const body = new THREE.Group();
  body.name = 'Body';
  chasis.add(body);

  const yBase = def.specs.alturaLibre;
  const L = st.largo;
  const W = st.ancho;
  const H = st.alto;
  const beltY = yBase + (H - yBase) * 0.52;
  const largoCabina = st.carroceria === 'compacto' ? L * 0.52 : st.carroceria === 'raid' ? L * 0.50 : L * 0.45;
  const centroCabinaZ = st.carroceria === 'compacto' ? -L * 0.08 : -L * 0.04;

  // Faldón inferior y pasos de rueda estilizados
  const cascoBajo = new THREE.Mesh(new THREE.BoxGeometry(W * 0.96, beltY - yBase, L * 0.96), matPintura);
  cascoBajo.position.set(0, yBase + (beltY - yBase) / 2, 0);
  cascoBajo.castShadow = true;
  cascoBajo.receiveShadow = true;
  body.add(cascoBajo);

  // Franja decorativa lateral y capó secundario
  const franja = new THREE.Mesh(new THREE.BoxGeometry(W * 0.975, (beltY - yBase) * 0.26, L * 0.62), matSec);
  franja.position.set(0, yBase + (beltY - yBase) * 0.35, -L * 0.05);
  body.add(franja);

  // Paragolpes delantero y trasero
  const bumpF = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, 0.24, 0.26), matOscuro);
  bumpF.position.set(0, yBase + 0.14, L * 0.49);
  bumpF.castShadow = true;
  const bumpR = new THREE.Mesh(new THREE.BoxGeometry(W * 0.99, 0.26, 0.24), matOscuro);
  bumpR.position.set(0, yBase + 0.15, -L * 0.49);
  bumpR.castShadow = true;
  body.add(bumpF, bumpR);

  // Toma de aire en el capó
  const toma = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.44), matOscuro);
  toma.position.set(0, beltY + 0.03, L * 0.27);
  body.add(toma);

  // Faldillas guardabarros rally
  const faldillaGeo = new THREE.BoxGeometry(st.anchoRueda * 1.08, 0.22, 0.03);
  for (const sx of [-1, 1]) {
    for (const sz of [st.batalla * 0.5 - st.radioRueda - 0.05, -st.batalla * 0.5 - st.radioRueda - 0.05]) {
      const flap = new THREE.Mesh(faldillaGeo, matSec);
      flap.position.set(sx * (W * 0.44), yBase + 0.05, sz);
      body.add(flap);
    }
  }

  // Cabina (pilares, techo, parabrisas y luneta)
  const cabin = new THREE.Group();
  cabin.name = 'Cabin';
  chasis.add(cabin);
  const altCabina = H - beltY;
  const anchoTecho = W * 0.78;
  const techo = new THREE.Mesh(new THREE.BoxGeometry(anchoTecho, 0.07, largoCabina * 0.66), matPintura);
  techo.position.set(0, H - 0.035, centroCabinaZ - 0.15);
  techo.castShadow = true;
  cabin.add(techo);

  // Toma de aire en el techo (WRC / Grupo B)
  const tomaTecho = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.06, 0.34), matOscuro);
  tomaTecho.position.set(0, H + 0.03, centroCabinaZ + 0.14);
  cabin.add(tomaTecho);

  // Pilares delanteros, centrales y traseros
  const pAncho = 0.08;
  for (const sx of [-1, 1]) {
    const px = sx * (anchoTecho * 0.48);
    const pilarA = new THREE.Mesh(new THREE.BoxGeometry(pAncho, altCabina * 1.15, pAncho), matOscuro);
    pilarA.position.set(px, beltY + altCabina * 0.5, centroCabinaZ + largoCabina * 0.36);
    pilarA.rotation.x = -0.52;
    const pilarC = new THREE.Mesh(new THREE.BoxGeometry(pAncho, altCabina * 1.12, pAncho * 1.3), matPintura);
    pilarC.position.set(px, beltY + altCabina * 0.5, centroCabinaZ - largoCabina * 0.40);
    pilarC.rotation.x = st.carroceria === 'compacto' ? 0.32 : 0.55;
    cabin.add(pilarA, pilarC);
  }

  // Parabrisas y ventanas laterales
  const parabrisas = new THREE.Mesh(new THREE.PlaneGeometry(anchoTecho * 0.94, altCabina * 1.24), matCristal);
  parabrisas.position.set(0, beltY + altCabina * 0.48, centroCabinaZ + largoCabina * 0.35);
  parabrisas.rotation.x = -Math.PI / 2 + 0.92;
  parabrisas.material.side = THREE.DoubleSide;
  cabin.add(parabrisas);

  // Dorsales laterales
  const matDorsal = new THREE.MeshStandardMaterial({
    map: crearTexturaDorsal(st.dorsal, '#ffffff', '#14171c'),
    roughness: 0.5
  });
  for (const sx of [-1, 1]) {
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.34), matDorsal);
    placa.position.set(sx * (W * 0.485), yBase + (beltY - yBase) * 0.55, centroCabinaZ);
    placa.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
    body.add(placa);
  }

  // Alerón trasero
  if (st.aleron !== 'ninguno') {
    const altAleron = st.aleron === 'alto' ? H + 0.08 : beltY + 0.28;
    const ala = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.05, 0.26), matSec);
    ala.position.set(0, altAleron, -L * 0.44);
    ala.castShadow = true;
    body.add(ala);
    for (const sx of [-1, 1]) {
      const soporte = new THREE.Mesh(new THREE.BoxGeometry(0.05, altAleron - beltY, 0.16), matOscuro);
      soporte.position.set(sx * W * 0.34, beltY + (altAleron - beltY) / 2, -L * 0.44);
      body.add(soporte);
    }
  }

  // Faros delanteros, parrilla rally y pilotos traseros
  for (const sx of [-1, 1]) {
    const faro = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.13, 0.06), matFaro);
    faro.position.set(sx * W * 0.33, beltY - 0.1, L * 0.485);
    const piloto = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.06), matFreno);
    piloto.position.set(sx * W * 0.33, beltY - 0.08, -L * 0.485);
    body.add(faro, piloto);
  }
  if (st.farosRally) {
    const barra = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.09, 0.12), matOscuro);
    barra.position.set(0, beltY + 0.03, L * 0.47);
    body.add(barra);
    for (const ox of [-0.28, -0.09, 0.09, 0.28]) {
      const foco = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.08, 12), matFaro);
      foco.rotation.x = Math.PI / 2;
      foco.position.set(ox, beltY + 0.04, L * 0.51);
      body.add(foco);
    }
  }

  // Interior con salpicadero y volante giratorio (visible en cámara cabina)
  const interior = new THREE.Group();
  interior.name = 'Interior';
  chasis.add(interior);
  const asientoX = -W * 0.21;
  const salpicadero = new THREE.Mesh(new THREE.BoxGeometry(anchoTecho * 0.96, 0.24, 0.32), matInterior);
  salpicadero.position.set(0, beltY - 0.05, centroCabinaZ + largoCabina * 0.33);
  interior.add(salpicadero);

  const pivoteVolante = new THREE.Group();
  pivoteVolante.name = 'SteeringWheelPivot';
  pivoteVolante.position.set(asientoX, beltY + 0.08, centroCabinaZ + largoCabina * 0.22);
  pivoteVolante.rotation.x = -0.28;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 10, 24), matVolante);
  const barraV = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.03, 0.02), matSec);
  pivoteVolante.add(aro, barraV);
  interior.add(pivoteVolante);

  // 4 Ruedas separadas dentro de Wheels (igual que Hacer-coches-)
  const wheelsGroup = new THREE.Group();
  wheelsGroup.name = 'Wheels';
  raiz.add(wheelsGroup);
  const wheelX = W * 0.5 - st.anchoRueda * 0.42;
  const frontZ = st.batalla * 0.5;
  const rearZ = -st.batalla * 0.5;

  const fl = crearRuedaProcedural(st.radioRueda, st.anchoRueda, '#eceff4');
  fl.base.position.set(-wheelX, st.radioRueda, frontZ);
  const fr = crearRuedaProcedural(st.radioRueda, st.anchoRueda, '#eceff4');
  fr.base.position.set(wheelX, st.radioRueda, frontZ);
  const rl = crearRuedaProcedural(st.radioRueda, st.anchoRueda, '#eceff4');
  rl.base.position.set(-wheelX, st.radioRueda, rearZ);
  const rr = crearRuedaProcedural(st.radioRueda, st.anchoRueda, '#eceff4');
  rr.base.position.set(wheelX, st.radioRueda, rearZ);
  wheelsGroup.add(fl.base, fr.base, rl.base, rr.base);

  const medidas = {
    largo: L,
    ancho: W,
    alto: H,
    batalla: st.batalla,
    via: wheelX * 2,
    radioRueda: st.radioRueda,
    capoPos: new THREE.Vector3(0, beltY + 0.22, centroCabinaZ + largoCabina * 0.45),
    cabinaPos: new THREE.Vector3(asientoX, H - 0.25, centroCabinaZ + largoCabina * 0.02)
  };

  return crearControladorVisual({
    id: def.id,
    nombre: def.nombre,
    raiz,
    chasis,
    ruedas: { fl, fr, rl, rr },
    volante: pivoteVolante,
    lucesFreno: body.children.filter(o => o.material === matFreno),
    matFreno,
    medidas,
    specs: def.specs
  });
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

/** Envuelve un nodo Wheel de un .glb en pivotes de dirección, suspensión y giro manteniendo su escala/rotación local. */
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
  escenaModelo.updateMatrixWorld(true);

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

  // Medida global antes de envolver ruedas
  const caja = new THREE.Box3().setFromObject(escenaModelo);
  const tam = new THREE.Vector3();
  const centro = new THREE.Vector3();
  caja.getSize(tam);
  caja.getCenter(centro);

  // Centrar en X/Z y apoyar base en Y = 0
  escenaModelo.position.x -= centro.x;
  escenaModelo.position.z -= centro.z;
  escenaModelo.position.y -= caja.min.y;
  escenaModelo.updateMatrixWorld(true);

  const raiz = new THREE.Group();
  raiz.name = 'ImportedGLBCar';
  const chasis = new THREE.Group();
  chasis.name = 'Chassis';
  raiz.add(chasis);
  chasis.add(escenaModelo);

  // Detectar las 4 ruedas de Hacer-coches- (grupo Wheels -> hijos Wheel, o por nombre)
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
  let grupoWheelsRaiz = null;
  if (grupoWheels && candidatosRueda.length >= 4) {
    grupoWheelsRaiz = new THREE.Group();
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

  // Detectar cabina/interior para las cámaras de capó y cabina
  const cajaTrasCentrado = new THREE.Box3().setFromObject(escenaModelo);
  const cabinObj = escenaModelo.getObjectByName('Cabin');
  const cabinBox = cabinObj ? new THREE.Box3().setFromObject(cabinObj) : null;
  const volante = escenaModelo.getObjectByName('SteeringWheelPivot') || null;

  const beltY = cabinBox ? cabinBox.min.y : cajaTrasCentrado.max.y * 0.62;
  const roofY = cabinBox ? cabinBox.max.y : cajaTrasCentrado.max.y;
  const cabinFrontZ = cabinBox ? cabinBox.max.z : tam.z * 0.16;
  const cabinCenterZ = cabinBox ? (cabinBox.min.z + cabinBox.max.z) * 0.5 : -tam.z * 0.05;

  const medidas = {
    largo: Math.max(3.0, tam.z),
    ancho: Math.max(1.4, tam.x),
    alto: Math.max(1.1, tam.y),
    batalla,
    via,
    radioRueda: radioMedio,
    capoPos: new THREE.Vector3(0, beltY + 0.16, Math.min(tam.z * 0.42, cabinFrontZ + 0.35)),
    cabinaPos: new THREE.Vector3(-tam.x * 0.20, roofY - 0.25, cabinCenterZ)
  };

  return crearControladorVisual({
    id: 'glb-' + Date.now().toString(36),
    nombre: nombre.replace(/\.glb$/i, ''),
    raiz,
    chasis,
    ruedas,
    volante,
    lucesFreno: [],
    matFreno: null,
    medidas,
    esGLB: true,
    ruedasDetectadas: ruedasEnv.length,
    specs: {
      masa: 1320,
      potencia: 330,
      traccion: '4x4',
      repartoTrasero: 0.58,
      velMaxKmh: 190,
      agarreBase: 1.02,
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
      const radio = cfg.medidas.radioRueda || 0.34;
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
        cfg.matFreno.emissiveIntensity = estado.frenando ? 2.2 : 0.35;
      }
    }
  };
}
