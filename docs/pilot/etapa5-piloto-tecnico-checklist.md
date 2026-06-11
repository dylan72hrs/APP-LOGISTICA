# ETAPA 5 - Checklist piloto tecnico backend + MySQL + frontend controlado

## Estado y alcance

Este checklist prepara un piloto tecnico controlado para validar el backend PHP,
MySQL staging y el frontend en modo API.

No es produccion. No activa API por defecto. No agrega credenciales reales. No
crea `.env` real versionado. El frontend debe seguir usando `localStorage` como
modo default y solo usar API cuando se configure `NEXT_PUBLIC_DATA_REPOSITORY=api`.

Si no existen credenciales staging disponibles, las pruebas con DB quedan
pendientes por falta de configuracion staging.

## Prerrequisitos cPanel

- [ ] Subdominio o ruta definida para API staging.
- [ ] SSL activo para frontend staging y backend staging.
- [ ] Logs PHP/Apache accesibles.
- [ ] Backups disponibles y restauracion entendida antes de cargar datos.
- [ ] Capacidad para crear DB MySQL/MariaDB staging separada de produccion.
- [ ] Capacidad para crear usuario DB staging con permisos acotados.
- [ ] Ubicacion segura para configuracion no versionada.
- [ ] Confirmar que `public/` sea el unico directorio expuesto de `backend/php-api`.

## PHP esperado

- [ ] PHP 8.1 o superior recomendado para staging.
- [ ] PHP 8.0 como minimo tecnico por uso de sintaxis moderna del backend.
- [ ] Extension PDO habilitada.
- [ ] Extension PDO MySQL habilitada.
- [ ] `php -l` disponible para validar archivos PHP.
- [ ] Errores PHP configurados para no exponer stack trace ni rutas sensibles al navegador.

## Base de datos staging

- [ ] Crear DB staging con nombre no sensible.
- [ ] Crear usuario DB staging distinto a produccion.
- [ ] Otorgar permisos minimos requeridos: `SELECT`, `INSERT`, `UPDATE`.
- [ ] Evaluar si se requiere `DELETE` solo para tareas administrativas fuera del piloto.
- [ ] No usar usuario root ni usuario compartido del hosting.
- [ ] Cargar `docs/database/schema-mysql.sql`.
- [ ] Cargar datos minimos ficticios desde `docs/pilot/mysql-staging-seed-example.sql`
      o un seed equivalente aprobado.
- [ ] Confirmar tablas requeridas: `projects`, `warehouses`, `workers`,
      `inventory_items`, `consumption_records`, `consumption_items`, `audit_log`.

## Configuracion segura no versionada

- [ ] Configurar DB solo por variables de entorno del hosting o archivo local no versionado.
- [ ] No crear `.env` real versionado.
- [ ] No subir `backend/php-api/src/Config/DatabaseConfig.php` real.
- [ ] No subir `backend/php-api/config.local.php` real.
- [ ] No documentar host real, usuario real ni password real.
- [ ] Confirmar `.gitignore` antes de cualquier commit futuro.
- [ ] Confirmar que errores de API no muestran host, usuario, password, DSN ni stack trace.

## Pruebas backend minimas

- [ ] `GET /health` responde OK sin DB.
- [ ] `php backend/php-api/tools/check-db.php` responde OK solo cuando DB staging esta configurada.
- [ ] `php backend/php-api/tools/check-schema.php` responde OK solo cuando schema requerido esta cargado.
- [ ] `GET /projects` responde lista o lista vacia con DB staging.
- [ ] `GET /warehouses` responde lista o lista vacia con DB staging.
- [ ] `GET /workers` responde lista o lista vacia con DB staging.
- [ ] `GET /inventory` responde lista o lista vacia con DB staging.
- [ ] Los GET no devuelven mocks.
- [ ] Los GET no exponen secretos.

## Pruebas POST /consumptions

- [ ] Probar consumo con `projectId` valido, bodega activa, trabajador activo y stock suficiente.
- [ ] Confirmar HTTP 201.
- [ ] Confirmar insercion en `consumption_records`.
- [ ] Confirmar insercion en `consumption_items`.
- [ ] Confirmar descuento de `inventory_items.quantity`.
- [ ] Confirmar snapshots de proyecto: codigo, nombre, centro de costo y dimension financiera.
- [ ] Confirmar registro en `audit_log`.
- [ ] Probar consumo con stock insuficiente.
- [ ] Confirmar error controlado `STOCK_NOT_AVAILABLE`.
- [ ] Confirmar que no queda descuento parcial.
- [ ] Confirmar rollback completo ante error.
- [ ] Probar consumo sin `projectId`.
- [ ] Confirmar error de validacion porque el proyecto es obligatorio en ETAPA 5.

## Pruebas frontend

- [ ] Levantar frontend con configuracion default.
- [ ] Confirmar que sin feature flag usa `localStorage`.
- [ ] Levantar frontend de smoke con `NEXT_PUBLIC_DATA_REPOSITORY=api`.
- [ ] Configurar `NEXT_PUBLIC_API_BASE_URL` apuntando a backend staging.
- [ ] Abrir `/dashboard`.
- [ ] Abrir `/projects`.
- [ ] Abrir `/warehouses`.
- [ ] Abrir `/workers`.
- [ ] Abrir `/inventory`.
- [ ] Abrir `/consumptions`.
- [ ] Registrar un consumo de prueba con proyecto y stock suficiente.
- [ ] Confirmar que vale imprimible muestra proyecto, codigo, centro de costo y dimension financiera.
- [ ] Confirmar que ficha/historial muestra proyecto.
- [ ] Confirmar que reportes permiten revisar proyecto.
- [ ] Al terminar, quitar `NEXT_PUBLIC_DATA_REPOSITORY=api` o volver a `local`.
- [ ] Confirmar que `localStorage` vuelve a ser default.

## CORS staging

- [ ] Si el navegador bloquea el smoke API, revisar `API_ALLOWED_ORIGIN`.
- [ ] Configurar un origen staging especifico cuando exista URL final.
- [ ] No recomendar wildcard para piloto con datos reales.
- [ ] No abrir CORS mas de lo necesario.
- [ ] No cambiar CORS si no hay prueba real que lo requiera.

## Criterios de aprobacion

- [ ] Typecheck frontend OK.
- [ ] Build frontend OK.
- [ ] PHP lint OK para archivos backend criticos.
- [ ] `GET /health` OK.
- [ ] `check-db.php` OK en staging configurado.
- [ ] `check-schema.php` OK en staging con schema cargado.
- [ ] GET de proyectos, bodegas, trabajadores e inventario OK.
- [ ] `POST /consumptions` OK con proyecto y stock suficiente.
- [ ] `POST /consumptions` rechaza stock insuficiente sin descuento parcial.
- [ ] Rollback verificado.
- [ ] `audit_log` verificado.
- [ ] Frontend API smoke OK.
- [ ] Frontend vuelve a `localStorage` al terminar.
- [ ] No hay credenciales, dumps ni configs reales versionadas.

## Criterios de rechazo

- [ ] Falla typecheck o build.
- [ ] PHP lint falla en archivos criticos.
- [ ] La API expone secretos, rutas absolutas o stack trace.
- [ ] `POST /consumptions` permite consumo sin proyecto.
- [ ] `POST /consumptions` descuenta stock parcial ante error.
- [ ] No se genera `audit_log` en consumo exitoso.
- [ ] El frontend queda usando API por defecto.
- [ ] Se detectan credenciales reales o datos productivos en el repo.
- [ ] No hay backups, logs o SSL para staging con datos de prueba controlados.

