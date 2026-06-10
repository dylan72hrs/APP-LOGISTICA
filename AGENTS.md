# AGENTS.md - APP-LOGISTICA / EPP Tracker 3.0

## Contexto Actual

APP-LOGISTICA / EPP Tracker 3.0 es una app Next.js para control operativo de EPP en bodega.

El proyecto viene desde Firebase Studio y ya no debe crecer como ERP completo, sistema financiero, motor de IA, sistema multi-pais ni plataforma avanzada de roles. El foco actual del MVP es resolver el proceso real de entrega y consumo de EPP en bodega:

- Inventario EPP.
- Trabajadores internos e invitados.
- Registro de consumo.
- Descuento de stock.
- Vale de Entrega de EPP imprimible.
- Ficha/historial de consumo imprimible.
- Reportes operativos por bodega, trabajador, EPP/producto y periodo.
- Excel import/export.
- Futuro backend MySQL/cPanel.

Estado de clasificacion actual:

- DEMO: OK.
- PILOTO: con condiciones fuertes.
- PRODUCCION: no apta todavia.

## Estado Real del Proyecto

Etapas recientes cerradas y subidas a GitHub:

- ETAPA 1 - Estabilizacion tecnica base.
- ETAPA 2 - Separacion mock/data.
- ETAPA 3 - Persistencia local minima.
- ETAPA 3.5 - UX y branding operativo.
- ETAPA 3.6 - Hotfix IA/perfil/login.
- ETAPA 4 - Flujo critico de consumo.
- ETAPA 4.1a - xlsx dinamico.
- ETAPA 4.1b - dashboard charts dinamicos.
- ETAPA 4.2 - Reajuste de alcance MVP/TI.
- ETAPA 4.3 - Ocultar modulos fuera de alcance.
- ETAPA 4.4 - Consumo MVP sin proyecto obligatorio.
- ETAPA 4.5 - Vale y ficha imprimible MVP.
- ETAPA 4.6A - Hardening pre-piloto sin backend.
- ETAPA 4.6B - Reportes operativos MVP.

Tags recientes relevantes:

- v0.4.5-etapa4.5.
- v0.4.6a-etapa4.6a.
- v0.4.6b-etapa4.6b.

Estado tecnico actual:

- Typecheck OK.
- Build OK.
- Login demo con usuario `admin` y contrasena `admin`.
- Auth sigue siendo demo; no es seguridad real.
- La sesion sigue usando `localStorage`.
- Los datos siguen usando mock/localStorage.
- No hay backend.
- No hay MySQL.
- No hay API routes.
- No hay auditoria real.
- `/projects`, `/restock` y `/admin/users` estan ocultos o neutralizados, pero las rutas pueden existir.
- `/admin/users` esta neutralizado; no es CRUD real de usuarios.
- `/register` esta neutralizado.
- Proyecto ya no es obligatorio en consumos.
- `projectId` es opcional para compatibilidad historica.
- `requesterReference` existe como texto opcional para centro de costo / faena / area solicitante.
- Vale imprimible no muestra costos como foco.
- Reportes ya no se centran en proyectos.
- Excel tiene sanitizacion basica contra formula injection.
- `document.write` fue eliminado en impresion de vale/ficha.
- Headers basicos de seguridad fueron agregados.
- `localStorage` sigue siendo una limitacion fuerte.

## Alcance MVP Actual

Mantener el MVP enfocado en bodega:

- Dashboard operativo acotado.
- Inventario de bodega.
- Bodegas.
- Trabajadores internos e invitados.
- Registro de consumo de EPP.
- Validacion de bodega, trabajador, producto, cantidad y stock.
- Descuento de stock cuando el consumo es valido.
- Vale de Entrega de EPP imprimible.
- Ficha/historial de consumo imprimible.
- Reportes operativos por bodega, trabajador, EPP/producto y periodo.
- Importacion/exportacion Excel.
- Preparacion futura para hosting cPanel + MySQL.

## Fuera de Alcance Actual

No implementar ni reactivar como foco del MVP:

- Proyectos como modulo central.
- Dimension financiera.
- Aprobadores.
- Aprobaciones formales.
- Reposicion inteligente IA.
- Usuarios/roles complejos por pais/bodega.
- Picking.
- Escaneo.
- Solicitud movil.
- Multi-pais.
- Produccion real.
- Backend real.
- MySQL real.
- API routes reales.
- Auth real.
- Firestore/Firebase como backend productivo.

## Flujo Funcional Actual de Consumo

El consumo MVP debe mantener estas reglas:

- Bodega especifica obligatoria; no permitir operar con "Todas las bodegas".
- Trabajador valido obligatorio.
- Proyecto no obligatorio.
- `projectId` opcional para compatibilidad con consumos historicos.
- `requesterReference` opcional como centro de costo / faena / area solicitante.
- Al menos un producto obligatorio.
- Producto debe pertenecer a la bodega activa.
- Cantidad debe ser valida y mayor a cero.
- Stock suficiente obligatorio.
- Costo unitario puede existir internamente, pero no debe ser foco del vale ni reportes MVP.
- No debe haber descuento parcial.
- El registro de consumo y el descuento de stock ocurren solo si todo el consumo es valido.
- El vale/ficha debe funcionar aunque no exista `projectId`.

## Rutas

Rutas visibles en el MVP:

- `/dashboard`
- `/inventory`
- `/workers`
- `/warehouses`
- `/consumptions`
- `/consumption-sheet`
- `/reports`

