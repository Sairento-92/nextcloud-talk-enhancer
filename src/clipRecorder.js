/**
 * Quick Screen & Call Clip Recorder for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

let mediaRecorder = null;
let recordedChunks = [];
let recordingIndicatorEl = null;
let recordingStartTime = 0;
let recordingTimerInterval = null;
let previewModalEl = null;

export async function startRecordingClip() {
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		stopRecordingClip();
		return;
	}

	let streamToRecord = null;

	const mainVideo = document.querySelector('video');
	if (mainVideo && mainVideo.srcObject instanceof MediaStream) {
		streamToRecord = mainVideo.srcObject;
	}

	if (!streamToRecord) {
		try {
			streamToRecord = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true,
			});
		} catch (e) {
			console.warn('[TalkEnhancer ClipRecorder] User cancelled recording:', e);
			return;
		}
	}

	try {
		recordedChunks = [];
		const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
			? { mimeType: 'video/webm;codecs=vp9,opus' }
			: { mimeType: 'video/webm' };

		mediaRecorder = new MediaRecorder(streamToRecord, options);

		mediaRecorder.ondataavailable = (e) => {
			if (e.data && e.data.size > 0) {
				recordedChunks.push(e.data);
			}
		};

		mediaRecorder.onstop = () => {
			showRecordingPreview(new Blob(recordedChunks, { type: 'video/webm' }));
			removeRecordingIndicator();
		};

		mediaRecorder.start(250);
		recordingStartTime = Date.now();
		showRecordingIndicator();
	} catch (e) {
		console.error('[TalkEnhancer ClipRecorder] Start failed:', e);
	}
}

export function stopRecordingClip() {
	if (mediaRecorder && mediaRecorder.state === 'recording') {
		mediaRecorder.stop();
		mediaRecorder = null;
	}
	removeRecordingIndicator();
}

function showRecordingIndicator() {
	if (recordingIndicatorEl) return;

	recordingIndicatorEl = document.createElement('div');
	recordingIndicatorEl.id = 'enhancer-clip-recording-pill';
	recordingIndicatorEl.innerHTML = `
		<span class="enh-rec-dot"></span>
		<span class="enh-rec-time">REC 00:00</span>
		<button class="enh-rec-stop-btn">⏹️ Zakończ</button>
	`;

	const style = document.createElement('style');
	style.id = 'enhancer-clip-styles';
	style.textContent = `
		#enhancer-clip-recording-pill {
			position: fixed; top: 60px; left: 50%; transform: translateX(-50%);
			background: rgba(20, 24, 30, 0.95); border: 1px solid #ff4742;
			border-radius: 30px; padding: 6px 16px; display: flex; align-items: center;
			gap: 12px; z-index: 9999999; box-shadow: 0 8px 24px rgba(255, 71, 66, 0.4);
			color: white; font-size: 13px; font-weight: 600; font-family: system-ui, sans-serif;
		}
		.enh-rec-dot {
			width: 10px; height: 10px; border-radius: 50%; background: #ff4742;
			animation: enhBlink 1s infinite alternate;
		}
		@keyframes enhBlink { from { opacity: 1; } to { opacity: 0.2; } }
		.enh-rec-stop-btn {
			background: #ff4742; border: none; color: white; padding: 4px 10px;
			border-radius: 14px; cursor: pointer; font-size: 12px; font-weight: 600;
		}
		.enh-rec-stop-btn:hover { background: #e0322d; }
	`;
	document.head.appendChild(style);
	document.body.appendChild(recordingIndicatorEl);

	recordingIndicatorEl.querySelector('.enh-rec-stop-btn')?.addEventListener('click', stopRecordingClip);

	recordingTimerInterval = setInterval(() => {
		if (recordingIndicatorEl) {
			const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
			const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
			const secs = (elapsed % 60).toString().padStart(2, '0');
			const timeEl = recordingIndicatorEl.querySelector('.enh-rec-time');
			if (timeEl) timeEl.textContent = `REC ${mins}:${secs}`;
		}
	}, 1000);
}

function removeRecordingIndicator() {
	if (recordingTimerInterval) {
		clearInterval(recordingTimerInterval);
		recordingTimerInterval = null;
	}
	if (recordingIndicatorEl) {
		recordingIndicatorEl.remove();
		recordingIndicatorEl = null;
	}
	document.getElementById('enhancer-clip-styles')?.remove();
}

function showRecordingPreview(blob) {
	if (previewModalEl) previewModalEl.remove();

	const videoUrl = URL.createObjectURL(blob);
	previewModalEl = document.createElement('div');
	previewModalEl.id = 'enhancer-clip-preview-backdrop';
	previewModalEl.innerHTML = `
		<div style="width:680px;max-width:92vw;background:#1d232a;border:1px solid rgba(255,255,255,0.15);border-radius:14px;display:flex;flex-direction:column;box-shadow:0 25px 50px rgba(0,0,0,0.6);overflow:hidden;font-family:system-ui,sans-serif;">
			<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1);color:#0082c9;font-weight:600;">
				<span>🎥 Nagrany Wycinek (${(blob.size / (1024 * 1024)).toFixed(1)} MB)</span>
				<button id="enh-clip-close" style="background:none;border:none;font-size:18px;color:#888;cursor:pointer;">✕</button>
			</div>
			<div style="padding:16px;background:#0c0e12;display:flex;justify-content:center;">
				<video src="${videoUrl}" controls autoplay style="max-width:100%;max-height:55vh;border-radius:8px;"></video>
			</div>
			<div style="display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;background:rgba(0,0,0,0.15);border-top:1px solid rgba(255,255,255,0.1);">
				<button id="enh-clip-discard" style="background:#2a313d;border:1px solid rgba(255,255,255,0.15);color:white;padding:8px 16px;border-radius:8px;cursor:pointer;">Odrzuć</button>
				<button id="enh-clip-download" style="background:#2a313d;border:1px solid rgba(255,255,255,0.15);color:white;padding:8px 16px;border-radius:8px;cursor:pointer;">💾 Pobierz (.webm)</button>
				<button id="enh-clip-chat" style="background:#0082c9;border:1px solid #0082c9;color:white;padding:8px 16px;border-radius:8px;cursor:pointer;font-weight:600;">📤 Wyślij na czat</button>
			</div>
		</div>
	`;
	previewModalEl.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(8px);z-index:999999;display:flex;align-items:center;justify-content:center;';
	document.body.appendChild(previewModalEl);

	const close = () => {
		URL.revokeObjectURL(videoUrl);
		previewModalEl?.remove();
		previewModalEl = null;
	};

	previewModalEl.querySelector('#enh-clip-close')?.addEventListener('click', close);
	previewModalEl.querySelector('#enh-clip-discard')?.addEventListener('click', close);

	previewModalEl.querySelector('#enh-clip-download')?.addEventListener('click', () => {
		const a = document.createElement('a');
		a.href = videoUrl;
		a.download = `Wycinek-Talk-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
		a.click();
	});

	previewModalEl.querySelector('#enh-clip-chat')?.addEventListener('click', () => {
		const fileInput = document.querySelector('input[type="file"]');
		if (fileInput) {
			const file = new File([blob], `Wycinek-Talk-${Date.now()}.webm`, { type: 'video/webm' });
			const dataTransfer = new DataTransfer();
			dataTransfer.items.add(file);
			fileInput.files = dataTransfer.files;
			fileInput.dispatchEvent(new Event('change', { bubbles: true }));
			close();
		}
	});
}

export function setupClipRecorderWeb(isDesktop) {
	if (isDesktop) return;

	window.addEventListener('talk:record:toggle', () => {
		if (mediaRecorder && mediaRecorder.state === 'recording') {
			stopRecordingClip();
		} else {
			startRecordingClip();
		}
	});

	// Slash command listener (/record)
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Enter') {
			const target = e.target;
			if (target && typeof target.value === 'string' && target.value.trim() === '/record') {
				e.preventDefault();
				target.value = '';
				startRecordingClip();
			}
		}
	});
}
