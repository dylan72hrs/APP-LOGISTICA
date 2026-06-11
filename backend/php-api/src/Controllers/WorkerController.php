<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\DatabaseNotConfiguredException;
use App\Http\ApiException;
use App\Http\Response;
use App\Repositories\WorkerRepository;
use Throwable;

final class WorkerController
{
    private WorkerRepository $repository;

    public function __construct()
    {
        $this->repository = new WorkerRepository();
    }

    public function index(): void
    {
        try {
            Response::json([
                'workers' => $this->repository->all($_GET),
            ]);
        } catch (Throwable $exception) {
            $this->handleException($exception);
        }
    }

    private function handleException(Throwable $exception): void
    {
        if ($exception instanceof DatabaseNotConfiguredException) {
            Response::error('DATABASE_NOT_CONFIGURED', 'Database backend not configured.', 501);
            return;
        }

        if ($exception instanceof ApiException) {
            Response::error($exception->getErrorCode(), $exception->getMessage(), $exception->getStatusCode(), $exception->getDetails());
            return;
        }

        Response::error('INTERNAL_ERROR', 'Internal server error.', 500);
    }
}
