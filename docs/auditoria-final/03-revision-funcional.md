# Revisión funcional

## Alcance contrastado con el original

Se han contrastado las 27 rutas, los 13 exports públicos originales, ocho colecciones raíz y weeklySchedules, estados de citas, formatos y módulos del catálogo funcional planificado. La recuperación de contraseña, pagos, subida de avatar, sincronización externa de calendarios y bandeja de avisos no existen en el original; no se introducen ni se registran como funciones ausentes de la reconstrucción. El plan PRO permanece inactivo, sin contratación.

| Área | Implementación y pruebas concretas | Límite |
|---|---|---|
| Cuentas | Registro, alta parcial, login, verificación, perfil persistente, logout, errores y cuatro destinos por rol. sesion.test.ts, autenticacion.test.ts y permisos.test.mjs. | Correo del emulador; no envío productivo. |
| Cliente | Disponibilidad, reserva, ICS, listado propio, estados/filtros, vacío, cancelar, mover y recuperar respuesta perdida. reservas/cliente.test.ts e integraciones de consistencia. | No sincronización con Google/Apple Calendar. |
| Reservas concurrentes | Dos clientes, solapes parciales, cuadrículas, duraciones, movimiento simultáneo, bloqueos y conservación de locks ajenos; reservas-concurrencia y profesional.test.mjs. | Emulador, no prueba de carga productiva. |
| Profesional | Panel, día, estados, semanas, copiar sin guardar, publicación, descansos, bloques y vacaciones. personal.test.ts y profesional.test.mjs. | Horas duplicadas DST se resuelven canónicamente; no se distinguen dos selecciones de la misma HH:mm. |
| Administración | Búsqueda exacta de usuarios, roles, equipo, servicios/precios/duración, reglas y resumen semanal. administracion.test.ts/.mjs. | No CRUD general de usuarios, eliminación de servicios ni editor de logo inexistentes en el original. |
| Resumen diario | Controlador compartido por personal; worker consulta únicamente su UID, gestión consulta el día. Nuevo recorrido exige tres citas y 90 minutos en el fixture profesional. | Se excluyen canceladas y registros históricos rescheduled. |
| KPIs | Día, últimos siete días y mes; seis tarjetas y reparto. Unitarias con seis estados y resultados conocidos; nuevo recorrido cambia los tres rangos. | Agrupación por nombre visible conserva posible unión de profesionales homónimos del original. |
| CSV | Ocho columnas originales, vista previa de ocho y descarga completa, BOM, CRLF, escape y prefijo ante fórmulas. Unitarias y nuevos recorridos de descarga, vacío, rango inválido, denegación y cambio de identidad pendiente. | No prueba con todas las aplicaciones de hojas de cálculo. |
| ICS | UTC, texto escapado y formato local descargable. Unitarias y recorrido de reserva. | No importación manual certificada en Outlook/Apple Calendar; plegado UTF-8 revisado durante la auditoría. |
| Recordatorios | Ventanas configurables, simulación sin escrituras, cola queued, idempotencia concurrente y compatibilidad con marcas legadas. Diez integraciones del grupo restantes incluyen notificaciones y demo. | No proveedor de email ni cron real; el handler se invoca manualmente. |
| Herramientas demo | Seed conserva existentes sin reset; reset explícito borra solo datos demo y subcolecciones, conserva usuarios/Auth. Pruebas de simulación, confirmación y roles. | Solo emulador aislado; no concurrencia de mantenimiento. |
| Información y diagnóstico | Ayuda, legal, planes, entradas, 404 y debug informativo. Navegación, permisos y aspecto contrastados. | No pagos ni nuevos botones destructivos. |

## Roles y permisos

Los roles son exactamente client, worker, manager y admin. Sin sesión se ofrecen las páginas públicas; las privadas redirigen. Cuenta pendiente puede editar perfil/reintentar verificación, pero no operar. El cliente gestiona únicamente sus reservas. Worker consulta/modifica su agenda y sus bloqueos, pudiendo actuar como cliente en citas propias. Manager gestiona equipo, servicios, agenda y consulta global autorizada. Admin añade usuarios/roles y configuración.

La matriz de rutas se obtiene de PERMISOS_RUTA y se contrasta con las páginas reales. Las pruebas de autenticación visitan las rutas de cada rol y comprueban opciones visibles y destinos. Las integraciones intentan escrituras directas, cambios de claims, lectura de citas ajenas, agenda ajena y operaciones privilegiadas con sesión ausente, correo pendiente, rol inferior y token manipulado/antiguo. No se toma la visibilidad del botón como autorización.

## Contratos públicos del backend

| Export original | Destino actual | Contraste |
|---|---|---|
| ping | salud.js | HTTP público sin acceso a datos. |
| adminSetClaims | cuentas.js | Admin verificado y permiso del actor dentro de transacción; rol y versión de destinatario. |
| setMyRole | cuentas.js | Se conserva nombre, pero rechaza autoservicio de privilegios. Diferencia de seguridad deliberada. |
| whoAmI | cuentas.js | Identidad/rol propio, claves de claims y metadatos; no devuelve tokens. |
| getAvailability | disponibilidad.js | Selección, servicio, semana publicada, bloques y fechas de negocio. |
| createBooking | reservas.js / persistencia-reservas.js | Propietario del token; transacción de cita, locks, control, aviso y recibo. |
| updateBookingStatus | reservas.js / persistencia-reservas.js | Personal; worker asignado; transiciones cerradas. |
| cancelBooking | reservas.js / persistencia-reservas.js | Propietario o personal autorizado, margen y locks pertenecientes a la cita. |
| rescheduleBooking | reservas.js / persistencia-reservas.js | Movimiento atómico, enlaces históricos y reintento idempotente. |
| runReminders | recordatorios.js | Manager/admin; simulación por defecto. |
| bookingRemindersJob | recordatorios.js | Cada 15 minutos declarado; prueba manual local, sin instalar tarea. |
| resetDemoData | demostracion.js | Admin local, simulación y confirmProject obligatorio al aplicar. |
| seedDemoData | demostracion.js | Admin local; sin sobrescribir catálogo existente salvo reset explícito. |

Se añaden seis callables: saveWeeklySchedule, createScheduleBlock, deleteScheduleBlock, saveTeamProfile, saveService y saveAgendaSettings. Hay 19 exports, no 19 funciones originales. Los trece se recontaron mediante AST del index original, sin limitarse a aceptar la cifra histórica.

## Diferencias deliberadas

No se envían notificaciones reales; queued nunca se equipara a sent. Se desactiva setMyRole, se cierran escrituras SDK, se exige correo y permiso vigente y se protegen transacciones. Se conserva el snapshot histórico al cambiar catálogo; mover consulta el servicio actual conforme al original. KPIs y resumen excluyen rescheduled para evitar doble cómputo y las canceladas no consumen tiempo reservado. Los formatos externos y URLs permanecen estables.

Los resultados finales de cada ejecución, incluidos fallos y correcciones, constan en 06-pruebas-ejecutadas.md. Este cuadro describe alcance y contratos, no una garantía universal de todos los datos posibles.
