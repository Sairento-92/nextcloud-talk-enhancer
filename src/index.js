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

			// Download code snippet button
			const downloadBtn = document.createElement('button')
			downloadBtn.className = 'talk-download-code-btn'
			downloadBtn.type = 'button'
			downloadBtn.title = 'Pobierz jako plik'
			downloadBtn.innerText = '💾 Pobierz'

			downloadBtn.addEventListener('click', (e) => {
				e.stopPropagation()
				const extMap = {
					python: 'py', javascript: 'js', typescript: 'ts', bash: 'sh', powershell: 'ps1',
					sql: 'sql', html: 'html', css: 'css', scss: 'scss', json: 'json', php: 'php',
					c: 'c', cpp: 'cpp', csharp: 'cs', java: 'java', kotlin: 'kt', go: 'go', rust: 'rs',
					yaml: 'yaml', markdown: 'md', diff: 'diff', xml: 'xml', lua: 'lua', ini: 'ini'
				}
				const ext = extMap[highlighted.lang] || 'txt'
				const filename = `snippet_${highlighted.lang || 'code'}.${ext}`
				const blob = new Blob([rawText], { type: 'text/plain;charset=utf-8' })
				const url = URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = filename
				document.body.appendChild(a)
				a.click()
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			})

			headerBar.appendChild(downloadBtn)
			headerBar.appendChild(copyBtn)
			preEl.insertBefore(headerBar, preEl.firstChild)

			// Collapse/Fold long code blocks (> 15 lines)
			const lines = rawText.split('\n')
			if (lines.length > 15 && !preEl.querySelector('.talk-expand-code-bar')) {
				preEl.classList.add('talk-code-collapsed')
				const expandBar = document.createElement('div')
				expandBar.className = 'talk-expand-code-bar'
				const expandBtn = document.createElement('button')
				expandBtn.className = 'talk-expand-code-btn'
				expandBtn.innerText = `▼ Rozwiń kod (${lines.length} linii)`
				let expanded = false
				expandBtn.onclick = (e) => {
					e.stopPropagation()
					expanded = !expanded
					if (expanded) {
						preEl.classList.remove('talk-code-collapsed')
						expandBtn.innerText = '▲ Zwiń kod'
						expandBar.style.position = 'relative'
						expandBar.style.height = '32px'
					} else {
						preEl.classList.add('talk-code-collapsed')
						expandBtn.innerText = `▼ Rozwiń kod (${lines.length} linii)`
						expandBar.style.position = 'absolute'
						expandBar.style.height = '52px'
					}
				}
				expandBar.appendChild(expandBtn)
				preEl.appendChild(expandBar)
			}
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
 * Fix Issue #19616 / PR #19919 & Issue #19906: Remember Image Quality & Default "Allow editing of uploaded files"
 */
