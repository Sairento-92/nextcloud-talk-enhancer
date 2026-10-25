/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * Resolves PR #19952 / Issue #19946: Grouping adjacent attachments into a compact gallery
 */

export function setupBulkAttachmentGrouping() {
    console.info('TalkEnhancer: Bulk Attachment Gallery Grouping initialized (PR #19952)');

    function groupAdjacentAttachments() {
        const chatMessages = document.querySelectorAll('.chat-message:not([data-enhancer-grouped])');
        if (!chatMessages.length) return;

        chatMessages.forEach((msgEl) => {
            msgEl.setAttribute('data-enhancer-grouped', 'true');

            // Find image attachments within this message container
            const attachments = msgEl.querySelectorAll('.attachment-preview, .message-attachment, .chat-message__attachment');
            if (attachments.length > 1) {
                const container = attachments[0].parentElement;
                if (container && !container.classList.contains('talk-enhancer-gallery-grid')) {
                    container.classList.add('talk-enhancer-gallery-grid');
                    container.style.cssText = `
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                        gap: 8px;
                        max-width: 600px;
                        margin-top: 6px;
                    `;
                }
            }
        });
    }

    setInterval(groupAdjacentAttachments, 1500);
}