Rutas existentes pero fuera del foco MVP o neutralizadas:

- `/projects` existe, pero no debe ser eje funcional actual.
- `/restock` existe, pero IA/reposicion inteligente esta fuera de alcance actual.
- `/admin/users` existe, pero esta neutralizada y no es CRUD real.
- `/register` existe, pero esta neutralizada.

Rutas principales que no deben romperse:

- `/dashboard`
- `/inventory`
- `/workers`
- `/projects`
- `/consumptions`
- `/consumption-sheet`
- `/reports`
- `/restock`
- `/warehouses`
- `/admin/users`

## Riesgos Pendientes Reales

- No hay backend real.
- No hay MySQL.
- No hay API routes.
- No hay auth real.
- No hay roles/permisos reales.
- Ocultar botones o rutas no es seguridad.
- Sesion en `localStorage`.
- Datos en mock/localStorage.
- Sin auditoria real de acciones.
- Sin logs reales.
- Sin backups reales.
- Sin control concurrente.
- Sin separacion productiva de usuarios/datos.
- Sin proteccion de datos empresariales.
- Excel es cliente-side.
- Reportes son cliente-side.
- cPanel/MySQL aun no estan disenados ni implementados.

## Roadmap Actualizado

### ETAPA 4.7A - Diseno tecnico MySQL / cPanel

Solo diagnostico y diseno. No implementar backend todavia.

- Revisar restricciones de hosting cPanel.
- Definir si el backend sera PHP, Node o alternativa soportada.
- Definir conexion MySQL.
- Definir estrategia de despliegue.
- Definir variables de entorno.
- Definir riesgos de seguridad.
- No tocar flujo funcional salvo documentacion o diagnostico aprobado.

### ETAPA 4.7B - Preparar arquitectura repository/API sin activar backend real

- Preparar contratos e interfaces.
- Separar llamadas de datos para futura API.
- Mantener mock/localStorage funcionando.
- No activar backend real.
- No romper demo.

### ETAPA 4.7C - Esquema MySQL

- Disenar tablas MVP.
- Bodegas.
- Trabajadores/invitados.
- Inventario.
- Consumos.
- Detalle de consumo.
- Usuarios basicos para auth futura.
- Auditoria minima.
- No migrar datos reales sin aprobacion.

### ETAPA 4.7D - API minima para inventario, trabajadores y consumos

- Endpoints minimos para inventario.
- Endpoints minimos para trabajadores.
- Endpoints minimos para consumos.
- Validaciones server-side equivalentes al flujo MVP.
- Sin roles avanzados.
- Sin aprobaciones.

### ETAPA 4.8 - Auth real y seguridad minima piloto

- Login real.
- Sesion real.
- Hash de contrasenas.
- Proteccion de rutas.
- Roles minimos.
- Auditoria basica.
- No venderlo como produccion.

### ETAPA 4.9 - Pruebas reales con usuarios

- Pruebas controladas con usuarios de bodega.
- Datos piloto acotados.
- Revision de errores.
- Ajustes de usabilidad.
- Checklist antes de piloto ampliado.

## Reglas de Trabajo Para Codex

Antes de modificar:

1. Crear plan corto.
2. Listar archivos a revisar.
3. No modificar mas de 8 archivos sin aprobacion.
4. Validar con typecheck/build cuando el cambio toque codigo o build.
5. Entregar resumen tecnico y riesgos pendientes.

Restricciones permanentes:

- No implementar MySQL sin aprobacion explicita.
- No implementar backend sin aprobacion explicita.
- No implementar API routes sin aprobacion explicita.
- No implementar auth real sin aprobacion explicita.
- No implementar roles reales sin aprobacion explicita.
- No reactivar `/projects` como foco sin aprobacion.
- No reactivar `/restock` IA sin aprobacion.
- No agregar dependencias salvo aprobacion explicita.
- No ejecutar `npm audit fix`.
- No usar `git add .`.
- No tocar `node_modules`.
- No tocar `.next`.
- No subir `.env`.
- No subir respaldos `bodega360`.
- No subir `.exe`.
- No romper rutas principales.
- No inventar seguridad real si aun no existe backend.
- Ser critico. No complacer. No hacer cambios grandes por iniciativa propia.

## Comandos Windows

Usar en PowerShell:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run dev
```

`npm.cmd install` solo cuando sea necesario y aprobado por el contexto.

## Flujo de Carpetas

- Codex trabaja en `APP-LOGISTICA-main`.
- GitHub se sube desde `APP-LOGISTICA- etapa 1`.
- Auditorias externas usan `APP-LOGISTICA-AUDIT`.

No mezclar carpetas ni asumir que una auditoria externa modifica automaticamente el workspace de Codex.

## Definition of Done General

Una tarea se considera lista solo si:

- Se respeto el alcance solicitado.
- Se listan archivos modificados.
- Se listan archivos creados.
- `npm.cmd run typecheck` pasa cuando aplica.
- `npm.cmd run build` pasa cuando aplica.
- No se rompen rutas principales.
- No se inventa seguridad real si aun no existe backend.
- Se documentan riesgos pendientes.
- Se confirma explicitamente si la etapa puede aprobarse.

Para cambios solo documentales:

- No es obligatorio ejecutar build.
- Confirmar que no se modifico codigo fuente.
- Confirmar que el documento queda alineado al estado actual del proyecto.
