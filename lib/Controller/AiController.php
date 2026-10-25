<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Controller;

use OCA\TalkEnhancer\Service\AiService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class AiController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private AiService $aiService,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Check Ollama connectivity and available models
     */
    public function status(): JSONResponse {
        $status = $this->aiService->checkStatus();
        return new JSONResponse($status);
    }

    /**
     * Ask AI a question
     */
    public function ask(): JSONResponse {
        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true) ?: [];

        $prompt = $payload['prompt'] ?? $this->request->getParam('prompt');
        $model = $payload['model'] ?? $this->request->getParam('model');

        if (!$prompt || !is_string($prompt) || trim($prompt) === '') {
            return new JSONResponse([
                'success' => false,
                'error' => 'Wymagany parametr "prompt" jest pusty.',
            ], 400);
        }

        $result = $this->aiService->ask(trim($prompt), $model ? (string)$model : null);
        return new JSONResponse($result);
    }
}
