<?php

declare(strict_types=1);

require_once __DIR__ . '/../src/Http/Response.php';
require_once __DIR__ . '/../src/Http/Router.php';
require_once __DIR__ . '/../src/Controllers/HealthController.php';

use App\Controllers\HealthController;
use App\Http\Response;
use App\Http\Router;

$router = new Router();
$router->get('/health', [HealthController::class, 'show']);

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
