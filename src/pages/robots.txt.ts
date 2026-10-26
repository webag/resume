import type { APIRoute } from 'astro';

// Сайт закрыт от индексации через <meta name="robots" content="noindex, nofollow">.
// Обход не запрещаем: иначе поисковик не увидит noindex и может оставить страницы в выдаче.
export const GET: APIRoute = () =>
  new Response('User-agent: *\nAllow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
