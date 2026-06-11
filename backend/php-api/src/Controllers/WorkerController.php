<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Response;
use App\Repositories\WorkerRepository;
use RuntimeException;

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
                'workers' => $this->repository->all(),
            ]);
        } catch (RuntimeException $exception) {
            $this->databaseNotConfigured();
        }
    }

    private function databaseNotConfigured(): void
    {
        Response::json([
            'error' => [
                'code' => 'DATABASE_NOT_CONFIGURED',
                'message' => 'Database backend not configured.',
                'details' => (object) [],
            ],
        ], 501);
    }
}
