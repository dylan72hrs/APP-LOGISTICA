<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\DatabaseNotConfiguredException;
use App\Http\ApiException;
use App\Http\Response;
use App\Repositories\ProjectRepository;
use Throwable;

final class ProjectController
{
    private ProjectRepository $repository;

    public function __construct(?ProjectRepository $repository = null)
    {
        $this->repository = $repository ?? new ProjectRepository();
    }

    public function index(): void
    {
        try {
            Response::json([
                'projects' => $this->repository->all($_GET),
            ]);
        } catch (Throwable $exception) {
            $this->handleException($exception);
        }
    }

    /**
     * @param array<string, string> $params
     */
    public function show(array $params): void
    {
        try {
            $id = trim($params['id'] ?? '');
            $project = $id === '' ? null : $this->repository->findById($id);

            if ($project === null) {
                Response::error('NOT_FOUND', 'Proyecto no encontrado.', 404);
                return;
            }

            Response::json([
                'project' => $project,
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
