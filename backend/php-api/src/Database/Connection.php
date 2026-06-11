<?php

declare(strict_types=1);

namespace App\Database;

use RuntimeException;

final class Connection
{
    public static function create()
    {
        throw new RuntimeException(
            'Database connection is intentionally not implemented in ETAPA 4.7D-BACKEND-SETUP.'
        );
    }
}
