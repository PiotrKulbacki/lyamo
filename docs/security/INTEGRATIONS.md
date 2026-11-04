# Połączenie agentów z platformami

Stan sprawdzony 2026-11-04 w S00: Stripe MCP potwierdza konto Lyamo w trybie live; Supabase MCP i CLI potwierdzają aktywny projekt `lyamo` (`jrusrgsrujbflyoudske`). Supabase MCP początkowo zwracał `Unknown tool`, po instalacji przez użytkownika odczyt listy projektów działa (PostgreSQL 17.6.1). GitHub MCP po ponownej próbie działa: konto `PiotrKulbacki`, repo `PiotrKulbacki/lyamo`, uprawnienie admin potwierdzone metadanymi (bez próby zapisu), CI PR #72 run `41291186376` success. Git SSH pozwala odczytać gałęzie `PiotrKulbacki/lyamo`; token `gh` jest nieważny. Brak narzędzi Vercel w tej sesji; CLI 65.11.0 nie jest zalogowany i nie ma powiązanego projektu. Nie sprawdzano uprawnień zapisu przez mutacje. Szczegóły i ograniczenia: [raport S00](reports/S00.md). Lokalne skille opisują procedurę, nie nadają dostępu.

## Najprostsza droga

1. W katalogu wtyczek aplikacji znajdź GitHub, Supabase, Vercel i Stripe. Są już zainstalowane według ostatniego sprawdzenia; nie instaluj ich ponownie. Dokończ autoryzację w przeglądarce, jeśli integracja o nią prosi. Wybieraj konto/organizację Lyamo oraz zakres potrzebny do pracy.
2. Dla GitHub udostępnij repozytorium `PiotrKulbacki/lyamo`; dla pozostałych platform wybierz właściwy zespół/projekt. Do prób użyj oddzielnego środowiska testowego.
3. W nowym czacie projektu poproś: „Sprawdź dostęp do podłączonych platform bez wprowadzania zmian. Zapisz potwierdzone środowiska w raporcie S00”. Agent sprawdza rzeczywiste narzędzia i uprawnienia, a nie samą obecność nazwy wtyczki.
4. Zainstalowane integracje mogą dostarczyć dodatkowe skille producentów. Agent używa ich, jeśli pasują do zadania, razem z lokalnymi regułami Lyamo. Wtyczka może mieć tylko część potrzebnych operacji; brakujący zapis można wykonać oficjalnym CLI/API po uwierzytelnieniu.

Nie przesyłaj haseł, tokenów ani kluczy w czacie. Sekrety aplikacji wpisuj do zarządzania zmiennymi hostingu lub lokalnego, ignorowanego pliku środowiska. Raport zawiera nazwy zmiennych i identyfikatory projektów, bez wartości sekretów.

## Alternatywa: oficjalne MCP

Gdy odpowiednia wtyczka nie udostępnia potrzebnej funkcji, Codex obsługuje zewnętrzne serwery MCP i OAuth. Oficjalna [instrukcja konfiguracji Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) opisuje dodawanie i logowanie. Jeśli korzystasz z CLI, najpierw sprawdź `codex mcp list`; nie dodawaj drugiego identycznego połączenia. Po konfiguracji sprawdź dostęp w nowym czacie. Nie edytuj globalnej konfiguracji w ciemno i nie zakładaj, że logowanie CLI jest równoznaczne z połączeniem wtyczki.

### GitHub

- Preferuj dostępną integrację. Potwierdź dostęp do repo i status CI; uprawnienia do czytania nie gwarantują push/PR.
- W razie potrzeby oficjalne CLI: `gh auth login`, następnie `gh auth status`. Użytkownik kończy logowanie w przeglądarce. Istniejący remote SSH wymaga osobno sprawnego uwierzytelnienia Git; `gh` i SSH to różne ścieżki.
- Minimalnie: odczyt repo/PR/checków; zapis repo/PR tylko dla publikacji przygotowanych zmian. Nowe gałęzie `codex/security-sxx-...`, PR zwykle do `dev` po sprawdzeniu rzeczywistej konfiguracji. Nie zakładaj, że `dev` jest produkcją.
- Źródło: [uwierzytelnianie GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github).

### Supabase

- Wybierz dokładny project ref i środowisko. Startuj od ograniczonego do projektu odczytu. Osobna baza/projekt rozwojowy służy do testów zapisu, a nie produkcyjne dane użytkowników.
- Oficjalny serwer: `https://mcp.supabase.com/mcp?project_ref=PROJECT_REF&read_only=true`. Zastąp PROJECT_REF rzeczywistym identyfikatorem. W terminalu URL musi być ujęty w pojedyncze cudzysłowy z powodu znaku `&`.

```sh
codex mcp add lyamo-supabase-read --url 'https://mcp.supabase.com/mcp?project_ref=PROJECT_REF&read_only=true'
codex mcp login lyamo-supabase-read
```

