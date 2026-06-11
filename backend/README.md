# Backend - APP-LOGISTICA / EPP Tracker 3.0

## Estado

Esta carpeta prepara una base tecnica aislada para un backend futuro compatible con cPanel. No esta conectada al frontend Next.js y no reemplaza el modo demo con `localStorage`.

En esta etapa:

- No hay conexion real a MySQL/MariaDB.
- No hay credenciales reales.
- No hay archivo `.env`.
- No hay Composer.
- No hay Laravel.
- No hay `vendor`.
- No hay autenticacion real.
- No hay endpoints de negocio.
- No se activa `apiRepository`.

## Estructura

```text
backend/
  php-api/
    public/
      index.php
    src/
      Config/
      Controllers/
      Database/
      Http/
      Middleware/
    .htaccess.example
    README.md
```

## Relacion con el frontend

El frontend sigue usando `localStorageRepository` por defecto. La arquitectura preparada en etapas anteriores permite que una etapa futura active `apiRepository`, pero esta carpeta no cambia ese comportamiento.

El contrato funcional de endpoints futuros esta documentado en:

- `docs/api/api-contract.md`
- `docs/api/dto-examples.md`

## Despliegue futuro en cPanel

Para una prueba tecnica futura, el contenido de `backend/php-api` podria publicarse en un subdominio o carpeta API del hosting, por ejemplo `api.dominio.cl`.

Antes de desplegar se debe confirmar con el proveedor:

- Version PHP disponible.
- Soporte para reescritura Apache.
- Ubicacion de logs PHP/Apache.
- SSL activo.
- Variables de entorno o mecanismo seguro equivalente.
- MySQL/MariaDB disponible.
- Backups y restauracion.

## Seguridad

No subir credenciales reales a este repositorio.

No crear `.env` con datos reales dentro del repositorio.

No usar esta carpeta como backend productivo hasta implementar:

- Conexion MySQL segura.
- Auth real.
- Sesiones o cookies seguras.
- Validaciones server-side.
- Auditoria real.
- Manejo transaccional de stock.

## Proxima etapa

ETAPA 4.7E deberia implementar endpoints reales minimos o adaptar `apiRepository` solo cuando el backend y el ambiente esten listos.
