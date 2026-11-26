// Motor paramétrico extraído automáticamente de narcimarquez-eng/Hacer-coches- (ccr-b02f9bfd-g5ar6l).
// Incluye carrocerías lofted por secciones, piezas Blender (car_parts.q.glb) y "Aleatorio realista".
// No editar a mano: regenerar con `npm run actualizar-coches`.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const lockSnapshot = () => ({});
const lockRestore = () => {};
const syncUI = () => {};
const markDirty = () => {};

const CONFIG = {
  model: 'sedan',
  selectedZone: 'hood',
  smoothing: 0.35,

  // rear: final del lateral acristalado ('bar' barra fina o panel de chapa) y rearWidth su ancho abajo
  pillars: { thick: 0.06, curve: 0.06, round: 0.5, maxWindow: 1.6, rear: 'bar', rearWidth: 0.45 },
  // Postura: ancho de carrocería, altura de suspensión (las ruedas siguen en el suelo) e inclinación
  stance: { width: 1.0, rideHeight: 0.0, rake: 0.0 },
  designLines: { enabled: true, thickness: 0.015, random: false },
  // Forma: radio de las esquinas vistas desde arriba, hombros, abombado del frontal y la zaga, y
  // caída hacia dentro de los cristales laterales
  shape: { corner: 0.26, cornerRear: 0.22, shoulder: 0.07, bow: 0.07, tumblehome: 0.05 },
  // Líneas de carrocería: cintura, pliegue medio, nervios del capó y estribo (pliegues de la chapa)
  bodyLines: { belt: 'sharp', crease: 'none', hood: 'two', rocker: 'scoop', depth: 1.0 },
  // Construcción de la chapa: 'sections' (secciones transversales unidas a lo largo del coche) o
  // 'extrude' (el perfil lateral extruido de lado a lado). Con secciones: tipo de sección y su
  // intensidad, aletas sobre las ruedas, cintura de avispa y afilado del morro y la zaga (en m),
  // número de secciones a lo largo y si se dibujan sobre la chapa
  body: { build: 'sections', section: 'flat', depth: 1.0, flare: 0, waist: 0, taper: 0, stations: 120, guides: false },
  // Frenos (discos y color de las pinzas) y pequeños detalles exteriores
  brakes: { disc: 'drilled', caliper: 'red' },
  details: { wipers: true, frit: true, chmsl: true, fuelDoor: 'square', badges: true, tyreText: true },

  // Ejes independientes del centro sin alterar el tamaño de la cabina
  frontAxleOffset: 0.0,
  rearAxleOffset: 0.0,

  // Capó por defecto reducido y completamente horizontal/recto
  zones: {
    frontBumper: { height: 1.00, curve: 0.50, length: 1.00 },
    hood:        { height: 1.00, length: 0.75, overhang: 0.70, noseHeight: 1.00, curve: 0.0, linked: false },
    cabin:       { height: 1.00, length: 1.00 },
    trunk:       { height: 1.00, length: 1.00, overhang: 1.00, tailHeight: 0.90, curve: 0.05, linked: false },
    rearBumper:  { height: 1.00, curve: 0.50, length: 1.00 },
  },

  paint: {
    color: '#2a2a2a',
    type: 'metallic',
    metalness: 0.85,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  },

  roofPaint: {
    color: '#15171c',
    syncBodyColor: false,
  },

  glass: {
    color: '#11161c',
    opacity: 0.35,
    bottomOffset: 0.0,
    frontZ: 1.05,
    rearZ: -1.40,
    roofFrontZ: 0.55,
    roofRearZ: -0.85,
    roofType: 'panoramic',
    roofMetalX: 0.06,
    roofMetalZ: 0.06,
    roofMetalY: 0.02,
    roofGap: 0.04,
    roofYOffset: 0.0,
    roofZOffset: 0.0,
    roofCurve: 0.08,
    roofSpan: 1.0,
  },

  tire: {
    color: '#1b1b1e',
    roughness: 0.88,
    size: 1.0,
    treadStyle: 'sport',
    bumpScale: 0.12,
  },
  wheelSpacer: 0.05,
  wheelRadius: 1.0,
  wheelLight: 2.5,

  rim: {
    color: '#c8c8d0',
    metalness: 0.82,
    roughness: 0.24,
    style: 'split-5',
    spokes: 10,
    spokeWidth: 0.06,
    spokeDepth: 0.025,
    concavity: 0.02,
  },

  headlight: {
    type: 'matrix',
    color: '#ddeeff',
    emissiveIntensity: 3.8,
    temperatureK: 6500,
    offsetY: 0.0,
    offsetZ: 0.0,
    rotX: 0.0,
    rotY: 0.0,
    rotZ: 0.0,
    size: 1.0,
    width: 1.0,
    spacing: 0.0,
    drl: 'none',
    housing: 'none',
  },

  taillight: {
    type: 'bar',
    color: '#ff1100',
    emissiveIntensity: 3.2,
    offsetY: 0.0,
    offsetZ: 0.0,
    rotX: 0.0,
    rotY: 0.0,
    rotZ: 0.0,
  },

  chrome: { color: '#eaeaf0', roughness: 0.08 },

  embeds: {
    grille:    { type: 'slats',     protrudeZ: 0.003, texture: 'honeycomb', width: 1.0, height: 1.0, offsetY: 0.0, emblem: true,
                 pattern: 'auto', frame: 'chrome', finish: 'auto', relief: 0.5, patternScale: 1.0 },
    headlight: { protrudeZ: 0.0 },
    taillight: { protrudeZ: 0.0 },
    handle:    { type: 'chrome',    offsetY: 0.0, offsetZ: 0.0 },
    mirror:    { type: 'standard' },
    intake:    { type: 'classic', size: 1.0, offsetY: 0.0, protrudeZ: 0.003 },
    rearVent:  { type: 'none', size: 1.0, offsetY: 0.0 },
    grilleTrim: { type: 'none', offsetY: 0.0 },
    exhaust:   { type: 'dual',      offsetY: 0.0, spacing: 0.0, size: 1.0 },
  },

  // Piezas montadas sobre la carrocería; offsetY/offsetZ/width colocan cada una
  accessories: {
    frontBumper: { type: 'integrated', offsetY: 0.0, offsetZ: 0.0, width: 1.0 },
    rearBumper:  { type: 'integrated', offsetY: 0.0, offsetZ: 0.0, width: 1.0 },
    spoiler:     { type: 'none', offsetY: 0.0, offsetZ: 0.0, width: 1.0 },
    roofRack:    { type: 'none' },
    sideSteps:   { type: 'none' },
    fogLights:   { type: 'none' },
    rearLights:  { type: 'none' },
    antenna:     { type: 'none' },
    hoodScoop:   { type: 'none' },
    roofCargo:   { type: 'none' },
    spareWheel:  { type: 'none' },
    snorkel:     { type: 'none' },
    flares:      { type: 'none' },
    mudFlaps:    { type: 'none' },
    visors:      { type: 'none' },
    plates:      { type: 'eu' },
    wheelCover:  { type: 'none' },
    archTrim:    { type: 'none' },
    sill:        { type: 'none' },
    midLine:     { type: 'none', offsetY: 0.0 },
    highLine:    { type: 'none' },
  },

  interior: {
    leatherColor: '#241a12',
    woodColor: '#4a2810',
    ambientColor: '#0066ff',
    ambientIntensity: 2.5,
    dashboard: 'sport',
  },
};

const DEFAULTS = JSON.parse(JSON.stringify(CONFIG));

const PAINT_TYPES = {
  solid:    { metalness: 0.10, roughness: 0.35, clearcoat: 1.0, clearcoatRoughness: 0.08, flake: false, iridescence: 0.0 },
  metallic: { metalness: 0.85, roughness: 0.25, clearcoat: 1.0, clearcoatRoughness: 0.06, flake: true,  iridescence: 0.0 },
  pearl:    { metalness: 0.60, roughness: 0.18, clearcoat: 1.0, clearcoatRoughness: 0.04, flake: true,  iridescence: 0.8 },
  matte:    { metalness: 0.35, roughness: 0.85, clearcoat: 0.0, clearcoatRoughness: 0.60, flake: false, iridescence: 0.0 },
};

const PRESETS = {
  sedan: {
    label: 'Sedán Ejecutivo',
    length: 5.50, width: 1.92,
    bottomY: 0.22, beltY: 1.02, roofY: 1.51,
    wheelR: 0.375, wheelbase: 3.50,
    cabinFrontZ: 1.05, cabinRearZ: -1.40,
    roofFrontZ: 0.55, roofRearZ: -0.85,
    bPillar: true,
  },
  suv: {
    label: 'SUV / 4x4 Off-Road',
    length: 5.10, width: 2.02,
    bottomY: 0.32, beltY: 1.15, roofY: 1.76,
    wheelR: 0.46, wheelbase: 3.00,
    cabinFrontZ: 1.15, cabinRearZ: -2.00,
    roofFrontZ: 0.88, roofRearZ: -1.88,
    bPillar: true,
  },
  compact: {
    label: 'Compacto Deportivo',
    length: 4.30, width: 1.82,
    bottomY: 0.20, beltY: 0.95, roofY: 1.45,
    wheelR: 0.32, wheelbase: 2.60,
    cabinFrontZ: 0.75, cabinRearZ: -1.55,
    roofFrontZ: 0.30, roofRearZ: -1.20,
    bPillar: true,
  },
  coupe: {
    label: 'Cupé GT 2 Puertas',
    length: 4.85, width: 1.92,
    bottomY: 0.18, beltY: 0.95, roofY: 1.35,
    wheelR: 0.34, wheelbase: 2.80,
    cabinFrontZ: 0.60, cabinRearZ: -1.42,
    roofFrontZ: 0.10, roofRearZ: -0.98,
    bPillar: false,
  },
  limousine: {
    label: 'Gran Limusina',
    length: 6.25, width: 1.96,
    bottomY: 0.22, beltY: 1.05, roofY: 1.55,
    wheelR: 0.38, wheelbase: 4.05,
    cabinFrontZ: 1.30, cabinRearZ: -2.05,
    roofFrontZ: 0.78, roofRearZ: -1.58,
    bPillar: true,
  },
};

// LOS 5 COCHES DE REFERENCIA: inspirados en tendencias actuales (sin marcas)
const FIVE_CARS = {
  fastback: {
    name: '1. Fastback eléctrico',
    desc: 'Perfil bajo, techo que cae hacia la zaga y frente cerrado; blanco perlado con techo de cristal oscuro.',
    model: 'sedan',
    config: {
      shape: { corner: 0.32, cornerRear: 0.28, shoulder: 0.08, bow: 0.09, tumblehome: 0.06 },
      bodyLines: { belt: 'sharp', crease: 'none', hood: 'two', rocker: 'scoop', depth: 1.0 },
      pillars: { rear: 'panel', rearWidth: 0.46 },
      brakes: { disc: 'drilled', caliper: 'silver' },
      paint: { color: '#e5e7eb', type: 'pearl', metalness: 0.55, roughness: 0.16, clearcoat: 1.0 },
      roofPaint: { color: '#0b0d10', syncBodyColor: false },
      frontAxleOffset: 0.0,
      rearAxleOffset: 0.0,
      zones: {
        frontBumper: { height: 0.70, curve: 0.50, length: 0.60 },
        hood: { height: 0.82, length: 0.90, overhang: 0.55, noseHeight: 0.90, curve: 0.35, linked: false },
        cabin: { height: 0.97, length: 1.00 },
        trunk: { height: 0.95, length: 0.95, overhang: 1.00, tailHeight: 0.70, curve: 0.15, linked: false },
        rearBumper: { height: 0.70, curve: 0.50, length: 0.60 },
      },
      glass: { roofCurve: 0.10, opacity: 0.30, roofMetalX: 0.02, roofMetalZ: 0.02 },
      rim: { style: 'turbine', spokes: 14, spokeWidth: 0.06, spokeDepth: 0.025, concavity: 0.02, color: '#cbd5e1' },
      tire: { treadStyle: 'sport', bumpScale: 0.10 },
      headlight: { type: 'wrap-blade', drl: 'bar', emissiveIntensity: 4.5 },
      taillight: { type: 'wrap-blade', emissiveIntensity: 4.0 },
      embeds: { grille: { type: 'none', texture: 'carbon' }, exhaust: { type: 'none' }, handle: { type: 'popout' }, mirror: { type: 'camera' }, intake: { type: 'slit' },
                grilleTrim: { type: 'led' } },
      accessories: { rearBumper: { type: 'diffuser' }, spoiler: { type: 'lip' }, antenna: { type: 'shark' }, wheelCover: { type: 'aero' }, highLine: { type: 'shoulder' } },
      interior: { dashboard: 'futuristic', leatherColor: '#1e293b', ambientColor: '#22d3ee' },
    }
  },
  crossover: {
    name: '2. Crossover eléctrico boxy',
    desc: 'Silueta cuadrada, trasera vertical y ruedas grandes; gris mate con techo oscuro.',
    model: 'suv',
    config: {
      shape: { corner: 0.18, cornerRear: 0.14, shoulder: 0.05, bow: 0.05, tumblehome: 0.04 },
      bodyLines: { belt: 'step', crease: 'ridge', hood: 'four', rocker: 'straight', depth: 1.0 },
      pillars: { rear: 'panelRoof', rearWidth: 0.40 },
      brakes: { disc: 'plain', caliper: 'black' },
      paint: { color: '#6b7280', type: 'matte', metalness: 0.20, roughness: 0.80, clearcoat: 0.0 },
      roofPaint: { color: '#111827', syncBodyColor: false },
      frontAxleOffset: 0.0,
      rearAxleOffset: 0.0,
      wheelRadius: 1.10,
      wheelSpacer: 0.04,
      zones: {
        frontBumper: { height: 0.90, curve: 0.30, length: 0.90 },
        hood: { height: 1.00, length: 0.90, overhang: 0.85, noseHeight: 1.00, curve: 0.00, linked: false },
        cabin: { height: 1.05, length: 1.00 },
        trunk: { height: 1.05, length: 0.90, overhang: 1.00, tailHeight: 1.20, curve: -0.05, linked: false },
        rearBumper: { height: 0.90, curve: 0.30, length: 0.90 },
      },
      glass: { roofCurve: 0.03, opacity: 0.40, roofMetalX: 0.15, roofMetalZ: 0.10 },
      rim: { style: 'multi-spoke', spokes: 5, spokeWidth: 0.08, spokeDepth: 0.03, concavity: 0.02, color: '#94a3b8' },
      tire: { treadStyle: 'all-terrain', bumpScale: 0.18 },
      headlight: { type: 'wrap-split', housing: 'black', emissiveIntensity: 4.2 },
      taillight: { type: 'wrap-c', emissiveIntensity: 3.6 },
      embeds: { grille: { type: 'solid', texture: 'carbon', width: 0.9 }, exhaust: { type: 'none' }, handle: { type: 'flush' }, intake: { type: 'curtain' } },
      accessories: { frontBumper: { type: 'apron-black' }, rearBumper: { type: 'apron-black' }, rearLights: { type: 'vertical' },
                     roofRack: { type: 'rails' }, fogLights: { type: 'strip' }, antenna: { type: 'shark' }, mudFlaps: { type: 'flaps' }, visors: { type: 'visors' },
                     archTrim: { type: 'black' }, sill: { type: 'black' } },
      interior: { dashboard: 'minimal', leatherColor: '#1f2937', ambientColor: '#38bdf8' },
    }
  },
  retro: {
    name: '3. Hatch retro urbano',
    desc: 'Hatchback compacto con faros redondos, carrocería amarilla y techo blanco contrastado.',
    model: 'compact',
    config: {
      shape: { corner: 0.30, cornerRear: 0.26, shoulder: 0.09, bow: 0.06, tumblehome: 0.05 },
      bodyLines: { belt: 'sharp', crease: 'none', hood: 'dome', rocker: 'none', depth: 0.9 },
      brakes: { disc: 'plain', caliper: 'silver' },
      details: { fuelDoor: 'round' },
      paint: { color: '#facc15', type: 'solid', metalness: 0.10, roughness: 0.35, clearcoat: 1.0 },
      roofPaint: { color: '#f8fafc', syncBodyColor: false },
      frontAxleOffset: 0.0,
      rearAxleOffset: 0.0,
      zones: {
        frontBumper: { height: 0.90, curve: 0.50, length: 0.50 },
        hood: { height: 0.95, length: 0.80, overhang: 0.80, noseHeight: 0.90, curve: 0.05, linked: false },
        cabin: { height: 1.02, length: 1.00 },
        trunk: { height: 1.00, length: 0.80, overhang: 0.80, tailHeight: 1.00, curve: 0.00, linked: false },
        rearBumper: { height: 0.90, curve: 0.50, length: 0.50 },
      },
      glass: { roofCurve: 0.06, opacity: 0.30, roofMetalX: 0.10, roofMetalZ: 0.10 },
      rim: { style: 'mesh', spokes: 8, spokeWidth: 0.07, spokeDepth: 0.03, concavity: 0.02, color: '#f8fafc' },
      tire: { treadStyle: 'sport', bumpScale: 0.08 },
      headlight: { type: 'projector', housing: 'chrome', emissiveIntensity: 3.5 },
      taillight: { type: 'round', emissiveIntensity: 3.0 },
      embeds: { grille: { type: 'oval', texture: 'none', width: 0.7, frame: 'chrome-thick' }, exhaust: { type: 'single' }, handle: { type: 'classic' }, mirror: { type: 'classic' } },
      accessories: { frontBumper: { type: 'chrome' }, rearBumper: { type: 'chrome' }, antenna: { type: 'rod' }, wheelCover: { type: 'moon' },
                     midLine: { type: 'chrome' }, archTrim: { type: 'chrome' } },
      interior: { dashboard: 'minimal', leatherColor: '#27272a', ambientColor: '#f97316' },
    }
  },
  gt4: {
    name: '4. GT cuatro puertas',
    desc: 'Cupé de cuatro puertas bajo y ancho, azul metalizado con llantas de cinco radios.',
    model: 'coupe',
    config: {
      shape: { corner: 0.28, cornerRear: 0.24, shoulder: 0.09, bow: 0.08, tumblehome: 0.07 },
      bodyLines: { belt: 'step', crease: 'rising', hood: 'four', rocker: 'scoop', depth: 1.3 },
      pillars: { rear: 'kink', rearWidth: 0.38 },
      brakes: { disc: 'slotted', caliper: 'yellow' },
      paint: { color: '#1e3a8a', type: 'metallic', metalness: 0.85, roughness: 0.18, clearcoat: 1.0 },
      roofPaint: { color: '#1e3a8a', syncBodyColor: true },
      frontAxleOffset: 0.0,
      rearAxleOffset: 0.0,
      zones: {
        frontBumper: { height: 0.80, curve: 0.60, length: 1.00 },
        hood: { height: 0.85, length: 1.10, overhang: 0.80, noseHeight: 0.75, curve: 0.35, linked: false },
        cabin: { height: 1.04, length: 1.00 },
        trunk: { height: 0.90, length: 0.95, overhang: 0.90, tailHeight: 0.85, curve: 0.00, linked: false },
        rearBumper: { height: 0.80, curve: 0.60, length: 1.00 },
      },
      glass: { roofCurve: 0.10, opacity: 0.35, roofMetalX: 0.08, roofMetalZ: 0.08 },
      rim: { style: 'split-5', spokes: 5, spokeWidth: 0.09, spokeDepth: 0.03, concavity: 0.03, color: '#e2e8f0' },
      tire: { treadStyle: 'sport', bumpScale: 0.11 },
      headlight: { type: 'wrap-boomerang', drl: 'none', emissiveIntensity: 4.6 },
      taillight: { type: 'wrap', emissiveIntensity: 4.4 },
      embeds: { grille: { type: 'shield', texture: 'honeycomb', width: 0.8, height: 1.1, pattern: 'diamond-studs', finish: 'darkchrome', frame: 'black', relief: 0.6 }, exhaust: { type: 'quad' }, handle: { type: 'flush' }, mirror: { type: 'sport' }, intake: { type: 'sport' }, rearVent: { type: 'corner' } },
      accessories: { frontBumper: { type: 'sport' }, rearBumper: { type: 'diffuser' }, spoiler: { type: 'lip' }, antenna: { type: 'shark' }, sill: { type: 'carbon' },
                     rearLights: { type: 'reflector' } },
      interior: { dashboard: 'sport', leatherColor: '#0f172a', ambientColor: '#3b82f6' },
    }
  },
  tucson: {
    name: '6. SUV de parrilla paramétrica (estilo Tucson)',
    desc: 'SUV compacto con una parrilla de facetas que esconde las luces diurnas, faros bajos verticales y costados angulosos; azul oscuro.',
    model: 'suv',
    config: {
      shape: { corner: 0.24, cornerRear: 0.20, shoulder: 0.06, bow: 0.08, tumblehome: 0.05 },
      bodyLines: { belt: 'sharp', crease: 'kinetic', hood: 'four', rocker: 'none', depth: 1.5 },
      pillars: { rear: 'panel', rearWidth: 0.42, thick: 0.05 },
      brakes: { disc: 'plain', caliper: 'silver' },
      details: { chmsl: false, badgeText: 'PCS HYBRID' },
      paint: { color: '#2c3a4f', type: 'metallic', metalness: 0.75, roughness: 0.25, clearcoat: 1.0 },
      roofPaint: { color: '#2c3a4f', syncBodyColor: true },
      stance: { width: 0.93, rideHeight: -0.03, rake: 0.0 },
      frontAxleOffset: -0.12,
      rearAxleOffset: 0.12,
      wheelRadius: 0.82,
      wheelSpacer: 0.04,
      zones: {
        frontBumper: { height: 0.95, curve: 1.00, length: 1.00 },
        hood: { height: 0.95, length: 0.95, overhang: 0.80, noseHeight: 0.78, curve: 0.12, linked: false },
        cabin: { height: 0.92, length: 0.92 },
        trunk: { height: 1.06, length: 0.85, overhang: 0.70, tailHeight: 1.05, curve: 0.00, linked: false },
        rearBumper: { height: 0.95, curve: 0.40, length: 0.85 },
      },
      glass: { roofCurve: 0.05, opacity: 0.38, roofType: 'solid', roofSpan: 0.66, roofZOffset: -0.08 },
      rim: { style: 'turbine', spokes: 10, spokeWidth: 0.05, spokeDepth: 0.03, concavity: 0.03, color: '#9aa1aa' },
      tire: { treadStyle: 'sport', bumpScale: 0.10 },
      headlight: { type: 'hidden', housing: 'black', offsetY: -0.30, spacing: 0.06, size: 1.0, emissiveIntensity: 4.0 },
      taillight: { type: 'claw', offsetY: 0.11, emissiveIntensity: 3.4 },
      embeds: { grille: { type: 'parametric', texture: 'none', width: 1.45, height: 1.6, offsetY: 0.20, emblem: false },
                exhaust: { type: 'none' }, handle: { type: 'chrome' }, intake: { type: 'wide' } },
      accessories: { roofRack: { type: 'rails' }, antenna: { type: 'shark' }, archTrim: { type: 'black' }, sill: { type: 'black' },
                     highLine: { type: 'chromeLoop' }, spoiler: { type: 'roofwing' }, frontBumper: { type: 'skid' }, rearBumper: { type: 'skid' } },
      interior: { dashboard: 'futuristic', leatherColor: '#1f2937', ambientColor: '#38bdf8' },
    }
  },
  mpv: {
    name: '5. Monovolumen familiar',
    desc: 'Cabina alta, capó corto y zaga vertical para carga; verde menta con techo blanco.',
    model: 'limousine',
    config: {
      shape: { corner: 0.30, cornerRear: 0.18, shoulder: 0.06, bow: 0.08, tumblehome: 0.04 },
      bodyLines: { belt: 'sharp', crease: 'groove', hood: 'none', rocker: 'scoop', depth: 1.0 },
      brakes: { disc: 'plain', caliper: 'silver' },
      paint: { color: '#86efac', type: 'solid', metalness: 0.10, roughness: 0.40, clearcoat: 0.6 },
      roofPaint: { color: '#f8fafc', syncBodyColor: false },
      frontAxleOffset: 0.0,
      rearAxleOffset: 0.0,
      zones: {
        frontBumper: { height: 0.80, curve: 0.40, length: 0.80 },
        hood: { height: 0.90, length: 0.70, overhang: 0.60, noseHeight: 0.90, curve: 0.00, linked: false },
        cabin: { height: 1.12, length: 0.98 },
        trunk: { height: 1.05, length: 1.20, overhang: 1.00, tailHeight: 1.05, curve: 0.00, linked: false },
        rearBumper: { height: 0.80, curve: 0.40, length: 0.80 },
      },
      glass: { roofCurve: 0.02, opacity: 0.35, roofMetalX: 0.10, roofMetalZ: 0.10, roofType: 'solid' },
      rim: { style: 'blade', spokes: 6, spokeWidth: 0.08, spokeDepth: 0.03, concavity: 0.02, color: '#f8fafc' },
      tire: { treadStyle: 'sport', bumpScale: 0.09 },
      headlight: { type: 'lightbar', emissiveIntensity: 3.8 },
      taillight: { type: 'bar', emissiveIntensity: 3.2 },
      embeds: { grille: { type: 'none', texture: 'none' }, exhaust: { type: 'none' }, handle: { type: 'pull' }, intake: { type: 'wide' },
                grilleTrim: { type: 'bar' } },
      accessories: { roofRack: { type: 'rack' }, roofCargo: { type: 'box' }, antenna: { type: 'shark' }, wheelCover: { type: 'aero' }, highLine: { type: 'chrome' },
                     frontBumper: { type: 'lip-alu' }, rearBumper: { type: 'chrome-strip' }, fogLights: { type: 'cube' }, rearLights: { type: 'cluster' } },
      interior: { dashboard: 'minimal', leatherColor: '#334155', ambientColor: '#a3e635' },
    }
  }
};

// Parte del voladizo total que corresponde al paragolpes; el resto es capó o maletero
const BUMPER_SHARE = 0.30;

function derive(base){
  const P = Object.assign({}, base);
  const Z = CONFIG.zones;
  const St = CONFIG.stance || { width: 1, rideHeight: 0 };
  const lift = St.rideHeight || 0;
  P.width   = base.width * (St.width || 1);
  P.bottomY = base.bottomY + lift;
  P.lift    = lift;

  P.halfW  = P.width / 2;
  P.cabinW = P.halfW - 0.15;
  P.bodyH  = P.beltY - P.bottomY;

  // Referencias base fijas para la carrocería (independientes de los sliders de ejes)
  const baseFrontAxleZ =  base.wheelbase / 2;
  const baseRearAxleZ  = -base.wheelbase / 2;

  // Los ejes (ruedas y pasos de rueda) se mueven libremente más cerca o lejos del centro
  // SIN arrastrar ni modificar el capó, parachoques, maletero ni la cabina:
  P.frontAxleZ = baseFrontAxleZ + (CONFIG.frontAxleOffset || 0);
  P.rearAxleZ  = baseRearAxleZ  + (CONFIG.rearAxleOffset  || 0);

  P.wheelX = P.halfW - 0.10 + CONFIG.wheelSpacer;
  P.wheelR = base.wheelR * CONFIG.wheelRadius;
  P.tireW  = P.wheelR * 0.72;

  // Los voladizos y extremos del coche (zF y zR) usan la referencia fija base, NO el eje móvil
  const baseOverhangF = Math.max(0.40, (base.length - base.wheelbase) / 2);
  const baseOverhangR = Math.max(0.40, (base.length - base.wheelbase) / 2);
  const hoodOverhang  = (Z.hood.overhang !== undefined) ? Z.hood.overhang : 1.0;
  const trunkOverhang = (Z.trunk.overhang !== undefined) ? Z.trunk.overhang : 1.0;

  // Cada voladizo se reparte entre capó/maletero y paragolpes. El paragolpes sobresale desde el
  // borde del capó (hoodFrontZ) o del maletero (trunkRearZ): moverlo no alarga la pieza contigua.
  const frontReach = baseOverhangF * hoodOverhang;
  const rearReach  = baseOverhangR * trunkOverhang;

  P.hoodFrontZ     = baseFrontAxleZ + frontReach * (1 - BUMPER_SHARE);
  P.trunkRearZ     = baseRearAxleZ  - rearReach  * (1 - BUMPER_SHARE);
  P.frontBumperLen = Math.max(0.08, frontReach * BUMPER_SHARE * Z.frontBumper.length);
  P.rearBumperLen  = Math.max(0.08, rearReach  * BUMPER_SHARE * Z.rearBumper.length);

  P.zF = P.hoodFrontZ + P.frontBumperLen;
  P.zR = P.trunkRearZ - P.rearBumperLen;

  // Extensión del capó y maletero hacia la cabina (usando la referencia base fija)
  const baseHoodSpan  = baseFrontAxleZ - base.cabinFrontZ;
  const baseTrunkSpan = base.cabinRearZ - baseRearAxleZ;

  const cF0 = baseFrontAxleZ - baseHoodSpan * Z.hood.length;
  const cR0 = baseRearAxleZ  + baseTrunkSpan * Z.trunk.length;

  const cc = (cF0 + cR0) / 2;
  const hs = ((cF0 - cR0) / 2) * Z.cabin.length;

  // Aplicamos también el desplazamiento manual de parabrisas (glassFrontZ) y luneta (glassRearZ)
  const glassFrontDelta = (CONFIG.glass.frontZ !== undefined) ? (CONFIG.glass.frontZ - base.cabinFrontZ) : 0;
  const glassRearDelta  = (CONFIG.glass.rearZ  !== undefined) ? (CONFIG.glass.rearZ  - base.cabinRearZ)  : 0;

  P.cabinFrontZ = cc + hs + glassFrontDelta;
  P.cabinRearZ  = cc - hs + glassRearDelta;

  P.beltY = base.beltY + lift;
  P.frontBeltY = THREE.MathUtils.clamp(
    base.beltY * Z.hood.height + lift,
    P.bottomY + 0.15,
    base.roofY * Z.cabin.height + lift - 0.12
  );
  P.rearBeltY = THREE.MathUtils.clamp(
    base.beltY * Z.trunk.height + lift,
    P.bottomY + 0.15,
    base.roofY * Z.cabin.height + lift - 0.12
  );

  P.roofY = base.roofY * Z.cabin.height + lift;

  // Adaptación armónica del techo a la cabina
  const baseCabinC    = (base.cabinFrontZ + base.cabinRearZ) / 2;
  const baseCabinSpan = Math.max(0.1, base.cabinFrontZ - base.cabinRearZ);
  const curCabinC     = (P.cabinFrontZ + P.cabinRearZ) / 2;
  const curCabinSpan  = Math.max(0.1, P.cabinFrontZ - P.cabinRearZ);
  const cabinScale    = curCabinSpan / baseCabinSpan;

  const baseRoofC      = (base.roofFrontZ + base.roofRearZ) / 2;
  const baseRoofSpan   = base.roofFrontZ - base.roofRearZ;
  const targetRoofC    = curCabinC + (baseRoofC - baseCabinC) * cabinScale;
  // roofSpan acorta o alarga el techo: con menos techo el parabrisas y la luneta se inclinan más
  const targetRoofHalf = (baseRoofSpan * cabinScale * THREE.MathUtils.clamp(CONFIG.glass.roofSpan ?? 1, 0.4, 1.15)) / 2;

  P.roofFrontZ = targetRoofC + targetRoofHalf + CONFIG.glass.roofZOffset;
  P.roofRearZ  = targetRoofC - targetRoofHalf + CONFIG.glass.roofZOffset;
  P.roofY      = P.roofY + CONFIG.glass.roofYOffset;

  // Límites geométricos seguros
  P.cabinFrontZ = Math.min(P.cabinFrontZ, P.zF - 0.10);
  P.cabinRearZ  = Math.max(P.cabinRearZ,  P.zR + 0.10);
  P.roofFrontZ  = Math.max(P.cabinRearZ + 0.05, Math.min(P.roofFrontZ, P.cabinFrontZ - 0.05));
  P.roofRearZ   = Math.max(P.cabinRearZ + 0.03, Math.min(P.roofRearZ,  P.roofFrontZ - 0.05));

  const b = P.bottomY;
  const hoodNoseH  = (Z.hood.noseHeight !== undefined) ? Z.hood.noseHeight : 1.0;
  const trunkTailH = (Z.trunk.tailHeight !== undefined) ? Z.trunk.tailHeight : 0.90;
  P.noseTopY = b + (P.frontBeltY - b) * hoodNoseH;
  P.tailTopY = b + (P.rearBeltY - b) * trunkTailH;


  return P;
}

const TEXTURES = (() => {
  const cache = new Map();
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  function make(key, builder, repeat = [1, 1]){
    if (cache.has(key)) return cache.get(key);
    const tex = new THREE.CanvasTexture(builder());
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeat[0], repeat[1]);
    tex.anisotropy = 4;
    cache.set(key, tex);
    return tex;
  }

  function metalFlake(){
    return make('flake', () => {
      const S = 256, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#e0e0e0'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 7000; i++){
        const g = 150 + (Math.random() * 105 | 0);
        x.fillStyle = `rgb(${g},${g},${g})`;
        x.fillRect(Math.random() * S, Math.random() * S, 1 + Math.random(), 1 + Math.random());
      }
      return c;
    }, [8, 8]);
  }

  function carbonWeave(){
    return make('carbon', () => {
      const S = 128, cell = 16, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#18181b'; x.fillRect(0, 0, S, S);
      for (let j = 0; j < S / cell; j++) for (let i = 0; i < S / cell; i++){
        const horiz = ((i + j) % 4) < 2;
        x.fillStyle = horiz ? '#3f3f46' : '#27272a';
        x.fillRect(i * cell, j * cell, cell, cell);
      }
      return c;
    }, [6, 6]);
  }

  function woodGrain(){
    return make('wood', () => {
      const W = 512, H = 128, c = canvas(W, H), x = c.getContext('2d');
      x.fillStyle = '#cbd5e1'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 80; i++){
        const y0 = Math.random() * H, amp = 1.5 + Math.random() * 6;
        const freq = 0.008 + Math.random() * 0.02, alpha = 0.04 + Math.random() * 0.12;
        x.strokeStyle = `rgba(0,0,0,${alpha})`;
        x.lineWidth = 0.8 + Math.random() * 2;
        x.beginPath();
        for (let px = 0; px <= W; px += 4){
          const y = y0 + Math.sin(px * freq + i * 1.5) * amp;
          px === 0 ? x.moveTo(px, y) : x.lineTo(px, y);
        }
        x.stroke();
      }
      return c;
    }, [3, 1]);
  }

  function quiltedLeather(){
    return make('leather', () => {
      const S = 256, cell = 64, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#e2e8f0'; x.fillRect(0, 0, S, S);
      for (let j = -1; j <= S / cell; j++) for (let i = -1; i <= S / cell; i++){
        const cx = i * cell + (j % 2 ? cell / 2 : 0), cy = j * cell;
        x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4);
        x.fillStyle = 'rgba(210,210,210,.45)'; x.fillRect(-cell*0.33, -cell*0.33, cell*0.66, cell*0.66);
        x.strokeStyle = 'rgba(40,40,40,.45)'; x.lineWidth = 1.8;
        x.strokeRect(-cell*0.33, -cell*0.33, cell*0.66, cell*0.66);
        x.restore();
      }
      return c;
    }, [3, 3]);
  }

  function honeycomb(){
    return make('honeycomb', () => {
      const S = 256, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#0a0a0a'; x.fillRect(0, 0, S, S);
      const cell = 26;
      x.strokeStyle = '#5a5a5a'; x.lineWidth = 2;
      for (let j = -1; j < S / (cell * 0.866) + 2; j++){
        for (let i = -1; i < S / cell + 2; i++){
          const cx = i * cell + (j % 2 ? cell / 2 : 0);
          const cy = j * cell * 0.866;
          x.beginPath();
          for (let k = 0; k < 6; k++){
            const a = Math.PI / 6 + k * Math.PI / 3;
            const px = cx + Math.cos(a) * cell * 0.5;
            const py = cy + Math.sin(a) * cell * 0.5;
            k === 0 ? x.moveTo(px, py) : x.lineTo(px, py);
          }
          x.closePath(); x.stroke();
        }
      }
      return c;
    }, [3, 3]);
  }

  function perforated(){
    return make('perforated', () => {
      const S = 128, cell = 16, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#888'; x.fillRect(0, 0, S, S);
      x.fillStyle = '#1a1a1a';
      for (let j = 0; j < S / cell; j++){
        for (let i = 0; i < S / cell; i++){
          const cx = i * cell + (j % 2 ? cell / 2 : 0) + cell / 2;
          const cy = j * cell + cell / 2;
          x.beginPath();
          x.arc(cx, cy, cell * 0.30, 0, Math.PI * 2);
          x.fill();
        }
      }
      return c;
    }, [6, 6]);
  }

  function diamondPlate(){
    return make('diamond', () => {
      const S = 128, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#2e2e2e'; x.fillRect(0, 0, S, S);
      x.fillStyle = '#7a7a7a';
      for (let j = 0; j < 8; j++){
        for (let i = 0; i < 8; i++){
          const cx = i * 16 + (j % 2 ? 8 : 0);
          const cy = j * 16;
          x.save(); x.translate(cx, cy); x.rotate(Math.PI / 4);
          x.fillRect(-4, -1.5, 8, 3);
          x.restore();
        }
      }
      return c;
    }, [6, 6]);
  }

  function brushedBlack(){
    return make('brushedBlack', () => {
      const S = 256, c = canvas(S, S), x = c.getContext('2d');
      x.fillStyle = '#2a2a2a'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 2600; i++){
        const y = Math.random() * S, g = 30 + (Math.random() * 50 | 0);
        x.strokeStyle = `rgba(${g},${g},${g},.6)`;
        x.lineWidth = Math.random() * 1.6;
        x.beginPath(); x.moveTo(0, y); x.lineTo(S, y + (Math.random() - 0.5) * 1.5); x.stroke();
      }
      return c;
    }, [4, 4]);
  }

  const tireCache = new Map();
  function getTire(style = 'sport'){
    if (tireCache.has(style)) return tireCache.get(style);
    const W = 1024, H = 256;
    const cColor = canvas(W, H), ctxColor = cColor.getContext('2d');
    const cBump = canvas(W, H), ctxBump = cBump.getContext('2d');

    ctxColor.fillStyle = '#1c1c1f'; ctxColor.fillRect(0, 0, W, H);
    ctxBump.fillStyle = '#ffffff';  ctxBump.fillRect(0, 0, W, H);

    if (style === 'sport'){
      for (const ch of [42, 90, 166, 214]){
        ctxBump.fillStyle = '#000000'; ctxBump.fillRect(0, ch - 7, W, 14);
        ctxColor.fillStyle = '#0b0b0d'; ctxColor.fillRect(0, ch - 6, W, 12);
      }
      const nSteps = 36, stepW = W / nSteps;
      ctxBump.strokeStyle = '#000000'; ctxBump.lineWidth = 5;
      ctxColor.strokeStyle = '#0a0a0c'; ctxColor.lineWidth = 4;
      for (let i = 0; i < nSteps; i++){
        const x0 = i * stepW;
        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0, 0); ctxBump.lineTo(x0 + 18, 42);
        ctxColor.moveTo(x0, 0); ctxColor.lineTo(x0 + 18, 42);
        ctxBump.stroke(); ctxColor.stroke();

        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0 + 18, 214); ctxBump.lineTo(x0, 256);
        ctxColor.moveTo(x0 + 18, 214); ctxColor.lineTo(x0, 256);
        ctxBump.stroke(); ctxColor.stroke();

        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0 + 8, 45); ctxBump.lineTo(x0 + 26, 128);
        ctxColor.moveTo(x0 + 8, 45); ctxColor.lineTo(x0 + 26, 128);
        ctxBump.stroke(); ctxColor.stroke();

        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0 + 26, 128); ctxBump.lineTo(x0 + 8, 210);
        ctxColor.moveTo(x0 + 26, 128); ctxColor.lineTo(x0 + 8, 210);
        ctxBump.stroke(); ctxColor.stroke();
      }
    } else if (style === 'racing'){
      for (const ch of [85, 170]){
        ctxBump.fillStyle = '#000000'; ctxBump.fillRect(0, ch - 8, W, 16);
        ctxColor.fillStyle = '#0a0a0c'; ctxColor.fillRect(0, ch - 7, W, 14);
      }
      const nSteps = 24, stepW = W / nSteps;
      ctxBump.strokeStyle = '#000000'; ctxBump.lineWidth = 6;
      ctxColor.strokeStyle = '#0a0a0c'; ctxColor.lineWidth = 5;
      for (let i = 0; i < nSteps; i++){
        const x0 = i * stepW;
        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0, 16); ctxBump.lineTo(x0 + 28, 80);
        ctxColor.moveTo(x0, 16); ctxColor.lineTo(x0 + 28, 80);
        ctxBump.stroke(); ctxColor.stroke();
        ctxBump.beginPath(); ctxColor.beginPath();
        ctxBump.moveTo(x0 + 28, 175); ctxBump.lineTo(x0, 240);
        ctxColor.moveTo(x0 + 28, 175); ctxColor.lineTo(x0, 240);
        ctxBump.stroke(); ctxColor.stroke();
      }
    } else if (style === 'all-terrain'){
      ctxBump.fillStyle = '#000000'; ctxBump.fillRect(0, 120, W, 16);
      ctxColor.fillStyle = '#0a0a0c'; ctxColor.fillRect(0, 121, W, 14);
      const nSteps = 20, stepW = W / nSteps;
      ctxBump.fillStyle = '#000000'; ctxColor.fillStyle = '#08080a';
      for (let i = 0; i < nSteps; i++){
        const x0 = i * stepW;
        ctxBump.fillRect(x0, 0, 16, 115); ctxColor.fillRect(x0, 0, 16, 115);
        ctxBump.fillRect(x0 + stepW/2, 141, 16, 115); ctxColor.fillRect(x0 + stepW/2, 141, 16, 115);
      }
    }
    const texColor = new THREE.CanvasTexture(cColor);
    texColor.wrapS = texColor.wrapT = THREE.RepeatWrapping;
    texColor.repeat.set(4, 1);
    texColor.anisotropy = 4;
    const texBump = new THREE.CanvasTexture(cBump);
    texBump.wrapS = texBump.wrapT = THREE.RepeatWrapping;
    texBump.repeat.set(4, 1);
    texBump.anisotropy = 4;
    const res = { color: texColor, bump: texBump };
    tireCache.set(style, res);
    return res;
  }

  return {
    metalFlake, carbonWeave, woodGrain, quiltedLeather, honeycomb, perforated, diamondPlate, brushedBlack, getTire,
    byName(name){
      switch (name){
        case 'honeycomb':    return honeycomb();
        case 'perforated':   return perforated();
        case 'diamond':      return diamondPlate();
        case 'carbon':       return carbonWeave();
        case 'brushedBlack': return brushedBlack();
        default:             return null;
      }
    }
  };
})();

const MAT = {};

function kelvinToColor(k){
  const clamp01 = v => Math.min(1, Math.max(0, v));
  const t = Math.min(12000, Math.max(1000, k)) / 100;
  const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
  const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661
                    : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  const b = t >= 66 ? 255 : (t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307);
  return new THREE.Color().setRGB(clamp01(r/255), clamp01(g/255), clamp01(b/255), THREE.SRGBColorSpace);
}

// Matrícula genérica de estilo europeo (texto inventado)
// Letras del flanco del neumático: banda alrededor de la rueda (u = vuelta, v = del borde de la llanta
// a la banda de rodadura). El tercio central lleva el texto; turn lo gira media vuelta para la rueda
// del otro lado (así en las dos se lee desde fuera, con la parte de arriba de las letras hacia fuera)
function tyreTextTexture(turn){
  const W = 2560, H = 192;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#18181a';
  x.fillRect(0, 0, W, H);
  x.fillStyle = '#1e1e21';
  x.fillRect(0, H / 3 - 3, W, 2); x.fillRect(0, 2 * H / 3 + 1, W, 2);
  x.fillStyle = '#707075';
  x.textBaseline = 'middle';
  const parts = [['PCS SPORT CONTACT', 'bold 40px system-ui, sans-serif'], ['245/40 R19 98Y', '600 30px system-ui, sans-serif'],
    ['M+S', 'bold 30px system-ui, sans-serif'], ['DOT 2026', '500 22px system-ui, sans-serif']];
  for (const start of [30, W / 2 + 30]){
    let px = start;
    for (const [t, font] of parts){
      x.font = font;
      x.fillText(t, px, H / 2);
      px += x.measureText(t).width + 70;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  if (turn){ tex.repeat.set(-1, -1); tex.offset.set(1, 1); }
  return tex;
}

// Serigrafía negra de los cristales: banda maciza en los bordes y puntos que se van haciendo
// pequeños hacia dentro. wM y hM son el ancho y el alto del cristal en metros (las bandas miden lo
// mismo en cualquier cristal); se guarda un material por tamaño
const FRIT_MATS = new Map();
function fritMaterial(wM, hM){
  const key = `${wM.toFixed(2)}x${hM.toFixed(2)}`;
  if (FRIT_MATS.has(key)) return FRIT_MATS.get(key);
  const W = 1024, H = 512, sx = W / wM, sy = H / hM;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  // [macizo, puntos] en metros: abajo, arriba y laterales
  const bands = { bottom: [0.085, 0.045], top: [0.05, 0.03], side: [0.03, 0.025] };
  x.fillRect(0, H - bands.bottom[0] * sy, W, bands.bottom[0] * sy);
  x.fillRect(0, 0, W, bands.top[0] * sy);
  x.fillRect(0, 0, bands.side[0] * sx, H);
  x.fillRect(W - bands.side[0] * sx, 0, bands.side[0] * sx, H);
  const step = 0.009;
  // Franja de puntos desde la línea (u0, v0) hacia dentro (du, dv), en metros (v = 0 arriba)
  const dots = (u0, v0, du, dv, depth, horiz) => {
    const n = Math.max(1, Math.round(depth / step));
    const len = horiz ? wM : hM;
    for (let i = 0; i < n; i++){
      const r = step * 0.48 * (1 - i / n);
      for (let k = 0; k * step < len; k++){
        const along = k * step + (i % 2) * step / 2;
        const u = horiz ? along : u0 + du * (i + 0.5) * step;
        const v = horiz ? v0 + dv * (i + 0.5) * step : along;
        x.beginPath();
        x.ellipse(u * sx, v * sy, r * sx, r * sy, 0, 0, Math.PI * 2);
        x.fill();
      }
    }
  };
  dots(0, hM - bands.bottom[0], 0, -1, bands.bottom[1], true);
  dots(0, bands.top[0], 0, 1, bands.top[1], true);
  dots(bands.side[0], 0, 1, 0, bands.side[1], false);
  dots(wM - bands.side[0], 0, -1, 0, bands.side[1], false);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0x111214, roughness: 0.25, metalness: 0.0, transparent: true,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide });
  FRIT_MATS.set(key, mat);
  if (FRIT_MATS.size > 12){ const k0 = FRIT_MATS.keys().next().value; FRIT_MATS.get(k0).map.dispose(); FRIT_MATS.delete(k0); }
  return mat;
}

// Letras cromadas de la zaga (nombre del modelo)
const BADGE_MATS = new Map();
function badgeMaterial(text){
  if (BADGE_MATS.has(text)) return BADGE_MATS.get(text);
  const c = document.createElement('canvas');
  c.width = 512; c.height = 96;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff';
  x.font = '600 66px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  if ('letterSpacing' in x) x.letterSpacing = '6px';
  x.fillText(text, 256, 50);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ map: tex, color: 0xe8e8ee, metalness: 1.0, roughness: 0.12, transparent: true,
    alphaTest: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  BADGE_MATS.set(text, mat);
  return mat;
}
const MODEL_BADGE = { sedan: 'PCS 500', suv: 'PCS X7 4×4', compact: 'PCS one', coupe: 'PCS GT', limousine: 'PCS 900 L' };

function plateTexture(){
  const c = document.createElement('canvas');
  c.width = 520;
  c.height = 110;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f4f0';
  x.fillRect(0, 0, 520, 110);
  x.fillStyle = '#1f47a8';
  x.fillRect(0, 0, 52, 110);
  x.fillStyle = '#ffd200';
  for (let k = 0; k < 12; k++){
    const a = k / 12 * Math.PI * 2;
    x.beginPath();
    x.arc(26 + Math.cos(a) * 15, 36 + Math.sin(a) * 15, 2.2, 0, Math.PI * 2);
    x.fill();
  }
  x.textAlign = 'center';
  x.fillStyle = '#ffffff';
  x.font = 'bold 30px sans-serif';
  x.fillText('E', 26, 92);
  x.fillStyle = '#111111';
  x.font = 'bold 74px sans-serif';
  x.fillText('2026 PCS', 286, 82);
  x.strokeStyle = '#111111';
  x.lineWidth = 4;
  x.strokeRect(2, 2, 516, 106);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;   // las UV de glTF tienen el origen arriba
  return tex;
}

// Piezas modeladas en Blender (blender/car_parts.py) e incrustadas en la página como GLB en base64.
// Cada malla guarda su papel (paint, chrome...) y se pinta con el material de la app correspondiente
const PARTS = new Map();

let promesaPiezas = null;
export function cargarPiezasHacerCoches(url = 'vendor/hacer-coches/car_parts.q.glb') {
  if (promesaPiezas) return promesaPiezas;
  promesaPiezas = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    for (const root of gltf.scene.children) {
      if (!root.name.startsWith('part_')) continue;
      root.traverse(o => {
        if (o.isMesh) {
          o.userData.role = o.material.name;
          o.userData.sharedGeometry = true;
        }
      });
      PARTS.set(root.name.slice(5), root);
    }
    return PARTS;
  })().catch(err => {
    promesaPiezas = null;
    throw err;
  });
  return promesaPiezas;
}
function partMaterial(role){
  return {
    paint: MAT.paint, roof: MAT.roofPaint, chrome: MAT.chrome, trim: MAT.chrome, steel: MAT.steel,
    rubber: MAT.rubber, carbon: MAT.carbon, alu: MAT.alu, glass: MAT.glass, light: MAT.headlight,
    dark: MAT.grilleBase, leather: MAT.leather, red: MAT.caliper, plate: MAT.plate, mirror: MAT.mirror,
    plastic: MAT.plastic, lens: MAT.lampLens, rim: MAT.rim,
    dash: MAT.dash, wood: MAT.wood, ambient: MAT.ambient, analog: MAT.analog, screen: MAT.screen,
    screen_cluster: MAT.screenCluster, screen_info: MAT.screenInfo, screen_wide: MAT.screenWide, screen_rear: MAT.screenRear,
    brake: MAT.brake, light_red: MAT.taillight, darkchrome: MAT.darkChrome, reflector: MAT.reflector,
    gloss: MAT.glossBlack, textured: MAT.textured, amber: MAT.indicator,
  }[role] || MAT.dash;
}

// Copia de una pieza de Blender en pos. opts: scale [x, y, z], rot [x, y, z], materials { papel: material }
function addPart(parent, name, key, pos, opts = {}){
  const src = PARTS.get(key);
  if (!src) return null;
  const obj = src.clone(true);
  obj.traverse(o => {
    if (o.isMesh){
      o.material = (opts.materials && opts.materials[o.userData.role]) || partMaterial(o.userData.role);
      o.castShadow = o.receiveShadow = true;
    }
  });
  obj.name = name;
  obj.position.set(pos[0], pos[1], pos[2]);
  if (opts.scale) obj.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
  if (opts.rot) obj.rotation.set(opts.rot[0], opts.rot[1], opts.rot[2]);
  parent.add(obj);
  return obj;
}


// Pantallas del interior: imágenes dibujadas en un canvas (cuadro de instrumentos, navegación y
// música, pantalla panorámica y pantalla trasera). La cara de cada pantalla trae UV de Blender
function screenTexture(kind){
  const size = { cluster: [1024, 340], info: [1024, 580], wide: [2048, 210], rear: [1024, 610] }[kind];
  const [W, H] = size;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const font = (px, w = 600) => `${w} ${px}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const bg = (x0, y0, w, h) => {
    const gr = x.createLinearGradient(x0, y0, x0, y0 + h);
    gr.addColorStop(0, '#071022'); gr.addColorStop(1, '#02050c');
    x.fillStyle = gr; x.fillRect(x0, y0, w, h);
  };
  const gauge = (cx, cy, r, v, big, unit, color, maxLabel) => {
    const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
    x.lineCap = 'round';
    x.strokeStyle = '#1c2a44'; x.lineWidth = r * 0.10;
    x.beginPath(); x.arc(cx, cy, r, a0, a1); x.stroke();
    const grd = x.createLinearGradient(cx - r, cy, cx + r, cy);
    grd.addColorStop(0, color); grd.addColorStop(1, '#ffffff');
    x.strokeStyle = grd;
    x.beginPath(); x.arc(cx, cy, r, a0, a0 + (a1 - a0) * v); x.stroke();
    for (let k = 0; k <= 12; k++){
      const a = a0 + (a1 - a0) * k / 12;
      x.strokeStyle = k % 2 ? '#41557a' : '#c7d2fe'; x.lineWidth = k % 2 ? 2 : 4;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * r * 0.80, cy + Math.sin(a) * r * 0.80);
      x.lineTo(cx + Math.cos(a) * r * 0.88, cy + Math.sin(a) * r * 0.88); x.stroke();
    }
    const an = a0 + (a1 - a0) * v;
    x.strokeStyle = '#ff3b30'; x.lineWidth = 5;
    x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + Math.cos(an) * r * 0.78, cy + Math.sin(an) * r * 0.78); x.stroke();
    x.fillStyle = '#0b1220'; x.beginPath(); x.arc(cx, cy, r * 0.42, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = font(r * 0.34, 700); x.fillText(big, cx, cy - r * 0.02);
    x.fillStyle = '#8ea2c8'; x.font = font(r * 0.12); x.fillText(unit, cx, cy + r * 0.24);
    x.fillText(maxLabel, cx + r * 0.62, cy + r * 0.72);
  };
  const map = (x0, y0, w, h) => {
    x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
    x.fillStyle = '#0d1a2e'; x.fillRect(x0, y0, w, h);
    x.fillStyle = '#123524';
    for (let k = 0; k < 5; k++) x.fillRect(x0 + rand() * w, y0 + rand() * h, 40 + rand() * 80, 30 + rand() * 60);
    x.strokeStyle = '#173a5e'; x.lineWidth = 14;
    x.beginPath(); x.moveTo(x0 - 10, y0 + h * 0.75); x.bezierCurveTo(x0 + w * 0.3, y0 + h * 0.55, x0 + w * 0.6, y0 + h * 0.95, x0 + w + 10, y0 + h * 0.7); x.stroke();
    x.strokeStyle = '#22314d'; x.lineWidth = 3;
    for (let k = 0; k < 16; k++){
      x.beginPath();
      if (k % 2){ const yy = y0 + rand() * h; x.moveTo(x0, yy); x.lineTo(x0 + w, yy + (rand() - 0.5) * 40); }
      else { const xx = x0 + rand() * w; x.moveTo(xx, y0); x.lineTo(xx + (rand() - 0.5) * 40, y0 + h); }
      x.stroke();
    }
    x.strokeStyle = '#2f4670'; x.lineWidth = 7;
    x.beginPath(); x.moveTo(x0, y0 + h * 0.3); x.lineTo(x0 + w, y0 + h * 0.45); x.stroke();
    x.beginPath(); x.moveTo(x0 + w * 0.55, y0); x.lineTo(x0 + w * 0.45, y0 + h); x.stroke();
    x.strokeStyle = '#3b82f6'; x.lineWidth = 10; x.lineJoin = 'round';
    x.beginPath(); x.moveTo(x0 + w * 0.5, y0 + h * 0.9); x.lineTo(x0 + w * 0.48, y0 + h * 0.62);
    x.lineTo(x0 + w * 0.70, y0 + h * 0.40); x.lineTo(x0 + w * 0.86, y0 + h * 0.18); x.stroke();
    x.fillStyle = '#ef4444'; x.beginPath(); x.arc(x0 + w * 0.86, y0 + h * 0.18, 12, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.beginPath();
    x.moveTo(x0 + w * 0.5, y0 + h * 0.80); x.lineTo(x0 + w * 0.5 - 16, y0 + h * 0.80 + 30); x.lineTo(x0 + w * 0.5 + 16, y0 + h * 0.80 + 30); x.closePath(); x.fill();
    x.restore();
  };
  const media = (x0, y0, w, h, title, artist) => {
    x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(x0, y0, w, h);
    const s = Math.min(h * 0.5, w * 0.4);
    const art = x.createLinearGradient(x0 + 20, y0 + 20, x0 + 20 + s, y0 + 20 + s);
    art.addColorStop(0, '#f43f5e'); art.addColorStop(0.5, '#a855f7'); art.addColorStop(1, '#0ea5e9');
    x.fillStyle = art; x.fillRect(x0 + 20, y0 + 20, s, s);
    x.textAlign = 'left'; x.textBaseline = 'top';
    x.fillStyle = '#ffffff'; x.font = font(Math.max(18, h * 0.08), 700); x.fillText(title, x0 + 20, y0 + 36 + s);
    x.fillStyle = '#93a3c3'; x.font = font(Math.max(14, h * 0.06)); x.fillText(artist, x0 + 20, y0 + 40 + s + h * 0.09);
    x.fillStyle = '#26324a'; x.fillRect(x0 + 20, y0 + h - 40, w - 40, 6);
    x.fillStyle = '#3b82f6'; x.fillRect(x0 + 20, y0 + h - 40, (w - 40) * 0.42, 6);
  };
  const topBar = (x0, y0, w) => {
    x.fillStyle = '#c7d2fe'; x.font = font(26, 600); x.textBaseline = 'top';
    x.textAlign = 'left'; x.fillText('12:45', x0 + 18, y0 + 12);
    x.textAlign = 'right'; x.fillText('21 °C   ▮▮▮▯  5G', x0 + w - 18, y0 + 12);
  };

  if (kind === 'cluster'){
    bg(0, 0, W, H);
    gauge(230, 175, 145, 0.47, '112', 'km/h', '#38bdf8', '260');
    gauge(W - 230, 175, 145, 0.28, '3.1', 'x1000 rpm', '#a78bfa', '8');
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.font = font(90, 800); x.fillText('D', W / 2, 140);
    x.fillStyle = '#8ea2c8'; x.font = font(26); x.fillText('412 km · 21 °C', W / 2, 225);
    x.fillStyle = '#1c2a44'; x.fillRect(W / 2 - 110, 262, 220, 12);
    x.fillStyle = '#22c55e'; x.fillRect(W / 2 - 110, 262, 150, 12);
  } else if (kind === 'info'){
    bg(0, 0, W, H);
    map(0, 50, W * 0.62, H - 50);
    media(W * 0.64, 70, W * 0.34, H - 90, 'Midnight Drive', 'Neon Lines');
    topBar(0, 0, W);
  } else if (kind === 'wide'){
    bg(0, 0, W, H);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.font = font(110, 800); x.fillText('112', 240, 95);
    x.fillStyle = '#8ea2c8'; x.font = font(28); x.fillText('km/h   ·   D', 240, 170);
    map(470, 18, 980, H - 36);
    media(1480, 18, 548, H - 36, 'Midnight Drive', 'Neon Lines');
  } else {
    const sky = x.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#f97316'); sky.addColorStop(0.55, '#7c3aed'); sky.addColorStop(1, '#0b1020');
    x.fillStyle = sky; x.fillRect(0, 0, W, H);
    x.fillStyle = '#0b1020';
    x.beginPath(); x.moveTo(0, H * 0.75);
    for (let k = 0; k <= 10; k++) x.lineTo(W * k / 10, H * (0.55 + 0.18 * Math.abs(Math.sin(k * 1.7))));
    x.lineTo(W, H); x.lineTo(0, H); x.closePath(); x.fill();
    x.fillStyle = '#ffffff'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = font(84, 800); x.fillText('ROAD TRIP', W / 2, H * 0.35);
    x.fillStyle = 'rgba(255,255,255,0.85)';
    x.beginPath(); x.moveTo(W / 2 - 30, H * 0.80 - 36); x.lineTo(W / 2 + 40, H * 0.80); x.lineTo(W / 2 - 30, H * 0.80 + 36); x.closePath(); x.fill();
    x.fillStyle = '#334155'; x.fillRect(60, H - 40, W - 120, 8);
    x.fillStyle = '#f97316'; x.fillRect(60, H - 40, (W - 120) * 0.3, 8);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.flipY = false;   // UV de glTF: origen arriba
  tex.anisotropy = 4;
  return tex;
}

function createMaterials(){
  MAT.paint = new THREE.MeshPhysicalMaterial({
    color: 0x2a2a2a, metalness: 0.85, roughness: 0.22,
    clearcoat: 1.0, clearcoatRoughness: 0.06,
  });

  // Material dedicado para el techo (bitono o sincronizado)
  MAT.roofPaint = new THREE.MeshPhysicalMaterial({
    color: 0x15171c, metalness: 0.85, roughness: 0.22,
    clearcoat: 1.0, clearcoatRoughness: 0.06,
  });

  MAT.chrome = new THREE.MeshStandardMaterial({ color: 0xe8e8ee, metalness: 1.0, roughness: 0.06 });
  // Cromo oscuro (parrilla paramétrica)
  MAT.darkChrome = new THREE.MeshStandardMaterial({ color: 0x4a4f58, metalness: 1.0, roughness: 0.16 });
  MAT.reflector  = new THREE.MeshStandardMaterial({ color: 0x8a0a08, metalness: 0.2, roughness: 0.25 });
  // Negro piano (molduras y faldones) y plástico texturizado de protección
  MAT.glossBlack = new THREE.MeshPhysicalMaterial({ color: 0x050506, metalness: 0.0, roughness: 0.06, clearcoat: 1.0, clearcoatRoughness: 0.04 });
  MAT.textured   = new THREE.MeshStandardMaterial({ color: 0x1a1b1d, roughness: 0.85, metalness: 0.0 });
  MAT.glass  = new THREE.MeshPhysicalMaterial({
    color: 0x11161c, metalness: 0.0, roughness: 0.05,
    transparent: true, opacity: 0.35, side: THREE.DoubleSide, envMapIntensity: 2.0, depthWrite: false,
  });
  MAT.roofGlass = new THREE.MeshPhysicalMaterial({
    color: 0x0a0d10, metalness: 0.0, roughness: 0.03,
    transparent: true, opacity: 0.45, side: THREE.DoubleSide, envMapIntensity: 2.0, depthWrite: false,
  });

  MAT.tire    = new THREE.MeshStandardMaterial({ color: 0x1c1c1f, roughness: 0.88, side: THREE.DoubleSide });
  MAT.tireWall = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.82, side: THREE.DoubleSide });
  MAT.rim     = new THREE.MeshStandardMaterial({ color: 0xc4c4cc, metalness: 0.8, roughness: 0.25 });
  MAT.barrel  = new THREE.MeshStandardMaterial({ color: 0x111215, roughness: 0.82, metalness: 0.4 });
  MAT.brake   = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.5, roughness: 0.4 });
  MAT.caliper = new THREE.MeshStandardMaterial({ color: 0xcc1100, metalness: 0.3, roughness: 0.3 });

  MAT.leather = new THREE.MeshStandardMaterial({ color: 0x241a12, roughness: 0.60 });
  MAT.dash    = new THREE.MeshStandardMaterial({ color: 0x0f0c0a, roughness: 0.55 });
  MAT.wood    = new THREE.MeshStandardMaterial({ color: 0x4a2810, roughness: 0.22, metalness: 0.05 });
  MAT.carbon  = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.55, roughness: 0.25 });

  MAT.headlight = new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x88bbff, emissiveIntensity: 3.5 });
  MAT.taillight = new THREE.MeshStandardMaterial({ color: 0xff1000, emissive: 0xff1000, emissiveIntensity: 2.8 });
  MAT.ambient   = new THREE.MeshStandardMaterial({ color: 0x4488ff, emissive: 0x4488ff, emissiveIntensity: 2.5 });
  MAT.screen    = new THREE.MeshStandardMaterial({ color: 0x081030, emissive: 0x2255cc, emissiveIntensity: 1.5 });
  MAT.hologram  = new THREE.MeshStandardMaterial({ color: 0x1a4488, emissive: 0x44aaff, emissiveIntensity: 2.0, transparent: true, opacity: 0.7 });
  MAT.analog    = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, metalness: 0.9, roughness: 0.15 });
  const screenMat = kind => { const t = screenTexture(kind); return new THREE.MeshStandardMaterial({ map: t, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.85, roughness: 0.25, metalness: 0.0 }); };
  MAT.screenCluster = screenMat('cluster');
  MAT.screenInfo    = screenMat('info');
  MAT.screenWide    = screenMat('wide');
  MAT.screenRear    = screenMat('rear');

  MAT.panelGap   = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 });
  MAT.grilleBase = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.5, metalness: 0.6 });
  MAT.floor      = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85 });
  MAT.steel      = new THREE.MeshStandardMaterial({ color: 0x1b1c1f, roughness: 0.65, metalness: 0.55 });
  MAT.rubber     = new THREE.MeshStandardMaterial({ color: 0x101012, roughness: 0.92 });
  MAT.alu        = new THREE.MeshStandardMaterial({ color: 0xb9bdc4, roughness: 0.35, metalness: 0.9 });
  MAT.plastic    = new THREE.MeshStandardMaterial({ color: 0x18191b, roughness: 0.45, metalness: 0.1 });
  MAT.mirror     = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.03, metalness: 1.0 });
  MAT.plate      = new THREE.MeshStandardMaterial({ map: plateTexture(), roughness: 0.4, metalness: 0.1 });

  // Ópticas envolventes: tulipa enrasada con la chapa, paredes del hueco e intermitente
  MAT.lampLens = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0.0, roughness: 0.02, transparent: true, opacity: 0.14,
    envMapIntensity: 2.6, clearcoat: 1.0, clearcoatRoughness: 0.02, depthWrite: false,
  });
  MAT.tailLens = new THREE.MeshPhysicalMaterial({
    color: 0x8a0c06, metalness: 0.0, roughness: 0.03, transparent: true, opacity: 0.5,
    envMapIntensity: 2.2, clearcoat: 1.0, clearcoatRoughness: 0.02, depthWrite: false,
  });
  MAT.lampHousing       = new THREE.MeshStandardMaterial({ color: 0x15171b, metalness: 0.8, roughness: 0.3, side: THREE.DoubleSide });
  MAT.lampHousingChrome = new THREE.MeshStandardMaterial({ color: 0xb8bcc4, metalness: 1.0, roughness: 0.12, side: THREE.DoubleSide });
  MAT.intakeLiner = new THREE.MeshStandardMaterial({ color: 0x0d0e10, roughness: 0.55, metalness: 0.2, side: THREE.DoubleSide });
  MAT.wellLiner = new THREE.MeshStandardMaterial({ color: 0x0c0c0d, roughness: 0.92, metalness: 0.0, side: THREE.DoubleSide });
  MAT.indicator = new THREE.MeshStandardMaterial({ color: 0xffa040, emissive: 0xff7a00, emissiveIntensity: 0.5, roughness: 0.3 });
  // Letras en relieve de los flancos (una versión por lado para que se lean bien desde fuera)
  MAT.tireTextL = new THREE.MeshStandardMaterial({ map: tyreTextTexture(true), roughness: 0.8, side: THREE.DoubleSide });
  MAT.tireTextR = new THREE.MeshStandardMaterial({ map: tyreTextTexture(false), roughness: 0.8, side: THREE.DoubleSide });

  MAT.carbon.map  = TEXTURES.carbonWeave();
  MAT.wood.map    = TEXTURES.woodGrain();
  MAT.wood.roughnessMap = MAT.wood.map;
  MAT.leather.map = TEXTURES.quiltedLeather();
  MAT.leather.bumpMap   = MAT.leather.map;
  MAT.leather.bumpScale = 0.012;

  const tTex = TEXTURES.getTire('sport');
  MAT.tire.map = tTex.color;
  MAT.tire.bumpMap = tTex.bump;
  MAT.tire.bumpScale = CONFIG.tire.bumpScale;
}

function updateMaterials(){
  const C = CONFIG;

  const p = C.paint;
  const pt = PAINT_TYPES[p.type] || PAINT_TYPES.metallic;
  MAT.paint.color.set(p.color);
  MAT.paint.metalness = p.metalness;
  MAT.paint.roughness = p.roughness;
  MAT.paint.clearcoat = p.clearcoat;
  MAT.paint.clearcoatRoughness = p.clearcoatRoughness;
  MAT.paint.iridescence = pt.iridescence;
  MAT.paint.iridescenceIOR = 1.35;
  MAT.paint.roughnessMap = pt.flake ? TEXTURES.metalFlake() : null;
  MAT.paint.needsUpdate = true;

  // Color de chapa de techo (independiente o sincronizado)
  const roofColor = C.roofPaint.syncBodyColor ? p.color : C.roofPaint.color;
  MAT.roofPaint.color.set(roofColor);
  MAT.roofPaint.metalness = p.metalness;
  MAT.roofPaint.roughness = p.roughness;
  MAT.roofPaint.clearcoat = p.clearcoat;
  MAT.roofPaint.clearcoatRoughness = p.clearcoatRoughness;
  MAT.roofPaint.iridescence = pt.iridescence;
  MAT.roofPaint.iridescenceIOR = 1.35;
  MAT.roofPaint.roughnessMap = pt.flake ? TEXTURES.metalFlake() : null;
  MAT.roofPaint.needsUpdate = true;

  // Cristales
  MAT.glass.color.set(C.glass.color);
  MAT.glass.opacity = C.glass.opacity;
  MAT.glass.roughness = 0.05;
  MAT.glass.needsUpdate = true;

  MAT.roofGlass.color.set(C.glass.color);
  MAT.roofGlass.opacity = Math.min(1.0, C.glass.opacity + 0.13);
  MAT.roofGlass.needsUpdate = true;

  // Pinzas de freno
  const CALIPER = { red: 0xcc1100, yellow: 0xf2b705, blue: 0x1f5fd1, silver: 0x9aa0a8, black: 0x18191b };
  MAT.caliper.color.setHex(CALIPER[(C.brakes || {}).caliper] || CALIPER.red);

  // Llantas
  MAT.rim.color.set(C.rim.color);
  MAT.rim.metalness = C.rim.metalness;
  MAT.rim.roughness = C.rim.roughness;
  MAT.rim.needsUpdate = true;

  const tTex = TEXTURES.getTire(C.tire.treadStyle);
  MAT.tire.map = tTex.color;
  MAT.tire.bumpMap = tTex.bump;
  MAT.tire.bumpScale = C.tire.bumpScale;
  MAT.tire.needsUpdate = true;

  // Luces
  MAT.headlight.color.set(C.headlight.color);
  MAT.headlight.emissive.copy(kelvinToColor(C.headlight.temperatureK || 6500));
  MAT.headlight.emissiveIntensity = C.headlight.emissiveIntensity;

  MAT.taillight.color.set(C.taillight.color);
  MAT.taillight.emissive.set(C.taillight.color);
  MAT.taillight.emissiveIntensity = C.taillight.emissiveIntensity;
  MAT.tailLens.color.set(C.taillight.color).multiplyScalar(0.55);

  MAT.chrome.color.set(C.chrome.color);
  MAT.chrome.roughness = C.chrome.roughness;

  // Parrilla
  const gt = CONFIG.embeds.grille.texture;
  MAT.grilleBase.map = gt === 'none' ? null : TEXTURES.byName(gt);
  MAT.grilleBase.needsUpdate = true;

  // Interior
  MAT.leather.color.set(C.interior.leatherColor);
  MAT.wood.color.set(C.interior.woodColor);
  MAT.ambient.color.set(C.interior.ambientColor);
  MAT.ambient.emissive.set(C.interior.ambientColor);
  MAT.ambient.emissiveIntensity = C.interior.ambientIntensity;

  }

function addBox(parent, name, size, pos, mat, rot){
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addMesh(parent, name, mesh){
  mesh.name = name;
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// Cilindro entre dos puntos (tubos de defensas, varillas, soportes)
function addTubeBetween(parent, name, a, b, r, mat){
  const dir = new THREE.Vector3().subVectors(b, a);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 16), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return addMesh(parent, name, m);
}

// Sección de rectángulo redondeado para pilares y largueros. round: 0 = arista viva, 1 = redonda.
// Cada punto es [u, v, nu, nv]: posición y normal en el plano de la sección
function roundedRectSection(width, thick, round){
  const hu = width / 2, hv = thick / 2;
  const r = THREE.MathUtils.clamp(round, 0, 1) * Math.min(hu, hv);
  const K = 4;
  const pts = [];
  const centers = [[hu - r, hv - r], [-hu + r, hv - r], [-hu + r, -hv + r], [hu - r, -hv + r]];
  centers.forEach(([cu, cv], q) => {
    for (let k = 0; k <= K; k++){
      const a = (q + k / K) * Math.PI / 2;
      pts.push([cu + r * Math.cos(a), cv + r * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
  });
  return pts;
}

// Barre una sección a lo largo de un camino. axis es el eje fijo de la sección (X para pilares y
// largueros laterales, Z para los travesaños); el otro eje sigue la normal del camino
function sweepSection(parent, name, path, section, axis, mat){
  const pos = [], nor = [], idx = [];
  const n = path.length, m = section.length;
  const frames = [];
  for (let i = 0; i < n; i++){
    const T = new THREE.Vector3().subVectors(path[Math.min(n - 1, i + 1)], path[Math.max(0, i - 1)]).normalize();
    const N = new THREE.Vector3().crossVectors(T, axis).normalize();
    frames.push({ T, N });
    for (const [u, v, nu, nv] of section){
      pos.push(path[i].x + axis.x * u + N.x * v, path[i].y + axis.y * u + N.y * v, path[i].z + axis.z * u + N.z * v);
      nor.push(axis.x * nu + N.x * nv, axis.y * nu + N.y * nv, axis.z * nu + N.z * nv);
    }
  }
  for (let i = 0; i < n - 1; i++){
    for (let j = 0; j < m; j++){
      const a = i * m + j, b = i * m + (j + 1) % m, c = (i + 1) * m + j, d = (i + 1) * m + (j + 1) % m;
      idx.push(a, b, c, b, d, c);
    }
  }
  // Tapas en los extremos
  for (const [i, sign] of [[0, -1], [n - 1, 1]]){
    const { T, N } = frames[i];
    const base = pos.length / 3;
    pos.push(path[i].x, path[i].y, path[i].z);
    nor.push(T.x * sign, T.y * sign, T.z * sign);
    for (const [u, v] of section){
      pos.push(path[i].x + axis.x * u + N.x * v, path[i].y + axis.y * u + N.y * v, path[i].z + axis.z * u + N.z * v);
      nor.push(T.x * sign, T.y * sign, T.z * sign);
    }
    for (let j = 0; j < m; j++) idx.push(base, base + 1 + j, base + 1 + (j + 1) % m);
  }
  // Cada triángulo mira hacia su normal declarada, sin depender del sentido del camino
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), pc = new THREE.Vector3(), nv = new THREE.Vector3();
  for (let k = 0; k < idx.length; k += 3){
    const a = idx[k], b = idx[k + 1], c = idx[k + 2];
    pa.fromArray(pos, a * 3); pb.fromArray(pos, b * 3).sub(pa); pc.fromArray(pos, c * 3).sub(pa);
    nv.set(nor[a * 3] + nor[b * 3] + nor[c * 3], nor[a * 3 + 1] + nor[b * 3 + 1] + nor[c * 3 + 1], nor[a * 3 + 2] + nor[b * 3 + 2] + nor[c * 3 + 2]);
    if (pb.cross(pc).dot(nv) < 0){ idx[k + 1] = c; idx[k + 2] = b; }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return addMesh(parent, name, new THREE.Mesh(geo, mat));
}

// Camino de un pilar en el plano x = cte: Bézier cuadrática de (y0, z0) a (y1, z1).
// bow > 0 lo arquea hacia fuera del habitáculo (delante/arriba en el pilar A, detrás/arriba en el C)
function bowedPath(x, y0, z0, y1, z1, bow, steps = 16){
  const cz = (z0 + z1) / 2 + (y1 - y0) * bow;
  const cy = (y0 + y1) / 2 - (z1 - z0) * bow;
  const pts = [];
  for (let i = 0; i <= steps; i++){
    const t = i / steps, a = (1 - t) * (1 - t), m = 2 * (1 - t) * t, c = t * t;
    pts.push(new THREE.Vector3(x, a * y0 + m * cy + c * y1, a * z0 + m * cz + c * z1));
  }
  return pts;
}

// Altura del techo en (x, z): arco longitudinal y bombeo lateral de la chapa del techo
function roofSurfaceY(P, x, z){
  const rF = P.roofFrontZ, rR = P.roofRearZ;
  const rCurve = CONFIG.glass.roofCurve || 0.0;
  const tZ = THREE.MathUtils.clamp((rF - z) / Math.max(0.01, rF - rR), 0, 1);
  const normX = THREE.MathUtils.clamp(Math.abs(x) / Math.max(0.1, P.cabinW + 0.02), 0, 1);
  return P.roofY + 4 * tZ * (1 - tZ) * rCurve + (1 - normX * normX) * (rCurve * 0.35);
}

// Línea superior del capó y del maletero en z (la misma que dibuja el perfil lateral)
function hoodTopY(P, z){
  const b = P.bottomY, fB = P.frontBeltY, cF = P.cabinFrontZ;
  const t = THREE.MathUtils.clamp((z - cF) / Math.max(0.05, P.hoodFrontZ - cF), 0, 1);
  const noseH = CONFIG.zones.hood.noseHeight !== undefined ? CONFIG.zones.hood.noseHeight : 1.0;
  const linearY = THREE.MathUtils.lerp(fB, b + (fB - b) * noseH, t);
  return linearY + 4 * t * (1 - t) * (CONFIG.zones.hood.curve || 0) * (fB - b) * 0.35;
}

function trunkTopY(P, z){
  const b = P.bottomY, rB = P.rearBeltY, cR = P.cabinRearZ;
  const t = THREE.MathUtils.clamp((cR - z) / Math.max(0.05, cR - P.trunkRearZ), 0, 1);
  const linearY = THREE.MathUtils.lerp(rB, b + (rB - b) * CONFIG.zones.trunk.tailHeight, t);
  return linearY + 4 * t * (1 - t) * (CONFIG.zones.trunk.curve || 0) * (rB - b) * 0.35;
}

function addPanelGap(parent, name, size, pos, rot){
  const m = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), MAT.panelGap);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.name = name;
  m.castShadow = false;
  parent.add(m);
  return m;
}

function addCyl(parent, name, radius, height, pos, mat, rot){
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 16), mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

const EMBED_DEPTH = 0.15;
function embedBox(parent, name, size, surfacePos, axisSign, protrusion, mat, rot){
  let axisIdx = 0;
  if      (axisSign[0] !== 0) axisIdx = 0;
  else if (axisSign[1] !== 0) axisIdx = 1;
  else                        axisIdx = 2;

  const dim = size.slice();
  dim[axisIdx] = EMBED_DEPTH + protrusion;
  const pos = surfacePos.slice();
  pos[axisIdx] += Math.sign(axisSign[axisIdx]) * (protrusion - EMBED_DEPTH) / 2;

  const m = new THREE.Mesh(new THREE.BoxGeometry(dim[0], dim[1], dim[2]), mat);
  m.position.set(pos[0], pos[1], pos[2]);
  if (rot) m.rotation.set(rot[0], rot[1], rot[2]);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function embedCylinder(parent, name, radius, surfacePos, axisSign, protrusion, mat, rot){
  let axisIdx = 0;
  if      (axisSign[0] !== 0) axisIdx = 0;
  else if (axisSign[1] !== 0) axisIdx = 1;
  else                        axisIdx = 2;

  const totalLen = EMBED_DEPTH + protrusion;
  const pos = surfacePos.slice();
  pos[axisIdx] += Math.sign(axisSign[axisIdx]) * (protrusion - EMBED_DEPTH) / 2;

  const geo = new THREE.CylinderGeometry(radius, radius, totalLen, 24);
  const m = new THREE.Mesh(geo, mat);
  if (axisIdx === 0) m.rotation.z = Math.PI / 2;
  if (axisIdx === 2) m.rotation.x = Math.PI / 2;
  if (rot) { m.rotation.x += rot[0]; m.rotation.y += rot[1]; m.rotation.z += rot[2]; }
  m.position.set(pos[0], pos[1], pos[2]);
  m.name = name;
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

function chaikinClosed(points, iterations){
  let cur = points;
  for (let it = 0; it < iterations; it++){
    const next = [];
    const n = cur.length;
    for (let i = 0; i < n; i++){
      const p0 = cur[i];
      const p1 = cur[(i + 1) % n];
      next.push(new THREE.Vector2(0.75*p0.x + 0.25*p1.x, 0.75*p0.y + 0.25*p1.y));
      next.push(new THREE.Vector2(0.25*p0.x + 0.75*p1.x, 0.25*p0.y + 0.75*p1.y));
    }
    cur = next;
  }
  return cur;
}

// Línea de cintura (borde superior de las puertas): une la altura del capó en la parte delantera
// del habitáculo con la del maletero en la trasera. Puertas, cristales y pilares arrancan de ella
function sillY(P, z){
  const t = THREE.MathUtils.clamp((P.cabinFrontZ - z) / Math.max(0.1, P.cabinFrontZ - P.cabinRearZ), 0, 1);
  return THREE.MathUtils.lerp(P.frontBeltY, P.rearBeltY, t);
}

// Pasos de rueda: un arco completo sobre cada eje. Si entra bajo el habitáculo lo recortan también
// las puertas. Siempre queda chapa por encima (capó, maletero o puerta hasta la ventana)
function wheelArches(P){
  const b = P.bottomY;
  const archR   = P.wheelR * (1.25 + CONFIG.smoothing * 0.06);
  // Con la suspensión subida el arco deja más hueco sobre la rueda; bajada, la rueda queda más metida
  const archTop = Math.max(P.wheelR * 2 + 0.04, P.wheelR * 2.4 + (P.lift || 0) * (P.lift > 0 ? 0.8 : 0.6));
  const steps   = 12 + Math.round(CONFIG.smoothing * 16);
  const topAt = z => z > P.cabinFrontZ ? hoodTopY(P, z) : z < P.cabinRearZ ? trunkTopY(P, z) : sillY(P, z) - 0.03;
  const mid = (P.frontAxleZ + P.rearAxleZ) / 2;
  const span = (axleZ, lo, hi) => {
    const a0 = Math.max(axleZ - archR, lo);
    const a1 = Math.min(axleZ + archR, hi);
    if (a1 - a0 < 0.05) return null;
    let top = Infinity;
    for (let i = 0; i <= steps; i++) top = Math.min(top, topAt(a0 + (a1 - a0) * i / steps));
    const yMax = Math.min(archTop, top - 0.03);
    return yMax > b + 0.05 ? { axleZ, a0, a1, yMax } : null;
  };
  return {
    archR, steps,
    rear:  span(P.rearAxleZ,  P.zR + 0.02, mid - 0.05),
    front: span(P.frontAxleZ, mid + 0.05, P.zF - 0.10),
  };
}

// Altura del borde del paso de rueda en z, o null si z no está bajo ningún arco
function archYAt(P, arches, z){
  for (const span of [arches.front, arches.rear]){
    if (!span || z < span.a0 || z > span.a1) continue;
    const t = (z - span.axleZ) / arches.archR;
    return P.bottomY + (span.yMax - P.bottomY) * Math.sqrt(Math.max(0, 1 - t * t));
  }
  return null;
}

// Borde inferior de la carrocería de zR a zF ([z, y], z creciente), subiendo por los pasos de rueda
function bottomEdge(P){
  const b = P.bottomY, arches = wheelArches(P);
  const pts = [[P.zR + 0.02, b]];
  for (const span of [arches.rear, arches.front]){
    if (!span) continue;
    for (let i = 0; i <= arches.steps; i++){
      const z = span.a0 + (span.a1 - span.a0) * i / arches.steps;
      pts.push([z, i === 0 || i === arches.steps ? b : archYAt(P, arches, z)]);
    }
  }
  pts.push([P.zF - 0.02, b]);
  return pts;
}

// Tramo [z0, z1] del borde inferior, con los extremos interpolados
function bottomBetween(P, z0, z1){
  const e = bottomEdge(P);
  const yAt = z => {
    for (let i = 0; i < e.length - 1; i++){
      if (z >= e[i][0] && z <= e[i + 1][0]){
        const t = (z - e[i][0]) / Math.max(1e-9, e[i + 1][0] - e[i][0]);
        return e[i][1] + (e[i + 1][1] - e[i][1]) * t;
      }
    }
    return P.bottomY;
  };
  return [[z0, yAt(z0)], ...e.filter(([z]) => z > z0 + 1e-4 && z < z1 - 1e-4), [z1, yAt(z1)]];
}

// Cara delantera (side = 1) o trasera (side = -1) de la carrocería a la altura y: z de la chapa
// según el contorno lateral. Faros, parrillas y piezas se asientan ahí en vez de en la punta
function faceZ(P, y, side){
  const polys = P.outline || (P.outline = bodyProfilePoints(P));
  let z = NaN;
  for (const pts of polys) for (let i = 0; i < pts.length; i++){
    const a = pts[i], c = pts[(i + 1) % pts.length];
    if (a.y === c.y || (a.y - y) * (c.y - y) > 0) continue;
    const zi = -(a.x + (c.x - a.x) * (y - a.y) / (c.y - a.y));   // el contorno guarda x = -z
    if (Number.isNaN(z) || zi * side > z * side) z = zi;
  }
  return Number.isNaN(z) ? (side > 0 ? P.zF : P.zR) : z + side * 0.01;
}

// Inclinación de esa cara (giro en x para que una pieza quede apoyada sobre la chapa)
function faceTilt(P, y, side){
  return Math.atan2(faceZ(P, y + 0.04, side) - faceZ(P, y - 0.04, side), 0.08);
}

function bodyProfilePoints(P){
  const zF = P.zF, zR = P.zR;
  const b  = P.bottomY;
  const fB = P.frontBeltY;
  const rB = P.rearBeltY;
  const cF = P.cabinFrontZ, cR = P.cabinRearZ;

  // Referencia de perfil para el capó y maletero completamente independiente de los ejes
  const fH = CONFIG.zones.frontBumper.height;
  const fC = CONFIG.zones.frontBumper.curve;
  const rH = CONFIG.zones.rearBumper.height;
  const rC = CONFIG.zones.rearBumper.curve;

  const hoodSpan  = Math.max(0.05, P.hoodFrontZ - cF);
  const trunkSpan = Math.max(0.05, cR - P.trunkRearZ);

  // Morro y zaga: la forma del paragolpes se mide con su propio saliente
  const fOver = P.frontBumperLen;
  const rOver = P.rearBumperLen;

  function getHoodY(z){ return hoodTopY(P, z); }
  function getTrunkY(z){ return trunkTopY(P, z); }

  const noseTopY = getHoodY(zF - 0.02);
  const tailTopY = getTrunkY(zR + 0.02);

  // Puntos del capó distribuidos a lo largo de hoodSpan (100% independientes del eje delantero)
  const zHood1 = cF + hoodSpan * 0.33;
  const zHood2 = cF + hoodSpan * 0.66;

  const hoodSamples = [
    new THREE.Vector2(zF, b),
    new THREE.Vector2(zF - fOver * 0.18 * (1 - fC * 0.25), b + (noseTopY - b) * 0.25 * fH),
    new THREE.Vector2(zF - fOver * 0.35, b + (noseTopY - b) * 0.65 * fH),
    new THREE.Vector2(zF - fOver * 0.55, noseTopY),
    new THREE.Vector2(P.hoodFrontZ, getHoodY(P.hoodFrontZ)),
    new THREE.Vector2(zHood2, getHoodY(zHood2)),
    new THREE.Vector2(zHood1, getHoodY(zHood1)),
    new THREE.Vector2(cF, fB),
  ];

  // Puntos del maletero distribuidos a lo largo de trunkSpan (100% independientes del eje trasero)
  const zTrunk1 = cR - trunkSpan * 0.33;
  const zTrunk2 = cR - trunkSpan * 0.66;

  const trunkSpline = new THREE.SplineCurve([
    new THREE.Vector2(cR, rB),
    new THREE.Vector2(zTrunk1, getTrunkY(zTrunk1)),
    new THREE.Vector2(zTrunk2, getTrunkY(zTrunk2)),
    new THREE.Vector2(P.trunkRearZ, getTrunkY(P.trunkRearZ)),
    new THREE.Vector2(zR + rOver * 0.40, b + (tailTopY - b) * 0.60 * rH),
    new THREE.Vector2(zR + rOver * 0.20 * (1 - rC * 0.3), b + (tailTopY - b) * 0.20 * rH),
    new THREE.Vector2(zR, b),
  ]);
  const trunkSamples = trunkSpline.getPoints(24 + Math.round(CONFIG.smoothing * 10));

  // Dos bloques: morro (de cF a zF) y zaga (de zR a cR). Entre ellos van las puertas y el suelo,
  // así los pasos de rueda pueden entrar bajo el habitáculo sin cruzar el contorno.
  // La esquina inferior junto al habitáculo se duplica para que el suavizado no la redondee
  const v2 = ([z, y]) => new THREE.Vector2(z, y);
  const frontBottom = bottomBetween(P, cF, zF - 0.02).map(v2);
  const rearBottom  = bottomBetween(P, zR + 0.02, cR).map(v2);
  // Las esquinas superiores junto al habitáculo también se duplican: el capó y el maletero llegan
  // enteros a la cintura de la puerta, sin un chaflán entre aleta y puerta
  const front = [...hoodSamples, hoodSamples[hoodSamples.length - 1].clone(), frontBottom[0].clone(), ...frontBottom];
  const rear  = [trunkSamples[0].clone(), ...trunkSamples, ...rearBottom, rearBottom[rearBottom.length - 1].clone()];

  const iters = Math.round(CONFIG.smoothing * 3);
  return [front, rear].map(poly => {
    const smoothed = iters > 0 ? chaikinClosed(poly, iters) : poly;
    return smoothed.map(v => new THREE.Vector2(-v.x, v.y)).reverse();
  });
}

// ---------------------------------------------------------------------------------------------
// FORMA DE LA CARROCERÍA (menos cuadrada): esquinas redondeadas vistas desde arriba, frontal y zaga
// abombados, hombros que se curvan hacia los cristales y cristales laterales inclinados hacia dentro.
// Se aplica al final como una deformación suave del espacio a todo el coche ya montado: chapa,
// huecos de ópticas, faros, parrillas, paragolpes, cristales y piezas siguen la misma forma
const SHAPE_DEFAULT = { corner: 0.26, cornerRear: 0.22, shoulder: 0.07, bow: 0.07, tumblehome: 0.05 };

// Tipos de sección transversal (carrocería por secciones): cuánto se mete el costado hacia dentro
// (fracción del medio ancho) a cada altura v, de 0 abajo a 1 en el borde de arriba (capó, cintura de
// las puertas o maletero). Arriba se meten poco: ahí manda el redondeo de los hombros
const SECTION_PROFILES = {
  flat:    () => 0,
  round:   v => 0.13 * Math.pow(1 - smooth01(v, 0, 0.6), 1.6) + 0.03 * smooth01(v, 0.7, 1),
  barrel:  v => v < 0.5 ? 0.075 * ((0.5 - v) / 0.5) ** 2 : 0.035 * ((v - 0.5) / 0.5) ** 2,
  tuck:    v => 0.09 * (1 - smooth01(v, 0.05, 0.5)),
  wedge:   v => 0.075 * v,
  crease:  v => v < 0.62 ? 0.075 * (0.62 - v) / 0.62 : 0.045 * (v - 0.62) / 0.38,
  pontoon: v => 0.065 * smooth01(v, 0.4, 0.85),
  scallop: v => 0.055 * Math.pow(Math.sin(Math.PI * v), 1.5),
  boat:    v => 0.22 * Math.pow(1 - smooth01(v, 0, 0.8), 1.4),
};

// Contorno desplazado d hacia fuera (normal media de los dos tramos de cada punto)
function growOutline(polys, d){
  return polys.map(pts => {
    const n = pts.length;
    let area = 0;
    for (let i = 0; i < n; i++){ const a = pts[i], c = pts[(i + 1) % n]; area += a.x * c.y - c.x * a.y; }
    const sg = area > 0 ? 1 : -1;
    const segN = pts.map((a, i) => {
      const c = pts[(i + 1) % n], dx = c.x - a.x, dy = c.y - a.y, l = Math.hypot(dx, dy);
      return l < 1e-9 ? null : [sg * dy / l, -sg * dx / l];
    });
    return pts.map((p, i) => {
      let k = i - 1, m = i;
      while (!segN[(k + n) % n] && k > i - n) k--;
      while (!segN[m % n] && m < i + n) m++;
      const a = segN[(k + n) % n], c = segN[m % n];
      if (!a || !c) return p.clone();
      let nx = a[0] + c[0], ny = a[1] + c[1];
      const l = Math.hypot(nx, ny);
      if (l < 1e-6){ nx = c[0]; ny = c[1]; } else { nx /= l; ny /= l; }
      return new THREE.Vector2(p.x + d * nx, p.y + d * ny);
    });
  });
}

// Cortes del contorno lateral (que guarda x = -z) con la vertical z = v (devuelve las y) o con la
// horizontal y = v (devuelve las z)
function outlineCuts(polys, axis, v){
  const out = [];
  for (const pts of polys) for (let i = 0; i < pts.length; i++){
    const a = pts[i], c = pts[(i + 1) % pts.length];
    const pa = axis === 'z' ? -a.x : a.y, pc = axis === 'z' ? -c.x : c.y;
    if (pa === pc || (pa - v) * (pc - v) > 0) continue;
    const t = (v - pa) / (pc - pa);
    out.push(axis === 'z' ? a.y + (c.y - a.y) * t : -(a.x + (c.x - a.x) * t));
  }
  return out;
}

function lut(T, v0, v1, v){
  const n = T.length - 1;
  let t = (v - v0) / (v1 - v0) * n;
  if (t <= 0) return T[0];
  if (t >= n) return T[n];
  const i = Math.floor(t);
  t -= i;
  return T[i] + (T[i + 1] - T[i]) * t;
}

function smooth01(x, a, b){
  if (x <= a) return 0;
  if (x >= b) return 1;
  const t = (x - a) / (b - a);
  return t * t * (3 - 2 * t);
}

// Parámetros de la deformación para este coche, recortados para que nunca toque los pasos de rueda
function shapeParams(P){
  if (P._shape) return P._shape;
  const C = Object.assign({}, SHAPE_DEFAULT, CONFIG.shape || {});
  // La chapa queda 1,2 cm por fuera del contorno (como en bodyBlocksGeometry): ahí se ancla el redondeo
  const polys = growOutline(P.outline || (P.outline = bodyProfilePoints(P)), 0.012);
  const b = P.bottomY, cF = P.cabinFrontZ, cR = P.cabinRearZ;
  const H = P.halfW - 0.01;
  const S = { P, H, cF, cR };
  const arches = wheelArches(P);

  // Línea superior del costado en z: capó y maletero según el contorno, puertas en la cintura
  const NZ = 320;
  S.z0 = P.zR - 0.3; S.z1 = P.zF + 0.3;
  const zAt = i => S.z0 + (S.z1 - S.z0) * i / NZ;
  S.topT = new Float32Array(NZ + 1);
  for (let i = 0; i <= NZ; i++){
    const z = zAt(i);
    if (z <= cF && z >= cR){ S.topT[i] = sillY(P, z) + 0.012; continue; }
    const ys = outlineCuts(polys, 'z', z);
    S.topT[i] = ys.length ? Math.max(...ys) : b;
  }
  // El hombro se desvanece donde la línea superior cae (morro y zaga) y fuera de la carrocería
  const rs0 = THREE.MathUtils.clamp(C.shoulder, 0, 0.16);
  const raw = new Float32Array(NZ + 1);
  const dz = (S.z1 - S.z0) / NZ;
  for (let i = 0; i <= NZ; i++){
    const z = zAt(i);
    if (z > P.zF - 0.02 || z < P.zR + 0.02){ raw[i] = 0; continue; }
    const i0 = Math.max(0, i - 2), i1 = Math.min(NZ, i + 2);
    const slope = Math.abs(S.topT[i1] - S.topT[i0]) / ((i1 - i0) * dz);
    const room = THREE.MathUtils.clamp((S.topT[i] - b - 0.08) / 2, 0, 1);
    raw[i] = rs0 * (1 - smooth01(slope, 0.45, 1.1)) * Math.min(1, room / Math.max(1e-3, rs0));
  }
  S.rsT = new Float32Array(NZ + 1);
  for (let i = 0; i <= NZ; i++){
    let s = 0, n = 0;
    for (let k = -4; k <= 4; k++){ const j = i + k; if (j >= 0 && j <= NZ){ s += raw[j]; n++; } }
    S.rsT[i] = s / n;
  }
  S.rsMax = Math.max(0, ...S.rsT);
  S.topMin = Math.min(P.frontBeltY, P.rearBeltY, P.noseTopY, P.tailTopY);

  // Frontal y zaga: z más adelantada (y más atrasada) del contorno a cada altura. Por encima del
  // morro se usa la del borde del capó, así se redondean también sus esquinas
  const NY = 220;
  S.y0 = b - 0.5; S.y1 = P.roofY + 0.6;
  const yAt = j => S.y0 + (S.y1 - S.y0) * j / NY;
  const capF = Math.max(b + 0.02, P.noseTopY - 0.012), capR = Math.max(b + 0.02, P.tailTopY - 0.012);
  S.zAF = new Float32Array(NY + 1);
  S.zAR = new Float32Array(NY + 1);
  for (let j = 0; j <= NY; j++){
    const zf = outlineCuts(polys, 'y', THREE.MathUtils.clamp(yAt(j), b + 0.004, capF));
    const zr = outlineCuts(polys, 'y', THREE.MathUtils.clamp(yAt(j), b + 0.004, capR));
    S.zAF[j] = zf.length ? Math.max(...zf) : P.zF;
    S.zAR[j] = zr.length ? Math.min(...zr) : P.zR;
  }

  // Radio de las esquinas a cada altura: deja siempre chapa recta delante y detrás del paso de
  // rueda (más arriba del arco la esquina puede ser más redonda)
  const cornerT = (span, e, want, zAT) => {
    const T = new Float32Array(NY + 1);
    const cap = Math.max(0, Math.min(want, H * 0.45, e > 0 ? (P.zF - cF) * 0.5 : (cR - P.zR) * 0.5));
    for (let j = 0; j <= NY; j++){
      const y = yAt(j);
      let m = cap;
      if (span && y < span.yMax + 0.12){
        const t = THREE.MathUtils.clamp((y - b) / Math.max(1e-3, span.yMax - b), 0, 1);
        const zEdge = span.axleZ + e * arches.archR * Math.sqrt(Math.max(0, 1 - t * t));
        m = Math.min(m, e * (zAT[j] - zEdge) - 0.04);
      }
      T[j] = Math.max(0, m);
    }
    // Sin cambios bruscos de una altura a otra
    for (let pass = 0; pass < 2; pass++){
      for (let j = 1; j <= NY; j++) T[j] = Math.min(T[j], T[j - 1] + 0.012);
      for (let j = NY - 1; j >= 0; j--) T[j] = Math.min(T[j], T[j + 1] + 0.012);
    }
    return T;
  };
  S.rcFT = cornerT(arches.front, 1, C.corner, S.zAF);
  S.rcRT = cornerT(arches.rear, -1, C.cornerRear, S.zAR);
  S.rcF = Math.max(...S.rcFT);
  S.rcR = Math.max(...S.rcRT);
  S.zcF = Math.min(...S.zAF.map((z, j) => z - S.rcFT[j]));
  S.zcR = Math.max(...S.zAR.map((z, j) => z + S.rcRT[j]));

  // Abombado: crece desde detrás del paso de rueda (o del parabrisas) hasta la cara del frontal
  const zFaceF = lut(S.zAF, S.y0, S.y1, capF), zFaceR = lut(S.zAR, S.y0, S.y1, capR);
  S.zbF0 = Math.max(arches.front ? arches.front.axleZ + arches.archR + 0.04 : -Infinity, cF + 0.12);
  S.zbF1 = Math.max(S.zbF0 + 0.10, Math.min(zFaceF, P.zF - 0.05));
  S.zbR0 = Math.min(arches.rear ? arches.rear.axleZ - arches.archR - 0.04 : Infinity, cR - 0.12);
  S.zbR1 = Math.min(S.zbR0 - 0.10, Math.max(zFaceR, P.zR + 0.05));
  S.bowF = P.zF - S.zbF0 > 0.15 ? Math.max(0, Math.min(C.bow, (S.zbF1 - S.zbF0) / 1.7)) : 0;
  S.bowR = S.zbR0 - P.zR > 0.15 ? Math.max(0, Math.min(C.bow, (S.zbR0 - S.zbR1) / 1.7)) : 0;

  // Cristales inclinados hacia dentro: de la cintura (0) al techo (todo)
  S.lean = THREE.MathUtils.clamp(C.tumblehome, 0, 0.15);
  S.beltMin = Math.min(P.frontBeltY, P.rearBeltY);
  S.greenH = Math.max(0.2, P.roofY - S.beltMin);

  // Líneas de carrocería: pliegues de la chapa del costado (cintura, pliegue medio y estribo) y
  // nervios del capó. Cada línea del costado es una tabla en z de su altura y de su fuerza
  const BL = Object.assign({ belt: 'none', crease: 'none', hood: 'none', rocker: 'none', depth: 1 }, CONFIG.bodyLines || {});
  const depthK = THREE.MathUtils.clamp(BL.depth, 0, 2.5);
  const beltMinY = Math.min(P.frontBeltY, P.rearBeltY);
  S.sideLines = [];
  S.lz0 = P.zR + 0.25 + S.rcR; S.lz1 = P.zF - 0.25 - S.rcF;
  S.ly0 = Infinity; S.ly1 = -Infinity;
  const fadeEnds = z => smooth01(z, S.lz0, S.lz0 + 0.3) * (1 - smooth01(z, S.lz1 - 0.3, S.lz1));
  const sideLine = (kind, amp, w, yAtZ, weight) => {
    if (!amp || depthK <= 0 || S.lz1 - S.lz0 < 0.8) return;
    const c = new Float32Array(NZ + 1), a = new Float32Array(NZ + 1);
    for (let i = 0; i <= NZ; i++) c[i] = yAtZ(zAt(i));
    // Sin quiebros donde cambia de bloque
    const c0 = c.slice();
    for (let i = 0; i <= NZ; i++){
      let sum = 0, n = 0;
      for (let k = -7; k <= 7; k++){ const j = i + k; if (j >= 0 && j <= NZ){ sum += c0[j]; n++; } }
      c[i] = sum / n;
    }
    for (let i = 0; i <= NZ; i++){
      const z = zAt(i);
      // Nunca dentro del redondeo del hombro
      c[i] = Math.min(c[i], S.topT[i] - S.rsT[i] - 0.035);
      a[i] = amp * depthK * weight(z, c[i]);
      if (a[i] !== 0){ S.ly0 = Math.min(S.ly0, kind === 'scoop' ? b - 0.05 : c[i] - w - 0.01); S.ly1 = Math.max(S.ly1, c[i] + (kind === 'step' ? 0.23 : w + 0.01)); }
    }
    S.sideLines.push({ kind, c, a, w });
  };
  // Lejos de los pasos de rueda (la línea se desvanece donde pasaría por encima de un arco)
  const archFade = (z, y, clear) => {
    const ya = archYAt(P, arches, z);
    return ya === null ? 1 : smooth01(y - ya, clear * 0.5, clear * 1.6);
  };
  const beltRef = z => sillY(P, THREE.MathUtils.clamp(z, cR, cF)) - 0.075 - rs0;
  if (BL.belt === 'sharp') sideLine('ridge', 0.008, 0.045, beltRef, (z, y) => fadeEnds(z) * archFade(z, y, 0.07));
  if (BL.belt === 'step')  sideLine('step', 0.009, 0.02, beltRef, (z, y) => fadeEnds(z) * archFade(z, y, 0.08));
  const tRear = z => THREE.MathUtils.clamp((P.zF - z) / Math.max(0.5, P.zF - P.zR), 0, 1);
  const creaseY = z => b + (beltMinY - b) * 0.52 + (BL.crease === 'rising' ? 0.12 : 0.03) * tRear(z);
  if (BL.crease === 'ridge' || BL.crease === 'rising') sideLine('ridge', 0.0065, 0.04, creaseY, (z, y) => fadeEnds(z) * archFade(z, y, 0.06));
  if (BL.crease === 'groove') sideLine('ridge', -0.0065, 0.04, creaseY, (z, y) => fadeEnds(z) * archFade(z, y, 0.06));
  // Pliegues en Z: uno sube desde lo alto del paso de rueda delantero hacia la puerta trasera
  // (lo de encima sale hacia fuera) y otro baja desde el paso trasero hacia la puerta delantera
  // (lo de debajo queda hundido): entre los dos queda una faceta en diagonal
  if (BL.crease === 'kinetic' && arches.front && arches.rear){
    const fa = arches.front, ra = arches.rear;
    const zA0 = fa.a0 + 0.02, yA0 = fa.yMax + 0.03, zA1 = cR + 0.30, yA1 = beltMinY - 0.17;
    if (zA0 - zA1 > 0.6 && yA1 > yA0 + 0.03){
      const lineA = z => yA0 + (yA1 - yA0) * THREE.MathUtils.clamp((zA0 - z) / (zA0 - zA1), 0, 1);
      sideLine('step', 0.008, 0.016, lineA, z => smooth01(z, zA1 - 0.02, zA1 + 0.18) * (1 - smooth01(z, zA0 - 0.12, zA0 + 0.02)));
    }
    const zB0 = ra.a1 - 0.02, yB0 = ra.yMax + 0.02, zB1 = cF - 0.25, yB1 = b + 0.15;
    if (zB1 - zB0 > 0.6){
      const lineB = z => yB0 + (yB1 - yB0) * THREE.MathUtils.clamp((z - zB0) / (zB1 - zB0), 0, 1);
      sideLine('scoop', 0.010, 0.03, lineB, z => smooth01(z, zB0 - 0.02, zB0 + 0.18) * (1 - smooth01(z, zB1 - 0.18, zB1 + 0.02)));
    }
  }
  // Estribo: solo entre los dos pasos de rueda, subiendo hacia la rueda trasera
  if (BL.rocker !== 'none' && arches.front && arches.rear){
    const zA0 = arches.rear.a1, zA1 = arches.front.a0;
    const rise = BL.rocker === 'scoop' ? 0.08 : 0;
    const rockY = z => b + 0.11 + rise * THREE.MathUtils.clamp((zA1 - z) / Math.max(0.3, zA1 - zA0), 0, 1);
    const between = z => smooth01(z, zA0 + 0.02, zA0 + 0.16) * (1 - smooth01(z, zA1 - 0.16, zA1 - 0.02));
    if (zA1 - zA0 > 0.6){
      if (BL.rocker === 'scoop') sideLine('scoop', 0.013, 0.03, rockY, z => between(z));
      else sideLine('ridge', -0.0065, 0.035, rockY, z => between(z));
    }
  }
  // Nervios del capó: se acercan un poco entre sí hacia el morro
  S.hoodRidges = [];
  S.dome = 0;
  S.hz0 = cF + 0.08;
  S.hz1 = Math.min(lut(S.zAF, S.y0, S.y1, capF) - S.rcF * 0.5, P.hoodFrontZ + 0.05) - 0.04;
  if (BL.hood !== 'none' && depthK > 0 && S.hz1 - S.hz0 > 0.3){
    const span = H - rs0;
    if (BL.hood === 'two') S.hoodRidges.push([0.45 * span, 0.012 * depthK, 0.08]);
    if (BL.hood === 'four') S.hoodRidges.push([0.24 * span, 0.009 * depthK, 0.06], [0.56 * span, 0.011 * depthK, 0.07]);
    if (BL.hood === 'dome'){ S.dome = 0.028 * depthK; S.domeW = 0.55 * span; }
  }
  S.hoodOn = S.hoodRidges.length > 0 || S.dome > 0;
  S.hoodYMin = Math.min(P.frontBeltY, P.noseTopY) - 0.08;

  // Carrocería por secciones: ancho del costado a cada altura según el tipo de sección, más aletas
  // sobre las ruedas, cintura de avispa entre los ejes y morro y zaga afilados vistos desde arriba.
  // Todo son tablas en z; junto a las ruedas el costado nunca se mete por dentro del neumático
  const BC = bodyCfg();
  S.sec = null;
  if (BC.build === 'sections'){
    const cl = THREE.MathUtils.clamp;
    const kind = SECTION_PROFILES[BC.section] ? BC.section : 'flat';
    const k = cl(+BC.depth || 0, 0, 2.5), flare = cl(+BC.flare || 0, 0, 0.2), waist = cl(+BC.waist || 0, 0, 0.15), taper = cl(+BC.taper || 0, 0, 0.4);
    if ((kind !== 'flat' && k > 0) || flare > 0 || waist > 0 || taper > 0){
      const C = { prof: SECTION_PROFILES[kind], k, flare, waist, b };
      const T = () => new Float32Array(NZ + 1);
      C.topT = T(); C.flT = T(); C.pT = T(); C.wT = T(); C.tpT = T(); C.yaT = T(); C.cabT = T();
      const spans = [arches.front, arches.rear].filter(Boolean);
      const R = arches.archR;
      const fa = arches.front, ra = arches.rear;
      const zA = ra ? ra.a1 : P.rearAxleZ + R, zB = fa ? fa.a0 : P.frontAxleZ - R, gap = zB - zA;
      const ztF = fa ? fa.axleZ : P.zF - 0.8, ztR = ra ? ra.axleZ : P.zR + 0.8;
      for (let i = 0; i <= NZ; i++){
        const z = cl(zAt(i), P.zR + 0.03, P.zF - 0.03);
        C.topT[i] = Math.max(b + 0.1, lut(S.topT, S.z0, S.z1, z));
        let fl = 0, pr = 0, ya = b + 2 * P.wheelR, best = Infinity;
        for (const sp of spans){
          const u = (z - sp.axleZ) / (R * 1.7);
          if (u > -1 && u < 1) fl = Math.max(fl, (1 - u * u) * (1 - u * u));
          pr = Math.max(pr, 1 - smooth01(Math.abs(z - sp.axleZ) - R - 0.04, 0, 0.15));
          if (Math.abs(z - sp.axleZ) < best){ best = Math.abs(z - sp.axleZ); ya = sp.yMax; }
        }
        C.flT[i] = fl; C.pT[i] = pr; C.yaT[i] = ya;
        C.wT[i] = gap > 0.5 ? smooth01(z, zA + 0.05, zA + 0.05 + 0.4 * gap) * (1 - smooth01(z, zB - 0.25 * gap, zB - 0.05)) : 0;
        const tf = smooth01(z, ztF, P.zF), tr = smooth01(-z, -ztR, -P.zR);
        C.tpT[i] = taper * (tf * tf + tr * tr);
        C.cabT[i] = smooth01(z, cR - 0.3, cR + 0.1) * (1 - smooth01(z, cF - 0.1, cF + 0.3));
      }
      S.sec = C;
    }
  }

  S.active = S.rsMax > 1e-3 || S.rcF > 1e-3 || S.rcR > 1e-3 || S.bowF > 0 || S.bowR > 0 || S.lean > 0 || S.sideLines.length > 0 || S.hoodOn || !!S.sec;
  return (P._shape = S);
}

// Todo lo que cambia la deformación, para las cachés de la chapa
function shapeKey(P){
  const { guides, ...body } = bodyCfg();
  return JSON.stringify([CONFIG.shape, CONFIG.bodyLines, body, P.halfW, P.roofY, P.bottomY, P.zF, P.zR, P.cabinFrontZ, P.cabinRearZ, P.frontBeltY,
    P.rearBeltY, P.noseTopY, P.tailTopY, P.frontAxleZ, P.rearAxleZ, P.wheelR, P.lift, CONFIG.smoothing]);
}

// La deformación en un punto (en el espacio del coche, antes de la inclinación); modifica p
function shapeMap(S, p){
  let ax = Math.abs(p[0]), y = p[1], z = p[2];
  const sx = p[0] < 0 ? -1 : 1;
  // Esquina de un cuadrado de lado r -> cuarto de círculo (las rectas u = 0 y v = 0 no se mueven);
  // lo que sobresale del cuadrado (ópticas, molduras) se desplaza con el borde
  let uc, vc;
  // Líneas de carrocería del costado: pliegues hacia fuera o hacia dentro de la chapa
  if (S.sideLines.length && ax > S.H - 0.12 && z > S.lz0 && z < S.lz1 && y > S.ly0 && y < S.ly1){
    let dx = 0;
    for (const L of S.sideLines){
      const a = lut(L.a, S.z0, S.z1, z);
      if (a === 0) continue;
      // Perfiles suaves (sin picos): la luz marca la línea sin rayas en la malla
      const d = y - lut(L.c, S.z0, S.z1, z);
      if (L.kind === 'ridge'){ const t = d / L.w; if (t > -1 && t < 1) dx += a * (1 - t * t) * (1 - t * t); }
      else if (L.kind === 'step') dx += a * (d < 0 ? smooth01(d, -L.w, 0) : 1 - smooth01(d, 0, 0.22));
      else if (d < 0) dx -= a * smooth01(-d, 0, L.w);   // scoop: la parte de abajo queda metida
    }
    ax += dx * smooth01(ax, S.H - 0.12, S.H - 0.05);
  }
  // Nervios del capó
  if (S.hoodOn && z > S.hz0 && z < S.hz1 && y > S.hoodYMin && ax < S.H){
    const top = lut(S.topT, S.z0, S.z1, z);
    if (y > top - 0.06){
      const t = (z - S.hz0) / (S.hz1 - S.hz0);
      const k = smooth01(z, S.hz0, S.hz0 + 0.15) * (1 - smooth01(z, S.hz1 - 0.15, S.hz1)) * smooth01(y, top - 0.06, top - 0.012);
      let dy = 0;
      for (const [xr, amp, w] of S.hoodRidges){
        const u = (ax - xr * (1 - 0.12 * t)) / w;
        if (u > -1 && u < 1) dy += amp * (1 - u * u) * (1 - u * u);
      }
      if (S.dome) dy += S.dome * Math.max(0, 1 - (ax / S.domeW) * (ax / S.domeW));
      y += k * dy;
    }
  }
  // Hombros: el canto entre el costado y el capó, la cintura de las puertas o el maletero
  if (S.rsMax > 1e-3 && ax > S.H - S.rsMax && y > S.topMin - S.rsMax - 0.02){
    const rs = lut(S.rsT, S.z0, S.z1, z);
    if (rs > 1e-3){
      const top = lut(S.topT, S.z0, S.z1, z);
      const u = (ax - S.H + rs) / rs, v = (y - top + rs) / rs;
      if (u > 0 && v > 0){
        uc = u < 1 ? u : 1; vc = v < 1 ? v : 1;
        ax = S.H - rs + (uc * Math.sqrt(1 - vc * vc / 2) + u - uc) * rs;
        y  = top - rs + (vc * Math.sqrt(1 - uc * uc / 2) + v - vc) * rs;
      }
    }
  }
  // Esquinas vistas desde arriba
  if (S.rcF > 1e-3 && z > S.zcF && ax > S.H - S.rcF){
    const r = lut(S.rcFT, S.y0, S.y1, y), zA = lut(S.zAF, S.y0, S.y1, y);
    const u = (ax - S.H + r) / r, w = (z - zA + r) / r;
    if (r > 1e-3 && u > 0 && w > 0){
      uc = u < 1 ? u : 1; vc = w < 1 ? w : 1;
      ax = S.H - r + (uc * Math.sqrt(1 - vc * vc / 2) + u - uc) * r;
      z  = zA - r + (vc * Math.sqrt(1 - uc * uc / 2) + w - vc) * r;
    }
  }
  if (S.rcR > 1e-3 && z < S.zcR && ax > S.H - S.rcR){
    const r = lut(S.rcRT, S.y0, S.y1, y), zA = lut(S.zAR, S.y0, S.y1, y);
    const u = (ax - S.H + r) / r, w = (zA + r - z) / r;
    if (r > 1e-3 && u > 0 && w > 0){
      uc = u < 1 ? u : 1; vc = w < 1 ? w : 1;
      ax = S.H - r + (uc * Math.sqrt(1 - vc * vc / 2) + u - uc) * r;
      z  = zA + r - (vc * Math.sqrt(1 - uc * uc / 2) + w - vc) * r;
    }
  }
  // Frontal y zaga abombados: el centro queda donde está y los lados retroceden
  const q = (ax / S.H) * (ax / S.H);
  if (S.bowF > 0 && z > S.zbF0) z -= smooth01(z, S.zbF0, S.zbF1) * S.bowF * q;
  if (S.bowR > 0 && z < S.zbR0) z += smooth01(-z, -S.zbR0, -S.zbR1) * S.bowR * q;
  // Secciones: el costado se mete o se sale a cada altura (lo de dentro se escala con él). Por encima
  // del borde de arriba (cristales, techo, alerones) vale la sección de ese borde, sin las aletas
  if (S.sec){
    const C = S.sec;
    const top = lut(C.topT, S.z0, S.z1, z);
    const yc = y < top ? y : top;
    const v = Math.min(1, Math.max(0, (yc - C.b) / Math.max(0.05, top - C.b)));
    const ya = lut(C.yaT, S.z0, S.z1, z);
    let xs = S.H * (1 - C.k * C.prof(v)) - C.waist * lut(C.wT, S.z0, S.z1, z) * (0.55 + 0.45 * v) - lut(C.tpT, S.z0, S.z1, z);
    const pw = lut(C.pT, S.z0, S.z1, z) * (1 - smooth01(yc, ya + 0.04, ya + 0.18));
    if (xs < S.H && pw > 0) xs += (S.H - xs) * pw;
    let fl = C.flare * lut(C.flT, S.z0, S.z1, z) * (1 - smooth01(yc, ya + 0.02, ya + 0.26));
    if (y > top) fl *= 1 - lut(C.cabT, S.z0, S.z1, z);
    ax *= Math.max(0.5, (xs + fl) / S.H);
  }
  // Cristales y techo inclinados hacia dentro por encima de la cintura
  if (S.lean > 0 && y > S.beltMin){
    const belt = sillY(S.P, z);
    if (y > belt){
      const out = z > S.cF ? z - S.cF : z < S.cR ? S.cR - z : 0;
      if (out < 0.3) ax *= 1 - S.lean * Math.min(1, (y - belt) / S.greenH) * (1 - smooth01(out, 0, 0.3));
    }
  }
  p[0] = sx * ax; p[1] = y; p[2] = z;
  return p;
}

// ¿Puede la deformación mover algo dentro de la caja [min, max]?
function shapeTouches(S, mn, mx){
  const axMax = Math.max(Math.abs(mn.x), Math.abs(mx.x));
  if (S.sec && axMax > 1e-3) return true;
  if (S.rsMax > 1e-3 && axMax > S.H - S.rsMax && mx.y > S.topMin - S.rsMax - 0.02) return true;
  if (S.rcF > 1e-3 && mx.z > S.zcF && axMax > S.H - S.rcF) return true;
  if (S.rcR > 1e-3 && mn.z < S.zcR && axMax > S.H - S.rcR) return true;
  if (S.bowF > 0 && mx.z > S.zbF0) return true;
  if (S.bowR > 0 && mn.z < S.zbR0) return true;
  if (S.lean > 0 && mx.y > S.beltMin && mx.z > S.cR - 0.3 && mn.z < S.cF + 0.3) return true;
  if (S.sideLines.length && axMax > S.H - 0.12 && mx.z > S.lz0 && mn.z < S.lz1 && mx.y > S.ly0 && mn.y < S.ly1) return true;
  if (S.hoodOn && mx.z > S.hz0 && mn.z < S.hz1 && mx.y > S.hoodYMin && Math.min(Math.abs(mn.x), Math.abs(mx.x)) * (mn.x * mx.x > 0 ? 1 : 0) < S.H) return true;
  return false;
}

// Reparto de las K filas de una columna del costado entre yLo y yHi (fracciones de 0 a 1): más
// apretadas junto al hombro y alrededor de cada línea de carrocería, así las filas siguen las
// líneas y los pliegues salen limpios sin tener que partir triángulos
function rowFractions(S, z, yLo, yHi, K){
  const n = 96, F = new Float64Array(n + 1);
  const lines = S ? S.sideLines.filter(L => lut(L.a, S.z0, S.z1, z) !== 0).map(L => [lut(L.c, S.z0, S.z1, z), Math.max(0.02, L.w * 1.3)]) : [];
  const dens = y => {
    let r = 1 + 1.5 * Math.exp(-((yHi - y) / 0.09) * ((yHi - y) / 0.09));
    for (const [c, w] of lines){ const t = (y - c) / w; r += 5 * Math.exp(-t * t); }
    return r;
  };
  let prev = dens(yLo);
  for (let i = 1; i <= n; i++){ const d = dens(yLo + (yHi - yLo) * i / n); F[i] = F[i - 1] + (prev + d) / 2; prev = d; }
  const tot = F[n] || 1, out = [0];
  let i = 0;
  for (let k = 1; k < K; k++){
    const target = tot * k / K;
    while (i < n - 1 && F[i + 1] < target) i++;
    out.push((i + (target - F[i]) / Math.max(1e-12, F[i + 1] - F[i])) / n);
  }
  out.push(1);
  return out;
}

// Malla de los bloques de morro y zaga a partir de su contorno lateral (x = -z, y): una banda que
// recorre el contorno de lado a lado (1,2 cm por fuera, como el bisel de antes) y dos costados planos
// en x = ±H hechos con una rejilla ordenada de columnas entre el borde de arriba y el de abajo. Así
// la deformación de la forma los curva sin pliegues. Devuelve null si un contorno no encaja
function bodyBlocksGeometry(blocks, P, H){
  const pos = [], uv = [], index = [];
  const S = shapeParams(P);
  const ok = blocks.every((poly, k) => blockMesh(poly, k === 0 ? P.cabinFrontZ : P.cabinRearZ, k === 0 ? 1 : -1, H, pos, uv, index, S));
  if (!ok) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// Columnas de un bloque (morro o zaga) a partir de su contorno lateral (x = -z, y): parejas de puntos
// del borde de arriba y del de abajo con un parámetro común, ya 1,2 cm por fuera del contorno. step es
// el paso máximo del parámetro entre columnas; con allBreaks pasan por todos los puntos del contorno
// (malla clásica), si no solo por sus quiebros (secciones). null si el contorno no encaja
function blockColumns(poly, zCab, e, S, step, allBreaks){
  let pts = poly.map(v => [-v.x, v.y]);
  pts = pts.filter((p, i) => { const q = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-6; });
  const n = pts.length;
  if (n < 4) return null;
  const onCab = p => Math.abs(p[0] - zCab) < 1e-4;
  let iTop = -1, iBot = -1, iTip = 0;
  for (let i = 0; i < n; i++){
    if (onCab(pts[i])){
      if (iTop < 0 || pts[i][1] > pts[iTop][1]) iTop = i;
      if (iBot < 0 || pts[i][1] < pts[iBot][1]) iBot = i;
    }
    if (e * pts[i][0] > e * pts[iTip][0]) iTip = i;
  }
  if (iTop < 0 || iTop === iBot || iTip === iTop || iTip === iBot) return null;
  // Borde de arriba (de la esquina superior junto al habitáculo a la punta) y borde de abajo
  const nxt = i => (i + 1) % n, prv = i => (i + n - 1) % n;
  const dir = onCab(pts[nxt(iTop)]) ? -1 : 1;
  const walk = (i0, d) => {
    const out = [];
    for (let i = i0; ; i = d > 0 ? nxt(i) : prv(i)){
      out.push(pts[i].slice());
      if (i === iTip) return out;
      if (out.length > n) return null;
    }
  };
  const top = walk(iTop, dir), bot = walk(iBot, -dir);
  if (!top || !bot || top.length < 2 || bot.length < 2) return null;
  // Siempre avanzando hacia la punta, y un parámetro común (avance + longitud) para emparejarlos
  const param = ch => {
    const t = [0];
    for (let i = 1; i < ch.length; i++){
      if (e * ch[i][0] < e * ch[i - 1][0]) ch[i][0] = ch[i - 1][0];
      t.push(t[i - 1] + e * (ch[i][0] - ch[i - 1][0]) + 0.25 * Math.hypot(ch[i][0] - ch[i - 1][0], ch[i][1] - ch[i - 1][1]));
    }
    const L = t[t.length - 1] || 1;
    return t.map(v => v / L);
  };
  const tT = param(top), tB = param(bot);
  // Quiebros de un borde (cantos de más de 20°): las secciones siempre pasan por ellos
  const breaks = (ch, t) => t.filter((v, i) => {
    if (i === 0 || i === ch.length - 1) return true;
    const ax = ch[i][0] - ch[i - 1][0], ay = ch[i][1] - ch[i - 1][1], bx = ch[i + 1][0] - ch[i][0], by = ch[i + 1][1] - ch[i][1];
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    return la > 1e-6 && lb > 1e-6 && (ax * bx + ay * by) / (la * lb) < Math.cos(20 * Math.PI / 180);
  });
  let ts = (allBreaks ? [...tT, ...tB] : [...breaks(top, tT), ...breaks(bot, tB)]).sort((a, b) => a - b);
  const filled = [];
  for (const v of ts){
    const last = filled[filled.length - 1];
    if (last !== undefined && v - last < 2e-4) continue;
    if (last !== undefined){ const k = Math.ceil((v - last) / step - 1e-9); for (let j = 1; j < k; j++) filled.push(last + (v - last) * j / k); }
    filled.push(v);
  }
  ts = filled;
  const sample = (ch, t, v) => {
    let i = 0;
    while (i < t.length - 2 && t[i + 1] < v) i++;
    const f = THREE.MathUtils.clamp((v - t[i]) / Math.max(1e-9, t[i + 1] - t[i]), 0, 1);
    return [ch[i][0] + (ch[i + 1][0] - ch[i][0]) * f, ch[i][1] + (ch[i + 1][1] - ch[i][1]) * f];
  };
  const T = ts.map(v => sample(top, tT, v)), B = ts.map(v => sample(bot, tB, v));
  T[T.length - 1] = B[B.length - 1] = pts[iTip].slice();
  const M = ts.length, K = 36;
  // Contorno de la banda: arriba hasta la punta, abajo de vuelta y el borde del habitáculo
  const fr0 = rowFractions(S, zCab, B[0][1], T[0][1], K);
  const loop = [...T];
  for (let j = M - 2; j >= 0; j--) loop.push(B[j]);
  for (let k = 1; k < K; k++) loop.push([B[0][0] + (T[0][0] - B[0][0]) * fr0[k], B[0][1] + (T[0][1] - B[0][1]) * fr0[k]]);
  const L = loop.length;
  let area = 0;
  for (let i = 0; i < L; i++){ const a = loop[i], c = loop[(i + 1) % L]; area += a[0] * c[1] - c[0] * a[1]; }
  const sg = area > 0 ? 1 : -1;
  const segN = [];
  for (let i = 0; i < L; i++){
    const a = loop[i], c = loop[(i + 1) % L];
    const dz = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dz, dy) || 1;
    segN.push([sg * dy / l, -sg * dz / l]);
  }
  // Contorno 1,2 cm hacia fuera (la banda y los bordes de los costados coinciden)
  const grow = loop.map((p, i) => {
    const a = segN[(i + L - 1) % L], c = segN[i];
    let nz = a[0] + c[0], ny = a[1] + c[1];
    const l = Math.hypot(nz, ny);
    if (l < 1e-6){ nz = c[0]; ny = c[1]; } else { nz /= l; ny /= l; }
    return [p[0] + 0.012 * nz, p[1] + 0.012 * ny];
  });
  const hard = loop.map((p, i) => {
    const a = segN[(i + L - 1) % L], c = segN[i];
    return a[0] * c[0] + a[1] * c[1] < Math.cos(50 * Math.PI / 180);
  });

  const gT = grow.slice(0, M), gB = [...grow.slice(M - 1, 2 * M - 1)].reverse();   // gB[j] corresponde a B[j]
  return { M, K, L, loop, grow, hard, segN, gT, gB };
}

function blockMesh(poly, zCab, e, H, pos, uv, index, S){
  const C = blockColumns(poly, zCab, e, S, 1 / 70, true);
  if (!C) return false;
  const { M, K, L, grow, hard, segN, gT, gB } = C;
  // Banda: una fila por punto del contorno (dos en los cantos vivos), columnas apretadas en los lados
  const tx = [0, 0.3, 0.52, 0.68, 0.79, 0.87, 0.925, 0.96, 0.985, 1];
  const X = [...tx.slice(1).reverse().map(t => -t * H), 0, ...tx.slice(1).map(t => t * H)];
  const NX = X.length;
  const addRow = p => {
    const base = pos.length / 3;
    for (const x of X){ pos.push(x, p[1], p[0]); uv.push(p[0], p[1]); }
    return base;
  };
  const rowsIn = [], rowsOut = [];
  for (let i = 0; i < L; i++){
    const r = addRow(grow[i]);
    rowsIn.push(r);
    rowsOut.push(hard[i] ? addRow(grow[i]) : r);
  }
  const tri = (a, b, c, want) => {
    const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
    const ux = pos[b * 3] - ax, uy = pos[b * 3 + 1] - ay, uz = pos[b * 3 + 2] - az;
    const vx = pos[c * 3] - ax, vy = pos[c * 3 + 1] - ay, vz = pos[c * 3 + 2] - az;
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    const d = cx * want[0] + cy * want[1] + cz * want[2];
    if (Math.abs(cx) + Math.abs(cy) + Math.abs(cz) < 1e-12) return;
    if (d >= 0) index.push(a, b, c); else index.push(a, c, b);
  };
  for (let i = 0; i < L; i++){
    const r0 = rowsOut[i], r1 = rowsIn[(i + 1) % L];
    const want = [0, segN[i][1], segN[i][0]];
    for (let c = 0; c < NX - 1; c++){
      tri(r0 + c, r1 + c, r1 + c + 1, want);
      tri(r0 + c, r1 + c + 1, r0 + c + 1, want);
    }
  }
  // Costados: rejilla de columnas (una por pareja arriba/abajo) con K tramos cada una
  for (const sx of [-1, 1]){
    const base = pos.length / 3;
    for (let j = 0; j < M; j++){
      const fr = rowFractions(S, (gB[j][0] + gT[j][0]) / 2, gB[j][1], gT[j][1], K);
      for (let k = 0; k <= K; k++){
        const f = fr[k];
        const z = gB[j][0] + (gT[j][0] - gB[j][0]) * f, y = gB[j][1] + (gT[j][1] - gB[j][1]) * f;
        // los puntos intermedios de la primera columna son los del borde del habitáculo
        const q = j === 0 && k > 0 && k < K ? grow[2 * M - 2 + k] : [z, y];
        pos.push(sx * H, q[1], q[0]); uv.push(q[0], q[1]);
      }
    }
    const want = [sx, 0, 0];
    for (let j = 0; j < M - 1; j++){
      for (let k = 0; k < K; k++){
        const a = base + j * (K + 1) + k, b = a + K + 1;
        tri(a, b, b + 1, want);
        tri(a, b + 1, a + 1, want);
      }
    }
  }
  return true;
}

// ---------------------------------------------------------------------------------------------
// CARROCERÍA POR SECCIONES: en vez de extruir el perfil lateral de lado a lado, cada bloque (morro y
// zaga) se monta con secciones transversales (anillos) repartidas a lo largo del coche que luego se
// unen entre sí. Cada anillo ya sale con su forma (shapeMap: tipo de sección, aletas, cintura y
// afilado) y el del borde del habitáculo cierra el bloque con una tapa
const BODY_DEFAULT = { build: 'sections', section: 'flat', depth: 1, flare: 0, waist: 0, taper: 0, stations: 120, guides: false };
const bodyCfg = () => Object.assign({}, BODY_DEFAULT, CONFIG.body || {});

// Anillos de los dos bloques, aún sin forma: por bloque, sus columnas y en cada columna cuatro tiras
// (arriba de -H a H, costado derecho de arriba abajo, abajo de H a -H y costado izquierdo de abajo
// arriba). Las esquinas se repiten en las dos tiras que se tocan. null si un contorno no encaja
function loftRings(blocks, P, H){
  const S = shapeParams(P);
  const n = THREE.MathUtils.clamp(Math.round(bodyCfg().stations), 8, 400);
  const len = Math.max(1, P.zF - P.zR);
  const tx = [0, 0.3, 0.52, 0.68, 0.79, 0.87, 0.925, 0.96, 0.985, 1];
  const X = [...tx.slice(1).reverse().map(t => -t), 0, ...tx.slice(1)];
  const out = [];
  for (let k = 0; k < blocks.length; k++){
    const e = k === 0 ? 1 : -1, zCab = k === 0 ? P.cabinFrontZ : P.cabinRearZ;
    const share = Math.abs((e > 0 ? P.zF : P.zR) - zCab) / len;
    const C = blockColumns(blocks[k], zCab, e, S, 1 / Math.max(4, Math.round(n * share)), false);
    if (!C) return null;
    const { M, K, grow, gT, gB } = C;
    const cols = [];
    for (let j = 0; j < M; j++){
      const T = gT[j], Bt = gB[j];
      const fr = rowFractions(S, (Bt[0] + T[0]) / 2, Bt[1], T[1], K);
      const side = [];
      for (let q = 0; q <= K; q++){
        // los puntos intermedios de la primera columna son los del borde del habitáculo
        if (j === 0 && q > 0 && q < K) side.push(grow[2 * M - 2 + q]);
        else { const f = fr[q]; side.push([Bt[0] + (T[0] - Bt[0]) * f, Bt[1] + (T[1] - Bt[1]) * f]); }
      }
      cols.push([
        X.map(f => [f * H, T[1], T[0]]),
        side.slice().reverse().map(([z, y]) => [H, y, z]),
        X.slice().reverse().map(f => [f * H, Bt[1], Bt[0]]),
        side.map(([z, y]) => [-H, y, z]),
      ]);
    }
    // Columnas con canto vivo en el borde de arriba (tira 0) o en el de abajo (tira 2)
    const kink = ch => ch.map((p, j) => {
      if (j === 0 || j === ch.length - 1) return false;
      const ax = p[0] - ch[j - 1][0], ay = p[1] - ch[j - 1][1], bx = ch[j + 1][0] - p[0], by = ch[j + 1][1] - p[1];
      const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
      return la > 1e-6 && lb > 1e-6 && (ax * bx + ay * by) / (la * lb) < Math.cos(40 * Math.PI / 180);
    });
    out.push({ cols, hard: [kink(gT), null, kink(gB), null], M });
  }
  return out;
}

function bodyLoftGeometry(blocks, P, H){
  const rings = loftRings(blocks, P, H);
  if (!rings) return null;
  const S = shapeParams(P);
  const pos = [], uv = [], index = [], seams = [];
  const vtx = q => {
    const p = [q[0], q[1], q[2]];
    if (S.active) shapeMap(S, p);
    pos.push(p[0], p[1], p[2]); uv.push(q[2], q[1]);
    return pos.length / 3 - 1;
  };
  const P3 = i => [pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]];
  const tri = (list, a, b, c) => {
    const A = P3(a), B = P3(b), C = P3(c);
    const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
    if (Math.abs(uy * vz - uz * vy) + Math.abs(uz * vx - ux * vz) + Math.abs(ux * vy - uy * vx) < 1e-12) return;
    list.push(a, b, c);
  };
  for (const { cols, hard, M } of rings){
    const tris = [];
    // Vértices de cada tira, columna a columna (dos copias donde hay canto vivo)
    const V = [0, 1, 2, 3].map(s => {
      const inV = [], outV = [];
      for (let j = 0; j < M; j++){
        const row = cols[j][s].map(vtx);
        inV.push(row);
        outV.push(hard[s] && hard[s][j] ? cols[j][s].map(vtx) : row);
      }
      return { inV, outV };
    });
    for (let s = 0; s < 4; s++){
      const { inV, outV } = V[s];
      for (let j = 0; j < M - 1; j++){
        const r0 = outV[j], r1 = inV[j + 1];
        for (let i = 0; i < r0.length - 1; i++){
          tri(tris, r0[i], r0[i + 1], r1[i + 1]);
          tri(tris, r0[i], r1[i + 1], r1[i]);
        }
      }
      // Esquinas compartidas con la tira siguiente (para suavizar la normal si el canto es suave)
      const nx = V[(s + 1) % 4];
      for (let j = 0; j < M; j++){
        seams.push([V[s].inV[j][V[s].inV[j].length - 1], nx.inV[j][0]]);
        if (V[s].outV[j] !== V[s].inV[j]) seams.push([V[s].outV[j][V[s].outV[j].length - 1], nx.outV[j][0]]);
      }
    }
    // Tapa del borde del habitáculo: abanico desde el centro de la primera sección
    const ring = [];
    for (let s = 0; s < 4; s++) ring.push(...cols[0][s].slice(0, -1));
    const c = ring.reduce((m, q) => [m[0], m[1] + q[1] / ring.length, m[2] + q[2] / ring.length], [0, 0, 0]);
    const ci = vtx(c), ri = ring.map(vtx);
    for (let i = 0; i < ri.length; i++) tri(tris, ci, ri[(i + 1) % ri.length], ri[i]);
    // Hacia fuera: el volumen encerrado debe salir positivo
    let vol = 0;
    for (let t = 0; t < tris.length; t += 3){
      const A = P3(tris[t]), B = P3(tris[t + 1]), C = P3(tris[t + 2]);
      vol += A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0]);
    }
    if (vol < 0) for (let t = 0; t < tris.length; t += 3){ const a = tris[t + 1]; tris[t + 1] = tris[t + 2]; tris[t + 2] = a; }
    index.push(...tris);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  // En las esquinas de las tiras: normal común si el canto ha quedado redondeado, viva si no
  const nr = geo.attributes.normal;
  const cos = Math.cos(35 * Math.PI / 180);
  for (const [a, b] of seams){
    const ax = nr.getX(a), ay = nr.getY(a), az = nr.getZ(a), bx = nr.getX(b), by = nr.getY(b), bz = nr.getZ(b);
    if (ax * bx + ay * by + az * bz < cos) continue;
    const l = Math.hypot(ax + bx, ay + by, az + bz) || 1;
    nr.setXYZ(a, (ax + bx) / l, (ay + by) / l, (az + bz) / l);
    nr.setXYZ(b, (ax + bx) / l, (ay + by) / l, (az + bz) / l);
  }
  return geo;
}

// Las secciones dibujadas sobre la carrocería (solo en el editor): los anillos de los dos bloques y,
// entre ellos, las de las puertas (en U, abiertas por arriba hacia el habitáculo)
function buildSectionGuides(g, blocks, P, H){
  const rings = loftRings(blocks, P, H);
  if (!rings) return;
  const S = shapeParams(P);
  const pts = [];
  const off = 0.004;
  const put = (q, dx, dy) => { const p = [q[0] + dx, q[1] + dy, q[2]]; if (S.active) shapeMap(S, p); return p; };
  const polyline = (list, closed) => {
    for (let i = 0; i < list.length - (closed ? 0 : 1); i++) pts.push(...list[i], ...list[(i + 1) % list.length]);
  };
  // Una de cada pocas, para que se lean (unos 12 cm entre secciones como mínimo)
  const zOf = col => col[0][0][2];
  for (const { cols, M } of rings){
    let last = zOf(cols[0]);
    for (let j = 1; j < M; j++){
      if (j < M - 1 && Math.abs(zOf(cols[j]) - last) < 0.12) continue;
      last = zOf(cols[j]);
      const r = [];
      const [top, right, bot, left] = cols[j];
      top.slice(0, -1).forEach(q => r.push(put(q, 0, off)));
      right.slice(0, -1).forEach(q => r.push(put(q, off, 0)));
      bot.slice(0, -1).forEach(q => r.push(put(q, 0, -off)));
      left.slice(0, -1).forEach(q => r.push(put(q, -off, 0)));
      polyline(r, true);
    }
  }
  const cF = P.cabinFrontZ, cR = P.cabinRearZ;
  const step = Math.max(0.12, (P.zF - P.zR) / THREE.MathUtils.clamp(bodyCfg().stations, 8, 400));
  const xo = P.halfW - 0.03 + off;
  const bottom = bottomBetween(P, cR, cF);
  const botAt = z => {
    let i = 0;
    while (i < bottom.length - 2 && bottom[i + 1][0] < z) i++;
    const a = bottom[i], c = bottom[i + 1];
    return Math.min(a[1] + (c[1] - a[1]) * THREE.MathUtils.clamp((z - a[0]) / Math.max(1e-9, c[0] - a[0]), 0, 1), sillY(P, z) - 0.04);
  };
  const nD = Math.max(1, Math.round((cF - cR) / step));
  for (let i = 1; i < nD; i++){
    const z = cR + (cF - cR) * i / nD, yb = botAt(z) - off, yt = sillY(P, z);
    const r = [];
    for (let q = 0; q <= 12; q++) r.push(put([-xo, yt + (yb - yt) * q / 12, z], 0, 0));
    for (let q = 1; q < 12; q++) r.push(put([-xo + 2 * xo * q / 12, yb, z], 0, 0));
    for (let q = 0; q <= 12; q++) r.push(put([xo, yb + (yt - yb) * q / 12, z], 0, 0));
    polyline(r, false);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x0aa4ff, transparent: true, opacity: 0.8, depthWrite: false }));
  lines.name = 'SectionGuides';
  lines.userData.shaped = true;
  lines.userData.editorOnly = true;
  lines.renderOrder = 3;
  lines.raycast = () => {};
  g.add(lines);
}

// Panel de puerta: una losa entre xIn y xOut (centrada en x = 0; luego se coloca a cada lado) con
// una rejilla ordenada de columnas entre el borde de abajo (bottom: [[z, y]] con z creciente) y la
// cintura. Así la forma y las líneas de carrocería la curvan igual que a la chapa
function doorSlabGeometry(P, xIn, xOut, bottom){
  if (!bottom || bottom.length < 2) return null;
  const z0 = bottom[0][0], z1 = bottom[bottom.length - 1][0];
  if (z1 - z0 < 0.2) return null;
  const zs = [];
  for (const [z] of bottom){
    const last = zs[zs.length - 1];
    if (last !== undefined && z - last < 1e-4) continue;
    if (last !== undefined){ const k = Math.ceil((z - last) / 0.03); for (let j = 1; j < k; j++) zs.push(last + (z - last) * j / k); }
    zs.push(z);
  }
  const botAt = z => {
    let i = 0;
    while (i < bottom.length - 2 && bottom[i + 1][0] < z) i++;
    const a = bottom[i], c = bottom[i + 1];
    return a[1] + (c[1] - a[1]) * THREE.MathUtils.clamp((z - a[0]) / Math.max(1e-9, c[0] - a[0]), 0, 1);
  };
  const K = 30, S = shapeParams(P);
  const M = zs.length;
  const pos = [], uv = [], index = [];
  const vtx = (x, y, z) => { pos.push(x, y, z); uv.push(z, y); return pos.length / 3 - 1; };
  const tri = (a, b, c, want) => {
    const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
    const vx = pos[c * 3] - pos[a * 3], vy = pos[c * 3 + 1] - pos[a * 3 + 1], vz = pos[c * 3 + 2] - pos[a * 3 + 2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (Math.abs(cx) + Math.abs(cy) + Math.abs(cz) < 1e-12) return;
    if (cx * want[0] + cy * want[1] + cz * want[2] >= 0) index.push(a, b, c); else index.push(a, c, b);
  };
  const quad = (a, b, c, d, want) => { tri(a, b, c, want); tri(a, c, d, want); };
  const Y = zs.map(z => { const lo = botAt(z), hi = sillY(P, z), fr = rowFractions(S, z, lo, hi, K); return fr.map(f => lo + (hi - lo) * f); });
  // Caras exterior e interior
  for (const [x, sx] of [[xOut, 1], [xIn, -1]]){
    const base = pos.length / 3;
    for (let j = 0; j < M; j++) for (let k = 0; k <= K; k++) vtx(x, Y[j][k], zs[j]);
    for (let j = 0; j < M - 1; j++) for (let k = 0; k < K; k++){
      const a = base + j * (K + 1) + k, b = a + K + 1;
      quad(a, b, b + 1, a + 1, [sx, 0, 0]);
    }
  }
  // Cantos de arriba y de abajo, y extremos delantero y trasero
  for (const [k, wy] of [[K, 1], [0, -1]]){
    const base = pos.length / 3;
    for (let j = 0; j < M; j++){ vtx(xOut, Y[j][k], zs[j]); vtx(xIn, Y[j][k], zs[j]); }
    for (let j = 0; j < M - 1; j++){
      const a = base + j * 2, b = a + 2;
      const dz = zs[j + 1] - zs[j], dy = Y[j + 1][k] - Y[j][k], l = Math.hypot(dz, dy) || 1;
      quad(a, b, b + 1, a + 1, [0, wy * dz / l, -wy * dy / l]);
    }
  }
  for (const [j, wz] of [[M - 1, 1], [0, -1]]){
    const base = pos.length / 3;
    for (let k = 0; k <= K; k++){ vtx(xOut, Y[j][k], zs[j]); vtx(xIn, Y[j][k], zs[j]); }
    for (let k = 0; k < K; k++){ const a = base + k * 2, b = a + 2; quad(a, b, b + 1, a + 1, [0, 0, wz]); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}

// Copia deformada de una geometría (con o sin índices). M lleva de sus coordenadas al espacio del
// coche. Las aristas se parten mientras la deformación las curve más de 1,5 mm; la decisión depende
// solo de sus dos extremos, así dos triángulos vecinos la parten igual y no quedan grietas. Las
// normales giran con la deformación (inversa transpuesta de su jacobiana)
function deformGeometry(geo, M, S, tol = 0.0015, maxDepth = 7){
  const names = Object.keys(geo.attributes);
  const attrs = names.map(n => geo.attributes[n]);
  const sizes = attrs.map(a => a.itemSize);
  const iPos = names.indexOf('position'), iNor = names.indexOf('normal');
  const nSrc = geo.attributes.position.count;
  const e = M.elements, ei = M.clone().invert().elements;
  const nm = new THREE.Matrix3().getNormalMatrix(M).elements;
  const ident = M.equals(new THREE.Matrix4());

  // Banco de vértices: atributos (locales), posición en el coche (G) y deformada (Fd). Los primeros
  // nSrc son los de la geometría original (los getters deshacen la cuantización de Blender)
  const data = attrs.map((a, k) => {
    const sz = sizes[k], arr = new Array(nSrc * sz);
    for (let i = 0; i < nSrc; i++){
      arr[i * sz] = a.getX(i);
      if (sz > 1) arr[i * sz + 1] = a.getY(i);
      if (sz > 2) arr[i * sz + 2] = a.getZ(i);
      if (sz > 3) arr[i * sz + 3] = a.getW(i);
    }
    return arr;
  });
  const G = new Array(nSrc * 3), Fd = new Array(nSrc * 3);
  const tmp = [0, 0, 0];
  const field = (x, y, z) => { tmp[0] = x; tmp[1] = y; tmp[2] = z; return shapeMap(S, tmp); };
  const P0 = data[iPos];
  for (let i = 0; i < nSrc; i++){
    const x = P0[i * 3], y = P0[i * 3 + 1], z = P0[i * 3 + 2];
    const gx = ident ? x : e[0] * x + e[4] * y + e[8] * z + e[12];
    const gy = ident ? y : e[1] * x + e[5] * y + e[9] * z + e[13];
    const gz = ident ? z : e[2] * x + e[6] * y + e[10] * z + e[14];
    G[i * 3] = gx; G[i * 3 + 1] = gy; G[i * 3 + 2] = gz;
    const f = field(gx, gy, gz);
    Fd[i * 3] = f[0]; Fd[i * 3 + 1] = f[1]; Fd[i * 3 + 2] = f[2];
  }
  let nV = nSrc;
  const mids = new Map();
  const mid = (a, b) => {
    const k = a < b ? a * 4194304 + b : b * 4194304 + a;
    let m = mids.get(k);
    if (m !== undefined) return m;
    m = nV++;
    for (let n = 0; n < names.length; n++){
      const sz = sizes[n], d = data[n];
      for (let c = 0; c < sz; c++) d.push((d[a * sz + c] + d[b * sz + c]) / 2);
    }
    const gx = (G[a * 3] + G[b * 3]) / 2, gy = (G[a * 3 + 1] + G[b * 3 + 1]) / 2, gz = (G[a * 3 + 2] + G[b * 3 + 2]) / 2;
    G.push(gx, gy, gz);
    const f = field(gx, gy, gz);
    Fd.push(f[0], f[1], f[2]);
    mids.set(k, m);
    return m;
  };
  const errCache = new Map();
  const needSplit = (a, b) => {
    const k = a < b ? a * 4194304 + b : b * 4194304 + a;
    let r = errCache.get(k);
    if (r !== undefined) return r;
    const ax = G[a * 3], ay = G[a * 3 + 1], az = G[a * 3 + 2], bx = G[b * 3], by = G[b * 3 + 1], bz = G[b * 3 + 2];
    r = false;
    if ((bx - ax) * (bx - ax) + (by - ay) * (by - ay) + (bz - az) * (bz - az) > 3.6e-5){
      for (let q = 1; q <= 3; q++){
        const t = q * 0.25;
        const f = field(ax + (bx - ax) * t, ay + (by - ay) * t, az + (bz - az) * t);
        const dx = f[0] - (Fd[a * 3] + (Fd[b * 3] - Fd[a * 3]) * t);
        const dy = f[1] - (Fd[a * 3 + 1] + (Fd[b * 3 + 1] - Fd[a * 3 + 1]) * t);
        const dz = f[2] - (Fd[a * 3 + 2] + (Fd[b * 3 + 2] - Fd[a * 3 + 2]) * t);
        if (dx * dx + dy * dy + dz * dz > tol * tol){ r = true; break; }
      }
    }
    errCache.set(k, r);
    return r;
  };
  const mn = new THREE.Vector3(), mx = new THREE.Vector3();
  const touches = (a, b, c) => {
    mn.set(Math.min(G[a * 3], G[b * 3], G[c * 3]), Math.min(G[a * 3 + 1], G[b * 3 + 1], G[c * 3 + 1]), Math.min(G[a * 3 + 2], G[b * 3 + 2], G[c * 3 + 2]));
    mx.set(Math.max(G[a * 3], G[b * 3], G[c * 3]), Math.max(G[a * 3 + 1], G[b * 3 + 1], G[c * 3 + 1]), Math.max(G[a * 3 + 2], G[b * 3 + 2], G[c * 3 + 2]));
    return shapeTouches(S, mn, mx);
  };
  const out = [];
  const rec = (a, b, c, depth) => {
    if (depth >= maxDepth || (depth === 0 && !touches(a, b, c))){ out.push(a, b, c); return; }
    const sAB = needSplit(a, b), sBC = needSplit(b, c), sCA = needSplit(c, a);
    const n = sAB + sBC + sCA, d = depth + 1;
    if (n === 0){ out.push(a, b, c); return; }
    if (n === 3){
      const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
      rec(a, ab, ca, d); rec(ab, b, bc, d); rec(ca, bc, c, d); rec(ab, bc, ca, d);
      return;
    }
    // Gira el triángulo para que las aristas partidas empiecen en AB
    if (n === 1){
      if (sBC) return rec(b, c, a, depth);
      if (sCA) return rec(c, a, b, depth);
      const ab = mid(a, b);
      rec(a, ab, c, d); rec(ab, b, c, d);
      return;
    }
    if (!sCA){ // AB y BC
      const ab = mid(a, b), bc = mid(b, c);
      rec(ab, b, bc, d); rec(a, ab, bc, d); rec(a, bc, c, d);
      return;
    }
    if (!sAB) return rec(b, c, a, depth);   // BC y CA -> AB y BC
    return rec(c, a, b, depth);             // CA y AB -> AB y BC
  };

  const idx = geo.index ? geo.index.array : null;
  const total = idx ? idx.length : nSrc;
  const groups = geo.groups.length ? geo.groups : [{ start: 0, count: total, materialIndex: 0 }];
  const outGroups = [];
  for (const gr of groups){
    const start = out.length, endI = Math.min(total, gr.start + gr.count);
    for (let i = gr.start; i + 2 < endI; i += 3){
      if (idx) rec(idx[i], idx[i + 1], idx[i + 2], 0); else rec(i, i + 1, i + 2, 0);
    }
    outGroups.push({ start, count: out.length - start, materialIndex: gr.materialIndex });
  }

  // Posiciones de vuelta a coordenadas locales y normales giradas (solo donde la forma actúa)
  const res = new THREE.BufferGeometry();
  const pt = new THREE.Vector3();
  names.forEach((n, k) => {
    const arr = new Float32Array(data[k]);
    if (k === iPos){
      for (let v = 0; v < nV; v++){
        const x = Fd[v * 3], y = Fd[v * 3 + 1], z = Fd[v * 3 + 2];
        arr[v * 3]     = ident ? x : ei[0] * x + ei[4] * y + ei[8] * z + ei[12];
        arr[v * 3 + 1] = ident ? y : ei[1] * x + ei[5] * y + ei[9] * z + ei[13];
        arr[v * 3 + 2] = ident ? z : ei[2] * x + ei[6] * y + ei[10] * z + ei[14];
      }
    } else if (k === iNor){
      // La jacobiana se mide 2 mm por dentro (hacia el centro y hacia abajo) y con pasos hacia
      // dentro: en los cantos, justo en el borde de cada zona, cuenta la curva de la chapa
      const h = 2e-4;
      const A = [0, 0, 0], B = [0, 0, 0], Cc = [0, 0, 0];
      for (let v = 0; v < nV; v++){
        pt.set(G[v * 3], G[v * 3 + 1], G[v * 3 + 2]);
        if (!shapeTouches(S, pt, pt)) continue;
        const lx = arr[v * 3], ly = arr[v * 3 + 1], lz = arr[v * 3 + 2];
        const nx = nm[0] * lx + nm[3] * ly + nm[6] * lz, ny = nm[1] * lx + nm[4] * ly + nm[7] * lz, nz = nm[2] * lx + nm[5] * ly + nm[8] * lz;
        const nl = Math.hypot(nx, ny, nz) || 1;
        const gx = pt.x - 0.002 * (nx / nl + Math.sign(pt.x)), gy = pt.y - 0.002 * (ny / nl + 1), gz = pt.z - 0.002 * (nz / nl + Math.sign(pt.z));
        let f = field(gx, gy, gz);
        const f0x = f[0], f0y = f[1], f0z = f[2];
        const dxs = gx > 0 ? -h : h, dzs = gz > 0 ? -h : h;
        f = field(gx + dxs, gy, gz); A[0] = (f[0] - f0x) / dxs; A[1] = (f[1] - f0y) / dxs; A[2] = (f[2] - f0z) / dxs;
        f = field(gx, gy - h, gz);   B[0] = (f0x - f[0]) / h;   B[1] = (f0y - f[1]) / h;   B[2] = (f0z - f[2]) / h;
        f = field(gx, gy, gz + dzs); Cc[0] = (f[0] - f0x) / dzs; Cc[1] = (f[1] - f0y) / dzs; Cc[2] = (f[2] - f0z) / dzs;
        // cofactores: (B×C) nx + (C×A) ny + (A×B) nz
        const bcx = B[1] * Cc[2] - B[2] * Cc[1], bcy = B[2] * Cc[0] - B[0] * Cc[2], bcz = B[0] * Cc[1] - B[1] * Cc[0];
        const cax = Cc[1] * A[2] - Cc[2] * A[1], cay = Cc[2] * A[0] - Cc[0] * A[2], caz = Cc[0] * A[1] - Cc[1] * A[0];
        const abx = A[1] * B[2] - A[2] * B[1], aby = A[2] * B[0] - A[0] * B[2], abz = A[0] * B[1] - A[1] * B[0];
        const mx2 = bcx * nx + cax * ny + abx * nz, my2 = bcy * nx + cay * ny + aby * nz, mz2 = bcz * nx + caz * ny + abz * nz;
        // de vuelta a local: traspuesta de la parte 3x3 de M
        const ox = e[0] * mx2 + e[1] * my2 + e[2] * mz2, oy = e[4] * mx2 + e[5] * my2 + e[6] * mz2, oz = e[8] * mx2 + e[9] * my2 + e[10] * mz2;
        const l = Math.hypot(ox, oy, oz) || 1;
        arr[v * 3] = ox / l; arr[v * 3 + 1] = oy / l; arr[v * 3 + 2] = oz / l;
      }
    }
    res.setAttribute(n, new THREE.BufferAttribute(arr, sizes[k]));
  });
  res.setIndex(nV > 65535 ? new THREE.Uint32BufferAttribute(out, 1) : new THREE.Uint16BufferAttribute(out, 1));
  if (geo.groups.length) outGroups.forEach(gr => res.addGroup(gr.start, gr.count, gr.materialIndex));
  return res;
}

// Aplica la forma a los grupos ya construidos de un coche (antes de inclinarlos). Las piezas
// pequeñas que apenas cambian de forma solo se desplazan; las marcadas con userData.rigidShape
// (retrovisores) y todo el interior se mueven enteras
function applyShapeField(parts, P){
  const S = shapeParams(P);
  if (!S.active) return;
  const box = new THREE.Box3(), v = new THREE.Vector3(), d = new THREE.Vector3(), p = [0, 0, 0];
  const disp = (x, y, z) => { p[0] = x; p[1] = y; p[2] = z; shapeMap(S, p); return d.set(p[0] - x, p[1] - y, p[2] - z); };
  const moveRigid = o => {
    box.setFromObject(o);
    if (box.isEmpty() || !shapeTouches(S, box.min, box.max)) return;
    box.getCenter(v);
    disp(v.x, v.y, v.z);
    if (d.lengthSq() < 1e-8) return;
    if (o.parent){
      const m3 = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().copy(o.parent.matrixWorld).invert());
      d.applyMatrix3(m3);
    }
    o.position.add(d);
    o.updateMatrixWorld(true);
  };
  const corners = new Array(8).fill(0).map(() => new THREE.Vector3());
  const deformMesh = m => {
    const geo = m.geometry;
    if (!geo || !geo.attributes.position || m.userData.shaped) return;
    if (!geo.boundingBox) geo.computeBoundingBox();
    box.copy(geo.boundingBox).applyMatrix4(m.matrixWorld);
    if (!shapeTouches(S, box.min, box.max)) return;
    // ¿Basta con moverla?
    const bb = geo.boundingBox;
    let k = 0;
    for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) corners[k++].set(x, y, z).applyMatrix4(m.matrixWorld);
    box.getCenter(v);
    const d0 = disp(v.x, v.y, v.z).clone();
    let varMax = 0, dMax = d0.length();
    for (const c of corners){
      disp(c.x, c.y, c.z);
      dMax = Math.max(dMax, d.length());
      varMax = Math.max(varMax, d.distanceTo(d0));
    }
    if (dMax < 2e-4) return;
    const span = box.getSize(v).length();
    if (varMax < 0.002 && span < 0.6){
      if (m.parent){
        const m3 = new THREE.Matrix3().setFromMatrix4(new THREE.Matrix4().copy(m.parent.matrixWorld).invert());
        d0.applyMatrix3(m3);
      }
      m.position.add(d0);
      m.updateMatrixWorld(true);
      return;
    }
    m.geometry = deformGeometry(geo, m.matrixWorld, S);
    m.userData.sharedGeometry = false;
  };
  for (const grp of parts){
    grp.updateMatrixWorld(true);
    const rigidOnly = grp.name === 'Interior';
    const visit = o => {
      if (o !== grp && (rigidOnly || o.userData.rigidShape)){ moveRigid(o); return; }
      if (o.isMesh) deformMesh(o);
      for (const c of o.children) visit(c);
    };
    visit(grp);
  }
}

// ---------------------------------------------------------------------------------------------
// EMBELLECEDORES DE CARROCERÍA: molduras de los pasos de rueda, bajos (taloneras) y líneas laterales
// media y alta. Se barren a lo largo del costado pegados a la chapa (las puertas están 2 cm más
// adentro que el morro y la zaga, y la pieza sigue ese escalón con una transición suave)
const TRIMS = {
  // t: grosor hacia fuera, h: alto (o ancho radial en las molduras), off: separación del borde del arco
  archTrim: {
    black:  { t: 0.022, h: 0.070, off: 0.035, round: 0.5, mat: () => MAT.plastic },
    chrome: { t: 0.010, h: 0.016, off: 0.010, round: 1.0, mat: () => MAT.chrome },
    body:   { t: 0.026, h: 0.050, off: 0.022, round: 1.0, mat: () => MAT.paint },
    carbon: { t: 0.014, h: 0.045, off: 0.022, round: 0.4, mat: () => MAT.carbon },
  },
  sill: {
    body:   { t: 0.035, h: 0.090, y: 0.035, round: 0.8, mat: () => MAT.paint },
    black:  { t: 0.030, h: 0.120, y: 0.050, round: 0.4, mat: () => MAT.plastic },
    chrome: { t: 0.008, h: 0.020, y: 0.075, round: 1.0, mat: () => MAT.chrome },
    carbon: { t: 0.070, h: 0.012, y: 0.004, round: 0.3, mat: () => MAT.carbon },
  },
  midLine: {
    crease: [{ t: 0.008, h: 0.030, dy: 0, round: 1.0, mat: () => MAT.paint }],
    chrome: [{ t: 0.008, h: 0.018, dy: 0, round: 1.0, mat: () => MAT.chrome }],
    black:  [{ t: 0.014, h: 0.050, dy: 0, round: 0.6, mat: () => MAT.plastic }],
    double: [{ t: 0.006, h: 0.009, dy: 0.016, round: 1.0, mat: () => MAT.chrome }, { t: 0.006, h: 0.009, dy: -0.016, round: 1.0, mat: () => MAT.chrome }],
  },
  highLine: {
    shoulder: { t: 0.010, h: 0.028, round: 1.0, mat: () => MAT.paint },
    chrome:   { t: 0.010, h: 0.030, round: 0.8, mat: () => MAT.chrome },
    black:    { t: 0.010, h: 0.030, round: 0.8, mat: () => MAT.carbon },
    chromeLoop: { t: 0.010, h: 0.030, round: 0.8, mat: () => MAT.chrome },
  },
};

// x de la chapa del costado en z: morro y zaga en halfW - 0.01, puertas en halfW - 0.03
function sideSurfaceX(P, z){
  const k = Math.min(THREE.MathUtils.smoothstep(z, P.cabinRearZ, P.cabinRearZ + 0.04), 1 - THREE.MathUtils.smoothstep(z, P.cabinFrontZ - 0.04, P.cabinFrontZ));
  return P.halfW - 0.01 - 0.02 * k;
}

// Tramos de z a la altura y (con medio alto hh) por los que puede pasar una línea lateral: dentro de
// la carrocería y sin cruzar pasos de rueda ni los huecos de ópticas y tomas que doblan la esquina
function sideRuns(P, y, hh){
  const arches = wheelArches(P);
  const blocked = [];
  for (const e of [1, -1]){
    const lamp = cornerLampSpec(P, e);
    if (lamp && P._carved && P._carved.has('lamp' + e) && y - hh < lamp.yTop + 0.01 && y + hh > lamp.yTop - lamp.d.h - 0.01){
      blocked.push({ e, w: lamp.d.L + 0.04 });
    }
    const ink = intakeSpec(P, e);
    if (ink && P._carved && P._carved.has('intake' + e)){
      for (const pk of ink.pockets){
        if (!pk.wrap) continue;
        const ys = pk.front.map(([, v]) => v);
        if (y - hh < Math.max(...ys) + 0.01 && y + hh > Math.min(...ys) - 0.01) blocked.push({ e, w: pk.side[1][0] + 0.04 });
      }
    }
  }
  const S = shapeParams(P);
  const zEnd = e => {
    // Las líneas laterales acaban donde empieza a redondearse la esquina
    const rc = lut(e > 0 ? S.rcFT : S.rcRT, S.y0, S.y1, y);
    let z = faceZ(P, y, e) - e * (0.03 + 0.8 * rc);
    for (const b of blocked) if (b.e === e) z = e > 0 ? Math.min(z, faceZ(P, y, e) - b.w) : Math.max(z, faceZ(P, y, e) + b.w);
    return z;
  };
  const z0 = zEnd(-1), z1 = zEnd(1);
  const runs = [];
  let start = null;
  const n = 120;
  for (let i = 0; i <= n; i++){
    const z = z0 + (z1 - z0) * i / n;
    const ya = archYAt(P, arches, z);
    const ok = ya === null || ya < y - hh - 0.02;
    if (ok && start === null) start = z;
    if ((!ok || i === n) && start !== null){
      const end = ok ? z : z - (z1 - z0) / n;
      if (end - start > 0.12) runs.push([start, end]);
      start = null;
    }
  }
  return runs;
}

function sweepAlongSide(g, name, P, s, z0, z1, yAt, spec){
  const path = [];
  const n = Math.max(8, Math.round((z1 - z0) / 0.05));
  for (let i = 0; i <= n; i++){
    const z = z0 + (z1 - z0) * i / n;
    path.push(new THREE.Vector3(s * (sideSurfaceX(P, z) + spec.t / 2 - 0.003), yAt(z), z));
  }
  sweepSection(g, name, path, roundedRectSection(spec.t, spec.h, spec.round), new THREE.Vector3(1, 0, 0), spec.mat());
}

function buildBodyTrims(g, P){
  const A = CONFIG.accessories, b = P.bottomY;
  const arches = wheelArches(P);

  // Molduras de los pasos de rueda: siguen el borde del arco por fuera
  const at = TRIMS.archTrim[A.archTrim.type];
  if (at){
    [arches.front, arches.rear].forEach((span, k) => {
      if (!span) return;
      const Az = arches.archR, Ay = span.yMax - b;
      for (const s of [-1, 1]){
        const path = [];
        const n = 40;
        for (let i = 0; i <= n; i++){
          const z = span.a0 + (span.a1 - span.a0) * i / n;
          const y = archYAt(P, arches, z);
          // Normal del arco (elipse) para separar la moldura hacia fuera
          const nz = (z - span.axleZ) / (Az * Az), ny = (y - b) / (Ay * Ay), nl = Math.hypot(nz, ny) || 1;
          const zz = z + at.off * nz / nl, yy = y + at.off * ny / nl;
          path.push(new THREE.Vector3(s * (sideSurfaceX(P, zz) + at.t / 2 - 0.003), Math.max(b - 0.01, yy), zz));
        }
        sweepSection(g, `ArchTrim_${k}_${s}`, path, roundedRectSection(at.t, at.h, at.round), new THREE.Vector3(1, 0, 0), at.mat());
      }
    });
  }

  // Bajos: entre los dos pasos de rueda
  const sl = TRIMS.sill[A.sill.type];
  if (sl){
    const z0 = arches.rear ? arches.rear.a1 + 0.01 : P.zR + 0.15;
    const z1 = arches.front ? arches.front.a0 - 0.01 : P.zF - 0.15;
    for (const s of [-1, 1]) if (z1 - z0 > 0.2) sweepAlongSide(g, `Sill_${s}`, P, s, z0, z1, () => b + sl.y, sl);
  }

  // Línea media: horizontal a media altura del costado
  const ml = TRIMS.midLine[A.midLine.type];
  if (ml){
    const yM = b + (Math.min(P.frontBeltY, P.rearBeltY) - b) * 0.46 + A.midLine.offsetY;
    ml.forEach((spec, j) => {
      const y = yM + spec.dy;
      for (const [z0, z1] of sideRuns(P, y, spec.h / 2)){
        for (const s of [-1, 1]) sweepAlongSide(g, `MidLine_${j}_${s}_${z0.toFixed(2)}`, P, s, z0, z1, () => y, spec);
      }
    });
  }

  // Línea alta: nervio de hombro que sigue el borde superior del costado, o moldura bajo las ventanas
  const hl = TRIMS.highLine[A.highLine.type];
  if (hl){
    const cF = P.cabinFrontZ, cR = P.cabinRearZ;
    if (A.highLine.type === 'shoulder'){
      const topAt = z => z > cF ? hoodTopY(P, z) : z < cR ? trunkTopY(P, z) : sillY(P, z);
      const yAt = z => topAt(z) - 0.065;
      // Los tramos se calculan a la altura media y luego cada punto sigue el hombro
      const yRef = (P.frontBeltY + P.rearBeltY) / 2 - 0.065;
      for (const [z0, z1] of sideRuns(P, yRef, 0.03)){
        for (const s of [-1, 1]) sweepAlongSide(g, `HighLine_${s}_${z0.toFixed(2)}`, P, s, z0, z1, yAt, hl);
      }
    } else {
      for (const s of [-1, 1]) sweepAlongSide(g, `BeltTrim_${s}`, P, s, cR + 0.01, cF - 0.01, z => sillY(P, z) - 0.018, hl);
    }
  }
}

// ---------------------------------------------------------------------------------------------
// TOMAS DE AIRE DEL PARAGOLPES: huecos recortados en la chapa (como las ópticas envolventes) con
// rejilla de panal, aletas o lamas dentro. Delante (e = 1) van en la franja bajo la parrilla;
// detrás (e = -1) son salidas de aire en la parte baja de la zaga.
// Cada tipo recibe la franja d = { ws, xS, yLo, yHi, yMid, hb } y devuelve sus huecos:
// { front: [[x, y]] del lado derecho, mirror (repetir en el izquierdo), depth, fill, wrap }
// fill: 'mesh' (rejilla), 'fins' (aletas verticales), 'vanes' (lamas horizontales) o 'none'
function rrPoly(cx, cy, w, h, r, steps = 4){
  r = Math.min(r, w / 2 - 1e-3, h / 2 - 1e-3);
  const out = [];
  const corners = [[cx + w / 2 - r, cy + h / 2 - r, 0], [cx - w / 2 + r, cy + h / 2 - r, 1], [cx - w / 2 + r, cy - h / 2 + r, 2], [cx + w / 2 - r, cy - h / 2 + r, 3]];
  for (const [x, y, q] of corners){
    for (let k = 0; k <= steps; k++){
      const a = (q + k / steps) * Math.PI / 2;
      out.push([x + r * Math.cos(a), y + r * Math.sin(a)]);
    }
  }
  return out;
}

const INTAKES = {
  front: {
    'classic': d => [
      { front: rrPoly(0, d.yMid, 0.70 * d.ws, Math.min(0.11, d.hb * 0.8), 0.02), fill: 'mesh' },
      { front: rrPoly(0.60 * d.ws, d.yMid, 0.20 * d.ws, Math.min(0.09, d.hb * 0.7), 0.02), mirror: true, fill: 'mesh' },
    ],
    'wide': d => {
      const h = Math.min(0.15, d.hb * 0.9), t = d.yMid + h / 2, b = d.yMid - h / 2;
      return [{ front: [[0.64 * d.ws, t], [-0.64 * d.ws, t], [-0.55 * d.ws, b], [0.55 * d.ws, b]], fill: 'mesh' }];
    },
    'sport': d => {
      const h = Math.min(0.15, d.hb * 0.95), t = d.yMid + h / 2, b = d.yMid - h / 2;
      return [
        { front: rrPoly(0, d.yMid - 0.01, 0.52 * d.ws, Math.min(0.09, d.hb * 0.65), 0.015), fill: 'mesh' },
        { front: [[0.40 * d.ws, t - 0.01], [0.80 * d.ws, t + 0.012], [0.84 * d.ws, b], [0.46 * d.ws, b]], mirror: true, fill: 'fins', fins: [0.52, 0.62, 0.72].map(k => k * d.ws) },
      ];
    },
    'curtain': d => {
      const hc = Math.min(0.20, d.hb + 0.05), yc = d.yMid + 0.015, w = 0.07 * d.ws;
      return [
        { front: rrPoly(0, d.yLo + 0.035, 0.80 * d.ws, 0.045, 0.015), fill: 'mesh' },
        { front: [[d.xS + CORNER_OUT, yc + hc / 2], [d.xS - w, yc + hc / 2], [d.xS - w, yc - hc / 2], [d.xS + CORNER_OUT, yc - hc / 2]],
          mirror: true, wrap: 0.10, fill: 'vanes' },
      ];
    },
    'triple': d => [
      { front: rrPoly(0, d.yMid, 0.40 * d.ws, Math.min(0.10, d.hb * 0.8), 0.03), fill: 'mesh' },
      { front: rrPoly(0.62 * d.ws, d.yMid, 0.24 * d.ws, Math.min(0.08, d.hb * 0.65), 0.03), mirror: true, fill: 'mesh' },
    ],
    'slit': d => [{ front: rrPoly(0, d.yMid, 1.05 * d.ws, 0.035, 0.012), fill: 'mesh' }],
    // Boca ancha de seis lados con panal hexagonal de verdad dentro
    'honeycomb': d => {
      const h = Math.min(0.15, d.hb * 0.9), t = d.yMid + h / 2, b = d.yMid - h / 2;
      return [{ front: [[0.62 * d.ws, t], [-0.62 * d.ws, t], [-0.70 * d.ws, d.yMid], [-0.56 * d.ws, b], [0.56 * d.ws, b], [0.70 * d.ws, d.yMid]], fill: 'honey' }];
    },
    // Boca ancha cruzada por una lama de aluminio
    'blade': d => [{ front: rrPoly(0, d.yMid, 1.24 * d.ws, Math.min(0.14, d.hb * 0.9), 0.03), fill: 'blade' }],
    // Ranuras verticales en las esquinas (con aletas) y una rejilla central baja
    'vertical': d => {
      const hc = Math.min(0.18, d.hb);
      return [
        { front: rrPoly(0, d.yMid, 0.56 * d.ws, Math.min(0.08, d.hb * 0.6), 0.015), fill: 'honey' },
        { front: rrPoly(0.74 * d.ws, d.yMid, 0.13 * d.ws, hc, 0.02), mirror: true, fill: 'fins', fins: [0.70, 0.74, 0.78].map(k => k * d.ws) },
      ];
    },
    // Colmillos: triángulos en las esquinas con la punta hacia abajo y una ranura central
    'fang': d => {
      const h = Math.min(0.17, d.hb), t = d.yMid + h / 2, b = d.yMid - h / 2;
      return [
        { front: rrPoly(0, b + 0.03, 0.70 * d.ws, 0.045, 0.012), fill: 'mesh' },
        { front: [[0.86 * d.ws, t], [0.48 * d.ws, t], [0.86 * d.ws, b]], mirror: true, fill: 'fins', fins: [0.70, 0.79].map(k => k * d.ws) },
      ];
    },
    // Sonrisa: borde de arriba recto y el de abajo en arco
    'smile': d => {
      const h = Math.min(0.15, d.hb * 0.92), t = d.yMid + h / 2, W = 0.64 * d.ws;
      const arc = [];
      for (let k = 0; k <= 16; k++){ const u = -1 + 2 * k / 16; arc.push([u * W, t - h * (0.30 + 0.70 * (1 - u * u))]); }
      return [{ front: [[W, t], [-W, t], ...arc], fill: 'honey' }];
    },
  },
  rear: {
    'corner': d => {
      const hc = Math.min(0.16, d.hb), w = 0.06 * d.ws;
      return [{ front: [[d.xS + CORNER_OUT, d.yMid + hc / 2], [d.xS - w, d.yMid + hc / 2], [d.xS - w, d.yMid - hc / 2], [d.xS + CORNER_OUT, d.yMid - hc / 2]],
        mirror: true, wrap: 0.10, fill: 'vanes' }];
    },
    'slots': d => [{ front: rrPoly(0.64 * d.ws, d.yHi - 0.025, 0.24 * d.ws, 0.04, 0.014), mirror: true, fill: 'mesh' }],
    'vertical': d => {
      const hc = Math.min(0.15, d.hb);
      return [{ front: rrPoly(0.82 * d.ws, d.yMid, 0.06 * d.ws, hc, 0.012), mirror: true, fill: 'mesh' }];
    },
    'triangle': d => {
      const hc = Math.min(0.14, d.hb);
      return [{ front: [[0.86 * d.ws, d.yMid + hc / 2], [0.62 * d.ws, d.yMid + hc / 2], [0.86 * d.ws, d.yMid - hc / 2]], mirror: true, fill: 'mesh' }];
    },
  },
};

// Huecos de las tomas de aire de un extremo (e = 1 delante, -1 detrás), ya en coordenadas del coche
function intakeSpec(P, e){
  const key = e > 0 ? 'front' : 'rear';
  P._intake = P._intake || {};
  if (key in P._intake) return P._intake[key];
  const C = e > 0 ? CONFIG.embeds.intake : CONFIG.embeds.rearVent;
  const def = INTAKES[key][C.type];
  let spec = null;
  if (def){
    const b = P.bottomY, top = e > 0 ? P.noseTopY : P.tailTopY;
    const ws = P.width / 1.92, xS = P.halfW - 0.01;
    let yLo = b + 0.05, yHi;
    if (e > 0){
      const G = CONFIG.embeds.grille, fH = CONFIG.zones.frontBumper.height;
      yHi = b + (top - b) * 0.42;
      if (G.type !== 'none'){
        const gH = Math.min(0.26 * G.height, top - b - 0.10);
        const grilleY = THREE.MathUtils.clamp(b + (top - b) * 0.50 * fH + G.offsetY, b + 0.05 + gH / 2, top - 0.03 - gH / 2);
        yHi = Math.min(yHi, grilleY - gH / 2 - 0.025);
      }
    } else {
      yHi = b + (top - b) * 0.40;
    }
    const lamp = cornerLampSpec(P, e);
    if (lamp) yHi = Math.min(yHi, lamp.yTop - lamp.d.h - 0.04);
    yLo += C.offsetY; yHi += C.offsetY;
    // Un faldón decorativo ocupa el bajo: las tomas empiezan encima de él
    const bump = e > 0 ? CONFIG.accessories.frontBumper : CONFIG.accessories.rearBumper;
    const apron = (e > 0 ? APRON_FRONT : APRON_REAR)[bump.type];
    if (apron){
      const above = b + 0.012 + bump.offsetY + apron.h + 0.015;
      if (yHi - above >= 0.06) yLo = Math.max(yLo, above);
    }
    const hb = yHi - yLo;
    if (hb >= 0.04){
      const d = { ws: ws * (C.size || 1), xS, yLo, yHi, yMid: (yLo + yHi) / 2, hb };
      const arches = wheelArches(P), arch = arches[key];
      const pockets = [];
      for (const pk of def(d)){
        const ys = pk.front.map(([, y]) => y);
        const yT = Math.max(...ys), yB = Math.min(...ys);
        let depth = pk.wrap || 0.08;
        // Las que doblan la esquina no pueden llegar al paso de rueda
        if (pk.wrap && arch && yB - 0.02 < arch.yMax){
          const t = Math.sqrt(Math.max(0, 1 - ((yB - 0.02 - b) / (arch.yMax - b)) ** 2));
          const edge = e > 0 ? Math.min(arch.axleZ + arches.archR * t, arch.a1) : Math.max(arch.axleZ - arches.archR * t, arch.a0);
          depth = Math.min(depth, e * (faceZ(P, yB, e) - edge) - 0.04);
        }
        if (depth < 0.03) continue;
        const side = pk.wrap ? [[0, yT], [depth, yT], [depth, yB], [0, yB]] : [[0, yT], [0.08, yT], [0.08, yB], [0, yB]];
        for (const s of pk.mirror ? [-1, 1] : [1]){
          const inner = Math.min(...pk.front.map(([x]) => Math.abs(x)).filter(x => x < xS + 0.1));
          pockets.push({ front: pk.front.map(([x, y]) => [s * x, y]), side, fill: pk.fill, fins: pk.fins && pk.fins.map(x => s * x), wrap: !!pk.wrap, s, inner: s * inner });
        }
      }
      if (pockets.length) spec = { key, e, pockets };
    }
  }
  return (P._intake[key] = spec);
}

// Interior de las tomas recortadas: rejilla de panal al fondo, aletas o lamas. Las piezas pueden
// sobrar por los lados: lo que queda fuera del hueco está dentro de la chapa y no se ve
function buildIntakes(g, P, e){
  const spec = intakeSpec(P, e);
  const tag = e > 0 ? 'Intake' : 'RearVent';
  spec.pockets.forEach((pk, i) => {
    const xs = pk.front.map(([x]) => x), ys = pk.front.map(([, y]) => y);
    const x0 = Math.max(Math.min(...xs), -P.halfW + 0.02), x1 = Math.min(Math.max(...xs), P.halfW - 0.02);
    const y0 = Math.min(...ys), y1 = Math.max(...ys), yM = (y0 + y1) / 2;
    const zAt = (y, w) => faceZ(P, y, e) - e * (w + 0.01);
    const tilt = faceTilt(P, yM, e);
    if (pk.fill === 'mesh'){
      addBox(g, `${tag}Mesh_${i}`, [x1 - x0, y1 - y0, 0.01], [(x0 + x1) / 2, yM, zAt(yM, 0.05)], MAT.grilleBase, [tilt, 0, 0]);
    } else if (pk.fill === 'fins'){
      addBox(g, `${tag}Back_${i}`, [x1 - x0, y1 - y0, 0.01], [(x0 + x1) / 2, yM, zAt(yM, 0.07)], MAT.grilleBase, [tilt, 0, 0]);
      (pk.fins || []).forEach((x, k) => addBox(g, `${tag}Fin_${i}_${k}`, [0.012, y1 - y0 + 0.02, 0.07], [x, yM, zAt(yM, 0.037)], MAT.carbon, [tilt, 0, 0]));
    } else if (pk.fill === 'honey'){
      // Panal hexagonal recortado al hueco, con fondo oscuro detrás
      addBox(g, `${tag}Back_${i}`, [x1 - x0, y1 - y0, 0.01], [(x0 + x1) / 2, yM, zAt(yM, 0.06)], MAT.grilleBase, [tilt, 0, 0]);
      const cells = new THREE.Mesh(honeycombGeometry(x1 - x0 + 0.02, y1 - y0 + 0.02), MAT.glossBlack);
      cells.position.set((x0 + x1) / 2, yM, zAt(yM, 0.012));
      cells.rotation.x = tilt;
      addMesh(g, `${tag}Honey_${i}`, cells);
    } else if (pk.fill === 'blade'){
      addBox(g, `${tag}Mesh_${i}`, [x1 - x0, y1 - y0, 0.01], [(x0 + x1) / 2, yM, zAt(yM, 0.05)], MAT.grilleBase, [tilt, 0, 0]);
      addPart(g, `${tag}Blade_${i}`, 'insert_blade', [(x0 + x1) / 2, yM, zAt(yM, 0.004)], { rot: [tilt, 0, 0], scale: [x1 - x0 + 0.02, 1, 1] });
    } else if (pk.fill === 'vanes'){
      // Conducto de cortina de aire: lamas horizontales que doblan la esquina
      const xIn = pk.inner, xOut = pk.s * (P.halfW - 0.012);
      for (let k = 1; k <= 3; k++){
        const y = y0 + (y1 - y0) * k / 4;
        const path = [new THREE.Vector3(xIn + pk.s * 0.004, y, zAt(y, 0.006)), new THREE.Vector3(xOut, y, zAt(y, 0.006)),
                      new THREE.Vector3(xOut, y, zAt(y, (pk.side[1][0] || 0.1) - 0.01))];
        const pts = roundPolyline(path, 0.02);
        addMesh(g, `${tag}Vane_${i}_${k}`, new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 24, 0.004, 6, false), MAT.carbon));
      }
    }
  });
}

// Panal hexagonal de paredes finas que llena w x h, centrado y con la cara hacia +z
function honeycombGeometry(w, h, cell = 0.038, wall = 0.004, depth = 0.016){
  const a = cell / 2, dx = 1.5 * a, dy = Math.sqrt(3) * a;
  const nx = Math.ceil(w / 2 / dx) + 1, ny = Math.ceil(h / 2 / dy) + 1;
  const pos = [];
  const quad = (p0, p1, p2, p3) => pos.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
  for (let i = -nx; i <= nx; i++) for (let j = -ny; j <= ny; j++){
    const cx = i * dx, cy = j * dy + (i & 1 ? dy / 2 : 0);
    // Tres lados por celda bastan para dibujar toda la red
    for (let k = 0; k < 3; k++){
      const a0 = Math.PI / 3 * k, a1 = Math.PI / 3 * (k + 1);
      const x0 = cx + a * Math.cos(a0), y0 = cy + a * Math.sin(a0), x1 = cx + a * Math.cos(a1), y1 = cy + a * Math.sin(a1);
      if (Math.abs((x0 + x1) / 2) > w / 2 || Math.abs((y0 + y1) / 2) > h / 2) continue;
      const L = Math.hypot(x1 - x0, y1 - y0), nX = -(y1 - y0) / L * wall / 2, nY = (x1 - x0) / L * wall / 2;
      const c = [[x0 + nX, y0 + nY], [x1 + nX, y1 + nY], [x1 - nX, y1 - nY], [x0 - nX, y0 - nY]];
      const F = c.map(([x, y]) => [x, y, 0]), B = c.map(([x, y]) => [x, y, -depth]);
      quad(F[3], F[2], F[1], F[0]);
      for (let m = 0; m < 4; m++){ const n = (m + 1) % 4; quad(F[n], B[n], B[m], F[m]); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

// Faldones decorativos (piezas de Blender, ancho de diseño 1.90, origen en su borde inferior).
// h: alto en el centro (las tomas de aire empiezan encima); depth: lo que sale delante de la chapa
// donde va la matrícula
const APRON_FRONT = {
  'lip-alu':        { key: 'apron_lip_alu',  h: 0.026, depth: 0.0 },
  'apron-black':    { key: 'apron_black',    h: 0.095, depth: 0.022 },
  'wing-chrome':    { key: 'apron_wing',     h: 0.062, depth: 0.016 },
  'splitter-gloss': { key: 'apron_splitter', h: 0.060, depth: 0.010 },
  'guard-black':    { key: 'apron_guard',    h: 0.150, depth: 0.032 },
};
const APRON_REAR = {
  'apron-black':    { key: 'rapron_black',   h: 0.095, depth: 0.022 },
  'chrome-strip':   { key: 'rapron_chrome',  h: 0.090, depth: 0.012 },
  'valance-chrome': { key: 'rapron_valance', h: 0.140, depth: 0.022 },
  'guard-black':    { key: 'rapron_guard',   h: 0.150, depth: 0.032 },
  'lip-alu':        { key: 'rapron_lip',     h: 0.024, depth: 0.0 },
};

// Luces bajas (segundo nivel): [pieza, medio ancho, medio alto, x en la esquina (por ws), subida]
const LOW_LIGHTS = {
  round:    ['fog_round', 0.055, 0.055, 0.62, 0], strip: ['fog_strip', 0.095, 0.018, 0.62, 0],
  cube:     ['fog_cube', 0.085, 0.026, 0.62, 0],  vertical: ['fog_vertical', 0.021, 0.085, 0.80, 0.03],
  triangle: ['fog_triangle', 0.085, 0.045, 0.66, 0.01], cluster: ['fog_cluster', 0.115, 0.05, 0.64, 0.04],
};
const REAR_LOW_LIGHTS = {
  reflector: ['rlow_reflector', 0.015, 0.06, 0.86, 0], vertical: ['rlow_vertical', 0.021, 0.085, 0.82, 0.02],
  round:     ['rlow_round', 0.085, 0.035, 0.64, 0],     cluster: ['rlow_cluster', 0.12, 0.045, 0.64, 0.01],
};

// Huecos de las tomas de aire de un extremo como rectángulos (los de los dos lados y el central)
function pocketRects(P, e){
  const spec = intakeSpec(P, e);
  if (!spec) return [];
  return spec.pockets.map(pk => {
    const xs = pk.front.map(([x]) => x), ys = pk.front.map(([, y]) => y);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), fill: pk.fill, tri: pk.front.length <= 3 };
  });
}

// Par de luces en las esquinas del paragolpes (e = 1 delante, -1 detrás). Si caen sobre una toma
// de aire con rejilla van dentro de ella, algo hundidas; si la toma tiene aletas, se suben encima
function placeLowLights(g, P, e, def, y, yMax, tag){
  const [key, hw, hh, xk, lift] = def;
  const ws = P.width / 1.92;
  let x = Math.min(xk * ws, P.halfW - hw - 0.03), z = null, sc = 1;
  y += lift;
  // Por encima de un faldón decorativo
  const bump = e > 0 ? CONFIG.accessories.frontBumper : CONFIG.accessories.rearBumper;
  const apron = (e > 0 ? APRON_FRONT : APRON_REAR)[bump.type];
  if (apron) y = Math.max(y, P.bottomY + 0.012 + bump.offsetY + apron.h + hh + 0.012);
  // Fuera de la parrilla: hacia la esquina si cabe y, si no, por debajo de ella
  if (e > 0 && CONFIG.embeds.grille.type !== 'none'){
    const G = grilleBand(P), gB = G.y - G.gH / 2;
    if (x - hw < G.gW / 2 && y + hh > gB && y - hh < G.y + G.gH / 2){
      if (G.gW / 2 + hw + 0.02 <= P.halfW - hw - 0.03) x = G.gW / 2 + hw + 0.02;
      else if (gB - 2 * hh - 0.012 >= P.bottomY + 0.03) y = gB - hh - 0.012;
    }
  }
  const carved = P._carved && P._carved.has('intake' + e);
  for (const r of pocketRects(P, e)){
    if (r.x1 < x - hw || r.x0 > x + hw || r.y1 < y - hh || r.y0 > y + hh) continue;
    if (carved && !r.tri && (r.fill === 'mesh' || r.fill === 'honey') && r.y1 - r.y0 > 0.05){
      sc = Math.min(1, (r.y1 - r.y0 - 0.014) / (2 * hh), (r.x1 - r.x0 - 0.014) / (2 * hw));
      x = THREE.MathUtils.clamp(x, r.x0 + hw * sc + 0.007, r.x1 - hw * sc - 0.007);
      y = (r.y0 + r.y1) / 2;
      z = faceZ(P, y, e) - e * 0.02;
    } else if (r.y1 + 2 * hh + 0.02 < yMax){
      y = r.y1 + hh + 0.02;
    }
    break;
  }
  y = Math.min(y, yMax - hh * sc);
  if (z === null) z = faceZ(P, y, e);
  const tilt = faceTilt(P, y, e), turn = e > 0 ? 0 : Math.PI;
  for (const s of [-1, 1]) addPart(g, `${tag}_${s}`, key, [s * x, y, z], { rot: [tilt, turn, 0], scale: [s * e * sc, sc, sc] });
}

// Parte los triángulos hasta que ningún lado pase de maxLen. Cada vértice es un registro
// [x, y, z, ...resto de atributos] y el punto medio de un lado interpola todo (normales y UV).
// Así una pieza grande sigue también los bultos estrechos de la chapa al aplicarle la forma
// Solo se parten los triángulos con algún vértice para el que near() es cierto (los que asoman a
// la superficie) y los lados se miden en x e y: lo hundido en la chapa no se ve
function splitLongEdges(tris, maxLen, near = () => true){
  const out = [], max2 = maxLen * maxLen;
  const d2 = (p, q) => (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
  let guard = 0;
  while (tris.length && guard++ < 500000){
    const t = tris.pop();
    if (!near(t[0]) && !near(t[1]) && !near(t[2])){ out.push(t); continue; }
    const e = [d2(t[0], t[1]), d2(t[1], t[2]), d2(t[2], t[0])];
    const k = e[0] >= e[1] && e[0] >= e[2] ? 0 : e[1] >= e[2] ? 1 : 2;
    if (e[k] <= max2){ out.push(t); continue; }
    const A = t[k], B = t[(k + 1) % 3], C = t[(k + 2) % 3];
    const M = A.map((x, i) => (x + B[i]) / 2);
    tris.push([A, M, C], [M, B, C]);
  }
  return out.concat(tris);
}

// Dobla una pieza de Blender para que siga el perfil de la cara (morro o zaga) en altura: cada
// vértice avanza o retrocede lo que cambia la cara respecto a la altura yRef. Así un faldón alto
// apoya entero en una zaga redondeada. La geometría pasa a ser propia de esta copia. Con maxEdge,
// antes se parten los triángulos grandes (en metros del coche) para que la forma la doble bien
function conformToFace(obj, P, dir, yRef, maxEdge = 0){
  if (!obj) return;
  obj.updateMatrixWorld(true);
  const z0 = faceZ(P, yRef, dir), cache = new Map();
  const fz = y => {
    const k = Math.round(y * 400);
    let d = cache.get(k);
    if (d === undefined){ d = faceZ(P, k / 400, dir) - z0; cache.set(k, d); }
    return d;
  };
  const v = new THREE.Vector3(), n = new THREE.Vector3(), inv = new THREE.Matrix4(), nm = new THREE.Matrix3(), nmInv = new THREE.Matrix3();
  obj.traverse(o => {
    if (!o.isMesh) return;
    if (maxEdge > 0 && !o.userData.preTessellated){
      // Triángulos con la posición en metros del coche (para medir los lados), partidos, y de
      // vuelta a las coordenadas de la pieza. El resto de atributos se interpola tal cual
      const g0 = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      const names = Object.keys(g0.attributes).filter(k => k !== 'position');
      const sizes = names.map(k => g0.attributes[k].itemSize);
      const pa = g0.attributes.position, recs = [];
      for (let i = 0; i < pa.count; i++){
        v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld);
        const r = [v.x, v.y, v.z];
        names.forEach((k, j) => { const at = g0.attributes[k]; for (let c = 0; c < sizes[j]; c++) r.push(at.getComponent(i, c)); });
        recs.push(r);
      }
      const tris = [];
      for (let i = 0; i + 2 < recs.length; i += 3) tris.push([recs[i], recs[i + 1], recs[i + 2]]);
      const flat = splitLongEdges(tris, maxEdge, r => dir * (r[2] - z0 - fz(r[1])) > -0.02).flat();
      inv.copy(o.matrixWorld).invert();
      const tess = new THREE.BufferGeometry();
      const L = new Float32Array(flat.length * 3);
      flat.forEach((r, i) => { v.set(r[0], r[1], r[2]).applyMatrix4(inv); L[3 * i] = v.x; L[3 * i + 1] = v.y; L[3 * i + 2] = v.z; });
      tess.setAttribute('position', new THREE.BufferAttribute(L, 3));
      let off = 3;
      names.forEach((k, j) => {
        const arr = new Float32Array(flat.length * sizes[j]);
        flat.forEach((r, i) => { for (let c = 0; c < sizes[j]; c++) arr[i * sizes[j] + c] = r[off + c]; });
        tess.setAttribute(k, new THREE.BufferAttribute(arr, sizes[j]));
        off += sizes[j];
      });
      if (tess.attributes.normal){
        // Las normales interpoladas se vuelven a hacer unitarias
        const nn = tess.attributes.normal;
        for (let i = 0; i < nn.count; i++){ n.fromBufferAttribute(nn, i).normalize(); nn.setXYZ(i, n.x, n.y, n.z); }
      }
      if (g0 !== o.geometry) g0.dispose();
      o.geometry = tess;
    }
    const src = o.geometry, pos = src.attributes.position, nor = src.attributes.normal;
    inv.copy(o.matrixWorld).invert();
    nm.getNormalMatrix(o.matrixWorld);
    nmInv.getNormalMatrix(inv);
    const P3 = new Float32Array(pos.count * 3), N3 = nor ? new Float32Array(pos.count * 3) : null;
    for (let i = 0; i < pos.count; i++){
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      const slope = (fz(v.y + 0.005) - fz(v.y - 0.005)) / 0.01;
      v.z += fz(v.y);
      v.applyMatrix4(inv);
      P3[3 * i] = v.x; P3[3 * i + 1] = v.y; P3[3 * i + 2] = v.z;
      if (N3){
        // Normal de la superficie doblada: z' = z + f(y) => n' = (nx, ny - f'(y) nz, nz)
        n.fromBufferAttribute(nor, i).applyMatrix3(nm);
        n.y -= slope * n.z;
        n.applyMatrix3(nmInv).normalize();
        N3[3 * i] = n.x; N3[3 * i + 1] = n.y; N3[3 * i + 2] = n.z;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P3, 3));
    if (N3) geo.setAttribute('normal', new THREE.BufferAttribute(N3, 3));
    for (const [name, at] of Object.entries(src.attributes)){
      if (name === 'position' || name === 'normal') continue;
      const arr = new Float32Array(at.count * at.itemSize);
      for (let i = 0; i < at.count; i++) for (let c = 0; c < at.itemSize; c++) arr[i * at.itemSize + c] = at.getComponent(i, c);
      geo.setAttribute(name, new THREE.BufferAttribute(arr, at.itemSize));
    }
    if (src.index) geo.setIndex(src.index.clone());
    o.geometry = geo;
    o.userData.sharedGeometry = false;
  });
}

// Sin recorte (vista rápida o sin booleanas): cada toma se dibuja plana sobre la chapa
function buildIntakesFlat(g, P, e){
  const spec = intakeSpec(P, e);
  if (!spec) return;
  const tag = e > 0 ? 'Intake' : 'RearVent';
  spec.pockets.forEach((pk, i) => {
    const xs = pk.front.map(([x]) => x), ys = pk.front.map(([, y]) => y);
    const x0 = Math.max(Math.min(...xs), -P.halfW + 0.02), x1 = Math.min(Math.max(...xs), P.halfW - 0.02);
    const yM = (Math.min(...ys) + Math.max(...ys)) / 2;
    embedBox(g, `${tag}Flat_${i}`, [x1 - x0, Math.max(...ys) - Math.min(...ys), 0], [(x0 + x1) / 2, yM, faceZ(P, yM, e)], [0, 0, e], 0.004, MAT.grilleBase);
  });
}

// ---------------------------------------------------------------------------------------------
// ÓPTICAS ENVOLVENTES: el grupo óptico ocupa la esquina. Se recorta un hueco en la carrocería con
// operaciones booleanas (three-bvh-csg), se cierra con una tulipa enrasada con la chapa y dentro
// van proyectores y guías LED que doblan la esquina.
// Coordenadas de esquina: u hacia dentro desde el costado, v hacia abajo desde el borde superior
// del hueco, w hacia atrás desde la cara (morro o zaga). Los puntos con u = 0 o w = 0 están en el
// borde de la chapa y el recorte los prolonga hacia fuera.
// Cada tipo: medidas de diseño W (ancho de frente), L (fondo en el costado) y h (alto); pockets(d)
// da los huecos (v0 = desplazamiento bajo el borde superior) y parts(d) lo que va dentro.
let CSG = null;
const CORNER_OUT = 0.3;

const CORNER_LAMPS = {
  head: {
    'wrap': { W: 0.42, L: 0.24, h: 0.13,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -0.5 * h], [0.6 * W, -h], [0, -h]], side: [[0, 0], [L, 0], [0.72 * L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.022, 0.02], [0.02, -0.022, 0.02], [0.02, -0.022, L - 0.035]], r: 0.006 },
        { k: 'proj', u: 0.40 * W, v: -0.56 * h, r: Math.min(0.036, 0.28 * h) },
        { k: 'proj', u: 0.74 * W, v: -0.50 * h, r: Math.min(0.030, 0.24 * h) },
        { k: 'marker', w0: 0.40 * L, w1: 0.66 * L, v0: -0.45 * h, v1: -0.75 * h },
      ] },
    'wrap-blade': { W: 0.50, L: 0.30, h: 0.045,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W - 0.015, -h], [0, -h]], side: [[0, 0], [L, 0], [L - 0.02, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.5 * h, 0.018], [0.018, -0.5 * h, 0.018], [0.018, -0.5 * h, L - 0.04]], r: Math.min(0.010, 0.2 * h) },
      ] },
    'wrap-boomerang': { W: 0.46, L: 0.30, h: 0.18,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -0.22 * h], [0.38 * W, -h], [0, -h]], side: [[0, 0], [L, 0], [L, -0.22 * h], [0.36 * L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.10 * h, 0.02], [0.40 * W, -0.82 * h, 0.02], [0.03, -0.88 * h, 0.02], [0.03, -0.88 * h, 0.38 * L], [0.03, -0.13 * h, L - 0.05]], r: 0.006 },
        { k: 'proj', u: 0.20 * W, v: -0.42 * h, r: Math.min(0.036, 0.20 * h) },
        { k: 'proj', u: 0.50 * W, v: -0.30 * h, r: Math.min(0.030, 0.17 * h) },
      ] },
    'wrap-tall': { W: 0.17, L: 0.14, h: 0.28,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -h], [0, -h]], side: [[0, 0], [L, 0], [L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[0.022, -0.03, 0.022], [0.022, -h + 0.03, 0.022]], r: 0.006 },
        ...[0.2, 0.5, 0.8].map(t => ({ k: 'proj', u: 0.58 * W, v: -t * h, r: Math.min(0.030, 0.12 * h, 0.30 * W) })),
      ] },
    'wrap-split': { W: 0.52, L: 0.28, h: 0.21,
      pockets: ({ W, L, h }) => [
        { v0: 0, front: [[0, 0], [W, 0], [W - 0.02, -0.17 * h], [0, -0.17 * h]], side: [[0, 0], [L, 0], [L - 0.02, -0.17 * h], [0, -0.17 * h]] },
        { v0: -0.42 * h, front: [[0, 0], [0.52 * W, 0], [0.52 * W, -0.58 * h], [0, -0.58 * h]], side: [[0, 0], [0.5 * L, 0], [0.5 * L, -0.58 * h], [0, -0.58 * h]] },
      ],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.035, -0.085 * h, 0.018], [0.018, -0.085 * h, 0.018], [0.018, -0.085 * h, L - 0.04]], r: Math.min(0.008, 0.05 * h) },
        { k: 'proj', p: 1, u: 0.17 * W, v: -0.29 * h, r: Math.min(0.030, 0.20 * h) },
        { k: 'proj', p: 1, u: 0.38 * W, v: -0.29 * h, r: Math.min(0.030, 0.20 * h) },
        { k: 'marker', p: 1, w0: 0.04, w1: 0.5 * L - 0.03, v0: -0.15 * h, v1: -0.43 * h },
      ] },
    'wrap-classic': { W: 0.42, L: 0.30, h: 0.16,
      pockets: ({ W, L, h }) => [{ v0: 0,
        front: [[0, 0], [0.86 * W, 0], [W, -0.33 * h], [W, -0.66 * h], [0.8 * W, -h], [0, -h]],
        side: [[0, 0], [0.66 * L, 0], [L, -0.4 * h], [0.9 * L, -0.87 * h], [0.6 * L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'refl', u: 0.33 * W, v: -0.5 * h, r: Math.min(0.055, 0.36 * h) },
        { k: 'refl', u: 0.72 * W, v: -0.5 * h, r: Math.min(0.045, 0.30 * h, 0.12 * W) },
        { k: 'marker', w0: 0.40 * L, w1: 0.80 * L, v0: -0.25 * h, v1: -0.75 * h },
      ] },
  },
  tail: {
    'wrap': { W: 0.36, L: 0.20, h: 0.11,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -0.45 * h], [0.55 * W, -h], [0, -h]], side: [[0, 0], [L, 0], [0.75 * L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.2 * h, 0.018], [0.018, -0.2 * h, 0.018], [0.018, -0.2 * h, L - 0.035]], r: 0.006 },
        { k: 'pipe', pts: [[0.52 * W, -0.72 * h, 0.018], [0.018, -0.72 * h, 0.018], [0.018, -0.72 * h, 0.70 * L]], r: 0.005 },
      ] },
    'wrap-blade': { W: 0.55, L: 0.30, h: 0.04,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W - 0.015, -h], [0, -h]], side: [[0, 0], [L, 0], [L - 0.02, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.5 * h, 0.018], [0.018, -0.5 * h, 0.018], [0.018, -0.5 * h, L - 0.04]], r: Math.min(0.009, 0.2 * h) },
      ] },
    'wrap-tall': { W: 0.13, L: 0.14, h: 0.34,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -h], [0, -h]], side: [[0, 0], [L, 0], [L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [0.15, 0.38, 0.62, 0.85].map(t =>
        ({ k: 'pipe', pts: [[W - 0.025, -t * h, 0.018], [0.018, -t * h, 0.018], [0.018, -t * h, L - 0.03]], r: 0.005 })) },
    'wrap-c': { W: 0.34, L: 0.22, h: 0.13,
      pockets: ({ W, L, h }) => [{ v0: 0, front: [[0, 0], [W, 0], [W, -h], [0, -h]], side: [[0, 0], [L, 0], [L, -h], [0, -h]] }],
      parts: ({ W, L, h }) => [
        { k: 'pipe', pts: [[W - 0.03, -0.18 * h, 0.02], [0.02, -0.18 * h, 0.02], [0.02, -0.18 * h, L - 0.035],
                           [0.02, -0.82 * h, L - 0.035], [0.02, -0.82 * h, 0.02], [W - 0.03, -0.82 * h, 0.02]], r: 0.006 },
      ] },
  },
};

// Si no se puede recortar la chapa, cada óptica envolvente se sustituye por un faro superficial parecido
const CORNER_FALLBACK = {
  head: { 'wrap': 'hyper', 'wrap-blade': 'slim', 'wrap-boomerang': 'arrow', 'wrap-tall': 'vertical', 'wrap-split': 'split', 'wrap-classic': 'teardrop' },
  tail: { 'wrap': 'block', 'wrap-blade': 'bar', 'wrap-tall': 'matrix', 'wrap-c': 'split' },
};

// Medidas finales de la óptica envolvente de un extremo (e = 1 delante, -1 detrás), o null si no lo es
// o no cabe. Se guarda en P porque la usan la carrocería (recorte) y los detalles (interior)
function cornerLampSpec(P, e){
  const key = e > 0 ? 'head' : 'tail';
  P._corner = P._corner || {};
  if (key in P._corner) return P._corner[key];
  const C = e > 0 ? CONFIG.headlight : CONFIG.taillight;
  const def = CORNER_LAMPS[key][C.type];
  let spec = null;
  if (def){
    const k = e > 0 ? C.size : 1, kw = e > 0 ? C.width : 1;
    const top = e > 0 ? P.noseTopY : P.tailTopY;
    const yTop = Math.min(top - 0.025 + C.offsetY, top - 0.02);
    const W = Math.min(def.W * k * kw, P.halfW - 0.12);
    const h = Math.min(def.h * k, yTop - (P.bottomY + 0.07));
    let L = def.L * k * kw;
    // El hueco del costado no puede llegar al paso de rueda (arco elíptico hasta yMax)
    const arches = wheelArches(P), arch = arches[e > 0 ? 'front' : 'rear'];
    const yLow = yTop - h - 0.03;
    if (arch && yLow < arch.yMax){
      const t = Math.sqrt(Math.max(0, 1 - ((yLow - P.bottomY) / (arch.yMax - P.bottomY)) ** 2));
      const edge = e > 0 ? Math.min(arch.axleZ + arches.archR * t, arch.a1) : Math.max(arch.axleZ - arches.archR * t, arch.a0);
      L = Math.min(L, e * (faceZ(P, yTop - h, e) - edge) - 0.04);
    }
    if (h >= 0.03 && W >= 0.08 && L >= 0.05){
      const d = { W, L, h };
      spec = { key, e, def, d, yTop, xS: P.halfW - 0.01, pockets: def.pockets(d) };
    }
  }
  return (P._corner[key] = spec);
}

// Punto (u, v, w) del hueco p en la esquina del lado s, en coordenadas del coche
function cornerPoint(P, spec, s, p, u, v, w){
  const y = spec.yTop + spec.pockets[p].v0 + v;
  return new THREE.Vector3(s * (spec.xS - u), y, faceZ(P, y, spec.e) - spec.e * (w + 0.01));
}

// Volumen de un hueco: prisma de la vista frontal front [[x, y]] (a lo largo de z) cortado con el de
// la vista lateral side [[w, y]] (a lo largo de x); w es la profundidad desde la chapa y w <= 0 se
// lleva fuera de la pieza. Los dos prismas se prolongan fuera de la chapa para que el corte salga limpio
function pocketBrushes(P, e, front, side){
  const tip = e > 0 ? P.zF + CORNER_OUT : P.zR - CORNER_OUT;
  const ys = side.map(([, y]) => y);
  const yHi = Math.max(...ys), yLo = Math.min(...ys), yMid = (yHi + yLo) / 2, hp = Math.max(0.01, yHi - yLo);
  const faces = ys.map(y => faceZ(P, y, e));
  const wMax = Math.max(...side.map(([w]) => w));
  const zBack = e > 0 ? Math.min(...faces) - wMax - CORNER_OUT : Math.max(...faces) + wMax + CORNER_OUT;
  const zLo = Math.min(tip, zBack), zHi = Math.max(tip, zBack);
  const geoA = new THREE.ExtrudeGeometry(new THREE.Shape(front.map(([x, y]) => new THREE.Vector2(x, y))), { depth: zHi - zLo, bevelEnabled: false })
    .translate(0, 0, zLo);
  // La vista lateral sobresale 1.5 mm por arriba y por abajo: así sus caras no coinciden con las de
  // la vista frontal (las caras coplanarias dan cortes sucios)
  const shapeB = new THREE.Shape(side.map(([w, y0]) => {
    const y = yMid + (y0 - yMid) * (1 + 0.003 / hp);
    const z = w <= 0 ? tip : faceZ(P, y, e) - e * (w + 0.01);
    return new THREE.Vector2(-z, y);
  }));
  const xs = front.map(([x]) => x);
  const xIn = Math.min(...xs) - 0.05, xOut = Math.max(...xs) + 0.05;
  const geoB = new THREE.ExtrudeGeometry(shapeB, { depth: xOut - xIn, bevelEnabled: false })
    .applyMatrix4(new THREE.Matrix4().set(0, 0, 1, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1))
    .translate(xIn, 0, 0);
  return [geoA, geoB];
}

// Hueco p de una óptica envolvente en el lado s, en coordenadas del coche
function cornerPocket(spec, s, pk){
  const yT = spec.yTop + pk.v0;
  return {
    front: pk.front.map(([u, v]) => [s * (u <= 0 ? spec.xS + CORNER_OUT : spec.xS - u), yT + v]),
    side: pk.side.map(([w, v]) => [w, yT + v]),
  };
}

// Triángulos de un resultado booleano cuyo material está en mats, como geometría propia.
// side (1 / -1) se queda solo con los de delante (z > 0) o los de detrás
function csgPart(brush, mats, side = 0){
  const g = brush.geometry;
  const list = Array.isArray(brush.material) ? brush.material : [brush.material];
  const total = g.index ? g.index.count : g.attributes.position.count;
  const groups = g.groups.length ? g.groups : [{ start: 0, count: total, materialIndex: 0 }];
  const names = Object.keys(g.attributes);
  const pos = g.attributes.position;
  const out = Object.fromEntries(names.map(n => [n, []]));
  const vid = i => g.index ? g.index.getX(i) : i;
  for (const gr of groups){
    if (!mats.includes(list[gr.materialIndex])) continue;
    for (let i = gr.start; i + 2 < Math.min(total, gr.start + gr.count); i += 3){
      const tri = [vid(i), vid(i + 1), vid(i + 2)];
      if (side && side * (pos.getZ(tri[0]) + pos.getZ(tri[1]) + pos.getZ(tri[2])) < 0) continue;
      for (const k of tri){
        for (const n of names){
          const at = g.attributes[n];
          for (let c = 0; c < at.itemSize; c++) out[n].push(at.array[k * at.itemSize + c]);
        }
      }
    }
  }
  if (!out.position.length) return null;
  const res = new THREE.BufferGeometry();
  for (const n of names) res.setAttribute(n, new THREE.Float32BufferAttribute(out[n], g.attributes[n].itemSize));
  return res;
}

// Los recortes se guardan por forma de carrocería, de ópticas y de tomas: cambiar ruedas, pintura o
// accesorios no repite las booleanas. Mientras se arrastra un deslizador (fastPreview) no se recorta
// lo que no esté ya guardado: se ve la versión superficial y al soltar se recorta
const CARVE_CACHE = new Map();
const BODY_CACHE = new Map();
let fastPreview = false;

function carveBody(geo, P, pts, sKey){
  const lamps = [cornerLampSpec(P, 1), cornerLampSpec(P, -1)].filter(Boolean);
  const intakes = [intakeSpec(P, 1), intakeSpec(P, -1)].filter(Boolean);
  if (!CSG || !(lamps.length || intakes.length)) return null;
  const key = JSON.stringify([pts.map(v => [+v.x.toFixed(5), +v.y.toFixed(5)]), P.width, sKey, CONFIG.headlight.housing,
    lamps.map(sp => [sp.key, sp.def.W, sp.d, sp.yTop, sp.pockets]), intakes.map(sp => [sp.key, sp.pockets])]);
  let hit = CARVE_CACHE.get(key);
  if (!hit){
    if (fastPreview) return null;
    hit = carveBodyNow(geo, P, lamps, intakes);
    if (!hit) return null;
    CARVE_CACHE.set(key, hit);
    if (CARVE_CACHE.size > 6) CARVE_CACHE.delete(CARVE_CACHE.keys().next().value);
  }
  return {
    shell: hit.shell.clone(), done: hit.done,
    walls: hit.walls.map(([g, m]) => [g.clone(), m]),
    lenses: hit.lenses.map(L => ({ e: L.e, geo: L.geo && L.geo.clone() })),
  };
}

function carveBodyNow(geo, P, lamps, intakes){
  const ev = new CSG.Evaluator();
  ev.useGroups = true;
  const body = new CSG.Brush(geo, MAT.paint);
  body.updateMatrixWorld();
  // Une en un solo volumen los huecos de la lista [{ front, side, e, mat }]
  const unite = list => {
    let all = null;
    for (const { front, side, e, mat } of list){
      const [ga, gb] = pocketBrushes(P, e, front, side);
      const a = new CSG.Brush(ga, mat), b = new CSG.Brush(gb, mat);
      a.updateMatrixWorld(); b.updateMatrixWorld();
      const pocket = ev.evaluate(a, b, CSG.INTERSECTION);
      ga.dispose(); gb.dispose();
      if (all){
        const merged = ev.evaluate(all, pocket, CSG.ADDITION);
        all.geometry.dispose(); pocket.geometry.dispose();
        all = merged;
      } else all = pocket;
    }
    // Los huecos siguen la misma forma que la chapa
    const S = shapeParams(P);
    if (all && S.active){
      const shaped = new CSG.Brush(deformGeometry(all.geometry, new THREE.Matrix4(), S), all.material);
      shaped.updateMatrixWorld();
      all.geometry.dispose();
      all = shaped;
    }
    return all;
  };
  const lampList = [], intakeList = [];
  for (const spec of lamps){
    const mat = spec.e > 0 && CONFIG.headlight.housing === 'chrome' ? MAT.lampHousingChrome : MAT.lampHousing;
    for (const s of [-1, 1]) for (const pk of spec.pockets) lampList.push({ ...cornerPocket(spec, s, pk), e: spec.e, mat });
  }
  for (const spec of intakes) for (const pk of spec.pockets) intakeList.push({ front: pk.front, side: pk.side, e: spec.e, mat: MAT.intakeLiner });

  let carved = body, lens = null;
  if (lampList.length){
    // Una sola pasada: la chapa recortada y, por intersección, la chapa original dentro de los
    // huecos de las ópticas (será la tulipa)
    const all = unite(lampList);
    [carved, lens] = ev.evaluate(body, all, [CSG.SUBTRACTION, CSG.INTERSECTION], [new CSG.Brush(), new CSG.Brush()]);
    all.geometry.dispose();
  }
  if (intakeList.length){
    const all = unite(intakeList);
    const next = ev.evaluate(carved, all, CSG.SUBTRACTION);
    if (carved !== body) carved.geometry.dispose();
    all.geometry.dispose();
    carved = next;
  }
  const shell = csgPart(carved, [MAT.paint]);
  const walls = [MAT.lampHousing, MAT.lampHousingChrome, MAT.intakeLiner].map(m => [csgPart(carved, [m]), m]).filter(([g]) => g);
  const lenses = lamps.map(spec => ({ e: spec.e, geo: csgPart(lens, [MAT.paint], spec.e) }));
  if (carved !== body) carved.geometry.dispose();
  if (lens) lens.geometry.dispose();
  if (!shell) return null;
  return { shell, walls, lenses, done: new Set([...lamps.map(sp => 'lamp' + sp.e), ...intakes.map(sp => 'intake' + sp.e)]) };
}

// Suaviza las esquinas de una polilínea 3D con arcos de radio r
function roundPolyline(pts, r, steps = 6){
  const out = [pts[0]];
  for (let i = 1; i < pts.length - 1; i++){
    const a = pts[i - 1], p = pts[i], c = pts[i + 1];
    const da = a.clone().sub(p), dc = c.clone().sub(p);
    const p0 = p.clone().addScaledVector(da.normalize(), Math.min(r, a.distanceTo(p) * 0.45));
    const p2 = p.clone().addScaledVector(dc.normalize(), Math.min(r, c.distanceTo(p) * 0.45));
    for (let k = 0; k <= steps; k++){
      const t = k / steps;
      out.push(new THREE.Vector3()
        .addScaledVector(p0, (1 - t) * (1 - t)).addScaledVector(p, 2 * t * (1 - t)).addScaledVector(p2, t * t));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}

// Interior de las ópticas envolventes: guías LED, proyectores y reflectores de Blender e intermitente
function buildCornerLamps(g, P, e){
  const spec = cornerLampSpec(P, e);
  const light = e > 0 ? MAT.headlight : MAT.taillight;
  const tag = e > 0 ? 'Head' : 'Tail';
  const items = spec.def.parts(spec.d);
  for (const s of [-1, 1]){
    items.forEach((it, i) => {
      const p = it.p || 0, name = `${tag}Corner${i}_${s}`;
      if (it.k === 'pipe'){
        const pts = roundPolyline(it.pts.map(([u, v, w]) => cornerPoint(P, spec, s, p, u, v, w)), 0.025);
        const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
        addMesh(g, name, new THREE.Mesh(new THREE.TubeGeometry(curve, pts.length * 4, it.r, 10, false), light));
        for (const end of [pts[0], pts[pts.length - 1]]){
          const cap = new THREE.Mesh(new THREE.SphereGeometry(it.r, 10, 8), light);
          cap.position.copy(end);
          addMesh(g, `${name}_cap`, cap);
        }
      } else if (it.k === 'proj' || it.k === 'refl'){
        const c = cornerPoint(P, spec, s, p, it.u, it.v, 0.012);
        const k = it.r / (it.k === 'proj' ? 0.04 : 0.06);
        addPart(g, name, it.k === 'proj' ? 'lamp_projector' : 'lamp_reflector', [c.x, c.y, c.z],
          { rot: [faceTilt(P, c.y, e), e > 0 ? 0 : Math.PI, 0], scale: [k, k, k], materials: { light } });
      } else if (it.k === 'marker'){
        const c = cornerPoint(P, spec, s, p, 0.016, (it.v0 + it.v1) / 2, (it.w0 + it.w1) / 2);
        addBox(g, name, [0.012, Math.abs(it.v0 - it.v1), Math.abs(it.w1 - it.w0)], [c.x, c.y, c.z], MAT.indicator);
      }
    });
  }
  // Firma LED que une las dos ópticas por el centro
  if (e > 0 && CONFIG.headlight.drl === 'bar'){
    const y = spec.yTop - 0.014, half = spec.xS - spec.d.W + 0.01;
    embedBox(g, 'HeadLightBar', [2 * half, 0.012, 0], [0, y, faceZ(P, y, 1)], [0, 0, 1], 0.004, MAT.headlight);
  }
}

// Guardabarros interiores: el hueco de cada rueda se cierra por dentro (arco y pared interior) para
// que no se vea a través del coche ni el habitáculo. Van unos milímetros dentro del recorte de la
// chapa. Debajo del habitáculo, un suelo que no invade los pasos de rueda
// x de la pared interior del paso de rueda (algo por dentro del neumático)
function wellInnerX(P){
  return THREE.MathUtils.clamp(P.wheelX - P.tireW * CONFIG.tire.size / 2 - 0.05, 0.2, P.halfW - 0.096);
}

// Media anchura libre del habitáculo entre z0 y z1 a la altura y: si un paso de rueda entra ahí,
// lo que haya dentro debe quedarse por dentro de su pared interior
function cabinHalfFree(P, z0, z1, y){
  const arches = wheelArches(P);
  for (let k = 0; k <= 10; k++){
    const ya = archYAt(P, arches, z0 + (z1 - z0) * k / 10);
    if (ya !== null && ya > y) return wellInnerX(P) - 0.015;
  }
  return Infinity;
}

function buildWheelWells(g, P, arches){
  const b = P.bottomY;
  const xo = P.halfW - 0.016;
  const xi = wellInnerX(P);
  [arches.front, arches.rear].forEach((span, k) => {
    if (!span) return;
    const outline = [];
    const n = arches.steps * 2;
    for (let i = 0; i <= n; i++){
      const z = span.a0 + 0.006 + (span.a1 - span.a0 - 0.012) * i / n;
      outline.push([z, Math.max(b, archYAt(P, arches, z) - 0.006)]);
    }
    for (const s of [-1, 1]){
      // Arco: tira de cuadriláteros de xi a xo siguiendo el contorno
      const pos = [];
      for (let i = 0; i < outline.length - 1; i++){
        const [z0, y0] = outline[i], [z1, y1] = outline[i + 1];
        const A = [s * xi, y0, z0], B = [s * xo, y0, z0], C = [s * xo, y1, z1], D = [s * xi, y1, z1];
        pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
      const arc = new THREE.BufferGeometry();
      arc.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      arc.computeVertexNormals();
      addMesh(g, `WheelWell_${k}_${s}`, new THREE.Mesh(arc, MAT.wellLiner));
      // Pared interior
      const wall = new THREE.ShapeGeometry(new THREE.Shape(outline.map(([z, y]) => new THREE.Vector2(z, y))))
        .rotateY(-Math.PI / 2).translate(s * xi, 0, 0);
      addMesh(g, `WheelWellWall_${k}_${s}`, new THREE.Mesh(wall, MAT.wellLiner));
    }
  });
  // Suelo del habitáculo: estrecho a lo largo, y a todo lo ancho entre los pasos de rueda
  const cF = P.cabinFrontZ, cR = P.cabinRearZ;
  addBox(g, 'Underfloor', [2 * (xi - 0.01), 0.035, cF - cR + 0.04], [0, b + 0.018, (cF + cR) / 2], MAT.floor);
  const z0 = arches.rear ? Math.max(cR, arches.rear.a1 + 0.02) : cR;
  const z1 = arches.front ? Math.min(cF, arches.front.a0 - 0.02) : cF;
  if (z1 - z0 > 0.1) addBox(g, 'UnderfloorWide', [2 * (P.halfW - 0.055), 0.035, z1 - z0], [0, b + 0.018, (z0 + z1) / 2], MAT.floor);
}

function buildBody(P){
  const g = new THREE.Group();
  g.name = 'Body';

  const blocks = bodyProfilePoints(P);
  const pts = blocks.flat();
  const depth = P.width - 0.06;

  // Malla ordenada de los dos bloques ya con la forma aplicada (se guarda: al cambiar algo que no
  // es la chapa no se rehace). Por secciones: anillos transversales unidos a lo largo, que ya salen
  // con la forma; si no, el perfil lateral de lado a lado. Si un contorno raro no admite ninguna de
  // las dos, extrusión clásica
  const S = shapeParams(P);
  const sKey = shapeKey(P);
  const bodyKey = JSON.stringify([pts.map(v => [+v.x.toFixed(5), +v.y.toFixed(5)]), P.width, sKey]);
  const cachedBody = BODY_CACHE.get(bodyKey);
  const lofted = !cachedBody && bodyCfg().build === 'sections' ? bodyLoftGeometry(blocks, P, depth / 2 + 0.02) : null;
  let geo = cachedBody ? cachedBody.clone() : lofted || bodyBlocksGeometry(blocks, P, depth / 2 + 0.02);
  if (geo && !cachedBody){
    if (S.active && !lofted) geo = deformGeometry(geo, new THREE.Matrix4(), S);
    BODY_CACHE.set(bodyKey, geo.clone());
    if (BODY_CACHE.size > 12) BODY_CACHE.delete(BODY_CACHE.keys().next().value);
  }
  if (!geo){
    geo = new THREE.ExtrudeGeometry(blocks.map(b => new THREE.Shape(b)), {
      depth,
      bevelEnabled: true,
      bevelSize: 0.012, bevelThickness: 0.02, bevelSegments: 2,
      curveSegments: 24,
    });
    geo.applyMatrix4(new THREE.Matrix4().set(
       0, 0, 1, 0,
       0, 1, 0, 0,
      -1, 0, 0, 0,
       0, 0, 0, 1
    ));
    geo.translate(-depth / 2, 0, 0);
    geo.computeVertexNormals();
    if (S.active) geo = deformGeometry(geo, new THREE.Matrix4(), S);
  }

  // Huecos de las ópticas envolventes en las esquinas (con la forma ya aplicada a los huecos)
  let carved = null;
  try {
    carved = carveBody(geo, P, pts, sKey);
  } catch (err){
    console.warn('No se pudo recortar la carrocería', err);
  }
  P._carved = carved ? carved.done : new Set();

  const mesh = new THREE.Mesh(carved ? carved.shell : geo, MAT.paint);
  if (carved) geo.dispose();
  mesh.name = 'BodyShell';
  mesh.castShadow = mesh.receiveShadow = true;
  mesh.userData.selectable = true;
  mesh.userData.shaped = true;
  g.add(mesh);
  if (bodyCfg().build === 'sections' && bodyCfg().guides) buildSectionGuides(g, blocks, P, depth / 2 + 0.02);

  if (carved){
    carved.walls.forEach(([wg, m], i) => {
      const walls = new THREE.Mesh(wg, m);
      walls.receiveShadow = true;
      walls.userData.shaped = true;
      addMesh(g, `LampPocket_${i}`, walls);
    });
    for (const L of carved.lenses){
      if (!L.geo) continue;
      const lens = new THREE.Mesh(L.geo, L.e > 0 ? MAT.lampLens : MAT.tailLens);
      lens.renderOrder = 2;
      lens.userData.shaped = true;
      g.add(lens);
      lens.name = L.e > 0 ? 'HeadLens' : 'TailLens';
    }
  }

  // Paneles de puertas exteriores: suben o bajan del capó al maletero siguiendo la línea de cintura
  const b = P.bottomY;
  const cF = P.cabinFrontZ;
  const cR = P.cabinRearZ;
  const doorThick = 0.045;
  const sideX = (depth / 2) - doorThick / 2;
  // La puerta sube por el paso de rueda donde el arco entra bajo el habitáculo
  const doorBottom = bottomBetween(P, cR, cF).map(([z, y]) => new THREE.Vector2(z, Math.min(y, sillY(P, z) - 0.04)));
  const doorShape = new THREE.Shape([
    ...doorBottom,
    new THREE.Vector2(cF, P.frontBeltY), new THREE.Vector2(cR, P.rearBeltY),
  ]);
  const doorGeo = doorSlabGeometry(P, -doorThick / 2, doorThick / 2, doorBottom.map(v => [v.x, v.y]))
    || new THREE.ExtrudeGeometry(doorShape, { depth: doorThick, bevelEnabled: false }).rotateY(-Math.PI / 2).translate(doorThick / 2, 0, 0);
  const beltLen  = Math.hypot(cF - cR, P.frontBeltY - P.rearBeltY);
  const beltTilt = -Math.atan2(P.frontBeltY - P.rearBeltY, cF - cR);
  const capIn = P.cabinW - 0.02, capOut = depth / 2;   // de la base del cristal a la chapa exterior
  // Las dos puertas ya con la forma y las líneas aplicadas (se guardan como la chapa)
  const doorKey = bodyKey + '|puertas';
  let doorGeos = BODY_CACHE.get(doorKey);
  if (!doorGeos){
    doorGeos = [-1, 1].map(s => {
      const gd = doorGeo.clone().translate(s * sideX, 0, 0);
      return S.active ? deformGeometry(gd, new THREE.Matrix4(), S) : gd;
    });
    BODY_CACHE.set(doorKey, doorGeos.map(d => d.clone()));
    if (BODY_CACHE.size > 12) BODY_CACHE.delete(BODY_CACHE.keys().next().value);
  } else doorGeos = doorGeos.map(d => d.clone());
  doorGeo.dispose();
  for (const s of [-1, 1]){
    const door = new THREE.Mesh(doorGeos[s > 0 ? 1 : 0], MAT.paint);
    door.userData.shaped = true;
    addMesh(g, `DoorOuter_${s}`, door);
    // Remate de cintura: cierra el hueco entre la chapa de la puerta y la base del cristal
    addBox(g, `BeltCap_${s}`, [capOut - capIn, 0.02, beltLen], [s * (capIn + capOut) / 2, (P.frontBeltY + P.rearBeltY) / 2, (cF + cR) / 2], MAT.paint, [beltTilt, 0, 0]);
  }

  // Líneas de corte de puertas y capó
  const xSide = P.halfW + 0.002;
  const arches = wheelArches(P);
  const bZ = P.bPillar ? cF + (cR - cF) * 0.47 : null;
  const doorLine = (name, x, z) => {
    const yArch = archYAt(P, arches, z);
    const yBot = Math.max(P.bottomY + 0.06, yArch === null ? 0 : yArch + 0.025);
    const yTop = sillY(P, z) - 0.012;
    if (yTop - yBot < 0.06) return;
    addPanelGap(g, name, [0.008, Math.max(0.08, yTop - yBot), 0.01], [x, (yBot + yTop) / 2, z]);
  };

  for (const s of [-1, 1]){
    const x = s * xSide;
    doorLine(`DoorLineF_${s}`, x, cF - 0.04);
    doorLine(`DoorLineB_${s}`, x, cR + 0.04);
    if (bZ !== null) doorLine(`DoorLineMid_${s}`, x, bZ);
  }

  buildWheelWells(g, P, arches);

  addPanelGap(g, 'HoodLine', [2 * (P.halfW - 0.20), 0.01, 0.01], [0, P.frontBeltY + 0.005, cF + 0.005]);
  addPanelGap(g, 'TrunkLine', [2 * (P.halfW - 0.20), 0.01, 0.01], [0, P.rearBeltY + 0.005, cR - 0.005]);

  // Líneas de diseño
  if (CONFIG.designLines.enabled) {
    const lThick = CONFIG.designLines.thickness;
    if (P.frontBumperLen >= 0.15) {
      const zFront = P.hoodFrontZ;
      const yFront = P.bottomY + (P.noseTopY - P.bottomY) * 0.5;
      addPanelGap(g, 'BumperLineF', [P.width + 0.005, lThick, 0.02], [0, yFront, zFront]);
    }
    if (P.rearBumperLen >= 0.15) {
      const zRear = P.trunkRearZ;
      const yRear = P.bottomY + (P.tailTopY - P.bottomY) * 0.5;
      addPanelGap(g, 'BumperLineR', [P.width + 0.005, lThick, 0.02], [0, yRear, zRear]);
    }
    if (CONFIG.designLines.random) {
      for (let i = 0; i < 3; i++) {
        const ry = P.bottomY + 0.2 + Math.random() * (P.bodyH - 0.4);
        for (const s of [-1, 1]) {
          addPanelGap(g, `SideLineRand_${i}_${s}`, [0.012, lThick * (0.8 + Math.random()), P.length * 0.7], [s * xSide, ry, 0]);
        }
      }
    }
  }

  return g;
}

// Pilar trasero de chapa: en vez de acabar en una barra fina, la última ventana termina en la línea
// que va de zTop (arriba) a zBot (abajo) y detrás queda un panel de chapa hasta el pilar C. Con
// quiebro (kink) la esquina de abajo de la ventana se dobla hacia delante. null = barra fina
function rearPanel(P){
  const style = CONFIG.pillars.rear || 'bar';
  if (style === 'bar') return null;
  const cF = P.cabinFrontZ, cR = P.cabinRearZ, rF = P.roofFrontZ, rR = P.roofRearZ;
  const bZ = P.bPillar ? cF + (cR - cF) * 0.47 : null;
  // La última ventana conserva al menos 30 cm abajo y arriba
  const limit = (bZ !== null ? bZ : Math.min(cF, rF)) - 0.30;
  const w = THREE.MathUtils.clamp(CONFIG.pillars.rearWidth ?? 0.45, 0.05, 1.2);
  const kink = style === 'kink' ? Math.min(0.2, 0.07 + w * 0.3) : 0;
  const zBot = Math.min(cR + w, limit - kink);
  const zTop = Math.min(rR + w * 0.45, limit);
  if (zBot < cR + 0.04 || zTop < rR + 0.01) return null;
  return { style, zTop, zBot, kink, mat: style === 'panelRoof' ? MAT.roofPaint : MAT.paint };
}

// Pilares verticales de las ventanas: el B del modelo y uno más en cada hueco que pase de
// maxWindow. Solo cabe un pilar recto donde el hueco tiene a la vez techo y base (entre rR y rF)
function windowDividers(P){
  const cF = P.cabinFrontZ, cR = P.cabinRearZ, rF = P.roofFrontZ, rR = P.roofRearZ;
  const bPillars = P.bPillar ? [cF + (cR - cF) * 0.47] : [];
  const rp = rearPanel(P);
  const lowEdges = [cF, ...bPillars, rp ? rp.zBot + rp.kink : cR];
  const topEdges = [rF, ...bPillars, rp ? rp.zTop : rR];
  const extraPillars = [];
  for (let i = 0; i < lowEdges.length - 1; i++){
    const len = lowEdges[i] - lowEdges[i + 1];
    const parts = Math.ceil(len / CONFIG.pillars.maxWindow - 1e-6);
    const hi = Math.min(lowEdges[i], topEdges[i]) - 0.10;
    const lo = Math.max(lowEdges[i + 1], topEdges[i + 1]) + 0.10;
    for (let k = 1; k < parts && hi > lo; k++){
      const z = THREE.MathUtils.clamp(lowEdges[i] - len * k / parts, lo, hi);
      if (extraPillars.every(e => Math.abs(e - z) > 0.15)) extraPillars.push(z);
    }
  }
  return { bPillars, dividers: [...bPillars, ...extraPillars].sort((a, b) => b - a) };
}

function buildCabin(P){
  const g = new THREE.Group();
  g.name = 'Cabin';

  const cw = P.cabinW;
  const cF = P.cabinFrontZ, cR = P.cabinRearZ;
  const rF = P.roofFrontZ,  rR = P.roofRearZ;
  const pThick = CONFIG.pillars.thick;
  const bow = CONFIG.pillars.curve;

  const roofGap = CONFIG.glass.roofGap;
  // La base de cada cristal queda dentro del remate de cintura de la puerta, sin hueco por abajo
  const glassBottomY = z => sillY(P, z) - 0.012 + CONFIG.glass.bottomOffset;
  const pillarBaseY  = z => sillY(P, z) - 0.01;

  const metalX = CONFIG.glass.roofMetalX;
  const metalZ = CONFIG.glass.roofMetalZ;
  const metalY = CONFIG.glass.roofMetalY;

  const totalZ = Math.max(0.02, rF - rR);
  const gX  = Math.max(0, cw * (1 - metalX));
  const gZf = Math.max(rR + 0.01, rF - totalZ * metalZ * 0.5);
  const gZr = Math.min(rF - 0.01, rR + totalZ * metalZ * 0.5);

  const oX = cw + 0.02;
  const getRoofY  = (x, z) => roofSurfaceY(P, x, z);
  const glassTopY = (x, z) => getRoofY(x, z) - roofGap - 0.01;

  function addCurvedSurface(name, xMin, xMax, zMin, zMax, xSegs, zSegs, mat, yOffset = 0){
    const geo = new THREE.BufferGeometry();
    const positions = [];
    const indices = [];

    for (let iz = 0; iz <= zSegs; iz++){
      const tz = iz / zSegs;
      const z = zMin + (zMax - zMin) * tz;
      for (let ix = 0; ix <= xSegs; ix++){
        const tx = ix / xSegs;
        const x = xMin + (xMax - xMin) * tx;
        const y = getRoofY(x, z) + yOffset;
        positions.push(x, y, z);
      }
    }

    // Una sola orientación por triángulo (hacia arriba): con las dos, las normales se anulan y el
    // reflejo del techo sale en franjas
    const stride = xSegs + 1;
    for (let iz = 0; iz < zSegs; iz++){
      for (let ix = 0; ix < xSegs; ix++){
        const a = iz * stride + ix;
        const b = a + 1;
        const c = (iz + 1) * stride + ix;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  }

  // Chapa metálica del techo usando MAT.roofPaint (color de techo correcto). Techo completo (o metal
  // al 100 %): una sola chapa sin cristal
  if (CONFIG.glass.roofType === 'solid' || gX <= 0.01 || gZf - gZr <= 0.005){
    addCurvedSurface('RoofPanel', -oX, oX, rR, rF, 20, 20, MAT.roofPaint, metalY * 0.5);
  } else {
    addCurvedSurface('RoofFront', -oX, oX, gZf, rF, 16, 6, MAT.roofPaint, metalY * 0.5);
    addCurvedSurface('RoofRear',  -oX, oX, rR, gZr, 16, 6, MAT.roofPaint, metalY * 0.5);
    addCurvedSurface('RoofSideL', -oX, -gX, gZr, gZf, 6, 16, MAT.roofPaint, metalY * 0.5);
    addCurvedSurface('RoofSideR',  gX,  oX, gZr, gZf, 6, 16, MAT.roofPaint, metalY * 0.5);
    addCurvedSurface('PanoramicRoof', -gX, gX, gZr, gZf, 12, 16, MAT.roofGlass);
  }

  // Parabrisas y luneta: una columna por cada x que sigue el mismo arco que los pilares A y C
  const gw = cw - 0.005;
  function addGlassSheet(name, columnAt, topFirst){
    const xSegs = 8;
    const cols = [];
    for (let ix = 0; ix <= xSegs; ix++) cols.push(columnAt(-gw + 2 * gw * ix / xSegs));
    const rows = cols[0].length;
    const pos = [], ind = [], uv = [];
    cols.forEach((col, ix) => col.forEach((p, j) => {
      pos.push(p.x, p.y, p.z);
      const v = j / (rows - 1);
      uv.push(ix / xSegs, topFirst ? 1 - v : v);
    }));
    for (let ix = 0; ix < xSegs; ix++){
      for (let j = 0; j < rows - 1; j++){
        const a = ix * rows + j, b = a + 1, c = a + rows, d = c + 1;
        ind.push(a, c, b, b, c, d);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(ind);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, MAT.glass);
    mesh.name = name;
    g.add(mesh);
    // Serigrafía negra en el borde, por encima del cristal
    if (CONFIG.details.frit){
      const mid = cols[xSegs / 2];
      let h = 0;
      for (let j = 1; j < mid.length; j++) h += mid[j].distanceTo(mid[j - 1]);
      const frit = new THREE.Mesh(geo.clone(), fritMaterial(2 * gw, h));
      frit.name = name + 'Frit';
      frit.renderOrder = 3;
      g.add(frit);
    }
  }
  addGlassSheet('Windshield', x => bowedPath(x, glassBottomY(cF), cF, glassTopY(x, rF), rF, bow, 10), false);
  addGlassSheet('RearWindow', x => bowedPath(x, glassTopY(x, rR), rR, glassBottomY(cR), cR, bow, 10), true);
  buildGlassDetails(g, P, gw, bow, glassBottomY, glassTopY);

  const { bPillars, dividers } = windowDividers(P);
  const rp = rearPanel(P);

  // Borde trasero de la última ventana cuando el lateral acaba en chapa (de arriba a abajo)
  const panelEdge = x => {
    const yT = glassTopY(x, rp.zTop), zB = rp.zBot + rp.kink, yB = glassBottomY(zB);
    const pts = [];
    if (!rp.kink){
      for (let i = 0; i <= 8; i++){ const t = i / 8; pts.push(new THREE.Vector3(x, yT + (yB - yT) * t, rp.zTop + (rp.zBot - rp.zTop) * t)); }
      return pts;
    }
    // Quiebro: baja hasta un tercio de la ventana y se dobla hacia delante
    const yK = yB + (yT - yB) * 0.42;
    for (let i = 0; i <= 6; i++){ const t = i / 6; pts.push(new THREE.Vector3(x, yT + (yK - yT) * t, rp.zTop + (rp.zBot - rp.zTop) * t)); }
    for (let i = 1; i <= 6; i++){
      const t = i / 6, a = (1 - t) * (1 - t), m = 2 * (1 - t) * t, c = t * t;
      pts.push(new THREE.Vector3(x, a * yK + m * yB + c * yB, a * rp.zBot + m * rp.zBot + c * zB));
    }
    return pts;
  };
  // Panel de chapa entre ese borde y el pilar C, del remate de cintura al larguero del techo
  function addRearPanel(s){
    const xs = cw;
    const outline = [
      ...panelEdge(xs),
      ...Array.from({ length: 6 }, (_, i) => { const z = rp.zBot + rp.kink + (cR - rp.zBot - rp.kink) * (i + 1) / 6; return new THREE.Vector3(xs, pillarBaseY(z) - 0.006, z); }),
      ...bowedPath(xs, getRoofY(xs, rR), rR, pillarBaseY(cR), cR, bow).reverse().slice(1),
      ...Array.from({ length: 6 }, (_, i) => { const z = rR + (rp.zTop - rR) * (i + 1) / 6; return new THREE.Vector3(xs, railY(xs, z), z); }),
    ];
    // Losa con los cantos redondeados, de 1 cm por dentro del cristal a 2,4 cm por fuera
    const t = 0.034;
    const shape = new THREE.Shape(outline.map(p => new THREE.Vector2(s > 0 ? p.z : -p.z, p.y)));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 4 });
    geo.rotateY(-s * Math.PI / 2);
    geo.translate(s > 0 ? cw + 0.024 : -(cw + 0.024), 0, 0);
    geo.computeVertexNormals();
    const panel = new THREE.Mesh(geo, rp.mat);
    panel.name = `RearPanel_${s}`;
    panel.castShadow = panel.receiveShadow = true;
    g.add(panel);
  }

  // Marco metálico: pilares A y C curvados, largueros sobre las ventanas y travesaños del techo,
  // que tapan el hueco entre el cristal y la chapa
  const frame = roundedRectSection(0.06, pThick, CONFIG.pillars.round);
  const railThick = Math.max(pThick, roofGap + metalY + 0.03);
  const rail = roundedRectSection(0.06, railThick, CONFIG.pillars.round);
  const railY = (x, z) => (glassTopY(x, z) + getRoofY(x, z) + metalY * 0.5) / 2;
  const AX = new THREE.Vector3(1, 0, 0), AZ = new THREE.Vector3(0, 0, 1);

  for (const s of [-1, 1]){
    const x = s * cw;
    sweepSection(g, `PillarA_${s}`, bowedPath(x, pillarBaseY(cF), cF, getRoofY(x, rF), rF, bow), frame, AX, MAT.roofPaint);
    sweepSection(g, `PillarC_${s}`, bowedPath(x, getRoofY(x, rR), rR, pillarBaseY(cR), cR, bow), frame, AX, rp ? rp.mat : MAT.roofPaint);
    if (rp) addRearPanel(s);

    const railPath = [];
    for (let i = 0; i <= 16; i++){
      const z = rF + (rR - rF) * i / 16;
      railPath.push(new THREE.Vector3(x, railY(x, z), z));
    }
    sweepSection(g, `RoofRail_${s}`, railPath, rail, AX, MAT.roofPaint);

    // Cromado alrededor de las ventanas: por encima de ellas y bajando por el borde trasero
    if (CONFIG.accessories.highLine.type === 'chromeLoop'){
      const xo = s * (cw + 0.034), zEnd = rp ? rp.zTop : rR;
      const loop = [];
      for (let i = 0; i <= 20; i++){
        const z = rF - 0.05 + (zEnd - rF + 0.05) * i / 20;
        loop.push(new THREE.Vector3(xo, railY(x, z) - railThick * 0.42, z));
      }
      const down = rp ? panelEdge(x) : bowedPath(x, glassTopY(x, rR), rR, glassBottomY(cR), cR, bow, 12);
      for (const p of down.slice(1)) loop.push(new THREE.Vector3(xo, p.y, p.z));
      sweepSection(g, `ChromeLoop_${s}`, loop, roundedRectSection(0.014, 0.012, 1.0), AX, MAT.chrome);
    }

    dividers.forEach((z, k) => {
      const name = bPillars.includes(z) ? `PillarB_${s}` : `PillarExtra_${k}_${s}`;
      sweepSection(g, name, [new THREE.Vector3(x, pillarBaseY(z), z), new THREE.Vector3(x, railY(x, z), z)], frame, AX, MAT.roofPaint);
    });
  }
  for (const [name, z] of [['HeaderFront', rF], ['HeaderRear', rR]]){
    const path = [];
    for (let i = 0; i <= 12; i++){
      const x = -cw + 2 * cw * i / 12;
      path.push(new THREE.Vector3(x, railY(x, z), z));
    }
    sweepSection(g, name, path, rail, AZ, MAT.roofPaint);
  }

  // Ventanas laterales: un cristal por hueco entre pilares, con el borde del A y del C curvado
  const bounds = ['A', ...dividers, 'C'];
  for (const s of [-1, 1]){
    const x = s * (cw - 0.004);
    const frontEdge = bd => bd === 'A'
      ? bowedPath(x, glassBottomY(cF), cF, glassTopY(x, rF), rF, bow, 12)
      : [new THREE.Vector3(x, glassBottomY(bd), bd), new THREE.Vector3(x, glassTopY(x, bd), bd)];
    const rearEdge = bd => bd === 'C'
      ? (rp ? panelEdge(x) : bowedPath(x, glassTopY(x, rR), rR, glassBottomY(cR), cR, bow, 12))
      : [new THREE.Vector3(x, glassTopY(x, bd), bd), new THREE.Vector3(x, glassBottomY(bd), bd)];

    for (let i = 0; i < bounds.length - 1; i++){
      const front = frontEdge(bounds[i]);                // de abajo a arriba
      const rear  = rearEdge(bounds[i + 1]);             // de arriba a abajo
      const zA = front[front.length - 1].z, zB = rear[0].z;
      const top = [];
      for (let k = 1; k < 8; k++){
        const z = zA + (zB - zA) * k / 8;
        top.push(new THREE.Vector3(x, glassTopY(x, z), z));
      }
      const contour = [...front, ...top, ...rear];
      const tris = THREE.ShapeUtils.triangulateShape(contour.map(p => new THREE.Vector2(p.z, p.y)), []);
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(contour.flatMap(p => [p.x, p.y, p.z]), 3));
      geo.setIndex(tris.flat());
      geo.computeVertexNormals();
      const win = new THREE.Mesh(geo, MAT.glass);
      win.name = `SideWin_${i}_${s}`;
      g.add(win);
    }
  }

  return g;
}

function buildInterior(P){
  const g = new THREE.Group();
  g.name = 'Interior';

  const cw   = P.cabinW;
  const cF   = P.cabinFrontZ, cR = P.cabinRearZ;
  const span = Math.max(0.1, cF - cR);

  const yFloor = P.bottomY + 0.04;
  const beltH  = Math.max(0.1, (P.frontBeltY + P.rearBeltY) / 2 - yFloor);

  // Escalado dinámico de los asientos en altura y tamaño según lo grande que se haga la cabina
  const cabinHMult = THREE.MathUtils.clamp(CONFIG.zones.cabin.height, 0.65, 1.45);
  const cabinLMult = THREE.MathUtils.clamp(CONFIG.zones.cabin.length, 0.70, 1.40);

  const seatX = cw * 0.42;
  const seatW = cw * 0.68 * Math.min(1.12, 0.90 + cabinHMult * 0.10);

  const frontSeatZ = cF - span * 0.38;
  const rearSeatZ  = cR + span * 0.25;

  // Suelo alfombrado de la cabina
  // Los pasos de rueda que entran en el habitáculo dejan el suelo, los paneles y los asientos por dentro
  const arches = wheelArches(P);
  const zFreeR = arches.rear  ? Math.max(cR, arches.rear.a1 + 0.02)  : cR;
  const zFreeF = arches.front ? Math.min(cF, arches.front.a0 - 0.02) : cF;
  const floorHalf = Math.min(cw * 0.97, cabinHalfFree(P, cR, cF, yFloor));
  addBox(g, 'InteriorFloor', [floorHalf * 2, 0.015, span * 0.98], [0, yFloor + 0.008, (cF + cR) / 2], MAT.floor);
  if (floorHalf < cw * 0.97 && zFreeF - zFreeR > 0.1){
    addBox(g, 'InteriorFloorWide', [cw * 1.94, 0.015, zFreeF - zFreeR], [0, yFloor + 0.007, (zFreeF + zFreeR) / 2], MAT.floor);
  }

  // Alfombrillas delanteras del conductor y copiloto
  for (const s of [-1, 1]){
    addBox(g, `FloorMat_${s}`, [seatW * 0.90, 0.006, 0.55 * cabinLMult], [s * seatX, yFloor + 0.018, cF - span * 0.32], MAT.dash);
  }

  // Cortafuegos delantero y mamparo trasero
  addBox(g, 'Firewall',     [2 * Math.min(cw * 0.98, cabinHalfFree(P, cF - 0.03, cF, yFloor)), beltH, 0.03], [0, yFloor + beltH / 2, cF - 0.015], MAT.dash);
  addBox(g, 'RearBulkhead', [2 * Math.min(cw * 0.98, cabinHalfFree(P, cR, cR + 0.03, yFloor)), beltH, 0.03], [0, yFloor + beltH / 2, cR + 0.015], MAT.dash);
  addBox(g, 'ParcelShelf',  [cw * 1.94, 0.025, 0.30], [0, P.rearBeltY - 0.01, cR + 0.15], MAT.dash);
  for (const sx of [-1, 1]) addPart(g, `ShelfSpeaker_${sx}`, 'speaker_shelf', [sx * cw * 0.62, P.rearBeltY - 0.01 + 0.0125, cR + 0.15]);

  // Paneles interiores de puerta con reposabrazos y tiradores cromados
  for (const s of [-1, 1]){
    const dx = s * (cw + 0.01);
    // Panel interior: su borde inferior salta por encima de los pasos de rueda
    const cz0 = cR + span * 0.03, cz1 = cF - span * 0.03, cTop = yFloor + beltH * 0.91;
    const cardPts = [];
    for (let k = 0; k <= 24; k++){
      const z = cz0 + (cz1 - cz0) * k / 24, ya = archYAt(P, arches, z);
      cardPts.push(new THREE.Vector2(z, Math.min(cTop - 0.05, ya === null ? yFloor : Math.max(yFloor, ya + 0.03))));
    }
    const card = new THREE.ExtrudeGeometry(new THREE.Shape([...cardPts, new THREE.Vector2(cz1, cTop), new THREE.Vector2(cz0, cTop)]), { depth: 0.025, bevelEnabled: false })
      .rotateY(-Math.PI / 2).translate(dx + 0.0125, 0, 0);
    addMesh(g, `InnerDoorCard_${s}`, new THREE.Mesh(card, MAT.leather));
    const ar0 = Math.max((cF + cR) / 2 - span * 0.25, zFreeR), ar1 = Math.min((cF + cR) / 2 + span * 0.25, zFreeF);
    if (ar1 - ar0 > 0.12) addBox(g, `DoorArmrest_${s}`, [0.055, 0.04, ar1 - ar0], [dx - s * 0.02, yFloor + beltH * 0.48, (ar0 + ar1) / 2], MAT.dash);
    // Piezas de puerta (modeladas hacia +z, giradas hacia el habitáculo): tirador, altavoces y botonera
    const inner = dx - s * 0.0125, face = { rot: [0, -s * Math.PI / 2, 0] };
    if (PARTS.has('door_handle_in')){
      addPart(g, `DoorHandleIn_${s}`, 'door_handle_in', [inner, yFloor + beltH * 0.62, cF - span * 0.32], face);
      const woofer = z => {
        const ya = archYAt(P, arches, z);
        return Math.min(cTop - 0.16, Math.max(yFloor + 0.16, ya === null ? 0 : ya + 0.14));
      };
      addPart(g, `DoorSpeaker_${s}`, 'speaker_door', [inner, woofer(cF - span * 0.16), cF - span * 0.16], face);
      if (P.bPillar) addPart(g, `DoorSpeakerRear_${s}`, 'speaker_door', [inner, woofer(cR + span * 0.30), cR + span * 0.30], face);
      addPart(g, `DoorTweeter_${s}`, 'speaker_tweeter', [inner, cTop - 0.07, cF - span * 0.07], face);
      if (ar1 - ar0 > 0.12) addPart(g, `DoorSwitches_${s}`, 'door_switches', [dx - s * 0.02, yFloor + beltH * 0.48 + 0.02, ar1 - 0.10]);
    } else {
      addBox(g, `DoorHandle_${s}`, [0.015, 0.02, 0.08], [dx - s * 0.035, yFloor + beltH * 0.62, cF - span * 0.32], MAT.chrome);
    }
  }

  const style = CONFIG.interior.dashboard;

  // Consola central y túnel de transmisión
  const consoleW   = 0.24;
  const consoleH   = 0.22 * cabinHMult;
  const consoleY   = yFloor + consoleH / 2;
  const consoleZ   = (cF + cR) / 2;
  const consoleLen = span * 0.84;
  addBox(g, 'CenterTunnel', [consoleW, consoleH, consoleLen], [0, consoleY, consoleZ], MAT.dash);
  addBox(g, 'ConsoleTrimL', [0.008, consoleH, consoleLen], [-consoleW/2, consoleY, consoleZ], MAT.ambient);
  addBox(g, 'ConsoleTrimR', [0.008, consoleH, consoleLen], [ consoleW/2, consoleY, consoleZ], MAT.ambient);

  // Reposabrazos central abatible de cuero
  addBox(g, 'CenterArmrest', [consoleW * 0.95, 0.07 * cabinHMult, span * 0.32], [0, yFloor + consoleH + 0.035 * cabinHMult, cR + span * 0.42], MAT.leather);

  // Consola: portavasos, carga inalámbrica, mando giratorio y palanca según el estilo (piezas de
  // Blender); el freno de mano solo con cambio manual
  const consoleTopY = yFloor + consoleH;
  if (PARTS.has('console_top')){
    addPart(g, 'ConsoleTop', 'console_top', [0, consoleTopY, cF - span * 0.42], { scale: [consoleW / 0.24, 1, 1] });
    addPart(g, 'Shifter', { sport: 'shifter_manual', luxury: 'shifter_auto' }[style] || 'shifter_dial', [0, consoleTopY, cF - span * 0.27]);
  }
  if (!PARTS.has('console_top')){
    // Portavasos dobles con anillo cromado
    for (const cz of [-0.065, 0.065]){
      const cupHolder = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.006, 8, 20), MAT.chrome);
      cupHolder.rotation.x = Math.PI / 2;
      cupHolder.position.set(0, yFloor + consoleH + 0.006, cF - span * 0.44 + cz);
      g.add(cupHolder);
      const cupWell = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.036, 0.03, 16), MAT.floor);
      cupWell.position.set(0, yFloor + consoleH - 0.01, cF - span * 0.44 + cz);
      g.add(cupWell);
    }

    // Palanca de cambios (Gear Shift Lever)
    const shiftZ = cF - span * 0.28;
    const shiftY = yFloor + consoleH;
    addBox(g, 'ShiftBezel', [0.12, 0.012, 0.14], [0, shiftY + 0.006, shiftZ], MAT.chrome);
    addBox(g, 'ShiftBoot',  [0.085, 0.045 * cabinHMult, 0.10], [0, shiftY + 0.025 * cabinHMult, shiftZ], MAT.leather);
    const shiftRod = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.09 * cabinHMult, 16), MAT.chrome);
    shiftRod.position.set(0, shiftY + 0.08 * cabinHMult, shiftZ);
    shiftRod.rotation.x = 0.12;
    g.add(shiftRod);
    const shiftKnob = new THREE.Mesh(new THREE.SphereGeometry(0.024, 16, 16), MAT.dash);
    shiftKnob.scale.set(1, 1.2, 1);
    shiftKnob.position.set(0, shiftY + 0.13 * cabinHMult, shiftZ + 0.01);
    g.add(shiftKnob);
    const shiftCap = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 16), MAT.chrome);
    shiftCap.position.set(0, shiftY + 0.145 * cabinHMult, shiftZ + 0.01);
    g.add(shiftCap);

  }
  if (!PARTS.has('console_top') || style === 'sport'){
    // Freno de mano (Handbrake Lever)
    const hbX = -0.065;
    const hbZ = PARTS.has('console_top') ? cF - span * 0.42 - 0.26 : cF - span * 0.38;
    const hbY = yFloor + consoleH;
    addBox(g, 'HandbrakeBoot', [0.035, 0.03, 0.11], [hbX, hbY + 0.015, hbZ], MAT.leather);
    const hbHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 16), MAT.dash);
    hbHandle.rotation.x = -0.38;
    hbHandle.position.set(hbX, hbY + 0.065, hbZ - 0.02);
    g.add(hbHandle);
    const hbBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.014, 12), MAT.chrome);
    hbBtn.rotation.x = -0.38;
    hbBtn.position.set(hbX, hbY + 0.115, hbZ - 0.065);
    g.add(hbBtn);
  }

  // Pedales del conductor (Pedal Box)
  const pedX = -seatX;
  const pedY = yFloor + 0.07;
  const pedZ = cF - 0.06;
  addBox(g, 'PedalAccel',  [0.035, 0.09, 0.012],  [pedX + 0.07, pedY, pedZ], MAT.chrome, [-0.25, 0, 0]);
  addBox(g, 'PedalBrake',  [0.055, 0.065, 0.012], [pedX, pedY + 0.015, pedZ], MAT.chrome, [-0.25, 0, 0]);
  addBox(g, 'PedalClutch', [0.05, 0.08, 0.012],   [pedX - 0.08, pedY + 0.015, pedZ], MAT.chrome, [-0.25, 0, 0]);

  // Salpicadero y volante: piezas de Blender por estilo (pantallas, guantera, rejillas, tweeters,
  // altavoz central, climatización). Ancho de diseño 1.50 m; el cuadro queda frente al conductor
  const dashY = yFloor + beltH * 0.76;
  const dashZ = cF - 0.20;
  if (PARTS.has(`dash_${style}`)){
    addPart(g, 'Dashboard', `dash_${style}`, [0, dashY, dashZ], { scale: [cw * 1.94 / 1.5, 1, 1] });
    const steer = { sport: 'steer_sport', luxury: 'steer_luxury', minimal: 'steer_minimal', futuristic: 'steer_yoke' }[style] || 'steer_sport';
    addPart(g, 'SteeringWheel', steer, [-seatX, dashY + 0.02, dashZ - 0.27], { rot: [0.42, 0, 0] });
  } else {
    // Salpicadero (Dashboard)
    const dashType = style;

    if (dashType === 'sport'){
      addBox(g, 'DashMain',   [cw * 1.94, 0.18, 0.30], [0, dashY, dashZ], MAT.carbon);
      addBox(g, 'DashAccent', [cw * 1.85, 0.008, 0.015], [0, dashY - 0.08, dashZ - 0.10], MAT.ambient);
    } else if (dashType === 'luxury'){
      addBox(g, 'DashMain', [cw * 1.94, 0.18, 0.30], [0, dashY, dashZ], MAT.dash);
      addBox(g, 'DashWood', [cw * 1.86, 0.04, 0.02],  [0, dashY - 0.02, dashZ - 0.14], MAT.wood);
      const clock = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.006, 8, 24), MAT.chrome);
      clock.position.set(0, dashY + 0.03, dashZ - 0.15); g.add(clock);
    } else {
      addBox(g, 'DashMain',   [cw * 1.94, 0.18, 0.30], [0, dashY, dashZ], MAT.dash);
      addBox(g, 'DashAccent', [cw * 1.85, 0.006, 0.02], [0, dashY - 0.06, dashZ - 0.10], MAT.ambient);
    }

    // Visera de instrumentos y pantallas
    addBox(g, 'DashBinnacle',  [0.38, 0.08, 0.22],  [-seatX, dashY + 0.08, dashZ - 0.04], MAT.dash);
    addBox(g, 'ClusterScreen', [0.30, 0.10, 0.012], [-seatX, dashY + 0.04, dashZ - 0.13], MAT.screen, [0.15, 0, 0]);
    addBox(g, 'InfoScreen',    [0.32, 0.16, 0.015], [0.08,   dashY + 0.06, dashZ - 0.12], MAT.screen, [0.12, 0.10, 0]);

    // Rejillas de climatización y guantera
    addBox(g, 'VentL',   [0.09, 0.035, 0.015], [-cw * 0.85, dashY + 0.02, dashZ - 0.14], MAT.chrome);
    addBox(g, 'VentR',   [0.09, 0.035, 0.015], [ cw * 0.85, dashY + 0.02, dashZ - 0.14], MAT.chrome);
    addBox(g, 'VentMid', [0.18, 0.035, 0.015], [0.08, dashY - 0.05, dashZ - 0.14], MAT.chrome);
    addBox(g, 'GloveBox',    [seatW * 0.85, 0.12, 0.015], [seatX, dashY - 0.06, dashZ - 0.14], MAT.dash);
    addBox(g, 'GloveHandle', [0.04, 0.012, 0.01],         [seatX + 0.08, dashY - 0.03, dashZ - 0.15], MAT.chrome);

    // Volante y columna de dirección
    const colY = dashY - 0.04;
    const colZ = dashZ - 0.09;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.18, 16), MAT.dash);
    col.position.set(-seatX, colY, colZ);
    col.rotation.x = -0.45;
    g.add(col);

    addBox(g, 'StalkL', [0.09, 0.012, 0.012], [-seatX - 0.07, colY + 0.04, colZ - 0.04], MAT.dash, [0, 0, 0.2]);
    addBox(g, 'StalkR', [0.09, 0.012, 0.012], [-seatX + 0.07, colY + 0.04, colZ - 0.04], MAT.dash, [0, 0, -0.2]);

    const wheelY = colY + 0.075;
    const wheelZ = colZ - 0.085;
    const sw = new THREE.Mesh(new THREE.TorusGeometry(0.165, 0.018, 12, 32), MAT.dash);
    sw.position.set(-seatX, wheelY, wheelZ);
    sw.rotation.x = Math.PI / 2 - 0.45;
    g.add(sw);

    const hubCap = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.022, 24), MAT.dash);
    hubCap.position.set(-seatX, wheelY, wheelZ);
    hubCap.rotation.x = Math.PI / 2 - 0.45;
    g.add(hubCap);

    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.026, 16), MAT.chrome);
    emblem.position.set(-seatX, wheelY, wheelZ);
    emblem.rotation.x = Math.PI / 2 - 0.45;
    g.add(emblem);
  }

  // ASIENTOS: piezas de Blender a tamaño real, escaladas a la altura libre del habitáculo
  const kH = THREE.MathUtils.clamp((P.roofY - yFloor - 0.12) / 1.12, 0.72, 1.05);
  const kW = THREE.MathUtils.clamp(seatW / 0.54, 0.8, 1.2);
  for (const s of [-1, 1]){
    addPart(g, `SeatFront_${s}`, 'seat_front', [s * seatX, yFloor, frontSeatZ], { scale: [kW, kH, 1] });
    // Pantalla para los de atrás en la cara trasera del reposacabezas
    if (style === 'luxury' || style === 'futuristic'){
      addPart(g, `SeatScreen_${s}`, 'seat_screen', [s * seatX, yFloor + 1.013 * kH, frontSeatZ - 0.452], { rot: [-0.26, 0, 0] });
    }
  }
  // La banqueta trasera se adelanta si su respaldo tocaría la luneta, sin pegarse a los delanteros
  const rearSill = sillY(P, cR);
  const tGlass = THREE.MathUtils.clamp((yFloor + 1.02 * kH - rearSill) / Math.max(0.1, P.roofY - rearSill), 0, 1);
  const glassZ = cR + (P.roofRearZ - cR) * tGlass;
  const rearZ = Math.min(Math.max(rearSeatZ, glassZ + 0.42), frontSeatZ - 0.56);
  const benchW = Math.min(cw * 1.84, 2 * (cabinHalfFree(P, rearZ - 0.32, rearZ + 0.32, yFloor + 0.05) - 0.01));
  addPart(g, 'SeatRear', 'seat_rear', [0, yFloor, rearZ], { scale: [benchW / 1.30, kH, 1] });

  // Espejo retrovisor interior y luz ambiental de cabina
  const mirrorY = P.roofY - CONFIG.glass.roofGap - 0.04;
  // Pegado al parabrisas por dentro: z del cristal a la altura del espejo, algo hacia atrás
  const wsBase = sillY(P, cF);
  const tWs = THREE.MathUtils.clamp((mirrorY - wsBase) / Math.max(0.1, P.roofY - wsBase), 0, 1);
  const mirrorZ = cF + (P.roofFrontZ - cF) * tWs - 0.07;
  addBox(g, 'MirrorStem',  [0.015, 0.04, 0.015], [0, mirrorY + 0.015, mirrorZ], MAT.dash);
  addBox(g, 'MirrorBody',  [0.18,  0.05, 0.025], [0, mirrorY, mirrorZ], MAT.dash);
  addBox(g, 'MirrorGlass', [0.165, 0.04, 0.004], [0, mirrorY, mirrorZ - 0.013], MAT.chrome);

  const cabinLight = new THREE.PointLight(0xfff2d8, 0.9, 3.2, 2);
  cabinLight.position.set(0, yFloor + beltH * 0.9, (cF + cR) / 2);
  g.add(cabinLight);

  return g;
}

// Opciones de los desplegables de faros, detalles y accesorios: [valor, etiqueta]. El panel y el
// randomizado leen de aquí, así que un tipo nuevo se añade en la lista y en su constructor
const OPTIONS = {
  headlight: [
    ['block', 'Bloque estándar'], ['matrix', 'Matriz LED'], ['strip', 'Tira continua'],
    ['round', 'Redondos retro'], ['lens', 'Lente xenón'], ['quad', 'Cuádruple'],
    ['hyper', 'Hiper deportivo'], ['halo', 'Halo DRL'], ['twin-round', 'Doble redondo clásico'],
    ['oval', 'Ovalado'], ['square', 'Cuadrado con marco cromado'], ['pixel', 'Píxeles LED'],
    ['split', 'Dividido (DRL arriba, faro abajo)'], ['eyebrow', 'Ceja LED sobre proyector'],
    ['l-shape', 'Firma en L'], ['c-shape', 'Firma en C'], ['arrow', 'Flecha / boomerang'],
    ['triangle', 'Triangular'], ['hex', 'Hexagonal'], ['teardrop', 'Lágrima'],
    ['projector', 'Proyector con anillo'], ['vertical', 'Vertical apilado'],
    ['tri-led', 'Tres LED redondos'], ['slim', 'Ultrafino'], ['popup', 'Escamoteable retro'],
    ['hidden', 'Bajos verticales (luz diurna en la parrilla)'],
    ['lightbar', 'Barra de luz de lado a lado'],
    ['wrap', 'Envolvente en esquina (hueco en chapa)'], ['wrap-blade', 'Cuchilla envolvente'],
    ['wrap-boomerang', 'Bumerán envolvente'], ['wrap-tall', 'Vertical en esquina'],
    ['wrap-split', 'Partido envolvente (DRL + proyectores)'], ['wrap-classic', 'Óptica envolvente clásica'],
  ],
  taillight: [
    ['bar', 'Barra continua LED'], ['split', 'Divididos'], ['round', 'Redondos GT'], ['matrix', 'Matriz'],
    ['neon', 'Neón Cyber'], ['block', 'Bloque estándar'],
    ['wrap', 'Envolvente en esquina (hueco en chapa)'], ['wrap-blade', 'Cuchilla envolvente'],
    ['wrap-tall', 'Vertical en esquina'], ['wrap-c', 'Firma en C envolvente'],
    ['claw', 'Garras con barra de lado a lado (estilo Tucson)'],
  ],
  drl: [
    ['none', 'Sin firma LED extra'], ['line', 'Firma: línea superior'], ['under', 'Firma: línea inferior'],
    ['L', 'Firma: contorno en L'], ['dots', 'Firma: puntos LED'], ['bar', 'Firma: barra uniendo los faros'],
  ],
  housing: [['none', 'Sin carcasa'], ['black', 'Carcasa negra'], ['chrome', 'Marco cromado']],
  intake: [
    ['classic', 'Tomas: rejilla inferior y laterales'], ['wide', 'Tomas: boca ancha trapezoidal'],
    ['sport', 'Tomas: deportivas con aletas'], ['curtain', 'Tomas: cortinas de aire en las esquinas'],
    ['triple', 'Tomas: tres separadas'], ['slit', 'Tomas: ranura fina (eléctrico)'],
    ['honeycomb', 'Tomas: boca ancha con panal hexagonal'], ['blade', 'Tomas: boca ancha cruzada por una lama'],
    ['vertical', 'Tomas: ranuras verticales en las esquinas'], ['fang', 'Tomas: colmillos triangulares'],
    ['smile', 'Tomas: sonrisa con panal'], ['none', 'Sin tomas de aire'],
  ],
  grilleTrim: [
    ['none', 'Sin moldura bajo la parrilla'], ['bar', 'Moldura: lama cromada'], ['smile', 'Moldura: sonrisa cromada'],
    ['wing', 'Moldura: ala de aluminio con puntas hacia abajo'], ['gloss', 'Moldura: banda negra brillante con filo cromado'],
    ['led', 'Moldura: tira de luz diurna (segundo nivel de luz)'],
  ],
  rearVent: [['none', 'Sin salidas de aire traseras'], ['corner', 'Salidas de aire en las esquinas'], ['slots', 'Ranuras de ventilación traseras'],
    ['vertical', 'Ranuras verticales en las esquinas'], ['triangle', 'Salidas triangulares en las esquinas']],
  grille: [
    ['slats', 'Lamas verticales'], ['bars-h', 'Barras horizontales'], ['honeycomb', 'Panal (honeycomb)'],
    ['mesh', 'Malla perforada'], ['solid', 'Panel liso'], ['cross', 'Con barras en cruz'],
    ['twin', 'Doble rejilla separada'], ['shield', 'Escudo trapezoidal'], ['hex', 'Hexagonal'],
    ['oval', 'Ovalada clásica'], ['vertical-slots', 'Ranuras verticales anchas'],
    ['parametric', 'Paramétrica de facetas con luces ocultas (estilo Tucson)'],
    ['none', 'Sin parrilla (frontal cerrado)'],
  ],
  grillePattern: [
    ['auto', 'Dibujo según el tipo de parrilla'], ['none', 'Liso, sin dibujo'], ['h-bars', 'Lamas horizontales'],
    ['v-bars', 'Lamas verticales'], ['diagonal', 'Lamas oblicuas'], ['grid', 'Cuadrícula'], ['diamond', 'Rombos'],
    ['diamond-studs', 'Diamantes en relieve'], ['honeycomb', 'Panal hexagonal'], ['dots', 'Malla de puntos'],
    ['chevron', 'Galones en V'], ['cross', 'Cruz central'],
  ],
  grilleFrame: [
    ['chrome', 'Marco cromado fino'], ['chrome-thick', 'Marco cromado ancho'], ['double', 'Doble filo cromado'],
    ['black', 'Marco negro brillante'], ['body', 'Marco del color de la carrocería'], ['none', 'Sin marco'],
  ],
  grilleFinish: [
    ['auto', 'Acabado según el dibujo'], ['chrome', 'Dibujo cromado'], ['darkchrome', 'Dibujo en cromo oscuro'],
    ['black', 'Dibujo negro brillante'], ['body', 'Dibujo del color de la carrocería'], ['alu', 'Dibujo de aluminio'],
  ],
  exhaust: [
    ['none', 'Sin escape visible'], ['single', 'Una salida'], ['dual', 'Doble (una por lado)'],
    ['quad', 'Cuádruple'], ['center', 'Doble central'], ['twin-side', 'Doble en un lado'],
    ['rect', 'Salidas rectangulares integradas'], ['side', 'Salida lateral'], ['stacks', 'Chimeneas verticales'],
  ],
  handle: [
    ['chrome', 'Barra cromada'], ['black', 'Barra negra'], ['led', 'Con luz LED'], ['flush', 'Enrasada'],
    ['pull', 'Tirador con soportes'], ['popout', 'Emergente (tipo eléctrico)'],
    ['classic', 'Clásica con cerradura'], ['hidden', 'Oculta'],
  ],
  mirror: [['standard', 'Estándar'], ['sport', 'Deportivo aerodinámico'], ['camera', 'Cámara compacta'], ['classic', 'Clásico redondo cromado']],
  frontBumper: [
    ['integrated', 'Integrado en la carrocería'], ['chrome', 'Lama cromada clásica'], ['american', 'Americano con topes'],
    ['sport', 'Deportivo con splitter'], ['offroad', 'Acero 4x4 con ganchos y cabrestante'],
    ['bullbar', 'Defensa tubular'], ['rally', 'Rally con faros auxiliares'], ['race', 'Splitter de competición con canards dobles'],
    ['skid', 'Protector plateado (SUV)'],
    ['lip-alu', 'Faldón: labio de aluminio'], ['apron-black', 'Faldón negro con rejilla y lamas plateadas'],
    ['wing-chrome', 'Faldón con ala cromada y labio negro'], ['splitter-gloss', 'Faldón: splitter negro brillante con placas'],
    ['guard-black', 'Faldón protector negro con placa y ganchos'],
  ],
  rearBumper: [
    ['integrated', 'Integrado en la carrocería'], ['chrome', 'Lama cromada clásica'], ['american', 'Americano con topes'],
    ['diffuser', 'Difusor deportivo'], ['offroad', 'Acero 4x4 con bola de remolque'], ['step', 'Peldaño con enganche'],
    ['race-diffuser', 'Difusor de competición con luz de lluvia'], ['twin-diffuser', 'Difusor de doble túnel'], ['blade-diffuser', 'Difusor con lama superior'],
    ['skid', 'Protector plateado con escapes integrados (SUV)'],
    ['apron-black', 'Faldón negro con aletas y catadióptricos'], ['chrome-strip', 'Faldón negro brillante con lama cromada'],
    ['valance-chrome', 'Faldón con marcos de escape cromados (escapes integrados)'], ['guard-black', 'Faldón protector negro con placa y gancho'],
    ['lip-alu', 'Faldón: labio de aluminio'],
  ],
  spoiler: [['none', 'Sin alerón'], ['lip', 'Labio en el maletero'], ['ducktail', 'Cola de pato'], ['wing', 'Ala GT con soportes'], ['roof', 'Alerón de techo'],
            ['swan', 'Ala cuello de cisne GT'], ['biplane', 'Doble plano (time attack)'], ['tall', 'Ala alta de rally'],
            ['whale', 'Cola de ballena'], ['active', 'Pala activa con pistones'], ['lemans', 'Ala Le Mans con aleta de tiburón'],
            ['roofwing', 'Alerón de techo grande con luz de freno']],
  roofRack: [['none', 'Sin barras de techo'], ['rails', 'Barras longitudinales'], ['rack', 'Barras con travesaños'], ['basket', 'Cesta portaequipajes']],
  sideSteps: [['none', 'Sin estribos'], ['tube', 'Estribo de tubo'], ['board', 'Estribo de plataforma']],
  fogLights: [['none', 'Sin luces en el paragolpes delantero'], ['round', 'Antiniebla redondos'], ['strip', 'Antiniebla en tira LED'],
    ['cube', 'Tres cubos LED'], ['vertical', 'Tiras LED verticales en las esquinas'], ['triangle', 'Triangulares con contorno LED'],
    ['cluster', 'Faros principales en el paragolpes (segundo nivel)']],
  rearLights: [['none', 'Sin luces en el paragolpes trasero'], ['reflector', 'Catadióptricos verticales'], ['vertical', 'Tiras LED rojas verticales'],
    ['round', 'Antiniebla y marcha atrás redondos'], ['cluster', 'Segundo piloto en el paragolpes (segundo nivel)'], ['bar', 'Barra roja fina de lado a lado']],
  antenna: [['none', 'Sin antena'], ['shark', 'Antena aleta de tiburón'], ['rod', 'Antena de varilla']],
  hoodScoop: [['none', 'Capó liso'], ['scoop', 'Toma de aire central'], ['vents', 'Rejillas laterales'], ['bulge', 'Abombado central']],
  roofCargo: [['none', 'Sin carga en el techo'], ['box', 'Cofre de techo'], ['lightbar', 'Barra LED de techo']],
  spareWheel: [['none', 'Sin rueda de repuesto'], ['rear', 'Rueda de repuesto trasera']],
  snorkel: [['none', 'Sin snorkel'], ['right', 'Snorkel de admisión']],
  flares: [['none', 'Sin aletines'], ['flares', 'Aletines en los pasos de rueda']],
  mudFlaps: [['none', 'Sin faldillas'], ['flaps', 'Faldillas detrás de las ruedas']],
  visors: [['none', 'Sin deflectores'], ['visors', 'Deflectores de ventanilla']],
  plates: [['eu', 'Con matrículas'], ['none', 'Sin matrículas']],
  paintReal: [['metallic', ''], ['metallic', ''], ['pearl', ''], ['solid', '']],
  roofType: [['panoramic', 'Techo con cristal panorámico (ajustable)'], ['solid', 'Techo completo de chapa (sin cristal)']],
  pillarRear: [['bar', 'Pilar trasero fino (barra)'], ['panel', 'Pilar trasero de chapa (color carrocería)'],
    ['panelRoof', 'Pilar trasero de chapa (color del techo)'], ['kink', 'Chapa con quiebro hacia delante (tipo Hofmeister)']],
  brakeDisc: [['drilled', 'Discos de freno perforados'], ['slotted', 'Discos de freno rayados'], ['plain', 'Discos de freno lisos']],
  caliperColor: [['red', 'Pinzas de freno rojas'], ['yellow', 'Pinzas amarillas'], ['blue', 'Pinzas azules'], ['silver', 'Pinzas plateadas'], ['black', 'Pinzas negras']],
  fuelDoor: [['square', 'Tapa de depósito cuadrada'], ['round', 'Tapa de depósito redonda'], ['none', 'Sin tapa de depósito']],
  bodyBuild: [['sections', 'Secciones transversales unidas a lo largo'], ['extrude', 'Perfil lateral extruido (clásico)']],
  bodySection: [['flat', 'Sección: costados rectos'], ['round', 'Sección: redondeada abajo'], ['barrel', 'Sección: tonel (abombada)'],
    ['tuck', 'Sección: bajos metidos hacia dentro'], ['wedge', 'Sección: trapecio (se estrecha hacia arriba)'], ['crease', 'Sección: arista viva a media altura'],
    ['pontoon', 'Sección: pontón (ancha abajo, años 50)'], ['scallop', 'Sección: costado cóncavo'], ['boat', 'Sección: casco de barco']],
  beltLine: [['none', 'Sin línea de cintura'], ['sharp', 'Línea de cintura afilada (de faros a pilotos)'], ['step', 'Hombro marcado: escalón bajo las ventanas']],
  creaseLine: [['none', 'Sin línea de pliegue'], ['ridge', 'Pliegue en relieve a media puerta'], ['groove', 'Pliegue hundido a media puerta'], ['rising', 'Pliegue que sube hacia atrás'],
    ['kinetic', 'Pliegues angulosos en Z (estilo Tucson)']],
  hoodLines: [['none', 'Capó liso'], ['two', 'Dos nervios en el capó'], ['four', 'Cuatro nervios en el capó'], ['dome', 'Capó abombado en el centro']],
  rockerLine: [['none', 'Sin línea de estribo'], ['scoop', 'Estribo esculpido que sube hacia la rueda trasera'], ['straight', 'Línea de estribo recta']],
  wheelCover: [['none', 'Sin tapacubos (llanta a la vista)'], ['aero', 'Tapacubos aerodinámico'], ['classic', 'Tapacubos clásico cromado'],
               ['turbine', 'Tapacubos turbina'], ['moon', 'Disco cromado retro'], ['steelie', 'Llanta de chapa con tapa']],
  archTrim: [['none', 'Sin moldura en los pasos de rueda'], ['black', 'Moldura negra (todoterreno)'], ['chrome', 'Filo cromado'],
             ['body', 'Labio del color de la carrocería'], ['carbon', 'Moldura de carbono']],
  sill: [['none', 'Sin embellecedor de bajos'], ['body', 'Faldón del color de la carrocería'], ['black', 'Protección negra'],
         ['chrome', 'Moldura cromada en los bajos'], ['carbon', 'Lama aerodinámica de carbono']],
  midLine: [['none', 'Sin línea media'], ['crease', 'Nervio marcado en la chapa'], ['chrome', 'Moldura cromada'],
            ['black', 'Banda protectora negra'], ['double', 'Doble filo cromado']],
  highLine: [['none', 'Sin línea alta'], ['shoulder', 'Nervio de hombro'], ['chrome', 'Cromado bajo las ventanas'], ['black', 'Moldura negra bajo las ventanas'],
             ['chromeLoop', 'Cromado alrededor de las ventanas (baja por el pilar trasero)']],
};

function buildHeadlights(parent, P){
  const H = CONFIG.headlight;
  const rot = [H.rotX, H.rotY, H.rotZ];

  const depth = 0.20;
  const zOff = -EMBED_DEPTH + depth / 2;
  const zLip = zOff + depth / 2 - 0.004;   // aros y contornos finos, justo en la cara exterior

  const disc  = (r, seg = 32) => new THREE.CylinderGeometry(r, r, depth, seg).rotateX(Math.PI / 2);
  const box   = (w, h, d = depth) => new THREE.BoxGeometry(w, h, d);
  const ring  = (r, tube, arc = Math.PI * 2, start = 0) => new THREE.TorusGeometry(r, tube, 10, 40, arc).rotateZ(start);
  const prism = shape => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false }).translate(0, 0, -depth / 2);
  const poly  = pts => prism(new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))));

  // Piezas de un faro derecho (x hacia fuera): [nombre, geometría, x, y, z?, material?]
  function lampParts(type){
    const grid = (nx, ny, w, h, dx, dy) => {
      const out = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++){
        out.push([`LED_${i}_${j}`, box(w, h), (i - (nx - 1) / 2) * dx, (j - (ny - 1) / 2) * dy]);
      }
      return out;
    };
    switch (type){
      case 'round':      return [['RoundA', disc(0.075), -0.10, 0], ['RoundB', disc(0.055), 0.10, 0]];
      case 'strip':      return [['Strip', box(0.42, 0.025), 0, 0], ['StripDRL', box(0.42, 0.012, depth * 0.7), 0, 0.045]];
      case 'matrix':     return grid(3, 2, 0.055, 0.035, 0.08, 0.05);
      case 'lens':       return [['Lens', disc(0.11), 0, 0]];
      case 'quad':       return [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([i, j], k) => [`Quad_${k}`, disc(0.045, 20), i * 0.06, j * 0.04]);
      case 'hyper':      return [['HyperMain', box(0.34, 0.04), 0, 0], ['HyperDRL', box(0.36, 0.012, depth * 0.5), 0, 0.03]];
      case 'halo':       return [['HaloA', ring(0.055, 0.012), -0.09, 0, zLip], ['HaloB', ring(0.045, 0.010), 0.09, 0, zLip],
                                 ['HaloCoreA', disc(0.035), -0.09, 0], ['HaloCoreB', disc(0.028), 0.09, 0]];
      case 'twin-round': return [['TwinA', disc(0.065), -0.08, 0], ['TwinB', disc(0.065), 0.08, 0],
                                 ['TwinRingA', ring(0.068, 0.009), -0.08, 0, zLip, MAT.chrome], ['TwinRingB', ring(0.068, 0.009), 0.08, 0, zLip, MAT.chrome]];
      case 'oval':       return [['Oval', disc(0.075).scale(1.8, 1, 1), 0, 0]];
      case 'square':     return [['SquareLens', box(0.16, 0.13), 0, 0], ['SquareBezel', box(0.19, 0.16, depth * 0.94), 0, 0, zOff - depth * 0.03, MAT.chrome]];
      case 'pixel':      return grid(6, 3, 0.026, 0.022, 0.036, 0.03);
      case 'split':      return [['SplitDRL', box(0.32, 0.014), 0, 0.08], ['SplitMainA', disc(0.042), -0.07, -0.03], ['SplitMainB', disc(0.042), 0.07, -0.03]];
      case 'eyebrow':    return [['BrowLens', disc(0.06), 0, -0.01], ['Brow', ring(0.10, 0.012, Math.PI * 0.7, Math.PI * 0.15), 0, -0.01, zLip]];
      case 'l-shape':    return [['LSig', poly([[-0.14, 0.06], [0.15, 0.06], [0.15, 0.04], [-0.12, 0.04], [-0.12, -0.07], [-0.14, -0.07]]), 0, 0],
                                 ['LLens', disc(0.045), 0.03, -0.015]];
      case 'c-shape':    return [['CSig', ring(0.08, 0.012, Math.PI * 1.5, Math.PI * 0.25), 0, 0, zLip], ['CLens', disc(0.045), 0, 0]];
      case 'arrow':      return [['Arrow', poly([[-0.16, 0.035], [0.11, 0.035], [0.16, 0], [0.11, -0.035], [-0.16, -0.035], [-0.11, 0]]), 0, 0]];
      case 'triangle':   return [['Triangle', poly([[-0.15, 0.05], [0.15, 0.05], [0.10, -0.06]]), 0, 0]];
      case 'hex':        return [['Hex', disc(0.075, 6), 0, 0]];
      case 'teardrop': {
        const sh = new THREE.Shape();
        sh.moveTo(-0.05, 0.06);
        sh.absarc(-0.05, 0, 0.06, Math.PI / 2, Math.PI * 1.5, false);
        sh.lineTo(0.15, -0.015);
        sh.lineTo(0.15, 0.015);
        sh.lineTo(-0.05, 0.06);
        return [['Teardrop', prism(sh), 0, 0]];
      }
      case 'projector':  return [['ProjLens', disc(0.07), 0, 0], ['ProjRing', ring(0.072, 0.01), 0, 0, zLip, MAT.chrome],
                                 ['ProjCore', disc(0.028, 24).scale(1, 1, 1.08), 0, 0]];
      case 'vertical':   return [0.05, 0, -0.05].map((y, k) => [`Vert_${k}`, box(0.07, 0.035), 0, y]);
      case 'tri-led':    return [-0.09, 0, 0.09].map((x, k) => [`Tri_${k}`, disc(0.032), x, 0]);
      case 'slim':       return [['Slim', box(0.48, 0.012), 0, 0]];
      case 'popup':      return [['PopupPod', box(0.26, 0.11, depth * 1.4), 0, 0.03, zOff + depth * 0.2, MAT.paint],
                                 ['PopupLens', box(0.22, 0.07, depth * 1.4), 0, 0.03, zOff + depth * 0.2 + 0.006]];
      case 'lightbar':   return [['BarEnd', box(0.20, 0.03), 0, 0]];
      // Faros bajos verticales: tres proyectores apilados con anillo y un intermitente a un lado
      case 'hidden':     return [
        ...[0.07, 0, -0.07].flatMap((y, k) => [[`Low_${k}`, disc(0.03, 24), 0.01, y],
          [`LowRing_${k}`, ring(0.033, 0.006), 0.01, y, zLip, MAT.chrome]]),
        ['LowSignal', box(0.016, 0.17, depth * 0.9), 0.06, 0, zOff, MAT.indicator]];
      default:           return [['Block', box(0.24, 0.09), 0, 0], ['BlockDRL', box(0.22, 0.02, depth * 0.6), 0, 0.075]];
    }
  }

  // Firma LED añadida a cualquier tipo de faro (la barra entre faros se construye aparte)
  function drlParts(kind){
    switch (kind){
      case 'line':  return [['DRLLine', box(0.30, 0.010, depth * 0.8), 0, 0.085]];
      case 'under': return [['DRLUnder', box(0.30, 0.010, depth * 0.8), 0, -0.075]];
      case 'L':     return [['DRLTop', box(0.30, 0.010, depth * 0.8), 0, 0.085], ['DRLSide', box(0.010, 0.15, depth * 0.8), -0.15, 0.015]];
      case 'dots':  return [-0.09, -0.03, 0.03, 0.09].map((x, k) => [`DRLDot_${k}`, disc(0.012, 12), x, -0.075]);
      default:      return [];
    }
  }

  // Encaje en la cara del morro: el faro no sobresale por los lados ni por encima, y se apoya sobre
  // la chapa a su altura con la misma inclinación
  const parts = [...lampParts(CORNER_FALLBACK.head[H.type] || H.type), ...drlParts(H.drl)];
  const bb = new THREE.Box3();
  for (const [, geo, x, y] of parts){
    geo.computeBoundingBox();
    bb.union(geo.boundingBox.clone().translate(new THREE.Vector3(x, y, 0)));
  }
  if (H.housing !== 'none') bb.expandByScalar(0.02);
  const outer = P.halfW - 0.06, inner = 0.08;
  const top = P.noseTopY - 0.03, bottom = P.bottomY + 0.06;
  let sx = H.size * H.width, sy = H.size;
  sx *= Math.min(1, (outer - inner) / ((bb.max.x - bb.min.x) * sx));
  sy *= Math.min(1, (top - bottom) / ((bb.max.y - bb.min.y) * sy));
  const xH = THREE.MathUtils.clamp(0.70 * (P.width / 1.92) + H.spacing, inner - bb.min.x * sx, outer - bb.max.x * sx);
  const yH = THREE.MathUtils.clamp(P.bottomY + (P.noseTopY - P.bottomY) * 0.80 + H.offsetY, bottom - bb.min.y * sy, top - bb.max.y * sy);
  const zFace = faceZ(P, yH, 1) + H.offsetZ;
  const tilt = faceTilt(P, yH, 1);

  for (const s of [-1, 1]){
    const grp = new THREE.Group();
    grp.position.set(s * xH, yH, zFace);
    grp.rotation.set(rot[0] + tilt, rot[1], rot[2]);
    grp.scale.set(s * sx, sy, 1);   // escala negativa en x: el faro izquierdo en espejo
    parent.add(grp);

    for (const [name, geo, x, y, z = zOff, mat = MAT.headlight] of parts){
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.name = `Head${name}`;
      grp.add(m);
    }

    // Carcasa ajustada al conjunto de piezas, un poco por detrás para que las luces sobresalgan
    if (H.housing !== 'none'){
      const bb = new THREE.Box3();
      for (const m of grp.children){
        m.updateMatrix();
        m.geometry.computeBoundingBox();
        bb.union(m.geometry.boundingBox.clone().applyMatrix4(m.matrix));
      }
      const size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
      const housing = new THREE.Mesh(box(size.x + 0.04, size.y + 0.04, depth * 0.9), H.housing === 'chrome' ? MAT.chrome : MAT.grilleBase);
      housing.position.set(c.x, c.y, zOff - depth * 0.05 - 0.004);
      housing.name = 'HeadHousing';
      grp.add(housing);
    }
  }

  if (H.type === 'lightbar' || H.drl === 'bar'){
    const bar = new THREE.Mesh(box(2 * xH, 0.014 * sy, depth * 0.8), MAT.headlight);
    bar.position.set(0, yH + (H.type === 'lightbar' ? 0 : 0.06 * sy), zFace + zOff);
    bar.rotation.x = tilt;
    bar.name = 'HeadLightBar';
    parent.add(bar);
  }
}

// Parrilla delantera centrada en (0, y) sobre la cara z
// ---------------------------------------------------------------------------------------------
// PARRILLA: contorno (según el tipo), fondo, dibujo en relieve recortado al contorno y marco.
// Todo es geometría en el plano de la parrilla: x a lo ancho, y hacia arriba y z hacia fuera, con
// la cara del fondo en z = prot. Luego la parrilla entera se dobla con la forma del morro

// Recorta un polígono (convexo o no) con el semiplano (p - P)·n >= 0
function clipHalfPlane(poly, px, py, nx, ny){
  const out = [];
  for (let i = 0; i < poly.length; i++){
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const da = (a[0] - px) * nx + (a[1] - py) * ny, db = (b[0] - px) * nx + (b[1] - py) * ny;
    if (da >= 0) out.push(a);
    if ((da >= 0) !== (db >= 0)){ const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
  }
  return out;
}
// Polígono convexo en sentido antihorario
function ccwPoly(pts){
  let a = 0;
  for (let i = 0; i < pts.length; i++){ const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length]; a += x0 * y1 - x1 * y0; }
  return a < 0 ? pts.slice().reverse() : pts;
}
// El mismo contorno convexo metido hacia dentro una distancia d (cada lado se desplaza y recorta)
function insetConvex(pts, d){
  if (d <= 0) return pts;
  let poly = pts;
  for (let i = 0; i < pts.length && poly.length >= 3; i++){
    const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
    const L = Math.hypot(x1 - x0, y1 - y0);
    if (L < 1e-6) continue;
    const nx = -(y1 - y0) / L, ny = (x1 - x0) / L;
    poly = clipHalfPlane(poly, x0 + nx * d, y0 + ny * d, nx, ny);
  }
  return poly;
}
// Tramo de un segmento dentro de un polígono convexo antihorario, o null
function clipSegment(poly, x0, y0, x1, y1){
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  for (let i = 0; i < poly.length; i++){
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    const nx = -(by - ay), ny = bx - ax;
    const num = (x0 - ax) * nx + (y0 - ay) * ny, den = dx * nx + dy * ny;
    if (Math.abs(den) < 1e-12){ if (num < 0) return null; continue; }
    const t = -num / den;
    if (den > 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t0 >= t1) return null;
  }
  return [x0 + dx * t0, y0 + dy * t0, x0 + dx * t1, y0 + dy * t1];
}
function insideConvex(poly, x, y){
  for (let i = 0; i < poly.length; i++){
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    if ((x - ax) * -(by - ay) + (y - ay) * (bx - ax) < 0) return false;
  }
  return true;
}

// Triángulos sueltos (cada uno con su normal de cara)
function triSoup(){
  const pos = [];
  return {
    tri(a, b, c){ pos.push(...a, ...b, ...c); },
    quad(a, b, c, d){ pos.push(...a, ...b, ...c, ...a, ...c, ...d); },
    get size(){ return pos.length; },
    geometry(){
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.computeVertexNormals();
      return g;
    },
  };
}
// Barra recta de (x0, y0) a (x1, y1): prisma con la sección [u (a lo ancho), z] dada en sentido
// antihorario. Las de arista viva (cresta) brillan como piezas facetadas
function addBar(soup, x0, y0, x1, y1, section){
  const L = Math.hypot(x1 - x0, y1 - y0);
  if (L < 1e-4) return;
  const tx = (x1 - x0) / L, ty = (y1 - y0) / L, nx = -ty, ny = tx;
  const at = (s, [u, z]) => [x0 + tx * L * s + nx * u, y0 + ty * L * s + ny * u, z];
  const m = section.length;
  // En tramos de 2 cm: así se dobla con la forma del morro sin partirla después
  const nSeg = Math.max(1, Math.ceil(L / 0.02));
  for (let q = 0; q < nSeg; q++){
    const s0 = q / nSeg, s1 = (q + 1) / nSeg;
    for (let k = 0; k < m; k++){
      const a = section[k], b = section[(k + 1) % m];
      soup.quad(at(s0, a), at(s0, b), at(s1, b), at(s1, a));
    }
  }
  for (let k = 1; k + 1 < m; k++){
    soup.tri(at(1, section[0]), at(1, section[k]), at(1, section[k + 1]));
    soup.tri(at(0, section[0]), at(0, section[k + 1]), at(0, section[k]));
  }
}
const barSection = (w, z0, h, ridge) => ridge
  ? [[-w / 2, z0], [w / 2, z0], [w / 2, z0 + h * 0.55], [0, z0 + h], [-w / 2, z0 + h * 0.55]]
  : [[-w / 2, z0], [w / 2, z0], [w / 2, z0 + h], [-w / 2, z0 + h]];

// Contorno con un punto cada step como mucho (conserva los vértices y quita los repetidos)
function resamplePoly(poly, step){
  const out = [];
  for (let i = 0; i < poly.length; i++){
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let k = 0; k < n; k++){
      const p = [x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n], q = out[out.length - 1];
      if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 1e-5) out.push(p);
    }
  }
  return out;
}
// Dirección hacia dentro de cada vértice de un polígono convexo antihorario, ya alargada para que
// los lados se desplacen la misma distancia (inglete)
function miterIn(poly){
  const n = poly.length;
  const edgeN = i => { const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % n]; const L = Math.hypot(x1 - x0, y1 - y0) || 1; return [-(y1 - y0) / L, (x1 - x0) / L]; };
  return poly.map((_, i) => {
    const a = edgeN((i + n - 1) % n), b = edgeN(i);
    let mx = a[0] + b[0], my = a[1] + b[1];
    const L = Math.hypot(mx, my) || 1;
    mx /= L; my /= L;
    const k = 1 / Math.max(0.35, mx * b[0] + my * b[1]);
    return [mx * k, my * k];
  });
}
// Marco: perfil [hacia dentro, z] barrido a lo largo del contorno. Las normales son suaves a lo
// ancho del perfil (cantos redondeados) pero cada tramo del contorno lleva la suya: así las
// esquinas vivas (hexágono, escudo) quedan vivas y no hacen destellos
function grilleRing(outer, w, zf, zb, bevel){
  const P = resamplePoly(outer, 0.02), M = miterIn(P), n = P.length;
  const b = Math.min(bevel, w * 0.4);
  const prof = b > 0
    ? [[0, zb], [0, zf - b], [0.29 * b, zf - 0.29 * b], [b, zf], [w - b, zf], [w - 0.29 * b, zf - 0.29 * b], [w, zf - b], [w, zb]]
    : [[0, zb], [0, zf], [w, zf], [w, zb]];
  const m = prof.length;
  // Normal de cada punto del perfil en el plano [hacia dentro, z]: media de sus dos lados
  const edgeN = j => { const dd = prof[j + 1][0] - prof[j][0], dz = prof[j + 1][1] - prof[j][1], L = Math.hypot(dd, dz) || 1; return [-dz / L, dd / L]; };
  const PN = prof.map((_, j) => {
    const a = j > 0 ? edgeN(j - 1) : null, c = j < m - 1 ? edgeN(j) : null;
    const v = b > 0 && a && c ? [a[0] + c[0], a[1] + c[1]] : (c || a);
    const L = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / L, v[1] / L];
  });
  const pos = [], nor = [];
  const vert = (i, j, nx, ny) => {
    const [d, z] = prof[j];
    pos.push(P[i][0] + M[i][0] * d, P[i][1] + M[i][1] * d, z);
    nor.push(nx * PN[j][0], ny * PN[j][0], PN[j][1]);
  };
  for (let i = 0; i < n; i++){
    const i1 = (i + 1) % n;
    const ex = P[i1][0] - P[i][0], ey = P[i1][1] - P[i][1], L = Math.hypot(ex, ey) || 1;
    const nx = -ey / L, ny = ex / L;            // hacia dentro de este tramo
    for (let j = 0; j + 1 < m; j++){
      // Sin suavizar entre los lados del perfil que forman canto vivo (sin bisel)
      vert(i, j, nx, ny); vert(i1, j, nx, ny); vert(i1, j + 1, nx, ny);
      vert(i, j, nx, ny); vert(i1, j + 1, nx, ny); vert(i, j + 1, nx, ny);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (!(b > 0)) geo.computeVertexNormals();     // sin bisel: caras planas
  return geo;
}
// Fondo: la cara de delante de un polígono convexo en filas de step (con UV en metros para la
// textura) y su canto hasta zb
function grilleCap(poly, zf, zb, step){
  const ys = poly.map(p => p[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  let nr = Math.max(2, Math.ceil((y1 - y0) / step));
  if (nr % 2) nr++;
  const span = y => {
    let xl = Infinity, xr = -Infinity;
    for (let i = 0; i < poly.length; i++){
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      if ((ay - y) * (by - y) > 0 || ay === by) continue;
      const x = ax + (bx - ax) * (y - ay) / (by - ay);
      xl = Math.min(xl, x); xr = Math.max(xr, x);
    }
    return xl <= xr ? [xl, xr] : [0, 0];
  };
  const rows = [];
  for (let j = 0; j <= nr; j++){
    const y = y0 + (y1 - y0) * j / nr;
    const [xl, xr] = span(Math.min(y1 - 1e-6, Math.max(y0 + 1e-6, y)));
    const nc = Math.max(1, Math.ceil((xr - xl) / step));
    rows.push(Array.from({ length: nc + 1 }, (_, k) => [xl + (xr - xl) * k / nc, y]));
  }
  const pos = [];
  const tri = (a, b, c) => pos.push(a[0], a[1], zf, b[0], b[1], zf, c[0], c[1], zf);
  for (let j = 0; j < nr; j++){
    const A = rows[j], B = rows[j + 1];
    let i = 0, k = 0;
    while (i < A.length - 1 || k < B.length - 1){
      const tA = (i + 1) / (A.length - 1), tB = (k + 1) / (B.length - 1);
      if (k >= B.length - 1 || (i < A.length - 1 && tA <= tB)){ tri(A[i], A[i + 1], B[k]); i++; }
      else { tri(A[i], B[k + 1], B[k]); k++; }
    }
  }
  // Canto alrededor (se ve si no hay marco)
  const P = resamplePoly(poly, 0.02);
  for (let i = 0; i < P.length; i++){
    const a = P[i], b = P[(i + 1) % P.length];
    pos.push(a[0], a[1], zb, b[0], b[1], zb, b[0], b[1], zf, a[0], a[1], zb, b[0], b[1], zf, a[0], a[1], zf);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv = [];
  for (let i = 0; i < pos.length; i += 3) uv.push(pos[i], pos[i + 1]);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// Opciones de la parrilla además del tipo (que da el contorno)
const GRILLE_AUTO = { slats: 'v-bars', 'bars-h': 'h-bars', honeycomb: 'honeycomb', mesh: 'dots', solid: 'none',
  cross: 'cross', twin: 'v-bars', shield: 'none', hex: 'none', oval: 'h-bars' };
const GRILLE_FINISH_AUTO = { 'h-bars': 'chrome', 'v-bars': 'chrome', diagonal: 'chrome', grid: 'chrome', cross: 'chrome',
  chevron: 'chrome', diamond: 'darkchrome', 'diamond-studs': 'chrome', honeycomb: 'darkchrome', dots: 'darkchrome' };
const grilleFinishMat = f => ({ chrome: MAT.chrome, darkchrome: MAT.darkChrome, black: MAT.glossBlack, body: MAT.paint, alu: MAT.alu }[f] || MAT.chrome);
// Marcos: ancho, material y si lleva los cantos redondeados
const GRILLE_FRAMES = {
  chrome:         { w: 0.018, mat: () => MAT.chrome,     bevel: 0.003 },
  'chrome-thick': { w: 0.040, mat: () => MAT.chrome,     bevel: 0.006 },
  double:         { w: 0.027, mat: () => MAT.chrome,     bevel: 0.002 },
  black:          { w: 0.026, mat: () => MAT.glossBlack, bevel: 0.004 },
  body:           { w: 0.036, mat: () => MAT.paint,      bevel: 0.008 },
  none:           { w: 0.0,   mat: () => null,           bevel: 0 },
};

// Dibujo en relieve dentro del polígono clip (antihorario). z0 = base de las piezas, h = relieve
function grillePattern(soup, kind, clip, S, z0, h){
  const xs = clip.map(p => p[0]), ys = clip.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const R = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) / 2 + 0.05;
  const k = THREE.MathUtils.clamp(S, 0.7, 1.4);
  // Familia de barras paralelas con ángulo a y separación sp; una pasa por el centro
  const family = (a, sp, w, dz = 0, ridge = true) => {
    const tx = Math.cos(a), ty = Math.sin(a), nx = -ty, ny = tx;
    for (let i = -Math.ceil(R / sp); i <= Math.ceil(R / sp); i++){
      const ox = cx + nx * i * sp, oy = cy + ny * i * sp;
      const seg = clipSegment(clip, ox - tx * R, oy - ty * R, ox + tx * R, oy + ty * R);
      if (seg) addBar(soup, ...seg, barSection(w, z0 + dz, h, ridge));
    }
  };
  const D = Math.PI / 180;
  switch (kind){
    case 'h-bars':  family(0, 0.038 * S, 0.012 * k); break;
    case 'v-bars':  family(90 * D, 0.055 * S, 0.014 * k); break;
    case 'diagonal': family(62 * D, 0.045 * S, 0.010 * k); break;
    case 'grid':    family(0, 0.045 * S, 0.008 * k); family(90 * D, 0.045 * S, 0.008 * k, 0.0015); break;
    case 'diamond': family(38 * D, 0.042 * S, 0.008 * k); family(-38 * D, 0.042 * S, 0.008 * k, 0.0015); break;
    case 'cross': {
      const segH = clipSegment(clip, cx - R, cy, cx + R, cy), segV = clipSegment(clip, cx, cy - R, cx, cy + R);
      if (segH) addBar(soup, ...segH, barSection(0.022, z0, h, true));
      if (segV) addBar(soup, ...segV, barSection(0.022, z0 + 0.0015, h, true));
      break;
    }
    case 'chevron': {
      // Uves apiladas: cada una baja desde los lados hasta el centro
      const sp = 0.045 * S, s = 0.42, w = 0.010 * k;
      for (let i = -Math.ceil(R / sp) - 8; i <= Math.ceil(R / sp); i++){
        const yv = cy + i * sp;
        for (const dir of [-1, 1]){
          const seg = clipSegment(clip, cx, yv, cx + dir * R, yv + s * R);
          if (seg) addBar(soup, ...seg, barSection(w, z0 + (dir > 0 ? 0.0015 : 0), h, true));
        }
      }
      break;
    }
    case 'honeycomb': {
      // Paredes de celdas hexagonales (tres por celda bastan para toda la red)
      const a = 0.022 * S, dx = 1.5 * a, dy = Math.sqrt(3) * a, wall = 0.0045;
      for (let i = -Math.ceil(R / dx); i <= Math.ceil(R / dx); i++) for (let j = -Math.ceil(R / dy); j <= Math.ceil(R / dy); j++){
        const hx = cx + i * dx, hy = cy + j * dy + (i & 1 ? dy / 2 : 0);
        for (let e = 0; e < 3; e++){
          const a0 = Math.PI / 3 * e, a1 = Math.PI / 3 * (e + 1);
          const seg = clipSegment(clip, hx + a * Math.cos(a0), hy + a * Math.sin(a0), hx + a * Math.cos(a1), hy + a * Math.sin(a1));
          if (seg) addBar(soup, ...seg, barSection(wall, z0, h, false));
        }
      }
      break;
    }
    case 'diamond-studs': {
      // Pirámides de base rombo en tresbolillo
      const sx = 0.05 * S, sy = 0.032 * S, rx = sx * 0.46, ry = sy * 0.9;
      for (let j = -Math.ceil(R / sy); j <= Math.ceil(R / sy); j++) for (let i = -Math.ceil(R / sx); i <= Math.ceil(R / sx); i++){
        const px = cx + i * sx + (j & 1 ? sx / 2 : 0), py = cy + j * sy;
        const c = [[px + rx, py], [px, py + ry], [px - rx, py], [px, py - ry]];
        if (!c.every(([x, y]) => insideConvex(clip, x, y))) continue;
        const top = [px, py, z0 + h * 1.15];
        for (let q = 0; q < 4; q++) soup.tri([...c[q], z0], [...c[(q + 1) % 4], z0], top);
      }
      break;
    }
    case 'dots': {
      // Malla de tachuelas: troncos de cono de ocho lados
      const sp = 0.03 * S, r = 0.0095 * S, n = 8;
      for (let j = -Math.ceil(R / sp); j <= Math.ceil(R / sp); j++) for (let i = -Math.ceil(R / sp); i <= Math.ceil(R / sp); i++){
        const px = cx + i * sp + (j & 1 ? sp / 2 : 0), py = cy + j * sp * 0.87;
        if (!insideConvex(clip, px - r, py) || !insideConvex(clip, px + r, py) || !insideConvex(clip, px, py - r) || !insideConvex(clip, px, py + r)) continue;
        const ring = (rr, z) => Array.from({ length: n }, (_, q) => [px + rr * Math.cos(2 * Math.PI * q / n), py + rr * Math.sin(2 * Math.PI * q / n), z]);
        const lo = ring(r, z0), hi = ring(r * 0.55, z0 + h * 0.8);
        for (let q = 0; q < n; q++){ const q1 = (q + 1) % n; soup.quad(lo[q], lo[q1], hi[q1], hi[q]); }
        for (let q = 1; q + 1 < n; q++) soup.tri(hi[0], hi[q], hi[q + 1]);
      }
      break;
    }
  }
}

function buildGrille(g, type, gW, gH, y, zFace, prot){
  const G = CONFIG.embeds.grille;
  switch (type){
    case 'none': return;
    case 'parametric': {
      // Pieza de Blender (1.50 x 0.40 de diseño) con sus luces diurnas en los extremos
      if (addPart(g, 'GrilleParametric', 'grille_parametric', [0, y, zFace + prot], { scale: [gW / 1.5, gH / 0.40, 1] })) return;
      type = 'shield';
      break;
    }
    case 'vertical-slots': {
      const n = 6;
      for (let i = 0; i < n; i++){
        embedBox(g, `GrilleSlot_${i}`, [gW / n * 0.5, gH * 0.9, 0], [(i - (n - 1) / 2) * gW / n, y, zFace], [0,0,1], prot, MAT.grilleBase);
      }
      return;
    }
  }

  // Contornos de este tipo (la doble tiene dos), en sentido antihorario
  const ellipse = Array.from({ length: 48 }, (_, i) => [Math.cos(i / 48 * Math.PI * 2) * gW / 2, y + Math.sin(i / 48 * Math.PI * 2) * gH / 2]);
  const outlines = ({
    twin:   [rrPoly(-gW * 0.25, y, gW * 0.46, gH, 0.035), rrPoly(gW * 0.25, y, gW * 0.46, gH, 0.035)],
    shield: [[[-gW / 2, y + gH / 2], [gW / 2, y + gH / 2], [gW * 0.3, y - gH / 2], [-gW * 0.3, y - gH / 2]]],
    hex:    [[[-gW / 2, y], [-gW * 0.38, y + gH / 2], [gW * 0.38, y + gH / 2], [gW / 2, y], [gW * 0.38, y - gH / 2], [-gW * 0.38, y - gH / 2]]],
    oval:   [ellipse],
  }[type] || [rrPoly(0, y, gW, gH, 0.02)]).map(ccwPoly);

  const F = GRILLE_FRAMES[G.frame] || GRILLE_FRAMES.chrome;
  const relief = THREE.MathUtils.clamp(G.relief ?? 0.5, 0, 1);
  const h = 0.004 + 0.016 * relief;                    // altura del dibujo sobre el fondo
  const zFront = zFace + prot + h + 0.004;             // el marco sobresale del dibujo
  const kind = (G.pattern && G.pattern !== 'auto') ? G.pattern : (GRILLE_AUTO[type] || 'none');
  const finish = (G.finish && G.finish !== 'auto') ? G.finish : (GRILLE_FINISH_AUTO[kind] || 'chrome');
  const soup = triSoup();
  // Piezas ya troceadas: al doblarlas con la forma del morro no hace falta partirlas más
  const piece = (name, geo, mat) => { const m = addMesh(g, name, new THREE.Mesh(geo, mat)); m.userData.preTessellated = true; return m; };
  const zb = zFace - 0.03, zBase = zFace + prot;

  outlines.forEach((outer, i) => {
    const tag = outlines.length > 1 ? `_${i}` : '';
    // Fondo hasta media anchura del marco (sin hueco entre los dos)
    piece(`GrilleBase${tag}`, grilleCap(insetConvex(outer, F.w * 0.5), zBase, zb, 0.02), MAT.grilleBase);
    if (G.frame === 'double'){
      piece(`GrilleFrame${tag}`, grilleRing(outer, 0.009, zFront, zb, F.bevel), MAT.chrome);
      piece(`GrilleFrameGap${tag}`, grilleRing(insetConvex(outer, 0.008), 0.010, zBase + 0.002, zb, 0), MAT.glossBlack);
      piece(`GrilleFrameIn${tag}`, grilleRing(insetConvex(outer, 0.017), 0.010, zFront - 0.002, zb, F.bevel), MAT.chrome);
    } else if (F.w > 0){
      piece(`GrilleFrame${tag}`, grilleRing(outer, F.w, zFront, zb, F.bevel), F.mat());
    }
    // El dibujo llega hasta debajo del canto del marco: así no se ven los cortes
    const clip = insetConvex(outer, Math.max(0.004, F.w - 0.002));
    if (kind !== 'none' && clip.length >= 3) grillePattern(soup, kind, clip, THREE.MathUtils.clamp(G.patternScale ?? 1, 0.5, 2), zBase - 0.002, h);
  });
  if (soup.size) piece('GrillePattern', soup.geometry(), grilleFinishMat(finish));
}

// Medidas de la parrilla en la cara del morro: ancho, alto y altura de su centro
function grilleBand(P){
  const b = P.bottomY, ws = P.width / 1.92, G = CONFIG.embeds.grille;
  const gW = Math.min(1.05 * ws * G.width, 2 * (P.halfW - 0.12));
  const gH = Math.min(0.26 * G.height, P.noseTopY - b - 0.10);
  const y = THREE.MathUtils.clamp(b + (P.noseTopY - b) * 0.50 * CONFIG.zones.frontBumper.height + G.offsetY, b + 0.05 + gH / 2, P.noseTopY - 0.03 - gH / 2);
  return { gW, gH, y };
}

function buildFrontDetails(P){
  const g = new THREE.Group();
  g.name = 'FrontDetails';
  const b = P.bottomY;
  const G = CONFIG.embeds.grille;

  // La parrilla cabe en la cara del morro y se apoya en la chapa con su inclinación
  const { gW, gH, y: grilleY } = grilleBand(P);
  const grille = new THREE.Group();
  grille.name = 'Grille';
  // Va 6 mm por delante de la cara del contorno (la chapa crece 2 mm más allá de ella) y, en vez de
  // inclinarse como un plano, se dobla para seguir el perfil del morro: así la chapa curvada no
  // asoma a través de la parrilla
  grille.position.set(0, grilleY, faceZ(P, grilleY, 1) + 0.006);
  g.add(grille);
  buildGrille(grille, G.type, gW, gH, 0, 0, G.protrudeZ);
  conformToFace(grille, P, 1, grilleY, 0.025);

  // Tomas de aire del paragolpes: recortadas en la chapa o, sin recorte, planas sobre ella
  if (P._carved && P._carved.has('intake1')) buildIntakes(g, P, 1);
  else buildIntakesFlat(g, P, 1);

  if (P._carved && P._carved.has('lamp1')) buildCornerLamps(g, P, 1);
  else buildHeadlights(g, P);

  // Moldura bajo la parrilla (sin parrilla, encima de las tomas de aire)
  const T = CONFIG.embeds.grilleTrim;
  const TRIM = { bar: 'trim_bar', smile: 'trim_smile', wing: 'trim_wing', gloss: 'trim_gloss', led: 'trim_led' };
  if (T && TRIM[T.type]){
    const rects = pocketRects(P, 1);
    const half = { bar: 0.008, smile: 0.008, wing: 0.016, gloss: 0.02, led: 0.012 }[T.type];
    let yT = G.type !== 'none' ? grilleY - gH / 2 - half - 0.008
      : rects.length ? Math.max(...rects.map(r => r.y1)) + half + 0.012 : b + (P.noseTopY - b) * 0.42;
    yT = Math.min(yT + (T.offsetY || 0), P.noseTopY - 0.06);
    const wMax = 2 * (P.halfW - 0.12);
    const w = Math.min(wMax, { bar: gW, smile: gW * 1.3, wing: wMax, gloss: gW * 1.05, led: gW * 1.1 }[T.type]);
    conformToFace(addPart(g, 'GrilleTrim', TRIM[T.type], [0, yT, faceZ(P, yT, 1)], { scale: [w, 1, 1] }), P, 1, yT);
  }
  const emblemY = Math.min(b + (P.noseTopY - b) * 0.88, P.noseTopY - 0.05);
  if (G.emblem) embedCylinder(g, 'Star', 0.04, [0, emblemY, faceZ(P, emblemY, 1)], [0,0,1], 0.005, MAT.chrome);
  return g;
}

function buildRearDetails(P){
  const g = new THREE.Group();
  g.name = 'RearDetails';
  const b = P.bottomY;
  const ws = P.width / 1.92;
  const tailY = Math.min(b + (P.tailTopY - b) * 0.80 + CONFIG.taillight.offsetY, P.tailTopY - 0.07);
  const zFaceTail = faceZ(P, tailY, -1) + CONFIG.taillight.offsetZ;
  const tailTilt = faceTilt(P, tailY, -1);
  const protT = CONFIG.embeds.taillight.protrudeZ || 0.01;
  const eType = CONFIG.embeds.exhaust.type;
  const cornerTail = P._carved && P._carved.has('lamp-1');
  const tType = CORNER_FALLBACK.tail[CONFIG.taillight.type] || CONFIG.taillight.type;
  const rot   = [CONFIG.taillight.rotX + tailTilt, CONFIG.taillight.rotY, CONFIG.taillight.rotZ];
  if (cornerTail) buildCornerLamps(g, P, -1);

  // Garras (pieza de Blender) en las esquinas unidas por una barra fina de lado a lado
  if (tType === 'claw' && !cornerTail){
    const sc = THREE.MathUtils.clamp(ws, 0.85, 1.15);
    const xC = P.halfW - 0.24 * sc;
    const zC = faceZ(P, tailY - 0.05, -1) + CONFIG.taillight.offsetZ;
    for (const s of [-1, 1]){
      addPart(g, `TailClaw_${s}`, 'tail_claw', [s * xC, tailY, zC], { rot: [tailTilt, Math.PI, 0], scale: [-s * sc, sc, 1] });
    }
    const yBar = tailY + 0.022 * sc;
    embedBox(g, 'TailBarFull', [2 * (xC - 0.15 * sc), 0.011, 0], [0, yBar, faceZ(P, yBar, -1)], [0, 0, -1], 0.004, MAT.taillight);
  }

  for (const s of cornerTail || tType === 'claw' ? [] : [-1, 1]){
    const grp = new THREE.Group();
    grp.position.set(s * 0.70 * ws, tailY, zFaceTail);
    grp.rotation.set(rot[0], rot[1] + Math.PI, rot[2]);
    g.add(grp);

    const add = (name, geo, x, y, z) => {
      const m = new THREE.Mesh(geo, MAT.taillight);
      m.position.set(x * s, y, z);
      m.name = name;
      grp.add(m);
      return m;
    };

    const depth = 0.20 + protT;
    const zOff = -EMBED_DEPTH + depth / 2;

    switch (tType){
      case 'bar':
        add('Bar', new THREE.BoxGeometry(0.40 * ws, 0.04, depth), 0, 0, zOff);
        break;
      case 'split':
        add('SplitTop', new THREE.BoxGeometry(0.28 * ws, 0.04, depth), 0, 0.04, zOff);
        add('SplitBot', new THREE.BoxGeometry(0.28 * ws, 0.04, depth), 0, -0.04, zOff);
        break;
      case 'round':
        add('Round', new THREE.CylinderGeometry(0.08, 0.08, depth, 24), 0, 0, zOff).rotation.x = Math.PI/2;
        break;
      case 'matrix':
        for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++){
          add(`TMatrix_${i}_${j}`, new THREE.BoxGeometry(0.06, 0.03, depth), -0.08 + i*0.08, -0.025 + j*0.05, zOff);
        }
        break;
      case 'neon':
        add('Neon_Box', new THREE.BoxGeometry(0.32 * ws, 0.06, depth), 0, 0, zOff);
        add('Neon_Glow', new THREE.BoxGeometry(0.34 * ws, 0.02, depth + 0.01), 0, 0, zOff);
        break;
      default:
        add('Block', new THREE.BoxGeometry(0.28 * ws, 0.10, depth), 0, 0, zOff);
    }

    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.30 * ws, 0.02, depth * 0.8), MAT.chrome);
    frame.position.set(0, 0.06, zOff);
    grp.add(frame);
  }

  if (tType !== 'bar' && tType !== 'claw' && !cornerTail) {
    embedBox(g, 'RearChrome', [1.20 * ws, 0.02, 0], [0, tailY, zFaceTail], [0,0,-1], protT * 0.7, MAT.chrome);
  }

  // Salidas de aire traseras
  if (P._carved && P._carved.has('intake-1')) buildIntakes(g, P, -1);
  else buildIntakesFlat(g, P, -1);

  // Escapes (boquillas modeladas en Blender)
  const E = CONFIG.embeds.exhaust;
  const er = 0.05 * E.size, sp = E.spacing;
  // El protector plateado y el faldón con marcos cromados ya llevan sus salidas: no se repiten
  // en el paragolpes. Con otro faldón, las salidas quedan por encima de él
  const RB = CONFIG.accessories.rearBumper, RA = APRON_REAR[RB.type];
  const ownTips = (RB.type === 'skid' || RB.type === 'valance-chrome') && !['side', 'stacks'].includes(eType);
  let exhaustY = b + (P.rearBeltY - b) * 0.16 + E.offsetY;
  if (RA && !ownTips) exhaustY = Math.max(exhaustY, b + 0.012 + RB.offsetY + RA.h + er * 0.9);
  const zFaceExhaust = faceZ(P, exhaustY, -1);
  const pipe = (name, x, r) => addPart(g, name, 'exhaust_round', [x, exhaustY, zFaceExhaust], { rot: [0, Math.PI, 0], scale: [r / 0.05, r / 0.05, 1] });
  switch (ownTips ? 'none' : eType){
    case 'single':
      pipe('Exhaust', -(0.45 * ws + sp), er);
      break;
    case 'dual':
      for (const s of [-1, 1]) pipe(`Exhaust_${s}`, s * (0.45 * ws + sp), er);
      break;
    case 'quad':
      for (const s of [-1, 1]){
        pipe(`Exhaust_${s}_a`, s * (0.42 * ws + sp), er * 0.8);
        pipe(`Exhaust_${s}_b`, s * (0.56 * ws + sp), er * 0.8);
      }
      break;
    case 'center':
      for (const s of [-1, 1]) pipe(`Exhaust_${s}`, s * (0.07 + sp), er * 0.9);
      break;
    case 'twin-side':
      pipe('Exhaust_a', -(0.40 * ws + sp), er * 0.85);
      pipe('Exhaust_b', -(0.54 * ws + sp), er * 0.85);
      break;
    case 'rect':
      for (const s of [-1, 1]){
        addPart(g, `ExhaustRect_${s}`, 'exhaust_rect', [s * (0.45 * ws + sp), exhaustY, zFaceExhaust], { rot: [0, Math.PI, 0], scale: [E.size, E.size, 1] });
      }
      break;
    case 'side':
      // Salida lateral justo delante de la rueda trasera
      for (const s of [-1, 1]){
        const z = P.rearAxleZ + P.wheelR * 1.35 + 0.08 - sp;
        const k = er * 0.8 / 0.05;
        addPart(g, `ExhaustSide_${s}`, 'exhaust_round', [s * (P.halfW - 0.01), b + 0.05 + E.offsetY, z], { rot: [0, s * Math.PI / 2, 0], scale: [k, k, 1] });
      }
      break;
    case 'stacks':
      // Chimeneas verticales detrás del habitáculo
      for (const s of [-1, 1]){
        const x = s * (P.cabinW - 0.06 - sp), z = P.cabinRearZ - 0.14;
        const y0 = P.rearBeltY, y1 = P.roofY + 0.15 + E.offsetY;
        const k = er * 0.9 / 0.05;
        addCyl(g, `ExhaustStack_${s}`, er * 0.9, y1 - y0, [x, (y0 + y1) / 2, z], MAT.chrome);
        addPart(g, `ExhaustStackTip_${s}`, 'exhaust_round', [x, y1, z], { rot: [-Math.PI / 2, 0, 0], scale: [k, k, 1] });
      }
      break;
  }

  // Logotipo y nombre del modelo en la zaga, entre la matrícula y los pilotos
  if (CONFIG.details.badges){
    const yB = b + (P.tailTopY - b) * 0.63;
    if (yB < tailY - 0.05){
      const tiltB = faceTilt(P, yB, -1);
      embedCylinder(g, 'StarRear', 0.032, [0, yB, faceZ(P, yB, -1)], [0, 0, -1], 0.004, MAT.chrome);
      const text = CONFIG.details.badgeText || MODEL_BADGE[CONFIG.model] || 'PCS';
      const wB = Math.min(0.26, 0.2 * ws + 0.04);
      const plate = new THREE.Mesh(new THREE.PlaneGeometry(wB, wB * 96 / 512), badgeMaterial(text));
      const xB = -0.55 * P.halfW;
      plate.position.set(xB, yB, faceZ(P, yB, -1) - 0.004);
      plate.rotation.set(tiltB, Math.PI, 0);
      plate.name = 'ModelBadge';
      g.add(plate);
    }
  }

  return g;
}

// Manillas: pieza de Blender para cada tipo; las barras cambian solo de material
const HANDLE_PARTS = {
  chrome: 'handle_bar', black: 'handle_bar', led: 'handle_bar', flush: 'handle_flush',
  pull: 'handle_pull', popout: 'handle_popout', classic: 'handle_classic',
};

function buildSideDetails(P){
  const g = new THREE.Group();
  g.name = 'SideDetails';

  const cF = P.cabinFrontZ, cR = P.cabinRearZ;
  const xSide = P.halfW + 0.005;
  const Hd = CONFIG.embeds.handle;
  const handlePart = HANDLE_PARTS[Hd.type];
  const handleTrim = { trim: Hd.type === 'black' ? MAT.carbon : Hd.type === 'led' ? MAT.headlight : MAT.chrome };

  // Tapa del depósito en la aleta trasera derecha: sobre el paso de rueda o, si no cabe, detrás
  const fd = CONFIG.details.fuelDoor;
  if (fd !== 'none'){
    const arches = wheelArches(P), span = arches.rear;
    const yTop = Math.min(P.rearBeltY - 0.13, trunkTopY(P, P.rearAxleZ) - 0.13);
    const archTop = span ? span.yMax : P.bottomY + 0.3;
    let z = THREE.MathUtils.clamp(P.rearAxleZ + 0.04, P.zR + 0.45, cR - 0.14), y = (archTop + 0.05 + yTop) / 2;
    if (yTop - archTop < 0.2 && span){ z = span.a0 - 0.12; y = (P.bottomY + yTop) / 2 + 0.05; }
    if (z > P.zR + 0.35 && z < cR - 0.1 && yTop - P.bottomY > 0.3){
      const door = addPart(g, 'FuelDoor', fd === 'round' ? 'fuel_door_round' : 'fuel_door', [sideSurfaceX(P, z) + 0.001, y, z], { rot: [0, Math.PI / 2, 0] });
      if (door) door.userData.rigidShape = true;
    }
  }

  for (const s of [-1, 1]){
    // Escala -1 en x: la pieza del lado derecho sirve en espejo para el izquierdo
    const mz = cF - 0.20;
    const mirror = addPart(g, `Mirror_${s}`, `mirror_${CONFIG.embeds.mirror.type}`, [s * xSide, sillY(P, mz) + 0.04, mz], { scale: [s, 1, 1] });
    if (mirror) mirror.userData.rigidShape = true;   // sigue al hombro sin deformarse
    if (!handlePart) continue;
    for (const [name, z] of [[`HandleF_${s}`, cF - 0.65 + Hd.offsetZ], [`HandleR_${s}`, cR + 0.85 + Hd.offsetZ]]){
      addPart(g, name, handlePart, [s * xSide, sillY(P, z) - 0.12 + Hd.offsetY, z], { scale: [s, 1, 1], materials: handleTrim });
    }
  }

  return g;
}

// Detalles junto a los cristales: rejilla de la base del parabrisas, limpiaparabrisas (y el trasero
// si la luneta es casi vertical) y tercera luz de freno en lo alto de la luneta
function buildGlassDetails(g, P, gw, bow, glassBottomY, glassTopY){
  const D = CONFIG.details;
  const cF = P.cabinFrontZ, cR = P.cabinRearZ, rF = P.roofFrontZ, rR = P.roofRearZ;
  // Punto de un cristal a una distancia d de su primer punto (o del último), con su dirección hacia
  // dentro del cristal y su normal hacia fuera (e = 1 parabrisas, -1 luneta)
  const frame = (path, fromEnd, d, e) => {
    const pts = fromEnd ? [...path].reverse() : path;
    const p0 = pts[0], p1 = pts[1];
    const dir = p1.clone().sub(p0).normalize();
    const n = new THREE.Vector3(0, -dir.z, dir.y);
    if (n.z * e < 0) n.negate();
    return { p: p0.clone().addScaledVector(dir, d), dir, n };
  };
  // Ejes de la pieza: y = normal del cristal, z = a lo largo del cristal
  const orient = (obj, f, lift) => {
    const zA = f.dir.clone(), yA = f.n.clone(), xA = new THREE.Vector3().crossVectors(yA, zA).normalize();
    obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA));
    obj.position.copy(f.p).addScaledVector(f.n, lift);
    obj.userData.rigidShape = true;
  };
  if (D.wipers){
    const cowl = addPart(g, 'Cowl', 'cowl', [0, P.frontBeltY + 0.013, cF + 0.056], { scale: [2 * P.cabinW * 0.97, 1, 1] });
    if (cowl) cowl.userData.rigidShape = true;
    // Dos escobillas en reposo, una algo más alta que la otra
    for (const [x0, len, d] of [[-0.80 * gw, 0.84 * gw, 0.075], [0.02 * gw, 0.80 * gw, 0.045]]){
      const f = frame(bowedPath(x0, glassBottomY(cF), cF, glassTopY(x0, rF), rF, bow, 10), false, d, 1);
      const w = addPart(g, 'Wiper', 'wiper', [0, 0, 0], { scale: [len / 0.96, 1, 1] });
      if (w) orient(w, f, 0.003);
    }
  }
  const rear = bowedPath(0, glassTopY(0, rR), rR, glassBottomY(cR), cR, bow, 10);
  const top = rear[0], bot = rear[rear.length - 1];
  if (D.wipers && Math.abs(top.z - bot.z) < 0.7 * Math.abs(top.y - bot.y)){
    // Luneta casi vertical (portón): limpiaparabrisas trasero en el centro de la parte baja
    const f = frame(rear, true, 0.05, -1);
    const w = addPart(g, 'WiperRear', 'wiper', [0, 0, 0], { scale: [0.42 * gw / 0.96, 1, 1] });
    if (w) orient(w, f, 0.003);
  }
  if (D.chmsl){
    // Por dentro de la luneta, justo debajo del borde del techo
    const f = frame(rear, false, 0.05, -1);
    const l = addPart(g, 'CHMSL', 'chmsl', [0, 0, 0], { scale: [Math.min(1, gw / 0.75), 1, 1] });
    if (l){
      l.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), f.n);
      l.position.copy(f.p).addScaledVector(f.n, -0.022);
      l.userData.rigidShape = true;
    }
  }
}

// Cara exterior de cada paragolpes de Blender, para apoyar la matrícula delante
const BUMPER_FACE = { chrome: 0.09, american: 0.15, offroad: 0.185, step: 0.125 };

// Paragolpes postizo (pieza de Blender, ancho de diseño 1.90). z0 es la cara del coche y dir = +1
// delante, -1 detrás; yb es la altura de la barra e yLow la del bajo (splitter, difusor, protector)
function buildBumper(g, tag, type, W, yb, yLow, z0, dir, P){
  const k = W / 1.9;
  const turn = dir > 0 ? 0 : Math.PI;
  const at = (name, key, y, opts = {}) => addPart(g, `${tag}${name}`, key, [0, y, z0], { rot: [0, turn, 0], scale: [k, 1, 1], ...opts });
  const tilted = a => ({ rot: [-a * dir, turn, 0] });   // el borde exterior sube
  switch (type){
    case 'chrome':   at('Bumper', 'bumper_chrome', yb); break;
    case 'american': at('Bumper', 'bumper_american', yb); break;
    case 'sport':
      at('Splitter', 'splitter', yLow);
      at('Canards', 'canards', yb);
      break;
    case 'diffuser': at('Diffuser', 'diffuser', yLow, tilted(0.15)); break;
    case 'race-diffuser':  at('Diffuser', 'diffuser_race', yLow, { ...tilted(0.12), materials: { light: MAT.taillight } }); break;
    case 'twin-diffuser':  at('Diffuser', 'diffuser_twin', yLow, tilted(0.12)); break;
    case 'blade-diffuser': at('Diffuser', 'diffuser_blade', yLow, tilted(0.12)); break;
    case 'race':
      at('Splitter', 'splitter_race', yLow);
      at('Canards', 'canards_double', yb);
      break;
    case 'offroad':
      at('Bumper', dir > 0 ? 'bumper_offroad_front' : 'bumper_offroad_rear', yb);
      at('SkidPlate', 'skidplate', P.bottomY - 0.01, tilted(0.35));
      if (dir < 0) at('Hitch', 'hitch', yb - 0.05, { scale: [1, 1, 1] });
      break;
    case 'bullbar':  at('Bullbar', 'bullbar', yb); break;
    case 'skid': {
      // Banda plateada sobre la parte baja del paragolpes, apoyada en su cara
      const y = yLow + 0.055;
      addPart(g, `${tag}Skid`, dir > 0 ? 'skid_front' : 'skid_rear', [0, y, faceZ(P, y + 0.04, dir) + dir * 0.004], { rot: [0, turn, 0], scale: [k * 0.98, 1, 1] });
      break;
    }
    case 'rally':
      at('SkidPlate', 'skidplate', P.bottomY - 0.01, tilted(0.30));
      at('RallyLamps', 'rally_lamps', P.noseTopY + 0.06);
      break;
    case 'step':
      at('Bumper', 'bumper_step', yb);
      at('Hitch', 'hitch', yb - 0.06, { scale: [1, 1, 1] });
      break;
    default: {
      // Faldón decorativo: desde el bajo, apoyado en la cara del paragolpes y con su inclinación
      const A = (dir > 0 ? APRON_FRONT : APRON_REAR)[type];
      if (!A) break;
      const yM = yLow + A.h / 2;
      const apron = addPart(g, `${tag}Apron`, A.key, [0, yLow, faceZ(P, yM, dir) + dir * 0.002], { rot: [0, turn, 0], scale: [k, 1, 1] });
      conformToFace(apron, P, dir, yM);
    }
  }
}

function buildSpoiler(g, P, S){
  if (S.type === 'none') return;
  if (S.type === 'roof' || S.type === 'roofwing'){
    const z = P.roofRearZ + S.offsetZ;
    addPart(g, 'SpoilerRoof', S.type === 'roof' ? 'spoiler_roof' : 'spoiler_roofwing', [0, roofSurfaceY(P, 0, z) + CONFIG.glass.roofMetalY + S.offsetY, z], { scale: [P.cabinW * 2.1 * S.width / 1.40, 1, 1] });
    return;
  }
  const key = S.type === 'lemans' ? 'swan' : S.type;
  addPart(g, 'Spoiler', `spoiler_${key}`, [0, P.tailTopY + S.offsetY, P.trunkRearZ + S.offsetZ], { scale: [P.width * S.width / 1.9, 1, 1] });
  if (S.type === 'lemans') buildSharkFin(g, P);
}

// Aleta de tiburón (Le Mans): placa vertical en el eje del coche desde el techo hasta la cola,
// cada vez más alta hacia atrás, siguiendo el techo, la luneta y el maletero
function buildSharkFin(g, P){
  const cR = P.cabinRearZ, rR = P.roofRearZ;
  const z0 = rR + (P.roofFrontZ - rR) * 0.45, z1 = P.trunkRearZ + 0.04;
  const roofTop = z => roofSurfaceY(P, 0, z) + CONFIG.glass.roofMetalY;
  const surf = z => z >= rR ? roofTop(z) : z >= cR ? THREE.MathUtils.lerp(P.rearBeltY, roofTop(rR), (z - cR) / Math.max(0.05, rR - cR)) : trunkTopY(P, z);
  const n = 40, top = [], bottom = [];
  for (let i = 0; i <= n; i++){
    const t = i / n, z = z0 + (z1 - z0) * t;
    bottom.push(new THREE.Vector2(z, surf(z) - 0.01));
    top.push(new THREE.Vector2(z, surf(z) + 0.015 + 0.17 * Math.pow(t, 0.8)));
  }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape([...bottom, ...top.reverse()]), { depth: 0.012, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1 })
    .rotateY(-Math.PI / 2).translate(0.006, 0, 0);
  addMesh(g, 'SharkFin', new THREE.Mesh(geo, MAT.carbon));
}

function buildRoofRack(g, P, type){
  if (type === 'none') return;
  const xr = P.cabinW * 0.78;
  const lift = CONFIG.glass.roofMetalY + 0.05;
  const z0 = P.roofFrontZ - 0.08, z1 = P.roofRearZ + 0.08;
  const at = (x, z) => new THREE.Vector3(x, roofSurfaceY(P, x, z) + lift, z);
  const tube = roundedRectSection(0.035, 0.03, 1);
  for (const s of [-1, 1]){
    const path = [];
    for (let i = 0; i <= 12; i++) path.push(at(s * xr, z0 + (z1 - z0) * i / 12));
    sweepSection(g, `RackRail_${s}`, path, tube, new THREE.Vector3(1, 0, 0), MAT.steel);
    for (const [k, z] of [[0, z0 - 0.03], [1, z1 + 0.03]]){
      const p = at(s * xr, z);
      addBox(g, `RackFoot_${k}_${s}`, [0.04, lift, 0.06], [p.x, p.y - lift / 2, z], MAT.steel);
    }
  }
  if (type === 'rails') return;
  const crossZ = [z0 - 0.25, z1 + 0.25];
  const bar = roundedRectSection(0.05, 0.025, 0.8);
  crossZ.forEach((z, k) => {
    const y = at(0, z).y + 0.012;
    sweepSection(g, `RackCrossbar_${k}`, [new THREE.Vector3(-xr - 0.04, y, z), new THREE.Vector3(xr + 0.04, y, z)], bar, new THREE.Vector3(0, 0, 1), MAT.steel);
  });
  if (type === 'basket'){
    const yB = Math.max(...crossZ.map(z => at(0, z).y)) + 0.04;
    const zA = crossZ[0] + 0.05, zB = crossZ[1] - 0.05, xb = xr - 0.05;
    addBox(g, 'RackBasketFloor', [2 * xb, 0.01, zA - zB], [0, yB, (zA + zB) / 2], MAT.grilleBase);
    const c = [[-xb, zA], [xb, zA], [xb, zB], [-xb, zB]];
    c.forEach(([x, z], k) => {
      const [nx, nz] = c[(k + 1) % 4];
      addTubeBetween(g, `RackBasketRim_${k}`, new THREE.Vector3(x, yB + 0.09, z), new THREE.Vector3(nx, yB + 0.09, nz), 0.012, MAT.steel);
      addTubeBetween(g, `RackBasketPost_${k}`, new THREE.Vector3(x, yB, z), new THREE.Vector3(x, yB + 0.09, z), 0.01, MAT.steel);
    });
  }
}

function buildRoofCargo(g, P, type){
  if (type === 'box'){
    // Apoyado sobre los travesaños (se añaden aunque no haya barras elegidas)
    const zc = (P.roofFrontZ + P.roofRearZ) / 2;
    const len = Math.min(1.0, (P.roofFrontZ - P.roofRearZ + 0.2) / 1.52);
    addPart(g, 'RoofBox', 'roof_box', [0, roofSurfaceY(P, 0, zc) + CONFIG.glass.roofMetalY + 0.09, zc], { scale: [Math.min(1, P.cabinW * 1.5 / 0.80), 1, len] });
  } else if (type === 'lightbar'){
    const z = P.roofFrontZ - 0.10;
    addPart(g, 'RoofLightBar', 'roof_lightbar', [0, roofSurfaceY(P, 0, z) + CONFIG.glass.roofMetalY, z], { scale: [Math.min(1.2, P.cabinW * 1.7), 1, 1] });
  }
}

function buildSideSteps(g, P, type){
  if (type === 'none') return;
  // Entre los pasos de rueda
  const za = P.frontAxleZ - P.wheelR * 1.35, zb = P.rearAxleZ + P.wheelR * 1.35;
  if (za - zb < 0.4) return;
  const y = P.bottomY + 0.01;
  for (const s of [-1, 1]){
    if (type === 'tube'){
      const x = s * (P.halfW + 0.07);
      sweepSection(g, `SideStepTube_${s}`, [new THREE.Vector3(x, y, za), new THREE.Vector3(x, y, zb)],
                   roundedRectSection(0.07, 0.07, 1), new THREE.Vector3(1, 0, 0), MAT.chrome);
      for (const [k, z] of [[0, za - 0.15], [1, zb + 0.15]]) addBox(g, `SideStepBracket_${k}_${s}`, [0.10, 0.03, 0.05], [s * (P.halfW + 0.02), y, z], MAT.steel);
    } else {
      addBox(g, `SideStepBoard_${s}`, [0.20, 0.03, za - zb], [s * (P.halfW + 0.08), y, (za + zb) / 2], MAT.rubber);
      addBox(g, `SideStepEdge_${s}`, [0.02, 0.035, za - zb], [s * (P.halfW + 0.18), y, (za + zb) / 2], MAT.alu);
    }
  }
}

function buildFogLights(g, P, type){
  const def = LOW_LIGHTS[type];
  if (!def) return;
  const b = P.bottomY;
  const y = b + (P.noseTopY - b) * 0.22 * CONFIG.zones.frontBumper.height;
  placeLowLights(g, P, 1, def, y, b + (P.noseTopY - b) * 0.58, 'FogLight');
}

// Luces del paragolpes trasero: un segundo nivel por debajo de los pilotos
function buildRearLights(g, P, type){
  if (type === 'none') return;
  const b = P.bottomY, ws = P.width / 1.92;
  const y = b + (P.tailTopY - b) * 0.29;
  const tailY = Math.min(b + (P.tailTopY - b) * 0.80 + CONFIG.taillight.offsetY, P.tailTopY - 0.07);
  if (type === 'bar'){
    const w = Math.min(1.2 * ws, 2 * (P.halfW - 0.25));
    addPart(g, 'RearLowBar', 'rlow_bar', [0, y, faceZ(P, y, -1)], { rot: [faceTilt(P, y, -1), Math.PI, 0], scale: [w, 1, 1] });
    return;
  }
  const def = REAR_LOW_LIGHTS[type];
  if (def) placeLowLights(g, P, -1, def, y, tailY - 0.09, 'RearLowLight');
}

function buildAntenna(g, P, type){
  if (type === 'shark'){
    const z = P.roofRearZ + 0.18;
    addPart(g, 'AntennaShark', 'antenna_shark', [0, roofSurfaceY(P, 0, z) + CONFIG.glass.roofMetalY * 0.5, z]);
  } else if (type === 'rod'){
    const x = P.halfW * 0.75, z = P.hoodFrontZ - 0.15, y = hoodTopY(P, z);
    addCyl(g, 'AntennaBase', 0.012, 0.03, [x, y + 0.01, z], MAT.chrome);
    addTubeBetween(g, 'AntennaRod', new THREE.Vector3(x, y, z), new THREE.Vector3(x, y + 0.55, z - 0.12), 0.004, MAT.chrome);
  }
}

function buildHoodScoop(g, P, type){
  if (type === 'none') return;
  const z0 = P.cabinFrontZ + 0.15, z1 = P.hoodFrontZ - 0.10;
  if (z1 - z0 < 0.2) return;
  const yAt = z => hoodTopY(P, z);
  const rot = [Math.atan2(yAt(z0) - yAt(z1), z1 - z0), 0, 0];   // sigue la pendiente del capó
  if (type === 'scoop'){
    const zc = z0 + (z1 - z0) * 0.55;
    addPart(g, 'HoodScoop', 'hood_scoop', [0, yAt(zc), zc], { rot });
  } else if (type === 'vents'){
    const z = z0 + (z1 - z0) * 0.45;
    for (const s of [-1, 1]) addPart(g, `HoodVent_${s}`, 'hood_vent', [s * 0.38 * (P.width / 1.92), yAt(z), z], { rot });
  } else if (type === 'bulge'){
    const zm = (z0 + z1) / 2;
    addPart(g, 'HoodBulge', 'hood_bulge', [0, yAt(zm), zm], { rot, scale: [1, 1, (z1 - z0) * 0.85 / 0.9] });
  }
}

function buildSpareWheel(g, P, type){
  if (type === 'none') return;
  const y = P.bottomY + (P.tailTopY - P.bottomY) * 0.55;
  const k = P.wheelR / 0.36;
  addPart(g, 'SpareWheel', 'spare_wheel', [0, y, faceZ(P, y, -1)], { rot: [0, Math.PI, 0], scale: [k, k, k] });
}

function buildSnorkel(g, P, type){
  if (type === 'none') return;
  // Sube por la aleta derecha junto al pilar A hasta la altura del techo
  const z = P.cabinFrontZ + 0.16;
  const y0 = hoodTopY(P, z) - 0.05;
  addPart(g, 'Snorkel', 'snorkel', [P.halfW + 0.04, y0, z], { scale: [1, P.roofY + 0.06 - y0, 1] });
}

function buildFlares(g, P, type){
  if (type === 'none') return;
  // Aletines: perfil de plástico que sigue el borde de cada paso de rueda, un poco por fuera
  const arches = wheelArches(P);
  const section = roundedRectSection(0.09, 0.06, 0.6);
  [arches.front, arches.rear].forEach((span, k) => {
    if (!span) return;
    for (const s of [-1, 1]){
      const path = [];
      for (let i = 0; i <= 24; i++){
        const z = span.a0 + (span.a1 - span.a0) * i / 24;
        const t = (z - span.axleZ) / arches.archR;
        const h = Math.sqrt(Math.max(0, 1 - t * t));
        path.push(new THREE.Vector3(s * (P.halfW + 0.005), P.bottomY + (span.yMax - P.bottomY + 0.035) * h, z));
      }
      sweepSection(g, `FenderFlare_${k}_${s}`, path, section, new THREE.Vector3(1, 0, 0), MAT.plastic);
    }
  });
}

function buildMudFlaps(g, P, type){
  if (type === 'none') return;
  const arches = wheelArches(P);
  const k = THREE.MathUtils.clamp((P.bottomY - 0.06) / 0.32, 0.3, 1.0);   // no llegan al suelo
  [arches.front, arches.rear].forEach((span, i) => {
    if (!span) return;
    const z = Math.max(span.a0 + 0.02, span.axleZ - arches.archR * 0.95);   // detrás de la rueda
    for (const s of [-1, 1]) addPart(g, `MudFlap_${i}_${s}`, 'mud_flap', [s * (P.halfW - 0.17), P.bottomY + 0.01, z], { scale: [1, k, 1] });
  });
}

function buildVisors(g, P, type){
  if (type === 'none') return;
  // Deflector ahumado sobre la ventana delantera, del pilar A al primer pilar vertical
  const { dividers } = windowDividers(P);
  const zEnd = dividers.length ? dividers[0] : P.roofRearZ;
  const section = roundedRectSection(0.012, 0.06, 0.5);
  for (const s of [-1, 1]){
    const x = s * (P.cabinW + 0.04);
    const path = [];
    for (let i = 0; i <= 10; i++){
      const z = P.roofFrontZ - 0.02 + (zEnd - P.roofFrontZ + 0.04) * i / 10;
      path.push(new THREE.Vector3(x, roofSurfaceY(P, x, z) - CONFIG.glass.roofGap - 0.03, z));
    }
    sweepSection(g, `WindowVisor_${s}`, path, section, new THREE.Vector3(1, 0, 0), MAT.roofGlass);
  }
}

function buildPlates(g, P, type){
  if (type === 'none') return;
  const A = CONFIG.accessories, b = P.bottomY;
  // Delante: sobre la barra del paragolpes si la hay; si no, en la cara del morro
  const fb = A.frontBumper;
  if (BUMPER_FACE[fb.type]){
    const y = b + (P.noseTopY - b) * 0.25 + fb.offsetY;
    addPart(g, 'PlateFront', 'license_plate', [0, y, faceZ(P, y, 1) + fb.offsetZ + BUMPER_FACE[fb.type]]);
  } else {
    // Delante de la rejilla inferior y por encima de las aletas de un splitter
    const lowerY = b + (P.noseTopY - b) * 0.22 * CONFIG.zones.frontBumper.height;
    const y = Math.max(lowerY, b + 0.13);
    let z = Math.max(faceZ(P, y, 1), faceZ(P, lowerY, 1) + Math.max(0, CONFIG.embeds.intake.protrudeZ)) + 0.012;
    // Delante del faldón si este llega a la altura de la matrícula
    const FA = APRON_FRONT[fb.type];
    if (FA && b + 0.012 + fb.offsetY + FA.h > y - 0.056) z = Math.max(z, faceZ(P, y, 1) + FA.depth + 0.008);
    addPart(g, 'PlateFront', 'license_plate', [0, y, z], { rot: [faceTilt(P, y, 1), 0, 0] });
  }
  const rb = A.rearBumper;
  if (BUMPER_FACE[rb.type]){
    const y = b + (P.tailTopY - b) * 0.25 + rb.offsetY;
    addPart(g, 'PlateRear', 'license_plate', [0, y, faceZ(P, y, -1) - rb.offsetZ - BUMPER_FACE[rb.type]], { rot: [0, Math.PI, 0] });
  } else {
    // Más baja si la rueda de repuesto ocupa el centro del portón
    const y = b + (P.tailTopY - b) * (A.spareWheel.type === 'none' ? 0.42 : 0.22);
    let z = faceZ(P, y, -1);
    const RA = APRON_REAR[rb.type];
    if (RA && b + 0.012 + rb.offsetY + RA.h > y - 0.056) z = Math.min(z, faceZ(P, y, -1) - RA.depth - 0.008);
    addPart(g, 'PlateRear', 'license_plate', [0, y, z], { rot: [faceTilt(P, y, -1), Math.PI, 0] });
  }
}

// Accesorios exteriores montados sobre la carrocería
function buildAccessories(P){
  const g = new THREE.Group();
  g.name = 'Accessories';
  const A = CONFIG.accessories;
  const b = P.bottomY;

  const fb = A.frontBumper, rb = A.rearBumper;
  const yFB = b + (P.noseTopY - b) * 0.25 + fb.offsetY;
  const yRB = b + (P.tailTopY - b) * 0.25 + rb.offsetY;
  buildBumper(g, 'Front', fb.type, P.width * fb.width, yFB, b + 0.012 + fb.offsetY, faceZ(P, yFB, 1) + fb.offsetZ, 1, P);
  buildBumper(g, 'Rear',  rb.type, P.width * rb.width, yRB, b + 0.012 + rb.offsetY, faceZ(P, yRB, -1) - rb.offsetZ, -1, P);
  buildSpoiler(g, P, A.spoiler);
  // El cofre necesita travesaños aunque no se hayan elegido barras
  const needBars = A.roofCargo.type === 'box' && (A.roofRack.type === 'none' || A.roofRack.type === 'rails');
  buildRoofRack(g, P, needBars ? 'rack' : A.roofRack.type);
  buildRoofCargo(g, P, A.roofCargo.type);
  buildSideSteps(g, P, A.sideSteps.type);
  buildFogLights(g, P, A.fogLights.type);
  buildRearLights(g, P, (A.rearLights || {}).type || 'none');
  buildAntenna(g, P, A.antenna.type);
  buildHoodScoop(g, P, A.hoodScoop.type);
  buildSpareWheel(g, P, A.spareWheel.type);
  buildSnorkel(g, P, A.snorkel.type);
  buildFlares(g, P, A.flares.type);
  buildBodyTrims(g, P);
  buildMudFlaps(g, P, A.mudFlaps.type);
  buildVisors(g, P, A.visors.type);
  buildPlates(g, P, A.plates.type);
  return g;
}

function buildRimFace(parent, faceX, side, R){
  const rimR = R * 0.72;
  const style = CONFIG.rim.style || 'split-5';
  const n = Math.max(3, Math.round(CONFIG.rim.spokes));
  const sW = CONFIG.rim.spokeWidth || 0.06;
  const sD = CONFIG.rim.spokeDepth || 0.025;
  const concavity = CONFIG.rim.concavity || 0.02;

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(rimR * 0.96, rimR * 0.96, 0.14, 48, 1, true),
    MAT.barrel
  );
  barrel.rotation.z = Math.PI / 2;
  barrel.position.x = faceX - side * 0.04;
  parent.add(barrel);

  const lip = new THREE.Mesh(new THREE.TorusGeometry(rimR * 0.96, rimR * 0.036, 12, 48), MAT.rim);
  lip.rotation.y = Math.PI / 2;
  lip.position.x = faceX + side * 0.018;
  parent.add(lip);

  const chromeLip = new THREE.Mesh(new THREE.TorusGeometry(rimR * 0.99, rimR * 0.012, 8, 48), MAT.chrome);
  chromeLip.rotation.y = Math.PI / 2;
  chromeLip.position.x = faceX + side * 0.022;
  parent.add(chromeLip);

  const hubR = rimR * 0.26;
  const hubX = faceX + side * (0.015 - concavity);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(hubR, hubR, 0.035, 32), MAT.rim);
  hub.rotation.z = Math.PI / 2;
  hub.position.x = hubX;
  parent.add(hub);

  const emblem = new THREE.Mesh(new THREE.CylinderGeometry(hubR * 0.44, hubR * 0.44, 0.040, 24), MAT.chrome);
  emblem.rotation.z = Math.PI / 2;
  emblem.position.x = hubX + side * 0.003;
  parent.add(emblem);

  for (let l = 0; l < 5; l++){
    const la = 2 * Math.PI * l / 5;
    const lug = new THREE.Mesh(new THREE.CylinderGeometry(hubR * 0.11, hubR * 0.11, 0.045, 6), MAT.chrome);
    lug.rotation.z = Math.PI / 2;
    lug.position.set(hubX + side * 0.003, hubR * 0.68 * Math.sin(la), hubR * 0.68 * Math.cos(la));
    parent.add(lug);
  }

  const spokeLen = Math.max(0.05, (rimR * 0.94) - hubR);
  const addSpoke = (angle, len, widthMult = 1.0, pitch = 0) => {
    const pivot = new THREE.Object3D();
    pivot.rotation.x = -angle;

    const w = Math.max(0.01, sW * widthMult);
    const m = new THREE.Mesh(new THREE.BoxGeometry(sD, w, len), MAT.rim);
    m.castShadow = true;
    m.rotation.y = side * (concavity * 3.5);
    m.rotation.z = pitch;
    m.position.set(faceX + side * (0.018 - concavity * 0.4), 0, hubR + len * 0.5);
    pivot.add(m);
    parent.add(pivot);
  };

  switch (style){
    case 'turbine':
      for (let i = 0; i < n; i++) addSpoke(2 * Math.PI * i / n, spokeLen, 1.25, 0.42);
      break;
    case 'mesh':
      for (let i = 0; i < n; i++){
        const base = 2 * Math.PI * i / n;
        addSpoke(base - 0.12, spokeLen, 0.65, 0.14);
        addSpoke(base + 0.12, spokeLen, 0.65, -0.14);
        addSpoke(base, spokeLen * 0.65, 0.80, 0);
      }
      break;
    case 'star-5':
      for (let i = 0; i < 5; i++) addSpoke(2 * Math.PI * i / 5, spokeLen, 1.85, 0);
      break;
    case 'blade':
      for (let i = 0; i < n; i++) addSpoke(2 * Math.PI * i / n, spokeLen, 2.3, 0.22);
      break;
    case 'split-5': {
      const pairs = Math.max(2, Math.round(n / 2));
      for (let i = 0; i < pairs; i++){
        const base = 2 * Math.PI * i / pairs;
        addSpoke(base - 0.08, spokeLen, 0.85, 0.04);
        addSpoke(base + 0.08, spokeLen, 0.85, -0.04);
      }
      break;
    }
    default:
      for (let i = 0; i < n; i++) addSpoke(2 * Math.PI * i / n, spokeLen, 1.0, 0);
  }
}

function buildWheel(P, side, z){
  const g = new THREE.Group();
  g.name = 'Wheel';
  g.position.set(side * P.wheelX, P.wheelR, z);

  const R = P.wheelR;
  const W = P.tireW * CONFIG.tire.size;

  // Neumático abierto por el centro: banda de rodadura con dibujo y flancos lisos hasta la llanta
  // (un cilindro cerrado taparía la llanta y los tapacubos)
  const rimR = R * 0.72;
  const lathe = pts => new THREE.LatheGeometry(pts.map(([r, x]) => new THREE.Vector2(r, x)), 64).rotateZ(Math.PI / 2);
  const tire = new THREE.Mesh(lathe([[R * 0.965, -W * 0.47], [R, -W * 0.40], [R, W * 0.40], [R * 0.965, W * 0.47]]), MAT.tire);
  tire.castShadow = tire.receiveShadow = true;
  g.add(tire);
  for (const s of [-1, 1]){
    const wall = [[rimR * 0.985, s * W * 0.43], [R * 0.80, s * W * 0.50], [R * 0.92, s * W * 0.50], [R * 0.965, s * W * 0.47]];
    // El flanco de fuera lleva letras; el de dentro, goma lisa (el giro del torno pasa s a -x)
    const outer = s === -side;
    const wallMat = outer && CONFIG.details.tyreText ? (side > 0 ? MAT.tireTextR : MAT.tireTextL) : MAT.tireWall;
    const sidewall = new THREE.Mesh(lathe(s > 0 ? wall.reverse() : wall), wallMat);
    sidewall.castShadow = sidewall.receiveShadow = true;
    g.add(sidewall);
  }

  for (const s of [-1, 1]){
    const ringOuter = new THREE.Mesh(new THREE.TorusGeometry(R * 0.93, R * 0.012, 8, 48), MAT.tire);
    ringOuter.position.x = s * (W / 2 + 0.002);
    ringOuter.rotation.y = Math.PI / 2;
    ringOuter.castShadow = true;
    g.add(ringOuter);

    const ringInner = new THREE.Mesh(new THREE.TorusGeometry(R * 0.78, R * 0.009, 8, 48), MAT.tire);
    ringInner.position.x = s * (W / 2 + 0.002);
    ringInner.rotation.y = Math.PI / 2;
    ringInner.castShadow = true;
    g.add(ringInner);
  }

  // Disco de freno de Blender (gira con la rueda); la pinza va aparte y no gira
  const kd = R * 0.53 / 0.20;
  const disc = addPart(g, 'BrakeDisc', 'brake_disc_' + CONFIG.brakes.disc, [-side * 0.05, 0, 0], { rot: [0, side * Math.PI / 2, 0], scale: [kd, kd, 1] });
  if (!disc){
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.53, R * 0.53, 0.03, 32), MAT.brake);
    brake.rotation.z = Math.PI / 2;
    brake.position.x = -side * 0.05;
    g.add(brake);
  }

  buildRimFace(g, side * (W / 2 - 0.05), side, R);

  // Tapacubos (piezas de Blender) delante de la llanta; giran con la rueda
  const cover = CONFIG.accessories.wheelCover.type;
  if (cover !== 'none'){
    const k = R * 0.72 * 0.99 / 0.20;
    addPart(g, 'WheelCover', 'hubcap_' + cover, [side * (W / 2 - 0.03), 0, 0], { rot: [0, side * Math.PI / 2, 0], scale: [k, k, k * 0.8] });
  }

  const light = new THREE.PointLight(0xfff4e0, 0.5, 1.5, 2);
  light.position.set(side * (W / 2), R * 0.5, 0);
  g.add(light);

  // Pinza de freno fija (no gira con la rueda), arriba y hacia el centro del coche
  const fixed = new THREE.Group();
  fixed.name = 'BrakeCaliper';
  fixed.position.copy(g.position);
  const holder = new THREE.Group();
  holder.rotation.x = z > 0 ? -0.55 : 0.55;
  fixed.add(holder);
  const kc = R * 0.53 / 0.20;
  const cal = addPart(holder, 'Caliper', CONFIG.brakes.disc === 'plain' ? 'caliper_classic' : 'caliper_sport', [-side * 0.05, 0, 0], { rot: [0, side * Math.PI / 2, 0], scale: [kc, kc, 1] });
  if (!cal){
    const caliper = new THREE.Mesh(new THREE.BoxGeometry(0.02, R * 0.40, R * 0.21), MAT.caliper);
    caliper.position.set(-side * 0.05, R * 0.27, 0);
    holder.add(caliper);
  }
  g.userData.fixed = fixed;
  return g;
}

// Cada rueda cuelga de un buje con nombre (Wheel_FL, Wheel_FR...): el buje gira para la dirección
// y lleva la pinza; dentro, WheelSpin_* es lo que rueda. Así las animaciones del GLB pueden mover
// cada cosa por separado. x > 0 es el lado izquierdo del conductor (el coche mira hacia +z)
function buildWheels(P){
  const group = new THREE.Group();
  group.name = 'Wheels';
  const list = [];
  for (const sx of [-1, 1]){
    for (const z of [P.frontAxleZ, P.rearAxleZ]){
      const tag = (z === P.frontAxleZ ? 'F' : 'R') + (sx > 0 ? 'L' : 'R');
      const w = buildWheel(P, sx, z);
      const hub = new THREE.Group();
      hub.name = 'Wheel_' + tag;
      hub.position.copy(w.position);
      w.position.set(0, 0, 0);
      w.name = 'WheelSpin_' + tag;
      hub.add(w);
      const fixed = w.userData.fixed;
      if (fixed){
        fixed.position.set(0, 0, 0);
        fixed.name = 'BrakeCaliper_' + tag;
        hub.add(fixed);
      }
      group.add(hub);
      list.push(w);
    }
  }
  return { group, wheels: list };
}


function deepMerge(target, src){
  for (const [k, v] of Object.entries(src)){
    if (v && typeof v === 'object' && !Array.isArray(v) && target[k] && typeof target[k] === 'object') deepMerge(target[k], v);
    else target[k] = v;
  }
  return target;
}

// Configuración completa de un coche prediseñado: valores de fábrica más los del preset
function presetConfig(presetKey){
  const p = FIVE_CARS[presetKey];
  const cfg = deepMerge(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(JSON.stringify(p.config)));
  cfg.model = p.model;
  return cfg;
}


function applyPresetGlass(model, presetKey){
  const p = PRESETS[model];
  CONFIG.glass.frontZ     = p.cabinFrontZ;
  CONFIG.glass.rearZ      = p.cabinRearZ;
  CONFIG.glass.roofFrontZ = p.roofFrontZ;
  CONFIG.glass.roofRearZ  = p.roofRearZ;
  // Un coche prediseñado puede mover la base del parabrisas y de la luneta respecto a su modelo
  const g = presetKey && FIVE_CARS[presetKey] && FIVE_CARS[presetKey].config.glass;
  if (g){
    if (g.frontShift) CONFIG.glass.frontZ += g.frontShift;
    if (g.rearShift)  CONFIG.glass.rearZ  += g.rearShift;
  }
}


const REALISM = {
  headroom: 1.15,          // m libres entre el suelo del habitáculo y el techo
  cabinSpan: [1.85, 3.60], // m de habitáculo: desde dos plazas hasta una limusina
  minHood: 0.15,           // m mínimos de capó y de maletero
  tyreClear: 0.10,         // m entre el neumático y el extremo de la carrocería
  archClear: 0.04,         // m mínimos de chapa (capó/maletero) por encima del neumático
};

function isPlausibleCar(){
  const P = derive(PRESETS[CONFIG.model]);
  const cabinSpan = P.cabinFrontZ - P.cabinRearZ;
  return P.roofY - (P.bottomY + 0.04) >= REALISM.headroom
    && cabinSpan >= REALISM.cabinSpan[0] && cabinSpan <= REALISM.cabinSpan[1]
    && P.hoodFrontZ - P.cabinFrontZ >= REALISM.minHood
    && P.cabinRearZ - P.trunkRearZ >= REALISM.minHood
    && P.frontAxleZ + P.wheelR <= P.zF - REALISM.tyreClear
    && P.rearAxleZ - P.wheelR >= P.zR + REALISM.tyreClear
    && wheelsCovered(P);
}

// El neumático no debe asomar por encima del capó ni del maletero
function wheelsCovered(P){
  const R = P.wheelR, top = 2 * R + REALISM.archClear;
  for (let i = 0; i <= 12; i++){
    const dz = R * (-0.6 + 1.2 * i / 12);
    if (hoodTopY(P, P.frontAxleZ + dz) < top || trunkTopY(P, P.rearAxleZ + dz) < top) return false;
  }
  return true;
}

function randomize(){
  const rnd = (a, b) => a + Math.random() * (b - a);
  const models = Object.keys(PRESETS);

  const kept = lockSnapshot();
  // Parte de una postura, unos pilares y un techo de calle (deshace lo que haya dejado un diseño
  // estrambótico)
  CONFIG.smoothing = rnd(0.25, 0.6);
  CONFIG.pillars = JSON.parse(JSON.stringify(DEFAULTS.pillars));
  CONFIG.pillars.rear = ['bar', 'bar', 'panel', 'panelRoof', 'kink'][Math.floor(Math.random() * 5)];
  CONFIG.pillars.rearWidth = rnd(0.28, 0.52);
  Object.assign(CONFIG.glass, { roofCurve: rnd(0.0, 0.12), roofYOffset: 0, roofZOffset: 0, roofSpan: rnd(0.84, 1.0), roofGap: DEFAULTS.glass.roofGap, opacity: DEFAULTS.glass.opacity });
  CONFIG.shape = { corner: rnd(0.12, 0.34), cornerRear: rnd(0.10, 0.32), shoulder: rnd(0.035, 0.10), bow: rnd(0.03, 0.10), tumblehome: rnd(0.02, 0.08) };
  {
    const pick = list => list[Math.floor(Math.random() * list.length)];
    CONFIG.bodyLines = { belt: pick(['sharp', 'sharp', 'step', 'none']), crease: pick(['none', 'none', 'ridge', 'groove', 'rising']),
      hood: pick(['two', 'two', 'four', 'dome', 'none']), rocker: pick(['scoop', 'scoop', 'straight', 'none']), depth: rnd(0.7, 1.3) };
    CONFIG.brakes = { disc: pick(['drilled', 'slotted', 'plain', 'plain']), caliper: pick(['red', 'black', 'silver', 'silver', 'blue', 'yellow']) };
    CONFIG.details = { ...DEFAULTS.details, fuelDoor: pick(['square', 'square', 'round']) };
    // Carrocería por secciones de coche de calle: secciones suaves, aletas y cintura discretas
    CONFIG.body = { ...BODY_DEFAULT, ...CONFIG.body, build: 'sections',
      section: pick(['flat', 'flat', 'barrel', 'barrel', 'tuck', 'tuck', 'round', 'crease', 'pontoon', 'wedge']),
      depth: rnd(0.4, 1.0), flare: Math.random() < 0.5 ? rnd(0.01, 0.04) : 0, waist: Math.random() < 0.4 ? rnd(0.01, 0.03) : 0,
      taper: rnd(0, 0.08), stations: 120 };
  }

  // Se repite el muestreo hasta que las proporciones cumplan REALISM
  for (let attempt = 0; attempt < 300; attempt++){
    CONFIG.model = models[Math.floor(Math.random() * models.length)];
    lockRestore(kept, ['model']);
    CONFIG.stance = { width: rnd(0.97, 1.04), rideHeight: CONFIG.model === 'suv' ? rnd(0, 0.06) : rnd(-0.02, 0.02), rake: 0 };
    const base = PRESETS[CONFIG.model];
    // Altura mínima del habitáculo para que quepa un adulto sentado con holgura
    const minCabinH = (REALISM.headroom + base.bottomY + 0.04) / base.roofY;

    CONFIG.frontAxleOffset = rnd(-0.10, 0.10);
    CONFIG.rearAxleOffset  = rnd(-0.10, 0.10);
    CONFIG.wheelRadius     = rnd(0.97, 1.03);
    CONFIG.wheelSpacer     = DEFAULTS.wheelSpacer;
    CONFIG.zones = {
      frontBumper: { ...DEFAULTS.zones.frontBumper, height: rnd(0.8, 1.0), curve: rnd(0.3, 0.6), length: rnd(0.9, 1.2) },
      hood:        { ...DEFAULTS.zones.hood, length: rnd(0.95, 1.05), overhang: rnd(0.75, 0.95), noseHeight: rnd(0.85, 1.0), curve: rnd(-0.05, 0.05) },
      cabin:       { height: rnd(minCabinH + 0.02, Math.min(minCabinH + 0.15, 1.2)), length: rnd(0.95, 1.05) },
      trunk:       { ...DEFAULTS.zones.trunk, length: rnd(0.9, 1.05), overhang: rnd(0.85, 1.1), tailHeight: rnd(0.85, 1.0), curve: rnd(-0.05, 0.05) },
      rearBumper:  { ...DEFAULTS.zones.rearBumper, height: rnd(0.8, 1.0), curve: rnd(0.3, 0.6), length: rnd(0.9, 1.2) },
    };
    applyPresetGlass(CONFIG.model);
    lockRestore(kept);
    if (isPlausibleCar()) break;
  }

  if (!isPlausibleCar()){
    // Ningún intento cumplió los límites: vuelve al sedán de fábrica
    CONFIG.model = 'sedan';
    lockRestore(kept, ['model']);
    CONFIG.frontAxleOffset = 0;
    CONFIG.rearAxleOffset = 0;
    CONFIG.wheelRadius = DEFAULTS.wheelRadius;
    CONFIG.zones = JSON.parse(JSON.stringify(DEFAULTS.zones));
    applyPresetGlass(CONFIG.model);
    lockRestore(kept);
  }

  const c = new THREE.Color().setHSL(Math.random(), 0.6, 0.4);
  CONFIG.paint.color = '#' + c.getHexString();

  if (Math.random() > 0.4){
    const rC = new THREE.Color().setHSL(Math.random(), 0.5, 0.2);
    CONFIG.roofPaint.color = '#' + rC.getHexString();
    CONFIG.roofPaint.syncBodyColor = false;
  } else {
    CONFIG.roofPaint.syncBodyColor = true;
    CONFIG.roofPaint.color = CONFIG.paint.color;
  }

  // Detalles y accesorios: variedad de faros y piezas, con accesorios coherentes con la carrocería
  const pick = (list, only) => {
    const l = only ? list.filter(([v]) => only.includes(v)) : list;
    return l[Math.floor(Math.random() * l.length)][0];
  };
  const chance = p => Math.random() < p;
  const offroad = CONFIG.model === 'suv';
  Object.assign(CONFIG.headlight, {
    type: pick(OPTIONS.headlight),
    drl: chance(0.5) ? 'none' : pick(OPTIONS.drl),
    housing: pick(OPTIONS.housing),
    size: rnd(0.9, 1.15), width: rnd(0.9, 1.2), spacing: 0,
  });
  // Techo: completo de chapa o con cristal panorámico de tamaño variable
  CONFIG.glass.roofType = chance(0.4) ? 'solid' : 'panoramic';
  if (CONFIG.glass.roofType === 'panoramic'){
    CONFIG.glass.roofMetalX = rnd(0.05, 0.45);
    CONFIG.glass.roofMetalZ = rnd(0.05, 0.45);
  }
  const paintType = pick(OPTIONS.paintReal);
  Object.assign(CONFIG.paint, { type: paintType, ...pickPaint(paintType) });
  CONFIG.taillight.type      = pick(OPTIONS.taillight);
  CONFIG.embeds.intake.type  = pick(OPTIONS.intake);
  CONFIG.embeds.rearVent.type = chance(0.25) ? pick(OPTIONS.rearVent, ['corner', 'slots', 'vertical', 'triangle']) : 'none';
  CONFIG.embeds.grilleTrim = { type: chance(0.4) ? pick(OPTIONS.grilleTrim, ['bar', 'smile', 'wing', 'gloss', 'led']) : 'none', offsetY: 0 };
  CONFIG.embeds.grille.type  = pick(OPTIONS.grille);
  Object.assign(CONFIG.embeds.grille, {
    pattern: chance(0.45) ? 'auto' : pick(OPTIONS.grillePattern, ['h-bars', 'v-bars', 'diagonal', 'grid', 'diamond', 'diamond-studs', 'honeycomb', 'dots', 'chevron']),
    frame: pick(OPTIONS.grilleFrame, ['chrome', 'chrome', 'chrome-thick', 'double', 'black', 'body', 'none']),
    finish: chance(0.6) ? 'auto' : pick(OPTIONS.grilleFinish, ['chrome', 'darkchrome', 'black', 'body', 'alu']),
    relief: rnd(0.25, 0.85), patternScale: rnd(0.8, 1.3),
  });
  CONFIG.embeds.exhaust.type = pick(OPTIONS.exhaust, ['none', 'single', 'dual', 'quad', 'center', 'twin-side', 'rect']);
  CONFIG.embeds.handle.type  = pick(OPTIONS.handle, ['chrome', 'black', 'flush', 'pull', 'popout', 'classic']);
  CONFIG.embeds.mirror.type  = pick(OPTIONS.mirror);

  const acc = JSON.parse(JSON.stringify(DEFAULTS.accessories));
  if (chance(0.45)) acc.frontBumper.type = pick(OPTIONS.frontBumper, offroad ? ['offroad', 'bullbar', 'rally', 'guard-black', 'guard-black', 'apron-black']
    : ['chrome', 'american', 'sport', 'lip-alu', 'apron-black', 'wing-chrome', 'splitter-gloss']);
  if (chance(0.45)) acc.rearBumper.type  = pick(OPTIONS.rearBumper, offroad ? ['offroad', 'step', 'guard-black', 'guard-black', 'apron-black']
    : ['chrome', 'american', 'diffuser', 'apron-black', 'chrome-strip', 'valance-chrome', 'lip-alu']);
  if (!offroad && chance(0.3)) acc.spoiler.type = pick(OPTIONS.spoiler, ['lip', 'ducktail', 'wing', 'roof', 'whale', 'active']);
  if (chance(offroad ? 0.6 : 0.15)) acc.roofRack.type = pick(OPTIONS.roofRack, ['rails', 'rack', 'basket']);
  if (offroad && chance(0.4)) acc.sideSteps.type = pick(OPTIONS.sideSteps, ['tube', 'board']);
  if (chance(0.4)) acc.fogLights.type = pick(OPTIONS.fogLights, ['round', 'strip', 'cube', 'vertical', 'triangle', 'cluster']);
  if (chance(0.35)) acc.rearLights.type = pick(OPTIONS.rearLights, ['reflector', 'vertical', 'round', 'cluster', 'bar']);
  if (chance(0.5)) acc.antenna.type = pick(OPTIONS.antenna, ['shark', 'rod']);
  if (!offroad && chance(0.15)) acc.hoodScoop.type = pick(OPTIONS.hoodScoop, ['scoop', 'vents', 'bulge']);
  if (chance(0.15)) acc.roofCargo.type = pick(OPTIONS.roofCargo, ['box', 'lightbar']);
  if (offroad && chance(0.35)) acc.spareWheel.type = 'rear';
  if (offroad && chance(0.3)) acc.snorkel.type = 'right';
  if (offroad && chance(0.5)) acc.flares.type = 'flares';
  if (offroad && chance(0.4)) acc.mudFlaps.type = 'flaps';
  if (chance(0.2)) acc.visors.type = 'visors';
  if (chance(0.15)) acc.wheelCover.type = pick(OPTIONS.wheelCover, ['aero', 'classic', 'turbine', 'moon', 'steelie']);
  if (chance(offroad ? 0.5 : 0.15)) acc.archTrim.type = offroad ? 'black' : pick(OPTIONS.archTrim, ['chrome', 'body', 'carbon']);
  if (chance(0.3)) acc.sill.type = pick(OPTIONS.sill, offroad ? ['black', 'chrome'] : ['body', 'chrome', 'carbon']);
  if (chance(0.3)) acc.midLine.type = pick(OPTIONS.midLine, ['crease', 'chrome', 'black', 'double']);
  if (chance(0.35)) acc.highLine.type = pick(OPTIONS.highLine, ['shoulder', 'chrome', 'black']);
  CONFIG.accessories = acc;
  lockRestore(kept);

  updateMaterials();
  syncUI();
  markDirty();
}

// Propiedades de pintura de un tipo (metalizado, perla, mate...)
function pickPaint(type){
  const p = PAINT_TYPES[type] || PAINT_TYPES.metallic;
  return { metalness: p.metalness, roughness: p.roughness, clearcoat: p.clearcoat, clearcoatRoughness: p.clearcoatRoughness };
}


let materialesIniciados = false;
function asegurarMateriales() {
  if (materialesIniciados) return;
  createMaterials();
  materialesIniciados = true;
}

function armarYClonarCoche(nombreGrupo, modeloId, extraInfo = {}) {
  const P = derive(PRESETS[CONFIG.model]);
  const grupo = new THREE.Group();
  grupo.name = nombreGrupo;

  const parts = [
    buildBody(P),
    buildCabin(P),
    buildFrontDetails(P),
    buildRearDetails(P),
    buildSideDetails(P),
    buildAccessories(P)
  ];
  const interior = buildInterior(P);
  applyShapeField([...parts, interior], P);
  for (const part of parts) {
    part.rotation.x = CONFIG.stance.rake || 0;
    grupo.add(part);
  }
  grupo.add(interior);

  const wg = buildWheels(P);
  grupo.add(wg.group);

  // Clonar materiales propios para que cada coche conserve sus colores/acabados
  const matClonados = new Map();
  grupo.traverse(o => {
    if (o.isMesh && o.material) {
      if (Array.isArray(o.material)) {
        o.material = o.material.map(m => {
          if (!matClonados.has(m)) matClonados.set(m, m.clone());
          return matClonados.get(m);
        });
      } else {
        if (!matClonados.has(o.material)) matClonados.set(o.material, o.material.clone());
        o.material = matClonados.get(o.material);
      }
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });

  return {
    grupo,
    P,
    modelo: modeloId,
    etiquetaModelo: PRESETS[modeloId]?.label || modeloId,
    colorPintura: CONFIG.paint.color,
    tipoPintura: CONFIG.paint.type,
    taillightMat: matClonados.get(MAT.taillight) || null,
    ...extraInfo
  };
}

export { PRESETS, FIVE_CARS };

/** Construye un coche usando exactamente el generador "Aleatorio realista" de Hacer-coches-. */
export function construirCocheAleatorioRealista() {
  asegurarMateriales();
  const originalConfig = JSON.parse(JSON.stringify(CONFIG));
  try {
    randomize();
    updateMaterials();
    return armarYClonarCoche('HacerCoches_AleatorioRealista', CONFIG.model);
  } finally {
    for (const k of Object.keys(originalConfig)) {
      CONFIG[k] = originalConfig[k];
    }
  }
}

/** Construye uno de los 6 coches prediseñados de FIVE_CARS en Hacer-coches-. */
export function construirCocheHacerCoches(presetKey) {
  const p = FIVE_CARS[presetKey];
  if (!p) throw new Error('Preset desconocido de Hacer-coches-: ' + presetKey);

  asegurarMateriales();
  const originalConfig = JSON.parse(JSON.stringify(CONFIG));
  try {
    Object.assign(CONFIG, presetConfig(presetKey));
    applyPresetGlass(p.model, presetKey);
    updateMaterials();
    return armarYClonarCoche('HacerCoches_' + presetKey, CONFIG.model, { preset: p });
  } finally {
    for (const k of Object.keys(originalConfig)) {
      CONFIG[k] = originalConfig[k];
    }
  }
}
