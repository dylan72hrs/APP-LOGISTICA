<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Database\DatabaseNotConfiguredException;
use App\Http\ApiException;
use App\Http\Response;
use App\Repositories\ConsumptionRepository;
use App\Services\ConsumptionService;
use Throwable;

final class ConsumptionController
{
    private ConsumptionRepository $repository;
    private ConsumptionService $service;

    public function __construct(?ConsumptionRepository $repository = null, ?ConsumptionService $service = null)
    {
        $this->repository = $repository ?? new ConsumptionRepository();
        $this->service = $service ?? new ConsumptionService();
    }

    public function index(): void
    {
        try {
            Response::json([
                'consumptions' => $this->repository->all($_GET),
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
            $consumption = $id === '' ? null : $this->repository->findById($id);

            if ($consumption === null) {
                Response::error('NOT_FOUND', 'Consumo no encontrado.', 404);
                return;
            }

            Response::json([
                'consumption' => $consumption,
            ]);
        } catch (Throwable $exception) {
            $this->handleException($exception);
        }
    }

    public function create(): void
    {
        try {
            $payload = $this->readJsonBody();
            $consumption = $this->service->create($payload);

            Response::json([
                'message' => 'Consumo registrado correctamente.',
                'consumption' => $consumption,
            ], 201);
        } catch (Throwable $exception) {
            $this->handleException($exception);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function readJsonBody(): array
    {
        $rawBody = file_get_contents('php://input');
        $payload = json_decode($rawBody === false ? '' : $rawBody, true);

        if (!is_array($payload)) {
            throw new ApiException('VALIDATION_ERROR', 'JSON invalido.', 400, [
                [
                    'field' => 'body',
                    'message' => 'El cuerpo debe ser JSON valido.',
                ],
            ]);
        }

        return $payload;
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
