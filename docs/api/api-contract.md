# Contrato API futuro - APP-LOGISTICA / EPP Tracker 3.0

## Estado

Este contrato es preparatorio para una API futura. No hay backend implementado, no hay API routes creadas y la app sigue usando `localStorage` por defecto.

Los DTO HTTP propuestos usan `camelCase` para el frontend. La base MySQL documentada en `docs/database/schema-mysql.sql` usa `snake_case`.

## Convenciones generales

- Base path sugerido: `/api`.
- Formato de request/response: JSON.
- Autenticacion futura: cookie `HttpOnly`, `Secure`, `SameSite`.
- Fechas: ISO 8601 en UTC o con zona horaria explicita.
- IDs: UUID en string, compatible con `CHAR(36)` en MySQL.
- Soft delete: usar `active=false` cuando aplique.
- ETAPA 4.7K: `projectId` es el dato operativo real del proyecto y es obligatorio en `POST /consumptions`.
- `projectIdLegacy` es opcional y solo para compatibilidad historica pre-4.7K. No reemplaza a `projectId`.
- `requesterReference` es una referencia libre opcional del vale. NO reemplaza al proyecto.
- `unitCost` y `unitCostSnapshot` son datos internos historicos, no foco MVP.

## Respuesta de error estandar

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos invalidos.",
    "details": [
      {
        "field": "warehouseId",
        "message": "La bodega es obligatoria."
      }
    ]
  }
}
```

Codigos esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INSUFFICIENT_STOCK`
- `RATE_LIMITED`
- `SERVER_ERROR`

## Auth

### POST `/api/auth/login`

Proposito: iniciar sesion real futura.

Body:

```json
{
  "username": "operador.demo",
  "password": "valor-no-documentado"
}
```

Respuesta esperada:

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "username": "operador.demo",
    "email": "operador@example.test",
    "name": "Operador Demo",
    "role": "operator",
    "warehouseId": "22222222-2222-4222-8222-222222222222",
    "active": true
  }
}
```

Validaciones server-side minimas:

- Usuario obligatorio.
- Password obligatorio.
- Usuario activo.
- Verificar `password_hash`; nunca password plano.
- Rate limiting por IP/usuario.
- Registrar intento fallido o exitoso en auditoria.
- Crear cookie segura si login es valido.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `RATE_LIMITED`
- `SERVER_ERROR`

### POST `/api/auth/logout`

Proposito: cerrar sesion real futura.

Body: no requerido.

Respuesta esperada:

```json
{
  "ok": true
}
```

Validaciones server-side minimas:

- Invalidar cookie/sesion.
- Registrar evento en auditoria si hay usuario autenticado.

Errores esperados:

- `SERVER_ERROR`

### GET `/api/auth/me`

Proposito: devolver usuario autenticado sin datos sensibles.

Query params: no requiere.

Respuesta esperada:

```json
{
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "username": "operador.demo",
    "email": "operador@example.test",
    "name": "Operador Demo",
    "role": "operator",
    "warehouseId": "22222222-2222-4222-8222-222222222222",
    "active": true
  }
}
```

Validaciones server-side minimas:

- Cookie/sesion valida.
- Usuario existe y esta activo.
- No devolver `password_hash`.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

## Warehouses

### GET `/api/warehouses`

Proposito: listar bodegas.

Query params:

- `active` opcional: `true|false|all`.

Respuesta esperada:

```json
{
  "warehouses": []
}
```

Validaciones server-side minimas:

- Usuario autenticado.
- Filtrar visibilidad segun rol futuro.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### POST `/api/warehouses`

Proposito: crear bodega.

Body esperado:

```json
{
  "code": "BOD-STG",
  "name": "Bodega Staging",
  "city": "Ciudad Demo",
  "country": "Chile",
  "active": true
}
```

Respuesta esperada:

```json
{
  "warehouse": {}
}
```

Validaciones server-side minimas:

- Rol `admin`.
- `code` obligatorio y unico.
- `name` obligatorio.
- Registrar `audit_log`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONFLICT`
- `SERVER_ERROR`

### PUT `/api/warehouses/:id`

Proposito: actualizar bodega.

Params:

- `id`: UUID de bodega.

Body esperado: campos editables de bodega.

Respuesta esperada:

```json
{
  "warehouse": {}
}
```

Validaciones server-side minimas:

- Rol `admin`.
- Bodega existe.
- `code` unico si cambia.
- Registrar `before_json` y `after_json`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `SERVER_ERROR`

### DELETE `/api/warehouses/:id`

Proposito: soft delete de bodega.

Params:

- `id`: UUID de bodega.

Respuesta esperada:

```json
{
  "ok": true
}
```

