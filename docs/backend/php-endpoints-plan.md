# Plan de endpoints PHP minimos - ETAPA 4.7E-PLAN

## Estado

Este documento define el plan tecnico para implementar endpoints reales minimos en `backend/php-api` en una etapa posterior. No implementa endpoints, no conecta MySQL y no modifica el frontend.

La API PHP actual sigue exponiendo solo `GET /health` como prueba tecnica.

## Convenciones

- Formato: JSON.
- Rutas documentadas sin prefijo para el backend PHP. Si el hosting usa subdominio, quedarian bajo `https://api.dominio.cl/...`.
- DTO HTTP: `camelCase`.
- Base MySQL: `snake_case`, segun `docs/database/schema-mysql.sql`.
- `projectIdLegacy` es opcional y solo para compatibilidad historica.
- `requesterReference` es opcional para centro de costo, faena o area solicitante.
- Costos internos no son foco visual ni eje principal de reportes MVP.
- Auth futura requerida significa que la ruta debera protegerse cuando exista auth real; no se debe simular seguridad antes.

## Contrato de errores

Formato estandar:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Texto legible",
    "details": {}
  }
}
```

Codigos sugeridos:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `STOCK_NOT_AVAILABLE`
- `CONFLICT`
- `INTERNAL_ERROR`
- `NOT_IMPLEMENTED`

## Health

### GET `/health`

Proposito: comprobar que el backend PHP responde.

Metodo: `GET`

Ruta: `/health`

Query params: ninguno.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "app-logistica-api",
  "mode": "setup"
}
```

Validaciones server-side minimas:

- No requiere base de datos.
- No requiere auth.
- No debe exponer version de PHP, rutas internas ni datos sensibles.

Errores esperados:

- `INTERNAL_ERROR`

Tabla MySQL relacionada: ninguna.

Auth futura: no.

Prioridad: 0, ya existe como prueba tecnica.

## Warehouses

### GET `/warehouses`

Proposito: listar bodegas disponibles para el MVP.

Metodo: `GET`

Ruta: `/warehouses`

Query params:

- `active`: opcional, `true|false|all`. Default futuro sugerido: `true`.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "warehouses": [
    {
      "id": "uuid",
      "code": "BOD-001",
      "name": "Bodega Central",
      "city": "Ciudad",
      "country": "Chile",
      "active": true
    }
  ]
}
```

Validaciones server-side minimas:

- Validar `active` si viene informado.
- No devolver bodegas eliminadas/inactivas salvo `active=all` o `active=false`.
- Aplicar filtro por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `warehouses`.

Auth futura: si.

Prioridad: 1.

### GET `/warehouses/:id`

Proposito: obtener una bodega por identificador.

Metodo: `GET`

Ruta: `/warehouses/:id`

Query params: ninguno.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "warehouse": {
    "id": "uuid",
    "code": "BOD-001",
    "name": "Bodega Central",
    "city": "Ciudad",
    "country": "Chile",
    "active": true
  }
}
```

Validaciones server-side minimas:

- `id` obligatorio.
- Validar formato UUID si se adopta UUID estricto.
- Retornar `NOT_FOUND` si no existe.
- Aplicar visibilidad por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `warehouses`.

Auth futura: si.

Prioridad: 2.

## Workers

### GET `/workers`

Proposito: listar trabajadores internos, externos e invitados.

Metodo: `GET`

Ruta: `/workers`

Query params:

- `warehouseId`: opcional.
- `active`: opcional, `true|false|all`. Default futuro sugerido: `true`.
- `search`: opcional para nombre o RUT.
- `workerType`: opcional, `internal|guest|external`.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "workers": [
    {
      "id": "uuid",
      "rut": "00.000.000-0",
      "name": "Trabajador Demo",
      "position": "Cargo",
      "department": "Area",
      "workerType": "internal",
      "warehouseId": "uuid",
      "active": true
    }
  ]
}
```

Validaciones server-side minimas:

- Validar `warehouseId` si viene informado.
- Validar `active` y `workerType`.
- Limitar resultados o paginar en implementacion real.
- Aplicar restricciones por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `workers`.

Auth futura: si.

Prioridad: 1.

### GET `/workers/:id`

Proposito: obtener un trabajador o invitado por identificador.

Metodo: `GET`

Ruta: `/workers/:id`

Query params: ninguno.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "worker": {
    "id": "uuid",
    "rut": "00.000.000-0",
    "name": "Trabajador Demo",
    "position": "Cargo",
    "department": "Area",
    "workerType": "internal",
    "warehouseId": "uuid",
    "active": true
  }
}
```

