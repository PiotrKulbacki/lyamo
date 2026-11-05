# Trwałe decyzje i kontrakty

## Ustalone przez użytkownika

- Jeden agent = jedno przydzielone zadanie; na koniec instrukcja dla następnego agenta. Nowy czat otwiera użytkownik.
- Zatwierdzony zakres obejmuje cały audyt, w tym opcjonalne silniejsze metody logowania. Nie włączaj ich obowiązkowo wszystkim istniejącym użytkownikom.
- Dwa darmowe miesiące są rabatem z kuponu Stripe. Nie utożsamiaj zerowej faktury ze statusem `trialing`; nie zamieniaj promocji w trial bez nowej decyzji użytkownika.

- 2026-11-04: po każdym zakończonym zadaniu agent wykonuje checki, commit, push i PR; sprawdza CI i przekazuje URL oraz commit. Merge wyłącznie użytkownika, bez auto-merge. Dotyczy również S00.

## Zasady architektury planu

- Tożsamość dostawcy jest rozpoznawana po parze wystawca/dostawca + trwały identyfikator (`sub` dla Google), nie wyłącznie po e-mailu.
- Niepotwierdzona rejestracja nie może pozostawić obcego hasła lub innej metody dostępu po przejęciu rejestracji przez właściciela adresu.
- Potwierdzenie e-maila, ukończenie rejestracji, opcjonalna analityka i uprawnienia płatnego pakietu są osobnymi stanami.
- Wydanie sesji i autoryzacja API muszą respektować wymagane potwierdzenia na serwerze. Dla MFA stan częściowego logowania nie daje dostępu do danych ani billing API.
- Reset po utracie kontroli nad kontem odwołuje wcześniejszy dostęp; rotacja refresh tokenów musi uwzględniać równoczesne żądania prawidłowego klienta.
- Zmiany bazy są wersjonowanymi migracjami Prisma. Nie wykonuj równoległych, niezapisanych zmian schematu przez panel/MCP SQL.
- Rozszerzaj schemat w sposób zgodny z trwającym wdrożeniem. Cofnięcie kodu nie może reaktywować cofniętych uprawnień ani wymagać odtworzenia usuniętych kolumn.
- Bezpieczne ustawienia obejmują także błędy usług, retry i wielokrotne/równoczesne żądania, nie tylko ścieżkę sukcesu.

## Do rozstrzygnięcia przez właściwe zadanie

Każdy agent dopisuje krótko decyzję, powód, zadanie i ewentualne skutki migracji. Nie blokuj pracy pytaniem o rutynowy wybór biblioteki.

| Temat                                                                                                     | Właściciel |
| --------------------------------------------------------------------------------------------------------- | ---------- |
| Strategia normalizacji e-maila, wykrycie kolizji istniejących kont, zachowanie starej pisowni do kontaktu | S02        |
| Biblioteka OIDC i bezpieczna ścieżka łączenia istniejących kont                                           | S02        |
| Model sesji i natychmiastowe odwołanie dostępu web/mobile                                                 | S03        |
| Kolejka/outbox poczty, retry, retencja tokenów i jobów                                                    | S04        |
| Tryb awaryjny Redis, wiarygodne IP i niezależne limity                                                    | S05        |
| Parametry Argon2id i prywatnościowe sprawdzanie ujawnionych haseł                                         | S06        |
| Passkeys, MFA, szyfrowanie sekretów i odzyskanie konta bez osłabienia ochrony                             | S07        |
| Wersje dokumentów i zasady potraktowania istniejących kont                                                | S08        |
| Faktyczny rabat, wymaganie metody płatności i pierwszy termin opłaty                                      | S09        |
| Właściwe środowiska, monitoring i kolejność wydania                                                       | S10        |

## S00 — środowisko weryfikacji (2026-11-04)

- Zachowujemy Node 26: `.nvmrc`, engines i CI są zgodne, a Vercel oficjalnie obsługuje 26.x. Nie zmieniamy stacku. Lokalnie dostępny Node 26.13.0 / npm 11.20.0.
- Testy integracyjne używają rzeczywistego, tymczasowego PostgreSQL 16 z `embedded-postgres`; E2E używa Playwright/Chromium. Docker nie jest wymagany. Po późniejszym uruchomieniu przez użytkownika potwierdzono sprawny silnik; pozostawiono lokalny PostgreSQL ze względu na zgłoszone spowolnienie komputera i brak korzyści z dodatkowego kontenera dla S00.
- `scripts/security-test.mjs` tworzy i sprawdza własną bazę przed migracją. Przekazuje świeże środowisko i `LYAMO_TEST_ENV=1`, aby Next.js nie wczytywał głównego `.env`. To flaga wyłącznie lokalnych testów, nie ustawienie hostingu. Bazy/porty nie są kontraktem produkcyjnym.
- Bez zmian schematu, kontraktów API, mechanizmów logowania, Stripe, mobile lub danych produkcyjnych. Instrukcja następnych testów: `TESTING.md`.

## S01 — granica przeglądarki (2026-11-04)

