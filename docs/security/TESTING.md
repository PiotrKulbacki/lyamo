# Weryfikacja lokalna programu bezpieczeństwa

Używaj Node 26 (`nvm use`) i `npm ci` z głównego katalogu. `.nvmrc`,
`engines` i CI wskazują tę samą wersję. `packageManager` wskazuje npm 10.9.2;
npm 11.20.0 dołączony do lokalnego Node 26 również działa. Dla nowszego npm
repo zapisuje `allowScripts` dla przypiętych narzędzi binarnych; po aktualizacji
ich wersji należy ponownie przejrzeć wymagane skrypty, bez zbiorowego zezwalania.

## Polecenia

```sh
nvm use
npm ci
npm run test:quality
```

Agent lokalnie uruchamia tylko `test:quality`. Pełny zestaw (`build:test`,
`test:integration`, `test:e2e`) wykonuje CI raz dla każdego commita w PR do `main`.
Po merge (wdrożenie produkcyjne) CI nie uruchamia się ponownie; PR zmieniające wyłącznie `docs/**` lub `*.md`
nie uruchamiają CI. Lokalnie pozostałe polecenia służą do diagnozy błędu CI:

```sh
npm run test:integration
npm run build:test
npx playwright install chromium
npm run test:e2e
```

`test:quality` uruchamia kolejno te same checki co CI: `npm run format`,
`npm run lint`, `npm run typecheck`, `npm run test`. Zatrzymuje się na pierwszym
błędzie. Formatuj tylko zmienione pliki przez `npx prettier --write <pliki>`, potem ponownie checki.
CI uruchamia trzy niezależne zadania równolegle: `checks` (format/lint/typy/unit),
`build` (pełny build i integracja PostgreSQL), `browser` (E2E). Końcowy check
`quality` wymaga sukcesu wszystkich trzech. Każdy runner ma osobny katalog i bazę.
Nie uruchamia dodatkowego kontenera PostgreSQL ani nie tworzy `.env`.

Na przypiętym obrazie `ubuntu-24.04` CI używa już zainstalowanego Chrome przez
`LYAMO_TEST_BROWSER_CHANNEL=chrome`; wersja przeglądarki trafia do logu. Nie pobiera
Chromium ani pakietów systemowych przy każdym przebiegu. Lokalnie domyślny pozostaje
Chromium z Playwright; mając zainstalowany Chrome, można użyć tego samego przełącznika.
Kanał Chrome korzysta z wersji obrazu runnera, nie z binariów przypiętych do Playwright.

Cache `node_modules` jest przywracany wyłącznie przy dokładnym dopasowaniu systemu,
architektury, wersji Node, lockfile i manifestów pakietów. Przy braku trafienia
wykonuje `npm ci --no-audit --no-fund`; zmiana zależności wymusza instalację. Osobny
cache obejmuje wyłącznie cache kompilatora Next, bez `.env`, bazy lub pełnego builda.
Nowy commit anuluje starszy przebieg tego samego PR. Build ma stały, lokalny
origin dla cache kompilatora; tylko E2E rezerwuje losowy port serwera.

Pierwszy pomiar CI #108: browser 64 s (success), kroki build/integracja 127 s
(sukces kroków, lecz zbiorczy status nadal w toku). Pozostałe zadania czekały na runnerów.
Potwierdzony pełny [CI #109](https://github.com/PiotrKulbacki/lyamo/actions/runs/41881213744)
z cache zakończył się sukcesem w **88 s**: browser 68 s, checks 74 s, build/integracja
71 s (równolegle), końcowy quality 4 s. Celem pozostaje około minuty; 60 s nie jest
gwarancją. Brak gwarancji czasu dla pierwszej instalacji,
zmiany lockfile lub kolejki GitHub. Poprzedni CI #107: instalacja 62 s, Docker 22 s,
build 46 s, instalacja przeglądarki 35 s, E2E 23 s, testy jednostkowe 4 s. Wszystkie
kroki miały sukces po około 4 minutach, mimo pozostającego statusu `in_progress`.

Każde z czterech poleceń `test:quality`, `test:integration`, `build:test`,
`test:e2e` tworzy osobny, tymczasowy klaster **rzeczywistego PostgreSQL 16** przez
przypięty pakiet `embedded-postgres`. Nie wymaga Dockera ani zewnętrznej bazy.
Wymaga prawa uruchamiania lokalnych procesów i otwierania portów loopback;
nie uruchamiaj jako root. Pierwsza instalacja pobiera binaria dla danej platformy.

Runner `scripts/security-test.mjs` wybiera wolne porty, losowe hasło, bazę
`lyamo_security_test` i rolę `lyamo_test`; sprawdza tożsamość bazy przed migracjami.
Przekazuje procesom świeże środowisko, bez odziedziczonych kluczy usług i adresów
baz. `LYAMO_TEST_ENV=1` pomija odczyt głównego `.env` w konfiguracji Next.js.
Runner odmawia startu przy `.env*` w `apps/web`: Next.js wczytuje takie pliki automatycznie.
Zwykły tryb aplikacji nadal korzysta z dotychczasowej konfiguracji.

Runner generuje Prisma Client i stosuje wszystkie wersjonowane migracje, po czym
zatrzymuje i usuwa klaster w `finally`. Nie używa seeda ani danych klientów.
`build:test` uruchamia pełne `npm run build`; migracje wykonywane przez web build
trafiają do tego samego zweryfikowanego klastra. Zwykłe `npm run build` poza
runnerem nadal może uruchomić migracje na bazie wskazanej w środowisku lub `.env`.

## Rozszerzanie scenariuszy

- `apps/web/integration/*.test.ts`: Vitest z prawdziwym Prisma/PostgreSQL.
  Zwykłe testy jednostkowe ich nie uruchamiają. Scenariusz S00 tworzy użytkownika
  `@example.invalid`, równocześnie tworzy osiem sesji, sprawdza hasze, odwołuje
  sesję dwukrotnie i usuwa fixture z kontrolą kaskady. To sprawdzenie infrastruktury,
  a nie dowód naprawienia atomowych tokenów lub rotacji z przyszłych zadań.
- `apps/web/e2e/*.spec.ts`: Playwright/Chromium i własny Next dev z Turbopack na loopback.
  Nie przejmuje istniejącego serwera. Smoke otwiera `/login` oraz sprawdza `401`
  z `/api/auth/me` w przeglądarce bez sesji. Google i wysyłka poczty wymagają
  osobnych kontrolowanych testów w odpowiednich zadaniach.
- Każdy kolejny test tworzy unikalne dane i usuwa je w `finally`; testy
  równoczesnych operacji muszą wykonywać rzeczywiste zapytania do PostgreSQL.

Nie uruchamiaj dwóch runnerów web jednocześnie w tym samym katalogu: Next dev
i build współdzielą `apps/web/.next`. Bazy i porty są niezależne. Lokalne ślady
Playwright są ignorowane przez Git; nie publikuj śladów zawierających dane auth.

## Hosting

Na 2026-11-04 oficjalna [dokumentacja Vercel](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
wymienia Node 26.x jako obsługiwany runtime. Nie potwierdza to konfiguracji
konkretnego projektu Lyamo: w S00 CLI Vercel nie jest zalogowany i nie ma
powiązanego projektu. Aktualna mapa dostępów znajduje się w `reports/S00.md`.
