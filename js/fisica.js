// Motor de física arcade-rally a paso fijo (120 Hz): tracción, derrapes, peso, suspensión y agarre por superficie.
const E = window.Escenario;

export class FisicaCoche {
  constructor(mundoFisica, colisiones, specs, medidas) {
    this.mundo = mundoFisica;
    this.colisiones = colisiones;
    this.specs = specs;
    this.medidas = medidas;

    this.dtFijo = 1 / 120;
    this.acumulador = 0;

    this.estado = {
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      yaw: 0,
      velYaw: 0,
      anguloDireccion: 0,
      vLong: 0,
      vLat: 0,
      velocidadKmh: 0,
      rpm: 950,
      marcha: 1,
      deslizamiento: 0,
      derrapando: false,
      frenando: false,
      enSuelo: true,
      enPuente: false,
      enPueblo: false,
      superficie: 'grava',
      nombreSuperficie: 'Grava',
      profundidadAgua: 0,
      pitchTerreno: 0,
      rollTerreno: 0,
      pitchDinamico: 0,
      rollDinamico: 0,
      reboteChasis: 0,
      compresionRuedas: { fl: 0, fr: 0, rl: 0, rr: 0 },
      dCamino: 0,
      ultimoImpacto: null,
      totalImpactos: 0
    };

    this._puntoSeguro = { x: 0, z: 0, yaw: 0 };
    this._tiempoAguaProfunda = 0;
  }

  actualizarConfig(specs, medidas) {
    this.specs = specs;
    this.medidas = medidas;
  }

  colocarEn(x, z, rotYGrados) {
    const yaw = (rotYGrados || 0) * Math.PI / 180;
    const m = this.mundo.muestrear(x, z);
    const e = this.estado;
    e.x = x;
    e.z = z;
    e.y = m.y;
    e.vx = 0; e.vy = 0; e.vz = 0;
    e.yaw = yaw;
    e.velYaw = 0;
    e.anguloDireccion = 0;
    e.vLong = 0; e.vLat = 0;
    e.velocidadKmh = 0;
    e.rpm = 950;
    e.marcha = 1;
    e.deslizamiento = 0;
    e.derrapando = false;
    e.enSuelo = true;
    e.superficie = m.superficie;
    e.nombreSuperficie = m.props.nombre;
    e.enPuente = m.enPuente;
    e.profundidadAgua = m.profundidadAgua;
    e.pitchDinamico = 0;
    e.rollDinamico = 0;
    e.reboteChasis = 0;
    this._tiempoAguaProfunda = 0;
    this._puntoSeguro = { x, z, yaw };
    this._actualizarTerreno4Ruedas(1);
  }

  recolocarSeguro(circuito) {
    // Si tiene punto seguro o camino cercano, colocar apuntando en sentido del camino
    const m = this.mundo.muestrear(this.estado.x, this.estado.z);
    if (m.camino && circuito?.muestras?.length >= 2) {
      const mu = circuito.muestras;
      let mejor = 0, mejorDist = Infinity;
      for (let i = 0; i < mu.length; i++) {
        const d = Math.hypot(mu[i].x - this.estado.x, mu[i].z - this.estado.z);
        if (d < mejorDist) { mejorDist = d; mejor = i; }
      }
      const a = mu[Math.max(0, mejor - 1)];
      const b = mu[Math.min(mu.length - 1, mejor + 1)];
      const rot = Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI;
      this.colocarEn(mu[mejor].x, mu[mejor].z, rot);
      return;
    }
    this.colocarEn(this._puntoSeguro.x, this._puntoSeguro.z, this._puntoSeguro.yaw * 180 / Math.PI);
  }

  avanzar(dtFrame, entrada) {
    const dt = Math.min(0.05, Math.max(0, dtFrame));
    this.acumulador += dt;
    let impactos = [];
    let subpasos = 0;
    while (this.acumulador >= this.dtFijo && subpasos < 6) {
      const imp = this._paso(this.dtFijo, entrada);
      if (imp) impactos.push(imp);
      this.acumulador -= this.dtFijo;
      subpasos++;
    }
    if (subpasos === 6) this.acumulador = 0;

    if (impactos.length) {
      impactos.sort((a, b) => b.intensidad - a.intensidad);
      this.estado.ultimoImpacto = impactos[0];
      this.estado.totalImpactos++;
    } else {
      this.estado.ultimoImpacto = null;
    }
    return this.estado;
  }

