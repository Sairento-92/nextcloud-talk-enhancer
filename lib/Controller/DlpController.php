<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Controller;

use OCA\TalkEnhancer\Service\DlpService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class DlpController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private DlpService $dlpService,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Scan message text for sensitive credentials, keys, and PII
     */
    public function scan(): JSONResponse {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?: [];

        $content = $payload['content'] ?? $payload['text'] ?? $this->request->getParam('content', '');
        $autoRedact = (bool)($payload['redact'] ?? false);

        $scanResult = $this->dlpService->scan((string)$content);
        $redactedText = $autoRedact && $scanResult['hasSensitiveData']
            ? $this->dlpService->redact((string)$content)
            : null;

        return new JSONResponse([
            'success' => true,
            'hasSensitiveData' => $scanResult['hasSensitiveData'],
            'matches' => $scanResult['matches'],
            'redactedText' => $redactedText,
        ]);
    }
}
