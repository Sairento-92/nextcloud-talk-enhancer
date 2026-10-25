<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Command;

use OCP\IDBConnection;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class BroadcastCommand extends Command {
    public function __construct(
        private IDBConnection $db,
    ) {
        parent::__construct();
    }

    protected function configure(): void {
        $this
            ->setName('talk:enhancer:broadcast')
            ->setDescription('Wysyła ogłoszenie administracyjne do wszystkich pokoi Talk lub wybranego pokoju')
            ->addOption(
                'message',
                'm',
                InputOption::VALUE_REQUIRED,
                'Treść wiadomości do nadania'
            )
            ->addOption(
                'room',
                'r',
                InputOption::VALUE_OPTIONAL,
                'Opcjonalny token konkretnego pokoju (jeśli pominięty, nadaje do wszystkich pokoi)'
            )
            ->addOption(
                'actor',
                'a',
                InputOption::VALUE_OPTIONAL,
                'Wyświetlana nazwa nadawcy',
                '📢 Administrator Nextcloud'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $message = $input->getOption('message');
        if (!$message || trim($message) === '') {
            $output->writeln('<error>Błąd: Musisz podać treść wiadomości za pomocą parametru --message="..."</error>');
            return Command::FAILURE;
        }

        $roomToken = $input->getOption('room');
        $actor = $input->getOption('actor') ?: '📢 Administrator Nextcloud';

        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'token', 'name')
            ->from('talk_rooms');

        if ($roomToken) {
            $qb->where($qb->expr()->eq('token', $qb->createNamedParameter($roomToken)));
        }

        $rooms = $qb->executeQuery()->fetchAll();
        if (empty($rooms)) {
            $output->writeln('<comment>Nie znaleziono pasujących pokoi Talk.</comment>');
            return Command::SUCCESS;
        }

        $now = time();
        $sentCount = 0;

        foreach ($rooms as $room) {
            $roomId = (int)$room['id'];
            $insertQb = $this->db->getQueryBuilder();
            $insertQb->insert('talk_messages')
                ->values([
                    'room_id' => $insertQb->createNamedParameter($roomId),
                    'parent_id' => $insertQb->createNamedParameter(0),
                    'timestamp' => $insertQb->createNamedParameter($now),
                    'actor_type' => $insertQb->createNamedParameter('bots'),
                    'actor_id' => $insertQb->createNamedParameter('admin_broadcast'),
                    'actor_display_name' => $insertQb->createNamedParameter($actor),
                    'message' => $insertQb->createNamedParameter(trim($message)),
                    'message_type' => $insertQb->createNamedParameter('comment'),
                    'parameters' => $insertQb->createNamedParameter('{}'),
                ]);
            $insertQb->executeStatement();

            $updateQb = $this->db->getQueryBuilder();
            $updateQb->update('talk_rooms')
                ->set('last_message', $updateQb->createNamedParameter($now))
                ->set('last_activity', $updateQb->createNamedParameter($now))
                ->where($updateQb->expr()->eq('id', $updateQb->createNamedParameter($roomId)));
            $updateQb->executeStatement();

            $sentCount++;
        }

        $output->writeln("<info>Pomyślnie wysłano ogłoszenie do {$sentCount} pokoi Talk.</info>");
        return Command::SUCCESS;
    }
}
