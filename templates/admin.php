<?php
/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

script('talk_enhancer', 'talk_enhancer');
style('talk_enhancer', 'talk_enhancer');
?>

<div id="talk-enhancer-admin-settings" class="section">
    <h2 class="app-name">Talk Enhancer (Ustawienia Administratora)</h2>
    <p class="settings-hint">
        Zarządzaj zaawansowanymi funkcjami serwerowymi Talk Enhancer: lokalnym asystentem AI, automatyczną retencją danych i webhookami.
    </p>

    <div style="margin-top: 20px;">
        <h3>🤖 Lokalny Asystent AI (Ollama / LocalAI)</h3>
        <p class="settings-hint">
            Umożliwia użytkownikom wywoływanie komendy <code>/ai &lt;pytanie&gt;</code> na czacie z zachowaniem 100% prywatności.
        </p>

        <p>
            <label for="talk_enhancer_ollama_url"><strong>Adres serwera Ollama:</strong></label><br/>
            <input type="text" id="talk_enhancer_ollama_url" name="ollama_url" value="<?php p($_['ollamaUrl']); ?>" style="width: 350px;" placeholder="http://127.0.0.1:11434" />
        </p>

        <p>
            <label for="talk_enhancer_ollama_model"><strong>Model LLM:</strong></label><br/>
            <input type="text" id="talk_enhancer_ollama_model" name="ollama_model" value="<?php p($_['ollamaModel']); ?>" style="width: 250px;" placeholder="llama3" />
            <span class="settings-hint">np. <code>llama3</code>, <code>mistral</code>, <code>qwen2.5</code>, <code>phi3</code></span>
        </p>

        <p>
            <strong>Status połączenia z AI:</strong>
            <?php if ($_['aiOnline']): ?>
                <span style="color: #28a745; font-weight: bold;">● ONLINE</span> (Dostępne modele: <?php p(implode(', ', $_['aiModels'])); ?>)
            <?php else: ?>
                <span style="color: #dc3545; font-weight: bold;">○ OFFLINE</span> (Nie można połączyć się z podanym adresem URL)
            <?php endif; ?>
        </p>
    </div>

    <div style="margin-top: 25px;">
        <h3>🔒 Polityka Retencji i Automatyczne Czyszczenie</h3>
        <p class="settings-hint">
            Automatyczne usuwanie starych wiadomości z bazy danych podczas nocnego zadania cron.
        </p>

        <p>
            <input type="checkbox" id="talk_enhancer_auto_cleanup" <?php if ($_['autoCleanup'] === 'yes') p('checked'); ?> class="checkbox" />
            <label for="talk_enhancer_auto_cleanup">Włącz automatyczną retencję wiadomości w tle</label>
        </p>

        <p>
            <label for="talk_enhancer_retention_days"><strong>Okres przechowywania wiadomości (w dniach):</strong></label><br/>
            <input type="number" id="talk_enhancer_retention_days" value="<?php p($_['retentionDays']); ?>" style="width: 100px;" min="1" max="3650" />
            <span class="settings-hint">Wiadomości starsze niż podana liczba dni zostaną usunięte.</span>
        </p>
    </div>

    <div style="margin-top: 20px;">
        <button id="talk-enhancer-save-settings" class="button button-primary">Zapisz ustawienia</button>
        <span id="talk-enhancer-save-status" style="margin-left: 10px; font-weight: 600;"></span>
    </div>
</div>

<script>
document.getElementById('talk-enhancer-save-settings')?.addEventListener('click', async () => {
    const statusEl = document.getElementById('talk-enhancer-save-status');
    const url = document.getElementById('talk_enhancer_ollama_url').value.trim();
    const model = document.getElementById('talk_enhancer_ollama_model').value.trim();
    const autoCleanup = document.getElementById('talk_enhancer_auto_cleanup').checked ? 'yes' : 'no';
    const retentionDays = document.getElementById('talk_enhancer_retention_days').value.trim();

    statusEl.textContent = 'Zapisywanie...';
    statusEl.style.color = '#888';

    try {
        const reqToken = window.OC?.requestToken || document.querySelector('head > meta[name="requesttoken"]')?.getAttribute('content') || '';
        const res = await fetch('/apps/talk_enhancer/api/v1/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'requesttoken': reqToken,
            },
            body: JSON.stringify({
                ollama_url: url,
                ollama_model: model,
                auto_cleanup: autoCleanup,
                retention_days: retentionDays,
            }),
        });

        const data = await res.json();
        if (data.success) {
            statusEl.textContent = '✓ Zapisano pomyślnie!';
            statusEl.style.color = '#28a745';
        } else {
            statusEl.textContent = 'Błąd: ' + (data.error || 'Nieznany błąd');
            statusEl.style.color = '#dc3545';
        }
    } catch (e) {
        statusEl.textContent = 'Błąd połączenia: ' + e.message;
        statusEl.style.color = '#dc3545';
    }
});
</script>
