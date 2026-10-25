<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

return [
    'routes' => [
        // Webhooks
        ['name' => 'webhook#receive', 'url' => '/api/v1/webhook/{token}', 'verb' => 'POST'],
        ['name' => 'webhook#health', 'url' => '/api/v1/health', 'verb' => 'GET'],
        
        // AI Integration (Ollama / LocalAI)
        ['name' => 'ai#ask', 'url' => '/api/v1/ai/ask', 'verb' => 'POST'],
        ['name' => 'ai#status', 'url' => '/api/v1/ai/status', 'verb' => 'GET'],
        
        // Server Statistics & DLP Check
        ['name' => 'stats#getOverview', 'url' => '/api/v1/stats', 'verb' => 'GET'],
        ['name' => 'dlp#scan', 'url' => '/api/v1/dlp/scan', 'verb' => 'POST'],
    ]
];