  _paso(dt, entrada) {
    const e = this.estado;
    const sp = this.specs;

    // 1. Muestreo del terreno y superficie en el centro y en las 4 esquinas
    const { hMedia, pitchObj, rollObj, muestraCentro, esquinas } = this._actualizarTerreno4Ruedas(dt);
    e.superficie = muestraCentro.superficie;
    e.nombreSuperficie = muestraCentro.props.nombre;
    e.enPuente = muestraCentro.enPuente;
    e.enPueblo = muestraCentro.enPueblo;
    e.profundidadAgua = muestraCentro.profundidadAgua;
    e.dCamino = muestraCentro.dCamino;

    // Guardar punto seguro si está sobre firme y estable
    if (e.enSuelo && muestraCentro.profundidadAgua < 0.25 && muestraCentro.camino) {
      this._puntoSeguro.x = e.x;
      this._puntoSeguro.z = e.z;
      this._puntoSeguro.yaw = e.yaw;
    }

    // 2. Vectores del coche en el plano XZ
    const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
    const rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);

    // Proyección de velocidad en ejes del coche
    let vLong = e.vx * fx + e.vz * fz;
    let vLat = e.vx * rx + e.vz * rz;
    const rapidez = Math.hypot(vLong, vLat);

    // 3. Dirección (en sistema mano derecha: giro > 0 => izquierda (+X))
    // entrada.giro viene como -1 izquierda, +1 derecha => invertimos signo para que izquierda sea positivo en yaw
    const giroObjetivo = -E.clamp(entrada.giro || 0, -1, 1);
    const maxSteer = 0.56 / (1 + Math.abs(vLong) * 0.032);
    const velSteer = Math.abs(giroObjetivo) > 0.02 ? 7.5 : 10.0;
    e.anguloDireccion += (giroObjetivo * maxSteer - e.anguloDireccion) * Math.min(1, velSteer * dt);

    // 4. Aceleración, freno, marcha atrás y freno de mano
    const gas = E.clamp(entrada.acelerar || 0, 0, 1);
    const frenoIn = E.clamp(entrada.frenar || 0, 0, 1);
    const mano = Boolean(entrada.frenoMano);

    const sup = muestraCentro.props;
    const velMaxMs = (sp.velMaxKmh || 185) / 3.6;
    let fuerzaMotor = 0;
    let frenando = false;

    if (gas > 0.02) {
      if (vLong < -1.5) {
        // Frenar si iba marcha atrás
        fuerzaMotor = 18 * sp.frenada * gas;
        frenando = true;
      } else {
        const factorVel = Math.max(0, 1 - Math.pow(Math.max(0, vLong) / velMaxMs, 1.8));
        const empujeBase = (sp.potencia / sp.masa) * 34; // ~8.5-11.5 m/s²
        fuerzaMotor = empujeBase * gas * factorVel * sup.traccion * (sp.agarreBase || 1);
      }
    }

    if (frenoIn > 0.02) {
      if (vLong > 1.2) {
        // Frenada hacia delante
        fuerzaMotor -= (17.5 * sp.frenada * sup.agarre) * frenoIn;
        frenando = true;
      } else {
        // Marcha atrás suave (tope ~55 km/h)
        const factorRev = Math.max(0, 1 - Math.abs(Math.min(0, vLong)) / 15.5);
        fuerzaMotor -= 7.8 * frenoIn * factorRev * sup.traccion;
      }
    }

    if (mano && Math.abs(vLong) > 0.4) {
      fuerzaMotor -= Math.sign(vLong) * 7.5 * sup.agarre;
      frenando = true;
    }
    e.frenando = frenando;

