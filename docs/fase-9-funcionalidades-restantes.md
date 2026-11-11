# Fase 9 — revisión de funcionalidades restantes

**Cierre técnico del 11 de noviembre de 2026: COMPLETA CON LIMITACIONES.** Implementación y pruebas específicas contrastadas; el catálogo global de [40 grupos](matriz-requisitos.md) y los [registros de símbolos](trazabilidad/simbolos-actuales.md) ya tienen decisiones actuales. El [registro anterior](fase-9-estado-en-curso.md) conserva sus fechas y cifras; no se retrofecha un cierre histórico ni se inventan horas. Evidencias en [revisión total](revision-total-2026-11-10.md).

| Original / contrato | Implementación revisada | Comprobación |
| --- | --- | --- |
| panel.client.ts | estadisticas/resumen-diario.ts | Día de negocio, worker propio y gestión global; cantidades, minutos y lista. |
| kpis.client.ts | estadisticas/indicadores.ts y calculos.ts | Día/semana/mes, estados y agrupaciones; vacíos y duraciones inválidas. |
| export.client.ts y lib/csv.ts | estadisticas/listado-citas.ts y exportaciones/csv.ts | Rango, ocho filas de vista previa, descarga completa, UTF-8/BOM, escape y fórmulas. |
| debug.astro | pages/debug.astro | Contenido informativo original y acceso solo admin; sin herramientas destructivas en pantalla. |
| runReminders / bookingRemindersJob | functions/src/recordatorios.js | Ventanas, simulación sin marcas, cola idempotente y handler programado invocado localmente. |
| resetDemoData / seedDemoData | functions/src/demostracion.js | Admin verificado, proyecto local, confirmación explícita, conservación sin reset y eliminación limitada al demo. |
| home-role.client.ts | navegacion/barra-navegacion.ts | Tarjeta de inicio actualizada por sesión; fusión documentada sin módulo vacío. |

Los KPIs excluyen las filas históricas rescheduled y el tiempo de citas canceladas para no duplicar la carga. Las incidencias siguen contando cancelaciones y ausencias. Se conserva la agrupación por nombre visible de profesional, con su límite ante nombres iguales.

Recordatorios se guardan como queued con sentAt null; no se afirma que un correo haya sido enviado. La declaración del trigger no instala un cron. Las herramientas demo no modifican Auth ni users y requieren una sesión de pruebas aislada sin escritores concurrentes. No se añade una bandeja de avisos, mantenimiento visual o sistema de pagos que el original no contenía.

Existen pruebas unitarias de cálculos/CSV, diez integraciones de recordatorios/demo, recorridos de navegador y ocho estados visuales de estas cuatro vistas en tres formatos. Sus resultados deben leerse en el informe de la ejecución correspondiente. La prueba de una pantalla no certifica cada combinación de datos ni el inventario semántico completo.

La documentación global queda consolidada con niveles de evidencia y límites expresos. La reanudación del 11 de noviembre se produce después del intervalo registrado entre el fin de la regresión anterior y la petición del usuario; [estado de pausa](estado-pausa.md) distingue ese intervalo de una sesión Start-Sleep mantenida y no altera la cronología de los trabajos anteriores. No se imputan horas efectivas al descanso.
