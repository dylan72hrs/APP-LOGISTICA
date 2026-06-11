<?php

declare(strict_types=1);

namespace App\Http;

final class Response
{
    public static function json(array $payload, int $statusCode = 200): void
    {
        http_response_code($statusCode);
        self::headers();

        echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function noContent(int $statusCode = 204): void
    {
        http_response_code($statusCode);
        self::headers();
    }

    private static function headers(): void
    {
        $allowedOrigin = getenv('API_ALLOWED_ORIGIN') ?: '*';

        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Access-Control-Allow-Origin: ' . $allowedOrigin);
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Accept');
    }

    /**
     * @param array<int|string, mixed>|object $details
     */
    public static function error(string $code, string $message, int $statusCode = 500, array|object $details = []): void
    {
        self::json([
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details === [] ? (object) [] : $details,
            ],
        ], $statusCode);
    }
}
