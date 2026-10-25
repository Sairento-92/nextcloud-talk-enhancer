/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Resolves Issue #19852: Unread reaction badge indicator on conversation list
 */

export function setupReactionUnreadIndicators() {
    console.info('TalkEnhancer: Reaction unread indicators initialized (Issue #19852)');

    function checkRecentReactions() {
        const reactions = document.querySelectorAll('.message-reactions__reaction:not([data-enhancer-seen])');
        if (!reactions.length) return;

        reactions.forEach((reactionEl) => {
            reactionEl.setAttribute('data-enhancer-seen', 'true');
            // Check if reaction was added recently (within the current session)
            const isSelf = reactionEl.classList.contains('message-reactions__reaction--self');
            if (!isSelf) {
                // Find active conversation or room title and add reaction glow
                const roomToken = window.location.hash.match(/\/call\/([a-zA-Z0-9]+)/)?.[1];
                if (roomToken) {
                    const convItem = document.querySelector(`[data-token="${roomToken}"], a[href*="${roomToken}"]`);
                    if (convItem && !convItem.querySelector('.talk-enhancer-reaction-ping')) {
                        const ping = document.createElement('span');
                        ping.className = 'talk-enhancer-reaction-ping';
                        ping.textContent = reactionEl.textContent?.trim() || '👍';
                        ping.title = 'Nowa reakcja na wiadomość';
                        ping.style.cssText = `
                            display: inline-flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 11px;
                            margin-left: 6px;
                            animation: pulse-reaction 2s ease infinite;
                        `;
                        const titleEl = convItem.querySelector('.ac-conversation__title, .line-one, .app-navigation-entry-name');
                        if (titleEl) {
                            titleEl.appendChild(ping);
                        }
                    }
                }
            }
        });
    }

    setInterval(checkRecentReactions, 2000);
}
