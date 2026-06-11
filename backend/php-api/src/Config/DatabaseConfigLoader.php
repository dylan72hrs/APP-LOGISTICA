<?php

declare(strict_types=1);

namespace App\Config;

final class DatabaseConfigLoader
{
    /**
     * @return array<string, int|string|null>
     */
    public static function load(): array
    {
        $environmentConfig = self::loadFromEnvironment();

        if ($environmentConfig !== []) {
            return self::normalize($environmentConfig);
        }

        $localConfig = self::loadFromLocalFile();

        if ($localConfig !== []) {
            return self::normalize($localConfig);
        }

        return [];
    }

    /**
     * @return array<string, int|string|null>
     */
    private static function loadFromEnvironment(): array
    {
        $config = [
            'host' => self::env('DB_HOST'),
            'port' => self::env('DB_PORT'),
            'database' => self::env('DB_NAME'),
            'username' => self::env('DB_USER'),
            'password' => self::env('DB_PASSWORD'),
            'charset' => self::env('DB_CHARSET'),
            'appEnv' => self::env('APP_ENV'),
        ];

        return self::hasAnyValue($config) ? $config : [];
    }

    /**
     * @return array<string, int|string|null>
     */
    private static function loadFromLocalFile(): array
    {
        $candidateFiles = [
            __DIR__ . '/DatabaseConfig.php',
            dirname(__DIR__, 2) . '/config.local.php',
        ];

        foreach ($candidateFiles as $filePath) {
            if (!is_file($filePath)) {
                continue;
            }

            $config = require $filePath;

            return is_array($config) ? $config : [];
        }

        return [];
    }

    private static function env(string $key): ?string
    {
        $value = getenv($key);

        if ($value === false) {
            return null;
        }

        $trimmedValue = trim((string) $value);

        return $trimmedValue === '' ? null : $trimmedValue;
    }

    /**
     * @param array<string, int|string|null> $config
     * @return array<string, int|string|null>
     */
    private static function normalize(array $config): array
    {
        $port = $config['port'] ?? $config['DB_PORT'] ?? null;

        return [
            'host' => $config['host'] ?? $config['DB_HOST'] ?? null,
            'port' => $port === null ? null : (int) $port,
            'database' => $config['database'] ?? $config['DB_NAME'] ?? null,
            'username' => $config['username'] ?? $config['DB_USER'] ?? null,
            'password' => $config['password'] ?? $config['DB_PASSWORD'] ?? null,
            'charset' => $config['charset'] ?? $config['DB_CHARSET'] ?? null,
            'appEnv' => $config['appEnv'] ?? $config['APP_ENV'] ?? null,
        ];
    }

    /**
     * @param array<string, int|string|null> $config
     */
    private static function hasAnyValue(array $config): bool
    {
        foreach ($config as $value) {
            if ($value !== null && $value !== '') {
                return true;
            }
        }

        return false;
    }
}
