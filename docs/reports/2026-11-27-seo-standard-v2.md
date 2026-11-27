# SEO lyamo.eu według wspólnego standardu v2 (2026-11-27)

Standard: `~/Developer/ebook-shop/docs/seo-encje.md` (wersja 2, stan 2026-11-26), wiersz lyamo.eu w sekcji 12, szablon 5.3. Standardu nie zmieniano.

## Część A: zmiany w kodzie

- **JSON-LD strony głównej** (`apps/web/src/features/seo/home-json-ld.ts`), kolejność jak w 5.3:
  - `https://lyamo.eu/#lyamo`: `Brand` → `OnlineBusiness` z `legalName`, `url` `https://lyamo.eu/`, `logo` (`lyamo-mark.png`, 144×144 px), `description`, `email`, `vatID` (tylko gdy ustawione `NEXT_PUBLIC_UST_IDNR`; na produkcji jest), `address` oraz `founder` jako odwołanie do osoby.
  - `https://lyamo.eu/#app` (`WebApplication`): `author` → osoba, `publisher` → `#lyamo`, `applicationCategory` `FinanceApplication` (jest na liście Google: developers.google.com/search/docs/appearance/structured-data/software-app), `offers` według 13.2. Bez `aggregateRating` i `review`.
  - `https://lyamo.eu/#website`: `publisher` → `#lyamo`, `url` z ukośnikiem.
  - Osoba tylko jako odwołanie (`@id` `https://piotrkulbacki.com/#person`). Usunięte: pełny węzeł `Person`, `sameAs`, `brand`, węzły Cavunio i Dokiero, stare `@id` `https://cavunio.com/#piotr-kulbacki`.
- **`offers`**: jedna `Offer` na plan (Free, Pro, Premium), ceny regularne z `pricing.ts`, bez PROMO50. Google wymaga `offers.price`, więc `Offer.price` / `priceCurrency` podaje cenę w walucie, którą cennik pokazuje najpierw (`DEFAULT_BILLING_CURRENCY` = PLN, wspólna stała z `LandingPage`). Cena w każdej z 4 walut jest w `priceSpecification` jako `UnitPriceSpecification` z `billingDuration: "P1M"` (schema.org: `billingDuration` służy np. do opisu czasu trwania subskrypcji). Model z jedną ofertą i ceną w wielu walutach to **(wniosek)**: Google nie opisuje `priceSpecification` dla aplikacji.
- **Adres**: kod pocztowy, miasto i kraj z `OPERATOR`, **bez ulicy**. Decyzja 10 standardu (13.1) wyklucza ulicę w danych strukturalnych; tak samo robi cavunio.com. Pełny adres zostaje w Impressum.
- **`legal.ts`**: nowe `@id` osoby, `url` z ukośnikiem (`OPERATOR.website`, `siteUrl`, `otherBrands`), dodany `countryCode`, usunięte `sameAs` osoby i `@id` innych marek (poza grafem nic ich nie używało). Komentarz o adresach bez ukośnika zastąpiony odwołaniem do sekcji 1.1.
- **Stopka**: „Portfolio” zastąpione przez „Założyciel / Founder / Gründer / Fundador: Piotr Kulbacki” z linkiem do `https://piotrkulbacki.com/`. Link z nazwiskiem w linii copyright usunięty, żeby się nie dublował. Cavunio i Dokiero zostają.
- **Sekcja twórcy**: `landing.creator.body` (PL, EN) = opis z sekcji 6.1, słowo w słowo. DE i ES nie mają tłumaczeń tej sekcji i pokazują wersję EN (stan sprzed zadania).
- **`og:site_name`** z `OPERATOR.productName` („Lyamo”), zgodne z `WebSite.name` i `<title>` (8.4).
- **Sitemap**: stały `lastmod` dla każdej ścieżki (ISO 8601 ze strefą; data ostatniej istotnej zmiany według historii git), bez `changefreq` i `priority`. Trasa `sitemap.xml/route.ts` bez zmian.
- **IndexNow**: klucz `apps/web/public/635a7949c2d169b7d1800ca6b9ee12e6.txt` (publiczny z definicji), skrypt `apps/web/scripts/indexnow.mjs` (`npm run indexnow -w web`), wzór ze sklepu.
- **`llms.txt`**: `apps/web/src/app/llms.txt/route.ts` + `features/seo/llms-txt.ts` (wzór sklepu): opis, założyciel, inne marki, plany z cenami regularnymi i funkcjami (z tych samych stałych i tłumaczeń), linki prawne.
- **robots.txt**: bez zmian (zgodny z 8.1). BotID nie jest używany w kodzie. Firewalla Vercel nie dało się odczytać (Vercel MCP nie widzi projektu lyamo). `curl` jako OAI-SearchBot, Claude-SearchBot, PerplexityBot, bingbot, Googlebot, GPTBot i ClaudeBot na `/`, `/sitemap.xml`, `/robots.txt` i `/impressum` zwraca 200 (2026-11-27).
- **hreflang**: nie dotyczy (jeden URL, cookie `sec_locale`, domyślnie `en`); Googlebot widzi wersję EN.

