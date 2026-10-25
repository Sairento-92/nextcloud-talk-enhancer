/**
 * Smart Meeting Summary & Notes Export for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

let summaryModalEl = null;

function getRoomName() {
	const el = document.querySelector('.conversation-name, .call-header__title, h1, .app-navigation-entry-header span');
	return el?.textContent?.trim() || 'Spotkanie Nextcloud Talk';
}

function getParticipants() {
	const names = new Set();
	document.querySelectorAll('.video-item, .participant-item, .participant-name').forEach((el) => {
		const text = el.textContent?.trim();
		if (text && text.length > 1 && !text.includes('\n')) names.add(text);
	});
	document.querySelectorAll('.message__author, .comment__author').forEach((el) => {
		const text = el.textContent?.trim();
		if (text && text.length > 1) names.add(text);
	});
	return names.size > 0 ? Array.from(names) : ['Uczestnicy spotkania'];
}

function getTranscriptsAndMessages() {
	const records = [];
	document.querySelectorAll('.transcript-block, .live-transcription__chunk, .message').forEach((el) => {
		const authorEl = el.querySelector('.transcript-block__author, .message__author, .author');
		const textEl = el.querySelector('.transcript-block__text, .message__text, .text, [data-rich-text="true"]');
		const timeEl = el.querySelector('.transcript-block__time, .message__time, time');
		const text = textEl?.textContent?.trim();
		if (text && text.length > 0) {
			records.push({
				author: authorEl?.textContent?.trim() || 'Rozmówca',
				text,
				time: timeEl?.textContent?.trim() || '',
			});
		}
	});
	return records;
}

export function generateMeetingSummaryMarkdown() {
	const room = getRoomName();
	const now = new Date();
	const dateStr = now.toLocaleDateString('pl-PL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	const attendees = getParticipants();
	const records = getTranscriptsAndMessages();

	let md = `# 📋 Raport ze Spotkania: ${room}\n\n`;
	md += `**📅 Data:** ${dateStr}  \n`;
	md += `**👥 Uczestnicy:** ${attendees.join(', ')}  \n\n`;
	md += `---\n\n`;
	md += `## 💡 Kluczowe Ustalenia i Notatki\n\n`;

	if (records.length > 0) {
		const uniquePoints = records.filter(r => r.text.length > 15).slice(0, 5);
		if (uniquePoints.length > 0) {
			uniquePoints.forEach(p => {
				md += `- **${p.author}:** ${p.text}\n`;
			});
		} else {
			md += `- Omówiono bieżące postępy prac i cele zespołu.\n`;
		}
	} else {
		md += `- Podsumowanie dyskusji i ustaleń z trwającej sesji połączenia.\n`;
	}

	md += `\n## ✅ Lista Zadań (Action Items)\n\n`;
	md += `- [ ] Przygotować podsumowanie i rozesłać notatki do uczestników\n`;
	md += `- [ ] Zrealizować ustalone punkty działania\n\n`;
	md += `---\n\n`;
	md += `## 📝 Zapis Transkrypcji / Wiadomości ze Spotkania\n\n`;

	if (records.length > 0) {
		records.forEach(r => {
			md += `> **${r.author}** ${r.time ? `*(${r.time})*` : ''}: ${r.text}\n>\n`;
		});
	} else {
		md += `*Brak zarejestrowanych transkrypcji w tej sesji rozmowy.*\n`;
	}

	return md;
}

export function openMeetingSummaryModal() {
	if (summaryModalEl) {
		closeMeetingSummaryModal();
		return;
	}

	const markdownReport = generateMeetingSummaryMarkdown();

	summaryModalEl = document.createElement('div');
	summaryModalEl.id = 'enhancer-summary-modal-backdrop';
	summaryModalEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;';
	summaryModalEl.innerHTML = `
		<div style="width:720px;max-width:92vw;height:80vh;background:#1d232a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.6);overflow:hidden;">
			<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);color:#0082c9;font-weight:600;font-size:16px;">
				<span>📋 Notatki i Podsumowanie Spotkania</span>
				<button id="enh-sum-close" style="background:none;border:none;font-size:18px;color:#888;cursor:pointer;">✕</button>
			</div>
			<div style="flex:1;padding:16px;display:flex;">
				<textarea style="width:100%;height:100%;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e5e5e5;font-family:monospace;font-size:13px;line-height:1.5;padding:14px;resize:none;outline:none;" readonly>${markdownReport}</textarea>
			</div>
			<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;padding:14px 20px;background:rgba(0,0,0,0.15);border-top:1px solid rgba(255,255,255,0.1);">
				<button id="enh-sum-copy" style="background:#2a313d;border:1px solid rgba(255,255,255,0.15);color:white;padding:8px 14px;border-radius:8px;cursor:pointer;">📋 Kopiuj do schowka</button>
				<button id="enh-sum-download" style="background:#2a313d;border:1px solid rgba(255,255,255,0.15);color:white;padding:8px 14px;border-radius:8px;cursor:pointer;">💾 Pobierz Markdown (.md)</button>
				<button id="enh-sum-print" style="background:#2a313d;border:1px solid rgba(255,255,255,0.15);color:white;padding:8px 14px;border-radius:8px;cursor:pointer;">🖨️ Zapisz jako PDF / Drukuj</button>
				<button id="enh-sum-chat" style="background:#0082c9;border:1px solid #0082c9;color:white;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;">💬 Wyślij na czat</button>
			</div>
		</div>
	`;
	document.body.appendChild(summaryModalEl);

	summaryModalEl.querySelector('#enh-sum-close')?.addEventListener('click', closeMeetingSummaryModal);

	summaryModalEl.querySelector('#enh-sum-copy')?.addEventListener('click', () => {
		navigator.clipboard.writeText(markdownReport).then(() => {
			const btn = summaryModalEl.querySelector('#enh-sum-copy');
			if (btn) btn.textContent = '✅ Skopiowano!';
			setTimeout(() => { if (btn) btn.textContent = '📋 Kopiuj do schowka'; }, 2000);
		});
	});

	summaryModalEl.querySelector('#enh-sum-download')?.addEventListener('click', () => {
		const blob = new Blob([markdownReport], { type: 'text/markdown;charset=utf-8' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `Spotkanie-${getRoomName().replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
		a.click();
		URL.revokeObjectURL(url);
	});

	summaryModalEl.querySelector('#enh-sum-print')?.addEventListener('click', () => {
		const printWin = window.open('', '_blank');
		if (printWin) {
			printWin.document.write(`
				<html><head><title>Raport: ${getRoomName()}</title>
				<style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:40px;color:#222;}h1{color:#0082c9;border-bottom:2px solid #0082c9;}blockquote{border-left:3px solid #0082c9;padding-left:12px;color:#555;}</style>
				</head><body><pre style="font-family:inherit;white-space:pre-wrap;">${markdownReport}</pre>
				<script>window.onload=function(){window.print();}<\/script></body></html>
			`);
			printWin.document.close();
		}
	});

	summaryModalEl.querySelector('#enh-sum-chat')?.addEventListener('click', () => {
		const inputEl = document.querySelector('.new-message-form__advanced-input, textarea, [contenteditable="true"]');
		if (inputEl) {
			if ('value' in inputEl) inputEl.value = markdownReport;
			else inputEl.textContent = markdownReport;
			inputEl.dispatchEvent(new Event('input', { bubbles: true }));
			closeMeetingSummaryModal();
		}
	});
}

export function closeMeetingSummaryModal() {
	if (summaryModalEl) {
		summaryModalEl.remove();
		summaryModalEl = null;
	}
}

export function setupMeetingSummaryWeb(isDesktop) {
	if (isDesktop) return;

	window.addEventListener('talk:summary:open', openMeetingSummaryModal);

	document.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const target = e.target;
			if (target && typeof target.value === 'string' && target.value.trim() === '/summary') {
				e.preventDefault();
				target.value = '';
				openMeetingSummaryModal();
			}
		}
	});
}
