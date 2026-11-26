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
- JSON-LD: Person `@id` = `https://cavunio.com/#piotr-kulbacki` (bez zmian, wspólny z innymi stronami), `url` = https://piotrkulbacki.com; marki: `https://lyamo.eu/#lyamo`, `https://cavunio.com/#cavunio`, `https://dokiero.com/#dokiero`. WebSite `https://lyamo.eu/#website` ma `publisher` = Person.
- Merge wykonuje wyłącznie użytkownik; bez auto-merge.
- Promocja dwóch darmowych miesięcy pozostaje kuponem Stripe.

## 3. Działania dla właściciela

- Merge PR #91 (JSON-LD strony głównej), potem Rich Results Test i validator.schema.org dla https://lyamo.eu.
- Decyzja o spójności tożsamości między stronami (patrz sekcja 5).
- Program bezpieczeństwa: odbiór S05 i otwarcie nowego czatu dla S06 (polecenie w `docs/security/reports/S05.md`).

## 4. Zadanie w toku

JSON-LD właściciela i marek na stronie głównej — gałąź `codex/home-json-ld`, PR #91.

- Etap 1: graf WebApplication + Person + WebSite, escapowanie `<` — zrobione.
- Etap 2: Person `url` → piotrkulbacki.com, `@id` marek Cavunio/Dokiero, WebSite `publisher` → Person, utworzenie tego pliku — zrobione.
- Następny krok: merge przez użytkownika i walidacja na produkcji.

## 5. Inne otwarte sprawy

- Niespójności JSON-LD między stronami (stan z 2026-11-26, poza tym repo):
  - piotrkulbacki.com używa innych identyfikatorów (`https://piotrkulbacki.com/#person`, `#organization`) niż wspólny `https://cavunio.com/#piotr-kulbacki`, więc wyszukiwarki widzą dwie osoby.
  - Instagram: piotrkulbacki.com podaje `piotr_kulbacki`, a Lyamo i Cavunio `piotr.kulbacki` — jeden adres jest prawdopodobnie błędny.
  - cavunio.com: Person `url` nadal https://cavunio.com, a marka Lyamo bez `@id` `https://lyamo.eu/#lyamo`.
  - `#cavunio` jest tam typu OnlineStore, `#dokiero` typu SoftwareApplication, a Lyamo opisuje je jako Brand (te same `@id`, różne typy).
- Zastany, nieśledzony `docs/plan-api-mcp/` (plan API/MCP) — praca właściciela, nie ruszać bez polecenia.
- WebApplication bez `offers`/`aggregateRating` nie kwalifikuje się do wyników rozszerzonych Google; dodanie wymaga prawdziwych danych cenowych.
