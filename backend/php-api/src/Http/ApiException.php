<?php

declare(strict_types=1);

namespace App\Http;

use RuntimeException;

final class ApiException extends RuntimeException
{
    private string $errorCode;
    private int $statusCode;

    /**
     * @var array<int|string, mixed>|object
     */
    private array|object $details;

    /**
     * @param array<int|string, mixed>|object $details
     */
    public function __construct(string $errorCode, string $message, int $statusCode = 400, array|object $details = [])
    {
        parent::__construct($message);

        $this->errorCode = $errorCode;
        $this->statusCode = $statusCode;
        $this->details = $details;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }

    /**
     * @return array<int|string, mixed>|object
     */
    public function getDetails(): array|object
    {
        return $this->details;
    }
}
