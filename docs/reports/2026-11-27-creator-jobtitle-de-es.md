# Kontrola po merge SEO v2, `jobTitle` w sekcji twórcy, DE/ES (2026-11-27)

## Kontrola po merge PR #94 (sekcja 11 standardu `~/Developer/ebook-shop/docs/seo-encje.md`)

- Skrypt zgodności czterech stron: lyamo.eu ma `OnlineBusiness` `https://lyamo.eu/#lyamo`, `WebApplication` `https://lyamo.eu/#app`, `WebSite` `https://lyamo.eu/#website`, osoba `https://piotrkulbacki.com/#person`; zgodnie z sekcją 3. Starego `https://cavunio.com/#piotr-kulbacki` brak na produkcji.
- Schema Markup Validator (https://lyamo.eu/): 0 błędów, 0 ostrzeżeń.
- Rich Results Test (https://lyamo.eu/): 2 prawidłowe elementy (Organization, Software Apps). Software Apps: 9 uwag niekrytycznych: brak `aggregateRating` (opcjonalne) i 8× „Invalid object type for field priceSpecification” (opcjonalne) dla `UnitPriceSpecification` w ofertach Pro i Premium. Opis i warianty: `docs/otwarte-sprawy.md`, sekcja 5.
- `curl` jako OAI-SearchBot, Claude-SearchBot, PerplexityBot, Bingbot, Googlebot na `/`, `/sitemap.xml`, `/robots.txt`, `/llms.txt`: 200.
- `sitemap.xml`: stały `lastmod`, bez `changefreq` i `priority`.
- IndexNow: plik klucza dostępny, `npm run indexnow -w web`: 5 adresów, HTTP 202.

## Zmiany

- Rola w sekcji twórcy (`landing.creator.role`) = `jobTitle` z 6.3 standardu w każdym języku (PL „Projektant stron internetowych i twórca aplikacji”, EN „Web designer and app developer”, DE „Webdesigner und App-Entwickler”, ES „Diseñador web y desarrollador de aplicaciones”). Wcześniej „Twórca Lyamo · Software Engineer”.
- FAQ „Kim jest twórca Lyamo?” (PL, EN): „software engineer” zastąpione `jobTitle`.
- Obrazek `apps/web/public/marketing/creator-lockup.png`: wersja z napisem „WEB DESIGNER & APP DEVELOPER” z `my-business-card/public/brand/ui-lockup-stacked.png` (ten sam rozmiar 502×757). `lockupAlt` w 4 językach opisuje nowy napis.
- DE i ES: pełna sekcja `landing.creator` i `landing.faq.creator`. `body` = opis 6.1 słowo w słowo; tytuł, rola, CTA, teksty alternatywne i FAQ przetłumaczone przez agenta (DE w formie „du”, ES w formie „tú”, jak reszta strony).
- `sitemap-entries.ts`: `lastmod` strony głównej 2026-11-27T15:00:00+01:00.

## Po merge

`npm run indexnow -w web -- https://lyamo.eu/`.