- Połączenie do odczytu nie pozwoli na migrację. Do zmian używamy wersjonowanych migracji Prisma i właściwego połączenia migracyjnego. Jeśli potrzebne jest MCP z zapisem, skonfiguruj oddzielny profil dla wskazanego środowiska; nie wyłączaj odczytu ochronnego dla wszystkich projektów.
- MCP nie zastępuje `DATABASE_URL` / `DIRECT_DATABASE_URL` potrzebnych aplikacji i Prisma. Przechowuj je bezpiecznie; runtime i migracje mogą używać innych połączeń/roli. W repo są instrukcje poolerów, które trzeba zweryfikować dla wybranego środowiska.
- To własny auth Lyamo. Zmiana ustawień Supabase Auth nie naprawi tego logowania.
- Źródło: [Supabase MCP, ograniczenie projektu i read-only](https://supabase.com/docs/guides/ai-tools/mcp).

### Vercel

- Wybierz team i projekt Lyamo; odnotuj Production Branch, domenę i oddzielne zmienne dla Production / Preview / Development. Nie publikuj ich wartości.
- Oficjalny MCP: dodanie i logowanie OAuth:

```sh
codex mcp add lyamo-vercel --url https://mcp.vercel.com
codex mcp login lyamo-vercel
```

- Sprawdź faktyczne możliwości narzędzi: jeśli nie ma zarządzania sekretem/wdrożeniem, użyj oficjalnego CLI/API w tym samym koncie. Nie obiecuj uprawnień, których połączenie nie dostarcza.
- Najpierw preview z osobną bazą i Stripe test. Build Lyamo uruchamia migracje, więc preview z produkcyjnym `DIRECT_DATABASE_URL` może zmienić produkcję już podczas budowania.
- OAuth Google potrzebuje stabilnej, zarejestrowanej domeny callbacku; losowe preview nie staje się automatycznie dozwolonym redirect URI.
- Źródło: [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp).

### Stripe

- Połącz konto Lyamo przez integrację lub oficjalny MCP. OAuth pozwala uniknąć przesyłania klucza w czacie:

```sh
codex mcp add lyamo-stripe --url https://mcp.stripe.com
codex mcp login lyamo-stripe
```

- Potwierdź identyfikator konta oraz tryb testowy/Sandbox lub live dla każdej operacji. Samo zalogowanie nie gwarantuje środowiska testowego ani kompletu potrzebnych narzędzi. Używaj ograniczonych kluczy/uprawnień, jeśli OAuth nie wystarcza.
- Potrzebny odczyt: kupony, promotion codes, ceny, konfiguracja checkout, webhooki i przykładowy stan subskrypcji bez danych klientów. Testy zapisu wyłącznie w test/Sandbox; istniejących subskrypcji live nie zmieniamy przy weryfikacji promocji.
- Użytkownik podał, że **dwa darmowe miesiące wynikają z kuponu**. Odczytaj jego faktyczne parametry. Kupon 100% i trial to odmienne modele; rabat 100% może pozostawić subskrypcję `active`. Nie dodawaj triala ani nie zmieniaj kuponu „na wszelki wypadek”.
- Zweryfikuj zebranie metody płatności, pierwszą datę opłaty, obowiązującą cenę oraz ograniczenia promocji. Agent S09 ma przetestować upływ czasu bez czekania dwóch miesięcy i bez obciążania prawdziwej karty.
- Źródła: [Stripe MCP](https://docs.stripe.com/mcp), [kupony i kody](https://docs.stripe.com/billing/subscriptions/coupons), [oddzielny mechanizm triali](https://docs.stripe.com/billing/subscriptions/trials).

## Pozostałe usługi potrzebne do weryfikacji

| Usługa                              | Co przygotować                                                              | Jak agent ma pracować                                                                                                                                                                                  |
| ----------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Google Cloud / Google Auth Platform | Projekt OAuth Lyamo, testowy klient/konto, lista redirect URI i domen       | Odczyt konfiguracji przez oficjalne narzędzie lub panel po zalogowaniu użytkownika; skontrolowane zmiany klienta testowego. Nie zmieniać właścicieli projektu ani produkcyjnych sekretów bez potrzeby. |
| Brevo                               | Nadawca zweryfikowany, testowa skrzynka, ograniczony klucz API w środowisku | Oficjalne API i logi dostarczenia; testowe wiadomości do skrzynki przeznaczonej do prób, bez masowej wysyłki. Sprawdzenie SPF/DKIM/DMARC według zaleceń dostawcy.                                      |
| Upstash                             | Dedykowany Redis testowy i zmienne środowiska                               | Test limitów, awarii i monitoringu; nie uruchamiać eksperymentu awarii na współdzielonej produkcji.                                                                                                    |
| PostHog / Sentry / Vercel Analytics | Projekty testowe lub możliwość obejrzenia zdarzeń testowych                 | Potwierdzenie, że tokeny i dane osobowe nie trafiają do zdarzeń; filtrowanie po stronie aplikacji. Nie eksportować danych klientów do czatu.                                                           |

Jeśli brak odpowiedniej integracji, agent najpierw sprawdza jej dostępność, potem używa oficjalnego API/CLI lub zalogowanego panelu. Nie instaluj przypadkowego MCP tylko dlatego, że zawiera nazwę dostawcy. Lokalny skill zadaniowy odsyła do tej tabeli i wymaga bieżącej dokumentacji producenta.

## Co zapisać po sprawdzeniu dostępu

W raporcie S00 lub bieżącego zadania: platforma, konto/team, projekt, środowisko, dostępne operacje odczytu/zapisu, stan weryfikacji oraz brakujący krok. Bez sekretów. Przed działaniem na innym środowisku sprawdź te dane ponownie.

## Bieżąca kontrola

Po zmianie agent sprawdza wynik w tej samej sesji: status PR/checków, wynik migracji, deployment i smoke test albo zdarzenie Stripe. Do tego nie potrzeba ciągłej automatyzacji. Stały monitoring po zamknięciu czatu wymaga osobnego zadania/konfiguracji i nie jest włączany przez samo połączenie platformy.