    // 5. Efecto de la pendiente longitudinal en la gravedad sobre el coche
    const pendienteFactor = Math.sin(-e.pitchTerreno); // >0 si apunta cuesta arriba => frena
    const gravLong = -9.81 * pendienteFactor;

    // 6. Rozamiento de rodadura, resistencia aerodinámica y agua en vados
    const arrastreSup = sup.arrastre * vLong;
    const aero = 0.00042 * vLong * Math.abs(vLong);
    let arrastreAgua = 0;
    if (e.profundidadAgua > 0.05) {
      const sum = Math.min(1.2, e.profundidadAgua);
      arrastreAgua = (0.35 + sum * 0.9) * vLong * Math.min(1, Math.abs(vLong) * 0.25);
    }

    if (e.enSuelo) {
      vLong += (fuerzaMotor + gravLong - arrastreSup - aero - arrastreAgua) * dt;
    } else {
      // En el aire solo afecta el aire suavemente
      vLong += (-aero * 0.5) * dt;
    }

    // 7. Modelo lateral y guiñada (derrapes creíbles de rally)
    if (e.enSuelo) {
      const batalla = this.medidas.batalla || 2.6;
      const factorSentido = vLong >= -0.2 ? 1 : -1;
      const tasaGiroIdeal = (Math.abs(vLong) > 0.35)
        ? (vLong / batalla) * Math.tan(e.anguloDireccion) * 1.12
        : 0;

      // Cuando se tira de freno de mano o se da gas fuerte en superficie suelta, la trasera desliza más
      const agarreLat = sup.agarre * (sp.agarreBase || 1) * (mano ? 0.36 : 1.0);
      const sobreviraje = mano ? 1.55 : (1 + (1 - sup.agarre) * 0.65 * (sp.repartoTrasero || 0.55));
      const velYawObjetivo = tasaGiroIdeal * (mano ? 1.48 : 1.0 + Math.min(0.32, Math.abs(vLat) * 0.04));

      // Amortiguación lateral proporcional al agarre de la superficie
      const fuerzaLat = agarreLat * 11.5;
      const vLatAntes = vLat;
      vLat -= vLat * Math.min(1, fuerzaLat * dt);

      // Si hay gas fuerte en tierra/grava/barro y está girando, induce un poco de deriva trasera divertida
      if (gas > 0.4 && Math.abs(e.anguloDireccion) > 0.08 && sup.agarre < 0.95) {
        const empujeDerrape = (1 - sup.agarre) * (sp.repartoTrasero || 0.55) * gas * 3.8;
        vLat -= Math.sign(e.anguloDireccion) * empujeDerrape * dt * Math.min(1, Math.abs(vLong) / 8);
      }

      // Acoplamiento angular
      const respYaw = 9.5 * (0.45 + 0.55 * agarreLat) * sobreviraje;
      e.velYaw += (velYawObjetivo - e.velYaw) * Math.min(1, respYaw * dt);
      e.velYaw *= Math.max(0, 1 - 1.6 * dt);

      // Si está casi quieto sin gas ni freno, evitar micro-deslizamiento
      if (Math.abs(vLong) < 0.12 && Math.abs(vLat) < 0.12 && gas < 0.05 && frenoIn < 0.05) {
        vLong = 0;
        vLat = 0;
        e.velYaw = 0;
      }

      const latDelta = Math.abs(vLatAntes - vLat);
      const slipRatio = rapidez > 2 ? Math.min(1.5, (Math.abs(vLat) + latDelta * 2.5) / Math.max(4, Math.abs(vLong))) : 0;
      e.deslizamiento = mano && rapidez > 4 ? Math.max(0.75, slipRatio) : slipRatio;
      e.derrapando = (e.deslizamiento > 0.28 || (mano && rapidez > 5)) && e.enSuelo;

      // Mantener conservación aproximada al cambiar yaw en derrape
      void factorSentido;
    } else {
      e.velYaw *= Math.max(0, 1 - 0.8 * dt);
      e.deslizamiento = 0;
      e.derrapando = false;
    }