Validaciones server-side minimas:

- `id` obligatorio.
- Validar formato UUID si aplica.
- Retornar `NOT_FOUND` si no existe.
- Aplicar visibilidad por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `workers`.

Auth futura: si.

Prioridad: 2.

## Inventory

### GET `/inventory`

Proposito: listar EPP disponible por bodega y filtros operativos.

Metodo: `GET`

Ruta: `/inventory`

Query params:

- `warehouseId`: recomendado; obligatorio para operadores cuando exista auth real.
- `active`: opcional, `true|false|all`. Default futuro sugerido: `true`.
- `search`: opcional para SKU o descripcion.
- `lowStock`: opcional, `true|false`.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "items": [
    {
      "id": "uuid",
      "warehouseId": "uuid",
      "sku": "EPP-001",
      "description": "Casco de seguridad",
      "category": "Proteccion cabeza",
      "unit": "unidad",
      "size": "M",
      "quantity": 10,
      "active": true
    }
  ]
}
```

Validaciones server-side minimas:

- Validar `warehouseId` si viene informado.
- Validar `active` y `lowStock`.
- No devolver costo como foco principal.
- Aplicar restricciones por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `inventory_items`.

Auth futura: si.

Prioridad: 1.

### GET `/inventory/:id`

Proposito: obtener un item EPP por identificador.

Metodo: `GET`

Ruta: `/inventory/:id`

Query params: ninguno.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "item": {
    "id": "uuid",
    "warehouseId": "uuid",
    "sku": "EPP-001",
    "description": "Casco de seguridad",
    "category": "Proteccion cabeza",
    "unit": "unidad",
    "size": "M",
    "quantity": 10,
    "active": true
  }
}
```

Validaciones server-side minimas:

- `id` obligatorio.
- Validar formato UUID si aplica.
- Retornar `NOT_FOUND` si no existe.
- Aplicar visibilidad por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tabla MySQL relacionada: `inventory_items`.

Auth futura: si.

Prioridad: 2.

## Consumptions

### GET `/consumptions`

Proposito: listar consumos registrados para ficha, historial y reportes operativos.

Metodo: `GET`

Ruta: `/consumptions`

Query params:

- `from`: opcional, fecha ISO.
- `to`: opcional, fecha ISO.
- `warehouseId`: opcional.
- `workerId`: opcional.
- `inventoryItemId`: opcional.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "consumptions": [
    {
      "id": "uuid",
      "voucherNumber": "V-2026-0001",
      "warehouseId": "uuid",
      "workerId": "uuid",
      "requesterReference": "Faena Demo",
      "projectIdLegacy": null,
      "consumedAt": "2026-06-11T12:00:00.000Z",
      "items": []
    }
  ]
}
```

Validaciones server-side minimas:

- Validar rango de fechas.
- Validar IDs si vienen informados.
- Aplicar restricciones por rol/bodega cuando exista auth real.
- Incluir items desde `consumption_items` sin depender del frontend.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tablas MySQL relacionadas: `consumption_records`, `consumption_items`, `warehouses`, `workers`, `inventory_items`.

Auth futura: si.

Prioridad: 3.

### GET `/consumptions/:id`

Proposito: obtener un consumo especifico con detalle para vale/ficha.

Metodo: `GET`

Ruta: `/consumptions/:id`

Query params: ninguno.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "consumption": {
    "id": "uuid",
    "voucherNumber": "V-2026-0001",
    "warehouseId": "uuid",
    "workerId": "uuid",
    "requesterReference": "Faena Demo",
    "projectIdLegacy": null,
    "consumedAt": "2026-06-11T12:00:00.000Z",
    "items": [
      {
        "inventoryItemId": "uuid",
        "sku": "EPP-001",
        "description": "Casco de seguridad",
        "unit": "unidad",
        "quantity": 1
      }
    ]
  }
}
```

Validaciones server-side minimas:

