<?php

declare(strict_types=1);

namespace App\Http;

final class Router
{
    /**
     * @var array<string, array<int, array{path: string, pattern: string, handler: callable|array{0: class-string, 1: string}}>>
     */
    private array $routes = [
        'GET' => [],
        'POST' => [],
    ];

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     */
    public function get(string $path, $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     */
    public function post(string $path, $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function dispatch(string $method, string $uri): void
    {
        $method = strtoupper($method);

        if ($method === 'OPTIONS') {
            Response::noContent();
            return;
        }

        if (!isset($this->routes[$method])) {
            Response::error('METHOD_NOT_ALLOWED', 'Metodo no permitido.', 405);

            return;
        }

        $path = $this->normalizePath(parse_url($uri, PHP_URL_PATH) ?: '/');
        $match = $this->match($method, $path);

        if ($match === null) {
            Response::error('NOT_FOUND', 'Ruta no encontrada.', 404);

            return;
        }

        $this->call($match['handler'], $match['params']);
    }

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     */
    private function addRoute(string $method, string $path, $handler): void
    {
        $path = $this->normalizePath($path);
        $this->routes[$method][] = [
            'path' => $path,
            'pattern' => $this->compilePath($path),
            'handler' => $handler,
        ];
    }

    /**
     * @param callable|array{0: class-string, 1: string} $handler
     * @param array<string, string> $params
     */
    private function call($handler, array $params): void
    {
        if (is_array($handler) && is_string($handler[0])) {
            $controller = new $handler[0]();
            $method = $handler[1];
            $params === [] ? $controller->{$method}() : $controller->{$method}($params);

            return;
        }

        $params === [] ? $handler() : $handler($params);
    }

    /**
     * @return array{handler: callable|array{0: class-string, 1: string}, params: array<string, string>}|null
     */
    private function match(string $method, string $path): ?array
    {
        foreach ($this->routes[$method] as $route) {
            if (!preg_match($route['pattern'], $path, $matches)) {
                continue;
            }

            $params = [];
            foreach ($matches as $key => $value) {
                if (is_string($key)) {
                    $params[$key] = $value;
                }
            }

            return [
                'handler' => $route['handler'],
                'params' => $params,
            ];
        }

        return null;
    }

    private function compilePath(string $path): string
    {
        $segments = explode('/', trim($path, '/'));
        $compiledSegments = array_map(static function (string $segment): string {
            if (str_starts_with($segment, ':')) {
                return '(?P<' . substr($segment, 1) . '>[^/]+)';
            }

            return preg_quote($segment, '#');
        }, $segments);

        if ($path === '/') {
            return '#^/$#';
        }

        return '#^/' . implode('/', $compiledSegments) . '$#';
    }

    private function normalizePath(string $path): string
    {
        $normalized = '/' . trim($path, '/');

        return $normalized === '/' ? '/' : rtrim($normalized, '/');
    }
}
