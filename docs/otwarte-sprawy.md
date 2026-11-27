# Otwarte sprawy — Lyamo

Aktualizacja: 2026-11-27. Jedyny plik stanu i przekazania pracy. Agent aktualizuje go (nadpisując) po każdym zadaniu i każdym etapie zadania wieloetapowego.

## 1. Stan projektu

- Lyamo: aplikacja budżetu osobistego (cykl wypłaty, paragony z AI, asystent). Monorepo npm/turbo: `apps/web` (Next.js, produkcja https://lyamo.eu na Vercel), `apps/mobile`, `packages/shared` (Zod, i18n PL/EN/DE/ES). Prisma jest właścicielem schematu i migracji; auth własny.
- Wersja językowa strony zależy od cookie `sec_locale` (jeden adres URL dla wszystkich języków, domyślnie `en`). Googlebot nie ma cookie, więc widzi i indeksuje wersję EN. `hreflang` nie dotyczy; adresów językowych nie tworzyć bez decyzji właściciela.
- `main` = produkcja; merge PR przez użytkownika wdraża. Praca na gałęziach `codex/`, PR do `main`. Lokalnie tylko `npm run test:quality`; build, integracja i E2E w CI. Node 26 (`.nvmrc`). Po świeżym klonie/sync może być potrzebne `npm ci`.
- Program bezpieczeństwa kont S00–S10: stan i szczegóły w `docs/security/STATUS.md` (S00–S04 ukończone, S05 scalone w PR #89).
- Raporty zadań spoza programu bezpieczeństwa: `docs/reports/`.
- SEO i dane strukturalne: obowiązuje wspólny standard czterech stron `~/Developer/ebook-shop/docs/seo-encje.md` (wersja 2; nie kopiować go tutaj). JSON-LD strony głównej: `apps/web/src/features/seo/home-json-ld.ts`, dane w `OPERATOR` / `OWNER_STRUCTURED_DATA` (`apps/web/src/lib/legal.ts`), ceny z `packages/shared/src/features/billing/pricing.ts`. Standard v2 wdrożony (PR #94), `jobTitle` i sekcja twórcy DE/ES wdrożone (PR #95); sprawdzone 2026-11-27 według sekcji 11 (wyniki: `docs/reports/2026-11-27-creator-jobtitle-de-es.md`), IndexNow strony głównej wysłany 2026-11-27 (HTTP 200). Po wdrożeniu ze zmianą treści: `npm run indexnow -w web` i nowa data w `apps/web/src/features/seo/sitemap-entries.ts`.

## 2. Decyzje właściciela

- Właściciel: Piotr Kulbacki, jednoosobowa działalność. Dom osoby: https://piotrkulbacki.com/ (`@id` `https://piotrkulbacki.com/#person`); na lyamo.eu tylko odwołanie (`@type`, `@id`, `name`, `url`).
- Wszystkie produkty należą do tej firmy: Lyamo (lyamo.eu), Cavunio (cavunio.com), Dokiero (dokiero.com).
- Formaty i `@id` według sekcji 1.1 i 3 standardu: strona główna i `url` encji z ukośnikiem (`https://lyamo.eu/`), podstrony bez (jak canonical).
- Stopka: „Założyciel: Piotr Kulbacki” z linkiem do piotrkulbacki.com (decyzja 2026-11-27, wzór: stopka sklepu); w „Moje produkty” Cavunio i Dokiero.
- Rola osoby na stronie (sekcja twórcy, FAQ, obrazek logo) = `jobTitle` z 6.3 standardu, nie „Software Engineer” (decyzja 2026-11-27).
- W danych strukturalnych bez ulicy (decyzja 10 standardu, 13.1); pełny adres tylko w Impressum.
- Ceny i kody zostają bez zmian (decyzja 2026-11-27): Pro/Premium według `pricing.ts`, kod `PROMO50` (50%), `LYAMO100`. Promocja nie ma daty końca. Nowe ceny z 13.2 standardu to zadanie na przyszłość (sekcja 5).
- Merge wykonuje wyłącznie użytkownik; bez auto-merge.
- Promocja dwóch darmowych miesięcy pozostaje kuponem Stripe.

## 3. Działania dla właściciela

- Google Search Console i Bing Webmaster Tools są skonfigurowane, mapy przesłane (potwierdzone przez właściciela 2026-11-27). Opcjonalnie po wdrożeniu: „Sprawdzanie adresu URL” (GSC) i „URL Inspection” (Bing) strony głównej (sekcja 11 pkt 4 standardu; wymaga konta właściciela).
- Profil Lyamo w ChatGPT business hub (sekcja 9 standardu): niezrobione, sprawdzić warunki dla aplikacji.
- Program bezpieczeństwa: odbiór S05 i otwarcie nowego czatu dla S06 (polecenie w `docs/security/reports/S05.md`).

## 4. Zadanie w toku

Brak. Ostatnie zadanie: `jobTitle` i tłumaczenia DE/ES sekcji twórcy (PR #95, scalony i wdrożony 2026-11-27); raport `docs/reports/2026-11-27-creator-jobtitle-de-es.md`.

## 5. Inne otwarte sprawy

- **Zadanie na przyszłość: nowe ceny Lyamo (13.2 standardu).** Nie zaczynać bez polecenia właściciela. Plan, kroki (Stripe, Vercel, kod) i kwestie prawne (PAngV § 11 / Omnibus): `docs/reports/2026-11-27-seo-standard-v2.md`, część B. Już rozstrzygnięte: promocja bez daty końca (decyzja 4). Do decyzji przy starcie: 1 (weryfikacja prawna), 2 (sposób pokazania obniżki), 3 (nazwa kodu przy 40%), 5 (istniejący subskrybenci), 6 (ceny w PLN, GBP, USD).
- Rich Results Test (2026-11-27): element Software Apps prawidłowy, ale 8 uwag niekrytycznych „Invalid object type for field priceSpecification” dla `UnitPriceSpecification` w `offers` (Pro, Premium) oraz brak `aggregateRating`. Pole jest opcjonalne, wynik rozszerzony nie jest zablokowany. `UnitPriceSpecification` wynika z 13.2 wspólnego standardu (sekcja tylko dla Lyamo); dokiero.com używa `AggregateOffer` z prostymi `Offer` w EUR bez `priceSpecification`, więc tej uwagi nie ma i zmiana go nie dotyczy. Przyczyna uwagi Google niesprawdzona. Wpływ: brak na indeksowanie i ceny; wynik rozszerzony aplikacji z gwiazdkami i tak wymaga ocen **(wniosek)**. Warianty: (a) zostawić; (b) usunąć `priceSpecification` i zostawić cenę w PLN w `Offer`; (c) osobna `Offer` na każdą walutę bez `priceSpecification`. Rekomendacja **(wniosek)**: (a) do czasu zmiany cen, potem zdecydować razem ze standardem.
- `aggregateRating` / `review` aplikacji tylko z prawdziwych opinii widocznych na stronie.
- Zastany, nieśledzony `docs/plan-api-mcp/` (plan API/MCP) — praca właściciela, nie ruszać bez polecenia.
