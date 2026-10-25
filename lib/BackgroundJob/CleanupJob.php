<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\BackgroundJob;

use OCA\TalkEnhancer\Service\StatsService;
use OCP\AppFramework\Utility\ITimeFactory;
use OCP\BackgroundJob\TimedJob;
use OCP\IConfig;
use Psr\Log\LoggerInterface;
use Throwable;

class CleanupJob extends TimedJob {
    public function __construct(
        ITimeFactory $time,
        private StatsService $statsService,
        private IConfig $config,
        private LoggerInterface $logger,
    ) {
        parent::__construct($time);
        // Run once every 24 hours
        $this->setInterval(86400);
    }

    protected function run($arguments): void {
        $enabled = $this->config->getAppValue('talk_enhancer', 'auto_cleanup', 'no');
        if ($enabled !== 'yes') {
            return;
        }

        $days = (int)$this->config->getAppValue('talk_enhancer', 'retention_days', '90');
        if ($days < 1) {
            $days = 90;
        }

        try {
            $result = $this->statsService->cleanupOldMessages($days, false);
            $this->logger->info("TalkEnhancer CleanupJob: usunięto {$result['deletedCount']} starych wiadomości (retencja: {$days} dni).");
        } catch (Throwable $e) {
            $this->logger->error("TalkEnhancer CleanupJob error: " . $e->getMessage());
        }
    }
}
