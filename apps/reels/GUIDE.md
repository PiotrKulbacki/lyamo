# Lyamo Reels — przewodnik dla agentów

Jedyny plik do przeczytania przed tworzeniem lub edycją rolek marketingowych.

**Format:** 9:16 (1080×1920) · 15–25 s · napisy zawsze na ekranie (często bez dźwięku).  
**Hook:** pierwsze 2–3 sekundy — bez niego scroll dalej.

---

## Szybki start

```bash
# Podgląd w Remotion Studio (osobny port — nie koliduje z web :3000)
npm run studio -w @lyamo/reels
# → http://localhost:3333

# Render gotowej rolki (zapis do out/renders/) — bez serwera / bez portu
npm run render:ai-chat -w @lyamo/reels
npm run render:dashboard -w @lyamo/reels
npm run render:dashboard-en -w @lyamo/reels
npm run render:scanner-ai -w @lyamo/reels
```

`npm run dev` w root **nie** uruchamia rolek (tylko web + mobile).
Kod Remotion: `apps/reels/src/`  
Wszystkie pliki binarne (MP4, JPEG, PNG): **`apps/reels/out/`** — katalog lokalny, w `.gitignore`, **nie trafia na produkcję**.

---

## Struktura `out/`

```
apps/reels/out/
├── renders/              # Gotowe rolki MP4 — per język (pl · en · de · es)
│   ├── pl/
│   │   ├── ai-chat-reel.mp4
│   │   ├── dashboard-reel.mp4
│   │   └── scanner-ai-reel.mp4
│   ├── en/               # np. dashboard-reel.mp4
│   ├── de/
│   └── es/
├── sources/
│   ├── audio/            # Lektor — też per język
│   │   ├── pl/dashboard-voiceover.mp3
│   │   ├── en/           # dashboard-voiceover.mp3 (do wrzucenia)
│   │   ├── de/
│   │   └── es/
│   ├── screens/          # Zrzuty ekranu (IMG_*.jpeg)
│   └── videos/           # Nagrania / bazowe MP4 do kompozycji
│       ├── ai-chat-reel-base.mp4
│       ├── dashboard-scroll-1.mov
│       ├── dashboard-scroll-2.mov
│       ├── dashboard-scroll-3.mp4
│       ├── Dashboard-EN.mp4        # baza EN (napisy EN; audio cisza)
│       ├── Dashboard-EN-h264.mp4   # H.264 do Remotion
│       ├── scanner-ai.mp4
│       └── scanner-ai-h264.mp4
└── previews/             # Klatki testowe (remotion still)
    └── preview-*.png
```

Remotion ładuje źródła przez `public/` → symlinki do `out/sources/`:

- `public/screens` → `out/sources/screens`
- `public/videos` → `out/sources/videos`
- `public/audio` → `out/sources/audio`

W kodzie: `staticFile('videos/…')`, `staticFile('audio/en/dashboard-voiceover.mp3')`.

**Zasada zapisu:** źródła → `out/sources/`; gotowy MP4 → `out/renders/{lang}/`. Nie kopiuj do `apps/web/`.  
**Legacy:** stare kopie w `out/renders/*.mp4` (bez podkatalogu) = PL; kanoniczna lokalizacja to `renders/pl/`.

---

## Kod Remotion

| Plik                                   | Opis                                                 |
| -------------------------------------- | ---------------------------------------------------- |
| `src/Root.tsx`                         | Rejestracja kompozycji                               |
| `src/compositions/AiChatReel.tsx`      | Rolka 1 — AI chat                                    |
| `src/compositions/DashboardReel.tsx`   | Rolka 2 — dashboard (PL)                             |
| `src/compositions/DashboardEnReel.tsx` | Rolka 2 — dashboard (EN) + lektor                    |
| `src/compositions/ScannerAiReel.tsx`   | Rolka 3 — skaner AI                                  |
| `src/components/Brand.tsx`             | Kolory, logo, animacje (DriftBackdrop, ClickRipple…) |

