<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Command;

use OCP\IDBConnection;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class ExportRoomCommand extends Command {
    public function __construct(
        private IDBConnection $db,
    ) {
        parent::__construct();
    }

    protected function configure(): void {
        $this
            ->setName('talk:enhancer:export-room')
            ->setDescription('Eksportuje pełną historię rozmów pokoju Talk do formatu JSON, Markdown lub HTML')
            ->addArgument(
                'token',
                InputArgument::REQUIRED,
                'Token pokoju Talk (np. vloc0j, abc123xyz)'
            )
            ->addOption(
                'format',
                'f',
                InputOption::VALUE_OPTIONAL,
                'Format wyjściowy (json, md, html)',
                'md'
            )
            ->addOption(
                'output',
                'o',
                InputOption::VALUE_OPTIONAL,
                'Ścieżka do pliku docelowego (domyślnie wypisuje na standardowe wyjście)'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $token = (string)$input->getArgument('token');
        $format = strtolower((string)$input->getOption('format'));
        $outputFile = $input->getOption('output');

        // Fetch room
        $qb = $this->db->getQueryBuilder();
        $qb->select('id', 'name', 'type', 'created_at')
            ->from('talk_rooms')
            ->where($qb->expr()->eq('token', $qb->createNamedParameter($token)));
        $room = $qb->executeQuery()->fetch();

        if (!$room) {
            $output->writeln("<error>Błąd: Nie znaleziono pokoju Talk o tokenie '{$token}'.</error>");
            return Command::FAILURE;
        }

        $roomId = (int)$room['id'];
        $roomName = (string)($room['name'] ?: 'Talk Room ' . $token);

        // Fetch messages
        $msgQb = $this->db->getQueryBuilder();
        $msgQb->select('id', 'timestamp', 'actor_type', 'actor_id', 'actor_display_name', 'message')
            ->from('talk_messages')
            ->where($msgQb->expr()->eq('room_id', $msgQb->createNamedParameter($roomId)))
            ->orderBy('timestamp', 'ASC');
        $messages = $msgQb->executeQuery()->fetchAll();

        $content = '';
        if ($format === 'json') {
            $content = json_encode([
                'room' => [
                    'token' => $token,
                    'name' => $roomName,
                    'totalMessages' => count($messages),
                    'exportedAt' => date('c'),
                ],
                'messages' => $messages,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } elseif ($format === 'html') {
            $rowsHtml = '';
            foreach ($messages as $m) {
                $time = date('Y-m-d H:i:s', (int)$m['timestamp']);
                $sender = htmlspecialchars((string)($m['actor_display_name'] ?: $m['actor_id'] ?: 'Nieznany'));
                $text = nl2br(htmlspecialchars((string)$m['message']));
                $rowsHtml .= "<div style='margin-bottom:12px;padding:8px;border-bottom:1px solid #e0e0e0;'>"
                    . "<strong>{$sender}</strong> <small style='color:#888;'>({$time})</small><br/>"
                    . "<div style='margin-top:4px;'>{$text}</div></div>";
            }
            $content = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Eksport: {$roomName}</title>"
                . "<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:20px auto;padding:0 20px;line-height:1.5;}</style>"
                . "</head><body><h1>Eksport rozmowy: " . htmlspecialchars($roomName) . " (Token: {$token})</h1>"
                . "<p>Wyeksportowano: " . date('Y-m-d H:i:s') . " | Wiadomości: " . count($messages) . "</p><hr/>"
                . $rowsHtml . "</body></html>";
        } else {
            // Markdown default
            $content = "# Eksport rozmowy: {$roomName}\n";
            $content .= "- **Token pokoju**: `{$token}`\n";
            $content .= "- **Data eksportu**: " . date('Y-m-d H:i:s') . "\n";
            $content .= "- **Liczba wiadomości**: " . count($messages) . "\n\n---\n\n";
            foreach ($messages as $m) {
                $time = date('Y-m-d H:i:s', (int)$m['timestamp']);
                $sender = (string)($m['actor_display_name'] ?: $m['actor_id'] ?: 'Nieznany');
                $text = (string)$m['message'];
                $content .= "### **{$sender}** *({$time})*\n{$text}\n\n";
            }
        }

        if ($outputFile) {
            file_put_contents($outputFile, $content);
            $output->writeln("<info>Pomyślnie wyeksportowano historię pokoju ({$token}) do pliku: {$outputFile}</info>");
        } else {
            $output->writeln($content);
        }

        return Command::SUCCESS;
    }
}
