// Картинка для соцсетей (Open Graph) главной страницы: /og.jpg, 1200×630.
// Собирается при билде из src/data/profile.ts и src/assets/photo.jpg.
// Текст рисует satori шрифтом Manrope (в кривых), поэтому результат не зависит
// от системных шрифтов: локально и в CI картинка одинаковая.
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import type { APIRoute } from 'astro';
import satori from 'satori';
import sharp from 'sharp';
import { profile } from '../data/profile';

const WIDTH = 1200;
const HEIGHT = 630;
const AVATAR = 360;
const AVATAR_CENTER = { x: 940, y: 315 };
const SITE_LABEL = 'webag.github.io/resume';
const ACCENT = '#c6ff4d';
const TEXT = '#f1f2f5';
const MUTED = '#8a8f9e';

const root = process.cwd();
const fontsDir = path.join(root, 'node_modules/@fontsource/manrope/files');

const loadFonts = () =>
  Promise.all(
    ([600, 700, 800] as const).flatMap((weight) =>
      ['cyrillic', 'latin'].map(async (subset) => ({
        name: `Manrope ${subset}`,
        weight,
        style: 'normal' as const,
        data: await readFile(path.join(fontsDir, `manrope-${subset}-${weight}-normal.woff`)),
      })),
    ),
  );

// Каждое подмножество — своё семейство: satori добирает недостающие глифы
// только по цепочке font-family, а не между файлами одного семейства.
const FONT_FAMILY = 'Manrope latin, Manrope cyrillic';

// Узел разметки для satori без JSX.
const text = (content: string, top: number, style: Record<string, string | number>) => ({
  type: 'div',
  props: { style: { position: 'absolute', left: 72, top, display: 'flex', lineHeight: 1, ...style }, children: content },
});

const stats = [profile.stats[0]?.value, profile.stats[1]?.value].filter(Boolean);
const statsLine = [stats[0] && `${stats[0]} лет в вебе`, stats[1] && `${stats[1]} проектов`].filter(Boolean).join(' · ');

export const GET: APIRoute = async () => {
  const background = `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <defs>
      <radialGradient id="glow" cx="0.86" cy="0.12" r="0.95">
        <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.3"/>
        <stop offset="0.55" stop-color="${ACCENT}" stop-opacity="0.06"/>
        <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="#08090c"/>
    <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#glow)"/>
    <circle cx="${AVATAR_CENTER.x}" cy="${AVATAR_CENTER.y}" r="${AVATAR / 2 + 16}" fill="none" stroke="${ACCENT}" stroke-opacity="0.5" stroke-width="2"/>
    <rect x="72" y="378" width="112" height="3" rx="1.5" fill="${ACCENT}"/>
  </svg>`;

  const textLayer = await satori(
    {
      type: 'div',
      props: {
        style: { display: 'flex', position: 'relative', width: WIDTH, height: HEIGHT, fontFamily: FONT_FAMILY },
        children: [
          text('ПОРТФОЛИО', 172, { fontSize: 18, fontWeight: 700, letterSpacing: 5, color: ACCENT }),
          text(profile.name, 226, { fontSize: 62, fontWeight: 800, letterSpacing: -2, color: TEXT }),
          text(profile.role, 308, { fontSize: 27, fontWeight: 600, color: MUTED }),
          text(statsLine, 412, { fontSize: 23, fontWeight: 600, color: MUTED }),
          text(SITE_LABEL, 538, { fontSize: 24, fontWeight: 700, color: ACCENT }),
        ],
      },
    },
    { width: WIDTH, height: HEIGHT, fonts: await loadFonts() },
  );

  const avatarMask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${AVATAR}" height="${AVATAR}"><circle cx="${AVATAR / 2}" cy="${AVATAR / 2}" r="${AVATAR / 2}" fill="#fff"/></svg>`,
  );
  const avatar = await sharp(await readFile(path.join(root, 'src/assets/photo.jpg')))
    .resize(AVATAR, AVATAR, { fit: 'cover' })
    .composite([{ input: avatarMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  const jpeg = await sharp(Buffer.from(background))
    .composite([
      { input: Buffer.from(textLayer) },
      { input: avatar, left: AVATAR_CENTER.x - AVATAR / 2, top: AVATAR_CENTER.y - AVATAR / 2 },
    ])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(jpeg), { headers: { 'Content-Type': 'image/jpeg' } });
};
