# Poprawka regresji logowania Google po S01

2026-11-04. Osobna poprawka zgłoszona przez użytkownika; S02 nie rozpoczęto.
Gałąź `codex/fix-google-login-redirect`, baza dev `c69d48f` (PR #79).

## Przyczyna i zmiana

S01 usunęło przekierowania middleware oparte wyłącznie na obecności cookie.
Callback Google nadal tworzył sesję i kierował do `/`, a publiczna strona główna
nie sprawdzała sesji. Udane logowanie kończyło się więc ekranem powitalnym,
z którego użytkownik mógł ponownie rozpocząć logowanie.

- Callback po sukcesie kieruje bezpośrednio do `/dashboard`.
- Strona główna przekierowuje do panelu dopiero po serwerowej walidacji sesji
  w PostgreSQL. Brak sesji oraz nieznana, usunięta lub wygasła sesja nadal
  pozwalają wyświetlić landing page. Middleware zachowuje zabezpieczenia S01.
- Bez zmian schematu, sekretów, łączenia kont i kontraktu mobile.

Log `no Redis, fail-open`, z pełnym pozostałym limitem, oznacza przepuszczenie
żądania przez limiter i nie wyjaśnia tego przekierowania. Nie naprawiano Redis
w ramach tego zgłoszenia.

## Weryfikacja

Nowy test integracyjny przed poprawką odtworzył błąd: oczekiwany `/dashboard`,
otrzymany `/`. Po poprawce sprawdza docelowy URL, cookie, rzeczywistą sesję
w PostgreSQL i wygaszenie OAuth state. Mockowana jest zewnętrzna wymiana Google
oraz odczyt state z kontekstu Next; zapis sesji i handler są rzeczywiste.
E2E sprawdza wejście na stronę główną bez sesji, z ważną sesją i z trzema
rodzajami nieważnej sesji. Zachowano negatywny test OAuth state.

- Node 26.13.0; izolowany PostgreSQL 16 przez runner S00, bez bazy produkcyjnej.
- `test:quality`: sukces, format/lint/typecheck i 166 testów jednostkowych.
- `test:integration`: sukces, 2/2 (w tym regresja callbacku).
- Pierwsze E2E: 13/14, w tym nowe przypadki sesji na stronie głównej przeszły.
  Istniejący przypadek `javascript:` zakończył się timeoutem nawigacji do panelu,
  mimo odpowiedzi login 200; żądanie panelu nie zakończyło się w 30 s.
  Powtórzony pełny przebieg po buildzie: **14/14**, 1,6 min; timeout nie powtórzył się.
- `build:test`: sukces, 4/4 zadania, 56,4 s, izolowana baza bez zaległych migracji.

Vercel CLI potwierdza dostęp `piotr01`. Produkcyjny alias `lyamo.eu` wskazuje
wdrożenie `dpl_4YCHMM8qeqNZCMWpQ2Fma7H2vuu3`, Ready, utworzone 21:12 CET.
Jest to odczyt zastanego wdrożenia; poprawki z tej gałęzi nie wdrażano.
Pełnego OAuth z rzeczywistym kontem Google nie wykonywano. Doraźne wejście
na `/dashboard` po powrocie z Google pozwala wykorzystać zapisaną sesję.

## Publikacja i przekazanie

Docelowy PR do `dev`; merge i wydanie produkcyjne pozostają po stronie użytkownika.
Wszystkie wymagane checki lokalne przeszły; diff sprawdzony. Implementacja:
`7e482278c4bf9b43aeab7571146762ebc3a71694`, [PR #81](https://github.com/PiotrKulbacki/lyamo/pull/81)
do `dev`. [CI #118](https://github.com/PiotrKulbacki/lyamo/actions/runs/41907901963):
**success** (checks, browser, build/integracja, quality). Brak migracji i zmian
środowiska. Końcowy commit dokumentacyjny uzupełnia wynik publikacji; jego CI
należy sprawdzić w tym samym PR. S02 pozostaje kolejnym zadaniem, bez rozpoczęcia.
