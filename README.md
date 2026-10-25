# Nextcloud Talk Enhancer (Server App / Addon)
**Fork by Sairento** for Nextcloud Talk (`cloud.huriko.com`)

Oficjalny plugin (aplikacja serwerowa) do chmury Nextcloud, który automatycznie wprowadza zaawansowane ulepszenia i poprawki błędów Nextcloud Talk dla wszystkich użytkowników (zarówno w przeglądarce WWW, jak i w klientach desktopowych oraz mobilnych) bez potrzeby instalowania jakichkolwiek rozszerzeń po stronie klienta.

---

## 🚀 Główne funkcje i ulepszenia

1. **Zaawansowane kolorowanie składni (Atom One Dark)**:
   - Pełna obsługa ponad 190 języków programowania: **Python, JavaScript, TypeScript, PowerShell, Bash, SQL, C++, C#, Java, Rust, Go, PHP, HTML, CSS, JSON, YAML, Dockerfile, Diff** itp.
   - Dedykowane heurystyki dla Pythona (`def`, `import`, `class`, `self`, `print`, `__init__`) oraz PowerShell i SQL zapobiegające błędnej klasyfikacji snippetów.
2. **Przycisk kopiowania kodu (`📋 Kopiuj` / `✅ Skopiowano!`)**:
   - Każdy blok kodu otrzymuje elegancki, najeżdżany przycisk kopiowania do schowka.
3. **Plakietka języka (Language Badge)**:
   - W prawym górnym rogu bloku kodu wyświetla się etykieta wykrytego języka (np. `PYTHON`, `POWERSHELL`, `SQL`).
4. **Smart Code Paste**:
   - Wklejanie wielolinijkowego kodu bezpośrednio do pola wiadomości automatycznie opakowuje go w potrójne backticki z wykrytym tagiem języka (np. ```` ```python ````).
5. **Zapamiętywanie jakości zdjęć (PR #19919 / Issue #19616)**:
   - Wymusza i zapamiętuje wybór „Oryginalna jakość” dla wysyłanych zrzutów ekranu i grafik, zapobiegając utracie ostrości.
6. **Naprawa przeciągania załączników (Issue #1766)**:
   - Przeciągnięcie załącznika z czatu na pulpit pobiera pełny plik źródłowy (PDF, DOCX, ZIP itp.) zamiast miniaturki JPEG.
7. **Obracanie zdjęć w podglądzie (Issue #1757)**:
   - Przyciski obrotu w lewo (↺ −90°) i prawo (↻ +90°) w oknie podglądu zdjęć w czacie.
8. **Skok do cytowanej odpowiedzi (Issue #19905)**:
   - Kliknięcie w cytowaną treść w dymku czatu płynnie przewija historię do oryginalnej wiadomości i podświetla ją na żółto.
9. **Ochrona po wyciszeniu przez moderatora (PR #19825)**:
   - Blokuje przypadkowe natychmiastowe odciszenie mikrofonu tuż po tym, jak moderator nałożył *force-mute*.
10. **Blokada uploadu dla zerowego limitu konta (Issue #19913)**:
    - Ukrywa przycisk uploadu dla kont z 0 quota, zapobiegając błędom HTTP 500.
11. **Hasła szybkich spotkań (PR #19942)**:
    - Automatycznie generuje i kopiuje bezpieczne hasło do schowka, gdy serwer wymusza politykę haseł.
12. **Ochrona przed przypadkowym opuszczeniem rozmowy (Issue #2003)**:
    - Ostrzeżenie przed zamknięciem lub odświeżeniem karty/okna, gdy trwa aktywne połączenie głosowe/wideo.
13. **Skróty klawiszowe w Webie (Issue #19838)**:
    - Klawisze: `M` (mute/unmute mikrofonu), `V` (kamera wł./wył.), `/` (skok do pola wpisywania wiadomości).
14. **Auto-reconnect sygnalizacji (Issue #19994)**:
    - Wznawia sesję WebRTC po zerwaniu połączenia WebSocket (kod 1001 z reverse proxy).
15. **Oficjalny branding Huriko & Fork by Sairento**:
    - Oficjalne logo studia Huriko i oznaczenie forka w interfejsie aplikacji.

---

## 📦 Struktura aplikacji Nextcloud

```
talk_enhancer/
├── appinfo/
│   ├── info.xml         # Metadane aplikacji dla Nextcloud (id, wersja, kompatybilność)
│   └── app.php          # Rejestracja skryptu i styli
├── lib/
│   └── AppInfo/
│       └── Application.php  # Bootstrapper Nextcloud AppFramework
├── js/
│   └── talk_enhancer.js # Samodzielny, zminifikowany bundle (zero zewnętrznych zależności)
├── css/
│   └── talk_enhancer.css # Motyw Atom One Dark, style przycisków i plakietek
├── img/
│   └── huriko-logo.png  # Oficjalne logo Huriko
└── src/                 # Kod źródłowy TypeScript/JavaScript
```

---

## 🛠️ Instalacja i Aktywacja w Nextcloud (`cloud.huriko.com`)

Plugin możesz włączyć na serwerze na dwa wygodne sposoby:

### 🎯 Sposób 1: Przez Panel WWW Administratora (Graficzny interfejs, bez konsoli)

1. Wypakuj gotowe archiwum [talk_enhancer.tar.gz](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest/download/talk_enhancer.tar.gz) do katalogu aplikacji Nextclouda:
   ```bash
   tar -xzf talk_enhancer.tar.gz -C /var/www/nextcloud/apps/
   chown -R www-data:www-data /var/www/nextcloud/apps/talk_enhancer
   ```
2. Zaloguj się na konto administratora w przeglądarce i otwórz zakładkę:
   👉 **`https://cloud.huriko.com/settings/apps/disabled`** *(Menu użytkownika -> Aplikacje -> Wyłączone aplikacje)*.
3. Na liście wyłączonych aplikacji znajdź:
   > 🧩 **Talk Enhancer (Fork by Sairento)**
4. Kliknij przycisk **`[ Włącz ]`** (Enable). Plugin zacznie natychmiast działać dla wszystkich użytkowników!

---

### 💻 Sposób 2: Przez Konsolę OCC (Dla administratorów serwera / CLI)

Jeśli wolisz aktywację poleceniem w terminalu:

```bash
# Tradycyjna instalacja na serwerze Linux:
sudo -u www-data php /var/www/nextcloud/occ app:enable talk_enhancer

# W przypadku instalacji Docker / Docker Compose:
docker compose exec -u www-data app php occ app:enable talk_enhancer
```

---

### 🏪 Sposób 3: Oficjalny sklep Nextcloud App Store (Jedno kliknięcie)

Plugin posiada pełną strukturę zgodną z Nextcloud App Store (`appinfo/info.xml`). Po dodaniu repozytorium na [apps.nextcloud.com](https://apps.nextcloud.com/) każdy administrator może po prostu wpisać w wyszukiwarce aplikacji Nextcloud: **`Talk Enhancer`** i kliknąć **`[ Pobierz i włącz ]`** bezpośrednio w przeglądarce.

---
**Autor:** Sairento (Fork by Sairento)  
**Licencja:** AGPL-3.0-or-later
