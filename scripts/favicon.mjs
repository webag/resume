// Собирает фавиконку «AG»: SVG, ICO (32 и 48 px) и apple-touch-icon (180 px).
// Запуск: npm run favicon
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const ACCENT = '#c6ff4d';
const DARK = '#08090c';
const FONT = 'Segoe UI, Arial, sans-serif';

function markSvg(rounded = true) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512"${rounded ? ' rx="112"' : ''} fill="${DARK}"/>
  <text x="256" y="366" text-anchor="middle" font-family="${FONT}" font-size="244" font-weight="900" letter-spacing="-12" fill="${ACCENT}">AG</text>
</svg>`;
}

function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(16 * entries.length);
  let offset = 6 + directory.length;
  entries.forEach((entry, i) => {
    const at = i * 16;
    directory.writeUInt8(entry.size, at);
    directory.writeUInt8(entry.size, at + 1);
    directory.writeUInt8(0, at + 2);
    directory.writeUInt8(0, at + 3);
    directory.writeUInt16LE(1, at + 4);
    directory.writeUInt16LE(32, at + 6);
    directory.writeUInt32LE(entry.png.length, at + 8);
    directory.writeUInt32LE(offset, at + 12);
    offset += entry.png.length;
  });

  return Buffer.concat([header, directory, ...entries.map((entry) => entry.png)]);
}

const rounded = Buffer.from(markSvg(true));
const fullBleed = Buffer.from(markSvg(false));

await writeFile(path.join(root, 'public/favicon.svg'), markSvg(true), 'utf8');

const sizes = [32, 48];
const entries = [];
for (const size of sizes) {
  entries.push({ size, png: await sharp(rounded).resize(size, size).png().toBuffer() });
}
await writeFile(path.join(root, 'public/favicon.ico'), buildIco(entries));

await sharp(fullBleed).resize(180, 180).png().toFile(path.join(root, 'public/apple-touch-icon.png'));

console.log('public/favicon.svg, public/favicon.ico (32, 48), public/apple-touch-icon.png (180)');
