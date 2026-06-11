<?php

declare(strict_types=1);

namespace App\Database;

use App\Config\DatabaseConfigLoader;
use PDO;
use PDOException;
use RuntimeException;

final class Connection
{
    /**
     * @var string[]
     */
    private const REQUIRED_KEYS = [
        'host',
        'port',
        'database',
        'username',
        'password',
        'charset',
        'appEnv',
    ];

    public static function create(): PDO
    {
        $config = self::requireConfiguration();

        try {
            return new PDO(
                self::buildDsn($config),
                (string) $config['username'],
                (string) $config['password'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $exception) {
            throw new RuntimeException('Database service unavailable.');
        }
    }

    public static function isConfigured(): bool
    {
        return self::missingKeys(DatabaseConfigLoader::load()) === [];
    }

    /**
     * @return array<string, int|string|null>
     */
    public static function requireConfiguration(): array
    {
        $config = DatabaseConfigLoader::load();

        if (self::missingKeys($config) !== []) {
            throw DatabaseNotConfiguredException::missingConfiguration();
        }

        return $config;
    }

    /**
     * Prepared for the future PDO implementation. Do not expose this value in API responses.
     *
     * @param array<string, int|string|null> $config
     */
    private static function buildDsn(array $config): string
    {
        return sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            (string) $config['host'],
            (int) $config['port'],
            (string) $config['database'],
            (string) $config['charset']
        );
    }

    /**
     * @param array<string, int|string|null> $config
     * @return string[]
     */
    private static function missingKeys(array $config): array
    {
        $missingKeys = [];

        foreach (self::REQUIRED_KEYS as $key) {
            if (!isset($config[$key]) || trim((string) $config[$key]) === '') {
                $missingKeys[] = $key;
            }
        }

        return $missingKeys;
    }
}
