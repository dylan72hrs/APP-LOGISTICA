<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Http/Response.php';
require_once __DIR__ . '/../src/Http/Router.php';
require_once __DIR__ . '/../src/Repositories/WarehouseRepository.php';
require_once __DIR__ . '/../src/Repositories/WorkerRepository.php';
require_once __DIR__ . '/../src/Repositories/InventoryRepository.php';
require_once __DIR__ . '/../src/Controllers/HealthController.php';
require_once __DIR__ . '/../src/Controllers/WarehouseController.php';
require_once __DIR__ . '/../src/Controllers/WorkerController.php';
require_once __DIR__ . '/../src/Controllers/InventoryController.php';

use App\Controllers\HealthController;
use App\Controllers\InventoryController;
use App\Controllers\WarehouseController;
use App\Controllers\WorkerController;
use App\Http\Response;
use App\Http\Router;

$router = new Router();
$router->get('/health', [HealthController::class, 'show']);
$router->get('/warehouses', [WarehouseController::class, 'index']);
$router->get('/workers', [WorkerController::class, 'index']);
$router->get('/inventory', [InventoryController::class, 'index']);

try {
    $router->dispatch(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $_SERVER['REQUEST_URI'] ?? '/'
    );
} catch (Throwable $exception) {
    Response::json([
        'error' => [
            'code' => 'SERVER_ERROR',
            'message' => 'Error interno del servicio.',
        ],
    ], 500);
}
