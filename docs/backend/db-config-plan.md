# Plan de configuracion segura DB - ETAPA 4.7F-DB-CONFIG-PLAN

## Estado

Este documento planifica como se configurara la conexion MySQL/MariaDB del backend PHP en cPanel en una etapa posterior.

No implementa conexion real, no crea `.env`, no agrega credenciales y no modifica `Connection.php`, repositories ni endpoints.

## Objetivo

Preparar una estrategia segura para que `backend/php-api` pueda conectarse a MySQL/MariaDB sin subir secretos al repositorio y sin exponer detalles tecnicos al usuario final cuando falle la conexion.

## Arquitectura esperada

- Frontend Next.js estatico.
- Backend PHP separado en cPanel.
- MySQL/MariaDB administrado por cPanel.
- Subdominio API recomendado si el proveedor lo permite.
- `localStorageRepository` sigue como default hasta que exista backend probado.
- `apiRepository` se activara solo despues de pruebas controladas.

## Configuracion requerida

Variables/configs necesarias en ambiente futuro:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_CHARSET`
- `APP_ENV`

Valores esperados:

- `DB_HOST`: host MySQL del proveedor, usualmente `localhost` en cPanel.
- `DB_PORT`: puerto MySQL, usualmente `3306`.
- `DB_NAME`: base staging o piloto.
- `DB_USER`: usuario MySQL con permisos acotados.
- `DB_PASSWORD`: password real, nunca versionada.
- `DB_CHARSET`: `utf8mb4`.
- `APP_ENV`: `local`, `staging` o `production`.

## Lectura segura de credenciales en PHP

Orden recomendado para etapa futura:

1. Leer configuracion desde variables de entorno si cPanel lo soporta de forma confiable.
2. Si cPanel no soporta variables, leer un archivo local no versionado fuera del repositorio.
3. Si el proveedor obliga a dejar el archivo dentro del arbol del hosting, usar un archivo no versionado y protegido por permisos.
4. Mantener `DatabaseConfig.example.php` solo como plantilla sin secretos.

No se debe:

- Subir password real a Git.
- Guardar credenciales en `DatabaseConfig.example.php`.
- Registrar password en logs.
- Mostrar host, usuario o nombre de base al usuario final.
- Exponer stack traces en respuestas HTTP.

## Archivos reales que no deben entrar a Git

Estos archivos nunca deben versionarse si contienen credenciales o configuracion real:

- `backend/php-api/src/Config/DatabaseConfig.php`
- `backend/php-api/.env`
- `backend/php-api/.env.local`
- `backend/php-api/config.local.php`
- cualquier archivo con password real.

En una etapa futura puede ser necesario ajustar `.gitignore` para cubrir esos archivos, pero esta etapa no modifica `.gitignore`.

## Validacion antes de Git

Antes de commit/push futuro:

- Revisar `git status`.
- Revisar `git diff`.
- Buscar secretos con patrones como `DB_PASSWORD`, `password=`, `password =>`, `DB_USER`, `DB_NAME`.
- Confirmar que no exista `.env` versionado.
- Confirmar que no exista `DatabaseConfig.php` real versionado.
- Confirmar que `DatabaseConfig.example.php` no contiene datos reales.

## Manejo seguro de errores de conexion

Las respuestas HTTP no deben exponer:

- Host.
- Usuario.
- Password.
- Nombre real de base.
- DSN completo.
- Ruta absoluta del servidor.
- Stack trace.

Formato sugerido para el usuario/API:

```json
{
  "error": {
    "code": "DATABASE_NOT_CONFIGURED",
    "message": "Database backend not configured.",
    "details": {}
  }
}
```

Para errores internos de conexion en staging/production:

```json
{
  "error": {
    "code": "DATABASE_UNAVAILABLE",
    "message": "Database service unavailable.",
    "details": {}
  }
}
```

Los detalles tecnicos deben ir solo a logs del servidor, sin password.

## Diseno futuro de DatabaseConfig

`DatabaseConfig` deberia:

- Cargar valores desde variables de entorno o archivo local no versionado.
- Validar campos obligatorios.
- Validar `APP_ENV` como `local`, `staging` o `production`.
- Usar `utf8mb4` por defecto si no hay otro charset aprobado.
- No exponer secretos en excepciones.
- Entregar un objeto/array normalizado a `Connection`.
- Fallar con excepcion controlada si falta configuracion.

Campos minimos normalizados:

- `host`
- `port`
- `database`
- `username`
- `password`
- `charset`
- `appEnv`

## Diseno futuro de Connection

`Connection` deberia:

- Recibir configuracion validada.
- Crear PDO con DSN `mysql:host=...;port=...;dbname=...;charset=...`.
- Usar `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`.
- Usar `PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC`.
- Desactivar emulate prepares si corresponde: `PDO::ATTR_EMULATE_PREPARES => false`.
- No abrir conexion si falta configuracion obligatoria.
- Capturar errores de PDO y convertirlos a excepcion controlada.
- No loggear password.
- No devolver detalles sensibles al cliente.

## Prueba de staging antes de piloto

Secuencia recomendada:

1. Crear base MySQL staging en cPanel.
2. Crear usuario MySQL staging con permisos minimos.
3. Cargar `docs/database/schema-mysql.sql` en staging.
4. Configurar credenciales fuera del repositorio.
5. Ejecutar PHP lint.
6. Probar `GET /health`.
7. Probar un endpoint temporal de diagnostico seguro solo si se aprueba.
8. Probar conexion MySQL sin exponer datos.
9. Probar credenciales incorrectas y confirmar error controlado.
10. Confirmar que `GET /warehouses`, `GET /workers` y `GET /inventory` siguen fallando controladamente si la DB no esta configurada.
11. Confirmar que Git no contiene secretos.

## Checklist de pruebas futuras

- PHP lint.
- `GET /health`.
- Diagnostico seguro de DB si se aprueba.
- Conexion MySQL staging.
- Error con credenciales incorrectas.
- Repositories fallan controladamente sin DB.
- Busqueda de secretos en Git.
- Confirmacion de que no hay `.env` versionado.
- Confirmacion de que `localStorage` sigue default hasta activar backend.

## Criterios para no avanzar

No avanzar a conexion real si falta:

- Ambiente staging.
- Credenciales fuera de Git.
- Backups confirmados.
- Logs disponibles.
- SSL activo.
- Acceso a restauracion.
- Prueba de errores sin fuga de secretos.
