<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Controller;

use OCA\TalkEnhancer\Service\StatsService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

class StatsController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private StatsService $statsService,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Get aggregate statistics about Talk usage
     */
    public function getOverview(): JSONResponse {
        $stats = $this->statsService->getStats();
        return new JSONResponse([
            'success' => true,
            'stats' => $stats,
            'timestamp' => time(),
        ]);
    }
}
