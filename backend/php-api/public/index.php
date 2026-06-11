<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Http/Response.php';
require_once __DIR__ . '/../src/Http/ApiException.php';
require_once __DIR__ . '/../src/Http/Router.php';
require_once __DIR__ . '/../src/Config/DatabaseConfigLoader.php';
require_once __DIR__ . '/../src/Database/DatabaseNotConfiguredException.php';
require_once __DIR__ . '/../src/Database/Connection.php';
require_once __DIR__ . '/../src/Services/AuditService.php';
require_once __DIR__ . '/../src/Services/ConsumptionService.php';
require_once __DIR__ . '/../src/Repositories/WarehouseRepository.php';
require_once __DIR__ . '/../src/Repositories/WorkerRepository.php';
require_once __DIR__ . '/../src/Repositories/InventoryRepository.php';
require_once __DIR__ . '/../src/Repositories/ProjectRepository.php';
require_once __DIR__ . '/../src/Repositories/ConsumptionRepository.php';
require_once __DIR__ . '/../src/Controllers/HealthController.php';
require_once __DIR__ . '/../src/Controllers/WarehouseController.php';
require_once __DIR__ . '/../src/Controllers/WorkerController.php';
require_once __DIR__ . '/../src/Controllers/InventoryController.php';
require_once __DIR__ . '/../src/Controllers/ProjectController.php';
require_once __DIR__ . '/../src/Controllers/ConsumptionController.php';

use App\Controllers\ConsumptionController;
use App\Controllers\HealthController;
use App\Controllers\InventoryController;
use App\Controllers\ProjectController;
use App\Controllers\WarehouseController;
use App\Controllers\WorkerController;
use App\Http\Response;
use App\Http\Router;

$router = new Router();
$router->get('/health', [HealthController::class, 'show']);
$router->get('/warehouses', [WarehouseController::class, 'index']);
$router->get('/workers', [WorkerController::class, 'index']);
$router->get('/inventory', [InventoryController::class, 'index']);
$router->get('/projects', [ProjectController::class, 'index']);
$router->get('/projects/:id', [ProjectController::class, 'show']);
$router->get('/consumptions', [ConsumptionController::class, 'index']);
$router->get('/consumptions/:id', [ConsumptionController::class, 'show']);
$router->post('/consumptions', [ConsumptionController::class, 'create']);

try {
    $router->dispatch(
        $_SERVER['REQUEST_METHOD'] ?? 'GET',
        $_SERVER['REQUEST_URI'] ?? '/'
    );
} catch (Throwable $exception) {
    Response::error('INTERNAL_ERROR', 'Internal server error.', 500);
}
