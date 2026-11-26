# Footer "My products" and Lyamo brand/app split — 2026-11-26

Status: implemented; local quality checks, local render and structured-data validators passed. Production validation after merge.

## Change

- Public footer: new section "My products" (PL "Moje produkty", DE "Meine Produkte", ES "Mis productos") with links by name: Cavunio, Dokiero, Portfolio (→ piotrkulbacki.com). Brand names/URLs come from `OWNER_STRUCTURED_DATA.otherBrands`, Portfolio from `OPERATOR.website` (same source as JSON-LD). Layout: three blocks in a row from `lg`, stacked below.
- JSON-LD: Lyamo split into `Brand` `https://lyamo.eu/#lyamo` (name, url, logo) and `WebApplication` `https://lyamo.eu/#app` (description, category, OS, language, author/publisher → Person). Person `brand` still references `#lyamo`.
- URL rule (all projects): site/domain URLs without a trailing slash (majority across the four sites: Person and Brand URLs everywhere). Lyamo WebSite `url` changed from `https://lyamo.eu/` to `https://lyamo.eu`.

## Cross-site check (production, 2026-11-26)

Consistent: Person `@id`, `name`, `url` on all four sites; brand `@id`s; Lyamo/Dokiero brand+app pattern (`#lyamo`/`#app`, `#dokiero`/`#app`).

Inconsistent (other repositories, not changed here):

1. piotrkulbacki.com `sameAs` TikTok `https://www.tiktok.com/@piotr_kulbacki`; Lyamo, Cavunio, Dokiero use `@piotr_kulbacki_youtube`.
2. WebSite `url` with trailing slash on piotrkulbacki.com, cavunio.com, dokiero.com (rule: without).
3. cavunio.com types `https://cavunio.com/#cavunio` as `OnlineStore`; the other three sites type it `Brand` (dokiero.com as a top-level node). Same `@id`, conflicting types. Suggested: `#cavunio` = Brand, store as a separate node (e.g. `https://cavunio.com/#store`, OnlineStore), like Lyamo/Dokiero.

## Verification

- `npm run test:quality`: passed (142 web, 81 shared, 3 mobile tests).
- Local dev render with dummy env (no database): footer shows the section; checked visually on desktop.
- validator.schema.org (rendered snippet): 0 errors, 0 warnings; Brand `#lyamo`, WebApplication `#app`, Person (6 `sameAs`), Brands Cavunio/Dokiero, WebSite.
- Rich Results Test (rendered snippet): Software Apps, 1 valid item, 0 errors, 2 non-critical warnings: missing `offers`, missing `aggregateRating` (both optional). Both tools display URLs with a trailing slash (normalization); the source has none.
