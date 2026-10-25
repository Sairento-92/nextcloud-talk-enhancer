/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function initWebhookHelper() {
    console.info('TalkEnhancer: Webhook Helper module initialized (/webhook)');

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' || e.shiftKey) return;

        const inputEl = document.querySelector('.new-message-form__input, [contenteditable="true"], textarea.message-composer__input');
        if (!inputEl) return;

        const text = (inputEl.value !== undefined ? inputEl.value : inputEl.textContent || '').trim();
        if (text !== '/webhook' && text !== '/hook') return;

        e.preventDefault();
        e.stopPropagation();

        if (inputEl.value !== undefined) {
            inputEl.value = '';
        } else {
            inputEl.textContent = '';
        }

        const roomToken = getActiveRoomToken();
        if (!roomToken) {
            alert('Nie wykryto aktywnego pokoju Talk. Wejdź do pokoju, aby pobrać dedykowany adres webhooka.');
            return;
        }

        showWebhookModal(roomToken);
    }, true);
}

function getActiveRoomToken() {
    const hash = window.location.hash || '';
    const match = hash.match(/\/call\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        return match[1];
    }
    const pathParts = window.location.pathname.split('/');
    const callIdx = pathParts.indexOf('call');
    if (callIdx !== -1 && pathParts[callIdx + 1]) {
        return pathParts[callIdx + 1];
    }
    return null;
}

function showWebhookModal(roomToken) {
    const origin = window.location.origin;
    const webhookUrl = `${origin}/apps/talk_enhancer/api/v1/webhook/${roomToken}`;

    let modal = document.getElementById('talk-enhancer-webhook-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'talk-enhancer-webhook-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 650px;
            max-width: 92vw;
            background: #1e1e24;
            color: #f0f0f0;
            border-radius: 12px;
            box-shadow: 0 16px 48px rgba(0,0,0,0.7);
            z-index: 100000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #33333e;
        `;
        document.body.appendChild(modal);
    }

    const curlExample = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"text": "🚨 Alert z serwera: Kopia zapasowa zakończona sukcesem!", "actorDisplayName": "Backup Bot"}'`;

    const haExample = `rest_command:
  notify_talk_room:
    url: "${webhookUrl}"
    method: POST
    headers:
      content-type: "application/json"
    payload: '{"text": "🏠 {{ message }}", "actorDisplayName": "Home Assistant"}'`;

    modal.innerHTML = `
        <div style="background:#141418;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2a2a35;">
            <div style="font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px;">
                🔗 Incoming Webhook dla Pokoju Talk
            </div>
            <button id="webhook-modal-close" style="background:transparent;border:none;color:#aaa;cursor:pointer;font-size:20px;line-height:1;">&times;</button>
        </div>
        <div style="padding:18px;max-height:65vh;overflow-y:auto;font-size:13px;line-height:1.6;color:#e0e0e0;">
            <p style="margin-top:0;">Wyślij powiadomienia z <strong>Home Assistant</strong>, <strong>GitHub</strong>, <strong>Zabbix</strong> lub skryptów Bash bezpośrednio do tego pokoju:</p>
            
            <label style="font-weight:600;color:#0082c9;display:block;margin-bottom:4px;">Adres URL Webhooka:</label>
            <div style="background:#111;padding:8px 12px;border-radius:6px;font-family:monospace;word-break:break-all;border:1px solid #333;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
                <span>${webhookUrl}</span>
                <button id="copy-webhook-url" style="background:#0082c9;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:12px;margin-left:8px;">Kopiuj</button>
            </div>

            <label style="font-weight:600;color:#aaa;display:block;margin-bottom:4px;">Przykład cURL (Terminal / Bash):</label>
            <pre style="background:#111;padding:10px;border-radius:6px;font-family:monospace;overflow-x:auto;border:1px solid #333;margin-bottom:14px;color:#a6e22e;">${escapeHtml(curlExample)}</pre>

            <label style="font-weight:600;color:#aaa;display:block;margin-bottom:4px;">Integracja z Home Assistant (configuration.yaml):</label>
            <pre style="background:#111;padding:10px;border-radius:6px;font-family:monospace;overflow-x:auto;border:1px solid #333;margin-bottom:0;color:#66d9ef;">${escapeHtml(haExample)}</pre>
        </div>
        <div style="background:#141418;padding:12px 18px;display:flex;justify-content:flex-end;border-top:1px solid #2a2a35;">
            <button id="webhook-modal-ok" style="background:#33333e;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Zamknij</button>
        </div>
    `;

    modal.style.display = 'flex';

    modal.querySelector('#webhook-modal-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.querySelector('#webhook-modal-ok')?.addEventListener('click', () => { modal.style.display = 'none'; });

    modal.querySelector('#copy-webhook-url')?.addEventListener('click', (e) => {
        navigator.clipboard.writeText(webhookUrl);
        e.target.textContent = 'Skopiowano!';
        setTimeout(() => { e.target.textContent = 'Kopiuj'; }, 2000);
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
