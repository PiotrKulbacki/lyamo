# Otwarte sprawy — Lyamo

Aktualizacja: 2026-11-27. Jedyny plik stanu i przekazania pracy. Agent aktualizuje go (nadpisując) po każdym zadaniu i każdym etapie zadania wieloetapowego.

## 1. Stan projektu

- Lyamo: aplikacja budżetu osobistego (cykl wypłaty, paragony z AI, asystent). Monorepo npm/turbo: `apps/web` (Next.js, produkcja https://lyamo.eu na Vercel), `apps/mobile`, `packages/shared` (Zod, i18n PL/EN/DE/ES). Prisma jest właścicielem schematu i migracji; auth własny.
- Wersja językowa strony zależy od cookie `sec_locale` (jeden adres URL dla wszystkich języków, domyślnie `en`). Googlebot nie ma cookie, więc widzi i indeksuje wersję EN. `hreflang` nie dotyczy; adresów językowych nie tworzyć bez decyzji właściciela.
- `main` = produkcja; merge PR przez użytkownika wdraża. Praca na gałęziach `codex/`, PR do `main`. Lokalnie tylko `npm run test:quality`; build, integracja i E2E w CI. Node 26 (`.nvmrc`). Po świeżym klonie/sync może być potrzebne `npm ci`.
- Program bezpieczeństwa kont S00–S10: stan i szczegóły w `docs/security/STATUS.md` (S00–S04 ukończone, S05 scalone w PR #89).
- Raporty zadań spoza programu bezpieczeństwa: `docs/reports/`.
- SEO i dane strukturalne: obowiązuje wspólny standard czterech stron `~/Developer/ebook-shop/docs/seo-encje.md` (wersja 2; nie kopiować go tutaj). JSON-LD strony głównej: `apps/web/src/features/seo/home-json-ld.ts`, dane w `OPERATOR` / `OWNER_STRUCTURED_DATA` (`apps/web/src/lib/legal.ts`), ceny z `packages/shared/src/features/billing/pricing.ts`.

## 2. Decyzje właściciela

- Właściciel: Piotr Kulbacki, jednoosobowa działalność. Dom osoby: https://piotrkulbacki.com/ (`@id` `https://piotrkulbacki.com/#person`); na lyamo.eu tylko odwołanie (`@type`, `@id`, `name`, `url`).
- Wszystkie produkty należą do tej firmy: Lyamo (lyamo.eu), Cavunio (cavunio.com), Dokiero (dokiero.com).
- Formaty i `@id` według sekcji 1.1 i 3 standardu: strona główna i `url` encji z ukośnikiem (`https://lyamo.eu/`), podstrony bez (jak canonical).
- Stopka: „Założyciel: Piotr Kulbacki” z linkiem do piotrkulbacki.com (decyzja 2026-11-27, wzór: stopka sklepu); w „Moje produkty” Cavunio i Dokiero.
- W danych strukturalnych bez ulicy (decyzja 10 standardu, 13.1); pełny adres tylko w Impressum.
- Merge wykonuje wyłącznie użytkownik; bez auto-merge.
- Promocja dwóch darmowych miesięcy pozostaje kuponem Stripe.

## 3. Działania dla właściciela

- Merge PR „SEO według standardu v2” (gałąź `codex/seo-standard-v2`), potem agent robi kontrolę z sekcji 11 i zgłoszenie IndexNow (etap 9 niżej).
- Sekcja 9 standardu dla lyamo.eu: Google Search Console (usługa domeny przez DNS, mapa `https://lyamo.eu/sitemap.xml`, „Sprawdzanie adresu URL” strony głównej po wdrożeniu), Bing Webmaster Tools (import z GSC, „URL Inspection”), profil Lyamo w ChatGPT business hub (sprawdzić warunki dla aplikacji).
- Część B (nowe ceny z 13.2 standardu): decyzje 1–6 w `docs/reports/2026-11-27-seo-standard-v2.md`. Bez zgody nic nie jest zmieniane w kodzie ani w Stripe.
- Program bezpieczeństwa: odbiór S05 i otwarcie nowego czatu dla S06 (polecenie w `docs/security/reports/S05.md`).

## 4. Zadanie w toku: SEO według standardu v2 (gałąź `codex/seo-standard-v2`)

Raport: `docs/reports/2026-11-27-seo-standard-v2.md`. Etapy części A:

1. [x] JSON-LD według szablonu 5.3: `#lyamo` (`OnlineBusiness`), `#app` (`offers` z `pricing.ts`), `#website`; osoba tylko jako odwołanie.
2. [x] `legal.ts`: nowe `@id` osoby, adresy z ukośnikiem, bez `sameAs` i `@id` innych marek.
3. [x] Stopka: „Założyciel: Piotr Kulbacki” zamiast „Portfolio” (PL/EN/DE/ES).
4. [x] Sekcja twórcy: opis z 6.1 (PL, EN).
5. [x] Sitemap: stały `lastmod` per ścieżka, bez `changefreq` i `priority`. Przy istotnej zmianie strony aktualizować datę w `sitemap-entries.ts`.
6. [x] IndexNow: klucz w `apps/web/public/`, `npm run indexnow -w web` po każdym wdrożeniu ze zmianą treści.
7. [x] `llms.txt` (`/llms.txt`).
8. [x] Checki lokalne (`test:quality`, `build:test`); PR do `main`, wynik CI w odpowiedzi agenta.
9. [ ] Po merge: Schema Markup Validator i Rich Results Test dla https://lyamo.eu/, ręczny przegląd `@id`/typów (sekcja 3), skrypt zgodności czterech stron, `curl` jako OAI-SearchBot/Claude-SearchBot/PerplexityBot/Bingbot (200), sitemap bez `changefreq`/`priority`, `npm run indexnow -w web`; wynik zapisać tutaj.

Stan przed merge (2026-11-27): piotrkulbacki.com, cavunio.com, dokiero.com już według v2; lyamo.eu jeszcze ze starym `@id` osoby. Roboty z tabeli 8.1 dostają 200 na stronach publicznych; BotID nie jest używany. Firewalla Vercel nie dało się odczytać (Vercel MCP nie widzi projektu lyamo).

## 5. Inne otwarte sprawy

- Zastany, nieśledzony `docs/plan-api-mcp/` (plan API/MCP) — praca właściciela, nie ruszać bez polecenia.
- Sprzeczność z 6.3 standardu (poza zakresem, decyzja właściciela): sekcja twórcy ma rolę „Twórca Lyamo · Software Engineer”, FAQ „Kim jest twórca Lyamo?” mówi „software engineer”, a obrazek `public/marketing/creator-lockup.png` ma napis „SOFTWARE ENGINEER”. Standard zastępuje to `jobTitle` „Projektant stron internetowych i twórca aplikacji”. Propozycja: nowe teksty roli i FAQ z 6.3 oraz nowy obrazek albo jego usunięcie.
- DE i ES nie mają tłumaczeń `landing.creator` ani `landing.faq.creator` i pokazują EN. Opis z 6.1 jest zatwierdzony w DE i ES, ale tytuł, rola i CTA wymagają tłumaczenia.
- `aggregateRating` / `review` aplikacji tylko z prawdziwych opinii widocznych na stronie; bez nich Google nie pokaże wyniku rozszerzonego Software App („You must include one of the following properties”).
