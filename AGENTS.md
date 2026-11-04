# Lyamo — praca agentów

Stosuj istniejące reguły z `.cursorrules`. Kod i konfiguracja mają pierwszeństwo przed nieaktualnym opisem stacku w README. Nie rozszerzaj przydzielonego zadania o niezwiązane poprawki.

## Publikacja po każdym zadaniu

Po zakończeniu każdego zadania agent uruchamia wymagane checki, przegląda diff, tworzy commit, wykonuje push gałęzi `codex/` i otwiera PR do `dev` (po potwierdzeniu właściwej gałęzi docelowej). Jest to stałe upoważnienie użytkownika do tych operacji; nie pytaj ponownie o publikację poprawnie zweryfikowanego zadania. PR obejmuje zmiany zadania, raport i aktualizację stanu w jednym commicie. Lokalnie uruchamiaj tylko `npm run test:quality`; pełny zestaw (build, integracja, E2E) wykonuje CI raz na PR. Sprawdź wynik CI i podaj URL PR, commit i wynik CI w odpowiedzi końcowej, bez dodatkowego commita dokumentacji (ponownie uruchamia CI). Jeśli publikację blokuje dostęp lub check, opisz konkretny brak; nie deklaruj publikacji ani gotowości bez dowodu.

**Merge wykonuje wyłącznie użytkownik.** Agent nie scala PR i nie włącza automatycznego merge. Upoważnienie do commit/push/PR nie jest zgodą na wdrożenie produkcyjne ani na rozpoczęcie kolejnego zadania.

## Program bezpieczeństwa kont

Użytkownik zatwierdził realizację rekomendacji audytu z 2026-11-04. Plan i granice upoważnienia: `docs/security/README.md`. Jeden agent wykonuje jedno przydzielone zadanie S00–S10, aktualizuje stan i przekazuje następne zadanie użytkownikowi. Nie uruchamiaj kolejnego zadania, nie twórz automatycznie nowego czatu i nie deleguj do subagentów bez osobnego polecenia. Nowy czat otwiera użytkownik.

Przy zadaniu z tego programu przeczytaj skill `.agents/skills/lyamo-security-task/SKILL.md`, `docs/security/STATUS.md` i wyłącznie własną kartę z `docs/security/tasks/`. Czytaj ostatni raport poprzednika oraz potrzebne fragmenty kodu; nie odtwarzaj całej historii audytu. Przekaż brakujące dane przez pliki, nie przez założenie, że nowy agent zna rozmowę.

Skille platformowe, tylko gdy zadanie dotyczy danej usługi:

- GitHub: `.agents/skills/lyamo-github/SKILL.md`.
- Supabase / PostgreSQL / migracje: `.agents/skills/lyamo-supabase/SKILL.md`.
- Vercel / środowiska / wdrożenie: `.agents/skills/lyamo-vercel/SKILL.md`.
- Stripe / kupony / webhooki: `.agents/skills/lyamo-stripe/SKILL.md`.

Skille nie zapewniają dostępu do kont. Sprawdź faktycznie dostępne narzędzia i uwierzytelnienie. Instrukcja połączeń: `docs/security/INTEGRATIONS.md`. Nie umieszczaj sekretów, tokenów, pełnych adresów połączenia ani danych klientów w repozytorium lub raporcie.

Przed uruchomieniem builda lub migracji sprawdź cel bazy: web build uruchamia `migrate deploy`. Do lokalnych testów używaj wydzielonej bazy testowej. Produkcji nie używaj jako środowiska testowego.
