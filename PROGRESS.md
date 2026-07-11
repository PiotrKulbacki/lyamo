# Postęp projektu — Smart Expense Control

## Fazy projektu

1. **Inicjalizacja Monorepo i CI/CD** — [✅ Zrobione]
2. **Baza Danych (Prisma/Drizzle), Auth i i18n** — [✅ Zrobione]
3. **Wielowalutowość i Skaner AI (In-Memory Buffer)** — [✅ Zrobione]
4. **Predykcyjny Czat AI (Asystent Finansowy)** — [✅ Zrobione]
5. **PostHog (Flags & Analytics) i Stripe** — [✅ Zrobione]
6. **UI Dashboard, i18n UI i Sentry**

## Latest Handoff Log

**2026-07-10 — Faza 5 zamknięta + utwardzenie billingu. Gotowość do Fazy 6.**

### Stripe — webhooki, idempotency i plany

- **Route:** `POST /api/webhooks/stripe` — weryfikacja podpisu, raw body.
- **Idempotency:** `stripe-webhook-idempotency.ts` + tabela `processed_stripe_events` (claim → process → complete; retry po błędzie).
- **Serwis:** `stripe-webhook.service.ts`
- **Obsługiwane zdarzenia:**
  - `checkout.session.completed` → PRO, `stripeCustomerId`, reset liczników, `financialMonthStartDay` = dzień wykupu.
  - `customer.subscription.updated` → PRO przy `active`/`trialing`/`past_due` (grace 24h); FREE po wygaśnięciu grace lub `canceled`/`unpaid`; **anulowanie na koniec okresu** (`cancel_at_period_end`) = nadal PRO do końca opłaconego okresu.
  - `customer.subscription.deleted` → FREE (koniec opłaconego okresu).
- **Grace `past_due`:** 24h PRO, potem downgrade (cron `GET /api/cron/downgrade-past-due` co godzinę).
- **Analityka:** `subscription_upgraded` przy FREE → PRO.

### Reset limitów AI (Vercel Cron)

- **Route:** `GET /api/cron/reset-quotas` — zeruje liczniki użytkowników, u których dziś jest `financialMonthStartDay` i minął okres od `lastQuotaResetAt`.
- **Reguła (FREE i PRO):** jeden cykl — dzień `financialMonthStartDay` (domyślnie dzień rejestracji; przy upgrade PRO = dzień wykupu).
- **Harmonogram:** `5 0 * * *` (codziennie 00:05 UTC) — `apps/web/vercel.json`.
- **Pola User:** `financialMonthStartDay` (1–28), `lastQuotaResetAt`, `pastDueSince`.
- **Shared:** `packages/shared/src/features/billing/financial-month.ts`.

### PostHog — analityka i feature flags

- **Klient:** `posthog-client.ts` + `PostHogProvider` w `layout.tsx`.
- **Serwer:** `posthog-server.ts` — eventy z API.
- **Eventy:** `ai_scan_completed`, `ai_chat_message_sent`, `subscription_upgraded`.
- **Feature flags:** `useFeatureFlag(flagKey)` — gotowe na Fazę 6.

### Rate limiting (Upstash Redis)

- **Moduł:** `apps/web/src/lib/rate-limit.ts`
- **Limity:** 5 req/min **osobno** dla skanu (`sec:ai:scan`) i czatu (`sec:ai:chat`).
- **Produkcja:** fail-closed bez Upstash env (429); dev: fail-open.
- **Odpowiedź:** HTTP 429 + `api.errors.rateLimitExceeded` (toast).

### Predykcyjny czat AI (asystent finansowy) — Faza 4

- **Route:** `POST /api/ai/chat` — JSON `{ message, locale?, history? }`.
- **Serwisy:**
  - `apps/web/src/features/ai/services/chat.service.ts` — orkiestracja (Prisma, quota, OpenAI).
  - `apps/web/src/features/ai/services/chat-context.ts` — czysta logika: agregacja transakcji (`aggregateFinancialContext`) i budowa system promptu (`buildChatSystemPrompt`).
- **Kontekst dla modelu** (pobierany z Prisma przed wywołaniem OpenAI):
  - sumy wydatków bieżącego miesiąca po kategoriach (`categoryTotals`),
  - łączna kwota wydatków w miesiącu (bez konwersji walut),
  - ostatnie 15 transakcji (`recentTransactions`).
