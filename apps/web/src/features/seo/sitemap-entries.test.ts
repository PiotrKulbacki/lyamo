import { describe, expect, it, vi } from 'vitest';

vi.mock('@web/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://lyamo.eu',
  },
}));

import { buildSitemapXml } from './sitemap-entries';

describe('buildSitemapXml', () => {
  it('lists public URLs on the production host without trailing slashes on paths', () => {
    const xml = buildSitemapXml();

    expect(xml).toContain('<loc>https://lyamo.eu/</loc>');
    expect(xml).toContain('<loc>https://lyamo.eu/contact</loc>');
    expect(xml).toContain('<loc>https://lyamo.eu/terms</loc>');
    expect(xml).toContain('<loc>https://lyamo.eu/privacy</loc>');
    expect(xml).toContain('<loc>https://lyamo.eu/impressum</loc>');
    expect(xml).not.toContain('www.lyamo.eu');
    expect(xml).not.toContain('/login');
    expect(xml).not.toContain('/register');
  });

  it('uses fixed per-page lastmod dates and omits changefreq and priority', () => {
    const xml = buildSitemapXml();

    expect(xml).toContain(
      '<loc>https://lyamo.eu/impressum</loc>\n<lastmod>2026-09-09T22:03:04+02:00</lastmod>'
    );
    expect(xml).toBe(buildSitemapXml());
    expect(xml).not.toContain('<changefreq>');
    expect(xml).not.toContain('<priority>');
  });
});
