# Fase 9 — estado en curso conservado en GitHub

Registro de la publicación solicitada el 10 de noviembre de 2026. Esta fase no se da por cerrada. El usuario ha pedido subir todo el proyecto reconstruido y continuar la operación: se conserva la implementación disponible con sus límites explícitos, además del cierre ya verificado de fase 8.

## Implementación disponible

- `/panel`: resumen diario del profesional o global para gestión, con fechas de negocio y reutilización de las tarjetas de agenda.
- `/kpis`: indicadores diarios, semanales y mensuales y distribución por servicio/profesional, consultados desde Firestore emulado.
- `/export`: vista previa de ocho filas y descarga CSV de todo el rango autorizado. Conserva las ocho columnas originales, codificación UTF-8 con BOM, finales CRLF, escape de comillas y protección de texto que podría interpretarse como fórmula.
- `/debug`: página informativa original, protegida para administración; sin controles destructivos añadidos.
- `runReminders` y `bookingRemindersJob`: consulta de ventanas configuradas, cola local idempotente y control transaccional de duplicados. El handler programado se puede invocar manualmente en las pruebas; no se instala ningún job productivo.
- `seedDemoData` y `resetDemoData`: administrador verificado, emuladores obligatorios, simulación por defecto y confirmación explícita del proyecto demo para escribir. La carga sin reset conserva datos existentes. El borrado afecta únicamente a las seis colecciones demo identificadas y las subcolecciones de profesionales; conserva Auth y usuarios.

Las notificaciones quedan `queued`, con `sentAt: null`: no existe transporte de correo ni se afirma entrega de mensajes. La simulación no crea marcas ni documentos. Las herramientas demo requieren una sesión aislada sin otros escritores; el reset completo no es una transacción única y no debe usarse para conservar una exploración anterior.

## Decisiones y correspondencias provisionales

| Original | Implementación actual |
|---|---|
| panel.client.ts | modulos/estadisticas/resumen-diario.ts y tarjetas profesionales ya existentes |
| kpis.client.ts | modulos/estadisticas/indicadores.ts y calculos.ts |
| export.client.ts / lib/csv.ts | modulos/estadisticas/listado-citas.ts / exportaciones/csv.ts |
| processReminders / queueReminderForBooking | functions/src/recordatorios.js: procesarRecordatorios / prepararRecordatorioCita |
| defaultWeeklySchedule / clearCollection / clearBarbersWithSubcollections | functions/src/demostracion.js: crearHorarioDemo / vaciarColeccionDemo / borrarProfesionalesDemo |
| home-role.client.ts / destino previsto inicio-publico.ts | Comportamiento fusionado en barra-navegacion.ts: actualiza la tarjeta de inicio según la sesión; no se crea un módulo sin uso. |

Se conservan nombres externos de funciones, colecciones, estados y campos Firestore. Los cuatro exports originales restantes quedan declarados, además de los anteriores: declararlos no equivale a un despliegue ni certifica que se haya cerrado toda la funcionalidad.

Los KPIs excluyen las filas históricas `rescheduled` para no contar dos veces una cita movida. El tiempo reservado excluye también canceladas; se conservan las incidencias de cancelación/ausencia. Esta corrección de coherencia respecto a las fórmulas originales debe revisarse y documentarse en el informe final de fase 9. La clasificación por profesional conserva la agrupación original por nombre visible, que puede unir nombres iguales.

## Verificación y pendientes

Verificación de publicación ejecutada: `npm test`, salida 0. Astro/TypeScript sobre 104 archivos sin errores, warnings ni hints, sintaxis backend correcta, 43 unitarias (28 frontend y 15 backend), 67 integraciones y 212 pruebas de navegador correctas, sin omisiones; build de 27 páginas. Incluye las diez integraciones nuevas de recordatorios/demo. Las 68 pruebas visuales corresponden a los módulos anteriores; no se atribuyen a las cuatro vistas nuevas. La evidencia y sus límites se registran en [publicación GitHub](fase-github-publicacion.md).

Queda completar la fase 9: pruebas de navegador específicas de los nuevos flujos y descargas, errores y cambios de identidad durante las consultas, comparación de las cuatro vistas con el original y revisión global de funcionalidades e inventario. Las pruebas visuales de fases anteriores no acreditan estas nuevas pantallas. También falta el informe de cierre de fase 9 y su inventario definitivo; este registro provisional no lo sustituye.

Después del cierre real de fase 9 corresponde la pausa obligatoria de tres horas, todavía no iniciada ni certificada. Fases 10–12 y ZIP final siguen pendientes. Los avisos heredados de dependencias, incluidos críticos en app, siguen abiertos para la auditoría de fase 11; no se considera una entrega lista para producción.

Para reanudar: leer este documento y estado-pausa.md, comprobar Git, mantener emuladores desechables y completar esos pendientes antes de cerrar fase 9. El proyecto original y la planificación histórica se conservan sin modificaciones.
