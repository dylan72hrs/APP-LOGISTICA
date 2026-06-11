<?php

declare(strict_types=1);

namespace App\Services;

use App\Database\Connection;
use App\Http\ApiException;
use PDO;
use Throwable;

final class ConsumptionService
{
    private AuditService $auditService;

    public function __construct(?AuditService $auditService = null)
    {
        $this->auditService = $auditService ?? new AuditService();
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public function create(array $payload): array
    {
        $warehouseId = $this->requiredString($payload, 'warehouseId');
        $workerId = $this->requiredString($payload, 'workerId');
        // ETAPA 4.7K: projectId es obligatorio. requesterReference sigue siendo
        // una referencia libre opcional y no reemplaza al proyecto.
        $projectId = $this->requiredString($payload, 'projectId');
        $items = $this->normalizeItems($payload['items'] ?? null);
        $requesterReference = $this->nullableString($payload['requesterReference'] ?? null, 180);
        $projectIdLegacy = $this->nullableString($payload['projectIdLegacy'] ?? null, 80);
        $notes = $this->nullableString($payload['notes'] ?? null, 2000) ?? '';

        $pdo = Connection::create();

        try {
            $pdo->beginTransaction();

            $this->assertWarehouseExists($pdo, $warehouseId);
            $this->assertWorkerExists($pdo, $workerId);
            $project = $this->fetchActiveProject($pdo, $projectId);
            $inventoryById = $this->lockInventory($pdo, array_keys($this->aggregateQuantities($items)));
            $this->assertInventoryCanBeConsumed($inventoryById, $items, $warehouseId);

            $consumptionId = $this->uuid();
            $voucherNumber = $this->voucherNumber($consumptionId);
            $consumedAt = gmdate('Y-m-d H:i:s');

            $this->insertRecord($pdo, $consumptionId, $voucherNumber, $warehouseId, $workerId, $project, $requesterReference, $projectIdLegacy, $notes, $consumedAt);
            $createdItems = $this->insertItemsAndDiscountStock($pdo, $consumptionId, $items, $inventoryById);

            $consumption = [
                'id' => $consumptionId,
                'voucherNumber' => $voucherNumber,
                'warehouseId' => $warehouseId,
                'workerId' => $workerId,
                'projectId' => (string) $project['id'],
                'projectCodeSnapshot' => (string) $project['project_code'],
                'projectNameSnapshot' => (string) $project['name'],
                'costCenterSnapshot' => $project['cost_center'] === null ? null : (string) $project['cost_center'],
                'financialDimensionSnapshot' => $project['financial_dimension'] === null ? null : (string) $project['financial_dimension'],
                'requesterReference' => $requesterReference,
                'projectIdLegacy' => $projectIdLegacy,
                'deliveredByUserId' => null,
                'consumedAt' => str_replace(' ', 'T', $consumedAt) . '.000Z',
                'notes' => $notes,
                'items' => $createdItems,
            ];

            $this->auditService->recordConsumptionCreated($pdo, $consumptionId, $warehouseId, $consumption);

            $pdo->commit();

            return $consumption;
        } catch (ApiException $exception) {
            $this->rollBackIfNeeded($pdo);
            throw $exception;
        } catch (Throwable $exception) {
            $this->rollBackIfNeeded($pdo);
            throw new ApiException('INTERNAL_ERROR', 'Internal server error.', 500);
        }
    }

    /**
     * @param array<string, mixed> $payload
     */
    private function requiredString(array $payload, string $field): string
    {
        $value = trim((string) ($payload[$field] ?? ''));

        if ($value === '') {
            throw new ApiException('VALIDATION_ERROR', 'Datos invalidos.', 400, [
                [
                    'field' => $field,
                    'message' => 'Campo obligatorio.',
                ],
            ]);
        }

        return $value;
    }

    private function nullableString(mixed $value, int $maxLength): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        if ($normalized === '') {
            return null;
        }

        return substr($normalized, 0, $maxLength);
    }

    /**
     * @return array<int, array{inventoryItemId: string, quantity: int}>
     */
    private function normalizeItems(mixed $items): array
    {
        if (!is_array($items) || $items === []) {
            throw new ApiException('VALIDATION_ERROR', 'Debe informar al menos un producto.', 400, [
                [
                    'field' => 'items',
                    'message' => 'Debe informar al menos un producto.',
                ],
            ]);
        }

        $normalized = [];
        foreach ($items as $index => $item) {
            if (!is_array($item)) {
                throw new ApiException('VALIDATION_ERROR', 'Item invalido.', 400, [
                    [
                        'field' => "items[$index]",
                        'message' => 'Item invalido.',
                    ],
                ]);
            }

            $inventoryItemId = trim((string) ($item['inventoryItemId'] ?? $item['itemId'] ?? ''));
            $quantity = $item['quantity'] ?? null;

            if ($inventoryItemId === '') {
                throw new ApiException('VALIDATION_ERROR', 'Producto obligatorio.', 400, [
                    [
                        'field' => "items[$index].inventoryItemId",
                        'message' => 'Producto obligatorio.',
                    ],
                ]);
            }

            if (!is_numeric($quantity) || (int) $quantity <= 0 || (int) $quantity != (float) $quantity) {
                throw new ApiException('VALIDATION_ERROR', 'Cantidad invalida.', 400, [
                    [
                        'field' => "items[$index].quantity",
                        'message' => 'La cantidad debe ser entera positiva.',
                    ],
                ]);
            }

            $normalized[] = [
                'inventoryItemId' => $inventoryItemId,
                'quantity' => (int) $quantity,
            ];
        }

        return $normalized;
    }

