-- APP-LOGISTICA / EPP Tracker 3.0
-- ETAPA 5 - Example staging seed only.
--
-- FICTITIOUS DATA ONLY.
-- Do not use real workers, real RUT values, real cost centers, real projects,
-- production dumps, hostnames, users or passwords in this file.
--
-- Intended use:
-- 1. Load docs/database/schema-mysql.sql in a staging DB.
-- 2. Load this file in the same staging DB.
-- 3. Use these records to smoke test GET endpoints and POST /consumptions.

SET NAMES utf8mb4;

START TRANSACTION;

INSERT INTO warehouses (id, code, name, city, country, active)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'BOD-STG-01', 'Bodega Staging Norte', 'Ciudad Staging', 'Chile', 1),
  ('10000000-0000-4000-8000-000000000002', 'BOD-STG-02', 'Bodega Staging Sur', 'Ciudad Staging', 'Chile', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  city = VALUES(city),
  country = VALUES(country),
  active = VALUES(active);

INSERT INTO workers (id, rut, name, position, department, worker_type, warehouse_id, active)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'STG-WORKER-001', 'Persona Staging Uno', 'Cargo Staging', 'Area Staging A', 'internal', '10000000-0000-4000-8000-000000000001', 1),
  ('20000000-0000-4000-8000-000000000002', 'STG-WORKER-002', 'Persona Staging Dos', 'Cargo Staging', 'Area Staging B', 'guest', '10000000-0000-4000-8000-000000000001', 1),
  ('20000000-0000-4000-8000-000000000003', 'STG-WORKER-003', 'Persona Staging Tres', 'Cargo Staging', 'Area Staging C', 'internal', '10000000-0000-4000-8000-000000000002', 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  position = VALUES(position),
  department = VALUES(department),
  worker_type = VALUES(worker_type),
  warehouse_id = VALUES(warehouse_id),
  active = VALUES(active);

INSERT INTO projects (id, project_code, name, financial_dimension, cost_center, manager, approver, status, active, description)
VALUES
  ('30000000-0000-4000-8000-000000000001', 'CL01', 'Proyecto Staging CL01', 'FD-STG-001', 'CC-STG-001', 'Responsable Staging', 'Aprobador Staging', 'active', 1, 'Proyecto ficticio para piloto tecnico.'),
  ('30000000-0000-4000-8000-000000000002', 'CL02', 'Proyecto Staging CL02', 'FD-STG-002', 'CC-STG-002', 'Responsable Staging', 'Aprobador Staging', 'active', 1, 'Proyecto ficticio para piloto tecnico.'),
  ('30000000-0000-4000-8000-000000000003', 'CL03', 'Proyecto Staging Inactivo', 'FD-STG-003', 'CC-STG-003', 'Responsable Staging', 'Aprobador Staging', 'inactive', 1, 'Proyecto ficticio inactivo para validar rechazo.')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  financial_dimension = VALUES(financial_dimension),
  cost_center = VALUES(cost_center),
  manager = VALUES(manager),
  approver = VALUES(approver),
  status = VALUES(status),
  active = VALUES(active),
  description = VALUES(description);

INSERT INTO inventory_items (id, warehouse_id, sku, description, category, unit, size, quantity, unit_cost, active)
VALUES
  ('40000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'EPP-STG-001', 'Casco staging', 'Proteccion cabeza', 'unidad', 'STD', 20, 0.00, 1),
  ('40000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'EPP-STG-002', 'Guante staging', 'Proteccion manos', 'par', 'M', 30, 0.00, 1),
  ('40000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'EPP-STG-003', 'Lente staging stock bajo', 'Proteccion visual', 'unidad', 'STD', 1, 0.00, 1),
  ('40000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 'EPP-STG-004', 'Zapato staging otra bodega', 'Proteccion pies', 'par', '42', 10, 0.00, 1)
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  category = VALUES(category),
  unit = VALUES(unit),
  size = VALUES(size),
  quantity = VALUES(quantity),
  unit_cost = VALUES(unit_cost),
  active = VALUES(active);

COMMIT;

-- Suggested smoke payload with stock:
--
-- {
--   "warehouseId": "10000000-0000-4000-8000-000000000001",
--   "workerId": "20000000-0000-4000-8000-000000000001",
--   "projectId": "30000000-0000-4000-8000-000000000001",
--   "requesterReference": "Smoke staging",
--   "projectIdLegacy": null,
--   "notes": "Prueba controlada staging",
--   "items": [
--     {
--       "inventoryItemId": "40000000-0000-4000-8000-000000000001",
--       "quantity": 1
--     }
--   ]
-- }