Nowa rolka: dodaj `src/compositions/NazwaReel.tsx`, zarejestruj w `Root.tsx`, dodaj skrypt `render:nazwa` w `package.json`.

---

## Rolka 1 — Asystent AI ✅

**Kompozycja:** `AiChatReel`  
**Gotowy plik:** `out/renders/ai-chat-reel.mp4`  
**Źródło wideo:** `out/sources/videos/ai-chat-reel-base.mp4` (archiwum środkowych scen)

| Czas      | Scena                  | Napisy                                                |
| --------- | ---------------------- | ----------------------------------------------------- |
| 0–3,4 s   | Hook liczbowy          | **23,50 € dziennie** · To dlatego nie możesz odłożyć… |
| 3,4–8 s   | Hook TV                | **Kupujesz TV za 500 €?**                             |
| 8–14,6 s  | Czat AI (z bazy wideo) | Zapytaj Lyamo zanim kupisz                            |
| 14,6–19 s | Wynik                  | **12,53 € na dzień**                                  |
| 19–23 s   | End card               | Sprawdź swoje wydatki z AI. · lyamo.eu                |

**Edycja kwoty / napisów:** `HookNumberScene` i `ResultScene` w `AiChatReel.tsx`.  
**Edycja środka (czat, TV, end):** wymaga nowego nagrania → podmień `ai-chat-reel-base.mp4` lub przebuduj sceny w kodzie.

**CTA:** Sprawdź swoje wydatki z AI. / Dowiedz się, gdzie uciekają Twoje pieniądze. · lyamo.eu

---

## Rolka 2 — Dashboard ✅

**Kompozycja PL:** `DashboardReel` → `out/renders/pl/dashboard-reel.mp4`  
**Kompozycja EN:** `DashboardEnReel` → `out/renders/en/dashboard-reel.mp4`  
**Źródła PL:** `dashboard-scroll-{1,2,3}.*` + `audio/pl/dashboard-voiceover.mp3` (legacy: `audio/dashboard-voiceover.mp3`)  
**Źródła EN:** `videos/Dashboard-EN-h264.mp4` + `audio/en/dashboard-voiceover.mp3`  
**Render EN:** `npm run render:dashboard-en -w @lyamo/reels`

### EN — sync lektora

|              | Wartość                                                  |
| ------------ | -------------------------------------------------------- |
| Lektor       | ~**36,81 s** (`audio/en/dashboard-voiceover.mp3`)        |
| Baza wideo   | ~**39,29 s** (`Dashboard-EN.mp4`)                        |
| Gotowa rolka | ~**37,7 s** (VO + 0,9 s ciszy)                           |
| Tempo wideo  | `playbackRate ≈ 1,042` — cały cut mieści się w czasie VO |

Oryginał lektora (kopia robocza): `apps/web/public/marketing/dashboard -EN.mp3` → kanonicznie w `out/sources/audio/en/`.

### PL — timeline

| Czas        | Scena               | Napisy / sync z lektorem                                |
| ----------- | ------------------- | ------------------------------------------------------- |
| 0–3,5 s     | Hook                | **45,86 € na dziś** · VO start razem z liczbą           |
| 3,5–15,5 s  | Budżet (pełny kadr) | „Tyle średnio wydajesz każdego dnia” / dni do wypłaty   |
| 15,5–24 s   | Kategorie / donut   | „Lyamo analizuje Twoje finanse…” / koszty stałe         |
| 24–29,8 s   | Historia            | Paragony rozbite na kategorie                           |
| 29,8–36,4 s | End card            | Logo od „Lyamo. Finanse pod kontrolą…” + cisza na końcu |

**Audio PL:** `out/sources/audio/pl/dashboard-voiceover.mp3`  
**Bez zoomów** na nagraniach telefonu. Całość ~**36,4 s** (VO ~35,7 s + cisza na end card).

### Tekst lektora (PL) — sync z `dashboard-voiceover.mp3`

