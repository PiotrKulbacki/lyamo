import { env } from '@web/env';

/**
 * Public pages with the date of their last significant change (content, structured data or
 * links), ISO 8601 with time zone. Update the date whenever a page changes meaningfully;
 * never use the generation time (seo-encje.md, section 8.2). Search engines ignore
 * `changefreq` and `priority`, so they are not emitted.
 */
const PUBLIC_PAGES = [
  { path: '/', lastModified: '2026-11-27T15:00:00+01:00' },
  { path: '/contact', lastModified: '2026-07-21T21:43:19+02:00' },
  { path: '/terms', lastModified: '2026-09-09T21:09:17+02:00' },
  { path: '/privacy', lastModified: '2026-09-09T21:09:17+02:00' },
  { path: '/impressum', lastModified: '2026-09-09T22:03:04+02:00' },
] as const;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function getBaseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
}

/**
 * Plain XML sitemap — avoids Next.js metadata route headers (e.g. Vary: RSC)
 * that confuse Google Search Console fetch.
 */
export function buildSitemapXml(): string {
  const baseUrl = getBaseUrl();
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];

  for (const item of PUBLIC_PAGES) {
    const loc = item.path === '/' ? `${baseUrl}/` : `${baseUrl}${item.path}`;
    lines.push('<url>');
    lines.push(`<loc>${escapeXml(loc)}</loc>`);
    lines.push(`<lastmod>${item.lastModified}</lastmod>`);
    lines.push('</url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}