Validaciones server-side minimas:

- Rol `admin`.
- No eliminar fisicamente.
- Marcar `active=false`.
- Validar impacto en inventario/consumos.
- Registrar `audit_log`.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `SERVER_ERROR`

## Workers

### GET `/api/workers`

Proposito: listar trabajadores/invitados.

Query params:

- `warehouseId` opcional.
- `active` opcional: `true|false|all`.
- `search` opcional.

Respuesta esperada:

```json
{
  "workers": []
}
```

Validaciones server-side minimas:

- Usuario autenticado.
- Operador solo ve su bodega asignada.
- Admin puede filtrar por bodega.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### POST `/api/workers`

Proposito: crear trabajador o invitado.

Body esperado:

```json
{
  "rut": "00.000.000-0",
  "name": "Trabajador Demo",
  "position": "Cargo Demo",
  "department": "Area Demo",
  "workerType": "internal",
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "active": true
}
```

Respuesta esperada:

```json
{
  "worker": {}
}
```

Validaciones server-side minimas:

- Rol `admin` u `operator`.
- `rut` obligatorio y unico.
- `name` obligatorio.
- Bodega existente si se informa.
- Registrar `audit_log`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONFLICT`
- `SERVER_ERROR`

### PUT `/api/workers/:id`

Proposito: actualizar trabajador.

Params:

- `id`: UUID de trabajador.

Body esperado: campos editables de trabajador.

Respuesta esperada:

```json
{
  "worker": {}
}
```

Validaciones server-side minimas:

- Trabajador existe.
- `rut` unico si cambia.
- Registrar `audit_log`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `SERVER_ERROR`

### DELETE `/api/workers/:id`

Proposito: soft delete de trabajador si aplica.

Params:

- `id`: UUID de trabajador.

Respuesta esperada:

```json
{
  "ok": true
}
```

Validaciones server-side minimas:

- Marcar `active=false`.
- No borrar consumos historicos.
- Registrar `audit_log`.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `SERVER_ERROR`

## Inventory

### GET `/api/inventory`

Proposito: listar inventario.

Query params:

- `warehouseId` opcional pero requerido para operadores.
- `active` opcional: `true|false|all`.
- `search` opcional.
- `lowStock` opcional.

Respuesta esperada:

```json
{
  "items": []
}
```

Validaciones server-side minimas:

- Usuario autenticado.
- Operador solo consulta su bodega.
- No permitir operaciones sobre "Todas las bodegas" para consumo.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### POST `/api/inventory`

Proposito: crear item de inventario.

Body esperado:

```json
{
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "sku": "EPP-DEMO-001",
  "description": "Producto EPP Demo",
  "category": "Proteccion",
  "unit": "unidad",
  "size": "M",
  "quantity": 10,
  "unitCost": 0,
  "active": true
}
```

Respuesta esperada:

```json
{
  "item": {}
}
```

Validaciones server-side minimas:

- Rol `admin` u `operator`.
- Bodega obligatoria.
- SKU obligatorio.
- `warehouseId + sku` unico.
- Cantidad entera y no negativa.
- `unitCost` opcional e interno.
- Registrar `audit_log`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `CONFLICT`
- `SERVER_ERROR`

### PUT `/api/inventory/:id`

Proposito: actualizar item de inventario.

Params:

- `id`: UUID del item.

Body esperado: campos editables de inventario.

Respuesta esperada:

```json
{
  "item": {}
}
```

Validaciones server-side minimas:

- Item existe.
- Cantidad no negativa.
- SKU unico dentro de bodega si cambia.
- Registrar `before_json` y `after_json`.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `SERVER_ERROR`

### DELETE `/api/inventory/:id`

Proposito: soft delete de item de inventario.

Params:

- `id`: UUID del item.

Respuesta esperada:

```json
{
  "ok": true
}
```

Validaciones server-side minimas:

- No borrar fisicamente si tiene consumos historicos.
- Marcar `active=false`.
- Registrar `audit_log`.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `SERVER_ERROR`

## Projects

ETAPA 4.7K: Proyectos vuelve como entidad operativa del MVP. El consumo requiere
el proyecto desde el cual viene el trabajador, y el proyecto trae centro de costo
y dimension financiera.

### GET `/api/projects`

Proposito: listar proyectos operativos.

Query params:

- `activeOnly` opcional: `true` devuelve solo proyectos `status=active` y `active=1`.

Respuesta esperada:

```json
{
  "projects": [
    {
      "id": "66666666-6666-4666-8666-666666666666",
      "projectCode": "CL01",
      "name": "División Diamante - El Teniente",
      "financialDimension": "FD-MIN-ELTE",
      "costCenter": "CC-1001",
      "manager": "Responsable Demo",
      "approver": "Aprobador Demo",
      "status": "active",
      "active": true,
      "description": "",
      "createdAt": "2026-01-01T09:00:00.000Z",
      "updatedAt": "2026-01-01T09:00:00.000Z"
    }
  ]
}
```

Validaciones server-side minimas:

- Usuario autenticado (futuro).
- `DATABASE_NOT_CONFIGURED` si no hay DB configurada.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### GET `/api/projects/:id`

Proposito: obtener un proyecto por id o por codigo de proyecto.

Params:

- `id`: UUID del proyecto o `project_code` (ej. `CL01`).

Respuesta esperada:

```json
{
  "project": {}
}
```

Errores esperados:

- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### POST/PUT `/api/projects` (no implementado)

La creacion/edicion de proyectos por API queda como `NOT_IMPLEMENTED` controlado en esta etapa.
En modo `local` (default) los proyectos se administran en `/projects` con localStorage.

## Consumptions

### GET `/api/consumptions`

Proposito: listar consumos registrados.

Query params:

- `from` opcional, fecha ISO.
- `to` opcional, fecha ISO.
- `warehouseId` opcional.
- `workerId` opcional.
- `projectId` opcional.
- `inventoryItemId` opcional.

Respuesta esperada:

```json
{
  "consumptions": []
}
```

Validaciones server-side minimas:

- Usuario autenticado.
- Aplicar restricciones por rol/bodega.
- Validar rango de fechas.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

### POST `/api/consumptions`

Proposito: registrar consumo y descontar stock de forma atomica.

Body esperado:

```json
{
  "warehouseId": "22222222-2222-4222-8222-222222222222",
  "workerId": "33333333-3333-4333-8333-333333333333",
  "projectId": "66666666-6666-4666-8666-666666666666",
  "requesterReference": "Referencia libre opcional",
  "projectIdLegacy": null,
  "notes": "",
  "items": [
    {
      "inventoryItemId": "44444444-4444-4444-8444-444444444444",
      "quantity": 2
    }
  ]
}
```

Respuesta esperada:

```json
{
  "consumption": {}
}
```

Validaciones server-side minimas:

- Bodega especifica obligatoria.
- Trabajador valido y activo.
- ETAPA 4.7K: `projectId` obligatorio; el proyecto debe existir y estar `active`.
- El backend guarda `project_id` y snapshots (`project_code_snapshot`, `project_name_snapshot`, `cost_center_snapshot`, `financial_dimension_snapshot`) generados server-side desde el maestro de proyectos.
- `requesterReference` opcional, largo maximo. No reemplaza al proyecto.
- Al menos un item.
- Producto pertenece a la bodega.
- Cantidad entera positiva.
- Stock suficiente dentro de transaccion.
- Bloquear filas de inventario con `SELECT FOR UPDATE` o equivalente.
- Insertar cabecera, detalle, descuento de stock y `audit_log` en la misma transaccion.
- Rollback ante cualquier error.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `NOT_FOUND`
- `INSUFFICIENT_STOCK`
- `CONFLICT`
- `SERVER_ERROR`

## Reports

### GET `/api/reports/operational`

Proposito: obtener reportes operativos MVP.

Query params:

- `type`: `warehouse|worker|product|period`.
- `from`: fecha ISO obligatoria.
- `to`: fecha ISO obligatoria.
- `warehouseId` opcional.

Respuesta esperada:

```json
{
  "report": {
    "type": "warehouse",
    "period": {
      "from": "2026-01-01T00:00:00.000Z",
      "to": "2026-01-31T23:59:59.999Z"
    },
    "summary": [],
    "detail": []
  }
}
```

Validaciones server-side minimas:

- Usuario autenticado.
- Rango de fechas valido.
- Tipo de reporte permitido.
- No centrar reportes en proyecto.
- No usar costos como foco principal.
- Aplicar restricciones por rol/bodega.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `SERVER_ERROR`

## Audit

### GET `/api/audit`

Proposito: consultar auditoria futura. Solo admin.

Query params:

- `from` opcional.
- `to` opcional.
- `action` opcional.
- `entityType` opcional.
- `warehouseId` opcional.

Respuesta esperada:

```json
{
  "events": []
}
```

Validaciones server-side minimas:

- Rol `admin`.
- Rango de fechas valido.
- Paginacion obligatoria en implementacion real.

Errores esperados:

- `UNAUTHORIZED`
- `FORBIDDEN`
- `VALIDATION_ERROR`
- `SERVER_ERROR`

## Nota sobre audit_log

`audit_log` debe generarse principalmente server-side. El cliente no debe ser fuente confiable para auditoria de consumo, inventario, auth ni cambios criticos.
