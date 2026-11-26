// Batería automatizada de pruebas en navegador con Playwright (Chrome/Edge local con GPU) y generación de capturas.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { iniciarServidor } from './servidor.mjs';

const DIR_CAPTURAS = process.env.DIR_CAPTURAS || 'C:\\Users\\narci\\.gemini\\antigravity\\brain\\7ece9948-00b4-40be-a48f-81d6560681d0';

async function buscarNavegador() {
  const candidatos = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const ruta of candidatos) {
    const ok = await fs.stat(ruta).then(s => s.isFile()).catch(() => false);
    if (ok) return ruta;
  }
  throw new Error('No se encontró Chrome ni Edge en las rutas esperadas.');
}

async function main() {
  await fs.mkdir(DIR_CAPTURAS, { recursive: true });
  const exe = await buscarNavegador();
  console.log('Usando navegador:', exe);

  const { server, url } = await iniciarServidor(0);
  console.log('Servidor de pruebas en:', url);

  const browser = await chromium.launch({
    executablePath: exe,
    headless: true,
    args: [
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  });

  const erroresPagina = [];
  const erroresConsola = [];
  const fallosRed = [];

  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();

    page.on('pageerror', err => erroresPagina.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('response', res => {
      if (res.status() >= 400) fallosRed.push(`${res.status()} ${res.url()}`);
    });

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__RALLY__ && window.__RALLY__.estado().escenario && window.__RALLY__.estado().coche), null, { timeout: 25000 });
    await page.waitForTimeout(2800);

    const estIni = await page.evaluate(() => window.__RALLY__.estado());
    console.log('  Coche inicial:', estIni.coche, '| ruedas:', estIni.ruedasDetectadas);
    if (!String(estIni.coche).startsWith('aleatorio-') || estIni.ruedasDetectadas !== 4) {
      throw new Error('El coche inicial no usó Aleatorio realista con 4 ruedas');
    }

    // 1. Menú sobre el mundo 3D
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '01-menu-escenario.png') });
    console.log('✓ 01-menu-escenario.png');

    // 2. Iniciar carrera desde «inicio», comprobar cuenta atrás y acelerar/derrapar en grava
    await page.click('#btn-correr');
    const txtSem = await page.textContent('#semaforo');
    console.log('  Semáforo inicial:', txtSem?.trim());
    await page.evaluate(() => window.__RALLY__.empezarSinCuenta());

    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.velocidadKmh > 30, null, { timeout: 10000 });
    await page.keyboard.down('KeyA');
    await page.keyboard.down('Space');
    await page.waitForTimeout(350);
    const estSalida = await page.evaluate(() => window.__RALLY__.estado());
    console.log('  Salida grava vel:', estSalida.fisica.velocidadKmh.toFixed(1), 'km/h | sup:', estSalida.fisica.superficie);
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '02-salida-persecucion.png') });
    await page.keyboard.up('Space');
    await page.keyboard.up('KeyA');
    await page.keyboard.up('KeyW');
    console.log('✓ 02-salida-persecucion.png');

    // 3. Paso por punto de control 1 y cruce de meta + récord en localStorage
    await page.evaluate(() => window.__RALLY__.irAControl(0));
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().carrera.siguienteControlIdx >= 1, null, { timeout: 10000 });
    await page.keyboard.up('KeyW');
    console.log('✓ Control 1 superado');

    await page.evaluate(() => window.__RALLY__.irAMeta());
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().carrera.vuelta >= 2, null, { timeout: 10000 });
    await page.keyboard.up('KeyW');
    const recordsGuardados = await page.evaluate(() => localStorage.getItem('rallys.records.v1'));
    if (!recordsGuardados) throw new Error('No se guardó el récord en localStorage tras cruzar la meta');
    console.log('✓ Meta cruzada y récord guardado:', recordsGuardados);

    // 4. Cruzar puente
    const infoPuente = await page.evaluate(() => window.__RALLY__.irAPuente(0));
    console.log('  Puente objetivo:', infoPuente?.puente?.modelo);
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.enPuente === true, null, { timeout: 10000 });
    const estPuente = await page.evaluate(() => window.__RALLY__.estado());
    console.log('  En puente! y =', estPuente.fisica.y.toFixed(2), 'vel =', estPuente.fisica.velocidadKmh.toFixed(1));
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '03-puente.png') });
    await page.keyboard.up('KeyW');
    console.log('✓ 03-puente.png');

    // 5. Cruzar vado con agua
    const infoVado = await page.evaluate(() => window.__RALLY__.irAVado());
    console.log('  Vado encontrado:', infoVado ? 'sí' : 'no');
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.profundidadAgua > 0.05, null, { timeout: 10000 });
    const estVado = await page.evaluate(() => window.__RALLY__.estado());
    console.log('  En vado! prof =', estVado.fisica.profundidadAgua.toFixed(2), 'sup =', estVado.fisica.superficie);
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '04-vado-agua.png') });
    await page.keyboard.up('KeyW');
    console.log('✓ 04-vado-agua.png');

    // 6. Entrar al pueblo andaluz e iglesia + verificar colisiones reales
    await page.evaluate(() => window.__RALLY__.irAPueblo());
    await page.waitForFunction(() => {
      const c = window.__RALLY__.estado().colisiones;
      return c.pueblosIndexados.length > 0 && c.glbsIndexados.length > 0;
    }, null, { timeout: 15000 });
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(800);
    await page.keyboard.up('KeyW');
    const estPueblo = await page.evaluate(() => window.__RALLY__.estado());
    console.log('  Colisiones pueblo/iglesia:', estPueblo.colisiones);
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '05-pueblo-iglesia.png') });

    // Prueba activa de colisión contra barrera lateral
    const impactosAntes = estPueblo.fisica.totalImpactos;
    await page.evaluate(() => window.__RALLY__.irABarreraSalida());
    await page.keyboard.down('KeyW');
    await page.waitForFunction(prev => window.__RALLY__.estado().fisica.totalImpactos > prev, impactosAntes, { timeout: 10000 });
    await page.keyboard.up('KeyW');
    console.log('✓ Colisión física verificada contra barrera');

    // 7. Cámara capó
    await page.evaluate(() => {
      window.__RALLY__.irAControl(1);
      window.__RALLY__.setCamara('capo');
    });
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.velocidadKmh > 25, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '06-camara-capo.png') });
    await page.keyboard.up('KeyW');
    console.log('✓ 06-camara-capo.png');

    // 8. Cámara cabina
    await page.evaluate(() => window.__RALLY__.setCamara('cabina'));
    await page.keyboard.down('KeyW');
    await page.keyboard.down('KeyA');
    await page.waitForTimeout(550);
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '07-camara-cabina.png') });
    await page.keyboard.up('KeyA');
    await page.keyboard.up('KeyW');
    console.log('✓ 07-camara-cabina.png');

    // Pulsar "Aleatorio realista" en el menú para generar un segundo coche distinto, y también probar un preset (tucson)
    await page.click('#btn-menu');
    await page.click('#btn-coche-aleatorio');
    const estAleat2 = await page.evaluate(() => window.__RALLY__.estado());
    console.log('✓ Nuevo Aleatorio realista generado:', estAleat2.coche);
    await page.click('.tarjeta-coche[data-id="tucson"]');
    await page.click('#btn-correr');
    await page.evaluate(() => {
      window.__RALLY__.empezarSinCuenta();
      window.__RALLY__.setCamara('persecucion');
    });
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.velocidadKmh > 20, null, { timeout: 10000 });
    await page.keyboard.up('KeyW');
    console.log('✓ Segundo modelo de Hacer-coches- (tucson) probado');

    // 9. Probar importación real de .glb estilo Hacer-coches-
    const resGlb = await page.evaluate(async () => {
      const THREE = await import('three');
      const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
      const car = new THREE.Group();
      car.name = 'LuxuryCar';
      const body = new THREE.Group(); body.name = 'Body';
      const chasisMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.88, 0.72, 4.45),
        new THREE.MeshStandardMaterial({ color: '#e11d48', metalness: 0.5, roughness: 0.25 })
      );
      chasisMesh.position.y = 0.58;
      body.add(chasisMesh);
      const cabin = new THREE.Group(); cabin.name = 'Cabin';
      const cabMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.48, 0.55, 2.05),
        new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.2 })
      );
      cabMesh.position.set(0, 1.15, -0.15);
      cabin.add(cabMesh);

      const wheels = new THREE.Group(); wheels.name = 'Wheels';
      for (const sx of [-1, 1]) {
        for (const sz of [1.35, -1.35]) {
          const w = new THREE.Group(); w.name = 'Wheel';
          w.position.set(sx * 0.88, 0.36, sz);
          const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.36, 0.36, 0.26, 20),
            new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 })
          );
          tire.rotation.z = Math.PI / 2;
          const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.22, 0.22, 0.27, 12),
            new THREE.MeshStandardMaterial({ color: '#f8fafc', metalness: 0.7, roughness: 0.2 })
          );
          rim.rotation.z = Math.PI / 2;
          w.add(tire, rim);
          wheels.add(w);
        }
      }
      car.add(body, cabin, wheels);

      const buf = await new Promise((resolve, reject) => {
        new GLTFExporter().parse(car, resolve, reject, { binary: true });
      });
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const est = await window.__RALLY__.cargarCocheBase64(btoa(bin), 'hacer-coches-gt.glb');
      window.__RALLY__.setCamara('persecucion');
      return est;
    });
    console.log('  Coche GLB cargado:', resGlb.coche, '| ruedasDetectadas:', resGlb.ruedasDetectadas);
    if (resGlb.ruedasDetectadas !== 4) throw new Error('No se detectaron las 4 ruedas del .glb de Hacer-coches-');
    await page.keyboard.down('KeyW');
    await page.waitForFunction(() => window.__RALLY__.estado().fisica.velocidadKmh > 25, null, { timeout: 10000 });
    await page.screenshot({ path: path.join(DIR_CAPTURAS, '08-carga-glb-hacercoches.png') });
    await page.keyboard.up('KeyW');
    console.log('✓ 08-carga-glb-hacercoches.png');

    await context.close();

    // 10. Contexto móvil apaisado con controles táctiles
    const ctxMovil = await browser.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true
    });
    const pageM = await ctxMovil.newPage();
    pageM.on('pageerror', err => erroresPagina.push('[Movil] ' + err.message));
    await pageM.goto(url, { waitUntil: 'domcontentloaded' });
    await pageM.waitForFunction(() => Boolean(window.__RALLY__ && window.__RALLY__.estado().escenario && window.__RALLY__.estado().coche), null, { timeout: 25000 });
    await pageM.evaluate(() => window.__RALLY__.empezarSinCuenta());
    await pageM.waitForTimeout(300);
    const tactilOculto = await pageM.getAttribute('#controles-tactiles', 'hidden');
    if (tactilOculto !== null) throw new Error('Los controles táctiles no aparecieron en móvil');

    const cajaGas = await pageM.locator('#btn-t-gas').boundingBox();
    await pageM.mouse.move(cajaGas.x + cajaGas.width / 2, cajaGas.y + cajaGas.height / 2);
    await pageM.mouse.down();
    await pageM.waitForFunction(() => window.__RALLY__.estado().fisica.velocidadKmh > 18, null, { timeout: 10000 });
    const estMovil = await pageM.evaluate(() => window.__RALLY__.estado());
    console.log('  Móvil táctil vel:', estMovil.fisica.velocidadKmh.toFixed(1), 'km/h');
    await pageM.screenshot({ path: path.join(DIR_CAPTURAS, '09-movil-tactil.png') });
    await pageM.mouse.up();
    console.log('✓ 09-movil-tactil.png');

    await ctxMovil.close();

    console.log('\nResumen de errores:');
    console.log('  pageerror:', erroresPagina.length, erroresPagina);
    console.log('  console.error:', erroresConsola.length, erroresConsola);
    console.log('  HTTP >= 400:', fallosRed.length, fallosRed);

    if (erroresPagina.length) {
      throw new Error('Hubo errores de JS en página: ' + erroresPagina.join(' | '));
    }
    const fallosLocales = fallosRed.filter(f => f.includes('127.0.0.1'));
    if (fallosLocales.length) {
      throw new Error('Hubo archivos locales 404/500: ' + fallosLocales.join(' | '));
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error('❌ FALLO EN PRUEBAS:', err);
  process.exit(1);
});
