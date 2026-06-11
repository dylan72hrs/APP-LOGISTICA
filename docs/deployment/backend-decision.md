# Decision backend cPanel - APP-LOGISTICA / EPP Tracker 3.0

## Estado

Documento de decision para una etapa futura. No implementa backend, no crea API routes y no conecta MySQL.

## Recomendacion corta

Para cPanel tradicional:

- Recomendacion principal: API PHP/Laravel + MySQL.
- Mantener frontend Next.js desacoplado y preferentemente estatico.

Si el hosting confirma Node.js estable, Passenger/Application Manager, SSH, variables de entorno y logs:

- Node/Express + MySQL puede evaluarse.

Next.js server completo en cPanel:

- Solo si el proveedor confirma soporte claro y entrega una ruta de despliegue probada.

## Criterios de decision

- Soporte real del proveedor.
- Facilidad de despliegue.
- Soporte MySQL/MariaDB.
- Seguridad.
- Logs.
- Backups y restauracion.
- Costo.
- Mantenibilidad.
- Riesgo operativo.

## A. API PHP/Laravel + MySQL en cPanel

### Ventajas

- Alta compatibilidad con cPanel tradicional.
- MySQL/MariaDB suele estar integrado en el hosting.
- phpMyAdmin y backups suelen estar disponibles.
- Laravel ofrece estructura conocida para auth, middleware, validacion y migrations.
- Mejor encaje si el proveedor no garantiza procesos Node persistentes.

### Desventajas

- Implica mantener backend en stack distinto al frontend.
- Requiere definir DTOs y mapeo claro entre frontend TypeScript y backend PHP.
- Puede necesitar ajuste de hosting si Composer, colas o cron no estan disponibles.

### Riesgo operativo

Bajo a medio si el proveedor soporta PHP moderno, Composer, MySQL y backups.

### Cuando elegirlo

- cPanel tradicional.
- Node.js no garantizado o limitado.
- Equipo/proveedor conoce PHP/Laravel.
- Se prioriza estabilidad de hosting sobre homogeneidad del stack.

## B. API Node/Express + MySQL en cPanel

### Ventajas

- Stack JavaScript/TypeScript mas cercano al frontend.
- Contratos y validaciones pueden compartirse conceptualmente con la app.
- Buen encaje si el proveedor tiene Node estable y logs accesibles.

### Desventajas

- En cPanel depende mucho de Passenger/Application Manager.
- Riesgo si el proceso Node se duerme, cae o no se reinicia claramente.
- Variables de entorno, logs y despliegue pueden variar mucho por proveedor.
- Puede ser menos soportado que PHP en hosting compartido.

### Riesgo operativo

Medio a alto si el proveedor no demuestra soporte Node real.

### Cuando elegirlo

- Hosting confirma Node.js estable.
- Existe SSH.
- Existen variables de entorno.
- Hay logs claros.
- Hay politica de reinicio/procesos documentada.
- El proveedor permite subdominio API.

## C. Next.js server completo en cPanel

### Ventajas

- Un solo framework para frontend y backend.
- Podria permitir routes/server actions en el mismo proyecto si el hosting lo soporta.
- Menos separacion conceptual entre app y API.

### Desventajas

- Mayor riesgo en cPanel compartido.
- Requiere confirmar compatibilidad real con Next.js server.
- Build, runtime, rutas, cache y procesos pueden ser dificiles de operar en cPanel.
- Un problema del server puede afectar frontend y API juntos.

### Riesgo operativo

Alto salvo confirmacion fuerte del proveedor.

### Cuando elegirlo

- Solo si el proveedor confirma soporte Next.js server claramente.
- Solo con prueba de despliegue staging.
- Solo si hay logs, reinicio y variables de entorno confiables.

## D. Frontend estatico + API externa en Railway/Render/Vercel + MySQL externo

### Ventajas

- Mejor experiencia para apps Node modernas.
- Despliegue y logs suelen ser mejores.
- Escala tecnica mas limpia para backend/API.
- Reduce dependencia de cPanel para procesos Node.

### Desventajas

- Se aleja del requisito comercial cPanel.
- Puede sumar costos y cuentas externas.
- Requiere gestionar base de datos externa.
- Puede complicar soporte si el cliente exige un solo proveedor.

### Riesgo operativo

Bajo a medio tecnicamente, pero medio comercialmente si cPanel es requisito.

### Cuando elegirlo

- Si cPanel no cumple minimos tecnicos.
- Si el cliente acepta proveedor externo para API/base.
- Si se prioriza operacion moderna sobre hosting tradicional.

## Decision recomendada

Primera opcion para el MVP piloto con cPanel:

1. Frontend Next.js estatico.
2. API PHP/Laravel + MySQL en cPanel.
3. Subdominio API si el proveedor lo permite.

Opcion condicionada:

1. Frontend Next.js estatico.
2. API Node/Express + MySQL.
3. Solo si el proveedor confirma Node.js estable, Passenger/Application Manager, SSH, variables de entorno y logs.

Opcion a evitar inicialmente:

- Next.js server completo en cPanel sin prueba previa y soporte explicito.

## Preguntas bloqueantes antes de implementar

- El proveedor confirma Node.js estable?
- Existe SSH?
- Existen variables de entorno?
- Donde se revisan logs de aplicacion?
- Hay backups automaticos y restauracion puntual?
- Se puede usar subdominio API?
- MySQL/MariaDB soporta el esquema previsto?
- Se puede crear una base staging?

## Implicancia para etapas futuras

Antes de ETAPA 4.7D real, se debe decidir:

- Backend PHP/Laravel.
- Backend Node/Express.
- API externa fuera de cPanel.

Sin esa decision, avanzar directo a implementacion aumenta el riesgo de retrabajo.
