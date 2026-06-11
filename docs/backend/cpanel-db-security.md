# Seguridad cPanel/MySQL - ETAPA 4.7F-DB-CONFIG-PLAN

## Estado

Este documento define reglas de seguridad para configurar MySQL/MariaDB con el backend PHP en cPanel en una etapa futura.

No crea credenciales, no crea `.env`, no conecta MySQL y no modifica codigo.

## Reglas de seguridad para credenciales

- Nunca subir passwords reales a Git.
- Nunca guardar passwords reales en `DatabaseConfig.example.php`.
- Nunca escribir passwords en releases, issues, capturas o logs.
- Usar un usuario MySQL distinto para staging y production.
- Usar password largo y unico para cada ambiente.
- Rotar password si se compartio por canal inseguro.
- Desactivar o borrar usuarios MySQL que ya no se usen.
- Dar permisos minimos al usuario de la aplicacion.

## Ubicacion recomendada de configuracion

Orden recomendado:

1. Variables de entorno del hosting si cPanel las soporta de forma segura.
2. Archivo de configuracion fuera del document root y fuera del repositorio.
3. Archivo no versionado dentro del hosting solo si el proveedor no permite otra opcion.

Ejemplos de archivos no versionados:

- `backend/php-api/src/Config/DatabaseConfig.php`
- `backend/php-api/.env`
- `backend/php-api/.env.local`
- `backend/php-api/config.local.php`

Si el archivo queda dentro del hosting, debe estar fuera de `public/` y protegido contra descarga directa.

## Separacion de archivos

Ejemplo versionado:

- `backend/php-api/src/Config/DatabaseConfig.example.php`

Uso:

- Documenta nombres de campos.
- Usa placeholders.
- No contiene password real.

Config real no versionado:

- Contiene host, puerto, nombre de DB, usuario y password reales.
- Existe solo en hosting/staging/local seguro.
- No se sube a Git.

Credenciales del panel:

- Se gestionan en cPanel/MySQL.
- No se pegan en documentacion del repo.
- No se comparten por canales inseguros.

## Permisos sugeridos en hosting

Valores orientativos, sujetos al proveedor:

- Archivos de configuracion real: `600` o el permiso mas restrictivo que permita PHP.
- Directorios de configuracion: `700` o equivalente si el hosting lo permite.
- Archivos publicos PHP: permisos normales del hosting, sin escritura publica.
- No dejar configuracion real dentro de `public/`.

Si cPanel compartido no permite permisos estrictos, documentar la limitacion y validar con el proveedor.

## Checklist antes de subir a cPanel

- Confirmar SSL activo.
- Confirmar base staging disponible.
- Confirmar usuario MySQL con permisos minimos.
- Confirmar ubicacion segura para config real.
- Confirmar que no existe `.env` versionado.
- Confirmar que `DatabaseConfig.php` real no esta en Git.
- Confirmar que `DatabaseConfig.example.php` no tiene secretos.
- Confirmar backups automaticos y restauracion.
- Confirmar logs PHP/Apache accesibles.
- Confirmar que `public/` es el unico directorio expuesto.

## Checklist despues de subir a cPanel

- Probar `GET /health`.
- Confirmar que errores no muestran stack trace.
- Confirmar que errores no muestran host, usuario, password ni DSN.
- Confirmar que el archivo de config real no es descargable por URL.
- Confirmar que el usuario MySQL puede conectarse solo a la base prevista.
- Confirmar logs sin passwords.
- Confirmar backup inicial de base.
- Confirmar que no se activo frontend/API real sin pruebas.

## Validacion de secretos en Git

Antes de subir:

- Revisar `git status`.
- Revisar `git diff`.
- Buscar `DB_PASSWORD`.
- Buscar `password=`.
- Buscar `password =>`.
- Buscar `.env`.
- Buscar `DatabaseConfig.php`.
- Buscar nombres reales de bases, usuarios y dominios si se consideran sensibles.

Archivos que nunca deben entrar a Git si contienen credenciales:

- `backend/php-api/src/Config/DatabaseConfig.php`
- `backend/php-api/.env`
- `backend/php-api/.env.local`
- `backend/php-api/config.local.php`
- cualquier archivo con password real.

## Manejo seguro de errores

No mostrar al usuario final:

- Host.
- Usuario.
- Password.
- DSN.
- Nombre real de base.
- Stack trace.
- Ruta absoluta del servidor.

Mensajes permitidos:

- `Database backend not configured.`
- `Database service unavailable.`
- `Internal server error.`

Los detalles tecnicos pueden registrarse solo en logs de servidor, sin password y con acceso restringido.

## Ambientes

Orden obligatorio recomendado:

1. Local/documental.
2. Staging en cPanel.
3. Piloto controlado.
4. Produccion solo despues de auth real, backups, logs y pruebas.

No usar datos reales de empresa en staging sin aprobacion y controles claros.

## Riesgos de cPanel compartido

- Permisos de archivo limitados.
- Logs incompletos o dificiles de revisar.
- Backups dependientes del proveedor.
- MySQL compartido con limites de conexiones.
- CPU/RAM restringidos.
- Acceso SSH limitado.
- Variables de entorno no estandarizadas.
- Restauracion lenta o con costo.

## Recomendaciones minimas de backup MySQL

- Backup automatico diario si el proveedor lo permite.
- Retencion minima acordada con el proveedor.
- Descarga periodica de respaldo antes de cambios grandes.
- Prueba documentada de restauracion.
- Backup manual antes de migraciones o cambios de esquema.
- Mantener respaldo separado del hosting cuando sea posible.

## Recomendaciones minimas de rotacion de password

- Rotar password antes de pasar de staging a piloto.
- Rotar password si se expuso por correo, chat o captura.
- Rotar password cuando salga un proveedor o colaborador.
- Actualizar config real en hosting sin commitear cambios.
- Probar conexion despues de cada rotacion.

## Criterio de bloqueo

No avanzar a backend con datos reales si:

- No hay SSL.
- No hay backups.
- No hay restauracion verificable.
- No hay logs.
- No hay ubicacion segura para credenciales.
- No hay usuario MySQL con permisos acotados.
- No hay plan de rotacion de password.
