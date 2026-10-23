// @ts-check
import process from 'node:process';
import { defineConfig } from 'astro/config';

// SITE_URL и BASE_PATH задаёт GitHub Actions (.github/workflows/deploy.yml)
// через actions/configure-pages. Локально сайт работает от корня.
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
});
