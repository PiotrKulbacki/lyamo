# Postęp projektu — Smart Expense Control

## Fazy projektu

1. **Inicjalizacja Monorepo i CI/CD** — [✅ Zrobione]
2. **Baza Danych (Prisma/Drizzle), Auth i i18n** — [✅ Zrobione]
3. **Wielowalutowość i Skaner AI (In-Memory Buffer)**
4. **Predykcyjny Czat AI i PDF**
5. **PostHog (Flags & Analytics) i Stripe**
6. **UI Dashboard, i18n UI i Sentry**

## Latest Handoff Log

**2026-07-09 — Faza 2.1 (utwardzenie fundamentu przed Fazą 3)**

### Auth guard

- **Web:** `apps/web/src/middleware.ts` — przekierowanie niezalogowanych na `/login`, zalogowanych z `/login`/`/register` na `/`
- Publiczne ścieżki: `/login`, `/register`, `/api/auth/*`, `/api/health`
- **Mobile:** `apps/mobile/src/features/auth/components/AuthGuard.tsx` — redirect + loader w `app/_layout.tsx`

### Supabase — dual connection strings

- `DATABASE_URL` — Transaction Pooler (port **6543**, `?pgbouncer=true`) — runtime aplikacji
- `DIRECT_DATABASE_URL` — Direct connection (port **5432**) — migracje Prisma
- Schemat: `packages/database/prisma/schema.prisma` (`directUrl`)
- Dokumentacja w `.env.example`

### Seed danych deweloperskich

- `packages/database/prisma/seed.ts`
- Skrypt: `npm run db:seed`
- Dev user: `dev@smart-expense.local` / `Secure1!`
- Przykładowe transakcje (PLN/EUR/GBP), recurring expense, kursy walut

### Health check

- `GET /api/health` — status `ok` + ping bazy (`SELECT 1`), publiczny endpoint

**Następny agent:** Rozpocznij Fazę 3 — moduł wielowalutowości (ExchangeRate API + fallback) i skaner AI z In-Memory Buffer.

---

**2026-07-09 — Faza 2 zakończona (Baza, Auth, i18n)**

### ORM & Baza danych

- Wybrano **Prisma** w pakiecie `packages/database/`.
- Schemat: `packages/database/prisma/schema.prisma`
- Migracja inicjalizacyjna: `packages/database/prisma/migrations/20260709120000_init/migration.sql`
- Tabele: `users`, `accounts`, `sessions`, `refresh_tokens`, `transactions`, `recurring_expenses`, `exchange_rates`
- Indeksy: `transactions(userId, date)`, `recurring_expenses(userId, nextDueDate)`
- Klient Prisma: `packages/database/src/index.ts` → import `@smart-expense-control/database`
- Skrypty root: `db:generate`, `db:migrate`, `db:migrate:deploy`, `db:status`, `db:seed`
- Build web: `migrate deploy && next build` (Vercel-ready)

### Walidacja Zod (shared)

- Auth: `packages/shared/src/features/auth/schemas.ts` (`loginSchema`, `registerSchema`, silne hasło)
- Transakcje: `packages/shared/src/features/transactions/schemas.ts` (`createTransactionSchema`, `updateTransactionSchema`)
- Re-export: `packages/shared/src/schemas/index.ts`

### i18n

- Klucze auth + transactions w `packages/shared/src/features/i18n/{en,de,pl,es}.json`
- Helper `t()` i `translateError()` w `packages/shared/src/features/i18n/index.ts`

### Auth Web (`apps/web`)

- t3-env: `apps/web/src/env.ts`
- Route Handlers: `/api/auth/{register,login,logout,me,refresh,google,google/callback}`
- Serwisy: `apps/web/src/features/auth/services/auth.service.ts`
- UI: `/login`, `/register` z toast (sonner) — zero statycznych błędów pod inputami
- Web sesje: httpOnly cookie `sec_session`; Mobile: JWT + refresh token (header `x-client-platform: mobile`)

### Auth Mobile (`apps/mobile`)

- Env: `apps/mobile/src/env.ts` (Zod)
- SecureStore: `apps/mobile/src/features/auth/lib/token-storage.ts`
- Serwis API: `apps/mobile/src/features/auth/services/auth.service.ts`
- Ekrany: `app/login.tsx`, `app/register.tsx` z toast (`react-native-toast-message`)
- Context: `AuthProvider` w `app/_layout.tsx`

## Ostatnie zmiany

**2026-07-09 — Faza 2.1 (utwardzenie fundamentu)**

- Dodano auth guard (middleware web + AuthGuard mobile).
- Skonfigurowano dual Supabase connection strings (`DATABASE_URL` pooler + `DIRECT_DATABASE_URL`).
- Dodano seed deweloperski (`npm run db:seed`) z przykładowym użytkownikiem i danymi.
- Dodano endpoint `GET /api/health` do monitoringu deployu.

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
