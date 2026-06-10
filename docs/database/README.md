# Base de datos MySQL/MariaDB - APP-LOGISTICA / EPP Tracker 3.0

## Propósito

Esta carpeta documenta el esquema base para una futura migración de APP-LOGISTICA / EPP Tracker 3.0 desde persistencia local en navegador hacia MySQL/MariaDB en un ambiente cPanel.

El archivo principal es:

- `docs/database/schema-mysql.sql`

Este esquema es preparatorio. Todavía no está conectado a la app, no crea backend, no crea API routes y no reemplaza `localStorage`.

## Tablas incluidas

### `warehouses`

Bodegas operativas donde se administra inventario y consumo.

### `users`

Usuarios futuros para autenticación real y trazabilidad. Incluye `password_hash`, no contraseña plana.

### `workers`

Trabajadores internos, externos o invitados que reciben EPP.

### `inventory_items`

Productos/EPP y stock por bodega. Incluye `UNIQUE (warehouse_id, sku)` para evitar duplicados del mismo SKU dentro de una misma bodega.

### `consumption_records`

Cabecera del consumo o vale de entrega de EPP. Permite `requester_reference` opcional y `project_id_legacy` opcional solo para compatibilidad histórica.

### `consumption_items`

Detalle de productos entregados en cada consumo. Guarda snapshots de SKU, descripción, unidad/talla y costo interno opcional para conservar histórico.

### `audit_log`

Registro futuro de acciones críticas sobre inventario, consumos, usuarios y migraciones.

## Orden recomendado de importación

Para una migración desde datos locales o seed inicial, usar este orden:

1. `warehouses`
2. `users`
3. `workers`
4. `inventory_items`
5. `consumption_records`
6. `consumption_items`
7. `audit_log`

Este orden respeta dependencias y llaves foráneas.

## Relación con localStorage actual

La app actual persiste datos en el navegador usando la clave:

```text
app-logistica:persistent-data:v1
```

Ese snapshot contiene datos de bodegas, inventario, proyectos legacy, trabajadores y consumos.

La migración futura debería:

- Exportar un respaldo JSON desde `localStorage`.
- Validar estructura antes de importar.
- Normalizar IDs a UUID `CHAR(36)` o conservar mapeos legacy.
- Importar tablas en el orden recomendado.
- Comparar conteos entre origen y destino.
- Validar stock por bodega/producto.
- Registrar la importación en `audit_log`.

## Estado de conexión

El esquema no está conectado a la app.

La app sigue usando `localStorageRepository` por defecto. `apiRepository` existe solo como stub preparado y no llama endpoints reales.

La migración real queda para una etapa posterior.

## Riesgos

- Ejecutar SQL en una base con datos reales sin respaldo puede causar pérdida de datos.
- Importar datos inconsistentes desde `localStorage` puede dejar stock incorrecto.
- Cambiar IDs sin mapa de equivalencias puede romper consumos históricos.
- Ejecutar este esquema directamente en producción sin prueba previa no está recomendado.
- La concurrencia de stock debe resolverse en backend con transacciones antes de piloto real.

## Recomendación

Probar primero en una base staging o una base MySQL/MariaDB vacía.

Antes de cualquier importación real:

- Respaldar la base.
- Respaldar el JSON local.
- Ejecutar importación con datos de prueba.
- Revisar conteos.
- Revisar stock.
- Revisar vales y reportes.
- Recién después evaluar activación de `apiRepository`.
