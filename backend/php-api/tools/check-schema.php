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
use PDO;
use Throwable;

$requiredTables = [
    'projects',
    'warehouses',
    'workers',
    'inventory_items',
    'consumption_records',
    'consumption_items',
    'audit_log',
];

$requiredColumns = [
    'projects' => [
        'id',
        'project_code',
        'cost_center',
        'financial_dimension',
    ],
    'consumption_records' => [
        'project_id',
        'project_code_snapshot',
        'project_name_snapshot',
        'cost_center_snapshot',
        'financial_dimension_snapshot',
    ],
    'inventory_items' => [
        'quantity',
    ],
];

echo 'DB configured: ' . (Connection::isConfigured() ? 'yes' : 'no') . PHP_EOL;

if (!Connection::isConfigured()) {
    echo 'Schema: fail' . PHP_EOL;
    exit(1);
}

try {
    $pdo = Connection::create();
    $missing = [];

    foreach ($requiredTables as $table) {
        if (!tableExists($pdo, $table)) {
            $missing[] = 'table ' . $table;
        }
    }

    foreach ($requiredColumns as $table => $columns) {
        foreach ($columns as $column) {
            if (!columnExists($pdo, $table, $column)) {
                $missing[] = 'column ' . $table . '.' . $column;
            }
        }
    }

    if ($missing !== []) {
        echo 'Schema: fail' . PHP_EOL;
        foreach ($missing as $item) {
            echo 'FAIL ' . $item . PHP_EOL;
        }
        exit(1);
    }

    echo 'Schema: ok' . PHP_EOL;
    foreach ($requiredTables as $table) {
        echo 'OK table ' . $table . PHP_EOL;
    }
    foreach ($requiredColumns as $table => $columns) {
        foreach ($columns as $column) {
            echo 'OK column ' . $table . '.' . $column . PHP_EOL;
        }
    }
} catch (DatabaseNotConfiguredException $exception) {
    echo 'Schema: fail' . PHP_EOL;
    exit(1);
} catch (Throwable $exception) {
    echo 'Schema: fail' . PHP_EOL;
    exit(1);
}

function tableExists(PDO $pdo, string $table): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName'
    );
    $statement->execute([
        'tableName' => $table,
    ]);

    return (int) $statement->fetchColumn() > 0;
}

function columnExists(PDO $pdo, string $table, string $column): bool
{
    $statement = $pdo->prepare(
        'SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tableName AND COLUMN_NAME = :columnName'
    );
    $statement->execute([
        'tableName' => $table,
        'columnName' => $column,
    ]);

    return (int) $statement->fetchColumn() > 0;
}

