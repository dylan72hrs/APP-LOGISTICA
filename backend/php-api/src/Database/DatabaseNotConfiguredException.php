<?php

declare(strict_types=1);

namespace App\Database;

use RuntimeException;

final class DatabaseNotConfiguredException extends RuntimeException
{
    public static function missingConfiguration(): self
    {
        return new self('Database backend not configured.');
    }

    public static function connectionDisabled(): self
    {
        return new self('Database connection is prepared but not enabled in this stage.');
    }
}
