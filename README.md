# Nextcloud Talk Enhancer (Server App / Plugin)
**Fork by Sairento** for Nextcloud Talk (`cloud.huriko.com`)

[![GitHub Release](https://img.shields.io/github/v/release/Sairento-92/nextcloud-talk-enhancer?color=0082c9&label=Wydanie)](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest)
[![Nextcloud Version](https://img.shields.io/badge/Nextcloud-25--35-0082c9.svg)](https://apps.nextcloud.com/)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](LICENSE)

Kompleksowa aplikacja serwerowa oraz zestaw rozszerzeń dla chmury Nextcloud, wprowadzający panel konfiguracyjny w Ustawieniach Administratora WWW, zaawansowane narzędzia OCC, silnik webhooków, integrację z lokalnym AI (Ollama), mechanizmy DLP, automatyczną retencję danych oraz zaawansowany interfejs webowy Nextcloud Talk.

---

## 🖥️ Instalacja i Aktywacja przez Panel Administratora (Web UI)

Aplikacja jest w pełni przystosowana do zarządzania z poziomu przeglądarki WWW bez konieczności używania terminala:

### Krok 1: Włączenie aplikacji w panelu
1. Zaloguj się do chmury Nextcloud na konto z uprawnieniami administratora.
2. Kliknij swój awatar w prawym górnym rogu ekranu i wybierz **Aplikacje** (`/settings/apps`).
3. W lewym menu przejdź do sekcji **Wyłączone aplikacje** (lub wpisz w wyszukiwarkę: `Talk Enhancer`).
4. Przy pozycji **Talk Enhancer (Fork by Sairento)** kliknij przycisk **Włącz** (w razie komunikatu o aplikacji spoza oficjalnego sklepu kliknij *„Włącz nieprzetestowaną aplikację”*).
5. Aplikacja zostanie natychmiast aktywowana dla wszystkich użytkowników chmury!

### Krok 2: Konfiguracja w Ustawieniach Administracyjnych
1. Przejdź do **Ustawień administracyjnych** (Awatar w prawym górnym rogu ➔ *Ustawienia administracyjne*).
2. W menu bocznym po lewej stronie wybierz sekcję **Rozmowa** (lub *Talk Enhancer*).
3. W dedykowanym graficznym formularzu możesz:
   - 🤖 **Skonfigurować adres serwera Ollama** (np. `http://127.0.0.1:11434`) oraz wybrać domyślny model AI (`llama3`, `mistral`, `qwen2.5`).
   - 🟢 **Sprawdzić status połączenia z AI na żywo** (wskaźnik ONLINE/OFFLINE oraz lista wykrytych modeli).
   - 🔒 **Włączyć automatyczną politykę retencji** i ustawić maksymalny wiek wiadomości w dniach (np. 90 dni).
   - Kliknąć **„Zapisz ustawienia”** – konfiguracja zostanie natychmiast zaktualizowana w systemie.

---

## 🛠️ Narzędzia Konsolowe OCC (`occ talk:enhancer:*`)

Dla administratorów preferujących wiersz poleceń lub automatyzację skryptową dostępne są dedykowane komendy:

### 1. `occ talk:enhancer:stats`
Generuje przejrzysty raport aktywności i obciążenia serwera Talk w postaci tabeli:
- Liczba wszystkich pokoi w podziale na 1:1, grupowe i publiczne.
- Sumaryczna liczba wiadomości oraz wolumen w ostatnich 24h i 7 dniach.
- Zestawienie 5 najbardziej aktywnych pokoi wraz z tokenami i liczbą postów.
- Status połączenia z lokalnym silnikiem AI (Ollama) oraz lista dostępnych modeli.

### 2. `occ talk:enhancer:broadcast`
Wysyła ogłoszenie administracyjne (np. o pracach serwisowych) bezpośrednio do czatów:
```bash
# Wysłanie ogłoszenia do wszystkich pokoi Talk:
sudo -u www-data php occ talk:enhancer:broadcast --message="⚠️ Serwer zostanie zrestartowany o godzinie 23:30."

# Wysłanie do wybranego pokoju po tokenie:
sudo -u www-data php occ talk:enhancer:broadcast --room=vloc0j --message="Wiadomość testowa dla zespołu."
```

### 3. `occ talk:enhancer:cleanup`
Czyści starą historię rozmów zgodnie z polityką retencji danych:
```bash
# Sprawdzenie ile wiadomości kwalifikuje się do usunięcia (bez kasowania):
sudo -u www-data php occ talk:enhancer:cleanup --days=90 --dry-run

# Usunięcie wiadomości starszych niż 60 dni:
sudo -u www-data php occ talk:enhancer:cleanup --days=60
```

### 4. `occ talk:enhancer:export-room`
Umożliwia archiwizację i zrzut całej historii konwersacji wybranego pokoju do formatu Markdown, JSON lub HTML:
```bash
# Eksport pokoju do pliku Markdown:
sudo -u www-data php occ talk:enhancer:export-room vloc0j --format=md --output=/tmp/historia_projektu.md

# Eksport w formacie JSON z pełnymi metadanymi:
sudo -u www-data php occ talk:enhancer:export-room vloc0j --format=json
```

---

## 🔗 Silnik Incoming Webhooks (`/api/v1/webhook/{token}`)

Umożliwia integrację z zewnętrznymi systemami (Home Assistant, GitHub, Zabbix, Uptime Kuma, skrypty Bash) w celu natychmiastowego wysyłania alertów na czat Talk:

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

Talk Enhancer pozwala na bezpieczne korzystanie z modeli językowych LLM bez wysyłania prywatnych danych do chmury:

- **Komenda na czacie**: Wpisz `/ai <zapytanie>` (np. `/ai Podsumuj czym jest protokół WebRTC`), a serwer odpyta lokalną instancję Ollama i wyświetli odpowiedź w dedykowanym oknie z opcją wklejenia do czatu.
- **Konfiguracja**: W Panelu Administratora WWW (**Ustawienia administracyjne ➔ Rozmowa**) lub przez wiersz poleceń:
  ```bash
  sudo -u www-data php occ config:app:set talk_enhancer ollama_url --value="http://127.0.0.1:11434"
  sudo -u www-data php occ config:app:set talk_enhancer ollama_model --value="llama3"
  ```

---

## 🔒 Ochrona Przed Wyciekiem Danych (DLP) & Retencja

1. **DLP Scanner**:
   - Wykrywa wklejanie kluczy prywatnych (`BEGIN RSA PRIVATE KEY`), tokenów dostępowych (OpenAI `sk-...`, GitHub `ghp_...`, AWS `AKIA...`) oraz haseł w URI połączeń baz danych.
   - Ostrzega użytkownika przed wysłaniem poufnych danych na czat publiczny.
2. **Automatyczne zadanie w tle (Cron Background Job)**:
   - Klasa `OCA\TalkEnhancer\BackgroundJob\CleanupJob` uruchamiana automatycznie raz na 24h w procesie `cron.php`.

---

## 🌐 Kompletny Pakiet Funkcji Webowych dla Użytkowników

1. **AI Noise Suppression (RNNoise WASM)**: Tłumienie hałasów tła i uderzeń w klawiaturę bezpośrednio w przeglądarce.
2. **Nagrywarka klipów wideo i audio (`/record`)**: Błyskawiczny rejestrator ekranu lub rozmowy.
3. **Inteligentne notatki i agendy spotkań (`/summary`)**: Generowanie ustaleń i zadań z eksportem do Markdown / PDF.
4. **Tryb Zen / Skupienia (`Alt + Z`)**: Ukrywanie rozpraszających paneli bocznych.
5. **Optymalizator zdjęć**: Skalowanie bardzo dużych zdjęć (>2500px) przed wysłaniem na serwer.
6. **Miernik jakości sieci WebRTC**: Bieżący podgląd ping/RTT, bitrate i utraty pakietów podczas rozmowy.
7. **Wyszukiwarka GIF-ów (`/gif <hasło>`)**: Podgląd i wstawianie animacji GIF do konwersacji.
8. **Pasek przypiętych wiadomości**: Wyróżnianie najważniejszych komunikatów u góry pokoju.
9. **Kierowanie dźwięku na osobny głośnik**: Dzwonek połączenia na głośnikach, rozmowa w słuchawkach (`setSinkId`).
10. **Atom One Dark Syntax Highlighting**: Kolorowanie składni dla 190+ języków programowania z przyciskami kopiowania i pobierania.

---

## 📦 Alternatywna Instalacja Ręczna (SSH / Terminal)

Jeśli wgrywasz aplikację po raz pierwszy na własny serwer bez dostępu do App Store:
1. Pobierz archiwum `talk_enhancer.tar.gz` z [najnowszego wydania](https://github.com/Sairento-92/nextcloud-talk-enhancer/releases/latest).
2. Rozpakuj do katalogu `apps/` Nextcloud:
   ```bash
   cd /var/www/nextcloud/apps/
   tar -xzf talk_enhancer.tar.gz
   chown -R www-data:www-data talk_enhancer/
   ```
3. Przejdź do **Panelu Administratora ➔ Aplikacje** i kliknij **Włącz**, lub aktywuj przez CLI:
   ```bash
   sudo -u www-data php occ app:enable talk_enhancer
   ```
