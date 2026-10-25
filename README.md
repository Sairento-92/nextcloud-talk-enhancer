# Nextcloud Talk Enhancer (Server App / Plugin)
**Fork by Sairento** for Nextcloud Talk (`cloud.huriko.com`)

[![GitHub Release](https://img.shields.io/github/v/release/Sairento-92/nextcloud-talk-enhancer?color=0082c9&label=Wydanie)](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest)
[![Nextcloud Version](https://img.shields.io/badge/Nextcloud-25--35-0082c9.svg)](https://apps.nextcloud.com/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

Kompleksowa aplikacja serwerowa oraz zestaw rozszerzeń dla chmury Nextcloud, wprowadzający panel konfiguracyjny w Ustawieniach Administratora WWW, zaawansowane narzędzia OCC, silnik webhooków, integrację z lokalnym AI (Ollama), mechanizmy DLP, automatyczną retencję danych oraz zaawansowany interfejs webowy Nextcloud Talk.

---

## 🔄 Pełne Zestawienie Zmian Względem Oryginalnego Nextcloud Talk (Upstream)

Poniższa tabela prezentuje bezpośrednie porównanie możliwości oficjalnej aplikacji Nextcloud Talk (`spreed`) z wersją rozszerzoną o `talk_enhancer`:

| Obszar / Moduł | Oryginalny Nextcloud Talk | Nextcloud Talk z Talk Enhancer |
| :--- | :--- | :--- |
| **Kolorowanie składni kodu** | Podstawowe/brak, brak wykrywania języków | **Atom One Dark dla 190+ języków** z autowykrywaniem (Python, SQL, JS, Bash, C++, itp.) |
| **Kopiowanie i pobieranie kodu**| ❌ Brak przycisków w dymkach kodu | **Przyciski `📋 Kopiuj` oraz `💾 Pobierz`** z automatycznym rozszerzeniem pliku |
| **Zwijanie długiego kodu** | Długie logi zalewają okno czatu | **Automatyczne zwijanie bloków kodu >15 linii** z licznikiem wierszy |
| **Wklejanie kodu (Smart Paste)**| Wklejenie wstawia czysty tekst | **Automatyczne opakowywanie wieloliniowego kodu w potrójne backticki z tagiem języka** |
| **Tłumienie szumów AI w Webie**| Podstawowe AGC/echo z przeglądarki | **RNNoise WASM (Web Audio 48 kHz)** eliminujące szum wentylatorów i uderzenia w klawisze |
| **Rejestrator wycinków ekranu**| ❌ Brak | **Komenda `/record`** – bezpośrednie nagrywanie ekranu/kamery do pliku WebM/MP4 z czatu |
| **Podsumowania i notatki** | ❌ Brak | **Komenda `/summary`** generująca agendę i listę zadań do Markdown i PDF |
| **Tryb skupienia (Zen Mode)** | ❌ Brak | **Skrót `Alt + Z`** ukrywający boczne panele i elementy rozpraszające |
| **Optymalizacja zdjęć Canvas** | Wgrywanie surowych plików (np. 15-25 MB) | **Klientowe skalowanie zdjęć >2500px** przed wysyłką (szybki upload, oszczędność dysku) |
| **Miernik sieci WebRTC** | ❌ Brak wskaźnika jakości na żywo | **Podgląd na żywo ping/RTT, bitrate i utraty pakietów (packet loss)** podczas rozmowy |
| **Wyszukiwarka GIF-ów** | ❌ Brak wbudowanego selektora | **Komenda `/gif <hasło>`** z podglądem i wstawianiem animacji GIF bezpośrednio do czatu |
| **Przypięte wiadomości** | ❌ Brak paska ogłoszeń pokoju | **Górny pasek przypiętych komunikatów** widoczny dla wszystkich uczestników |
| **Routing dzwonka połączenia** | Wszystkie dźwięki na jednym urządzeniu | **Wybór osobnego głośnika dla dzwonka połączenia (`setSinkId`)** |
| **Prędkość notatek głosowych** | Odtwarzanie wyłącznie 1.0x | **Pigułka kontroli tempa głosu (1x, 1.25x, 1.5x, 2x)** na odtwarzaczu audio |
| **Pamięć wersji roboczych** | Przełączenie pokoju kasuje wpisywany tekst | **Automatyczne zapamiętywanie draftów wiadomości** per pokój |
| **Zabezpieczenie zamknięcia karty**| Przypadkowe odświeżenie rozłącza rozmowę | **Ostrzeżenie przeglądarki przed opuszczeniem aktywnej rozmowy** (Issue #2003) |
| **Skróty klawiszowe w przeglądarce**| Ograniczone/brak | **Klawisze `M` (mute), `V` (kamera), `/` (skok do pola czatu)** |
| **Zestaw narzędzi konsolowych OCC**| Tylko podstawowe operacje na pokojach | **`occ talk:enhancer:*`** (`stats`, `broadcast`, `cleanup`, `export-room`) |
| **Incoming Webhooks** | Wymaga skomplikowanych botów/tokenów | **Prosty webhook URL per pokój** dla Home Assistant, GitHub, Zabbix, cURL |
| **Lokalny Asystent AI (Ollama)**| ❌ Brak | **Komenda `/ai <pytanie>`** odpytująca lokalny serwer Ollama bez wysyłki danych do chmury |
| **Panel konfiguracyjny WWW** | ❌ Brak | **Dedykowany panel w Ustawieniach Administracyjnych Nextcloud** (`Rozmowa`) |
| **Ochrona poufnych danych (DLP)**| ❌ Brak filtrów kluczy i haseł | **Wykrywanie i blokada/maskowanie kluczy prywatnych, tokenów OpenAI/GitHub/AWS** |
| **Automatyczna retencja w tle** | Ręczne usuwanie | **Zadanie `CleanupJob` w cronie** automatycznie czyszczące stare wiadomości |

---

## 📦 Instalacja i Wdrożenie (Krok po kroku)

Aby aplikacja pojawiła się w Panelu Administratora Nextcloud, jej katalog musi znaleźć się w folderze `apps/` instancji Nextcloud.

### Krok 1: Gdzie wgrać pliki na serwerze?

Pobierz archiwum **`talk_enhancer.tar.gz`** (lub `.zip`) z zakładki [Releases](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest).

Katalog docelowy na serwerze zależy od Twojej instalacji Nextcloud:

| Środowisko instalacji | Ścieżka docelowa na serwerze |
| :--- | :--- |
| **Standardowy Linux (Ubuntu / Debian / Nginx / Apache)** | `/var/www/nextcloud/apps/talk_enhancer/` (lub `/var/www/html/apps/`) |
| **Kontenery Docker / Docker Compose** | Wolumen aplikacji: `/var/www/html/custom_apps/talk_enhancer/` |
| **Proxmox LXC / TrueNAS Jail** | Wewnątrz kontenera: `/var/www/nextcloud/apps/talk_enhancer/` |
| **Pakiet Snap** | `/var/snap/nextcloud/current/nextcloud/extra-apps/talk_enhancer/` |

#### Szybkie wgranie (jedna komenda w terminalu serwera):
```bash
# Przejdź do katalogu aplikacji Nextcloud:
cd /var/www/nextcloud/apps/

# Pobierz i rozpakuj najnowsze wydanie:
wget https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest/download/talk_enhancer.tar.gz
tar -xzf talk_enhancer.tar.gz
rm talk_enhancer.tar.gz

# Nadaj uprawnienia dla serwera WWW:
chown -R www-data:www-data talk_enhancer/
```

> **Weryfikacja struktury:** Folder `talk_enhancer` powinien zawierać bezpośrednio podfoldery `appinfo/`, `lib/`, `templates/`, `js/`, `css/` i `img/`.

---

### Krok 2: Aktywacja w Panelu Administratora WWW (1 kliknięcie)

Gdy pliki znajdą się w katalogu `apps/`, Nextcloud natychmiast rozpozna aplikację w interfejsie graficznym:

1. Zaloguj się do chmury Nextcloud jako **Administrator**.
2. Kliknij swój awatar w prawym górnym rogu ➔ wybierz **Aplikacje** (`/settings/apps`).
3. W menu bocznym po lewej stronie przejdź do sekcji **Wyłączone aplikacje** (lub wpisz w pole wyszukiwania: `Talk Enhancer`).
4. Przy pozycji **Talk Enhancer (Fork by Sairento)** kliknij przycisk **Włącz** (jeśli pojawi się ostrzeżenie o aplikacji niepodpisanej certyfikatem Nextcloud App Store, kliknij *„Włącz nieprzetestowaną aplikację”*).
5. Gotowe! Moduły rozszerzeń natychmiast uaktywniają się u wszystkich użytkowników.

---

### Krok 3: Konfiguracja w Panelu Ustawień WWW

Nie musisz korzystać z konsoli, aby skonfigurować aplikację – zrobisz to w panelu graficznym:

1. Przejdź do **Ustawień administracyjnych** (Awatar w prawym górnym rogu ➔ *Ustawienia administracyjne*).
2. W sekcji administracji po lewej stronie kliknij **Rozmowa** (Talk Enhancer).
3. W dedykowanym graficznym formularzu:
   - 🤖 **Podaj adres serwera Ollama AI** (np. `http://127.0.0.1:11434`) i wybierz model LLM (`llama3`, `mistral`).
   - 🟢 **Sprawdź status połączenia na żywo** (wskaźnik ONLINE/OFFLINE oraz lista wykrytych modeli).
   - 🔒 **Włącz automatyczną retencję danych** i określ maksymalny wiek wiadomości w dniach (np. 90 dni).
   - Kliknij **„Zapisz ustawienia”**.

---

## 🛠️ Narzędzia Konsolowe OCC (`occ talk:enhancer:*`)

Dla administratorów preferujących wiersz poleceń lub automatyzację skryptową dostępne są dedykowane komendy:

### 1. `occ talk:enhancer:stats`
Generuje raport aktywności i obciążenia serwera Talk w postaci tabeli:
```bash
sudo -u www-data php occ talk:enhancer:stats
```
- Zestawienie pokoi 1:1, grupowych i publicznych.
- Liczba wiadomości (łącznie, 24h, 7 dni).
- Top 5 najaktywniejszych pokoi.
- Status połączenia z lokalnym silnikiem AI (Ollama) i dostępne modele.

### 2. `occ talk:enhancer:broadcast`
Wysyła ogłoszenie administracyjne (np. o przerwie technicznej) do wszystkich pokoi:
```bash
# Do wszystkich pokoi Talk:
sudo -u www-data php occ talk:enhancer:broadcast --message="⚠️ Serwer zostanie zrestartowany o godzinie 23:30."

# Do wybranego pokoju po tokenie:
sudo -u www-data php occ talk:enhancer:broadcast --room=vloc0j --message="Wiadomość testowa dla zespołu."
```

### 3. `occ talk:enhancer:cleanup`
Usuwa starą historię rozmów na podstawie retencji danych:
```bash
# Podgląd liczby wiadomości do usunięcia (bez kasowania):
sudo -u www-data php occ talk:enhancer:cleanup --days=90 --dry-run

# Usunięcie wiadomości starszych niż 60 dni:
sudo -u www-data php occ talk:enhancer:cleanup --days=60
```

### 4. `occ talk:enhancer:export-room`
Umożliwia archiwizację i zrzut całej historii konwersacji wybranego pokoju do pliku:
```bash
# Eksport do pliku Markdown:
sudo -u www-data php occ talk:enhancer:export-room vloc0j --format=md --output=/tmp/historia_projektu.md

# Eksport w formacie JSON z pełnymi metadanymi:
sudo -u www-data php occ talk:enhancer:export-room vloc0j --format=json
```

---

## 🔗 Silnik Incoming Webhooks (`/api/v1/webhook/{token}`)

Umożliwia integrację z zewnętrznymi systemami (Home Assistant, GitHub, Zabbix, Uptime Kuma, skrypty Bash):

- **Adres endpointu**: `POST https://twoja-chmura.pl/apps/talk_enhancer/api/v1/webhook/{room_token}`
- **Komenda na czacie**: Wpisz `/webhook` w dowolnym pokoju Talk, aby otworzyć okno z gotowym adresem URL i kodem integracji.

### Przykład cURL:
```bash
curl -X POST "https://cloud.huriko.com/apps/talk_enhancer/api/v1/webhook/vloc0j" \
  -H "Content-Type: application/json" \
  -d '{"text": "🚨 Kopia zapasowa bazy danych zakończona sukcesem!", "actorDisplayName": "Backup Bot"}'
```

### Przykład Home Assistant (`configuration.yaml`):
```yaml
rest_command:
  notify_talk_room:
    url: "https://cloud.huriko.com/apps/talk_enhancer/api/v1/webhook/vloc0j"
    method: POST
    headers:
      content-type: "application/json"
    payload: '{"text": "🏠 {{ message }}", "actorDisplayName": "Home Assistant"}'
```

---

## 🤖 Integracja z Lokalnym AI (Ollama / LocalAI)

- **Komenda na czacie**: Wpisz `/ai <zapytanie>` (np. `/ai Podsumuj czym jest protokół WebRTC`), a serwer odpyta lokalną instancję Ollama i wyświetli odpowiedź w dedykowanym oknie z opcją wklejenia do czatu.
- **Konfiguracja**: W Panelu Administratora WWW (**Ustawienia administracyjne ➔ Rozmowa**) lub przez CLI:
  ```bash
  sudo -u www-data php occ config:app:set talk_enhancer ollama_url --value="http://127.0.0.1:11434"
  sudo -u www-data php occ config:app:set talk_enhancer ollama_model --value="llama3"
  ```

---

## 🔒 Ochrona Przed Wyciekiem Danych (DLP) & Retencja

1. **DLP Scanner**:
   - Wykrywa wklejanie kluczy prywatnych (`BEGIN RSA PRIVATE KEY`), tokenów dostępowych (OpenAI `sk-...`, GitHub `ghp_...`, AWS `AKIA...`) oraz haseł w URI baz danych.
   - Ostrzega użytkownika przed wysłaniem poufnych danych na czacie.
2. **Automatyczne zadanie w tle (Cron Background Job)**:
   - Klasa `OCA\TalkEnhancer\BackgroundJob\CleanupJob` uruchamiana automatycznie raz na 24h w procesie `cron.php`.
