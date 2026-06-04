# AGENTS.md — APP-LOGISTICA / EPP Tracker 3.0

## Contexto

APP-LOGISTICA / EPP Tracker 3.0 es una app Next.js para control de EPP. Gestiona bodegas, trabajadores, proyectos, inventario, consumos, vales, ficha de consumo, reportes y reposición con IA.

El proyecto viene desde Firebase Studio y actualmente está en estado de prototipo avanzado. Tiene módulos funcionales, pero no debe considerarse productivo todavía.

Problemas actuales conocidos:
- El proyecto tiene errores TypeScript/build pendientes.
- Existen datos mock/en memoria.
- La app pierde datos al refrescar.
- Firebase no está implementado realmente.
- Auth está simulada con localStorage.
- Roles son visuales, no seguridad real.
- Logo externo roto.
- Reportes inconsistentes.
- Falta vale formal.
- Falta stock reservado.
- Falta separación clara entre mock data y datos reales.

## Regla principal

No agregar funciones nuevas antes de estabilizar la base técnica.

La prioridad actual es ETAPA 1 — Estabilización técnica base.

## ETAPAS DEL PROYECTO

### ETAPA 1 — Estabilización técnica base
Corregir lo que impide trabajar bien:
- TypeScript.
- Build.
- Dashboard roto.
- Calendar.
- selectedWarehouseId.
- reportData.
- Traducciones.
- Errores visibles de compilación.

No agregar funciones nuevas todavía.

### ETAPA 2 — Separación de datos mock y datos reales
- Separar mock data.
- Marcar modo demo.
- Preparar data provider.
- Preparar repository layer.
- Evitar que datos de prueba parezcan reales.

### ETAPA 3 — Persistencia mínima piloto
- Trabajadores.
- Proyectos.
- Inventario.
- Bodegas.
- Vales.
- Consumos.
- Movimientos de stock.

### ETAPA 4 — Flujo crítico de consumo
- Bodega obligatoria.
- Trabajador obligatorio.
- Proyecto obligatorio.
- Producto obligatorio.
- Cantidad validada.
- Stock disponible validado.
- Costo visible antes de aprobar.

### ETAPA 5 — Vale de consumo y stock reservado
- Correlativo único de vale.
- Estado del vale.
- Vale pendiente.
- Vale aprobado.
- Vale cancelado.
- Vale registrado.
- Stock reservado.
- Stock consumido definitivo.
- Devolución de stock si se cancela.

### ETAPA 6 — Trabajadores, invitados y RRHH
- Trabajador interno.
- Trabajador externo.
- Invitado.
- Validación RUT.
- Plantilla RRHH.
- Estado activo/inactivo.
- Cargo.
- Sección.
- Centro de costo base referencial.

El centro de costo real lo debe mandar el proyecto, no el trabajador.

### ETAPA 7 — Proyectos y dimensión financiera
- ID de proyecto.
- Nombre de proyecto.
- Dimensión financiera.
- Administrador.
- Aprobador principal.
- Aprobador interino.
- Estado del proyecto.
- Plantilla de carga.

La dimensión financiera debe guardarse como texto, no como número.

### ETAPA 8 — Reportes y ficha de consumo
- Reporte por proyecto.
- Reporte por bodega.
- Reporte por trabajador.
- Exportación Excel.
- Ficha de consumo imprimible.
- Formato para respaldo/faena.
- Rango de fechas.
- Datos persistentes.

### ETAPA 9 — Plantillas Excel e importaciones
- Plantilla trabajadores.
- Plantilla proyectos.
- Plantilla inventario.
- Plantilla stock mínimo/máximo.
- Validación por fila.
- Deduplicación.
- Actualización de existentes.
- Resumen de carga.
- Errores por fila.

### ETAPA 10 — Usuarios, roles y permisos reales
- Auth real.
- Admin global.
- Admin país.
- Operador bodega.
- Usuario reportes.
- Proveedor solo lectura.
- Permisos por país.
- Permisos por bodega.
- Protección de rutas.
- Seguridad en base de datos.

