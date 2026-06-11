<?php

declare(strict_types=1);

namespace App\Repositories;

use App\Database\Connection;
use App\Http\ApiException;
use PDO;

final class ConsumptionRepository
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

        if (!empty($filters['warehouseId'])) {
            $where[] = 'warehouse_id = :warehouseId';
            $params['warehouseId'] = (string) $filters['warehouseId'];
        }

        if (!empty($filters['workerId'])) {
            $where[] = 'worker_id = :workerId';
            $params['workerId'] = (string) $filters['workerId'];
        }

        if (!empty($filters['from'])) {
            $where[] = 'consumed_at >= :fromDate';
            $params['fromDate'] = $this->normalizeDateFilter((string) $filters['from'], 'from');
        }

        if (!empty($filters['to'])) {
            $where[] = 'consumed_at <= :toDate';
            $params['toDate'] = $this->normalizeDateFilter((string) $filters['to'], 'to');
        }

        if (!empty($filters['projectId'])) {
            $where[] = 'project_id = :projectId';
            $params['projectId'] = (string) $filters['projectId'];
        }

        $sql = 'SELECT id, voucher_number, warehouse_id, worker_id, project_id, project_code_snapshot, project_name_snapshot, cost_center_snapshot, financial_dimension_snapshot, requester_reference, project_id_legacy, delivered_by_user_id, consumed_at, notes, created_at, updated_at
                FROM consumption_records';

        if ($where !== []) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY consumed_at DESC LIMIT 200';

        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        $records = array_map([$this, 'mapRecord'], $statement->fetchAll());

        return $this->attachItems($pdo, $records);
    }

    public function findById(string $id): ?array
    {
        $pdo = Connection::create();
        $statement = $pdo->prepare(
            'SELECT id, voucher_number, warehouse_id, worker_id, project_id, project_code_snapshot, project_name_snapshot, cost_center_snapshot, financial_dimension_snapshot, requester_reference, project_id_legacy, delivered_by_user_id, consumed_at, notes, created_at, updated_at
             FROM consumption_records
             WHERE id = :id
             LIMIT 1'
        );
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();

        if (!$row) {
            return null;
        }

        $records = $this->attachItems($pdo, [$this->mapRecord($row)]);

        return $records[0] ?? null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function mapRecord(array $row): array
    {
        return [
            'id' => (string) $row['id'],
            'voucherNumber' => $row['voucher_number'] === null ? null : (string) $row['voucher_number'],
            'warehouseId' => (string) $row['warehouse_id'],
            'workerId' => (string) $row['worker_id'],
            'projectId' => $row['project_id'] === null ? null : (string) $row['project_id'],
            'projectCodeSnapshot' => $row['project_code_snapshot'] === null ? null : (string) $row['project_code_snapshot'],
            'projectNameSnapshot' => $row['project_name_snapshot'] === null ? null : (string) $row['project_name_snapshot'],
            'costCenterSnapshot' => $row['cost_center_snapshot'] === null ? null : (string) $row['cost_center_snapshot'],
            'financialDimensionSnapshot' => $row['financial_dimension_snapshot'] === null ? null : (string) $row['financial_dimension_snapshot'],
            'requesterReference' => $row['requester_reference'] === null ? null : (string) $row['requester_reference'],
            'projectIdLegacy' => $row['project_id_legacy'] === null ? null : (string) $row['project_id_legacy'],
            'deliveredByUserId' => $row['delivered_by_user_id'] === null ? null : (string) $row['delivered_by_user_id'],
            'consumedAt' => $this->toIsoDate($row['consumed_at'] ?? null),
            'notes' => $row['notes'] === null ? '' : (string) $row['notes'],
            'items' => [],
            'createdAt' => $this->toIsoDate($row['created_at'] ?? null),
            'updatedAt' => $this->toIsoDate($row['updated_at'] ?? null),
        ];
    }

    /**
     * @param array<int, array<string, mixed>> $records
     * @return array<int, array<string, mixed>>
     */
    private function attachItems(PDO $pdo, array $records): array
    {
        if ($records === []) {
            return [];
        }

        $recordIds = array_map(static fn(array $record): string => (string) $record['id'], $records);
        $placeholders = implode(', ', array_fill(0, count($recordIds), '?'));
        $statement = $pdo->prepare(
            "SELECT id, consumption_record_id, inventory_item_id, sku_snapshot, description_snapshot, unit_snapshot, size_snapshot, quantity, unit_cost_snapshot, created_at
             FROM consumption_items
             WHERE consumption_record_id IN ($placeholders)
             ORDER BY id ASC"
        );
        $statement->execute($recordIds);

        $itemsByRecord = [];
        foreach ($statement->fetchAll() as $row) {
            $recordId = (string) $row['consumption_record_id'];
            $itemsByRecord[$recordId][] = [
                'id' => (int) $row['id'],
                'consumptionRecordId' => $recordId,
                'inventoryItemId' => (string) $row['inventory_item_id'],
                'itemId' => (string) $row['inventory_item_id'],
                'skuSnapshot' => (string) $row['sku_snapshot'],
                'descriptionSnapshot' => (string) $row['description_snapshot'],
                'unitSnapshot' => $row['unit_snapshot'] === null ? '' : (string) $row['unit_snapshot'],
                'sizeSnapshot' => $row['size_snapshot'] === null ? '' : (string) $row['size_snapshot'],
                'quantity' => (int) $row['quantity'],
                'unitCostSnapshot' => $row['unit_cost_snapshot'] === null ? null : (float) $row['unit_cost_snapshot'],
                'createdAt' => $this->toIsoDate($row['created_at'] ?? null),
            ];
        }

        foreach ($records as $index => $record) {
            $records[$index]['items'] = $itemsByRecord[(string) $record['id']] ?? [];
        }

        return $records;
    }

    private function normalizeDateFilter(string $value, string $field): string
    {
        $timestamp = strtotime($value);

        if ($timestamp === false) {
            throw new ApiException('VALIDATION_ERROR', 'Rango de fechas invalido.', 400, [
                [
                    'field' => $field,
                    'message' => 'Fecha invalida.',
                ],
            ]);
        }

        return gmdate('Y-m-d H:i:s', $timestamp);
    }

    private function toIsoDate(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return str_replace(' ', 'T', (string) $value) . '.000Z';
    }
}
