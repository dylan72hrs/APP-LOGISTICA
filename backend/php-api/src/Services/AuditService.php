<?php

declare(strict_types=1);

namespace App\Services;

use PDO;

final class AuditService
{
    /**
     * @param array<string, mixed> $after
     */
    public function recordConsumptionCreated(PDO $pdo, string $consumptionId, string $warehouseId, array $after): void
    {
        $statement = $pdo->prepare(
            'INSERT INTO audit_log (user_id, action, entity_type, entity_id, warehouse_id, before_json, after_json, ip_address, user_agent)
             VALUES (NULL, :action, :entityType, :entityId, :warehouseId, NULL, :afterJson, NULL, NULL)'
        );

        $statement->execute([
            'action' => 'consumption.created',
            'entityType' => 'consumption_records',
            'entityId' => $consumptionId,
            'warehouseId' => $warehouseId,
            'afterJson' => json_encode($after, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
    }
}
