# Orden de implementacion backend PHP - ETAPA 4.7E-PLAN

## Estado

Este documento define el orden recomendado para implementar endpoints reales en `backend/php-api` en una etapa posterior. No modifica codigo PHP y no activa backend real.

## Principios de implementacion

- Mantener el frontend funcionando con `localStorage` hasta que exista backend probado.
- No activar `apiRepository` hasta tener endpoints estables y ambiente configurado.
- Implementar primero lecturas simples antes de escritura critica.
- Implementar `POST /consumptions` con transaccion desde el primer dia.
- No confiar en stock, costos ni permisos calculados por el frontend.
- No implementar auth visual como si fuera seguridad real.
- No reactivar proyectos como eje central.

## Fase 1 - Base tecnica segura

Objetivo: dejar el backend listo para recibir implementacion real sin credenciales en repositorio.

Mantener:

- `GET /health`.

Preparar en una etapa futura:

- Carga de configuracion segura sin credenciales reales en Git.
- Estrategia para variables de entorno o archivo local fuera del repositorio.
- `Connection.php` para PDO, pero sin datos reales en codigo.
- Manejo estandar de errores JSON.
- Validacion basica de metodo/ruta.

No hacer en esta fase:

- No implementar login real.
- No exponer datos de negocio.
- No conectar frontend.
- No activar `apiRepository`.

Archivos probables a tocar o crear:

- `backend/php-api/src/Database/Connection.php`
- `backend/php-api/src/Config/DatabaseConfig.example.php`
- `backend/php-api/src/Http/Response.php`
- `backend/php-api/src/Http/Router.php`

Validacion esperada:

- `/health` sigue respondiendo.
- No existen credenciales reales.
- No existe `.env` versionado.

## Fase 2 - Lecturas read-only iniciales

Objetivo: probar conectividad MySQL y mapeo DTO sin riesgo de modificar datos.

Endpoints:

- `GET /warehouses`
- `GET /warehouses/:id`
- `GET /workers`
- `GET /workers/:id`
- `GET /inventory`
- `GET /inventory/:id`

Tablas:

- `warehouses`
- `workers`
- `inventory_items`

Reglas:

- Solo lectura.
- Sin `POST`, `PUT` ni `DELETE`.
- Sin importacion Excel backend.
- Sin costos como foco de respuesta.
- Filtros simples y validados.
- Paginacion o limite razonable si el volumen crece.

Archivos probables a crear:

- `backend/php-api/src/Controllers/WarehouseController.php`
- `backend/php-api/src/Controllers/WorkerController.php`
- `backend/php-api/src/Controllers/InventoryController.php`
- `backend/php-api/src/Repositories/WarehouseRepository.php`
- `backend/php-api/src/Repositories/WorkerRepository.php`
- `backend/php-api/src/Repositories/InventoryRepository.php`

Validacion esperada:

- Las lecturas devuelven JSON consistente con `docs/api/dto-examples.md`.
- No se modifica stock.
- No se insertan consumos.
- No se activa frontend todavia.

## Fase 3 - Consumos y stock transaccional

Objetivo: implementar la operacion critica del MVP con consistencia de stock.

Endpoints:

- `GET /consumptions`
- `GET /consumptions/:id`
- `POST /consumptions`

Tablas:

- `consumption_records`
- `consumption_items`
- `inventory_items`
- `warehouses`
- `workers`
- `audit_log`

Reglas criticas para `POST /consumptions`:

- `warehouseId` obligatorio.
- `workerId` obligatorio.
- `items` obligatorio y no vacio.
- `quantity` entera positiva.
- Cada producto debe pertenecer a la bodega.
- Stock suficiente validado en servidor.
- Transaccion MySQL obligatoria.
- Bloqueo de filas con `SELECT FOR UPDATE` o equivalente.
- Insertar `consumption_records`.
- Insertar `consumption_items`.
- Descontar `inventory_items.quantity`.
- Registrar `audit_log`.
- `commit` solo si todo es valido.
- `rollback` ante cualquier error.
- No confiar en stock calculado por frontend.
- No confiar en costos enviados por frontend.
- `projectIdLegacy` opcional.
- `requesterReference` opcional.

Archivos probables a crear:

