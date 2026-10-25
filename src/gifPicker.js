/**
 * Quick GIF Picker (/gif) for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

let gifModalEl = null;

const DEFAULT_GIFS = [
	{ title: 'Thumbs Up', url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif' },
	{ title: 'Celebrate / Party', url: 'https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
	{ title: 'Applause / Bravo', url: 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif' },
	{ title: 'Laughing', url: 'https://media.giphy.com/media/xr9AQyxLtjlxS/giphy.gif' },
	{ title: 'Mind Blown', url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif' },
	{ title: 'Working Hard / Cat Typing', url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif' },
	{ title: 'Deal With It', url: 'https://media.giphy.com/media/cEYFeE4wJ6jdDVBiiIM/giphy.gif' },
	{ title: 'Waiting / Popcorn', url: 'https://media.giphy.com/media/tHIRLDeIOJxGDWT835/giphy.gif' },
];

export function openGifPicker(query = '') {
	if (gifModalEl) {
		closeGifPicker();
		return;
	}

	gifModalEl = document.createElement('div');
	gifModalEl.id = 'talk-gif-picker-backdrop';
	gifModalEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
	gifModalEl.innerHTML = `
		<div style="width:520px;max-width:92vw;max-height:80vh;background:#1d232a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.6);overflow:hidden;">
			<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.1);color:#0082c9;font-weight:600;">
				<span>🎬 Wybierz Animowany GIF</span>
				<button id="gif-close-btn" style="background:none;border:none;font-size:18px;color:#888;cursor:pointer;">✕</button>
			</div>
			<div style="padding:12px 18px;border-bottom:1px solid rgba(255,255,255,0.08);">
				<input type="text" id="gif-search-input" value="${query}" placeholder="Szukaj GIF-ów... (np. party, thumbsup)" style="width:100%;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 12px;color:white;outline:none;font-size:13px;" autofocus />
			</div>
			<div id="gif-grid" style="display:grid;grid-template-columns:repeat(2, 1fr);gap:10px;padding:14px;overflow-y:auto;max-height:360px;">
				${DEFAULT_GIFS.map(g => `
					<div class="gif-item" data-url="${g.url}" style="border-radius:8px;overflow:hidden;cursor:pointer;background:#14181f;aspect-ratio:16/9;position:relative;">
						<img src="${g.url}" alt="${g.title}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
						<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);padding:4px 8px;font-size:11px;color:#eee;">${g.title}</div>
					</div>
				`).join('')}
			</div>
		</div>
	`;
	document.body.appendChild(gifModalEl);

	gifModalEl.querySelector('#gif-close-btn')?.addEventListener('click', closeGifPicker);

	gifModalEl.querySelectorAll('.gif-item').forEach(item => {
		item.addEventListener('click', () => {
			const url = item.getAttribute('data-url');
			if (url) {
				const md = `![GIF](${url})`;
				const inputEl = document.querySelector('.new-message-form__advanced-input, textarea, [contenteditable="true"]');
				if (inputEl) {
					if ('value' in inputEl) inputEl.value = md;
					else inputEl.textContent = md;
					inputEl.dispatchEvent(new Event('input', { bubbles: true }));
					const sendBtn = document.querySelector('.new-message-form__submit-button, button[aria-label*="Wyślij" i], button[aria-label*="Send" i]');
					setTimeout(() => sendBtn?.click(), 80);
				}
				closeGifPicker();
			}
		});
	});
}

export function closeGifPicker() {
	if (gifModalEl) {
		gifModalEl.remove();
		gifModalEl = null;
	}
}

export function setupGifPickerWeb(isDesktop) {
	if (isDesktop) return;

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const target = e.target;
			if (target && typeof target.value === 'string' && target.value.trim().startsWith('/gif')) {
				const query = target.value.trim().replace(/^\/gif\s*/, '');
				e.preventDefault();
				target.value = '';
				openGifPicker(query);
			}
		}
	});
}
