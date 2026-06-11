<?php

declare(strict_types=1);

namespace App\Repositories;

use RuntimeException;

final class InventoryRepository
{
    // Prepared for a future PDO/MySQL implementation. No queries run in this stage.
    public function all(): array
    {
        $this->databaseNotConfigured();
    }

    private function databaseNotConfigured(): void
    {
        throw new RuntimeException('Database backend not configured.');
    }
}
