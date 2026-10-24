// Собирает картинку для соцсетей (Open Graph): public/og.png, 1200×630.
// Запуск: npm run og. Данные берутся из src/data/profile.ts, фото — из src/assets/photo.jpg.
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { profile } from '../src/data/profile.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const WIDTH = 1200;
const HEIGHT = 630;
const AVATAR = 360;
const AVATAR_CENTER = { x: 940, y: 315 };
const SITE_LABEL = 'webag.github.io/resume';

const escapeXml = (value) =>
  value.replace(/[<>&"']/g, (ch) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[ch]);

const name = escapeXml(profile.name);
const role = escapeXml(profile.role);
const stats = [profile.stats[0]?.value, profile.stats[1]?.value].filter(Boolean);
const statsLine = escapeXml(
  [stats[0] && `${stats[0]} лет в вебе`, stats[1] && `${stats[1]} проектов`].filter(Boolean).join(' · '),
);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <radialGradient id="glow" cx="0.86" cy="0.12" r="0.95">
      <stop offset="0" stop-color="#c6ff4d" stop-opacity="0.3"/>
      <stop offset="0.55" stop-color="#c6ff4d" stop-opacity="0.06"/>
      <stop offset="1" stop-color="#c6ff4d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#08090c"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
  <circle cx="${AVATAR_CENTER.x}" cy="${AVATAR_CENTER.y}" r="${AVATAR / 2 + 16}" fill="none" stroke="#c6ff4d" stroke-opacity="0.5" stroke-width="2"/>
  <text x="72" y="190" font-family="Segoe UI, Arial, sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#c6ff4d">ПОРТФОЛИО</text>
  <text x="72" y="278" font-family="Segoe UI, Arial, sans-serif" font-size="62" font-weight="800" letter-spacing="-2" fill="#f1f2f5">${name}</text>
  <text x="72" y="334" font-family="Segoe UI, Arial, sans-serif" font-size="27" font-weight="600" fill="#8a8f9e">${role}</text>
  <rect x="72" y="378" width="112" height="3" rx="1.5" fill="#c6ff4d"/>
  <text x="72" y="436" font-family="Segoe UI, Arial, sans-serif" font-size="23" font-weight="600" fill="#8a8f9e">${statsLine}</text>
  <text x="72" y="562" font-family="Segoe UI, Arial, sans-serif" font-size="24" font-weight="700" fill="#c6ff4d">${SITE_LABEL}</text>
</svg>`;

const photo = await readFile(path.join(root, 'src/assets/photo.jpg'));
const avatarMask = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR}" height="${AVATAR}"><circle cx="${AVATAR / 2}" cy="${AVATAR / 2}" r="${AVATAR / 2}" fill="#fff"/></svg>`,
);
const avatar = await sharp(photo)
  .resize(AVATAR, AVATAR, { fit: 'cover' })
  .composite([{ input: avatarMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

const png = await sharp(Buffer.from(svg))
  .composite([
    {
      input: avatar,
      left: Math.round(AVATAR_CENTER.x - AVATAR / 2),
      top: Math.round(AVATAR_CENTER.y - AVATAR / 2),
    },
  ])
  .png()
  .toBuffer();

await mkdir(path.join(root, 'public'), { recursive: true });
await sharp(png).toFile(path.join(root, 'public/og.png'));
console.log(`public/og.png — ${WIDTH}×${HEIGHT}, ${(png.length / 1024).toFixed(1)} КБ`);
