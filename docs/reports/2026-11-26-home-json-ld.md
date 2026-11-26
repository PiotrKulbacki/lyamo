# Home page JSON-LD (owner and brands) — 2026-11-26

Status: implemented; local quality checks passed. Publication and CI results are reported with the PR.

## Change

No JSON-LD existed before. The home page (`/`, all locales; locale comes from the `sec_locale` cookie like the rest of the SEO metadata) now renders one `application/ld+json` `@graph`:

- `WebApplication` `https://lyamo.eu/#lyamo`, `applicationCategory: FinanceApplication`, logo `/lyamo-mark.png` (144×144), description = existing `seo.home.description` translation; author/publisher → Person.
- `Person` `https://cavunio.com/#piotr-kulbacki` (same `@id` as cavunio.com), `sameAs` Facebook/Instagram, `brand`: Lyamo (by `@id`), Cavunio, Dokiero.
- `WebSite` `https://lyamo.eu/#website`, `inLanguage` = request locale, publisher → product.

Owner data lives in `OWNER_STRUCTURED_DATA` in `apps/web/src/lib/legal.ts` (next to `OPERATOR`, name reused from it). IDs/URLs are fixed to `https://lyamo.eu`, not `NEXT_PUBLIC_APP_URL`, so previews never emit foreign identifiers. Serialization replaces `<` with `<` (unit-tested against `</script>` injection).

## Verification

`npm run test:quality` passed (format, lint, typecheck, 142 unit tests). Full build/E2E in PR CI.

After merge and deploy: run Google Rich Results Test and validator.schema.org on https://lyamo.eu.
Expected notes: Rich Results has no rich result type for WebApplication without `offers` and `aggregateRating`/`review` (not added: no real pricing/rating data in this change). validator.schema.org may flag `publisher` → WebApplication and `brand` → WebApplication as unexpected types (schema.org expects Organization/Person and Brand/Organization); kept as specified by the owner.

Note: `OPERATOR.website` (Impressum/footer link) is still `https://piotrkulbacki.com`, while the Person `url` is `https://cavunio.com`; unchanged, out of scope.
