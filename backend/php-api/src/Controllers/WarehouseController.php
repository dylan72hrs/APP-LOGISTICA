<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Response;
use App\Repositories\WarehouseRepository;
use RuntimeException;

final class WarehouseController
{
    private WarehouseRepository $repository;

    public function __construct()
    {
        $this->repository = new WarehouseRepository();
    }

    public function index(): void
    {
        try {
            Response::json([
                'warehouses' => $this->repository->all(),
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
