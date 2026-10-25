<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;

class AdminController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private IConfig $config,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Save admin settings
     */
    public function saveSettings(): JSONResponse {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?: [];

        $ollamaUrl = $payload['ollama_url'] ?? $this->request->getParam('ollama_url');
        $ollamaModel = $payload['ollama_model'] ?? $this->request->getParam('ollama_model');
        $autoCleanup = $payload['auto_cleanup'] ?? $this->request->getParam('auto_cleanup');
        $retentionDays = $payload['retention_days'] ?? $this->request->getParam('retention_days');

        if ($ollamaUrl !== null) {
            $this->config->setAppValue('talk_enhancer', 'ollama_url', trim((string)$ollamaUrl));
        }
        if ($ollamaModel !== null) {
            $this->config->setAppValue('talk_enhancer', 'ollama_model', trim((string)$ollamaModel));
        }
        if ($autoCleanup !== null) {
            $this->config->setAppValue('talk_enhancer', 'auto_cleanup', $autoCleanup === 'yes' ? 'yes' : 'no');
        }
        if ($retentionDays !== null) {
            $days = max(1, (int)$retentionDays);
            $this->config->setAppValue('talk_enhancer', 'retention_days', (string)$days);
        }

        return new JSONResponse([
            'success' => true,
            'message' => 'Ustawienia zostały zapisane.',
        ]);
    }
}