function setupImageQualityMemory() {
	try {
		if (localStorage.getItem('skipCompression') === null) {
			localStorage.setItem('skipCompression', 'true')
		}
		if (localStorage.getItem('allowUpdate') === null) {
			localStorage.setItem('allowUpdate', 'true')
		}
	} catch (e) {}

	const observer = new MutationObserver(() => {
		const uploadEditor = document.querySelector('.upload-editor, .attachments-preview')
		if (uploadEditor) {
			// Image quality (PR #19919 / Issue #19616)
			const highQualityRadio = uploadEditor.querySelector('input[type="radio"][value="high"], input[type="radio"][value="original"]')
			if (highQualityRadio && !highQualityRadio.checked && !highQualityRadio.dataset.autoSelected) {
				highQualityRadio.dataset.autoSelected = 'true'
				highQualityRadio.click()
			}

			// Issue #19906: Default "Allow editing of uploaded files" toggle
			const editableOption = uploadEditor.querySelector('input[type="radio"][value="editable"], input[type="checkbox"][name*="allowUpdate"], input[name*="edit"]')
			if (editableOption && !editableOption.checked && !editableOption.dataset.autoSelected) {
				editableOption.dataset.autoSelected = 'true'
				editableOption.click()
			}
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Fix Issue #19839: Configurable default conversation on Talk startup
 */
function setupDefaultConversation() {
	try {
		const defaultToken = localStorage.getItem('talk_default_conversation_token')
		if (defaultToken && (window.location.pathname.endsWith('/apps/spreed') || window.location.pathname.endsWith('/apps/spreed/'))) {
			if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
				console.info('[TalkEnhancer] Navigating to configured default conversation:', defaultToken)
				window.location.hash = '#/call/' + defaultToken
			}
		}

		// Add "Set as default conversation" button to room header / actions
		const addDefaultRoomBtn = () => {
			const headerActions = document.querySelector('.conversation-header__actions, .top-bar__actions')
			if (headerActions && !document.querySelector('.talk-set-default-room-btn')) {
				const btn = document.createElement('button')
				btn.className = 'talk-set-default-room-btn'
				btn.title = 'Ustaw ten czat jako domyślny przy uruchomieniu Talk'
				btn.style.cssText = 'background:transparent;border:none;cursor:pointer;font-size:16px;padding:4px 8px;opacity:0.7;'
				btn.innerHTML = '📌'
				btn.onclick = () => {
					const currentHash = window.location.hash
					const match = currentHash.match(/call\/([a-zA-Z0-9_-]+)/)
					if (match) {
						localStorage.setItem('talk_default_conversation_token', match[1])
						btn.style.opacity = '1'
						if (window.OC?.dialogs?.info) {
							window.OC.dialogs.info('Ten czat został pomyślnie ustawiony jako domyślny przy starcie!', 'Nextcloud Talk')
						}
					}
				}
				headerActions.prepend(btn)
			}
		}
		const observer = new MutationObserver(addDefaultRoomBtn)
		observer.observe(document.body, { childList: true, subtree: true })
	} catch (e) {}
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
 * Fix Issue #19904: Real-time microphone level feedback in lobby/call view
 */
function setupMicLevelVisualizer() {
	let audioCtx = null
	let analyser = null
	let stream = null

	async function startAudioMonitor() {
		try {
			if (audioCtx) return
			stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
			audioCtx = new (window.AudioContext || window.webkitAudioContext)()
			const src = audioCtx.createMediaStreamSource(stream)
			analyser = audioCtx.createAnalyser()
			analyser.fftSize = 64
			src.connect(analyser)

			const dataArray = new Uint8Array(analyser.frequencyBinCount)
			const update = () => {
				if (!analyser) return
				analyser.getByteFrequencyData(dataArray)
				let sum = 0
				for (let i = 0; i < dataArray.length; i++) sum += dataArray[i]
				const avg = sum / dataArray.length
				const meter = document.querySelector('.talk-mic-level-meter-inner')
				if (meter) {
					meter.style.width = Math.min(100, Math.round((avg / 128) * 100)) + '%'
				}
				requestAnimationFrame(update)
			}
			update()
		} catch (e) {
			console.debug('[TalkEnhancer] Mic monitor not started:', e)
		}
	}

	const observer = new MutationObserver(() => {
		const mediaControls = document.querySelector('.action-item--audio, .media-controls, .call-lobby__controls')
		if (mediaControls && !document.querySelector('.talk-mic-level-meter')) {
			const container = document.createElement('div')
			container.className = 'talk-mic-level-meter'
			container.title = 'Wskaźnik poziomu mikrofonu (Twoje urządzenie działa poprawnie)'
			container.style.cssText = 'width:60px;height:4px;background:rgba(255,255,255,0.2);border-radius:2px;overflow:hidden;margin:4px auto;'
			const inner = document.createElement('div')
			inner.className = 'talk-mic-level-meter-inner'
			inner.style.cssText = 'width:0%;height:100%;background:#46ba6f;transition:width 0.1s ease;'
			container.appendChild(inner)
			mediaControls.appendChild(container)
			startAudioMonitor()
		}
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Fix Issue #19653: Guard scheduled messages with attachments from unresponsive UI
 */
function setupScheduledMessageAttachmentGuard() {
	document.addEventListener('click', (e) => {
		const sendBtn = e.target.closest('.new-message-form__button-send, button[type="submit"]')
		if (!sendBtn) return
		const scheduledHint = document.querySelector('.new-message-form__hint--scheduled')
		const attachments = document.querySelector('.new-message-attachments, .attachments-preview')
		if (scheduledHint && attachments && attachments.children.length > 0) {
			console.warn('[TalkEnhancer] Planowanie wiadomości z plikami wymaga osobnego wysłania załącznika.')
			if (window.OC?.dialogs?.alert) {
				window.OC.dialogs.alert('Planowanie wysyłki wiadomości z załączonymi plikami nie jest jeszcze wspierane przez serwer. Wyślij plik od razu lub zaplanuj sam tekst.', 'Nextcloud Talk')
			}
		}
	}, true)
}

/**
 * Fix Issue #19541: Safeguard Talk dashboard widget errors from crashing dashboard
 */
function setupDashboardWidgetSafety() {
	window.addEventListener('error', (e) => {
		if (e.message && e.message.includes("can't access property \"data\"") && e.filename && e.filename.includes('DashboardApp')) {
			console.warn('[TalkEnhancer] Intercepted Talk Dashboard widget error to prevent dashboard crash', e.message)
			e.preventDefault()
			e.stopPropagation()
		}
	}, true)
}

/**
 * Voice Message playback speed control (1x, 1.25x, 1.5x, 2x)
 */
function setupVoiceMessageSpeedControl() {
	const RATES = [1.0, 1.25, 1.5, 2.0]
	const observer = new MutationObserver(() => {
		const audios = document.querySelectorAll('audio:not(.talk-speed-enhanced)')
		audios.forEach((audio) => {
			audio.classList.add('talk-speed-enhanced')
			const parent = audio.closest('.message__audio, .audio-message, .message, div')
			if (parent && !parent.querySelector('.talk-voice-speed-btn')) {
				const btn = document.createElement('button')
				btn.className = 'talk-voice-speed-btn'
				btn.type = 'button'
				btn.title = 'Zmień prędkość odtwarzania'
				let rateIndex = 0
				btn.innerText = '1x'
				btn.onclick = (e) => {
					e.stopPropagation()
					e.preventDefault()
					rateIndex = (rateIndex + 1) % RATES.length
					const newRate = RATES[rateIndex]
					audio.playbackRate = newRate
					btn.innerText = `${newRate}x`
				}
				if (audio.parentElement) {
					audio.parentElement.appendChild(btn)
				}
			}
		})
	})
	observer.observe(document.body, { childList: true, subtree: true })
}

/**
 * Auto-save unsent message drafts per conversation (Drafts Persistence)
 */
function setupMessageDraftsPersistence() {
	let currentToken = ''
	const getRoomToken = () => {
		const hash = window.location.hash
		const m = hash.match(/call\/([a-zA-Z0-9_-]+)/)
		return m ? m[1] : ''
	}

	const saveDraft = (text) => {
		const token = getRoomToken()
		if (!token) return
		if (text && text.trim()) {
			localStorage.setItem('talk_draft_' + token, text)
		} else {
			localStorage.removeItem('talk_draft_' + token)
		}
	}

	const restoreDraft = () => {
		const token = getRoomToken()
		if (!token || token === currentToken) return
		currentToken = token

		const saved = localStorage.getItem('talk_draft_' + token)
		if (!saved) return

		setTimeout(() => {
			const input = document.querySelector('.new-message-form__input, .ProseMirror, textarea[placeholder*="Wiadomość"], textarea[placeholder*="Message"]')
			if (input && (!input.textContent || !input.textContent.trim())) {
				if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
					input.value = saved
					input.dispatchEvent(new Event('input', { bubbles: true }))
				} else {
					input.innerText = saved
					input.dispatchEvent(new Event('input', { bubbles: true }))
				}
				console.info('[TalkEnhancer] Przywrócono wersję roboczą wiadomości dla pokoju:', token)
			}
		}, 300)
	}

	window.addEventListener('hashchange', restoreDraft)
	document.addEventListener('input', (e) => {
		const target = e.target
		if (target && (target.classList.contains('new-message-form__input') || target.classList.contains('ProseMirror') || target.tagName === 'TEXTAREA')) {
			saveDraft(target.value || target.innerText || '')
		}
	})

	document.addEventListener('submit', () => {
		const token = getRoomToken()
		if (token) localStorage.removeItem('talk_draft_' + token)
	})
	document.addEventListener('click', (e) => {
		if (e.target.closest('.new-message-form__button-send, button[type="submit"]')) {
			const token = getRoomToken()
			if (token) localStorage.removeItem('talk_draft_' + token)
		}
	})

	restoreDraft()
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
	setupMicLevelVisualizer()
	setupScheduledMessageAttachmentGuard()
	setupDashboardWidgetSafety()
	setupDefaultConversation()
	setupVoiceMessageSpeedControl()
	setupMessageDraftsPersistence()
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
