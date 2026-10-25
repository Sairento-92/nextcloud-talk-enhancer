<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Service;

use OCP\IDBConnection;
use Throwable;

class StatsService {
    public function __construct(
        private IDBConnection $db,
    ) {
    }

    /**
     * Get aggregate statistics about Nextcloud Talk usage
     *
     * @return array<string, mixed>
     */
    public function getStats(): array {
        $stats = [
            'totalRooms' => 0,
            'publicRooms' => 0,
            'groupRooms' => 0,
            'directRooms' => 0,
            'totalMessages' => 0,
            'messages24h' => 0,
            'messages7d' => 0,
            'topRooms' => [],
        ];

        try {
            // Count rooms by type
            $qb = $this->db->getQueryBuilder();
            $qb->select('type')
                ->selectAlias($qb->createFunction('COUNT(*)'), 'count')
                ->from('talk_rooms')
                ->groupBy('type');
            $result = $qb->executeQuery();
            while ($row = $result->fetch()) {
                $type = (int)$row['type'];
                $count = (int)$row['count'];
                $stats['totalRooms'] += $count;
                if ($type === 1) {
                    $stats['directRooms'] += $count;
                } elseif ($type === 2) {
                    $stats['groupRooms'] += $count;
                } elseif ($type === 3) {
                    $stats['publicRooms'] += $count;
                }
            }
            $result->closeCursor();

            // Total messages
            $qb = $this->db->getQueryBuilder();
            $qb->select($qb->createFunction('COUNT(*)'))
                ->from('talk_messages');
            $stats['totalMessages'] = (int)$qb->executeQuery()->fetchOne();

            // Messages last 24 hours
            $now = time();
            $yesterday = $now - 86400;
            $qb = $this->db->getQueryBuilder();
            $qb->select($qb->createFunction('COUNT(*)'))
                ->from('talk_messages')
                ->where($qb->expr()->gte('timestamp', $qb->createNamedParameter($yesterday)));
            $stats['messages24h'] = (int)$qb->executeQuery()->fetchOne();

            // Messages last 7 days
            $sevenDaysAgo = $now - (7 * 86400);
            $qb = $this->db->getQueryBuilder();
            $qb->select($qb->createFunction('COUNT(*)'))
                ->from('talk_messages')
                ->where($qb->expr()->gte('timestamp', $qb->createNamedParameter($sevenDaysAgo)));
            $stats['messages7d'] = (int)$qb->executeQuery()->fetchOne();

            // Top 5 active rooms
            $qb = $this->db->getQueryBuilder();
            $qb->select('r.token', 'r.name')
                ->selectAlias($qb->createFunction('COUNT(m.id)'), 'msg_count')
                ->from('talk_rooms', 'r')
                ->leftJoin('r', 'talk_messages', 'm', $qb->expr()->eq('r.id', 'm.room_id'))
                ->groupBy('r.id', 'r.token', 'r.name')
                ->orderBy('msg_count', 'DESC')
                ->setMaxResults(5);
            $result = $qb->executeQuery();
            while ($row = $result->fetch()) {
                $stats['topRooms'][] = [
                    'token' => (string)$row['token'],
                    'name' => (string)($row['name'] ?: 'Bez nazwy'),
                    'messageCount' => (int)$row['msg_count'],
                ];
            }
            $result->closeCursor();
        } catch (Throwable) {
            // If tables do not exist or query fails
        }

        return $stats;
    }

    /**
     * Purge messages older than given number of days
     *
     * @param int $days
     * @param bool $dryRun
     * @return array{deletedCount: int, cutoffTimestamp: int}
     */
    public function cleanupOldMessages(int $days, bool $dryRun = false): array {
        $cutoff = time() - ($days * 86400);

        $qb = $this->db->getQueryBuilder();
        $qb->select($qb->createFunction('COUNT(*)'))
            ->from('talk_messages')
            ->where($qb->expr()->lt('timestamp', $qb->createNamedParameter($cutoff)));
        $count = (int)$qb->executeQuery()->fetchOne();

        if (!$dryRun && $count > 0) {
            $deleteQb = $this->db->getQueryBuilder();
            $deleteQb->delete('talk_messages')
                ->where($deleteQb->expr()->lt('timestamp', $deleteQb->createNamedParameter($cutoff)));
            $deleteQb->executeStatement();
        }

        return [
            'deletedCount' => $count,
            'cutoffTimestamp' => $cutoff,
        ];
    }
}
