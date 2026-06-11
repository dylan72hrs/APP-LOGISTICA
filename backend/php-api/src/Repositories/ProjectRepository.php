<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;

final class ProjectRepository
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

        if ($this->isTruthy($filters['activeOnly'] ?? $filters['active'] ?? false)) {
            $where[] = "status = 'active'";
            $where[] = 'active = :active';
            $params['active'] = 1;
        }

        $sql = 'SELECT id, project_code, name, financial_dimension, cost_center, manager, approver, status, active, description, created_at, updated_at FROM projects';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY project_code ASC';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);

        return array_map([$this, 'mapProject'], $statement->fetchAll());
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(string $id): ?array
    {
        $pdo = Connection::create();
        $statement = $pdo->prepare(
            'SELECT id, project_code, name, financial_dimension, cost_center, manager, approver, status, active, description, created_at, updated_at
             FROM projects
             WHERE id = :id OR project_code = :code
             LIMIT 1'
        );
        $statement->execute(['id' => $id, 'code' => $id]);
        $row = $statement->fetch();

        if (!$row) {
            return null;
        }

        return $this->mapProject($row);
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapProject(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'projectCode' => (string) $row['project_code'],
            'name' => (string) $row['name'],
            'financialDimension' => $row['financial_dimension'] === null ? '' : (string) $row['financial_dimension'],
            'costCenter' => $row['cost_center'] === null ? '' : (string) $row['cost_center'],
            'manager' => $row['manager'] === null ? '' : (string) $row['manager'],
            'approver' => $row['approver'] === null ? '' : (string) $row['approver'],
            'status' => (string) $row['status'],
            'active' => (bool) $row['active'],
            'description' => $row['description'] === null ? '' : (string) $row['description'],
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
