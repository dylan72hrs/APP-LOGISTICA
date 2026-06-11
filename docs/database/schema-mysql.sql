-- APP-LOGISTICA / EPP Tracker 3.0
-- ETAPA 4.7C - Base schema for future MySQL/MariaDB backend.
-- ETAPA 4.7K - Projects restored as operational entity: adds `projects` table and
--              project_id + project snapshots on consumption_records.
--
-- This script is documentation/preparation only. It is not connected to the app yet.
-- IDs use CHAR(36) so the application/backend can store UUID values.
-- Do not place real emails, real passwords, or demo credentials in this file.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS warehouses (
  id CHAR(36) NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(160) NOT NULL,
  city VARCHAR(120) NULL,
  country VARCHAR(120) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_warehouses_code (code),
  KEY idx_warehouses_active (active),
  KEY idx_warehouses_country (country)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  email VARCHAR(190) NOT NULL,
  username VARCHAR(80) NOT NULL,
  name VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'operator', 'reports') NOT NULL,
  warehouse_id CHAR(36) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role),
  KEY idx_users_active (active),
  KEY idx_users_warehouse_id (warehouse_id),
  CONSTRAINT fk_users_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS workers (
  id CHAR(36) NOT NULL,
  rut VARCHAR(40) NOT NULL,
  name VARCHAR(180) NOT NULL,
  position VARCHAR(120) NULL,
  department VARCHAR(120) NULL,
  worker_type ENUM('internal', 'guest', 'external') NOT NULL DEFAULT 'internal',
  warehouse_id CHAR(36) NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_workers_rut (rut),
  KEY idx_workers_name (name),
  KEY idx_workers_warehouse_id (warehouse_id),
  KEY idx_workers_active (active),
  CONSTRAINT fk_workers_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_items (
  id CHAR(36) NOT NULL,
  warehouse_id CHAR(36) NOT NULL,
  sku VARCHAR(80) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(120) NULL,
  unit VARCHAR(50) NULL,
  size VARCHAR(80) NULL,
  quantity INT NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NULL COMMENT 'Internal historical value only; not MVP report focus.',
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventory_warehouse_sku (warehouse_id, sku),
  KEY idx_inventory_sku (sku),
  KEY idx_inventory_warehouse_id (warehouse_id),
  KEY idx_inventory_active (active),
  KEY idx_inventory_quantity (quantity),
  CONSTRAINT fk_inventory_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ETAPA 4.7K: operational projects master. The consumption flow requires the
-- project the worker comes from (code, cost center, financial dimension).
-- `status` is the operational approved/active state; `active` is the soft-delete flag.
CREATE TABLE IF NOT EXISTS projects (
  id CHAR(36) NOT NULL,
  project_code VARCHAR(50) NOT NULL,
  name VARCHAR(180) NOT NULL,
  financial_dimension VARCHAR(120) NULL,
  cost_center VARCHAR(120) NULL,
  manager VARCHAR(160) NULL,
  approver VARCHAR(160) NULL,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  active TINYINT(1) NOT NULL DEFAULT 1,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_code (project_code),
  KEY idx_projects_status (status),
  KEY idx_projects_active (active),
  KEY idx_projects_cost_center (cost_center)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consumption_records (
  id CHAR(36) NOT NULL,
  voucher_number VARCHAR(80) NULL,
  warehouse_id CHAR(36) NOT NULL,
  worker_id CHAR(36) NOT NULL,
  -- ETAPA 4.7K: project_id is the real operational project of the consumption.
  -- Required for new consumptions (enforced by the API); NULL only for historical rows.
  project_id CHAR(36) NULL,
  project_code_snapshot VARCHAR(50) NULL,
  project_name_snapshot VARCHAR(180) NULL,
  cost_center_snapshot VARCHAR(120) NULL,
  financial_dimension_snapshot VARCHAR(120) NULL,
  requester_reference VARCHAR(180) NULL COMMENT 'Free-form optional reference; it does NOT replace project_id.',
  project_id_legacy VARCHAR(80) NULL COMMENT 'Historical compatibility only (pre-4.7K records). Superseded by project_id.',
  delivered_by_user_id CHAR(36) NULL,
  consumed_at DATETIME NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consumption_voucher_number (voucher_number),
  KEY idx_consumption_warehouse_id (warehouse_id),
  KEY idx_consumption_worker_id (worker_id),
  KEY idx_consumption_consumed_at (consumed_at),
  KEY idx_consumption_project_id (project_id),
  KEY idx_consumption_requester_reference (requester_reference),
  KEY idx_consumption_project_id_legacy (project_id_legacy),
  KEY idx_consumption_delivered_by_user_id (delivered_by_user_id),
  CONSTRAINT fk_consumption_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_consumption_worker
    FOREIGN KEY (worker_id) REFERENCES workers (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_consumption_project
    FOREIGN KEY (project_id) REFERENCES projects (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  CONSTRAINT fk_consumption_delivered_by_user
    FOREIGN KEY (delivered_by_user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS consumption_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  consumption_record_id CHAR(36) NOT NULL,
  inventory_item_id CHAR(36) NOT NULL,
  sku_snapshot VARCHAR(80) NOT NULL,
  description_snapshot VARCHAR(255) NOT NULL,
  unit_snapshot VARCHAR(50) NULL,
  size_snapshot VARCHAR(80) NULL,
  quantity INT NOT NULL,
  unit_cost_snapshot DECIMAL(12,2) NULL COMMENT 'Internal historical value only; not MVP report focus.',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_consumption_items_record_id (consumption_record_id),
  KEY idx_consumption_items_inventory_item_id (inventory_item_id),
  KEY idx_consumption_items_sku_snapshot (sku_snapshot),
  CONSTRAINT fk_consumption_items_record
    FOREIGN KEY (consumption_record_id) REFERENCES consumption_records (id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_consumption_items_inventory
    FOREIGN KEY (inventory_item_id) REFERENCES inventory_items (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(80) NULL,
  warehouse_id CHAR(36) NULL,
  before_json JSON NULL,
  after_json JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_user_id (user_id),
  KEY idx_audit_action (action),
  KEY idx_audit_entity (entity_type, entity_id),
  KEY idx_audit_warehouse_id (warehouse_id),
  KEY idx_audit_created_at (created_at),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (user_id) REFERENCES users (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,
  CONSTRAINT fk_audit_warehouse
    FOREIGN KEY (warehouse_id) REFERENCES warehouses (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- ETAPA 4.7K migration notes (for staging databases created before this stage).
-- Non-destructive: only CREATE TABLE / ADD COLUMN / ADD KEY. No data is dropped.
-- Run the CREATE TABLE projects statement above first, then:
--
-- ALTER TABLE consumption_records
--   ADD COLUMN project_id CHAR(36) NULL AFTER worker_id,
--   ADD COLUMN project_code_snapshot VARCHAR(50) NULL AFTER project_id,
--   ADD COLUMN project_name_snapshot VARCHAR(180) NULL AFTER project_code_snapshot,
--   ADD COLUMN cost_center_snapshot VARCHAR(120) NULL AFTER project_name_snapshot,
--   ADD COLUMN financial_dimension_snapshot VARCHAR(120) NULL AFTER cost_center_snapshot,
--   ADD KEY idx_consumption_project_id (project_id),
--   ADD CONSTRAINT fk_consumption_project
--     FOREIGN KEY (project_id) REFERENCES projects (id)
--     ON UPDATE CASCADE
--     ON DELETE RESTRICT;
--
-- Historical rows keep project_id = NULL (and possibly project_id_legacy).
-- New consumptions created through the API always carry project_id + snapshots.
-- ---------------------------------------------------------------------------
