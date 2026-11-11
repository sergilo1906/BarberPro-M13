# Funcionalidades implementadas y límites

Documento de cierre técnico para la entrega, con límites expresos y sin certificación de producción o aceptación académica. Estado y resultados: [revisión total](revision-total-2026-11-10.md), [matriz de 40 grupos](matriz-requisitos.md), [pruebas](pruebas-finales.md) y [rutas y roles](rutas-y-roles.md).

| Área | Comportamiento implementado | Límite |
| --- | --- | --- |
| Cuentas | Alta, inicio/cierre de sesión, perfil, verificación y reenvío de correo. Recupera altas de perfil incompletas. | Auth emulado; no envío real. Recuperación de contraseña no existía en el original. |
| Usuarios y roles | client, worker, manager y admin; consulta de usuarios y asignación administrativa. | El cliente no puede asignarse roles. No se inventa un CRUD completo de cuentas. |
| Reservas | Servicio, profesional o cualquiera, fecha, disponibilidad, confirmación e ICS. | Anticipación máxima de 30 días; sin pagos. |
| Disponibilidad | Duración completa, semana publicada, tramos, descansos, bloqueos y ocupación. | La fecha/hora contractual no distingue dos repeticiones durante el cambio horario; se aplica la conversión documentada. |
| Cliente | Mis citas, filtros, historial, cancelar y cambiar fecha/profesional; recuperación de respuestas perdidas. | Se aplica margen de cancelación; no sincroniza calendarios externos. |
| Profesional | Panel por periodo, agenda, transiciones de estado y consulta propia. | La gestión puede seleccionar otros profesionales; worker solo su agenda. |
| Semanas | Edita dos tramos por día, copia, guarda y publica con revisión. Preserva descansos. | Rechaza sobrescribir horarios legados con más de dos tramos desde ese editor. |
| Bloqueos | Pausa, excepción, bloqueo interno y vacaciones; crea y elimina. | Rechaza conflictos con citas existentes; no había edición de bloqueos en el original. |
| Administración | Usuarios, equipo, visibilidad, servicios, precio, duración y configuración de agenda. | Branding contiene reglas de agenda, no un editor de logotipo. |
| Estadísticas | Resumen diario y KPIs de día, semana y mes. | Excluye el historial rescheduled para evitar duplicados; canceladas no añaden tiempo reservado. |
| CSV | Rango autorizado completo, vista previa de ocho filas, UTF-8/BOM, escape y protección de fórmulas de texto. | Descarga local; el rango vacío no produce archivo. |
| ICS | Genera evento UTC, escapa texto y pliega líneas por bytes UTF-8. | Sin importación manual certificada en todas las aplicaciones de calendario. |
| Recordatorios | Cola local por ventanas configuradas, simulación y prevención transaccional de duplicados. | queued no equivale a enviado; no hay proveedor de mensajería ni cron desplegado. |
| Herramientas demo | Siembra y reset protegidos para admin, simulación por defecto y confirmación explícita al escribir. | Solo emuladores desechables, sin otros escritores; el reset no es una transacción global. |
| Auxiliares | Inicio, planes, ayuda, legal, diagnóstico informativo y 404. | Sin contratación de planes; diagnóstico no incorpora botones de borrado. |

Las 27 rutas y los trece exports backend originales se conservan. Se añaden seis operaciones protegidas para sustituir escrituras de negocio desde el navegador. La revisión de correspondencias por archivo y las pruebas por áreas no certifican equivalencia individual de todos los símbolos del inventario histórico.
