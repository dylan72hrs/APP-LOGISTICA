# ETAPA 5 - Plan de pruebas staging

## Objetivo

Validar el piloto tecnico backend PHP + MySQL staging + frontend API sin pasar a
produccion y sin usar datos reales.

Las pruebas con DB solo deben ejecutarse si existe configuracion staging real,
segura y no versionada. Si no existe, registrar el caso como pendiente por falta
de configuracion staging.

## Ambiente esperado

- Frontend Next.js con `localStorage` como default.
- Modo API solo con `NEXT_PUBLIC_DATA_REPOSITORY=api`.
- Backend PHP publicado en staging o levantado localmente para smoke.
- MySQL/MariaDB staging con schema cargado.
- Datos ficticios minimos.
- Sin auth real, sin roles reales, sin datos productivos.

## Casos backend

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| B01 | Backend sin DB configurada | Ejecutar `GET /health` y luego GET de datos sin config DB. | `/health` OK. Endpoints con DB responden `DATABASE_NOT_CONFIGURED` sin secretos. |
| B02 | Backend con DB configurada | Configurar DB staging por entorno o archivo local no versionado y ejecutar `check-db.php`. | `DB configured: yes` y `Connection: ok`. |
| B03 | Schema cargado | Ejecutar `check-schema.php`. | Todas las tablas y columnas criticas responden OK. |
| B04 | Proyectos activos | Ejecutar `GET /projects?activeOnly=true`. | Devuelve solo proyectos activos o lista vacia valida. |
| B05 | Bodegas activas | Ejecutar `GET /warehouses?activeOnly=true`. | Devuelve bodegas activas o lista vacia valida. |
| B06 | Trabajadores activos | Ejecutar `GET /workers?activeOnly=true`. | Devuelve trabajadores activos o lista vacia valida. |
| B07 | Inventario con stock | Ejecutar `GET /inventory?warehouseId=<warehouse-id>&activeOnly=true`. | Devuelve items de la bodega con cantidades actuales. |
| B08 | Consumo exitoso | Enviar `POST /consumptions` con `projectId`, bodega, trabajador e item con stock. | HTTP 201, consumo creado, stock descontado, snapshots de proyecto y `audit_log`. |
| B09 | Consumo sin proyecto | Enviar `POST /consumptions` sin `projectId`. | HTTP 400 `VALIDATION_ERROR`; no se crea consumo ni descuento. |
| B10 | Proyecto inactivo | Enviar `POST /consumptions` con proyecto `inactive` o `active=0`. | HTTP 400 `VALIDATION_ERROR`; no se crea consumo ni descuento. |
| B11 | Stock insuficiente | Enviar cantidad mayor al stock disponible. | HTTP 409 `STOCK_NOT_AVAILABLE`; no hay descuento parcial. |
| B12 | Producto de otra bodega | Enviar item de bodega distinta a `warehouseId`. | HTTP 400 `VALIDATION_ERROR`; no hay descuento. |
| B13 | Payload invalido | Enviar JSON invalido, items vacios o cantidad no entera positiva. | Error controlado `VALIDATION_ERROR`; sin stack trace. |
| B14 | Audit log generado | Revisar `audit_log` tras B08. | Existe evento `consumption.created` con `entity_id` del consumo. |
| B15 | Rollback | Forzar caso fallido despues de validar payload, por ejemplo stock insuficiente. | No hay cabecera, detalle ni descuento parcial. |

## Casos frontend

| ID | Caso | Pasos | Resultado esperado |
| --- | --- | --- | --- |
| F01 | Frontend localStorage | Ejecutar sin `NEXT_PUBLIC_DATA_REPOSITORY`. Abrir rutas principales. | Usa datos locales/mock persistidos. No requiere backend. |
| F02 | Frontend API | Ejecutar con `NEXT_PUBLIC_DATA_REPOSITORY=api` y `NEXT_PUBLIC_API_BASE_URL=<backend-staging>`. | Lee proyectos, bodegas, trabajadores, inventario y consumos desde API. |
| F03 | Consumo desde frontend API | En `/consumptions`, crear consumo con proyecto activo y stock suficiente. | Vale creado, API recibe POST, stock baja en DB staging. |
| F04 | Vale con proyecto | Imprimir o previsualizar vale del consumo de F03. | Muestra proyecto, codigo, centro de costo y dimension financiera. |
| F05 | Ficha con proyecto | Abrir `/consumption-sheet` para el trabajador probado. | Historial muestra proyecto y datos financieros operativos. |
| F06 | Reportes por proyecto | Abrir `/reports` y filtrar/revisar vista por proyecto. | Reportes incluyen proyecto sin romper filtros existentes. |
| F07 | Vuelta a localStorage | Quitar flag API o usar `NEXT_PUBLIC_DATA_REPOSITORY=local`. | La app vuelve a modo local sin depender del backend. |

## Datos minimos sugeridos

- 1 bodega activa con al menos 2 items.
- 1 bodega adicional para probar producto de otra bodega.
- 2 trabajadores activos.
- 1 proyecto activo para consumo exitoso.
- 1 proyecto inactivo para rechazo.
- 1 item con stock suficiente.
- 1 item con stock bajo para rechazo.

## Evidencia a guardar

- Fecha y responsable.
- Version o commit probado.
- Ambiente frontend/backend.
- Resultado de `npm.cmd run typecheck`.
- Resultado de `npm.cmd run build`.
- Resultado de `php -l`.
- Resultado de `check-db.php`.
- Resultado de `check-schema.php`.
- Captura o transcripcion resumida de respuestas HTTP.
- Confirmacion manual de DB: stock, consumo, items y audit_log.
- Decision: aprobado, rechazado o aprobado con observaciones.

## Bloqueos

Bloquear aprobacion del piloto si aparece cualquiera de estos puntos:

- Credenciales reales en repo o documentacion.
- DB staging no separada de produccion.
- API con errores que exponen secretos.
- Consumo exitoso sin proyecto.
- Descuento parcial de stock ante error.
- Falta de `audit_log`.
- Frontend queda en API por defecto al terminar la prueba.

