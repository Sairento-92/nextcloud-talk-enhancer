/**
 * Zen / Distraction-Free Mode (Alt+Z) for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

let isZenMode = false;
let exitPillEl = null;

export function toggleZenMode() {
	isZenMode = !isZenMode;

	if (isZenMode) {
		document.body.classList.add('talk-zen-mode-active');
		if (!exitPillEl) {
			exitPillEl = document.createElement('div');
			exitPillEl.id = 'talk-zen-exit-pill';
			exitPillEl.innerHTML = '<span>🗖 Tryb Zen aktywny</span> <button>Wyjdź (Alt+Z)</button>';
			exitPillEl.style.cssText = 'position:fixed;top:10px;right:20px;background:rgba(0,0,0,0.85);backdrop-filter:blur(6px);border:1px solid #0082c9;border-radius:20px;padding:4px 12px;color:white;font-size:11px;font-weight:600;display:flex;align-items:center;gap:8px;z-index:999999;box-shadow:0 4px 15px rgba(0,0,0,0.5);font-family:system-ui,sans-serif;';
			const btn = exitPillEl.querySelector('button');
			if (btn) {
				btn.style.cssText = 'background:#0082c9;border:none;color:white;border-radius:10px;padding:2px 8px;cursor:pointer;font-size:10px;';
				btn.addEventListener('click', toggleZenMode);
			}
			document.body.appendChild(exitPillEl);
		}

		if (!document.getElementById('talk-zen-styles')) {
			const style = document.createElement('style');
			style.id = 'talk-zen-styles';
			style.textContent = `
				body.talk-zen-mode-active #header { display: none !important; }
				body.talk-zen-mode-active #app-navigation { display: none !important; }
				body.talk-zen-mode-active #content { padding-top: 0 !important; margin-left: 0 !important; width: 100vw !important; height: 100vh !important; }
				body.talk-zen-mode-active #app-content { margin-left: 0 !important; width: 100vw !important; height: 100vh !important; }
			`;
			document.head.appendChild(style);
		}
	} else {
		document.body.classList.remove('talk-zen-mode-active');
		if (exitPillEl) {
			exitPillEl.remove();
			exitPillEl = null;
		}
	}
}

export function setupZenModeWeb(isDesktop) {
	if (isDesktop) return;

	window.addEventListener('keydown', (e) => {
		if (e.altKey && e.key.toLowerCase() === 'z') {
			e.preventDefault();
			toggleZenMode();
		} else if (e.key === 'Escape' && isZenMode) {
			toggleZenMode();
		}
	});
}
