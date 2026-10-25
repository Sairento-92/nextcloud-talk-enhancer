import { HURIKO_LOGO } from "./logo.js";
/**
 * Nextcloud Talk Enhancer - Server App Client Script
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import hljs from 'highlight.js'

const COMMON_LANGUAGES = [
	'python', 'javascript', 'typescript', 'bash', 'powershell',
	'json', 'html', 'xml', 'css', 'scss', 'sql', 'php', 'c', 'cpp',
	'csharp', 'java', 'kotlin', 'go', 'rust', 'yaml', 'dockerfile',
	'diff', 'markdown', 'ini', 'lua',
]

/**
 * Robust language detection from element class or text heuristics
 */
function detectLanguage(codeText, classNames = '') {
	const classMatch = classNames.match(/(?:language-|lang-)([a-zA-Z0-9_-]+)/i) ||
	                   classNames.match(/\b(python|py|python3|javascript|js|typescript|ts|html|css|json|bash|sh|powershell|ps1|sql|php|rust|go|c|cpp|csharp|cs|yaml|yml)\b/i)

	if (classMatch) {
		let lang = classMatch[1].toLowerCase()
		if (lang === 'py' || lang === 'python3') lang = 'python'
		if (lang === 'js') lang = 'javascript'
		if (lang === 'ts') lang = 'typescript'
		if (lang === 'sh') lang = 'bash'
		if (lang === 'ps1') lang = 'powershell'
		if (lang === 'yml') lang = 'yaml'
		if (lang === 'cs') lang = 'csharp'
		if (hljs.getLanguage(lang)) {
			return lang
		}
	}

	// Python heuristics
	if (
		/\bdef\s+[a-zA-Z_]\w*\s*\(/.test(codeText) ||
		/^\s*(import\s+[\w.]+|from\s+[\w.]+\s+import)/m.test(codeText) ||
		/\bprint\s*\([^)]*\)/.test(codeText) ||
		/\b(if|elif|while)\s+.*:\s*$/m.test(codeText) ||
		/\bclass\s+[a-zA-Z_]\w*(\s*\(.*?\))?\s*:/.test(codeText) ||
		/\b(self\.|__init__|__name__\s*==\s*['"]__main__['"])/.test(codeText) ||
		(/\b(True|False|None)\b/.test(codeText) && /\b(def|import|in|for|if|return)\b/.test(codeText))
	) {
		return 'python'
	}

	// PowerShell heuristics
	if (/\b(Get-\w+|Set-\w+|New-\w+|Invoke-\w+|Write-Host|\$PSScriptRoot|\$env:|\$PSVersionTable)\b/i.test(codeText)) {
		return 'powershell'
	}

	// SQL heuristics
	if (/^\s*(SELECT|INSERT\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE|ALTER\s+TABLE)\b/im.test(codeText)) {
		return 'sql'
	}

	// JavaScript / TypeScript
	if (/\b(const|let|var)\s+\w+\s*=|console\.(log|error|warn)\(|\bfunction\s+\w+\s*\(|=>\s*\{/.test(codeText)) {
		if (/\b(interface|type\s+\w+\s*=|:\s*(string|number|boolean|any)\b)/.test(codeText)) {
			return 'typescript'
		}
		return 'javascript'
	}

	// JSON
	if (/^\s*[\{\[][\s\S]*[\}\]]\s*$/.test(codeText.trim()) && /"[\w-]+"\s*:\s*/.test(codeText)) {
		return 'json'
	}

	// Auto-detect subset
	const auto = hljs.highlightAuto(codeText, COMMON_LANGUAGES)
	if (auto.language && auto.relevance > 3) {
		return auto.language
	}

	return 'plaintext'
}

/**
 * Highlight snippet
 */
function highlightCode(codeText, classNames = '') {
	const lang = detectLanguage(codeText, classNames)
	if (lang !== 'plaintext' && hljs.getLanguage(lang)) {
		try {
			const res = hljs.highlight(codeText, { language: lang, ignoreIllegals: true })
			return { lang, html: res.value }
		} catch (err) {
			console.warn('[TalkEnhancer] Error highlighting code:', err)
		}
	}
	const escaped = codeText
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
	return { lang: 'plaintext', html: escaped }
}

/**
 * Enhance all code blocks in the document
 */
function enhanceCodeBlocks(root = document) {
	const codeBlocks = root.querySelectorAll('pre code:not(.talk-highlighted)')
	codeBlocks.forEach((codeEl) => {
		const code = codeEl
		code.classList.add('talk-highlighted')

		const rawText = code.textContent || code.innerText || ''
		if (!rawText.trim()) return

		const combinedClasses = `${code.className} ${code.parentElement ? code.parentElement.className : ''}`
		const highlighted = highlightCode(rawText, combinedClasses)

		code.innerHTML = highlighted.html
		code.className = `hljs language-${highlighted.lang} talk-highlighted`

		const preEl = code.parentElement
		if (preEl && preEl.tagName === 'PRE' && !preEl.querySelector('.talk-code-header-bar')) {
			preEl.style.position = 'relative'

			const headerBar = document.createElement('div')
			headerBar.className = 'talk-code-header-bar'

			if (highlighted.lang && highlighted.lang !== 'plaintext') {
				const badge = document.createElement('span')
				badge.className = 'talk-code-lang-badge'
				badge.innerText = highlighted.lang
				headerBar.appendChild(badge)
			}

			const copyBtn = document.createElement('button')
			copyBtn.className = 'talk-copy-code-btn'
			copyBtn.type = 'button'
			copyBtn.innerText = '📋 Kopiuj'

			copyBtn.addEventListener('click', (e) => {
				e.stopPropagation()
				navigator.clipboard.writeText(rawText).then(() => {
					copyBtn.innerText = '✅ Skopiowano!'
					copyBtn.classList.add('copied')
					setTimeout(() => {
						copyBtn.innerText = '📋 Kopiuj'
						copyBtn.classList.remove('copied')
					}, 2000)
				})
			})

			headerBar.appendChild(copyBtn)
			preEl.insertBefore(headerBar, preEl.firstChild)
		}
	})
}

/**
 * Smart code paste
 */
function setupSmartCodePaste() {
	document.addEventListener('paste', (e) => {
		const target = e.target
		if (!target) return

		const isInputField =
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'INPUT' ||
			target.isContentEditable ||
			target.closest('[contenteditable="true"]')

		if (!isInputField) return

		const pastedText = e.clipboardData ? e.clipboardData.getData('text') : ''
		if (!pastedText) return

		const lines = pastedText.trim().split('\n')
		if (lines.length < 2) return

		const codePatterns = [
			/[{}();=>]/,
			/\b(function|const|let|var|def|class|import|export|from|return|if|else|switch|case|break|try|catch)\b/,
			/\b(SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP BY|ORDER BY)\b/i,
			/\b(powershell|Set-ItemProperty|Get-Item|Start-Process|Write-Host|curl|bash|sudo|apt|git)\b/i,
			/\b(def\s+\w+\(|public\s+class|interface\s+\w+|struct\s+\w+)/,
			/^\s*(<\?php|#!\/bin|<div|<html|<!DOCTYPE)/i,
			/\b(\$env:|\$\w+->|\$\w+\s*=)/,
		]

		let matchCount = 0
		for (const pattern of codePatterns) {
			if (pattern.test(pastedText)) matchCount++
		}
		const hasIndentation = lines.some((l) => l.startsWith('  ') || l.startsWith('\t'))

		if ((matchCount >= 2 || (matchCount >= 1 && hasIndentation)) && !pastedText.trim().startsWith('```')) {
			e.preventDefault()
			const lang = detectLanguage(pastedText)
			const langTag = lang !== 'plaintext' ? lang : ''
			const formattedSnippet = `\`\`\`${langTag}\n${pastedText.trimEnd()}\n\`\`\`\n`

			if (target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement) {
				const start = target.selectionStart || 0
				const end = target.selectionEnd || 0
				target.setRangeText(formattedSnippet, start, end, 'end')
				target.dispatchEvent(new Event('input', { bubbles: true }))
			} else {
				document.execCommand('insertText', false, formattedSnippet)
			}
		}
	})
}

/**
 * Call Exit Privacy Confirmation (Resolves Issue #2003)
 */
function setupCallExitProtection() {
	window.addEventListener('beforeunload', (e) => {
		const hasActiveCall =
			document.querySelector('.incall') !== null ||
			document.querySelector('.video-container') !== null ||
			document.querySelector('[data-call-active="true"]') !== null ||
			(window.location.pathname.includes('/call/') && !window.location.pathname.endsWith('/call/'))

		if (hasActiveCall) {
			const message = 'Nadal uczestniczysz w aktywnej rozmowie głosowej/wideo w Nextcloud Talk. Czy na pewno chcesz opuścić połączenie?'
			e.returnValue = message
			return message
		}
	})
}

/**
 * Fix Issue #19616 / PR #19919: Remember Original Image Quality Choice
 */
function setupImageQualityMemory() {
	try {
		if (localStorage.getItem('skipCompression') === null) {
			localStorage.setItem('skipCompression', 'true')
		}
	} catch (e) {}

	const observer = new MutationObserver(() => {
		const uploadEditor = document.querySelector('.upload-editor, .attachments-preview')
		if (uploadEditor) {
			const highQualityRadio = uploadEditor.querySelector('input[type="radio"][value="high"], input[type="radio"][value="original"]')
			if (highQualityRadio && !highQualityRadio.checked && !highQualityRadio.dataset.autoSelected) {
				highQualityRadio.dataset.autoSelected = 'true'
				highQualityRadio.click()
			}
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Fix Issue #1766: Dragging file attachments saves original file instead of thumbnail
 */
function setupFileDragAndDropFix() {
	document.addEventListener('dragstart', (e) => {
		const target = e.target
		if (!target) return

		const previewWrapper = target.closest('.file-preview, .file-previews-wrapper, .message-attachment')
		if (!previewWrapper) return

		if (target.tagName === 'IMG') {
			target.draggable = false
		}

		const fileLink = previewWrapper.querySelector('a[href*="/files/"], a[download], a[href*="download"]') || previewWrapper.closest('a')
		if (fileLink && fileLink.href) {
			const downloadUrl = fileLink.href
			const filename = fileLink.getAttribute('download') ||
			                 previewWrapper.querySelector('.file-preview__name, .file-name, [title]')?.getAttribute('title') ||
			                 previewWrapper.querySelector('.file-preview__name, .file-name')?.textContent?.trim() ||
			                 'file'

			const mime = 'application/octet-stream'
			e.dataTransfer.setData('DownloadURL', `${mime}:${filename}:${downloadUrl}`)
			e.dataTransfer.setData('text/uri-list', downloadUrl)
			e.dataTransfer.setData('text/plain', downloadUrl)
		}
	}, true)
}

/**
 * Fix Issue #19838: Web Hotkeys (Mute, Video, Search)
 */
function setupWebHotkeys() {
	document.addEventListener('keydown', (e) => {
		const target = e.target
		const isTyping =
			target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.isContentEditable ||
			target.closest('[contenteditable="true"]')

		if (!isTyping && !e.ctrlKey && !e.metaKey && !e.altKey) {
			if (e.key === 'm' || e.key === 'M') {
				e.preventDefault()
				const muteBtn = document.querySelector('button[aria-label*="Mute"], button[aria-label*="Wycisz"], button[aria-label*="Mikrofon"], .action-item--audio button')
				muteBtn?.click()
			} else if (e.key === 'v' || e.key === 'V') {
				e.preventDefault()
				const videoBtn = document.querySelector('button[aria-label*="Video"], button[aria-label*="Kamera"], .action-item--video button')
				videoBtn?.click()
			} else if (e.key === '/') {
				e.preventDefault()
				const chatInput = document.querySelector('.new-message__input, textarea.rich-text--input, [contenteditable="true"]')
				chatInput?.focus()
			}
		}
	})
}

/**
 * Fix Issue #19994: Auto-reconnect signaling on network recovery
 */
function setupSignalingAutoReconnect() {
	window.addEventListener('online', () => {
		console.log('[TalkEnhancer] Network online, verifying Talk signaling status')
		if (window.OCA?.Talk?.Signaling?.reconnect) {
			window.OCA.Talk.Signaling.reconnect()
		}
	})
}

/**
 * Inject Huriko & Fork by Sairento Branding in Header
 */
function injectBrandingPill() {
	if (document.querySelector('.huriko-fork-pill')) return

	const targetContainer = document.querySelector('.header-left, .app-header, #app-navigation, .header-appname')
	if (targetContainer) {
		const pill = document.createElement('div')
		pill.className = 'huriko-fork-pill'
		pill.innerHTML = `
			<img src="${HURIKO_LOGO}" alt="Huriko" onerror="this.style.display='none'" />
			<span>Fork by Sairento</span>
		`
		targetContainer.appendChild(pill)
	}
}

/**
 * Fix Issue #1757: Image Viewer rotation buttons in Web Talk
 */
function setupImageViewerRotation() {
	let currentRotation = 0
	const observer = new MutationObserver(() => {
		const viewer = document.querySelector('#viewer, .viewer-modal, [class*="viewer-modal"], .viewer-wrapper, .viewer')
		if (!viewer) {
			currentRotation = 0
			return
		}
		const img = viewer.querySelector('img.viewer-image, img.viewer-media, img')
		if (!img) return

		let toolbar = viewer.querySelector('.viewer__actions, .modal-header__actions, [class*="actions"]')
		if (!toolbar) {
			toolbar = viewer.querySelector('.modal-header')
		}
		if (toolbar && !toolbar.querySelector('.talk-enhancer-rotate-btn')) {
			const btnLeft = document.createElement('button')
			btnLeft.type = 'button'
			btnLeft.className = 'talk-enhancer-rotate-btn icon-rotate-left'
			btnLeft.title = 'Obróć w lewo (-90°)'
			btnLeft.style.cssText = 'background:none;border:none;cursor:pointer;padding:6px;font-size:16px;color:var(--color-primary-text, #fff);display:inline-flex;align-items:center;'
			btnLeft.innerHTML = '↺'
			btnLeft.addEventListener('click', (e) => {
				e.stopPropagation()
				currentRotation = (currentRotation - 90) % 360
				img.style.transform = `rotate(${currentRotation}deg)`
				img.style.transition = 'transform 0.25s ease-in-out'
			})

			const btnRight = document.createElement('button')
			btnRight.type = 'button'
			btnRight.className = 'talk-enhancer-rotate-btn icon-rotate-right'
			btnRight.title = 'Obróć w prawo (+90°)'
			btnRight.style.cssText = 'background:none;border:none;cursor:pointer;padding:6px;font-size:16px;color:var(--color-primary-text, #fff);display:inline-flex;align-items:center;'
			btnRight.innerHTML = '↻'
			btnRight.addEventListener('click', (e) => {
				e.stopPropagation()
				currentRotation = (currentRotation + 90) % 360
				img.style.transform = `rotate(${currentRotation}deg)`
				img.style.transition = 'transform 0.25s ease-in-out'
			})

			toolbar.prepend(btnRight)
			toolbar.prepend(btnLeft)
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Fix Issue #19905: Jump to quoted message reply
 */
function setupJumpToQuotedMessage() {
	document.addEventListener('click', (e) => {
		const quoteEl = e.target.closest('.reply-to, .message-reply, [data-parent-id], [class*="reply-preview"]')
		if (!quoteEl) return
		const parentId = quoteEl.getAttribute('data-parent-id') || quoteEl.dataset?.parentId
		let targetMsg = null
		if (parentId) {
			targetMsg = document.querySelector(`[data-message-id="${parentId}"], #message-${parentId}`)
		}
		if (targetMsg) {
			e.preventDefault()
			e.stopPropagation()
			targetMsg.scrollIntoView({ behavior: 'smooth', block: 'center' })
			targetMsg.classList.add('talk-message-highlight')
			setTimeout(() => targetMsg.classList.remove('talk-message-highlight'), 2000)
		}
	})
}

/**
 * Fix PR #19825: Prevent immediate unmute right after moderator force-mutes
 */
function setupForcedMuteProtection() {
	let forcedMuteActive = false
	window.addEventListener('talk:forced-mute', () => {
		forcedMuteActive = true
		setTimeout(() => { forcedMuteActive = false }, 3000)
	})
	document.addEventListener('click', (e) => {
		if (!forcedMuteActive) return
		const muteBtn = e.target.closest('button[aria-label*="Mute"], button[aria-label*="Wycisz"], .action-item--audio button')
		if (muteBtn && forcedMuteActive) {
			e.preventDefault()
			e.stopPropagation()
			console.warn('[TalkEnhancer] Unmute temporarily blocked: Moderator recently forced mute.')
		}
	}, true)
}

/**
 * Fix Issue #19913: Disable upload options gracefully if user quota is 0
 */
function setupQuotaUploadGuard() {
	const userQuota = window.OC?.currentUserData?.quota
	if (userQuota && (userQuota.free === 0 || userQuota.quota === 0)) {
		const uploadButtons = document.querySelectorAll('.new-message__upload-button, [aria-label*="Upload"], [aria-label*="Wgraj"]')
		uploadButtons.forEach(btn => {
			btn.style.display = 'none'
		})
	}
}

/**
 * Initialize
 */
function init() {
	injectBrandingPill()
	setupSmartCodePaste()
	setupCallExitProtection()
	setupImageQualityMemory()
	setupFileDragAndDropFix()
	setupWebHotkeys()
	setupSignalingAutoReconnect()
	setupImageViewerRotation()
	setupJumpToQuotedMessage()
	setupForcedMuteProtection()
	setupQuotaUploadGuard()
	enhanceCodeBlocks()

	const observer = new MutationObserver(() => {
		injectBrandingPill()
		enhanceCodeBlocks()
	})
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	})
	console.log('[TalkEnhancer] Active on cloud.huriko.com (Syntax Highlighting, Quality Memory, Drag Fix & Hotkeys ready)');
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init)
} else {
	init()
}
