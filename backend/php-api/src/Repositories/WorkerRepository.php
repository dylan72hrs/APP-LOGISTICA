<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class WorkerRepository
{
    /**
     * @param array<string, mixed> $filters
     * @return array<int, array<string, mixed>>
     */
    public function all(array $filters = []): array
    {
        $pdo = Connection::create();
        $where = [];
        $params = [];

        if ($this->isTruthy($filters['activeOnly'] ?? $filters['active'] ?? true)) {
            $where[] = 'active = :active';
            $params['active'] = 1;
        }

        if (!empty($filters['warehouseId'])) {
            $where[] = 'warehouse_id = :warehouseId';
            $params['warehouseId'] = (string) $filters['warehouseId'];
        }

        if (!empty($filters['search'])) {
            $where[] = '(name LIKE :search OR rut LIKE :search)';
            $params['search'] = '%' . (string) $filters['search'] . '%';
        }

        $sql = 'SELECT id, rut, name, position, department, worker_type, warehouse_id, active, created_at, updated_at FROM workers';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY name ASC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);

        return array_map([$this, 'mapWorker'], $statement->fetchAll());
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapWorker(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'rut' => (string) $row['rut'],
            'name' => (string) $row['name'],
            'position' => $row['position'] === null ? '' : (string) $row['position'],
            'department' => $row['department'] === null ? '' : (string) $row['department'],
            'workerType' => (string) $row['worker_type'],
            'warehouseId' => $row['warehouse_id'] === null ? '' : (string) $row['warehouse_id'],
            'active' => (bool) $row['active'],
            'createdAt' => $this->toIsoDate($row['created_at'] ?? null),
            'updatedAt' => $this->toIsoDate($row['updated_at'] ?? null),
        ];
    }

    private function isTruthy(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'si'], true);
    }

    private function toIsoDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return str_replace(' ', 'T', (string) $value) . '.000Z';
    }
}
