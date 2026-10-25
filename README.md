# Nextcloud Talk Enhancer (Server App / Plugin)
**Fork by Sairento** for Nextcloud Talk (`cloud.huriko.com`)

[![GitHub Release](https://img.shields.io/github/v/release/Sairento-92/nextcloud-talk-enhancer?color=0082c9&label=Wydanie)](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest)
[![Nextcloud Version](https://img.shields.io/badge/Nextcloud-25--35-0082c9.svg)](https://apps.nextcloud.com/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

Oficjalny plugin (aplikacja serwerowa) do chmury Nextcloud, który automatycznie wprowadza zaawansowane ulepszenia i poprawki błędów Nextcloud Talk dla wszystkich użytkowników (w przeglądarce WWW oraz klientach desktopowych) bez konieczności instalowania rozszerzeń po stronie użytkownika.

---

## 🚀 Główne funkcje i ulepszenia

1. **Zaawansowane kolorowanie składni (Atom One Dark)**:
   - Pełna obsługa ponad 190 języków programowania: **Python, JavaScript, TypeScript, PowerShell, Bash, SQL, C++, C#, Java, Rust, Go, PHP, HTML, CSS, JSON, YAML, Dockerfile, Diff** itp.
   - Dedykowane heurystyki dla Pythona (`def`, `import`, `class`, `self`, `print`, `__init__`), PowerShell i SQL zapobiegające błędnej klasyfikacji snippetów.
2. **Przycisk kopiowania i pobierania snippetów (`📋 Kopiuj` oraz `💾 Pobierz`)**:
   - Każdy blok kodu otrzymuje przycisk kopiowania do schowka oraz przycisk `💾 Pobierz`, który automatycznie generuje plik z odpowiednim rozszerzeniem (`.py`, `.sql`, `.js`, `.ps1` itd.).
3. **Zwijanie i rozwijanie długich bloków kodu (>15 linii)**:
   - Długie logi i skrypty są estetycznie zwijane z przyciskiem `▼ Rozwiń kod (X linii)`, nie zalewając okna czatu.
4. **Smart Code Paste**:
   - Wklejenie wielolinijkowego kodu do czatu automatycznie formatuje go w potrójne backticki wraz z wykrytym tagiem języka (np. ```` ```python ````).
5. **Kontrola prędkości notatek głosowych (1x, 1.25x, 1.5x, 2x)**:
   - Przycisk pigułki na każdym odtwarzaczu wiadomości głosowych audio umożliwia natychmiastowe przyspieszenie odsłuchu nagrania.
6. **Automatyczne zapisywanie wersji roboczych (Drafts Persistence)**:
   - Niewysłana wiadomość w polu edycji jest automatycznie pamiętana w pamięci podręcznej i przywracana po przełączeniu się między pokojami.
7. **Automatyczny status „W trakcie rozmowy” (Issue #1768)**:
   - Po dołączeniu do aktywnego połączenia status użytkownika automatycznie przełącza się na `Zajęty / W trakcie rozmowy`, a po zakończeniu rozmowy przywracany jest poprzedni stan.
8. **Formatowanie Markdown w opisach pokoi (Issue #19738)**:
   - Nagłówki i opisy rozmów renderują pogrubienia, linki i kod jako sformatowany tekst HTML.
9. **Nowoczesny wygląd reakcji emoji (Issue #19652)**:
   - Zwięzłe, animowane pigułki z licznikami reakcji pod dymkami wiadomości.
10. **Zapamiętywanie jakości zdjęć i domyślna edycja (PR #19919 / Issue #19616 / Issue #19906)**:
    - Wymusza i zapamiętuje wybór „Oryginalna jakość” oraz domyślne prawo edycji dla wgrywanych dokumentów.
11. **Płynny skok do cytowanej odpowiedzi (Issue #19905)**:
    - Kliknięcie cytatu w dymku czatu przewija historię bezpośrednio do wiadomości źródłowej i podświetla ją.
12. **Wskaźnik poziomu mikrofonu w czasie rzeczywistym (Issue #19904)**:
    - Wizualny pasek aktywności audio w poczekalni i w trakcie połączenia dający pewność, że mikrofon działa.
13. **Ochrona po force-mute (PR #19825)**:
    - Zapobiega natychmiastowemu przypadkowemu odciszeniu po wyciszeniu przez moderatora pokoju.
14. **Blokada uploadu dla zerowego limitu konta (Issue #19913)**:
    - Ukrywa przycisk uploadu dla kont z 0 quota, eliminując błędy HTTP 500.
15. **Hasła szybkich spotkań (PR #19942)**:
    - Automatycznie generuje i kopiuje bezpieczne hasło przy tworzeniu natychmiastowych spotkań.
16. **Ochrona przed przypadkowym zamknięciem karty (Issue #2003)**:
    - Ostrzeżenie w przeglądarce przed zamknięciem lub odświeżeniem karty podczas trwającej rozmowy.
17. **Skróty klawiszowe w Webie (Issue #19838)**:
    - `M` (mute/unmute), `V` (kamera wł./wył.), `/` (skok do czatu).
18. **Bezkonfliktowa współpraca z aplikacją Desktop (`isRunningInDesktopApp`)**:
    - Skrypt inteligentnie wykrywa uruchomienie wewnątrz aplikacji desktopowej i ustępuje miejsca natywnym funkcjom Electrona, eliminując konflikty.

---

## 📦 Pobieranie i Instalacja

Pobierz najnowsze wydanie z [GitHub Releases](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest):
* `talk_enhancer.tar.gz`
* `talk_enhancer.zip`

### 🎯 Sposób 1: Przez Panel WWW Administratora (Bez konsoli)

1. Wypakuj archiwum do katalogu aplikacji Nextclouda:
   ```bash
   tar -xzf talk_enhancer.tar.gz -C /var/www/nextcloud/apps/
   chown -R www-data:www-data /var/www/nextcloud/apps/talk_enhancer
   ```
2. Zaloguj się na konto administratora w Nextcloud i przejdź do:
   👉 **`https://cloud.huriko.com/settings/apps/disabled`** *(Menu -> Aplikacje -> Wyłączone aplikacje)*.
3. Znajdź pozycję **Talk Enhancer (Fork by Sairento)** i kliknij przycisk **[Włącz]**.

### 💻 Sposób 2: Przez konsolę (CLI)

```bash
sudo -u www-data php /var/www/nextcloud/occ app:enable talk_enhancer
```

---

## 👤 Autor
- **Autor forka:** Sairento ([@Sairento-92](https://github.com/Sairento-92))
- **Email:** `jakubbojarski92@gmail.com`
- **Studio:** Huriko Cloud (`cloud.huriko.com`)
- **Licencja:** AGPL-3.0