    private function assertWarehouseExists(PDO $pdo, string $warehouseId): void
    {
        $statement = $pdo->prepare('SELECT id FROM warehouses WHERE id = :id AND active = 1 LIMIT 1');
        $statement->execute(['id' => $warehouseId]);

        if (!$statement->fetch()) {
            throw new ApiException('VALIDATION_ERROR', 'Bodega invalida.', 400, [
                [
                    'field' => 'warehouseId',
                    'message' => 'La bodega no existe o no esta activa.',
                ],
            ]);
        }
    }

    /**
     * Valida que el proyecto exista y este activo. Devuelve la fila para snapshots.
     *
     * @return array<string, mixed>
     */
    private function fetchActiveProject(PDO $pdo, string $projectId): array
    {
        $statement = $pdo->prepare(
            'SELECT id, project_code, name, financial_dimension, cost_center, status, active
             FROM projects
             WHERE (id = :id OR project_code = :code)
             LIMIT 1'
        );
        $statement->execute(['id' => $projectId, 'code' => $projectId]);
        $project = $statement->fetch();

        if (!$project) {
            throw new ApiException('VALIDATION_ERROR', 'Proyecto invalido.', 400, [
                [
                    'field' => 'projectId',
                    'message' => 'El proyecto no existe.',
                ],
            ]);
        }

        if ((string) $project['status'] !== 'active' || !(bool) $project['active']) {
            throw new ApiException('VALIDATION_ERROR', 'Proyecto inactivo.', 400, [
                [
                    'field' => 'projectId',
                    'message' => 'El proyecto no esta activo/aprobado para consumos.',
                ],
            ]);
        }

        return $project;
    }

    private function assertWorkerExists(PDO $pdo, string $workerId): void
    {
        $statement = $pdo->prepare('SELECT id FROM workers WHERE id = :id AND active = 1 LIMIT 1');
        $statement->execute(['id' => $workerId]);

        if (!$statement->fetch()) {
            throw new ApiException('VALIDATION_ERROR', 'Trabajador invalido.', 400, [
                [
                    'field' => 'workerId',
                    'message' => 'El trabajador no existe o no esta activo.',
                ],
            ]);
        }
    }

    /**
     * @param array<int, array{inventoryItemId: string, quantity: int}> $items
     * @return array<string, int>
     */
    private function aggregateQuantities(array $items): array
    {
        $aggregate = [];

        foreach ($items as $item) {
            $aggregate[$item['inventoryItemId']] = ($aggregate[$item['inventoryItemId']] ?? 0) + $item['quantity'];
        }

        return $aggregate;
    }

    /**
     * @param string[] $inventoryItemIds
     * @return array<string, array<string, mixed>>
     */
    private function lockInventory(PDO $pdo, array $inventoryItemIds): array
    {
        $placeholders = implode(', ', array_fill(0, count($inventoryItemIds), '?'));
        $statement = $pdo->prepare(
            "SELECT id, warehouse_id, sku, description, unit, size, quantity, unit_cost, active
             FROM inventory_items
             WHERE id IN ($placeholders)
             FOR UPDATE"
        );
        $statement->execute(array_values($inventoryItemIds));

        $inventoryById = [];
        foreach ($statement->fetchAll() as $row) {
            $inventoryById[(string) $row['id']] = $row;
        }

        return $inventoryById;
    }

    /**
     * @param array<string, array<string, mixed>> $inventoryById
     * @param array<int, array{inventoryItemId: string, quantity: int}> $items
     */
    private function assertInventoryCanBeConsumed(array $inventoryById, array $items, string $warehouseId): void
    {
        foreach ($this->aggregateQuantities($items) as $inventoryItemId => $quantity) {
            $inventory = $inventoryById[$inventoryItemId] ?? null;

            if ($inventory === null || !(bool) $inventory['active']) {
                throw new ApiException('VALIDATION_ERROR', 'Producto invalido.', 400, [
                    [
                        'field' => 'items',
                        'message' => 'Uno o mas productos no existen o no estan activos.',
                    ],
                ]);
            }

            if ((string) $inventory['warehouse_id'] !== $warehouseId) {
                throw new ApiException('VALIDATION_ERROR', 'Producto fuera de bodega.', 400, [
                    [
                        'field' => 'items',
                        'message' => 'El producto no pertenece a la bodega informada.',
                    ],
                ]);
            }

            if ((int) $inventory['quantity'] < $quantity) {
                throw new ApiException('STOCK_NOT_AVAILABLE', 'Stock insuficiente para completar el consumo.', 409, [
                    [
                        'field' => 'items',
                        'message' => 'La cantidad solicitada supera el stock disponible.',
                    ],
                ]);
            }
        }
    }

