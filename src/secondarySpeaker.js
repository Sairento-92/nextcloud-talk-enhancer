/**
 * Secondary Speaker & Audio Output Device Routing for Nextcloud Talk Web
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function setupSecondarySpeakerWeb(isDesktop) {
	if (isDesktop) return;

	if (typeof HTMLMediaElement === 'undefined' || !HTMLMediaElement.prototype.setSinkId) {
		return;
	}

	const savedSinkId = localStorage.getItem('talk_secondary_sink_id');
	if (!savedSinkId) return;

	// Intercept all newly created audio elements (ringers) and route sinkId
	const origAudioPlay = HTMLAudioElement.prototype.play;
	HTMLAudioElement.prototype.play = function () {
		if (this.src && (this.src.includes('ring') || this.src.includes('call') || this.src.includes('sound'))) {
			if (this.setSinkId) {
				this.setSinkId(savedSinkId).catch(() => {});
			}
		}
		return origAudioPlay.apply(this, arguments);
	};
}
