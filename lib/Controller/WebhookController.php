<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\AppFramework\Http\Attribute\NoCSRFRequired;
use OCP\AppFramework\Http\Attribute\PublicPage;
use OCP\IDBConnection;
use OCP\IRequest;
use Psr\Log\LoggerInterface;
use Throwable;

class WebhookController extends Controller {
    public function __construct(
        string $appName,
        IRequest $request,
        private IDBConnection $db,
        private LoggerInterface $logger,
    ) {
        parent::__construct($appName, $request);
    }

    /**
     * Simple healthcheck endpoint
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     * @PublicPage
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    #[PublicPage]
    public function health(): JSONResponse {
        return new JSONResponse([
            'status' => 'ok',
            'app' => 'talk_enhancer',
            'version' => '1.5.0',
            'timestamp' => time(),
        ]);
    }

    /**
     * Receive an incoming webhook and post it as a message to the specified Talk room
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     * @PublicPage
     */
    #[NoAdminRequired]
    #[NoCSRFRequired]
    #[PublicPage]
    public function receive(string $token): JSONResponse {
        $rawInput = file_get_contents('php://input');
        $payload = json_decode($rawInput, true);

        // Support both JSON body and form parameters
        $messageText = $payload['text'] ?? $payload['message'] ?? $payload['content'] ?? $this->request->getParam('text');
        $actorName = $payload['actorDisplayName'] ?? $payload['sender'] ?? $this->request->getParam('actorDisplayName', '🤖 Webhook');

        if (!$messageText || !is_string($messageText) || trim($messageText) === '') {
            return new JSONResponse([
                'success' => false,
                'error' => 'Missing or empty message text. Please provide "text" or "message" in JSON body.',
            ], 400);
        }

        try {
            // Find room ID by token
            $qb = $this->db->getQueryBuilder();
            $qb->select('id', 'name')
                ->from('talk_rooms')
                ->where($qb->expr()->eq('token', $qb->createNamedParameter($token)));
            $room = $qb->executeQuery()->fetch();

            if (!$room) {
                return new JSONResponse([
                    'success' => false,
                    'error' => "Talk room with token '{$token}' not found.",
                ], 404);
            }

            $roomId = (int)$room['id'];
            $now = time();

            // Insert into talk_messages
            $insertQb = $this->db->getQueryBuilder();
            $insertQb->insert('talk_messages')
                ->values([
                    'room_id' => $insertQb->createNamedParameter($roomId),
                    'parent_id' => $insertQb->createNamedParameter(0),
                    'timestamp' => $insertQb->createNamedParameter($now),
                    'actor_type' => $insertQb->createNamedParameter('bots'),
                    'actor_id' => $insertQb->createNamedParameter('webhook'),
                    'actor_display_name' => $insertQb->createNamedParameter($actorName),
                    'message' => $insertQb->createNamedParameter(trim($messageText)),
                    'message_type' => $insertQb->createNamedParameter('comment'),
                    'parameters' => $insertQb->createNamedParameter('{}'),
                ]);
            $insertQb->executeStatement();
            $messageId = (int)$this->db->lastInsertId('talk_messages');

            // Update room's last_message and last_activity
            $updateQb = $this->db->getQueryBuilder();
            $updateQb->update('talk_rooms')
                ->set('last_message', $updateQb->createNamedParameter($now))
                ->set('last_activity', $updateQb->createNamedParameter($now))
                ->where($updateQb->expr()->eq('id', $updateQb->createNamedParameter($roomId)));
            $updateQb->executeStatement();

            return new JSONResponse([
                'success' => true,
                'messageId' => $messageId,
                'roomToken' => $token,
                'roomName' => $room['name'] ?: 'Talk Room',
                'timestamp' => $now,
            ]);
        } catch (Throwable $e) {
            $this->logger->error('TalkEnhancer Webhook error: ' . $e->getMessage());
            return new JSONResponse([
                'success' => false,
                'error' => 'Database error inserting webhook message: ' . $e->getMessage(),
            ], 500);
        }
    }
}