- Przekierowania po logowaniu korzystają z listy istniejących ścieżek panelu w `safeAuthRedirect`; nowe trasy wymagają jawnego dopisania do listy.
- Wszystkie mutujące API cookies wywołują `protectMutation` przed skutkami ubocznymi: dokładny Origin z `NEXT_PUBLIC_APP_URL`, kontrola Fetch Metadata i JSON (multipart tylko dla skanowania). Cookie-free native JSON bez Origin/Fetch Metadata pozostaje kompatybilne. Wyjątek dla innego Origin wymaga opt-in w handlerze używającym zweryfikowanego Bearera, bez cookies. Sam Authorization nie zwalnia cookies z ochrony. Nie otwieraj dowolnego CORS.
- Callback Google i podpisany webhook Stripe zachowują własne mechanizmy zabezpieczeń. Obecność cookie nie dowodzi sesji; middleware nie przekierowuje publicznych stron na tej podstawie. Nieaktualne cookie jest czyszczone w Route Handlerze po sprawdzeniu sesji.
- Zachowujemy `sec_session`, bez migracji nazwy w S01: wspólne atrybuty zapisu/usuwania, HttpOnly/SameSite=Lax/Path=/, Secure w produkcji. Przejście na `__Host-` wymaga osobnego etapowego wygaszenia starej nazwy (szczegóły w raporcie).
- Użytkownik jednorazowo upoważnił agenta S01 również do merge i pełnego wdrożenia po checkach. Nie zmienia to domyślnego upoważnienia kolejnych zadań.

## S02 — tożsamość Google (2026-11-05)

- `openid-client` 6.8.9: discovery z issuer Google, RS256 z kontrolą podpisu JWKS (enableNonRepudiationChecks), audience i jawne azp, state/nonce/PKCE S256. Jednorazowy `OAuthAttempt` jest konsumowany przez DELETE RETURNING przed wymianą kodu; nonce/verifier nigdy nie trafiają do klienta. TTL 10 minut; wygasłe próby usuwa kolejne rozpoczęcie logowania. Bez offline/forced consent.
- Jedynym kluczem istniejącej tożsamości jest `google/sub`. Zmiana adresu Google nie przenosi powiązania ani nie zmienia adresu kontaktowego. Sesja i nowy użytkownik powstają transakcyjnie, z obsługą konfliktów unikalności/Serializable.
- Łączenie kont po e-mailu wyłączone; nie dodajemy endpointu łączenia bez jawnego zamiaru i dowodu kontroli dotychczasowej metody. Istniejące lokalne konta zachowują hasła i logowanie. Cudza niepotwierdzona rejestracja nie jest aktywowana przez Google; bezpieczna ścieżka właściciela to reset hasła przez skrzynkę, następnie potwierdzenie adresu. Bez kasowania kont, łączenia danych i masowych resetów.
- Dla nowych kont `email_verified` musi być boolean true, a Google musi być autorytatywne dla skrzynki (Gmail albo `hd` Workspace). Zewnętrzne adresy bez `hd` korzystają z lokalnej rejestracji i potwierdzenia skrzynki; istniejący zweryfikowany Google/sub zachowuje dostęp. Źródło: [Google — weryfikacja backend](https://developers.google.com/identity/sign-in/ios/backend-auth), [OIDC Google](https://developers.google.com/identity/openid-connect/openid-connect), [openid-client](https://github.com/panva/openid-client).
- Normalizacja: trim + lowercase, bez usuwania kropek i +tag. Wspólna dla web/mobile/Google/recovery, dawna pisownia e-maila pozostaje w bazie do kontaktu. Indeks funkcyjny `lower(btrim(email))` zapewnia unikalność także wobec starego kodu. Migracja ma transakcyjny preflight i nie przepisuje użytkowników. 2026-11-05: odczyt wyłącznie liczby grup kolizji w potwierdzonym projekcie Lyamo: 0; migracja sprawdza ponownie przy wydaniu. Nowe dane auth objęte RLS i bez dostępu anon/authenticated.
- Kryterium rzeczywistego konta Google pozostaje osobne od testów syntetycznych. Bez dostępu do kontrolowanego klienta/konta nie oznaczamy S02 jako w pełni odebranego. Nie rozpoczęto S03. Zgodnie z korektą użytkownika PR do `main`; merge użytkownika uruchamia wdrożenie i migrację.

- S02, kontrola po pierwszym pushu: Preview odziedziczyło bazę Production i zastosowało addytywną migrację przed merge. Bez zmian kont/haseł. Nie cofamy schematu. Runner migracji blokuje `VERCEL_ENV=preview` przed odczytem `.env`/Prisma, dopóki osobny workflow z potwierdzoną izolacją nie zostanie przygotowany. CI/test i Production nadal wykonują wersjonowane migracje. Nie traktować publikacji Preview jako bezpiecznej izolacji.

Aktualizacja na polecenie użytkownika: Preview pomija migracje i kontynuuje build (exit 0); nie wymaga już osobnego środowiska do ręcznego odbioru S02. Użytkownik zdecydował, że sprawdzi rzeczywiste Google na produkcji po własnym merge PR. Nie wykonano jeszcze tej próby i nie oznaczono pełnego odbioru S02. Baza Preview nadal może być współdzielona — nie używać jej do tworzenia danych testowych. Produkcyjny build nadal wykonuje migrate deploy; migracja S02 jest już zastosowana. Nie rozpoczęto S03.