- `id` obligatorio.
- Retornar `NOT_FOUND` si no existe.
- Aplicar restricciones por rol/bodega cuando exista auth real.
- No requerir `projectIdLegacy`.

Errores esperados:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tablas MySQL relacionadas: `consumption_records`, `consumption_items`, `warehouses`, `workers`, `inventory_items`.

Auth futura: si.

Prioridad: 3.

### POST `/consumptions`

Proposito: registrar consumo de EPP y descontar stock de forma atomica.

Metodo: `POST`

Ruta: `/consumptions`

Query params: ninguno.

Body esperado:

```json
{
  "warehouseId": "uuid",
  "workerId": "uuid",
  "requesterReference": "Faena Demo",
  "projectIdLegacy": null,
  "notes": "",
  "items": [
    {
      "inventoryItemId": "uuid",
      "quantity": 2
    }
  ]
}
```

Respuesta esperada:

```json
{
  "consumption": {
    "id": "uuid",
    "voucherNumber": "V-2026-0001",
    "warehouseId": "uuid",
    "workerId": "uuid",
    "requesterReference": "Faena Demo",
    "projectIdLegacy": null,
    "consumedAt": "2026-06-11T12:00:00.000Z",
    "items": []
  }
}
```

Validaciones server-side minimas:

- `warehouseId` obligatorio.
- `workerId` obligatorio.
- `items` obligatorio y no vacio.
- `quantity` debe ser entera positiva.
- Cada producto debe existir, estar activo y pertenecer a la bodega.
- La bodega debe existir y estar activa.
- El trabajador debe existir y estar activo.
- Stock suficiente validado en servidor.
- No confiar en stock calculado por frontend.
- No confiar en costos enviados por frontend.
- `projectIdLegacy` opcional; proyecto no es obligatorio.
- `requesterReference` opcional con largo maximo.
- Usar transaccion MySQL.
- Bloquear filas de inventario con `SELECT FOR UPDATE` o equivalente.
- Insertar `consumption_records`.
- Insertar `consumption_items`.
- Descontar `inventory_items.quantity`.
- Registrar `audit_log`.
- Hacer `commit` solo si todo es valido.
- Hacer `rollback` ante cualquier error.

Errores esperados:

- `VALIDATION_ERROR`
- `NOT_FOUND`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `STOCK_NOT_AVAILABLE`
- `CONFLICT`
- `INTERNAL_ERROR`

Tablas MySQL relacionadas: `consumption_records`, `consumption_items`, `inventory_items`, `warehouses`, `workers`, `audit_log`.

Auth futura: si.

Prioridad: 4, operacion critica.

## Reports

### GET `/reports/operational`

Proposito: entregar reportes operativos MVP por bodega, trabajador, EPP/producto o periodo.

Metodo: `GET`

Ruta: `/reports/operational`

Query params:

- `type`: obligatorio, `warehouse|worker|product|period`.
- `from`: obligatorio, fecha ISO.
- `to`: obligatorio, fecha ISO.
- `warehouseId`: opcional.

Body esperado: ninguno.

Respuesta esperada:

```json
{
  "report": {
    "type": "warehouse",
    "period": {
      "from": "2026-06-01T00:00:00.000Z",
      "to": "2026-06-30T23:59:59.999Z"
    },
    "summary": [],
    "detail": []
  }
}
```

Validaciones server-side minimas:

- Validar `type`.
- Validar `from` y `to`.
- Evitar rangos excesivos sin paginacion o limite.
- No centrar reportes en proyectos.
- Mostrar `requesterReference` solo como referencia opcional si corresponde.
- No mostrar costos como foco principal.
- Aplicar restricciones por rol/bodega cuando exista auth real.

Errores esperados:

- `VALIDATION_ERROR`
- `UNAUTHORIZED`
- `FORBIDDEN`
- `INTERNAL_ERROR`

Tablas MySQL relacionadas: `consumption_records`, `consumption_items`, `warehouses`, `workers`, `inventory_items`.

Auth futura: si.

Prioridad: 5.

## Explicitamente fuera de esta primera implementacion

- CRUD completo de usuarios.
- `DELETE` real.
- Importacion Excel backend.
- Auth real completa.
- `/admin/users` real.
- Restock IA.
- Proyectos como eje central.
- Aprobaciones.
- Picking.
- Escaneo.
- Solicitud movil.
