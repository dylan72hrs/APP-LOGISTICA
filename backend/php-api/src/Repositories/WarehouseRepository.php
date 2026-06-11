<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class WarehouseRepository
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

        $sql = 'SELECT id, code, name, city, country, active, created_at, updated_at FROM warehouses';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY name ASC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);

        return array_map([$this, 'mapWarehouse'], $statement->fetchAll());
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapWarehouse(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'code' => (string) $row['code'],
            'name' => (string) $row['name'],
            'city' => $row['city'] === null ? '' : (string) $row['city'],
            'country' => $row['country'] === null ? '' : (string) $row['country'],
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
