<?php

declare(strict_types=1);

namespace App\Config;

final class DatabaseConfig
{
    /**
     * Example only. Do not place real credentials in this repository.
     *
     * @return array<string, int|string|null>
     */
    public static function example(): array
    {
        return [
            'host' => 'localhost',
            'port' => 3306,
            'database' => 'app_logistica_mvp',
            'username' => 'database_user_here',
            'password' => null,
            'charset' => 'utf8mb4',
        ];
    }
}
