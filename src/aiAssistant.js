/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function initAiAssistant() {
    console.info('TalkEnhancer: AI Assistant module initialized (/ai <zapytanie>)');

    document.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter' || e.shiftKey) return;

        const inputEl = document.querySelector('.new-message-form__input, [contenteditable="true"], textarea.message-composer__input');
        if (!inputEl) return;

        const text = (inputEl.value !== undefined ? inputEl.value : inputEl.textContent || '').trim();
        if (!text.startsWith('/ai ') && text !== '/ai') return;

        e.preventDefault();
        e.stopPropagation();

        const prompt = text.replace(/^\/ai\s*/, '').trim();
        if (inputEl.value !== undefined) {
            inputEl.value = '';
        } else {
            inputEl.textContent = '';
        }

        if (!prompt) {
            showAiModal('Użycie komendy AI', 'Wpisz `/ai <Twoje pytanie>`, np.:\n`/ai Wyjaśnij czym jest WebRTC`\n`/ai Napisz prosty skrypt PowerShell do backupu`');
            return;
        }

        showAiModal('🤖 Asystent AI Talk', 'Generowanie odpowiedzi przez model AI... Proszę czekać.', true);

        try {
            const reqToken = window.OC?.requestToken || document.querySelector('head > meta[name="requesttoken"]')?.getAttribute('content') || '';
            const res = await fetch('/apps/talk_enhancer/api/v1/ai/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'requesttoken': reqToken,
                },
                body: JSON.stringify({ prompt }),
            });

            const data = await res.json();
            if (data.success) {
                showAiModal(`🤖 Odpowiedź AI (${data.model}) [${data.durationMs}ms]`, data.response, false, data.response);
            } else {
                showAiModal('⚠️ Asystent AI - Informacja', data.response || data.error || 'Nie udało się połączyć z lokalnym serwerem AI.');
            }
        } catch (err) {
            showAiModal('Błąd połączenia AI', 'Nie udało się nawiązać połączenia z serwerem Nextcloud: ' + err.message);
        }
    }, true);
}

function showAiModal(title, content, isLoading = false, insertableText = null) {
    let modal = document.getElementById('talk-enhancer-ai-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'talk-enhancer-ai-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 580px;
            max-width: 90vw;
            background: #1e1e24;
            color: #f0f0f0;
            border-radius: 12px;
            box-shadow: 0 12px 40px rgba(0,0,0,0.6);
            z-index: 100000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            border: 1px solid #33333e;
        `;
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div style="background:#141418;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #2a2a35;">
            <div style="font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px;">
                ${title}
            </div>
            <button id="ai-modal-close" style="background:transparent;border:none;color:#aaa;cursor:pointer;font-size:20px;line-height:1;">&times;</button>
        </div>
        <div style="padding:18px;max-height:60vh;overflow-y:auto;white-space:pre-wrap;font-size:14px;line-height:1.6;color:#e0e0e0;">
            ${isLoading ? '<div style="display:flex;align-items:center;gap:10px;"><div class="ai-spinner" style="width:20px;height:20px;border:3px solid #0082c9;border-top-color:transparent;border-radius:50%;animation:ai-spin 1s linear infinite;"></div>Generowanie odpowiedzi...</div>' : escapeHtml(content)}
        </div>
        <div style="background:#141418;padding:12px 18px;display:flex;justify-content:flex-end;gap:10px;border-top:1px solid #2a2a35;">
            ${insertableText ? '<button id="ai-modal-insert" style="background:#0082c9;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;">Wstaw do czatu</button>' : ''}
            <button id="ai-modal-ok" style="background:#33333e;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;">Zamknij</button>
        </div>
    `;

    modal.style.display = 'flex';

    modal.querySelector('#ai-modal-close')?.addEventListener('click', () => { modal.style.display = 'none'; });
    modal.querySelector('#ai-modal-ok')?.addEventListener('click', () => { modal.style.display = 'none'; });

    if (insertableText) {
        modal.querySelector('#ai-modal-insert')?.addEventListener('click', () => {
            const inputEl = document.querySelector('.new-message-form__input, [contenteditable="true"], textarea.message-composer__input');
            if (inputEl) {
                if (inputEl.value !== undefined) {
                    inputEl.value = (inputEl.value ? inputEl.value + '\n\n' : '') + insertableText;
                } else {
                    inputEl.textContent = (inputEl.textContent ? inputEl.textContent + '\n\n' : '') + insertableText;
                }
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.focus();
            }
            modal.style.display = 'none';
        });
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
