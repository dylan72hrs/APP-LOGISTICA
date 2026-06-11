<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /**
     * @var array<string, callable|array{0: class-string, 1: string}>
     */
    private array $getRoutes = [];

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     */
    public function get(string $path, $handler): void
    {
        $this->getRoutes[$this->normalizePath($path)] = $handler;
    }

    public function dispatch(string $method, string $uri): void
    {
        if (strtoupper($method) !== 'GET') {
            Response::json([
                'error' => [
                    'code' => 'METHOD_NOT_ALLOWED',
                    'message' => 'Metodo no permitido.',
                ],
            ], 405);

            return;
        }

        $path = $this->normalizePath(parse_url($uri, PHP_URL_PATH) ?: '/');
        $handler = $this->getRoutes[$path] ?? null;

        if ($handler === null) {
            Response::json([
                'error' => [
                    'code' => 'NOT_FOUND',
                    'message' => 'Ruta no encontrada.',
                ],
            ], 404);

            return;
        }

        $this->call($handler);
    }

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     */
    private function call($handler): void
    {
        if (is_array($handler) && is_string($handler[0])) {
            $controller = new $handler[0]();
            $method = $handler[1];
            $controller->{$method}();

            return;
        }

        $handler();
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/' . trim($path, '/');

        return $normalized === '/' ? '/' : rtrim($normalized, '/');
    }
}
