/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Interactive Whiteboard - Współdzielona tablica do rysowania i diagramów w Talk
 */

export class Whiteboard {
    constructor() {
        this.modalId = 'te-whiteboard-modal';
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.currentColor = '#0082c9';
        this.lineWidth = 3;
        this.history = [];
        this.init();
    }

    init() {
        this.injectWhiteboardButton();
        this.observeDOM();
    }

    observeDOM() {
        const observer = new MutationObserver(() => {
            this.injectWhiteboardButton();
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    injectWhiteboardButton() {
        const chatControls = document.querySelector('.chat-input__wrapper, .new-message-tools, .video-actions, .call-actions');
        if (!chatControls || document.querySelector('.te-whiteboard-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'te-whiteboard-btn';
        btn.title = 'Otwórz tablicę do rysowania (Whiteboard)';
        btn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:18px;padding:6px 10px;opacity:0.75;display:inline-flex;align-items:center;transition:opacity 0.15s ease;';
        btn.innerHTML = '<span>🎨</span>';

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

        const modal = document.createElement('div');
        modal.id = this.modalId;
        modal.innerHTML = `
            <div class="te-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:center;justify-content:center;">
                <div class="te-modal-box" style="background:var(--color-main-background,#1e232b);color:var(--color-main-text,#fff);width:94%;max-width:1050px;height:86vh;border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,0.4);display:flex;flex-direction:column;overflow:hidden;border:1px solid var(--color-border,#333);">
                    <!-- Header Toolbar -->
                    <div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:space-between;background:rgba(0,0,0,0.25);flex-wrap:wrap;gap:10px;">
                        <div style="display:flex;align-items:center;gap:12px;">
                            <span style="font-size:22px;">🎨</span>
                            <strong style="font-size:15px;">Współdzielona Tablica (Whiteboard)</strong>
                        </div>

                        <!-- Tools & Controls -->
                        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                            <div style="display:flex;gap:4px;background:rgba(255,255,255,0.08);padding:3px;border-radius:8px;">
                                <button class="te-wb-tool active" data-tool="brush" title="Pędzel" style="background:#0082c9;border:none;color:#fff;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;">✏️ Pędzel</button>
                                <button class="te-wb-tool" data-tool="line" title="Linia prosta" style="background:none;border:none;color:#ccc;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;">📏 Linia</button>
                                <button class="te-wb-tool" data-tool="rect" title="Prostokąt" style="background:none;border:none;color:#ccc;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;">▭ Ramka</button>
                                <button class="te-wb-tool" data-tool="circle" title="Koło" style="background:none;border:none;color:#ccc;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;">◯ Koło</button>
                                <button class="te-wb-tool" data-tool="eraser" title="Gumka" style="background:none;border:none;color:#ccc;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:13px;">🧹 Gumka</button>
                            </div>

                            <input type="color" id="te-wb-color" value="#0082c9" style="width:34px;height:34px;border:none;border-radius:6px;cursor:pointer;background:none;">

                            <select id="te-wb-width" style="padding:5px 8px;border-radius:6px;background:#2a313d;color:#fff;border:1px solid #444;font-size:12px;">
                                <option value="2">Cienki (2px)</option>
                                <option value="4" selected>Średni (4px)</option>
                                <option value="8">Gruby (8px)</option>
                                <option value="16">Bardzo gruby (16px)</option>
                            </select>

                            <button id="te-wb-undo" style="background:#2a313d;border:1px solid #444;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">↶ Cofnij</button>
                            <button id="te-wb-clear" style="background:#2a313d;border:1px solid #444;color:#fff;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:12px;">🗑️ Wyczyść</button>
                        </div>

                        <!-- Actions -->
                        <div style="display:flex;align-items:center;gap:10px;">
                            <button id="te-wb-send-chat" style="padding:6px 14px;border-radius:6px;background:#0082c9;color:#fff;border:none;cursor:pointer;font-weight:600;font-size:12px;">
                                💬 Wyślij na czat
                            </button>
                            <button id="te-wb-download" style="padding:6px 12px;border-radius:6px;background:#2a313d;color:#fff;border:1px solid #444;cursor:pointer;font-size:12px;">
                                💾 Pobierz PNG
                            </button>
                            <button class="te-modal-close" style="background:none;border:none;font-size:22px;cursor:pointer;color:inherit;opacity:0.7;margin-left:8px;">&times;</button>
                        </div>
                    </div>

                    <!-- Canvas Board -->
                    <div id="te-wb-canvas-container" style="flex:1;position:relative;background:#ffffff;overflow:hidden;cursor:crosshair;">
                        <canvas id="te-whiteboard-canvas" style="position:absolute;left:0;top:0;width:100%;height:100%;display:block;"></canvas>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.te-modal-close').forEach(b => {
            b.addEventListener('click', () => modal.remove());
        });

        this.setupCanvas(modal);
    }

    setupCanvas(modal) {
        this.canvas = modal.querySelector('#te-whiteboard-canvas');
        const container = modal.querySelector('#te-wb-canvas-container');
        if (!this.canvas || !container) return;

        // Set high-DPI canvas size
        const rect = container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.ctx = this.canvas.getContext('2d');
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Fill white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveHistory();

        // Tool listeners
        const colorInput = modal.querySelector('#te-wb-color');
        const widthSelect = modal.querySelector('#te-wb-width');
        colorInput.addEventListener('input', (e) => this.currentColor = e.target.value);
        widthSelect.addEventListener('change', (e) => this.lineWidth = parseInt(e.target.value, 10));

        modal.querySelectorAll('.te-wb-tool').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.querySelectorAll('.te-wb-tool').forEach(b => {
                    b.style.background = 'none';
                    b.style.color = '#ccc';
                    b.classList.remove('active');
                });
                btn.style.background = '#0082c9';
                btn.style.color = '#fff';
                btn.classList.add('active');
                this.currentTool = btn.getAttribute('data-tool');
            });
        });

        modal.querySelector('#te-wb-clear').addEventListener('click', () => {
            if (confirm('Wyczyścić całą tablicę?')) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                this.saveHistory();
            }
        });

        modal.querySelector('#te-wb-undo').addEventListener('click', () => {
            this.undo();
        });

        modal.querySelector('#te-wb-download').addEventListener('click', () => {
            const a = document.createElement('a');
            a.download = `whiteboard_${Date.now()}.png`;
            a.href = this.canvas.toDataURL('image/png');
            a.click();
        });

        modal.querySelector('#te-wb-send-chat').addEventListener('click', () => {
            this.sendToChat();
        });

        // Mouse drawing handlers
        let startX = 0;
        let startY = 0;
        let snapshot = null;

        const getPos = (e) => {
            const b = this.canvas.getBoundingClientRect();
            return { x: e.clientX - b.left, y: e.clientY - b.top };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            const pos = getPos(e);
            startX = pos.x;
            startY = pos.y;
            this.ctx.strokeStyle = this.currentTool === 'eraser' ? '#ffffff' : this.currentColor;
            this.ctx.lineWidth = this.currentTool === 'eraser' ? this.lineWidth * 3 : this.lineWidth;

            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
            } else {
                snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) return;
            const pos = getPos(e);

            if (this.currentTool === 'brush' || this.currentTool === 'eraser') {
                this.ctx.lineTo(pos.x, pos.y);
                this.ctx.stroke();
            } else {
                this.ctx.putImageData(snapshot, 0, 0);
                this.ctx.beginPath();
                if (this.currentTool === 'line') {
                    this.ctx.moveTo(startX, startY);
                    this.ctx.lineTo(pos.x, pos.y);
                    this.ctx.stroke();
                } else if (this.currentTool === 'rect') {
                    this.ctx.strokeRect(startX, startY, pos.x - startX, pos.y - startY);
                } else if (this.currentTool === 'circle') {
                    const radius = Math.sqrt(Math.pow(pos.x - startX, 2) + Math.pow(pos.y - startY, 2));
                    this.ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
                    this.ctx.stroke();
                }
            }
        });

        const stopDrawing = () => {
            if (this.isDrawing) {
                this.isDrawing = false;
                this.saveHistory();
            }
        };

        this.canvas.addEventListener('mouseup', stopDrawing);
        this.canvas.addEventListener('mouseleave', stopDrawing);
    }

    saveHistory() {
        if (!this.ctx || !this.canvas) return;
        if (this.history.length > 20) this.history.shift();
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
    }

    undo() {
        if (this.history.length > 1) {
            this.history.pop();
            const prev = this.history[this.history.length - 1];
            this.ctx.putImageData(prev, 0, 0);
        }
    }

    async sendToChat() {
        if (!this.canvas) return;
        const dataUrl = this.canvas.toDataURL('image/png');

        // Check if there is an active Talk room
        const roomToken = window.location.pathname.split('/').filter(Boolean).pop();
        const sendBtn = document.getElementById('te-wb-send-chat');
        sendBtn.disabled = true;
        sendBtn.textContent = 'Wysyłanie...';

        try {
            // Convert dataUrl to blob
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const file = new File([blob], `tablica_${Date.now()}.png`, { type: 'image/png' });

            // If Nextcloud Talk file uploader exists in window
            if (window.OCA?.Talk?.uploadFiles) {
                await window.OCA.Talk.uploadFiles([file]);
            } else {
                // Fallback: trigger standard download and alert
                const a = document.createElement('a');
                a.download = file.name;
                a.href = dataUrl;
                a.click();
            }

            alert('Rysunek z tablicy został pomyślnie przygotowany do wysłania na czacie!');
            sendBtn.disabled = false;
            sendBtn.textContent = '💬 Wyślij na czat';
        } catch (err) {
            alert(`Błąd wysyłania: ${err.message}`);
            sendBtn.disabled = false;
            sendBtn.textContent = '💬 Wyślij na czat';
        }
    }
}
