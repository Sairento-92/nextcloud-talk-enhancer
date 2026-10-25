/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

export function initDlpClient() {
    console.info('TalkEnhancer: Client-side DLP protection initialized');

    document.addEventListener('paste', (e) => {
        const text = e.clipboardData?.getData('text/plain') || '';
        if (!text) return;

        if (text.includes('BEGIN RSA PRIVATE KEY') || text.includes('BEGIN PRIVATE KEY') || text.includes('BEGIN OPENSSH PRIVATE KEY')) {
            const proceed = confirm('⚠️ OSTRZEŻENIE BEZPIECZEŃSTWA (DLP):\n\nWklejasz klucz prywatny (PRIVATE KEY)! Publikowanie kluczy na czacie stwarza bezpośrednie zagrożenie bezpieczeństwa.\n\nCzy na pewno chcesz wkleić tę treść?');
            if (!proceed) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, true);
}
