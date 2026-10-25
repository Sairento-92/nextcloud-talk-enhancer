/**
 * Real-time AI Noise Suppression (RNNoise WASM / WebAudio) for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { RNNOISE_WASM_BASE64, RNNOISE_WORKLET_CODE } from './rnnoiseAssets.js';

let wasmBinaryCache = null;

function getWasmBinary() {
	if (!wasmBinaryCache) {
		const binaryString = atob(RNNOISE_WASM_BASE64);
		const len = binaryString.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		wasmBinaryCache = bytes;
	}
	return wasmBinaryCache;
}

let workletModuleUrl = null;

function getWorkletBlobUrl() {
	if (!workletModuleUrl) {
		const blob = new Blob([RNNOISE_WORKLET_CODE], { type: 'application/javascript' });
		workletModuleUrl = URL.createObjectURL(blob);
	}
	return workletModuleUrl;
}

let isInitialized = false;

export function setupWebNoiseSuppression(isDesktop) {
	if (isDesktop || isInitialized || typeof navigator === 'undefined' || !navigator.mediaDevices) {
		return;
	}
	isInitialized = true;

	const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

	navigator.mediaDevices.getUserMedia = async function (constraints) {
		const rawStream = await originalGetUserMedia(constraints);

		if (!constraints || !constraints.audio) {
			return rawStream;
		}

		// Check if user disabled RNNoise in localStorage
		const disabled = localStorage.getItem('talk_rnnoise_disabled') === 'true';
		if (disabled) {
			return rawStream;
		}

		const rawAudioTrack = rawStream.getAudioTracks()[0];
		if (!rawAudioTrack) {
			return rawStream;
		}

		try {
			const AudioContextClass = window.AudioContext || window.webkitAudioContext;
			if (!AudioContextClass) {
				return rawStream;
			}

			const audioCtx = new AudioContextClass({ sampleRate: 48000 });
			if (audioCtx.state === 'suspended') {
				await audioCtx.resume();
			}

			await audioCtx.audioWorklet.addModule(getWorkletBlobUrl());

			const sourceNode = audioCtx.createMediaStreamSource(new MediaStream([rawAudioTrack]));
			const rnnoiseNode = new AudioWorkletNode(audioCtx, '@sapphi-red/web-noise-suppressor/rnnoise', {
				processorOptions: {
					maxChannels: 1,
					wasmBinary: getWasmBinary(),
				},
			});

			const destinationNode = audioCtx.createMediaStreamDestination();
			sourceNode.connect(rnnoiseNode);
			rnnoiseNode.connect(destinationNode);

			const cleanAudioTrack = destinationNode.stream.getAudioTracks()[0];
			if (!cleanAudioTrack) {
				return rawStream;
			}

			const cleanup = () => {
				try {
					rnnoiseNode.port.postMessage('destroy');
					sourceNode.disconnect();
					rnnoiseNode.disconnect();
					audioCtx.close().catch(() => {});
				} catch (e) {}
			};

			rawAudioTrack.addEventListener('ended', () => {
				cleanAudioTrack.stop();
				cleanup();
			});

			cleanAudioTrack.addEventListener('ended', () => {
				rawAudioTrack.stop();
				cleanup();
			});

			cleanAudioTrack.enabled = rawAudioTrack.enabled;

			const combinedTracks = [cleanAudioTrack, ...rawStream.getVideoTracks()];
			const cleanStream = new MediaStream(combinedTracks);

			console.info('[TalkEnhancer] AI Noise Suppression (RNNoise) active on web microphone stream.');
			return cleanStream;
		} catch (err) {
			console.warn('[TalkEnhancer] RNNoise filter initialization fallback:', err);
			return rawStream;
		}
	};
}
