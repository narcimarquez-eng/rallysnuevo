// Cámaras del juego: Persecución, Capó, Cabina y vista cinemática de menú.
import * as THREE from 'three';

export const MODOS_CAMARA = [
  { id: 'persecucion', nombre: 'Persecución' },
  { id: 'capo', nombre: 'Capó' },
  { id: 'cabina', nombre: 'Cabina' }
];

export class GestorCamaras {
  constructor(camera, mundoFisica) {
    this.camera = camera;
    this.mundo = mundoFisica;
    this.modoIdx = 0;

    this._pos = new THREE.Vector3();
    this._objetivo = new THREE.Vector3();
    this._tmpA = new THREE.Vector3();
    this._tmpB = new THREE.Vector3();
    this._yawSuave = 0;
    this._anguloMenu = 0;
  }

  setMundo(mundoFisica) {
    this.mundo = mundoFisica;
  }

  modoActual() {
    return MODOS_CAMARA[this.modoIdx];
  }

  siguienteModo() {
    this.modoIdx = (this.modoIdx + 1) % MODOS_CAMARA.length;
    return this.modoActual();
  }

  setModo(id) {
    const idx = MODOS_CAMARA.findIndex(m => m.id === id);
    if (idx >= 0) this.modoIdx = idx;
    return this.modoActual();
  }

  reiniciarEn(estado) {
    this._yawSuave = estado.yaw;
    const fx = Math.sin(estado.yaw), fz = Math.cos(estado.yaw);
    this._pos.set(estado.x - fx * 7.2, estado.y + 3.0, estado.z - fz * 7.2);
    this._objetivo.set(estado.x + fx * 6, estado.y + 1.2, estado.z + fz * 6);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._objetivo);
  }

  actualizarMenu(dt, centro) {
    this._anguloMenu += dt * 0.14;
    const dist = 16;
    const cx = centro.x + Math.cos(this._anguloMenu) * dist;
    const cz = centro.z + Math.sin(this._anguloMenu) * dist;
    const ySuelo = this.mundo ? this.mundo.muestrear(cx, cz).y : centro.y;
    this.camera.position.set(cx, Math.max(centro.y + 4.5, ySuelo + 3.0), cz);
    this.camera.lookAt(centro.x, centro.y + 1.1, centro.z);
    if (this.camera.fov !== 56) {
      this.camera.fov = 56;
      this.camera.updateProjectionMatrix();
    }
  }

  actualizar(dt, estado, coche) {
    const modo = this.modoActual().id;
    coche.raiz.updateMatrixWorld(true);

    if (modo === 'persecucion') {
      // Suavizar el seguimiento de yaw (si va marcha atrás, mirar también sin voltear brusco)
      let diff = ((estado.yaw - this._yawSuave + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const rapidez = Math.min(1, dt * (5.5 + Math.abs(estado.vLong) * 0.14));
      this._yawSuave += diff * rapidez;

      const fx = Math.sin(this._yawSuave), fz = Math.cos(this._yawSuave);
      const rx = Math.cos(this._yawSuave), rz = -Math.sin(this._yawSuave);
      const velFactor = Math.min(1, estado.velocidadKmh / 150);
      const dist = (estado.enPueblo ? 5.2 : 6.3) + velFactor * 1.3;
      const alto = (estado.enPueblo ? 2.65 : 2.45) + velFactor * 0.45;
      const desfaseLat = Math.max(-1.6, Math.min(1.6, -estado.vLat * 0.14));

      const px = estado.x - fx * dist + rx * desfaseLat;
      const pz = estado.z - fz * dist + rz * desfaseLat;
      let py = estado.y + alto - Math.sin(estado.pitchTerreno) * 1.8;

      if (this.mundo) {
        const sueloCam = this.mundo.muestrear(px, pz).y;
        py = Math.max(py, sueloCam + 1.15);
      }

      const mezcla = Math.min(1, dt * 11);
      this._pos.lerp(this._tmpA.set(px, py, pz), mezcla);
      this._objetivo.lerp(this._tmpB.set(estado.x + fx * 6.5, estado.y + 1.25, estado.z + fz * 6.5), Math.min(1, dt * 16));

      this.camera.position.copy(this._pos);
      this.camera.lookAt(this._objetivo);

      const fovObj = 58 + velFactor * 14;
      if (Math.abs(this.camera.fov - fovObj) > 0.1) {
        this.camera.fov += (fovObj - this.camera.fov) * Math.min(1, dt * 6);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    if (modo === 'capo') {
      const pLocal = coche.medidas.capoPos;
      this._tmpA.copy(pLocal);
      coche.chasis.localToWorld(this._tmpA);
      this._tmpB.set(pLocal.x, pLocal.y - 0.15, pLocal.z + 24);
      coche.chasis.localToWorld(this._tmpB);

      this.camera.position.copy(this._tmpA);
      this.camera.lookAt(this._tmpB);

      const fovCapo = 66 + Math.min(10, estado.velocidadKmh * 0.06);
      if (Math.abs(this.camera.fov - fovCapo) > 0.1) {
        this.camera.fov += (fovCapo - this.camera.fov) * Math.min(1, dt * 8);
        this.camera.updateProjectionMatrix();
      }
      return;
    }

    // Modo cabina (vista interior del conductor viendo el volante y el parabrisas)
    const pCab = coche.medidas.cabinaPos;
    this._tmpA.copy(pCab);
    coche.chasis.localToWorld(this._tmpA);
    // Mira hacia delante con ligero seguimiento del derrape y viendo parte del volante
    const miradaLat = Math.max(-2.2, Math.min(2.2, estado.vLat * 0.18));
    this._tmpB.set(pCab.x + miradaLat, pCab.y - 1.25, pCab.z + 18);
    coche.chasis.localToWorld(this._tmpB);

    this.camera.position.copy(this._tmpA);
    this.camera.lookAt(this._tmpB);

    if (Math.abs(this.camera.fov - 72) > 0.2) {
      this.camera.fov += (72 - this.camera.fov) * Math.min(1, dt * 8);
      this.camera.updateProjectionMatrix();
    }
  }
}