Ocultar botones no es seguridad.

### ETAPA 11 — Dashboard operativo
- Consumo semanal.
- Consumo mensual.
- Consumo anual.
- Consumo por proyecto.
- Consumo por bodega.
- Tendencias.
- Stock bajo.
- Vales pendientes.
- Alertas.

### ETAPA 12 — Reposición inteligente / IA
- Consumo histórico.
- Stock actual.
- Stock reservado.
- Lead time.
- Días de cobertura.
- Tendencia de consumo.
- Sugerencia de reposición.
- Explicación IA.

La IA debe sugerir, no decidir ni comprar automáticamente.

### ETAPA 13 — UI crítica y branding
- Logo local.
- Sidebar profesional.
- Colores blanco/azul.
- Selector de bodegas coherente.
- Responsive.
- Mejor navegación.

### ETAPA 14 — Ambiente piloto / staging
- URL estable.
- Hosting con factura.
- Base de datos persistente.
- Usuarios de prueba.
- Logs.
- Backups.
- Pruebas con usuarios reales.
- Documentación de despliegue.

No llamarlo producción todavía.

### ETAPA 15 — Cierre mensual y proveedor
- Cierre mensual.
- Periodo de consumo.
- Reporte facturable.
- Proveedor solo lectura.
- Exportación Excel/PDF.
- Bloqueo o marca de periodo cerrado.
- Historial de cierre.

### ETAPA 16 — Aprobaciones internas
- Aprobador real.
- Estado aprobado/rechazado.
- Historial de aprobación.
- Microsoft Teams Approvals.
- Power Automate.
- Notificaciones internas.

No usar WhatsApp como aprobación formal principal.

### ETAPA 17 — Lector de código / escaneo básico
- Input de escaneo.
- Lector USB tipo teclado.
- Búsqueda por código interno.
- Agregar producto al vale.
- Validar código inexistente.
- Mantener foco automático.

### ETAPA 18 — Versión futura 4.0: picking y solicitud móvil
- Solicitud desde celular.
- Lista de picking.
- Zona física de preparación.
- Pedido listo.
- Notificación al usuario.
- Retiro.
- Firma/aprobación.
- Escaneo móvil.

Esto es futuro, no ahora.

## Restricciones actuales

En ETAPA 1 NO hacer:
- No implementar Firebase.
- No implementar Firestore.
- No implementar Auth real.
- No cambiar roles.
- No rediseñar la app.
- No agregar funciones nuevas.
- No agregar dependencias salvo que sea estrictamente necesario.
- No borrar mocks.
- No tocar lógica de negocio salvo corrección técnica necesaria.
- No ocultar errores con ignoreBuildErrors.
- No tocar node_modules.
- No tocar .next.
- No subir .env.

## Comandos

Usar en Windows PowerShell:

npm.cmd install
npm.cmd run dev
npm.cmd run typecheck
npm.cmd run build

## Rutas principales que no deben romperse

- /dashboard
- /inventory
- /workers
- /projects
- /consumptions
- /consumption-sheet
- /reports
- /restock
- /warehouses
- /admin/users

## Definition of Done — ETAPA 1

La ETAPA 1 se considera terminada solo si:
- npm.cmd run typecheck pasa.
- npm.cmd run build pasa o se documenta exactamente el bloqueo.
- No se agregaron funciones nuevas.
- No se rediseñó la app.
- No se rompieron rutas principales.
- Se entrega resumen de archivos modificados.
- Se entrega lista de riesgos pendientes para ETAPA 2.

## Forma de trabajo para Codex

Antes de modificar:
1. Crear plan corto.
2. Listar archivos a revisar.
3. No modificar más de 5 archivos sin aprobación.
4. Validar con typecheck/build.
5. Entregar resumen técnico.

Ser crítico. No complacer. No hacer cambios grandes por iniciativa propia.
