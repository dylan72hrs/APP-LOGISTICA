<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class InventoryRepository
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
            $where[] = '(sku LIKE :search OR description LIKE :search)';
            $params['search'] = '%' . (string) $filters['search'] . '%';
        }

        $sql = 'SELECT id, warehouse_id, sku, description, category, unit, size, quantity, unit_cost, active, created_at, updated_at FROM inventory_items';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY description ASC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);

        return array_map([$this, 'mapItem'], $statement->fetchAll());
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapItem(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'warehouseId' => (string) $row['warehouse_id'],
            'sku' => (string) $row['sku'],
            'code' => (string) $row['sku'],
            'description' => (string) $row['description'],
            'category' => $row['category'] === null ? '' : (string) $row['category'],
            'unit' => $row['unit'] === null ? '' : (string) $row['unit'],
            'size' => $row['size'] === null ? '' : (string) $row['size'],
            'quantity' => (int) $row['quantity'],
            'unitCost' => $row['unit_cost'] === null ? null : (float) $row['unit_cost'],
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
