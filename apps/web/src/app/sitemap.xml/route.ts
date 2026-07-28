import { buildSitemapXml } from '@web/features/seo/sitemap-entries';

/** Static XML for crawlers — avoids App Router `Vary: RSC` headers that confuse Google Search Console. */
export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
  const body = buildSitemapXml();

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
      Vary: 'Accept-Encoding',
    },
  });
}