## Weryfikacja przed PR

`npm run test:quality` (format, lint, typecheck, testy: 149/149) oraz `npm run build:test` (izolowana baza `lyamo_security_test` na 127.0.0.1) przechodzą. `llms.txt`, `sitemap.xml` i `robots.txt` są generowane statycznie.

Zgodność czterech stron (skrypt z sekcji 11, produkcja przed merge): piotrkulbacki.com, cavunio.com i dokiero.com już według v2; lyamo.eu ma jeszcze `Brand` i stare `@id` osoby. Ten PR to usuwa.

## Część B: nowe ceny (13.2). Tylko plan, bez zmian

Kroki po zgodzie właściciela:

1. Stripe live: nowe miesięczne Price dla Pro (10 €) i Premium (14 €) w EUR; pozostałe 3 waluty ustawia właściciel. Kupon promocyjny 40% (nowy kod albo zmiana PROMO50, patrz decyzje).
2. Vercel: nowe `STRIPE_PRO_PRICE_*` / `STRIPE_PREMIUM_PRICE_*` w Production (i Preview), przed merge zmian w kodzie.
3. Kod: `PRO_SUBSCRIPTION_PRICES` / `PREMIUM_SUBSCRIPTION_PRICES`, `PRO_PROMO_DISCOUNT_PERCENT` = 40, ewentualnie `PRO_PROMO_CODE`, teksty promocji w 4 językach, testy `pricing.test.ts`. JSON-LD i `llms.txt` pobiorą nowe ceny same; zmiana `lastmod` strony głównej w `sitemap-entries.ts`.
4. Istniejący subskrybenci: zostają na starych Price, chyba że właściciel zdecyduje inaczej.

Prawo (**WYMAGA WERYFIKACJI**):

- PAngV § 11 Abs. 1 (gesetze-im-internet.de/pangv_2022/__11.html): przy „Bekanntgabe einer Preisermäßigung für eine Ware” trzeba podać „den niedrigsten Gesamtpreis”, stosowany wobec konsumentów w ciągu 30 dni przed obniżką. Paragraf mówi tylko o „Waren”, a § 1 obejmuje „Waren oder Leistungen”. Czy subskrypcja aplikacji podlega § 11: niesprawdzone. Abs. 4 Nr. 1 wyłącza „individuelle Preisermäßigungen”; czy kod rabatowy dostępny dla wszystkich jest taką obniżką: niesprawdzone. Lyamo sprzedaje też w Polsce (PLN); tamtejsza implementacja Omnibus niesprawdzona.
- Ryzyko **(wniosek)**: podniesienie ceny regularnej z 8 € do 10 € i od razu pokazanie przekreślonych 10 € z promocją 6 € wygląda jak sztuczna obniżka, bo przez ostatnie 30 dni cena wynosiła 8 € (z kodem 4 €).

Decyzje dla właściciela:

1. Czy sprawdzić § 11 / Omnibus u prawnika lub w IHK przed wdrożeniem?
2. Przekreślona cena: (a) pokazywać dopiero po 30 dniach od podniesienia ceny regularnej, (b) zamiast przekreślenia podawać „najniższa cena z 30 dni”, czy (c) bez przekreślenia, sama informacja o kodzie?
3. Kod: zmienić PROMO50 na nowy (np. PROMO40), czy zostawić nazwę przy rabacie 40%?
4. Czy promocja ma termin końca?
5. Istniejący subskrybenci: stara cena na stałe, czy migracja z wyprzedzeniem?
6. Ceny w PLN, GBP i USD: podaje właściciel.

## Po merge (sekcja 11 standardu)

Schema Markup Validator i Rich Results Test dla https://lyamo.eu/, ręczny przegląd `@id` i typów, skrypt zgodności czterech stron, `curl` jako roboty, sitemap ze stałym `lastmod`, `npm run indexnow -w web`.