    e.yaw += e.velYaw * dt;
    const fx2 = Math.sin(e.yaw), fz2 = Math.cos(e.yaw);
    const rx2 = Math.cos(e.yaw), rz2 = -Math.sin(e.yaw);

    e.vx = fx2 * vLong + rx2 * vLat;
    e.vz = fz2 * vLong + rz2 * vLat;

    // 8. Integración de posición XZ y bordes del mapa
    e.x += e.vx * dt;
    e.z += e.vz * dt;
    const mitadMapa = this.mundo.esc.terreno.tam * 0.5 - 3;
    if (Math.abs(e.x) > mitadMapa) {
      e.x = E.clamp(e.x, -mitadMapa, mitadMapa);
      e.vx *= -0.3;
    }
    if (Math.abs(e.z) > mitadMapa) {
      e.z = E.clamp(e.z, -mitadMapa, mitadMapa);
      e.vz *= -0.3;
    }

    // 9. Colisiones con barreras, casas, iglesia, árboles, rocas y puentes
    const impacto = this.colisiones ? this.colisiones.resolverCoche(e, this.medidas) : null;

    // Recalcular velocidades locales tras posible colisión
    e.vLong = e.vx * fx2 + e.vz * fz2;
    e.vLat = e.vx * rx2 + e.vz * rz2;
    e.velocidadKmh = Math.hypot(e.vx, e.vz) * 3.6;

    // 10. Física vertical: saltos en rasantes, gravedad y compresión de suspensión
    const hSuelo = hMedia;
    if (e.y > hSuelo + 0.08 || e.vy > 0.6) {
      e.vy -= 9.81 * dt;
      e.y += e.vy * dt;
      if (e.y <= hSuelo) {
        const golpeCaida = Math.max(0, -e.vy);
        e.y = hSuelo;
        e.vy = 0;
        e.enSuelo = true;
        e.reboteChasis = -Math.min(0.14, golpeCaida * 0.025);
      } else {
        e.enSuelo = false;
      }
    } else {
      // Sigue la rasante; si el suelo cae rápido bajo un salto a gran velocidad, despega!
      const velVerticalTerreno = (hSuelo - e.y) / dt;
      if (velVerticalTerreno < -3.8 && Math.abs(e.vLong) > 16) {
        e.enSuelo = false;
        e.vy = -1.2;
      } else {
        e.enSuelo = true;
        e.vy = Math.max(-2, Math.min(8, (hSuelo - e.y) / dt * 0.35));
        e.y = hSuelo;
      }
    }

    // Baches y vibración de suspensión según superficie
    const faseBache = Math.sin(e.x * 1.7 + e.z * 1.3) * Math.cos(e.x * 0.9 - e.z * 1.9);
    const ampBache = e.enSuelo ? sup.baches * Math.min(1, e.velocidadKmh / 45) : 0;
    const suspObj = ampBache * faseBache;
    e.reboteChasis += (suspObj - e.reboteChasis) * Math.min(1, 16 * dt);

    // Cabeceo y balanceo dinámico del chasis por transferencia de peso
    const accelLong = (fuerzaMotor - arrastreSup) * (e.enSuelo ? 1 : 0);
    const pitchDinObj = E.clamp(accelLong * -0.0045 + (frenando ? 0.045 : 0), -0.06, 0.06);
    const rollDinObj = E.clamp(-e.velYaw * Math.abs(e.vLong) * 0.0055, -0.09, 0.09);
    e.pitchDinamico += (pitchDinObj - e.pitchDinamico) * Math.min(1, 10 * dt);
    e.rollDinamico += (rollDinObj - e.rollDinamico) * Math.min(1, 12 * dt);

    // Compresión individual de cada rueda respecto al chasis
    const maxComp = (sp.recorridoSusp || 0.24) * 0.5;
    e.compresionRuedas.fl = E.clamp((esquinas.fl - hSuelo) * 0.65 - e.reboteChasis, -maxComp, maxComp);
    e.compresionRuedas.fr = E.clamp((esquinas.fr - hSuelo) * 0.65 - e.reboteChasis, -maxComp, maxComp);
    e.compresionRuedas.rl = E.clamp((esquinas.rl - hSuelo) * 0.65 - e.reboteChasis, -maxComp, maxComp);
    e.compresionRuedas.rr = E.clamp((esquinas.rr - hSuelo) * 0.65 - e.reboteChasis, -maxComp, maxComp);

