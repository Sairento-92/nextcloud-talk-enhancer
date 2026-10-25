<?php
declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Sairento / Nextcloud Talk Enhancer
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\TalkEnhancer\Command;

use OCA\TalkEnhancer\Service\StatsService;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

class CleanupCommand extends Command {
    public function __construct(
        private StatsService $statsService,
    ) {
        parent::__construct();
    }

    protected function configure(): void {
        $this
            ->setName('talk:enhancer:cleanup')
            ->setDescription('Czyści stare wiadomości w pokojach Talk na podstawie polityki retencji')
            ->addOption(
                'days',
                'd',
                InputOption::VALUE_OPTIONAL,
                'Wiek wiadomości w dniach do usunięcia (domyślnie: 90 dni)',
                '90'
            )
            ->addOption(
                'dry-run',
                null,
                InputOption::VALUE_NONE,
                'Wyświetla liczbę wiadomości do usunięcia bez fizycznego kasowania z bazy'
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int {
        $days = (int)$input->getOption('days');
        if ($days < 1) {
            $output->writeln('<error>Błąd: Liczba dni musi wynosić co najmniej 1.</error>');
            return Command::FAILURE;
        }

        $dryRun = (bool)$input->getOption('dry-run');

        $output->writeln("<info>Uruchamianie czyszczenia wiadomości starszych niż {$days} dni...</info>");
        if ($dryRun) {
            $output->writeln('<comment>[TRYB DRY-RUN] Dane nie zostaną usunięte z bazy danych.</comment>');
        }

        $result = $this->statsService->cleanupOldMessages($days, $dryRun);
        $cutoffDate = date('Y-m-d H:i:s', $result['cutoffTimestamp']);

        $output->writeln(" - Data graniczna (cutoff): {$cutoffDate}");
        $output->writeln(" - Liczba zidentyfikowanych wiadomości: <comment>{$result['deletedCount']}</comment>");

        if ($dryRun) {
            $output->writeln("<info>Dry-run zakończony. Aby fizycznie usunąć wiadomości, uruchom polecenie bez flagi --dry-run.</info>");
        } else {
            $output->writeln("<info>Pomyślnie usunięto {$result['deletedCount']} starych wiadomości.</info>");
        }

        return Command::SUCCESS;
    }
}
