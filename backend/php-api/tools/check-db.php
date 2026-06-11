<?php

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require_once __DIR__ . '/../src/Config/DatabaseConfigLoader.php';
require_once __DIR__ . '/../src/Database/DatabaseNotConfiguredException.php';
require_once __DIR__ . '/../src/Database/Connection.php';

use App\Database\Connection;
use App\Database\DatabaseNotConfiguredException;
use Throwable;

$configured = Connection::isConfigured();

echo 'DB configured: ' . ($configured ? 'yes' : 'no') . PHP_EOL;

if (!$configured) {
    echo 'Connection: fail' . PHP_EOL;
    exit(1);
}

try {
    Connection::create();
    echo 'Connection: ok' . PHP_EOL;
} catch (DatabaseNotConfiguredException $exception) {
    echo 'Connection: fail' . PHP_EOL;
    exit(1);
} catch (Throwable $exception) {
    echo 'Connection: fail' . PHP_EOL;
    exit(1);
}
