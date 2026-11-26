// Servidor HTTP estático sencillo para desarrollo y pruebas con Playwright.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

export function iniciarServidor(puerto = Number(process.env.PORT || 4173)) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname);
      if (rel === '/') rel = '/index.html';
      const ruta = path.normalize(path.join(RAIZ, rel));
      if (!ruta.startsWith(RAIZ)) {
        res.writeHead(403);
        res.end('Prohibido');
        return;
      }
      const stat = await fs.stat(ruta).catch(() => null);
      if (!stat || !stat.isFile()) {
        res.writeHead(404);
        res.end('No encontrado');
        return;
      }
      const ext = path.extname(ruta).toLowerCase();
      const datos = await fs.readFile(ruta);
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      res.end(datos);
    } catch (e) {
      res.writeHead(500);
      res.end('Error interno: ' + e.message);
    }
  });

  return new Promise(resolve => {
    server.listen(puerto, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, puerto: addr.port, url: `http://127.0.0.1:${addr.port}/` });
    });
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const p = Number(process.argv[2] || process.env.PORT || 4173);
  const { url } = await iniciarServidor(p);
  console.log(`Servidor de Rallys divertidos escuchando en ${url}`);
}
