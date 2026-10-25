/**
 * Pinned Messages Bar for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

let bannerEl = null;

function getCurrentToken() {
	const hash = window.location.hash || '';
	const match = hash.match(/\/(?:call|conversation)\/([a-zA-Z0-9]+)/);
	return match ? match[1] : 'default';
}

export function pinMessage(text, author = '') {
	const token = getCurrentToken();
	const key = `talk_pinned_${token}`;
	localStorage.setItem(key, JSON.stringify({ text, author, time: Date.now() }));
	renderPinnedBanner();
}

export function unpinMessage() {
	const token = getCurrentToken();
	const key = `talk_pinned_${token}`;
	localStorage.removeItem(key);
	if (bannerEl) {
		bannerEl.remove();
		bannerEl = null;
	}
}

export function renderPinnedBanner() {
	const token = getCurrentToken();
	const key = `talk_pinned_${token}`;
	const raw = localStorage.getItem(key);

	if (!raw) {
		if (bannerEl) {
			bannerEl.remove();
			bannerEl = null;
		}
		return;
	}

	try {
		const data = JSON.parse(raw);
		const chatContainer = document.querySelector('.conversation, #app-content, .chat-view');
		if (!chatContainer) return;

		if (!bannerEl) {
			bannerEl = document.createElement('div');
			bannerEl.id = 'talk-pinned-banner';
			bannerEl.style.cssText = 'background:rgba(0,130,201,0.15);border-bottom:1px solid rgba(0,130,201,0.3);padding:6px 16px;display:flex;align-items:center;justify-content:space-between;color:#eee;font-size:12px;font-family:system-ui,sans-serif;z-index:100;backdrop-filter:blur(6px);';
			chatContainer.prepend(bannerEl);
		}

		bannerEl.innerHTML = `
			<div style="display:flex;align-items:center;gap:8px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">
				<span style="font-size:14px;">📌</span>
				<span style="font-weight:600;color:#0082c9;">${data.author ? data.author + ':' : 'Ważne:'}</span>
				<span style="opacity:0.9;overflow:hidden;text-overflow:ellipsis;">${data.text}</span>
			</div>
			<button id="talk-unpin-btn" title="Odepnij wiadomość" style="background:none;border:none;color:#aaa;cursor:pointer;font-size:14px;padding:2px 6px;">✕</button>
		`;

		bannerEl.querySelector('#talk-unpin-btn')?.addEventListener('click', unpinMessage);
	} catch (e) {}
}

export function setupPinnedMessagesWeb(isDesktop) {
	if (isDesktop) return;

	setInterval(renderPinnedBanner, 2000);
	window.addEventListener('hashchange', () => setTimeout(renderPinnedBanner, 500));

	// Add Pin button to message actions on hover
	document.addEventListener('mouseover', (e) => {
		const target = e.target;
		if (target && target.matches && target.matches('.message, .comment')) {
			if (target.querySelector('.talk-pin-action-btn')) return;

			const actionsEl = target.querySelector('.message__actions, .comment__actions');
			if (actionsEl) {
				const pinBtn = document.createElement('button');
				pinBtn.className = 'talk-pin-action-btn';
				pinBtn.title = 'Przypnij tę wiadomość na górze pokoju';
				pinBtn.innerHTML = '📌';
				pinBtn.style.cssText = 'background:none;border:none;cursor:pointer;font-size:12px;opacity:0.6;padding:2px 4px;';
				pinBtn.addEventListener('click', (ev) => {
					ev.stopPropagation();
					const textEl = target.querySelector('.message__text, .text');
					const authorEl = target.querySelector('.message__author, .author');
					pinMessage(textEl?.textContent?.trim() || '', authorEl?.textContent?.trim() || '');
				});
				actionsEl.prepend(pinBtn);
			}
		}
	});
}
