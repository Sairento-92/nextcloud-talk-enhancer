/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Scheduled Messages - Planowanie wysyłki wiadomości w Nextcloud Talk
 */

export class ScheduledMessages {
    constructor() {
        this.storageKey = 'te_scheduled_messages';
        this.timer = null;
        this.modalId = 'te-scheduled-messages-modal';
        this.init();
    }

    init() {
        this.injectScheduleButton();
        this.observeDOM();
        this.startScheduler();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.injectScheduleButton();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    injectScheduleButton() {
        const chatControls = document.querySelector('.chat-input__wrapper, .new-message-tools, .chat-input-row');
        if (!chatControls || document.querySelector('.te-schedule-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'te-schedule-btn';
        btn.title = 'Zaplanuj wysłanie wiadomości (Scheduled Message)';
        btn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:17px;padding:6px 10px;opacity:0.75;display:inline-flex;align-items:center;transition:opacity 0.15s ease;';
        btn.innerHTML = '<span>🕒</span>';

        btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
        btn.addEventListener('mouseleave', () => btn.style.opacity = '0.75');
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });

        chatControls.appendChild(btn);
    }

    openModal() {
        const existing = document.getElementById(this.modalId);
        if (existing) existing.remove();

        // Get text currently typed in chat input if any
        const inputEl = document.querySelector('.chat-input__textarea, .ProseMirror, textarea[placeholder*="Napisz"], textarea');
        const draftText = inputEl ? (inputEl.value || inputEl.innerText || '').trim() : '';

        // Default time: 1 hour from now
        const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
        const tzOffset = defaultDate.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(defaultDate.getTime() - tzOffset)).toISOString().slice(0, 16);

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.innerHTML = `
            <div class="te-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;animation:feFadeIn 0.2s ease;">
                <div class="te-modal-box" style="background:var(--color-main-background,#fff);color:var(--color-main-text,#111);width:90%;max-width:540px;max-height:85vh;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.3);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-border,#e5e7eb);">
                    <!-- Header -->
                    <div style="padding:16px 20px;border-bottom:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;background:var(--color-background-hover,#f9fafb);">
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:22px;">🕒</span>
                            <div>
                                <h3 style="margin:0;font-size:16px;font-weight:700;">Zaplanuj wiadomość na później</h3>
                                <p style="margin:2px 0 0;font-size:12px;opacity:0.75;">Wiadomość zostanie automatycznie wysłana w wybranym momencie</p>
                            </div>
                        </div>
                        <button class="te-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;opacity:0.6;">&times;</button>
                    </div>

                    <!-- Content -->
                    <div style="padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:14px;">
                        <div>
                            <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Treść wiadomości:</label>
                            <textarea id="te-sched-text" rows="3" placeholder="Wpisz treść wiadomości do zaplanowania..." style="width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid var(--color-border,#ccc);background:inherit;color:inherit;font-family:inherit;font-size:13px;resize:vertical;">${draftText}</textarea>
                        </div>

                        <!-- Quick Presets -->
                        <div>
                            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;opacity:0.8;">Szybki wybór czasu:</label>
                            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                                <button class="te-sched-preset" data-min="15" style="padding:6px 10px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:12px;">+15 min</button>
                                <button class="te-sched-preset" data-min="60" style="padding:6px 10px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:12px;">+1 godzina</button>
                                <button class="te-sched-preset" data-min="180" style="padding:6px 10px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:12px;">+3 godziny</button>
                                <button class="te-sched-preset" data-target="tomorrow-9" style="padding:6px 10px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:12px;">Jutro 09:00</button>
                            </div>
                        </div>

                        <!-- Custom Date Picker -->
                        <div>
                            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px;opacity:0.8;">Dokładna data i godzina:</label>
                            <input type="datetime-local" id="te-sched-time" value="${localISOTime}" style="padding:8px 12px;border-radius:6px;border:1px solid var(--color-border,#ccc);background:inherit;color:inherit;font-size:13px;width:100%;box-sizing:border-box;">
                        </div>

                        <!-- Scheduled List Section -->
                        <div style="margin-top:6px;border-top:1px solid var(--color-border,#e5e7eb);padding-top:12px;">
                            <h4 style="margin:0 0 8px;font-size:13px;font-weight:700;">Zaplanowane w tej rozmowie:</h4>
                            <div id="te-sched-list" style="max-height:160px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;"></div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding:12px 20px;border-top:1px solid var(--color-border,#e5e7eb);display:flex;justify-content:space-between;align-items:center;background:var(--color-background-hover,#f9fafb);">
                        <button class="te-modal-close" style="padding:7px 16px;border-radius:6px;background:none;border:1px solid var(--color-border,#ccc);color:inherit;cursor:pointer;font-size:13px;">
                            Anuluj
                        </button>
                        <button id="te-sched-save-btn" style="padding:7px 18px;border-radius:6px;background:var(--color-primary,#0082c9);color:#fff;border:none;cursor:pointer;font-weight:600;font-size:13px;">
                            ✓ Zaplanuj wysłanie
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.te-modal-close').forEach(b => {
            b.addEventListener('click', () => modal.remove());
        });

        // Preset handlers
        modal.querySelectorAll('.te-sched-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const timeInput = modal.querySelector('#te-sched-time');
                const min = btn.getAttribute('data-min');
                const target = btn.getAttribute('data-target');
                let targetDate = new Date();

                if (min) {
                    targetDate = new Date(Date.now() + parseInt(min, 10) * 60 * 1000);
                } else if (target === 'tomorrow-9') {
                    targetDate.setDate(targetDate.getDate() + 1);
                    targetDate.setHours(9, 0, 0, 0);
                }

                const off = targetDate.getTimezoneOffset() * 60000;
                timeInput.value = (new Date(targetDate.getTime() - off)).toISOString().slice(0, 16);
            });
        });

        // Save handler
        modal.querySelector('#te-sched-save-btn').addEventListener('click', () => {
            const text = modal.querySelector('#te-sched-text').value.trim();
            const timeStr = modal.querySelector('#te-sched-time').value;
            if (!text) {
                alert('Proszę podać treść wiadomości.');
                return;
            }

            const sendTime = new Date(timeStr).getTime();
            if (isNaN(sendTime) || sendTime <= Date.now()) {
                alert('Data wysłania musi być w przyszłości.');
                return;
            }

            const roomToken = this.getCurrentRoomToken();
            this.addScheduledMessage({ text, sendTime, roomToken });

            // Clear chat input if it matched
            if (inputEl && (inputEl.value === text || inputEl.innerText === text)) {
                if (inputEl.value) inputEl.value = '';
                if (inputEl.innerText) inputEl.innerText = '';
            }

            alert(`Wiadomość została zaplanowana na ${new Date(sendTime).toLocaleString()}!`);
            modal.remove();
        });

        this.renderScheduledList(modal);
    }

    getCurrentRoomToken() {
        const parts = window.location.pathname.split('/').filter(Boolean);
        return parts[parts.length - 1] || 'default';
    }

    getScheduledMessages() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    saveScheduledMessages(list) {
        localStorage.setItem(this.storageKey, JSON.stringify(list));
    }

    addScheduledMessage({ text, sendTime, roomToken }) {
        const list = this.getScheduledMessages();
        list.push({
            id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            text,
            sendTime,
            roomToken,
            createdAt: Date.now()
        });
        this.saveScheduledMessages(list);
    }

    removeScheduledMessage(id) {
        const list = this.getScheduledMessages().filter(m => m.id !== id);
        this.saveScheduledMessages(list);
    }

    renderScheduledList(modal) {
        const listEl = modal.querySelector('#te-sched-list');
        if (!listEl) return;

        const currentRoom = this.getCurrentRoomToken();
        const messages = this.getScheduledMessages().filter(m => m.roomToken === currentRoom);

        if (messages.length === 0) {
            listEl.innerHTML = `<div style="font-size:12px;opacity:0.6;font-style:italic;">Brak zaplanowanych wiadomości w tej rozmowie.</div>`;
            return;
        }

        listEl.innerHTML = messages.map(m => `
            <div style="padding:8px 10px;border-radius:6px;background:rgba(0,0,0,0.04);border:1px solid var(--color-border,#e5e7eb);display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div style="flex:1;overflow:hidden;">
                    <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${this.escapeHtml(m.text)}</div>
                    <div style="font-size:11px;opacity:0.7;">⏰ ${new Date(m.sendTime).toLocaleString()}</div>
                </div>
                <button class="te-sched-cancel-btn" data-id="${m.id}" style="padding:4px 8px;border-radius:4px;background:#fee2e2;color:#dc2626;border:none;cursor:pointer;font-size:11px;font-weight:600;">
                    Usuń
                </button>
            </div>
        `).join('');

        listEl.querySelectorAll('.te-sched-cancel-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.removeScheduledMessage(id);
                this.renderScheduledList(modal);
            });
        });
    }

    startScheduler() {
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => {
            this.checkAndDispatch();
        }, 10000);
    }

    async checkAndDispatch() {
        const list = this.getScheduledMessages();
        const now = Date.now();
        const due = list.filter(m => m.sendTime <= now);

        if (due.length === 0) return;

        for (const msg of due) {
            await this.sendMessageToRoom(msg);
            this.removeScheduledMessage(msg.id);
        }
    }

    async sendMessageToRoom(msg) {
        try {
            const url = `/ocs/v2.php/apps/spreed/api/v1/chat/${msg.roomToken}`;
            const token = (window.OC && window.OC.requestToken) || '';
            const formData = new FormData();
            formData.append('message', msg.text);

            await fetch(url, {
                method: 'POST',
                headers: {
                    'requesttoken': token,
                    'OCS-APIRequest': 'true',
                    'Accept': 'application/json'
                },
                body: formData
            });

            console.info('[ScheduledMessages] Wiadomość zaplanowana została wysłana pomyślnie do pokoju:', msg.roomToken);
        } catch (err) {
            console.warn('[ScheduledMessages] Błąd podczas wysyłania zaplanowanej wiadomości:', err);
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}
