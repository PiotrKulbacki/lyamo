# Raport Sxx — nazwa zadania

- Stan: ukończone / wymaga działania użytkownika / w toku.
- Data, gałąź, bazowy commit. Raport wchodzi do tego samego commita co zmiana; URL PR, commit i wynik CI agent podaje w odpowiedzi końcowej, bez dodatkowego commita. Po `npm run test:quality` obowiązkowo commit, push i PR do `main`; merge (wdrożenie produkcyjne) wyłącznie użytkownika. Przy blokadzie podaj rzeczywisty stan publikacji.
- Środowisko: lokalne / testowe / preview / produkcja; identyfikator bez sekretów.
- Zmiany: maksymalnie 6 konkretnych punktów; odnośniki do plików.
- Kontrakty dla następnego agenta: pola modelu, funkcje, kody odpowiedzi, migracje, flagi.
- Weryfikacja: uruchomione polecenia i wynik; osobno czego nie sprawdzono i dlaczego.
- Migracje / skutki dla istniejących użytkowników / mobile / wdrożenie i cofnięcie wydania.
- Pozostałe ryzyka i brakujące dostępy: wyłącznie konkretne, potrzebne do dalszej pracy.
- Następne zadanie: identyfikator i ścieżka karty; jeśli bieżące nieukończone, przekaż dokończenie tego samego identyfikatora.

## Polecenie do nowego czatu

> Wykonaj wyłącznie zadanie Sxx z docs/security/tasks/Sxx.md. Stosuj AGENTS.md i skill lyamo-security-task. Przeczytaj STATUS.md oraz raport docs/security/reports/Syy.md. Pracuj na gałęzi wskazanej w raporcie lub przenieś podany commit; nie zakładaj obecności zmian w innym worktree. Zakończ aktualizacją stanu i raportem, wykonaj wymagane checki, commit, push i PR, sprawdź CI oraz przekaż polecenie dla kolejnego agenta. Merge pozostaw użytkownikowi. Nie rozpoczynaj następnego zadania.

Docelowo raport ma zajmować około 300–600 słów; dowody testów przechowuj jako wskazania na konkretne wyniki, bez sekretów i bez wklejania pełnej historii narzędzi.
