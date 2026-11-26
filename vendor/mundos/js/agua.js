// Agua: riachuelos, mar y lagos. Lo que la hace parecer agua y no una lámina:
//   - refleja el cielo (mapa de entorno sacado del propio cielo, con Fresnel: más reflejo cuanto más rasante se mira)
//   - color según la hondura: clara y transparente en la orilla, oscura en el centro (atributo aProf por vértice)
//   - espuma en la orilla y ondas de dos capas de normales que se mueven a distinta velocidad (y río abajo)
//   - brillos del sol (rugosidad muy baja)
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

const E = window.Escenario;
let normales = null;
function texNormales() {
  if (!normales) {
    normales = new THREE.TextureLoader().load((globalThis.MUNDOS_ASSETS || 'https://narcimarquez-eng.github.io/Mundos-/') + 'assets/agua/waternormals.jpg');
    normales.wrapS = normales.wrapT = THREE.RepeatWrapping;
  }
  return normales;
}

const MAPA_N = THREE.ShaderChunk.normal_fragment_maps.replace(
  'vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
  `vec3 n1 = texture2D( normalMap, vNormalMapUv + uFlujo * uTiempoAgua * 0.11 ).xyz * 2.0 - 1.0;
   vec3 n2 = texture2D( normalMap, vNormalMapUv * 2.7 + vec2(0.37, 0.11) + uFlujo.yx * uTiempoAgua * 0.05 + uFlujo * uTiempoAgua * 0.21 ).xyz * 2.0 - 1.0;
   vec3 mapN = normalize( vec3( n1.xy + n2.xy * 0.6, n1.z * n2.z ) );`);

// opts: { colorSomero, colorHondo, flujo: [x, y] (dirección de las ondas en uv; los ríos, río abajo) }
export function materialAgua(opts) {
  opts = opts || {};
  const m = new THREE.MeshStandardMaterial({
    color: '#ffffff', roughness: 0.04, metalness: 0.0, transparent: true, depthWrite: false,
    normalMap: texNormales(), normalScale: new THREE.Vector2(0.4, 0.4), envMapIntensity: 0.32
  });
  const u = {
    uTiempoAgua: opts.tiempo || { value: 0 },
    uFlujo: { value: new THREE.Vector2(...(opts.flujo || [0.6, -0.8])) },
    uSomero: { value: new THREE.Color(opts.colorSomero || '#6fa7a0') },
    uHondo: { value: new THREE.Color(opts.colorHondo || '#123c4a') },
    uHondura: { value: opts.hondura || 2.0 } // metros a partir de los cuales el agua ya es «honda»
  };
  m.userData.u = u;
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = 'attribute float aProf;\nvarying float vProf;\nvarying vec3 vPosAgua;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vProf = aProf;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n vPosAgua = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = `uniform float uTiempoAgua; uniform vec2 uFlujo; uniform vec3 uSomero; uniform vec3 uHondo; uniform float uHondura;
      varying float vProf; varying vec3 vPosAgua;
      float ruidoAgua(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
        float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453), b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
        float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453), d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
    ` + sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float h = max(vProf, 0.0);
          float fondo = smoothstep(0.0, uHondura, h);
          diffuseColor.rgb = mix(uSomero, uHondo, fondo);
          diffuseColor.a = mix(0.45, 0.93, smoothstep(0.0, uHondura * 0.5, h));
          // espuma solo en el filo de la orilla, a manchas que se mueven con el agua
          float r = ruidoAgua(vPosAgua.xz * 1.6 + uFlujo * uTiempoAgua * 0.6);
          float esp = (1.0 - smoothstep(0.0, 0.06 + r * 0.06, h)) * smoothstep(0.55, 0.85, r);
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.9), esp * 0.6);
          diffuseColor.a = max(diffuseColor.a, esp * 0.7);
          diffuseColor.a *= smoothstep(-0.3, 0.02, vProf); // donde la malla queda fuera del agua (hondura negativa), desaparece
        }`)
      .replace('#include <normal_fragment_maps>', MAPA_N);
  };
  m.customProgramCacheKey = () => 'agua-v3';
  return m;
}

// Atributo aProf (hondura en m) para una geometría de agua ya colocada: nivel del agua − terreno, por vértice.
// aMundo(x, z) convierte las coordenadas del vértice al mundo (por defecto, las mismas).
export function ponerHondura(geo, esc, nivel, aMundo) {
  const p = geo.attributes.position, prof = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const w = aMundo ? aMundo(p.getX(i), p.getZ(i)) : { x: p.getX(i), z: p.getZ(i) };
    const n = typeof nivel === 'function' ? nivel(i) : nivel;
    prof[i] = E.dentro(esc, w.x, w.z) ? n - E.alturaEn(esc, w.x, w.z) : 30;
  }
  geo.setAttribute('aProf', new THREE.BufferAttribute(prof, 1));
  return geo;
}

// Reflejo del cielo: una copia del cielo convertida en mapa de entorno (se rehace al cambiar la hora)
export class EntornoAgua {
  constructor(renderer) {
    this.r = renderer;
    this.pmrem = new THREE.PMREMGenerator(renderer);
    this.escena = new THREE.Scene();
    this.cielo = new Sky(); this.cielo.scale.setScalar(50);
    this.escena.add(this.cielo);
    this.textura = null;
    this.ultima = null;
  }
  // cieloEscena: el Sky de la escena (se copian sus valores); fondo: color si es de noche
  actualizar(cieloEscena, fondo, forzar) {
    const u = this.cielo.material.uniforms, v = cieloEscena.material.uniforms;
    const firma = v.sunPosition.value.toArray().map(x => x.toFixed(2)).join() + (cieloEscena.visible ? 1 : 0);
    if (!forzar && firma === this.ultima) return this.textura;
    this.ultima = firma;
    for (const k of Object.keys(u)) if (v[k] && v[k].value != null) { if (v[k].value.copy) u[k].value.copy(v[k].value); else u[k].value = v[k].value; }
    this.cielo.visible = cieloEscena.visible;
    this.escena.background = fondo ? fondo.clone() : null;
    const rt = this.pmrem.fromScene(this.escena, 0, 0.1, 1000);
    if (this.rtViejo) this.rtViejo.dispose();
    this.rtViejo = rt;
    this.textura = rt.texture;
    return this.textura;
  }
}
