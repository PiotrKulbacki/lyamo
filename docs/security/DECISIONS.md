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
