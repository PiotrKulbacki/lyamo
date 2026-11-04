# Stan programu bezpieczeństwa

Aktualizacja: 2026-11-04. S00 ukończone lokalnie; żadna poprawka aplikacji nie jest jeszcze wdrożona.

Następne zadanie: **S01**. Ostatni raport: [S00](reports/S00.md).

| Zadanie | Stan                  | Raport                |
| ------- | --------------------- | --------------------- |
| S00     | ukończone             | [S00](reports/S00.md) |
| S01     | gotowe do rozpoczęcia | —                     |
| S02     | oczekuje              | —                     |
| S03     | oczekuje              | —                     |
| S04     | oczekuje              | —                     |
| S05     | oczekuje              | —                     |
| S06     | oczekuje              | —                     |
| S07     | oczekuje              | —                     |
| S08     | oczekuje              | —                     |
| S09     | oczekuje              | —                     |
| S10     | oczekuje              | —                     |

Stany: oczekuje / gotowe do rozpoczęcia / w toku / wymaga działania użytkownika / ukończone. Oznacz ukończenie tylko po spełnieniu kryteriów karty; brak połączenia z produkcją nie oznacza, że poprawka została wdrożona.

## Potwierdzone połączenia

2026-11-04 (S00): Supabase MCP i CLI odczytują projekt `lyamo` (`jrusrgsrujbflyoudske`); Stripe MCP potwierdza konto Lyamo w trybie live. GitHub MCP i SSH odczytują repo `PiotrKulbacki/lyamo`; MCP potwierdza admin dla `PiotrKulbacki`, token `gh` nieważny. Vercel CLI niezalogowany i bez powiązania projektu; brak narzędzi Vercel. Publikacja GitHub S00 w toku na polecenie użytkownika; bez zmian w usługach produkcyjnych. Szczegóły: [raport S00](reports/S00.md).

## Środowisko i ograniczenia

- Node 26.13.0 / npm 11.20.0; `.nvmrc`, engines i CI: Node 26. Zależności zainstalowane. Vercel oficjalnie obsługuje 26.x, ustawienia projektu niepotwierdzone.
- Instrukcja izolacji, integracji auth i E2E: [TESTING.md](TESTING.md). Tymczasowy PostgreSQL 16 jest uruchamiany lokalnie bez Dockera. Checki format/lint/typecheck/test (137 testów), integracja (1), E2E (1) i pełny build przeszły.
- Zwykły web build wykonuje migracje. Do lokalnej weryfikacji używaj `npm run build:test`; runner sprawdza własną bazę i nie korzysta z produkcyjnego `.env`.
- Niepotwierdzone: środowisko Supabase, team/projekt/domeny/zmienne Vercel, Stripe test/Sandbox, Google, poczta, Redis i monitoring. Nie blokują lokalnego S01.

## Rejestr kolejnego kroku

S00 ukończone lokalnie na gałęzi `codex/security-s00-test-environment`, baza `5562bfc`; publikacja commit/push/PR w toku. Raport obejmuje zastane instrukcje programu. Następne zadanie: S01, na osobnej gałęzi po zweryfikowaniu bazy zawierającej S00. Po każdym zadaniu agent publikuje commit i PR oraz sprawdza CI; merge wykonuje użytkownik. Gotowe polecenie znajduje się w raporcie S00.
