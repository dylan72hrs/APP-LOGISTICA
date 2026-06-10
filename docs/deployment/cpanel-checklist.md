# Checklist cPanel - APP-LOGISTICA / EPP Tracker 3.0

## Objetivo

Validar si el proveedor cPanel puede soportar una versión piloto de APP-LOGISTICA / EPP Tracker 3.0 con frontend, API y MySQL/MariaDB.

Esta lista no implementa despliegue. Sirve para evaluación técnica y comercial antes de avanzar a backend real.

## Preguntas sobre Node.js

- ¿El plan contratado soporta Node.js?
- ¿Qué versión de Node.js está disponible?
- ¿Permite seleccionar versión de Node.js por aplicación?
- ¿Usa Passenger/Application Manager?
- ¿El proceso Node queda persistente o se reinicia bajo demanda?
- ¿Cuál es la política ante procesos Node colgados?
- ¿Existe límite de memoria para procesos Node?
- ¿Existe límite de CPU para procesos Node?
- ¿Se puede reiniciar la app desde cPanel?
- ¿Se puede reiniciar la app por SSH?

## SSH y despliegue

- ¿El plan incluye acceso SSH?
- ¿Permite ejecutar comandos `npm`?
- ¿Permite configurar variables de entorno?
- ¿Permite separar ambiente staging y piloto?
- ¿Permite subdominios para frontend y API?
- ¿Permite desplegar una app estática Next.js?
- ¿Permite desplegar una API Node/Express?
- ¿Permite desplegar una API PHP/Laravel?

## MySQL/MariaDB

- ¿Incluye MySQL o MariaDB?
- ¿Qué versión usa?
- ¿Incluye phpMyAdmin?
- ¿Permite crear múltiples bases de datos?
- ¿Permite crear usuarios de base con permisos acotados?
- ¿Permite conexión local desde la app a MySQL?
- ¿Permite conexión remota a MySQL si fuera necesaria?
- ¿Cuál es el límite de tamaño de base de datos?
- ¿Cuál es el límite de conexiones concurrentes?
- ¿Se pueden ejecutar scripts SQL manualmente?

## Backups y restauración

- ¿Hay backups automáticos?
- ¿Con qué frecuencia se ejecutan?
- ¿Cuánta retención tienen?
- ¿El cliente puede descargar backups?
- ¿El proveedor puede hacer restauración puntual?
- ¿La restauración puede ser solo de base de datos?
- ¿La restauración puede ser solo de archivos?
- ¿Cuánto tiempo toma restaurar?

## SSL y dominios

- ¿Incluye SSL?
- ¿SSL se renueva automáticamente?
- ¿Permite HTTPS obligatorio?
- ¿Permite subdominio para API?
- ¿Permite redirección HTTP a HTTPS?
- ¿Permite configurar cabeceras de seguridad?

## Logs y monitoreo

- ¿Dónde se revisan logs de Apache/Nginx?
- ¿Dónde se revisan logs de PHP?
- ¿Dónde se revisan logs de Node/Passenger?
- ¿Hay logs de errores accesibles desde cPanel?
- ¿Hay logs por dominio o subdominio?
- ¿Hay métricas de CPU/RAM/procesos?
- ¿Hay alertas por uso de recursos?

## Cron jobs y tareas programadas

- ¿Permite cron jobs?
- ¿Con qué frecuencia mínima?
- ¿Puede ejecutar scripts PHP?
- ¿Puede ejecutar scripts Node?
- ¿Hay límites de tiempo para cron jobs?
- ¿Se registran logs de ejecución?

## Límites operativos

- ¿Límite CPU?
- ¿Límite RAM?
- ¿Límite de procesos?
- ¿Límite de I/O?
- ¿Límite de almacenamiento?
- ¿Límite de ancho de banda?
- ¿Límite de correos si se requiere notificación futura?

## Recomendación técnica

Si cPanel no garantiza Node.js estable:

- Usar frontend Next.js estático.
- Usar API PHP/Laravel + MySQL.
- Mantener la API en subdominio separado si es posible.

Si cPanel sí soporta Node estable:

- Evaluar Node/Express + MySQL.
- Evaluar Next.js server con cuidado.
- Confirmar Passenger/Application Manager, SSH, variables de entorno y logs antes de decidir.

## Criterio mínimo antes de piloto

No avanzar a piloto con datos reales si el proveedor no confirma:

- SSL activo.
- Backups automáticos.
- Restauración verificable.
- Logs accesibles.
- MySQL/MariaDB estable.
- Acceso controlado a variables de entorno.
- Estrategia clara para API.
- Capacidad de staging.
