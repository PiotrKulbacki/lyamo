# Otwarte sprawy — Lyamo

Aktualizacja: 2026-11-26. Jedyny plik stanu i przekazania pracy. Agent aktualizuje go (nadpisując) po każdym zadaniu i każdym etapie zadania wieloetapowego.

## 1. Stan projektu

- Lyamo: aplikacja budżetu osobistego (cykl wypłaty, paragony z AI, asystent). Monorepo npm/turbo: `apps/web` (Next.js, produkcja https://lyamo.eu na Vercel), `apps/mobile`, `packages/shared` (Zod, i18n PL/EN/DE/ES). Prisma jest właścicielem schematu i migracji; auth własny.
- Wersja językowa strony zależy od cookie `sec_locale` (jeden adres URL dla wszystkich języków).
- `main` = produkcja; merge PR przez użytkownika wdraża. Praca na gałęziach `codex/`, PR do `main`. Lokalnie tylko `npm run test:quality`; build, integracja i E2E w CI. Node 26 (`.nvmrc`). Po świeżym klonie/sync może być potrzebne `npm ci`.
- Program bezpieczeństwa kont S00–S10: stan i szczegóły w `docs/security/STATUS.md` (S00–S04 ukończone, S05 scalone w PR #89).
- Raporty zadań spoza programu bezpieczeństwa: `docs/reports/`.
- Dane strukturalne JSON-LD strony głównej: `apps/web/src/features/seo/home-json-ld.ts`; dane właściciela w `OWNER_STRUCTURED_DATA` w `apps/web/src/lib/legal.ts`.

## 2. Decyzje właściciela

- Właściciel: Piotr Kulbacki, jednoosobowa działalność. Strona firmy/wizytówka: https://piotrkulbacki.com — link w stopce zawsze tam prowadzi (`OPERATOR.website`).
- Wszystkie produkty należą do tej firmy: Lyamo (lyamo.eu), Cavunio (cavunio.com), Dokiero (dokiero.com).
- JSON-LD: Person `@id` = `https://cavunio.com/#piotr-kulbacki` (bez zmian, wspólny z innymi stronami), `url` = https://piotrkulbacki.com, `sameAs` = 6 profili w kolejności z piotrkulbacki.com (LinkedIn, Facebook, GitHub, Instagram `piotr.kulbacki`, TikTok `piotr_kulbacki_youtube`, YouTube); marki: `https://lyamo.eu/#lyamo`, `https://cavunio.com/#cavunio`, `https://dokiero.com/#dokiero`. Lyamo: marka `Brand` `https://lyamo.eu/#lyamo`, aplikacja `WebApplication` `https://lyamo.eu/#app`. WebSite `https://lyamo.eu/#website` ma `publisher` = Person.
- Zasada URL we wszystkich projektach: adresy stron/domen bez ukośnika na końcu (np. `https://lyamo.eu`).
- Stopka: sekcja „Moje produkty” z linkami po nazwie (Cavunio, Dokiero, Portfolio → piotrkulbacki.com), dane z `OWNER_STRUCTURED_DATA`/`OPERATOR`. Wzorcem są wartości z piotrkulbacki.com.
- Merge wykonuje wyłącznie użytkownik; bez auto-merge.
- Promocja dwóch darmowych miesięcy pozostaje kuponem Stripe.

## 3. Działania dla właściciela

- Merge PR ze stopką „Moje produkty” i podziałem marka/aplikacja (`codex/footer-products-json-ld-split`), potem Rich Results Test i validator.schema.org dla https://lyamo.eu.
- Poprawki na innych stronach (sekcja 5).
- Program bezpieczeństwa: odbiór S05 i otwarcie nowego czatu dla S06 (polecenie w `docs/security/reports/S05.md`).

## 4. Zadanie w toku

Brak. Ostatnie: stopka „Moje produkty” + podział JSON-LD Lyamo (raport `docs/reports/2026-11-26-footer-products-json-ld-split.md`), czeka na merge.

## 5. Inne otwarte sprawy

- Niespójności JSON-LD między stronami (stan z 2026-11-26, poza tym repo):
  - piotrkulbacki.com: TikTok w `sameAs` to `@piotr_kulbacki`, a na pozostałych stronach `@piotr_kulbacki_youtube`.
  - WebSite `url` z ukośnikiem na końcu na piotrkulbacki.com, cavunio.com, dokiero.com (zasada: bez).
  - cavunio.com: `#cavunio` typu OnlineStore, a pozostałe strony podają Brand. Propozycja: `#cavunio` = Brand, sklep jako osobny węzeł (np. `#store`).
- Zastany, nieśledzony `docs/plan-api-mcp/` (plan API/MCP) — praca właściciela, nie ruszać bez polecenia.
- Profile z `sameAs` nie są linkowane na lyamo.eu (widoczne są linki do piotrkulbacki.com, Cavunio i Dokiero).
- Rich Results Test: Software App poprawny, 2 ostrzeżenia opcjonalne. `offers` można dodać z widocznego cennika (decyzja właściciela); `aggregateRating` wymaga prawdziwych ocen użytkowników widocznych na stronie.