| Czas      | Scena     | Lektor                                                              |
| --------- | --------- | ------------------------------------------------------------------- |
| 0:00–0:04 | Hook      | Lyamo to miejsce, w którym kontrolujesz wydatki.                    |
| 0:04–0:10 | Budżet    | Wprowadzasz budżet miesięczny oraz bieżące zakupy. I od razu wiesz… |
| 0:10–0:15 | Budżet    | Na pulpicie widzisz średnio ile możesz wydać dziennie i ile dni…    |
| 0:15–0:24 | Kategorie | Wykres kategorii pokazuje, gdzie uciekają pieniądze…                |
| 0:24–0:30 | Historia  | W historii transakcji masz każdy zakup, także paragony rozbite…     |
| 0:30–0:35 | End card  | Lyamo. Finanse pod kontrolą. Wejdź na lyamo.eu.                     |
| 0:35–0:36 | End card  | _(cisza — logo zostaje)_                                            |

---

## Rolka 3 — Skaner AI ✅

**Kompozycja:** `ScannerAiReel`  
**Gotowy plik:** `out/renders/scanner-ai-reel.mp4`  
**Źródło:** `out/sources/videos/scanner-ai-h264.mp4` (z `scanner-ai.mp4` / `apps/web/public/marketing/scanner-ai.mp4`)  
**Render:** `npm run render:scanner-ai -w @lyamo/reels`  
**Audio:** po nagraniu → `out/sources/audio/scanner-ai-voiceover.pl.mp3` (podłącz w kompozycji jak dashboard)

Nagranie źródłowe ~**42,7 s** (HEVC). W rolce: hook + przyspieszenie środkowego scrolla pozycji → całość ~**33,6 s**.

| Czas rolki  | Scena (źródło)           | Efekt                           | Napisy                                      |
| ----------- | ------------------------ | ------------------------------- | ------------------------------------------- |
| 0–2,8 s     | Hook graficzny           | Logo + punch tekstu             | **Paragon? Zrób zdjęcie.**                  |
| 2,8–8,8 s   | Analiza (src 0–6)        | Pełny kadr telefonu             | AI **analizuje** paragon…                   |
| 8,8–14,8 s  | Pola (src 6–12)          | Lekki zoom na Kwota / Opis      | **36,52 €** · Lidl · gotowe                 |
| 14,8–22,8 s | Pozycje (src 12–28 @2×)  | Scroll przyspieszony            | Pozycje z kategoriami — spożywcze i chemia  |
| 22,8–28,8 s | Podsumowanie (src 30–36) | **Silny zoom** na sumę podziału | Suma **zgadza się** z paragonem             |
| 28,8–31,8 s | Zapis (src 34–40 @2×)    | Pełny kadr                      | Zapis jednym tapnięciem                     |
| 31,8–33,6 s | End card                 | Logo + CTA                      | **Lyamo** · Skanuj paragony z AI · lyamo.eu |

**Zoom hero:** na zielonym komunikacie _„Suma podziału: 36.52 / 36.52 EUR — Zgadza się z kwotą paragonu”_ oraz kartach _Zakupy spożywcze 20,03 €_ / _Chemia 16,49 €_.

### Tekst lektora (PL) — do nagrania (~30–32 s mowy)

Czytaj spokojnie, jak w dashboardzie. Timecode = czas **w gotowej rolce** (po hooku startuje wideo).

| Czas      | Scena        | Lektor                                                                                       |
| --------- | ------------ | -------------------------------------------------------------------------------------------- |
| 0:00–0:03 | Hook         | Paragon? Zrób zdjęcie.                                                                       |
| 0:03–0:09 | Analiza      | Lyamo AI odczytuje kwotę, sklep i każdą pozycję.                                             |
| 0:09–0:15 | Pola         | Trzydzieści sześć euro pięćdziesiąt dwa. Lidl w Berlinie — już na ekranie.                   |
| 0:15–0:23 | Pozycje      | Każda linijka z kategorią. Spożywcze osobno, chemia osobno.                                  |
| 0:23–0:29 | Podsumowanie | Podsumowanie: dwadzieścia euro na zakupy, szesnaście na chemię. Suma zgadza się z paragonem. |
| 0:29–0:32 | Zapis / end  | Zapisujesz jednym tapnięciem. Lyamo. Skanuj paragony z AI. Wejdź na lyamo.eu.                |

