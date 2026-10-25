<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Service;

class DlpService {
    /**
     * Patterns for sensitive data detection
     */
    private const SENSITIVE_PATTERNS = [
        'OpenAI API Key' => '/\bsk-[A-Za-z0-9]{32,64}\b/',
        'GitHub Personal Access Token' => '/\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b/',
        'AWS Access Key ID' => '/\bAKIA[0-9A-Z]{16}\b/',
        'Slack Bot Token' => '/\bxoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24}\b/',
        'Generic Private Key' => '/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/',
        'Database Connection URI with Password' => '/(?:mysql|postgres|postgresql|mongodb):\/\/[^:\s]+:([^@\s]+)@[^:\s]+/i',
        'Credit Card Number (Luhn Pattern)' => '/\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/',
        'Polish PESEL' => '/\b\d{2}(?:0[1-9]|1[0-2]|2[1-9]|3[0-2])\d{7}\b/',
    ];

    /**
     * Scan text for sensitive secrets or private data
     *
     * @param string $content
     * @return array{hasSensitiveData: bool, matches: array<string, int>}
     */
    public function scan(string $content): array {
        $findings = [];
        $hasSensitive = false;

        foreach (self::SENSITIVE_PATTERNS as $label => $pattern) {
            $matchCount = preg_match_all($pattern, $content, $matches);
            if ($matchCount && $matchCount > 0) {
                $findings[$label] = $matchCount;
                $hasSensitive = true;
            }
        }

        return [
            'hasSensitiveData' => $hasSensitive,
            'matches' => $findings,
        ];
    }

    /**
     * Redact sensitive secrets from text with [REDACTED] masks
     *
     * @param string $content
     * @return string
     */
    public function redact(string $content): string {
        $redacted = $content;

        foreach (self::SENSITIVE_PATTERNS as $label => $pattern) {
            if ($label === 'Database Connection URI with Password') {
                $redacted = preg_replace('/(:[a-zA-Z0-9_]+:)([^@\s]+)(@)/i', '$1********$3', $redacted) ?? $redacted;
            } elseif ($label === 'Generic Private Key') {
                $redacted = preg_replace($pattern, '-----BEGIN PRIVATE KEY-----\n[... REDACTED BY TALK ENHANCER DLP ...]\n-----END PRIVATE KEY-----', $redacted) ?? $redacted;
            } else {
                $redacted = preg_replace_callback($pattern, static function (array $m): string {
                    $val = $m[0];
                    $len = strlen($val);
                    if ($len <= 8) {
                        return str_repeat('*', $len);
                    }
                    return substr($val, 0, 3) . str_repeat('*', max(4, $len - 7)) . substr($val, -4);
                }, $redacted) ?? $redacted;
            }
        }

        return $redacted;
    }
}
