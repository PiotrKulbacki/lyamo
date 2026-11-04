# Bezpieczeństwo kont Lyamo — plan realizacji

Data: 2026-11-04. Dokumentacja przygotowana; implementacja jeszcze nie rozpoczęta.

## Jak rozpocząć

Otwórz nowy czat w tym projekcie i wklej:

> Wykonaj wyłącznie zadanie S00 z docs/security/tasks/S00.md. Stosuj AGENTS.md i lokalny skill lyamo-security-task. Zakończ aktualizacją STATUS.md, raportem i gotowym poleceniem dla następnego agenta. Nie rozpoczynaj następnego zadania.

W kolejnych czatach podmieniaj identyfikator na wskazany w raporcie poprzednika. Nie trzeba wklejać audytu ani historii rozmowy. Nowy agent musi mieć ten sam stan plików: ten sam katalog roboczy albo gałąź zawierającą zmiany poprzednika. Samo wybranie tego samego projektu nie przenosi zmian między niezależnymi worktree.

## Zakres i upoważnienie

Użytkownik zatwierdził naprawy i usprawnienia z audytu. Przydzielenie konkretnego Sxx uruchamia wyłącznie jego realizację. Po każdym zadaniu agent wykonuje wymagane checki, commit, push i PR bezpośrednio do `main`, sprawdza CI i podaje URL PR, commit i wynik CI w odpowiedzi końcowej (raport i STATUS.md są częścią tego samego commita; bez dodatkowego commita uruchamiającego CI ponownie). Użytkownik wykonuje merge, który wdraża produkcję; agent nie scala PR ani nie włącza automatycznego merge. To stałe upoważnienie do publikacji zadania, bez ponownego pytania. Nie upoważnia do nieuzgodnionego wdrożenia produkcyjnego. Zwykłe poprawki kodu i testy w przydzielonym zakresie nie wymagają ponownego zatwierdzania samego pomysłu.

Połączenie konta z platformą nie jest samo w sobie poleceniem wdrożenia. Zapis zdalny wymaga ustalonego celu i środowiska oraz objęcia operacji przydzielonym zadaniem. S10 przygotowuje wydanie; jeśli użytkownik już przydzielił wdrożenie na wskazaną produkcję, nie pytaj o to ponownie. Nie wykonuj nieuzgodnionego obciążenia klienta, kasowania danych, masowego odłączania kont ani wymuszania resetu wszystkim użytkownikom. Ewentualny taki krok przedstaw jako konkretny plan z oceną skutków.

## Stałe ustalenia produktu

- Logowanie lokalne: e-mail i hasło; nazwa profilu jest opcjonalna.
- Auth jest własną implementacją Lyamo. Supabase zapewnia PostgreSQL i Storage; nie migruj całego auth do Supabase Auth w ramach tego planu.
- Użytkownik potwierdził: dwa darmowe miesiące są realizowane **kuponem Stripe**. Zachowaj ten model; nie dodawaj automatycznie `trial_period_days` ani drugiego rabatu.
- Konto po wymaganych potwierdzeniach otrzymuje FREE. Zakup pakietu jest osobnym krokiem; zgoda na analitykę nie może blokować aplikacji.
- Web i mobile korzystają ze wspólnego API. Zachowaj kompatybilność albo jawnie opisz potrzebną aktualizację mobile.
- Tłumaczenia: PL, EN, DE, ES; błędy zgodnie z istniejącym systemem toast.
- Repozytorium wykryte lokalnie: `PiotrKulbacki/lyamo`; PR trafiają do `main` (produkcja). Przed zdalną operacją zweryfikuj ponownie.

## Etapy — jeden wiersz to jedno zadanie jednego agenta