    /**
     * @param array<string, mixed> $project
     */
    private function insertRecord(
        PDO $pdo,
        string $consumptionId,
        string $voucherNumber,
        string $warehouseId,
        string $workerId,
        array $project,
        ?string $requesterReference,
        ?string $projectIdLegacy,
        string $notes,
        string $consumedAt
    ): void {
        $statement = $pdo->prepare(
            'INSERT INTO consumption_records (id, voucher_number, warehouse_id, worker_id, project_id, project_code_snapshot, project_name_snapshot, cost_center_snapshot, financial_dimension_snapshot, requester_reference, project_id_legacy, delivered_by_user_id, consumed_at, notes)
             VALUES (:id, :voucherNumber, :warehouseId, :workerId, :projectId, :projectCodeSnapshot, :projectNameSnapshot, :costCenterSnapshot, :financialDimensionSnapshot, :requesterReference, :projectIdLegacy, NULL, :consumedAt, :notes)'
        );

        $statement->execute([
            'id' => $consumptionId,
            'voucherNumber' => $voucherNumber,
            'warehouseId' => $warehouseId,
            'workerId' => $workerId,
            'projectId' => (string) $project['id'],
            'projectCodeSnapshot' => (string) $project['project_code'],
            'projectNameSnapshot' => (string) $project['name'],
            'costCenterSnapshot' => $project['cost_center'] === null ? null : (string) $project['cost_center'],
            'financialDimensionSnapshot' => $project['financial_dimension'] === null ? null : (string) $project['financial_dimension'],
            'requesterReference' => $requesterReference,
            'projectIdLegacy' => $projectIdLegacy,
            'consumedAt' => $consumedAt,
            'notes' => $notes,
        ]);
    }

    /**
     * @param array<int, array{inventoryItemId: string, quantity: int}> $items
     * @param array<string, array<string, mixed>> $inventoryById
     * @return array<int, array<string, mixed>>
     */
    private function insertItemsAndDiscountStock(PDO $pdo, string $consumptionId, array $items, array $inventoryById): array
    {
        $insertItem = $pdo->prepare(
            'INSERT INTO consumption_items (consumption_record_id, inventory_item_id, sku_snapshot, description_snapshot, unit_snapshot, size_snapshot, quantity, unit_cost_snapshot)
             VALUES (:consumptionRecordId, :inventoryItemId, :skuSnapshot, :descriptionSnapshot, :unitSnapshot, :sizeSnapshot, :quantity, :unitCostSnapshot)'
        );
        $updateStock = $pdo->prepare(
            'UPDATE inventory_items SET quantity = quantity - :quantity WHERE id = :inventoryItemId'
        );
        $createdItems = [];

        foreach ($items as $item) {
            $inventory = $inventoryById[$item['inventoryItemId']];

            $insertItem->execute([
                'consumptionRecordId' => $consumptionId,
                'inventoryItemId' => $item['inventoryItemId'],
                'skuSnapshot' => (string) $inventory['sku'],
                'descriptionSnapshot' => (string) $inventory['description'],
                'unitSnapshot' => $inventory['unit'] === null ? null : (string) $inventory['unit'],
                'sizeSnapshot' => $inventory['size'] === null ? null : (string) $inventory['size'],
                'quantity' => $item['quantity'],
                'unitCostSnapshot' => $inventory['unit_cost'] === null ? null : (float) $inventory['unit_cost'],
            ]);

            $updateStock->execute([
                'quantity' => $item['quantity'],
                'inventoryItemId' => $item['inventoryItemId'],
            ]);

            $createdItems[] = [
                'inventoryItemId' => $item['inventoryItemId'],
                'itemId' => $item['inventoryItemId'],
                'skuSnapshot' => (string) $inventory['sku'],
                'descriptionSnapshot' => (string) $inventory['description'],
                'unitSnapshot' => $inventory['unit'] === null ? '' : (string) $inventory['unit'],
                'sizeSnapshot' => $inventory['size'] === null ? '' : (string) $inventory['size'],
                'quantity' => $item['quantity'],
                'unitCostSnapshot' => $inventory['unit_cost'] === null ? null : (float) $inventory['unit_cost'],
            ];
        }

        return $createdItems;
    }

    private function rollBackIfNeeded(PDO $pdo): void
    {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
    }

    private function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }

    private function voucherNumber(string $consumptionId): string
    {
        return 'VE-' . gmdate('Ymd-His') . '-' . strtoupper(substr(str_replace('-', '', $consumptionId), 0, 6));
    }
}