- **Model:** `gpt-4o-mini`; odpowiedzi w języku użytkownika (`locale`: en/de/pl/es).
- **Limity:** FREE 10 wiadomości/mies., PRO bez limitu (`UNLIMITED_QUOTA`). Licznik `monthlyAiChatCount` inkrementowany po udanej odpowiedzi.
- **Schematy:** `packages/shared/src/features/ai/schemas.ts` — `chatRequestSchema`, kody błędów `chat.*`.
- **Auth:** `getAuthenticatedUser()` w route handlerze (cookie web + Bearer JWT mobile).
- **Błędy UI:** wyłącznie przez **toast** (sonner) — nigdy inline pod oknem czatu.

### Wspólne limity planów (quota)

| Funkcja        | FREE/mies. | PRO/mies.  |
| -------------- | ---------- | ---------- |
| Skan paragonów | 3          | 150        |
| Czat AI        | 10         | bez limitu |

- **Shared:** `packages/shared/src/features/billing/plan-limits.ts` — `getAiChatQuotaStatus()`.
- **DB:** `User.monthlyAiChatCount`, `financialMonthStartDay`, `lastQuotaResetAt`, `pastDueSince` (migracja `20260710160000_billing_quota_and_stripe_idempotency`).

### i18n (Fazy 4–5)

Klucze `chat.*`, `scanner.*`, `api.errors.rateLimitExceeded` w `en`, `pl`, `de`, `es`. Błędy zwracane jako klucze i18n — klient wyświetla je przez **toast**.

### Świadomie odłożone (kolejne fazy)

- `GET /api/ai/chat-quota` — analog do `scan-quota` (przydatne w UI Fazy 6).
- UI czatu, dashboard, Sentry — Faza 6.
- Checkout Stripe (UI upgrade) — Faza 6 (webhooki gotowe).
- Zmiana dnia wypłaty w ustawieniach (Faza 6) — wpływ na miesiąc finansowy dashboardu.

---

## Plan na przyszłe fazy

### Faza 6 — UI Dashboard, i18n UI i Sentry

- Dashboard wydatków z wielowalutowością.
- **UI czatu AI** z limitami planów (analogicznie do skanera paragonów).
- Formularz potwierdzenia draftów transakcji ze skanera paragonów.
- Błędy wyłącznie przez **toast** (sonner).
- Pole `primaryCurrency` na `User` + wybór w ustawieniach.
- Zmiana `financialMonthStartDay` (dzień wypłaty) w ustawieniach.
- Sentry: monitoring błędów AI i API.

---

## Ostatnie zmiany

**2026-07-10 — Utwardzenie Fazy 5 (idempotency, grace past_due, cykl limitów, rate limit)**

- Idempotency webhooków Stripe (`processed_stripe_events`, `stripe-webhook-idempotency.ts`).
- Grace `past_due`: 24h PRO, cron `downgrade-past-due` co godzinę.
- Anulowanie subskrypcji: PRO do końca opłaconego okresu (`active` + `cancel_at_period_end`).
- Reset limitów: `financialMonthStartDay` (rejestracja / dzień wykupu PRO), cron dzienny.
- Rate limit: osobne kubełki scan/chat, fail-closed w produkcji.
- Optymalizacja AI serwisów (jeden odczyt planu przy quota check).
- Migracja `20260710160000_billing_quota_and_stripe_idempotency`.
- Testy: `financial-month.test.ts`, rozszerzone `stripe-webhook.service.test.ts`.

**2026-07-10 — Faza 5 zakończona (Stripe webhooki, PostHog, rate limiting, cron reset)**

- Webhook Stripe: `POST /api/webhooks/stripe` + serwis `stripe-webhook.service.ts` (FREE ↔ PRO).
- Cron reset limitów: `GET /api/cron/reset-quotas` + `vercel.json` (1. dzień miesiąca).
- PostHog: provider klienta, capture serwerowy, eventy AI i `subscription_upgraded`.
- Rate limiting Upstash: 5 req/min na endpointach AI (`apps/web/src/lib/rate-limit.ts`).
- Zaktualizowano `.env.example`, `env.ts`, `turbo.json`, i18n (`api.errors.rateLimitExceeded`).
- Testy: `stripe-webhook.service.test.ts`.

**2026-07-10 — Domknięcie Fazy 4 (testy czatu + refaktoryzacja kontekstu)**

- Wydzielono `chat-context.ts` — testowalna agregacja transakcji i budowa system promptu.
- Dodano testy jednostkowe: `chat-context.test.ts`, `chat.service.test.ts`.
- Skonfigurowano aliasy Vitest w `apps/web/vitest.config.ts`.
- Uaktualniono `PROGRESS.md` — Faza 4 zamknięta, gotowość do Fazy 5.

