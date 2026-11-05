# Rejestracja: termin potwierdzenia i przejście do pulpitu

2026-11-05, uzupełnienie zlecone przez użytkownika po scaleniu S02. Baza `main` / `a3937ad6865cfd7058eb78f5ff9b6c4f71554e16`, gałąź `codex/auth-login-loading`. Zastany katalog czysty. Nie rozpoczęto S03.

## Zgoda i zakres

Użytkownik wyraźnie zatwierdził trwałe usuwanie **wyłącznie nowych, niepotwierdzonych rejestracji po 72 godzinach**. Dotychczasowe konta nie są obejmowane wstecznie. Nie wykonano ręcznego usuwania na produkcji ani prób z danymi klientów. Mechanizm zacznie obejmować nowe rejestracje dopiero po merge i wdrożeniu przez użytkownika.

## Zachowanie

- Rejestracja lokalna ustawia `User.registrationExpiresAt` na 72 godziny od utworzenia. Istniejące rekordy i nowe konta Google mają NULL; bez backfillu. Potwierdzenie e-maila atomowo zeruje termin. Po terminie potwierdzenie jest odrzucane, nawet jeśli pozostał ważny token.
- Link nadal jest ważny maksymalnie 24 godziny, z ograniczeniem do końca rejestracji. Resend nie przedłuża 72 godzin. Mail tekstowy i HTML oraz ekran po rejestracji pokazują zasadę trzech dni tylko przy nowej rejestracji objętej terminem. PL/EN/DE/ES. Login/register zwracają dodatkowe opcjonalne `registrationExpiresAt`; istniejący kontrakt mobile zachowany.
- Codzienny cron `/api/cron/delete-unverified-accounts`, `15 0 * * *` UTC, wymaga istniejącego `CRON_SECRET`; nie działa w Preview. Usuwa do 500 najstarszych kwalifikujących się rejestracji na przebieg. Wygaśnięcie następuje po 72 godzinach, fizyczne usunięcie podczas kolejnego codziennego przebiegu (lub później przy zaległościach/awarii). Komunikat nie obiecuje fizycznego usunięcia dokładnie w 72. godzinie.
- Dodatkowe warunki usuwania: niepotwierdzony e-mail, lokalne hasło, FREE, brak Stripe customer, Google/innych powiązań, sesji i refresh tokenów oraz brak danych produktu. Warunki są ponownie sprawdzane w DELETE, aby potwierdzenie po wyborze kandydatów chroniło konto. Usuwane powiązania to wyłącznie tokeny takiej pustej rejestracji. Przy nietypowych danych rekord jest zachowywany.
- Po sukcesie logowania/rejestracji formularz zastępuje dostępny ekran ładowania do czasu przejścia na stronę docelową. Błąd żądania pozostawia formularz do ponownej próby. Osobny stan nawigacji usuwa mignięcie powodowane dawnym `finally { setIsLoading(false) }`.

## Weryfikacja i wydanie

Node 26.13.0, `npm run test:quality`: sukces (190 testów: web 112, shared 77, mobile 1). Runner tworzy i sprawdza własną bazę loopback `lyamo_security_test` / `lyamo_test` i stosuje wersjonowane migracje. Dodano testy PostgreSQL: zakres nowych rejestracji, zachowanie starych/zweryfikowanych/powiązanych/płatnych/z danymi, tokeny, deadline/resend, API rejestracji, autoryzacja cron i wyścig potwierdzenia z usunięciem. Dodano E2E utrzymujący oczekiwanie na pulpit i sprawdzający, że pola formularza nie wracają. Integrację, E2E i build wykonuje CI PR; bieżący wynik w PR, bez dokumentacyjnego commita po CI.

Migracja Prisma `20261105110000_registration_expiry`: tylko nullable timestamp i indeks. Bez przepisywania lub usuwania danych. Preview pomija migracje zgodnie z poprawką S02; wymaga nowego schematu do korzystania z API, więc przed merge nie służy do ręcznego testowania nowych rejestracji na współdzielonej bazie. Produkcyjny build wykona migrację po merge. Nowy harmonogram działa dopiero na Production. Nie wywoływać cron ręcznie na produkcji w ramach testów.

Rollback kodu nie wymaga usuwania kolumny; wycofanie zmiany wyłącza nowy harmonogram i egzekwowanie terminu. Nie cofa wykonanych, zatwierdzonych usunięć — to trwałe działanie. Warunkiem automatycznego działania jest poprawnie ustawiony `CRON_SECRET` i aktywny harmonogram Vercel; nie zmieniano sekretów ani zewnętrznej konfiguracji. Czekamy na merge użytkownika i jego ręczny odbiór interfejsu. S02 nadal oczekuje osobnej próby Google; nie rozpoczęto S03.
