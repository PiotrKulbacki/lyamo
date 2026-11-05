# Stan programu bezpieczeństwa

Aktualizacja: 2026-11-04. S00 i S01 scalone do dev oraz main. S01 wdrożone na lyamo.eu: Ready, Node 26, SHA `81a16f5`; kontrola HTTP 12/12.

Następne zadanie: **odbiór S02**. Ostatni raport: [S02](reports/S02.md).

S02 (2026-11-05): implementacja na `codex/security-s02`, PR do `main` według korekty użytkownika. Konta i hasła pozostają bez zmian; wyłączone łączenie po e-mailu, OIDC/PKCE/nonce i jednorazowy state, normalizacja z kontrolą kolizji. Lokalny quality i CI są źródłem weryfikacji kodu; bieżący wynik CI w PR. Brakuje kontrolowanego testu rzeczywistego Google, więc odbiór pozostaje otwarty. Pierwszy automatyczny build Preview zastosował addytywną migrację na współdzielonej bazie produkcyjnej (bez zmian kont/haseł). Poprawka blokuje kolejne migracje w Preview do potwierdzenia izolacji; kod Production bez merge pozostaje dotychczasowy. Merge wyłącznie użytkownika. S03 nie rozpoczęto.

Zgłoszona regresja po S01: udane Google OAuth wracało na landing page po usunięciu
przekierowania middleware. Osobna [poprawka logowania](reports/S01-google-login-hotfix.md)
zweryfikowana lokalnie: quality, integracja 2/2, E2E 14/14 i build; callback
kieruje do panelu, strona główna sprawdza ważność sesji. [PR #81](https://github.com/PiotrKulbacki/lyamo/pull/81)
do `dev`, implementacja `7e48227`, [CI #118](https://github.com/PiotrKulbacki/lyamo/actions/runs/41907901963): success.
To zapis historyczny po S01; bieżący stan S02 znajduje się powyżej.

| Zadanie | Stan                         | Raport                |
| ------- | ---------------------------- | --------------------- |
| S00     | ukończone                    | [S00](reports/S00.md) |
| S01     | ukończone                    | [S01](reports/S01.md) |
| S02     | wymaga działania użytkownika | [S02](reports/S02.md) |
| S03     | oczekuje                     | —                     |
| S04     | oczekuje                     | —                     |
| S05     | oczekuje                     | —                     |
| S06     | oczekuje                     | —                     |
| S07     | oczekuje                     | —                     |
| S08     | oczekuje                     | —                     |
| S09     | oczekuje                     | —                     |
| S10     | oczekuje                     | —                     |

Stany: oczekuje / gotowe do rozpoczęcia / w toku / wymaga działania użytkownika / ukończone. Oznacz ukończenie tylko po spełnieniu kryteriów karty; brak połączenia z produkcją nie oznacza, że poprawka została wdrożona.

## Potwierdzone połączenia

2026-11-04 (S00): Supabase MCP i CLI odczytują projekt `lyamo` (`jrusrgsrujbflyoudske`); Stripe MCP potwierdza konto Lyamo w trybie live. GitHub MCP i SSH odczytują repo `PiotrKulbacki/lyamo`; MCP potwierdza admin dla `PiotrKulbacki`, token `gh` nieważny. Vercel CLI niezalogowany i bez powiązania projektu; brak narzędzi Vercel. S00 opublikowano w GitHub na polecenie użytkownika; bez zmian w usługach produkcyjnych. Szczegóły historyczne: [raport S00](reports/S00.md).

S01: GitHub MCP/SSH zapisują PR i merge; Vercel CLI zalogowany jako `piotr01`. Potwierdzony projekt `prj_llTUj9r6FUJB9rZF5zacjyKsemoP` / `lyamo`, team `piotrs-projects-3b8acd4b`, root `apps/web`, Production śledzi `main`, domena `lyamo.eu`, Node 26.x. Bez zmian sekretów.

## Środowisko i ograniczenia

- Node 26.13.0 / npm 11.20.0; `.nvmrc`, engines i CI: Node 26. Zależności zainstalowane. Vercel Lyamo potwierdzone i ustawione na 26.x w S01.
- Instrukcja izolacji, integracji auth i E2E: [TESTING.md](TESTING.md). Tymczasowy PostgreSQL 16 jest uruchamiany lokalnie bez Dockera. S01: format/lint/typecheck/test (166 testów), integracja (1), E2E (13) i pełny build przeszły lokalnie i w CI, również po poprawce bodyless dla adaptera Vercel.
- Zwykły web build wykonuje migracje. Build, integrację i E2E wykonuje CI na PR; lokalnie `npm run build:test` tylko do diagnozy błędu CI (runner sprawdza własną bazę i nie korzysta z produkcyjnego `.env`).
- Nadal wymagają weryfikacji we właściwych etapach: izolacja usług Preview (część zmiennych ma wspólny zakres Production/Preview), Stripe test/Sandbox, Google, poczta, Redis i monitoring. Testy lokalne pozostają całkowicie izolowane.

## Rejestr kolejnego kroku

S01: implementacja `cc2000b`, poprawka `3eace00823f923b2693c4c5bf5ddd72afb08cbd6`; [PR #75](https://github.com/PiotrKulbacki/lyamo/pull/75) i [PR #77](https://github.com/PiotrKulbacki/lyamo/pull/77) scalone do dev, końcowy merge kodu `e4ac2c5`. [CI poprawki](https://github.com/PiotrKulbacki/lyamo/actions/runs/41902215210) oraz [CI dev](https://github.com/PiotrKulbacki/lyamo/actions/runs/41902656353): success. [Wydanie #78](https://github.com/PiotrKulbacki/lyamo/pull/78) do main: `81a16f5f2d3d5de5193fc21aaea00a5574607e12`, Vercel `dpl_93Uo424EVAU9SrNVSgqos1AVHgWc`, Production Ready, domena `lyamo.eu`, kontrola HTTP 12/12. Dokumentacyjne commity po wydaniu nie zmieniają aplikacji. Użytkownik jednorazowo upoważnił agenta S01 do merge i wdrożenia. W chwili raportu S01 nie rozpoczęto S02; bieżący stan znajduje się powyżej. Następne zadania zachowują domyślną zasadę merge przez użytkownika.

## Optymalizacja CI po publikacji S00

Commit `39afc81` w PR #74: równoległe checks/build/browser, końcowy quality, cache zależności i Next, Chrome runnera, bez kontenera bazy. Pełna weryfikacja lokalna zielona. CI #107 ostatecznie success. Pierwszy pomiar CI #108: browser success 64 s, kroki build/integracja i cache success po 127 s; status build i całego przebiegu nie jest jeszcze zakończony, checks/quality oczekują. Około minuty przy rozgrzanym cache pozostaje celem, bez potwierdzenia pełnego pomiaru. Źródło bieżącego stanu: checki PR #74.

Końcowy pomiar optymalizacji: [CI #109](https://github.com/PiotrKulbacki/lyamo/actions/runs/41881213744), commit `f63e84b`, **success, 88 s**. Wszystkie cztery zadania zielone. Kolejny commit uzupełnia wyłącznie dokumentację pomiaru; stan aktualnego head należy sprawdzić w PR #74.
