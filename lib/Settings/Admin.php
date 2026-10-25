<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Settings;

use OCA\TalkEnhancer\Service\AiService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Admin implements ISettings {
    public function __construct(
        private IConfig $config,
        private AiService $aiService,
    ) {
    }

    public function getForm(): TemplateResponse {
        $ollamaUrl = $this->config->getAppValue('talk_enhancer', 'ollama_url', AiService::DEFAULT_OLLAMA_URL);
        $ollamaModel = $this->config->getAppValue('talk_enhancer', 'ollama_model', AiService::DEFAULT_MODEL);
        $autoCleanup = $this->config->getAppValue('talk_enhancer', 'auto_cleanup', 'no');
        $retentionDays = $this->config->getAppValue('talk_enhancer', 'retention_days', '90');

        $aiStatus = $this->aiService->checkStatus();

        return new TemplateResponse('talk_enhancer', 'admin', [
            'ollamaUrl' => $ollamaUrl,
            'ollamaModel' => $ollamaModel,
            'autoCleanup' => $autoCleanup,
            'retentionDays' => $retentionDays,
            'aiOnline' => $aiStatus['online'],
            'aiModels' => $aiStatus['models'],
        ]);
    }

    public function getSection(): string {
        return 'talk';
    }

    public function getPriority(): int {
        return 75;
    }
}
