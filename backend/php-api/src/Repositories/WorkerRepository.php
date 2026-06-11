<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;
use App\Database\DatabaseNotConfiguredException;

final class WorkerRepository
{
    // Prepared for a future PDO/MySQL implementation. No queries run in this stage.
    public function all(): array
    {
        Connection::create();

        throw DatabaseNotConfiguredException::connectionDisabled();
    }
}
