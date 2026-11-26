# Home page JSON-LD aligned with piotrkulbacki.com — 2026-11-26

Status: implemented; local quality checks and structured-data validators passed on the rendered snippet. Production validation after merge.

## Differences found (vs. reference values from piotrkulbacki.com)

1. Person `sameAs`: only 2 of 6 profiles (Facebook, Instagram), different order. Missing LinkedIn, GitHub, TikTok, YouTube.
2. Lyamo brand node `https://lyamo.eu/#lyamo`: type `WebApplication` only (no `Brand`), `url` `https://lyamo.eu/` (trailing slash) instead of `https://lyamo.eu`.
3. Person `@id`, `name`, `url`, all references (author, publisher, WebSite publisher) and Cavunio/Dokiero brand nodes already matched.
4. Old Instagram handle `piotr_kulbacki`: not present anywhere in code or visible links (only in the cross-site note in `otwarte-sprawy.md`).
5. Visible content: the page links only to https://piotrkulbacki.com (footer, landing). None of the six `sameAs` profiles is linked visibly on lyamo.eu. Reported, no new section added; the profiles are visible on the Person's own `url` (piotrkulbacki.com).

## Change

- `OWNER_STRUCTURED_DATA.person.sameAs` (`apps/web/src/lib/legal.ts`, single source): exactly the 6 reference URLs in reference order.
- Lyamo node: `@type: ["Brand", "WebApplication"]`, `url: https://lyamo.eu` (product properties kept). WebSite `url` stays `https://lyamo.eu/`.
- Unit test asserts the brand url/types and the exact `sameAs` list. `<` escaping unchanged (`<`).

## Verification

- `npm run test:quality`: passed (142 unit tests). Build/E2E in PR CI (local build runs `migrate deploy`).
- Rendered JSON-LD preview generated from `buildHomeJsonLd` + `serializeJsonLd`.
- validator.schema.org (code snippet): 0 errors, 0 warnings; WebSite → Person (`@id` `https://cavunio.com/#piotr-kulbacki`, 6 `sameAs`) → brands Lyamo/Cavunio/Dokiero with correct `@id`.
- Rich Results Test (code snippet): Software Apps, 1 valid item, 0 errors, 2 non-critical warnings (optional `aggregateRating`, `offers`). Person with 6 `sameAs` and Brand nodes shown under author/publisher. Both tools display URLs normalized with a trailing slash; the source has none.