- `backend/php-api/src/Controllers/ConsumptionController.php`
- `backend/php-api/src/Repositories/ConsumptionRepository.php`
- `backend/php-api/src/Services/ConsumptionService.php`
- `backend/php-api/src/Services/AuditService.php`

Validacion esperada:

- Un consumo valido descuenta stock una sola vez.
- Si un item no tiene stock, no se registra nada.
- Si falla un insert, se revierte todo.
- El detalle usa snapshots del producto.
- El audit log queda registrado server-side.

## Fase 4 - Reportes operativos

Objetivo: mover reportes MVP a consultas server-side sin foco financiero ni proyectos.

Endpoint:

- `GET /reports/operational`

Tipos:

- `warehouse`
- `worker`
- `product`
- `period`

Tablas:

- `consumption_records`
- `consumption_items`
- `warehouses`
- `workers`
- `inventory_items`

Reglas:

- `from` y `to` obligatorios.
- Validar rango de fechas.
- Aplicar limite de rango o paginacion si corresponde.
- No centrar reporte en proyectos.
- No mostrar costos como foco principal.
- Mostrar `requesterReference` solo como referencia opcional si aporta contexto.

Archivos probables a crear:

- `backend/php-api/src/Controllers/ReportController.php`
- `backend/php-api/src/Repositories/ReportRepository.php`

Validacion esperada:

- Reportes por bodega, trabajador, producto y periodo.
- Compatibilidad con consumos sin `projectIdLegacy`.
- Sin dependencia de reportes cliente-side para datos finales.

## Fase 5 - Auth real y proteccion de rutas

Objetivo: reemplazar el login demo por seguridad server-side minima para piloto.

Endpoints futuros:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Reglas:

- Password con `password_hash`.
- Verificacion con `password_verify`.
- Cookies `HttpOnly`, `Secure`, `SameSite`.
- Middleware real para rutas protegidas.
- Roles minimos: `admin`, `operator`, `reports`.
- Proteccion real de `/admin/users` si alguna vez vuelve al alcance.
- Rate limiting de login.
- Auditoria de login y acciones criticas.
- HTTPS obligatorio.

Archivos probables a crear o completar:

- `backend/php-api/src/Controllers/AuthController.php`
- `backend/php-api/src/Middleware/RequireAuth.php`
- `backend/php-api/src/Repositories/UserRepository.php`
- `backend/php-api/src/Services/AuthService.php`
- `backend/php-api/src/Services/AuditService.php`

Validacion esperada:

- No hay rutas de negocio sin proteccion cuando auth real este activa.
- No se devuelven hashes ni datos sensibles.
- Sesion/cookie no vive en `localStorage`.

## Orden recomendado de entrega

1. Fase 1: base tecnica y PDO preparado.
2. Fase 2: endpoints read-only `warehouses`, `workers`, `inventory`.
3. Fase 3: consumos transaccionales.
4. Fase 4: reportes operativos.
5. Fase 5: auth real y proteccion server-side.
6. Activar `apiRepository` solo despues de pruebas controladas.

## Archivos probables de implementacion futura

- `backend/php-api/src/Controllers/WarehouseController.php`
- `backend/php-api/src/Controllers/WorkerController.php`
- `backend/php-api/src/Controllers/InventoryController.php`
- `backend/php-api/src/Controllers/ConsumptionController.php`
- `backend/php-api/src/Controllers/ReportController.php`
- `backend/php-api/src/Controllers/AuthController.php`
- `backend/php-api/src/Repositories/WarehouseRepository.php`
- `backend/php-api/src/Repositories/WorkerRepository.php`
- `backend/php-api/src/Repositories/InventoryRepository.php`
- `backend/php-api/src/Repositories/ConsumptionRepository.php`
- `backend/php-api/src/Repositories/ReportRepository.php`
- `backend/php-api/src/Repositories/UserRepository.php`
- `backend/php-api/src/Services/ConsumptionService.php`
- `backend/php-api/src/Services/AuditService.php`
- `backend/php-api/src/Services/AuthService.php`

## Criterios para no avanzar

No implementar endpoints reales si falta:

- Decision de ambiente cPanel.
- Ruta segura para variables de entorno.
- Base MySQL staging.
- Backups o restauracion confirmados.
- Validacion de transacciones InnoDB.
- Plan de pruebas con datos semilla.