**2026-07-10 — Usunięcie analizy PDF z zakresu; Faza 4 odchudzona do czatu AI**

- Usunięto endpoint `/api/ai/analyze-statement`, serwis `statement-analyzer.service.ts`, zależność `pdf-parse`.
- Usunięto limity i licznik `monthlyAiPdfAnalysisCount` z planów i schematu Prisma.
- Zaktualizowano dokumentację (`PROGRESS.md`, `ARCHITECTURE.md`) i reguły agenta (`.cursorrules`).
- Zachowano pełną implementację predykcyjnego czatu AI z kontekstem transakcji z bazy.

**2026-07-09 — Limity planów skanera AI (FREE 3 / PRO 150)**

- Wspólne limity w `@shared/features/billing/plan-limits.ts`.
- Rozdzielone komunikaty i18n: `quotaExceeded` (FREE) vs `monthlyLimitReached` (PRO).
- Endpoint `GET /api/ai/scan-quota` dla przyszłego UI (widoczny, zablokowany przycisk).
- Testy jednostkowe limitów planów.

**2026-07-09 — Faza 3 zakończona**

- Moduł walut: frankfurter.app + cache w `exchange_rates` + fallback.
- Skaner paragonów AI: in-memory buffer, Zod, quota, draft bez auto-zapisu.
- CRUD `Transaction` i `RecurringExpense` z pełnym API.
- i18n dla skanera, walut, transakcji cyklicznych (4 języki).
- Middleware: `/api/*` z własną autoryzacją (wsparcie mobile Bearer).

**2026-07-09 — Faza 2 zamknięta (weryfikacja E2E)**

- Zastosowano migrację na Supabase i seed danych deweloperskich.
- Naprawiono ładowanie `.env` w dev (błąd 500 „Invalid environment variables” przy logowaniu).
- Potwierdzono działanie auth: `POST /api/auth/login` → **200 OK**.
- Zaktualizowano `.env.example` (dual Supabase URLs, uwagi o haśle).

**2026-07-09 — Faza 2.1 (utwardzenie fundamentu)**

- Dodano auth guard (middleware web + AuthGuard mobile).
- Skonfigurowano dual Supabase connection strings (`DATABASE_URL` pooler + `DIRECT_DATABASE_URL`).
- Dodano seed deweloperski (`npm run db:seed`) z przykładowym użytkownikiem i danymi.
- Dodano endpoint `GET /api/health` do monitoringu deployu.
- Naprawiono CI: Turbo `globalPassThroughEnv`, job-level env, Prettier formatting.

**2026-07-09 — Faza 2 zakończona**

- Zainicjowano Prisma ORM z pełnym schematem domenowym i migracją SQL.
- Wdrożono wspólne schematy Zod (auth, transactions) i t3-env (web + mobile).
- Zaimplementowano Auth: Email/Hasło + Google OAuth (web), JWT + SecureStore (mobile).
- Rozszerzono i18n o klucze auth/transactions w 4 językach.
- Zaktualizowano CI (Postgres service, env vars dla buildu).

**2026-07-09 — Faza 1.1 (uzupełnienie fundamentu)**

- Dodano `README.md` z onboardingiem i opisem aplikacji (AI paragony, czat, waluty PLN/EUR/GBP, Stripe).
- Dodano `.env.example` ze szkieletem zmiennych publicznych i tajnych.
- Rozszerzono CI: `format`, `typecheck`, `build` + trigger na Pull Request do `dev`.
- Utworzono scaffold Zod w `packages/shared/src/schemas/` (`loginSchema`).
- Dodano `.vscode/extensions.json`, `.nvmrc` i `engines` w `package.json`.

**2026-07-09 — Faza 1 zakończona**

- Zainicjowano repozytorium Git z gałęziami `main` (produkcja) i `dev` (domyślna robocza).
- Utworzono monorepo Turborepo: `apps/web` (Next.js 15), `apps/mobile` (Expo 53), `packages/shared`.
- Skonfigurowano CI (`.github/workflows/ci.yml`) — lint + test przy pushu do `dev`.
- Wdrożono Prettier (100 znaków, `prettier-plugin-tailwindcss`) i `.vscode/settings.json`.
- Skonfigurowano Path Aliases: `@shared/*`, `@web/*`, `@mobile/*`.
- Utworzono `.cursorrules`, `ARCHITECTURE.md` oraz scaffold i18n (`en`, `de`, `pl`, `es`).