    // Suavizado de inclinación del terreno (al volar en un salto mantiene ligeramente la actitud)
    const velActitud = e.enSuelo ? 14 : 2.2;
    e.pitchTerreno += (pitchObj - e.pitchTerreno) * Math.min(1, velActitud * dt);
    e.rollTerreno += (rollObj - e.rollTerreno) * Math.min(1, velActitud * dt);

    // 11. Simulación de 5 marchas y RPM para el velocímetro y el sonido
    const relVelocidad = Math.abs(e.vLong) / Math.max(10, velMaxMs);
    const umbrales = [0, 0.20, 0.40, 0.62, 0.82, 1.2];
    let marcha = 1;
    for (let g = 1; g <= 5; g++) {
      if (relVelocidad >= umbrales[g - 1]) marcha = g;
    }
    e.marcha = e.vLong < -0.5 ? 'R' : marcha;
    const pisoM = umbrales[marcha - 1];
    const techoM = umbrales[marcha];
    const progMarcha = E.clamp((relVelocidad - pisoM) / Math.max(0.05, techoM - pisoM), 0, 1);
    const patinajeRpm = e.derrapando ? 900 * gas : 0;
    const rpmObj = 950 + progMarcha * 5600 + gas * 450 + patinajeRpm;
    e.rpm += (E.clamp(rpmObj, 900, 7400) - e.rpm) * Math.min(1, 14 * dt);

    // 12. Seguridad: si cae en agua muy profunda (> 1.35 m) más de 1.5 s, recolocar solo
    if (e.profundidadAgua > 1.35) {
      this._tiempoAguaProfunda += dt;
      if (this._tiempoAguaProfunda > 1.6) {
        this.recolocarSeguro();
      }
    } else {
      this._tiempoAguaProfunda = 0;
    }

    return impacto;
  }

  _actualizarTerreno4Ruedas(dt) {
    const e = this.estado;
    const halfW = (this.medidas?.via || 1.6) * 0.5;
    const halfL = (this.medidas?.batalla || 2.6) * 0.5;
    const fx = Math.sin(e.yaw), fz = Math.cos(e.yaw);
    const rx = Math.cos(e.yaw), rz = -Math.sin(e.yaw);

    const mC = this.mundo.muestrear(e.x, e.z);
    const mFL = this.mundo.muestrear(e.x + fx * halfL + rx * halfW, e.z + fz * halfL + rz * halfW);
    const mFR = this.mundo.muestrear(e.x + fx * halfL - rx * halfW, e.z + fz * halfL - rz * halfW);
    const mRL = this.mundo.muestrear(e.x - fx * halfL + rx * halfW, e.z - fz * halfL + rz * halfW);
    const mRR = this.mundo.muestrear(e.x - fx * halfL - rx * halfW, e.z - fz * halfL - rz * halfW);

    const hMedia = (mFL.y + mFR.y + mRL.y + mRR.y) * 0.25;
    const pendLong = ((mFL.y + mFR.y) * 0.5 - (mRL.y + mRR.y) * 0.5) / Math.max(1, halfL * 2);
    const pendLat = ((mFL.y + mRL.y) * 0.5 - (mFR.y + mRR.y) * 0.5) / Math.max(1, halfW * 2);

    const pitchObj = E.clamp(-Math.atan(pendLong), -0.65, 0.65);
    const rollObj = E.clamp(Math.atan(pendLat), -0.55, 0.55);

    if (dt >= 1) {
      e.pitchTerreno = pitchObj;
      e.rollTerreno = rollObj;
    }

    return {
      hMedia,
      pitchObj,
      rollObj,
      muestraCentro: mC,
      esquinas: { fl: mFL.y, fr: mFR.y, rl: mRL.y, rr: mRR.y }
    };
  }
}
