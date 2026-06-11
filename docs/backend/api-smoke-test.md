# Smoke test API backend PHP/MySQL staging

## Estado

Esta guia permite probar el backend PHP y el frontend contra API sin incluir credenciales reales en el repositorio.

No documentar passwords, usuarios reales, host sensible ni dumps productivos.

## Backend sin DB configurada

Levantar backend si existe PHP local:

```powershell
php -S 127.0.0.1:8080 -t backend/php-api/public
```

Probar:

```text
GET http://127.0.0.1:8080/health
GET http://127.0.0.1:8080/warehouses
GET http://127.0.0.1:8080/workers
GET http://127.0.0.1:8080/inventory
```

Resultado esperado:

- `/health` responde `status: ok`.
- `/warehouses` responde `DATABASE_NOT_CONFIGURED`.
- `/workers` responde `DATABASE_NOT_CONFIGURED`.
- `/inventory` responde `DATABASE_NOT_CONFIGURED`.
- No se devuelven datos mock.
- No se muestran host, usuario, password, DSN ni stack trace.

## Backend con DB staging configurada

Configurar credenciales solo mediante variables de entorno del hosting o archivo local no versionado.

Archivos que no deben entrar a Git:

- `backend/php-api/.env`
- `backend/php-api/.env.local`
- `backend/php-api/config.local.php`
- `backend/php-api/src/Config/DatabaseConfig.php`
- `backend/php-api/src/Config/*.local.php`

Ejecutar diagnostico CLI:

```powershell
php backend/php-api/tools/check-db.php
```

Resultado esperado:

```text
DB configured: yes
Connection: ok
```

Si falta configuracion:

```text
DB configured: no
Connection: fail
```

El script no debe mostrar host, usuario, password ni DSN.

## GET reales

Con DB staging y schema cargado:

```text
GET /warehouses?activeOnly=true
GET /workers?activeOnly=true
GET /workers?warehouseId=<uuid>&activeOnly=true
GET /inventory?warehouseId=<uuid>&activeOnly=true
GET /inventory?warehouseId=<uuid>&search=<texto>
```

Resultado esperado:

- Devuelven datos reales de staging o lista vacia.
- Usan prepared statements.
- No devuelven mocks.
- No exponen secretos.

## POST /consumptions

Payload minimo:

```json
{
  "warehouseId": "<uuid-bodega-staging>",
  "workerId": "<uuid-trabajador-staging>",
  "requesterReference": "Smoke staging",
  "projectIdLegacy": null,
  "notes": "Prueba controlada",
  "items": [
    {
      "inventoryItemId": "<uuid-item-staging>",
      "quantity": 1
    }
  ]
}
```

Validar:

- Respuesta HTTP `201`.
- Se crea `consumption_records`.
- Se crean `consumption_items`.
- Baja `inventory_items.quantity`.
- Se registra `audit_log`.
- Si no hay stock, responde `STOCK_NOT_AVAILABLE`.
- Si el payload es invalido, responde `VALIDATION_ERROR`.
- Si falla un item, no hay descuento parcial.
- Rollback ante error.

## Frontend smoke API

Configurar solo para smoke:

```text
NEXT_PUBLIC_DATA_REPOSITORY=api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8080
```

Levantar frontend:

```powershell
npm.cmd run dev
```

Probar:

- Abrir dashboard.
- Revisar bodegas.
- Revisar trabajadores.
- Revisar inventario.
- Crear consumo de prueba contra staging.
- Confirmar descuento de stock en DB.
- Confirmar `audit_log`.

Al terminar:

- Volver a `NEXT_PUBLIC_DATA_REPOSITORY=local` o quitar la variable.
- Confirmar que `localStorage` sigue siendo default.
- No commitear archivos `.env` ni config local.

## Checklist antes de reportar OK

- No hay credenciales en Git.
- No hay `.env` versionado.
- `GET /health` OK.
- `check-db.php` OK solo en CLI.
- GET read-only OK.
- POST consumo OK con stock suficiente.
- POST consumo falla completo con stock insuficiente.
- Rollback verificado.
- `audit_log` verificado.
- Frontend vuelve a localStorage al terminar.
