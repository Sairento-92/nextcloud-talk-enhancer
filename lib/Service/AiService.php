<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Service;

use OCP\Http\Client\IClientService;
use OCP\IConfig;
use Psr\Log\LoggerInterface;
use Throwable;

class AiService {
    public const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434';
    public const DEFAULT_MODEL = 'llama3';

    public function __construct(
        private IClientService $clientService,
        private IConfig $config,
        private LoggerInterface $logger,
    ) {
    }

    /**
     * Get configured Ollama base URL
     */
    public function getBaseUrl(): string {
        $url = $this->config->getAppValue('talk_enhancer', 'ollama_url', self::DEFAULT_OLLAMA_URL);
        return rtrim($url, '/');
    }

    /**
     * Get configured default model
     */
    public function getModel(): string {
        return $this->config->getAppValue('talk_enhancer', 'ollama_model', self::DEFAULT_MODEL);
    }

    /**
     * Check if Ollama service is reachable and list available models
     *
     * @return array{online: bool, url: string, models: string[], error?: string}
     */
    public function checkStatus(): array {
        $baseUrl = $this->getBaseUrl();
        try {
            $client = $this->clientService->newClient();
            $response = $client->get($baseUrl . '/api/tags', [
                'timeout' => 3,
                'connect_timeout' => 2,
            ]);

            if ($response->getStatusCode() === 200) {
                $data = json_decode($response->getBody(), true);
                $models = [];
                if (isset($data['models']) && is_array($data['models'])) {
                    foreach ($data['models'] as $m) {
                        if (isset($m['name'])) {
                            $models[] = $m['name'];
                        }
                    }
                }
                return [
                    'online' => true,
                    'url' => $baseUrl,
                    'models' => $models,
                ];
            }
        } catch (Throwable $e) {
            $this->logger->info('TalkEnhancer: Ollama healthcheck failed: ' . $e->getMessage());
            return [
                'online' => false,
                'url' => $baseUrl,
                'models' => [],
                'error' => $e->getMessage(),
            ];
        }

        return [
            'online' => false,
            'url' => $baseUrl,
            'models' => [],
            'error' => 'Non-200 status code returned by Ollama',
        ];
    }

    /**
     * Send a prompt to Ollama LLM and get completion
     *
     * @param string $prompt
     * @param string|null $model
     * @return array{success: bool, response: string, model: string, durationMs?: int}
     */
    public function ask(string $prompt, ?string $model = null): array {
        $baseUrl = $this->getBaseUrl();
        $targetModel = $model ?: $this->getModel();
        $startTime = microtime(true);

        try {
            $client = $this->clientService->newClient();
            $requestPayload = [
                'model' => $targetModel,
                'prompt' => $prompt,
                'stream' => false,
            ];

            $response = $client->post($baseUrl . '/api/generate', [
                'headers' => ['Content-Type' => 'application/json'],
                'body' => json_encode($requestPayload),
                'timeout' => 60,
                'connect_timeout' => 5,
            ]);

            if ($response->getStatusCode() === 200) {
                $data = json_decode($response->getBody(), true);
                $answer = $data['response'] ?? '';
                $duration = (int)((microtime(true) - $startTime) * 1000);

                return [
                    'success' => true,
                    'response' => trim($answer),
                    'model' => $targetModel,
                    'durationMs' => $duration,
                ];
            }

            return [
                'success' => false,
                'response' => 'Błąd serwera Ollama (kod HTTP ' . $response->getStatusCode() . ').',
                'model' => $targetModel,
            ];
        } catch (Throwable $e) {
            // Graceful fallback with instructional assistance
            $duration = (int)((microtime(true) - $startTime) * 1000);
            return [
                'success' => false,
                'response' => "⚠️ **Asystent AI Talk (Ollama)** nie odpowiada pod adresem `{$baseUrl}`.\n\n"
                    . "Aby aktywować lokalne AI na serwerze Nextcloud:\n"
                    . "1. Upewnij się, że Ollama działa: `ollama run llama3`\n"
                    . "2. Skonfiguruj adres w Nextcloud: `occ config:app:set talk_enhancer ollama_url --value=\"http://127.0.0.1:11434\"`\n"
                    . "3. Wybierz model: `occ config:app:set talk_enhancer ollama_model --value=\"llama3\"`\n\n"
                    . "Szczegóły błędu: " . $e->getMessage(),
                'model' => $targetModel,
                'durationMs' => $duration,
            ];
        }
    }
}
