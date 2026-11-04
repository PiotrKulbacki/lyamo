# Stan programu bezpieczeństwa

Aktualizacja: 2026-11-04. S00 scalone do dev (PR #74). S01 ukończone lokalnie; publikacja i CI w toku, bez potwierdzonego wdrożenia.

Następne zadanie: **S01**. Ostatni raport: [S00](reports/S00.md).

| Zadanie | Stan      | Raport                |
| ------- | --------- | --------------------- |
| S00     | ukończone | [S00](reports/S00.md) |
| S01     | w toku    | —                     |
| S02     | oczekuje  | —                     |
| S03     | oczekuje  | —                     |
| S04     | oczekuje  | —                     |
| S05     | oczekuje  | —                     |
| S06     | oczekuje  | —                     |
| S07     | oczekuje  | —                     |
| S08     | oczekuje  | —                     |
| S09     | oczekuje  | —                     |
| S10     | oczekuje  | —                     |

Stany: oczekuje / gotowe do rozpoczęcia / w toku / wymaga działania użytkownika / ukończone. Oznacz ukończenie tylko po spełnieniu kryteriów karty; brak połączenia z produkcją nie oznacza, że poprawka została wdrożona.

## Potwierdzone połączenia

2026-11-04 (S00): Supabase MCP i CLI odczytują projekt `lyamo` (`jrusrgsrujbflyoudske`); Stripe MCP potwierdza konto Lyamo w trybie live. GitHub MCP i SSH odczytują repo `PiotrKulbacki/lyamo`; MCP potwierdza admin dla `PiotrKulbacki`, token `gh` nieważny. Vercel CLI niezalogowany i bez powiązania projektu; brak narzędzi Vercel. S00 opublikowano w GitHub na polecenie użytkownika; bez zmian w usługach produkcyjnych. Szczegóły: [raport S00](reports/S00.md).

## Środowisko i ograniczenia

- Node 26.13.0 / npm 11.20.0; `.nvmrc`, engines i CI: Node 26. Zależności zainstalowane. Vercel oficjalnie obsługuje 26.x, ustawienia projektu niepotwierdzone.
- Instrukcja izolacji, integracji auth i E2E: [TESTING.md](TESTING.md). Tymczasowy PostgreSQL 16 jest uruchamiany lokalnie bez Dockera. Checki format/lint/typecheck/test (137 testów), integracja (1), E2E (1) i pełny build przeszły.
- Zwykły web build wykonuje migracje. Do lokalnej weryfikacji używaj `npm run build:test`; runner sprawdza własną bazę i nie korzysta z produkcyjnego `.env`.
- Niepotwierdzone: środowisko Supabase, team/projekt/domeny/zmienne Vercel, Stripe test/Sandbox, Google, poczta, Redis i monitoring. Nie blokują lokalnego S01.

## Rejestr kolejnego kroku

S00 ukończone lokalnie na gałęzi `codex/security-s00-test-environment`, baza `5562bfc`; commit implementacji `1bea54a`, push wykonany, [PR #74 do dev](https://github.com/PiotrKulbacki/lyamo/pull/74). CI w momencie zapisu: w toku; [aktualne checki](https://github.com/PiotrKulbacki/lyamo/pull/74/checks). Merge pozostaje użytkownikowi. Raport obejmuje zastane instrukcje programu. Następne zadanie: S01, na osobnej gałęzi po zweryfikowaniu bazy zawierającej S00. Po każdym zadaniu agent publikuje commit i PR oraz sprawdza CI; merge wykonuje użytkownik. Gotowe polecenie znajduje się w raporcie S00.

## Optymalizacja CI po publikacji S00

Commit `39afc81` w PR #74: równoległe checks/build/browser, końcowy quality, cache zależności i Next, Chrome runnera, bez kontenera bazy. Pełna weryfikacja lokalna zielona. CI #107 ostatecznie success. Pierwszy pomiar CI #108: browser success 64 s, kroki build/integracja i cache success po 127 s; status build i całego przebiegu nie jest jeszcze zakończony, checks/quality oczekują. Około minuty przy rozgrzanym cache pozostaje celem, bez potwierdzenia pełnego pomiaru. Źródło bieżącego stanu: checki PR #74.

Końcowy pomiar optymalizacji: [CI #109](https://github.com/PiotrKulbacki/lyamo/actions/runs/41881213744), commit `f63e84b`, **success, 88 s**. Wszystkie cztery zadania zielone. Kolejny commit uzupełnia wyłącznie dokumentację pomiaru; stan aktualnego head należy sprawdzić w PR #74.
