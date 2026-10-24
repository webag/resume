import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ site, url }) => {
  const cases = (await getCollection('cases', ({ data }) => !data.draft)).sort(
    (a, b) => a.data.order - b.data.order,
  );
  const origin = site ?? new URL(url.origin);
  const base = import.meta.env.BASE_URL;
  const pages = [
    new URL(base, origin).href,
    ...cases.map((entry) => new URL(`${base}cases/${entry.id}/`, origin).href),
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((href) => `  <url><loc>${href}</loc></url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