**Wersja ciągła (do czytnika / Voice Memos):**

```
Paragon? Zrób zdjęcie.
Lyamo AI odczytuje kwotę, sklep i każdą pozycję.
Trzydzieści sześć euro pięćdziesiąt dwa. Lidl w Berlinie — już na ekranie.
Każda linijka z kategorią. Spożywcze osobno, chemia osobno.
Podsumowanie: dwadzieścia euro na zakupy, szesnaście na chemię. Suma zgadza się z paragonem.
Zapisujesz jednym tapnięciem. Lyamo. Skanuj paragony z AI. Wejdź na lyamo.eu.
```

Po nagraniu: zapisz jako `out/sources/audio/scanner-ai-voiceover.pl.mp3`, dopisz `<Audio>` w `ScannerAiReel.tsx` i zrób finalny render.

---

## Rolka 4 — Wydatki wg kategorii (plan)

**Screeny:** `IMG_9978.jpeg` / `IMG_9980.jpeg` → `IMG_9981.jpeg`

| Czas     | Scena                   | Napisy                                        |
| -------- | ----------------------- | --------------------------------------------- |
| 0–2,5 s  | Donut, koszty stałe 76% | **76% idzie na koszty stałe.**                |
| 2,5–10 s | Lista kategorii         | Spożywcze, paliwo, reszta                     |
| 10–16 s  | Ostatnie transakcje     | Konkretne zakupy z datą                       |
| 16–20 s  | End card                | **Lyamo** · Widzisz, gdzie uciekają pieniądze |

---

## Zrzuty ekranu — mapa plików

| Plik            | Zawartość           |
| --------------- | ------------------- |
| `IMG_9976.jpeg` | Dashboard / budżet  |
| `IMG_9978.jpeg` | Donut kategorii     |
| `IMG_9979.jpeg` | Lista kategorii     |
| `IMG_9980.jpeg` | Kategorie (wariant) |
| `IMG_9981.jpeg` | Ostatnie transakcje |
| `IMG_9982.jpeg` | Historia            |
| `IMG_9983.jpeg` | Archiwum / foldery  |
| `IMG_9984.jpeg` | Skaner / upload     |

---

## Workflow: nowa rolka

1. Dodaj screeny/nagrania do `out/sources/screens/` lub `out/sources/videos/`.
2. Utwórz `src/compositions/NazwaReel.tsx` (wzoruj się na `DashboardReel.tsx`).
3. Zarejestruj kompozycję w `src/Root.tsx`.
4. Dodaj skrypt render w `package.json` → `out/renders/nazwa-reel.mp4`.
5. Podgląd: `npm run studio -w @lyamo/reels`.
6. Render: `npm run render:nazwa -w @lyamo/reels`.
7. Zaktualizuj tę sekcję w `GUIDE.md` (scenariusz, status, ścieżki).

## Workflow: edycja istniejącej rolki

1. Znajdź kompozycję w `src/compositions/`.
2. Zmień napisy / timing w komponencie sceny.
3. Jeśli zmieniasz nagranie — podmień plik w `out/sources/videos/` (zachowaj nazwę lub zaktualizuj `staticFile()`).
4. Render ponownie do `out/renders/`.
5. Podgląd klatki: `npx remotion still NazwaReel out/previews/preview-scena.png --frame=90`.

---

## Uwagi produkcyjne

- Jedna rolka = jedna funkcja produktu.
- Logo Lyamo na hooku lub end cardzie.
- Bez dźwięku: większe napisy, max 6–8 słów na klatkę.
- WhatsApp Status: skróć do ~15–20 s (obetnij środkowe sceny).
- Kolory marki: `src/components/Brand.tsx` (`--warm`, `--cool`, `--void`).
- Ostrzeżenie Remotion o `zod` 3 vs 4 jest nieszkodliwe.
- Pierwszy render pobiera Chrome Headless Shell (wymaga sieci).
