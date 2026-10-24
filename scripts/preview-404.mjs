// Локальный предпросмотр собранного сайта с настоящей 404-страницей, как на GitHub Pages:
// неизвестный путь отдаёт dist/404.html со статусом 404.
//
//   npm run build
//   npm run preview:404
//
//   http://127.0.0.1:4322/любой-путь/
//
// Если сборка сделана с BASE_PATH=/resume/ (как на GitHub Pages), открывайте
// http://127.0.0.1:4322/resume/любой-путь/ — префикс /resume срезается.
import { createReadStream, existsSync, statSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.env.PORT || 4322);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function resolveFile(pathname) {
  let clean = decodeURIComponent(pathname);
  if (clean === '/resume' || clean.startsWith('/resume/')) clean = clean.slice('/resume'.length) || '/';

  let file = path.join(root, clean);
  if (!file.startsWith(root)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
  return existsSync(file) && statSync(file).isFile() ? file : null;
}

http
  .createServer((req, res) => {
    const { pathname } = new URL(req.url, 'http://localhost');
    const file = resolveFile(pathname);

    if (file) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    createReadStream(path.join(root, '404.html')).pipe(res);
  })
  .listen(port, '127.0.0.1', () => {
    console.log(`404-предпросмотр: http://127.0.0.1:${port}/`);
    console.log('Откройте несуществующий адрес, например /no-such-page/');
  });