| Etap               | Zadanie             | Wynik                                                | Zależność | Skille dodatkowe                     |
| ------------------ | ------------------- | ---------------------------------------------------- | --------- | ------------------------------------ |
| Przygotowanie      | [S00](tasks/S00.md) | Powtarzalne testy i mapa środowisk                   | brak      | GitHub, Supabase, Vercel wg potrzeby |
| Pilne naprawy      | [S01](tasks/S01.md) | Bezpieczne wejście do web: redirect, sesja, CSRF     | S00       | brak                                 |
| Pilne naprawy      | [S02](tasks/S02.md) | Bezpieczna tożsamość Google i łączenie kont          | S01       | Supabase, Vercel wg potrzeby         |
| Kontrola dostępu   | [S03](tasks/S03.md) | Spójny cykl sesji, rotacja i odwołanie dostępu       | S02       | Supabase                             |
| Kontrola dostępu   | [S04](tasks/S04.md) | Odporne odzyskiwanie konta i dostarczanie e-maili    | S03       | Supabase, Vercel wg potrzeby         |
| Kontrola dostępu   | [S05](tasks/S05.md) | Limity nadużyć i ograniczenie ujawniania kont        | S04       | Vercel wg potrzeby                   |
| Metody logowania   | [S06](tasks/S06.md) | Hasła i migracja haszowania                          | S05       | Supabase wg potrzeby                 |
| Metody logowania   | [S07](tasks/S07.md) | Opcjonalne passkeys i drugi składnik z odzyskiwaniem | S06       | Supabase                             |
| Dostęp do produktu | [S08](tasks/S08.md) | Wspólne ukończenie rejestracji i akceptacje          | S07       | Supabase                             |
| Dostęp do produktu | [S09](tasks/S09.md) | Poprawny zakup z kuponem i przyznawanie pakietów     | S08       | Stripe, Supabase wg potrzeby         |
| Wydanie            | [S10](tasks/S10.md) | Test całego procesu, wdrożenie i kontrola po wydaniu | S09       | GitHub, Supabase, Vercel, Stripe     |

To kolejność domyślna. Nie blokuj pilnej lokalnej naprawy brakiem opcjonalnego połączenia z platformą. Zależność oznacza potrzebny rezultat techniczny; jeśli go brakuje, zapisz konkretny brak i nie udawaj ukończenia. Pilne naprawy można wydawać wcześniej niż S10 po przejściu właściwych dla nich testów i przygotowaniu procedury wdrożenia; nie czekaj na passkeys z poprawką przejęcia konta.

## Powiązanie z audytem

| Rekomendacja                                                                                                | Zadanie |
| ----------------------------------------------------------------------------------------------------------- | ------- |
| Przekierowanie XSS, pętla sesji, CSRF, ciasteczka                                                           | S01     |
| Przejęcie wcześniej założonego konta, weryfikacja Google, PKCE/nonce, minimalne zgody, normalizacja e-maili | S02     |
| Reset i zmiana hasła odcinają dostęp; rotacja mobile; urządzenia; ponowne uwierzytelnienie                  | S03     |
| Atomowe tokeny; niezawodna poczta; prywatność linków i telemetrii                                           | S04     |
| Redis fail-open; IP/konto; spam pocztowy; enumeracja kont                                                   | S05     |
| Argon2id, długie hasła, lista ujawnionych haseł                                                             | S06     |
| Passkeys, MFA, kody odzyskiwania                                                                            | S07     |
| Regulamin, wersje dokumentów, wspólne potwierdzenia i bramki API                                            | S08     |
| Kupon dwóch miesięcy, status subskrypcji, webhooki                                                          | S09     |
| Nagłówki, monitoring, aktualność zależności, konfiguracja platform, regresja i wydanie                      | S10     |

## Stan i przekazywanie pracy

[STATUS.md](STATUS.md) to krótki punkt wejścia. Każdy agent tworzy własny `reports/Sxx.md` według [szablonu](HANDOFF_TEMPLATE.md). [DECISIONS.md](DECISIONS.md) zawiera trwałe ustalenia, a [INTEGRATIONS.md](INTEGRATIONS.md) instrukcję połączeń. Karty zadań zawierają kryteria odbioru; raporty rozróżniają wdrożone zmiany, kod gotowy do wdrożenia i brak dostępu.
