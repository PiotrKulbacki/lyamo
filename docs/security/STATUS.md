# Stan programu bezpieczeństwa

Aktualizacja: 2026-11-04. S00 i S01 scalone do dev oraz main. Finalizacja S01: pierwsze wydanie Ready ujawniło różnicę pustych żądań adaptera Vercel; poprawka przechodzi weryfikację i publikację.

Następne zadanie: **S02**. Ostatni raport: [S01](reports/S01.md).

| Zadanie | Stan      | Raport                |
| ------- | --------- | --------------------- |
| S00     | ukończone | [S00](reports/S00.md) |
| S01     | w toku    | [S01](reports/S01.md) |
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

2026-11-04 (S00): Supabase MCP i CLI odczytują projekt `lyamo` (`jrusrgsrujbflyoudske`); Stripe MCP potwierdza konto Lyamo w trybie live. GitHub MCP i SSH odczytują repo `PiotrKulbacki/lyamo`; MCP potwierdza admin dla `PiotrKulbacki`, token `gh` nieważny. Vercel CLI niezalogowany i bez powiązania projektu; brak narzędzi Vercel. S00 opublikowano w GitHub na polecenie użytkownika; bez zmian w usługach produkcyjnych. Szczegóły historyczne: [raport S00](reports/S00.md).

S01: GitHub MCP/SSH zapisują PR i merge; Vercel CLI zalogowany jako `piotr01`. Potwierdzony projekt `prj_llTUj9r6FUJB9rZF5zacjyKsemoP` / `lyamo`, team `piotrs-projects-3b8acd4b`, root `apps/web`, Production śledzi `main`, domena `lyamo.eu`, Node 26.x. Bez zmian sekretów.

## Środowisko i ograniczenia

- Node 26.13.0 / npm 11.20.0; `.nvmrc`, engines i CI: Node 26. Zależności zainstalowane. Vercel Lyamo potwierdzone i ustawione na 26.x w S01.
- Instrukcja izolacji, integracji auth i E2E: [TESTING.md](TESTING.md). Tymczasowy PostgreSQL 16 jest uruchamiany lokalnie bez Dockera. S01: format/lint/typecheck/test (166 testów), integracja (1), E2E (13) i pełny build przeszły dla pierwszej implementacji lokalnie i w CI; aktualne liczby obejmują poprawkę bodyless, weryfikowaną przed kolejnym wydaniem.
- Zwykły web build wykonuje migracje. Do lokalnej weryfikacji używaj `npm run build:test`; runner sprawdza własną bazę i nie korzysta z produkcyjnego `.env`.
- Nadal wymagają weryfikacji we właściwych etapach: izolacja usług Preview (część zmiennych ma wspólny zakres Production/Preview), Stripe test/Sandbox, Google, poczta, Redis i monitoring. Testy lokalne pozostają całkowicie izolowane.

## Rejestr kolejnego kroku

S01: implementacja `cc2000b5286ac2180079a08724bd712cc1bd7eff`, [PR #75 do dev](https://github.com/PiotrKulbacki/lyamo/pull/75) scalony jako `6590efb`. [CI #112](https://github.com/PiotrKulbacki/lyamo/actions/runs/41886302000) i [CI dev](https://github.com/PiotrKulbacki/lyamo/actions/runs/41899409363) zakończone sukcesem. [Wydanie #76 do main](https://github.com/PiotrKulbacki/lyamo/pull/76) scalone jako `6ce15f7`. Użytkownik jednorazowo upoważnił agenta S01 do merge i wdrożenia. S02 nie rozpoczęto; gotowe polecenie w raporcie S01. Kolejne zadania zachowują domyślną zasadę merge przez użytkownika.

## Optymalizacja CI po publikacji S00

Commit `39afc81` w PR #74: równoległe checks/build/browser, końcowy quality, cache zależności i Next, Chrome runnera, bez kontenera bazy. Pełna weryfikacja lokalna zielona. CI #107 ostatecznie success. Pierwszy pomiar CI #108: browser success 64 s, kroki build/integracja i cache success po 127 s; status build i całego przebiegu nie jest jeszcze zakończony, checks/quality oczekują. Około minuty przy rozgrzanym cache pozostaje celem, bez potwierdzenia pełnego pomiaru. Źródło bieżącego stanu: checki PR #74.

Końcowy pomiar optymalizacji: [CI #109](https://github.com/PiotrKulbacki/lyamo/actions/runs/41881213744), commit `f63e84b`, **success, 88 s**. Wszystkie cztery zadania zielone. Kolejny commit uzupełnia wyłącznie dokumentację pomiaru; stan aktualnego head należy sprawdzić w PR #74.
