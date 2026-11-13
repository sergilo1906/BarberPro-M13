# Matriz de las 40 funcionalidades planificadas

La planificación original contiene estos 40 grupos. Se contrastan con código y pruebas reales, sin convertir el número de grupos en un porcentaje de líneas ejecutadas. Los resultados están en [pruebas finales](pruebas-finales.md). Las limitaciones de emuladores, correo y navegadores forman parte de la entrega.

| # | Funcionalidad original | Implementación / contrato actual | Evidencia y límite |
| ---: | --- | --- | --- |
| 1 | Registro | cuentas/crear-cuenta y datos/sesion/personas | Autenticación E2E e integración; alta parcial, repetición y red. |
| 2 | Login y destino por rol | iniciar-sesion y comun/permisos | Cuatro roles, persistencia y correo pendiente en autenticacion.test.ts. |
| 3 | Logout | sesion/cerrarSesion y navegación | Limpieza y errores de salida en autenticación. |
| 4 | Verificación y reenvío | verificar-correo, editar-perfil y sesión | Código válido/inválido y reenvío con Auth emulado; sin correo real. |
| 5 | Perfil | editar-perfil y personas | Campos propios, alta recuperable, rol inmutable y denegación de escritura. |
| 6 | Protección de rutas | PERMISOS_RUTA, guards centrales, reglas/backend | Dieciocho políticas privadas y pruebas positivas/negativas de roles. |
| 7 | Inicio y navegación | BarraNavegacion y barra-navegacion | Rutas públicas, menús y destino por sesión; comparación visual. |
| 8 | Catálogo visible | datos/catalogo/obtenerServicios | Solo activos válidos; validación backend y pruebas de reservas. |
| 9 | Profesional o cualquiera | personas y disponibilidad | Oculto, preferencia, orden estable y selección final. |
| 10 | Disponibilidad | fechas, horarios y disponibilidad backend | Calendario/DST, duración, descansos, bloques, ocupación y carreras. |
| 11 | Crear reserva | createBooking y persistencia-reservas | Transacción, solicitud idempotente, locks y confirmación en cola. |
| 12 | Experiencia de reserva | reservar-cita, huecos y avisos | Carga, vacío, confirmación, doble clic, cambios rápidos y errores. |
| 13 | Mis citas y filtros | mis-citas y estados-cita | Propiedad, orden, historia, estados, filtros y margen. |
| 14 | Cancelar | cancelBooking y controlador cliente | Margen, terminales, permisos y liberación de locks propios. |
| 15 | Reprogramar | rescheduleBooking y cambiar-cita | Historia/sucesora atómica, conflictos y respuesta perdida recuperable. |
| 16 | ICS | exportaciones/calendario | UTC, escapes, UTF-8 y líneas plegadas; sin importación manual universal. |
| 17 | Agenda diaria | agenda-diaria y tarjetas-citas | Worker propio y selección autorizada de gestión; filtros y errores. |
| 18 | Transiciones | tabla TRANSICIONES y cambiarEstadoReserva | Pending/confirmed/terminales, confirmación y negativas de servidor. |
| 19 | Semana y publicación | editar-horario y saveWeeklySchedule | Revisión, tramos, publicación y conflicto con citas existentes. |
| 20 | Copiar semana | cargarHorarioSemanal(copiar) | Copia sin escritura hasta guardar; conserva descansos. |
| 21 | Ficha profesional propia | guardarHorarioAtomico y sincronizarFichaProfesional | Creación autorizada; ficha oculta/nombre se conservan. |
| 22 | Bloqueos y pausas | createScheduleBlock/deleteScheduleBlock | Tipo, propietario, duplicación, eliminación y carreras con reservas. |
| 23 | Vacaciones | normalizarBloqueoEntrada y fechasBloqueo | Fechas inclusivas, reales, orden y máximo de días. |
| 24 | Panel profesional | panel-profesional y consultas de periodo | Día/semana/mes y siguientes citas; sin duplicar historial reprogramado. |
| 25 | Usuarios y roles | usuarios, tarjeta-usuario y adminSetClaims | Búsqueda exacta; solo admin; identidad/versiones vigentes y actor revocado. |
| 26 | Equipo | equipo y saveTeamProfile | Nombre/visibilidad, Enter/blur, respuesta perdida y cambio de identidad. |
| 27 | Servicios | servicios y saveService | Alta/edición, precio/duración, revisión y recuperación; RT-02 comprueba el botón con casilla sin guardar. |
| 28 | Resumen semanal | resumen-horarios | Estados de ficha/semana y navegación con UID autorizado. |
| 29 | Reglas de agenda | reglas-agenda y saveAgendaSettings | Zona IANA, margen y avisos; rechazo de cambio de zona que perjudique citas. |
| 30 | Resumen diario | estadisticas/resumen-diario | Datos propios/globales según rol; cantidades y minutos conocidos. |
| 31 | Indicadores | indicadores y calculos | Periodos, cancelación/reprogramación, vacíos y datos inválidos; agrupación por nombre conservada. |
| 32 | Listado y CSV | listado-citas y csv | Rango, preview de ocho, descarga completa, BOM/CRLF, comillas/fórmulas, errores y limpieza. |
| 33 | Recordatorios manuales | runReminders y procesarRecordatorios | Ventanas configuradas, dryRun y duplicados; job programado retirado deliberadamente. |
| 34 | Notificaciones almacenadas | notifications de confirmación/recordatorio | Cola transaccional y queued; no se inventa bandeja visual ni envío real. |
| 35 | Herramientas demo | resetDemoData y seedDemoData | Admin, confirmación explícita, simulación por defecto y conservación; entorno sin escritores concurrentes. |
| 36 | Diagnóstico | Retirado | La página informativa de depuración se elimina deliberadamente; la aplicación conserva el panel de administración. |
| 37 | Scripts de roles | asignar-roles y normalizar-roles | UID explícito, simulación y emuladores; no usan credenciales productivas. |
| 38 | Ayuda/legal/perfiles/404 | Páginas conservadas y controladores de perfil | Navegación, recursos, desconocida 404, perfil y comparación. |
| 39 | Plan PRO inactivo | /planes muestra perfiles de uso | Se ha retirado la función inactiva de comprobación del plan; sin compras ni exigencia de plan. |
| 40 | Pruebas y reproducibilidad | npm test, fixtures, inventario y trazabilidad | Ejecuciones reales y extracción aislada con alcance identificado; no cobertura de líneas del 100 %. |

Los nombres de carpetas en esta tabla son relativos a app/src o functions/src según el área. Los archivos concretos de pruebas y los límites están enlazados desde [funcionalidades finales](funcionalidades-finales.md), [revisión total](revision-total-2026-11-10.md) y [trazabilidad](trazabilidad/simbolos-actuales.md). Las retiradas opcionales de los grupos 33, 36 y 39 están documentadas como decisiones de alcance. Las pruebas históricas del 11/11/2026 corresponden a la versión anterior y no acreditan esta variante.
