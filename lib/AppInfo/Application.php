<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\AppInfo;

use OCA\TalkEnhancer\BackgroundJob\CleanupJob;
use OCA\TalkEnhancer\Command\BroadcastCommand;
use OCA\TalkEnhancer\Command\CleanupCommand;
use OCA\TalkEnhancer\Command\ExportRoomCommand;
use OCA\TalkEnhancer\Command\StatsCommand;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Util;

class Application extends App implements IBootstrap {
    public const APP_ID = 'talk_enhancer';

    public function __construct() {
        parent::__construct(self::APP_ID);
    }

    public function register(IRegistrationContext $context): void {
        // Register OCC Console Commands
        $context->registerCommand(StatsCommand::class);
        $context->registerCommand(BroadcastCommand::class);
        $context->registerCommand(CleanupCommand::class);
        $context->registerCommand(ExportRoomCommand::class);

        // Register Background Job
        $context->registerTimedJob(CleanupJob::class);
    }

    public function boot(IBootContext $context): void {
        Util::addScript(self::APP_ID, 'talk_enhancer');
        Util::addStyle(self::APP_ID, 'talk_enhancer');
    }
}
