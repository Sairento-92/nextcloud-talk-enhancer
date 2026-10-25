<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Command;

use OCA\TalkEnhancer\Service\AiService;
use OCA\TalkEnhancer\Service\StatsService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

class StatsCommand extends Command {
    public function __construct(
        private StatsService $statsService,
        private AiService $aiService,
    ) {
        parent::__construct();
    }

    protected function configure(): void {
        $this
            ->setName('talk:enhancer:stats')
            ->setDescription('Wyświetla statystyki aktywności, obciążenia i integracji Nextcloud Talk');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $output->writeln('<info>Pobieranie statystyk Nextcloud Talk Enhancer...</info>');
        $stats = $this->statsService->getStats();

        $table = new Table($output);
        $table->setHeaders(['Metryka', 'Wartość']);
        $table->addRows([
            ['Liczba wszystkich pokoi', (string)$stats['totalRooms']],
            [' - Pokoje bezpośrednie (1:1)', (string)$stats['directRooms']],
            [' - Pokoje grupowe', (string)$stats['groupRooms']],
            [' - Pokoje publiczne', (string)$stats['publicRooms']],
            ['Liczba wszystkich wiadomości', number_format($stats['totalMessages'])],
            ['Wiadomości w ostatnich 24h', number_format($stats['messages24h'])],
            ['Wiadomości w ostatnich 7 dniach', number_format($stats['messages7d'])],
        ]);
        $table->render();

        if (!empty($stats['topRooms'])) {
            $output->writeln("\n<info>Najbardziej aktywne pokoje:</info>");
            $roomTable = new Table($output);
            $roomTable->setHeaders(['Token', 'Nazwa Pokoju', 'Wiadomości']);
            foreach ($stats['topRooms'] as $r) {
                $roomTable->addRow([$r['token'], $r['name'], (string)$r['messageCount']]);
            }
            $roomTable->render();
        }

        // Check Ollama AI status
        $aiStatus = $this->aiService->checkStatus();
        $output->writeln("\n<info>Status Asystenta AI (Ollama):</info>");
        if ($aiStatus['online']) {
            $output->writeln(" - Połączenie: <info>ONLINE</info> ({$aiStatus['url']})");
            $output->writeln(" - Dostępne modele: " . implode(', ', $aiStatus['models']));
            $output->writeln(" - Aktywny model: <comment>" . $this->aiService->getModel() . "</comment>");
        } else {
            $output->writeln(" - Połączenie: <comment>OFFLINE</comment> ({$aiStatus['url']})");
            $output->writeln("   Wskazówka: uruchom Ollama i skonfiguruj model przez 'occ config:app:set talk_enhancer ollama_model --value=llama3'");
        }

        return Command::SUCCESS;
    }
}
