/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Resolves Issue #19994: Auto-reconnect signaling after WebSocket close 1001 from Reverse Proxy
 */

export function setupWebSocketWatchdog() {
    console.info('TalkEnhancer: WebSocket 1001 Reverse Proxy Watchdog initialized (Issue #19994)');

    const OriginalWebSocket = window.WebSocket;
    if (!OriginalWebSocket) return;

    window.WebSocket = function (url, protocols) {
        const ws = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);

        ws.addEventListener('close', (event) => {
            // Code 1001 = "Going Away" (frequently sent by Nginx, Traefik, HAProxy, Cloudflare on timeout/restart)
            // Code 1006 = Abnormal closure without close frame
            if (event.code === 1001 || event.code === 1006) {
                console.warn(`[TalkEnhancer] WebSocket closed with code ${event.code} (${event.reason || 'Proxy Reset'}). Scheduling immediate silent reconnect...`);
                
                setTimeout(() => {
                    if (window.OCA?.Talk?.Signaling?.reconnect) {
                        try {
                            window.OCA.Talk.Signaling.reconnect();
                        } catch (e) {
                            console.error('[TalkEnhancer] Error triggering signaling reconnect:', e);
                        }
                    } else if (window.OCA?.Talk?.SimpleWebRTC?.reconnect) {
                        try {
                            window.OCA.Talk.SimpleWebRTC.reconnect();
                        } catch (e) {}
                    }
                }, 1500);
            }
        });

        return ws;
    };

    // Copy static constants (OPEN, CLOSED, etc.)
    for (const prop in OriginalWebSocket) {
        if (Object.prototype.hasOwnProperty.call(OriginalWebSocket, prop)) {
            window.WebSocket[prop] = OriginalWebSocket[prop];
        }
    }
    window.WebSocket.prototype = OriginalWebSocket.prototype;
}
