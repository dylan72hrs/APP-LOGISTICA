# ETAPA 5 - Plantilla de resultados de prueba

## Identificacion

- Fecha:
- Responsable:
- Ambiente:
- URL frontend staging:
- URL backend staging:
- Version/tag probado:
- Commit probado:
- Navegador:
- PHP version:
- MySQL/MariaDB version:

## Seguridad de configuracion

- Credenciales en repo: si / no
- `.env` real versionado: si / no
- `DatabaseConfig.php` real versionado: si / no
- Dumps reales versionados: si / no
- Config DB usada: variables de entorno / archivo local no versionado / no disponible
- Observaciones:

## Validaciones locales

| Validacion | Resultado | Evidencia / notas |
| --- | --- | --- |
| `npm.cmd run typecheck` | pendiente | |
| `npm.cmd run build` | pendiente | |
| `php -l backend/php-api/public/index.php` | pendiente | |
| `php -l backend/php-api/tools/check-db.php` | pendiente | |
| `php -l backend/php-api/tools/check-schema.php` | pendiente | |
| `php -l backend/php-api/src/Controllers/ProjectController.php` | pendiente | |
| `php -l backend/php-api/src/Controllers/ConsumptionController.php` | pendiente | |
| `php -l backend/php-api/src/Repositories/ProjectRepository.php` | pendiente | |
| `php -l backend/php-api/src/Repositories/ConsumptionRepository.php` | pendiente | |
| `php -l backend/php-api/src/Services/ConsumptionService.php` | pendiente | |

## Backend smoke

| Prueba | Resultado | Evidencia / notas |
| --- | --- | --- |
| `GET /health` | pendiente | |
| `check-db.php` | pendiente | |
| `check-schema.php` | pendiente | |
| `GET /projects` | pendiente | |
| `GET /warehouses` | pendiente | |
| `GET /workers` | pendiente | |
| `GET /inventory` | pendiente | |
| `POST /consumptions` con stock suficiente | pendiente | |
| `POST /consumptions` con stock insuficiente | pendiente | |
| Rollback verificado | pendiente | |
| `audit_log` verificado | pendiente | |

## Frontend smoke

| Prueba | Resultado | Evidencia / notas |
| --- | --- | --- |
| Frontend default `localStorage` | pendiente | |
| Frontend con `NEXT_PUBLIC_DATA_REPOSITORY=api` | pendiente | |
| Dashboard carga | pendiente | |
| Proyectos cargan | pendiente | |
| Bodegas cargan | pendiente | |
| Trabajadores cargan | pendiente | |
| Inventario carga | pendiente | |
| Consumo de prueba con proyecto | pendiente | |
| Vale con proyecto | pendiente | |
| Ficha con proyecto | pendiente | |
| Reportes por proyecto | pendiente | |
| Vuelta a `localStorage` | pendiente | |

## Errores encontrados

| ID | Severidad | Descripcion | Ruta / endpoint | Estado |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Pendientes para cPanel/staging

- 

## Decision final

Seleccionar una:

- [ ] Aprobado
- [ ] Rechazado
- [ ] Aprobado con observaciones

Resumen de decision:


