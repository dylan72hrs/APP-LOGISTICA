# PHP API setup - APP-LOGISTICA / EPP Tracker 3.0

## Proposito

Esta carpeta contiene un esqueleto minimo de API PHP compatible con cPanel tradicional. Sirve como base tecnica para etapas futuras, no como backend funcional del MVP.

## Endpoint disponible

Solo existe un endpoint tecnico:

```http
GET /health
```

Respuesta esperada:

```json
{
  "status": "ok",
  "service": "app-logistica-api",
  "mode": "setup"
}
```

## No implementado

Esta API todavia no implementa:

- Conexion MySQL.
- Auth real.
- JWT.
- Sesiones reales.
- Cookies de sesion.
- Login real.
- Endpoints de inventario.
- Endpoints de trabajadores.
- Endpoints de consumos.
- Endpoints de reportes.
- Auditoria real.

Los endpoints `GET /warehouses`, `GET /workers` y `GET /inventory` existen como stubs read-only. Mientras no exista configuracion DB segura, responden error controlado de base no configurada.

## Archivos principales

- `public/index.php`: front controller minimo.
- `src/Http/Router.php`: router simple para `GET /health`.
- `src/Http/Response.php`: helper de respuestas JSON.
- `src/Controllers/HealthController.php`: respuesta de salud.
- `src/Database/Connection.php`: stub seguro sin conexion activa.
- `src/Config/DatabaseConfigLoader.php`: carga futura de configuracion segura desde entorno o archivo local no versionado.
- `src/Config/DatabaseConfig.example.php`: ejemplo sin credenciales reales.
- `src/Middleware/RequireAuth.php`: stub de auth no implementada.
- `.htaccess.example`: ejemplo de rewrite Apache/cPanel.

## Configuracion DB futura

La conexion MySQL/MariaDB futura debe configurarse sin credenciales versionadas. El backend queda preparado para leer, en una etapa posterior:

- variables de entorno del hosting/cPanel
- o archivo local no versionado si el proveedor lo requiere

Variables esperadas:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_CHARSET`
- `APP_ENV`

Archivos reales que no deben subirse a Git:

- `backend/php-api/.env`
- `backend/php-api/.env.local`
- `backend/php-api/config.local.php`
- `backend/php-api/src/Config/DatabaseConfig.php`
- `backend/php-api/src/Config/*.local.php`

`DatabaseConfig.example.php` es solo plantilla y no debe contener passwords reales.

Esta etapa no conecta MySQL, no ejecuta queries y no activa datos reales.

Antes de cualquier despliegue staging:

- revisar `git status`
- revisar `git diff`
- buscar `DB_PASSWORD`, `password=`, `password =>` y archivos `.env`
- confirmar que no hay credenciales reales en Git
- probar primero `GET /health`

## Ejecucion local opcional

Si existe PHP local, se puede probar manualmente con:

```powershell
php -S localhost:8080 -t backend/php-api/public
```

Luego abrir:

```text
http://localhost:8080/health
```

Esto es opcional y no reemplaza las validaciones del frontend.

## cPanel

El archivo `.htaccess.example` es solo referencia. No se crea `.htaccess` real para evitar romper entornos.

Antes de usarlo en hosting se debe revisar la ruta final del subdominio API y confirmar si Apache apunta al directorio `public`.

## Relacion con el contrato API

Los endpoints reales futuros deben seguir:

- `docs/api/api-contract.md`
- `docs/api/dto-examples.md`
- `docs/database/schema-mysql.sql`

## Advertencia

No guardar credenciales en este repositorio. No crear `.env` dentro de la carpeta hasta que exista una decision de despliegue segura y aprobada.
