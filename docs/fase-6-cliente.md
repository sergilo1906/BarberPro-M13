# Fase 6 — experiencia del cliente

Implementación y pruebas: 9 de noviembre de 2026. Cierre documental: 10 de noviembre, antes de iniciar fase 7. Rama `fase-6-cliente`. Referencia: 7 horas; no se inventan horas efectivas. El presupuesto global sigue siendo 92 + 8 horas. Solo se trabaja en BarberPro-M13 y emuladores ficticios.

## A. Resumen y revisión inicial

Se completa `/mis-citas` con consulta propia, filtros, presentación de todos los estados, cancelación y cambio de cita, conectado con autenticación, reserva e ICS de fases anteriores. El perfil conserva los campos originales y ahora descarta respuestas tardías de otra identidad y recupera sus controles si cambia la cuenta durante una escritura pendiente.

Antes de programar se leyeron el original, arquitectura, mapas, inventarios de símbolos, rutas/roles, funcionalidades, cobertura y plan de `../BarberPro-M13-Planificacion/docs`, más informes de fases 3–5. Se repitió la suite inicial de fase 5: 25 unitarias, 33 integraciones, 116 pruebas de navegador y build de 27 páginas correctos. No se asumió el resultado del informe anterior.

## B. Archivos

Rutas relativas al proyecto. Se excluyen dependencias, dist, configuración local, capturas y logs.

| Creado | Responsabilidad |
|---|---|
| `app/src/comun/estados-cita.ts` | Etiquetas, clases, filtros y elegibilidad de gestión del cliente. |
| `app/src/modulos/reservas/mis-citas.ts` | Listado, sesión, filtros y coordinación de cancelación/cambio. |
| `app/src/modulos/reservas/cambiar-cita.ts` | Modal, selección, respuestas antiguas y recuperación idempotente. |
| `app/tests/unit/cliente.test.ts` | Límites de margen, estados, historia y fechas legadas. |
| `app/tests/e2e/cliente.test.ts` | Nueve recorridos reales por dispositivo. |
| `app/tests/e2e/cliente-visual.test.ts` | Cuatro estados originales en escritorio/móvil. |
| `app/tests/e2e/datos-cliente.ts` | Acceso ficticio, llamadas reales y cambio de identidad en pruebas. |
| `functions/tests/emuladores/cliente.test.mjs` | Cuatro integraciones de consulta y autorización. |
| `functions/tests/emuladores/datos-cliente.mjs` | Cuentas/estados históricos y futuros de prueba. |
| `docs/fase-6-cliente.md` | Este informe. |

| Modificado | Responsabilidad del cambio |
|---|---|
| `app/package.json`, `app/package-lock.json` | Declarar date-fns 3.6.0/date-fns-tz 3.2.0 para fechas legadas; mismas librerías ya utilizadas por backend/original. |
| `app/src/comun/avisos.ts` | Modal reutilizable, foco, Escape y desplazamiento si excede el viewport. |
| `app/src/comun/errores.ts` | Errores de cancelación/cambio y respuestas inciertas. |
| `app/src/comun/fechas.ts` | Validación de fecha e inicio de cita con timestamp o zona del negocio. |
| `app/src/datos/configuracion.ts` | Rechazar margen inválido; admitir cero, igual que el backend. |
| `app/src/modelos/agenda.ts` | Compatibilidad legada y solicitud de cambio tipada. |
| `app/src/modulos/cuentas/editar-perfil.ts` | Capturar datos antes de esperar y proteger callbacks/controles entre identidades. |
| `app/src/pages/mis-citas.astro` | Marcado original con controlador reorganizado y mensajes accesibles. |
| `app/src/styles/tailwind.css` | Ocultar también modales/avisos durante autorización pendiente. |
| `app/tests/e2e/autenticacion.test.ts` | Comprobar Mis citas sin JavaScript. |
| `app/tests/e2e/servidor-estatico.mjs` | Servir referencia original de Mis citas aislada. |
| `functions/scripts/preparar-datos-reservas.mjs` | Preparar también fixtures del cliente, solo demo local. |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | Nueva integración después de las suites anteriores. |
| `package.json`, `package-lock.json` | Metadatos de versión 0.6.0. |
| `README.md` | Estado y datos de exploración local. |
| `docs/control-avance.md`, `docs/control-cobertura.md`, `docs/estado-pausa.md` | Avance real, cobertura y reanudación. |

Total: 10 archivos nuevos y 20 modificados; 127 propios versionables. Existen 103 de 132 destinos previstos (102 versionables y el .env.local demo ignorado); faltan 29. Presencia física no equivale a cobertura funcional.

## C. Páginas

`/index-client` conserva sus dos tarjetas públicas; no era un panel privado con estadísticas. `/reservar`, `/mis-citas` y `/perfil` completan el recorrido cliente. Login, registro y verificación conservan sus rutas. Se reutiliza la cabecera compartida y se mantienen los 18 guards existentes. Las otras 15 vistas privadas de negocio siguen reservadas.

## D. Mis citas

Se consulta `bookings` por `userId == UID de la sesión`, mediante `datos/agenda.ts`; no se descarga la colección completa. Las reglas comprueban propiedad y permisos reales. La ordenación original es fecha/hora ascendente. Los filtros de fecha y estado operan sobre ese conjunto autorizado y no requieren índices adicionales a los siete existentes.

Cada tarjeta muestra fecha/hora, nombre de servicio, profesional, duración y estado, con las mismas clases/textos del original. Este detalle es visible en la tarjeta: no existía otra página o modal de detalle. No se añaden precio, IDs internos, campos administrativos ni una bandeja de notificaciones inexistente. Se conservan `serviceSnapshot.id`, nombres/duración legados y fallback del profesional archivado.

## E. Historial

El original muestra citas anteriores y futuras juntas, con filtros; no tiene secciones independientes de próximas/historial. Se conservan las pasadas, canceladas, hechas, no_show y reprogramadas, sin acciones terminales. El estado es el persistido: una cancelada futura no se convierte en pendiente. La etiqueta de tarjeta rescheduled sigue siendo «Cambiada», mientras el filtro conserva «Reprogramada».

## F. Perfil

Se reutilizan sesión y servicios de fase 4: nombre y teléfono editables; correo, rol y campos administrativos protegidos. Se mantiene el reenvío de verificación. No existe edición de correo ni recuperación de contraseña en el original. La validación compartida conserva nombre obligatorio hasta 100 caracteres y teléfono hasta 30, sin imponer formato numérico nuevo.

Una escritura captura sus valores y revisión de identidad antes de esperar. Cambiar cuenta limpia mensajes, datos editados y controles; una respuesta del usuario anterior no anuncia éxito ni desbloquea una operación nueva. Con red sin respuesta, el SDK puede mantener la escritura pendiente: se muestra «Guardando cambios...» y no se inventa éxito. La salida sigue disponible.

## G. Cancelación y reprogramación

Se llaman `cancelBooking` y `rescheduleBooking` de fase 5, sin segunda lógica de persistencia. Los botones se ofrecen solo para pending/confirmed con el margen del negocio; el backend vuelve a validar estado, propiedad y tiempo. Cancelar pide confirmación, evita doble envío y recarga tras la respuesta. Un error conserva el listado sin fingir éxito y permite actualizar.

Cambiar abre el modal original, sugiere el día siguiente, permite buscar otro profesional y obtiene huecos de `getAvailability`. Las fechas se limitan a hoy–30 días en la zona del negocio. Una revisión descarta consultas retrasadas de otra fecha. Solo se actualiza tras éxito real. La nueva y la antigua cita mantienen los enlaces y estados atómicos ya implementados.

El requestId y payload se conservan en memoria/sessionStorage, bajo `barberpro-cambio-pendiente`, con UID. Una respuesta perdida después del commit ofrece «Comprobar cambio», incluso al recargar; se reutiliza la misma operación. Mientras exista una respuesta incierta se bloquean otros cambios hasta comprobarla. No se guardan tokens ni contraseñas; si sessionStorage está bloqueado, la recuperación solo dura mientras exista el documento. Al salir/cambiar identidad se limpian los datos temporales.

## H. Seguridad y fechas

Los cuatro roles pueden usar su área de cliente propia. La gestión profesional/global sigue siendo la del backend de fase 5; no se concede al cliente cambiar estados ni consultar agendas ajenas. Las reglas no se relajan y siguen denegando escrituras directas de reservas, locks y notificaciones. Las pruebas incluyen lectura de lista/detalle/perfil ajenos, parámetros de otra cuenta, roles/campos protegidos y sesión sin autenticar.

Se ocultan los datos durante carga/error de sesión y se invalidan respuestas de una identidad anterior. El cambio de cuenta de la prueba modifica únicamente la persistencia local del SDK con un token auténtico del emulador; no es un mecanismo de la aplicación ni usa reglas permisivas.

Para el margen se prioriza `startAt`. Las citas antiguas sin timestamp se convierten con date-fns-tz en `config/app.timezone` (fallback Madrid), nunca con la zona del navegador. Se valida la conversión de vuelta para rechazar horas inexistentes; se mantiene la política canónica de otoño de fase 5. Texto de datos se escribe con textContent/DOM; innerHTML se limita a plantillas constantes.

## I. Correspondencias

| Original | Nuevo |
|---|---|
| mis-citas.client.ts | reservas/mis-citas.ts + cambiar-cita.ts + servicios compartidos |
| renderBookings / refreshView / loadMyBookings | mostrarCitas / actualizarListado / cargarMisCitas |
| bookingsCache / currentUid / filterDate / filterStatus / barberNames | citasCargadas / uidSesion / filtroFecha / filtroEstado / nombresProfesionales |
| statusLabel / statusClass / canManage / applyFilters | obtenerEtiquetaEstadoCliente / obtenerClasesEstadoCliente / puedeGestionarCita / aplicarFiltrosCitas, en estados-cita para reutilizar sin importar un controlador DOM |
| bookingServiceId / bookingStartDate / hoursUntilBooking | obtenerServicioCita / obtenerInicioCita / calcularHorasHastaCita |
| openRescheduleModal / loadSlots / slotButtonHtml | abrirCambioCita / cargarHuecosCambio / crearBotonHueco |
| handleCancel / humanizeCancelError / humanizeRescheduleError | cancelarCita / explicarErrorCancelacion / explicarErrorCambioCita |
| loadBarbers / loadAppConfig | obtenerProfesionales / obtenerConfiguracionAgenda existentes; sin wrappers duplicados |
| openModal / confirmDialog / toast | abrirModal / pedirConfirmacion / mostrarAviso |
| Layout / Navbar / AvailabilitySlot | DisenoPrincipal / BarraNavegacion / HuecoDisponible existentes |

Se mantienen IDs/selectores (`my-msg`, `my-list`, filtros, data-id, slot-choice), rutas, colecciones y exports públicos. No se generan clases artificiales ni archivos vacíos para inflar el inventario.

## J. Pruebas y comparación

`npm test` terminó con código 0 el 9 de noviembre a las 20:22:22 UTC; se comprobó el log al reanudar el 10. Check: 0 errores/warnings/hints; 28 unitarias (21 app + 7 backend); 37 integraciones (33 anteriores + 4 nuevas); build de 27 páginas; 142 pruebas de navegador correctas (34 comparaciones visuales incluidas), ninguna omitida. `npm run datos:local` se ejecutó contra emuladores demo.

Nuevos recorridos por dispositivo: ocho citas con historia/legados y filtros; cuenta vacía; reserva→consulta→cambio→cancelación; destino ocupado; respuesta perdida después del commit y recarga; consulta manipulada rechazada y recuperación; cambio de identidad durante una consulta retenida; escritura de perfil rechazada; validación/persistencia y cambio de cuenta con escritura pendiente. Las integraciones anteriores vuelven a comprobar margen, citas inexistentes/ajenas, transiciones, fallos atómicos y concurrencia.

Comparación real: dist original aislado, sin imports/inicialización de Firebase; se ejecutan exclusivamente sus funciones de presentación y modal con datos ficticios autorizados. Mutaciones de referencia están sustituidas por stubs y la disponibilidad visual se iguala a dos huecos; no se ejecuta su backend. Se comparan texto, geometría, estilos y captura en vacío/listado/cancelación/cambio, escritorio y móvil. Se conserva threshold 0.1 y máximo 0,01 % de píxeles diferentes. Las pruebas funcionales utilizan el backend real del emulador, incluidos huecos completos.

Las primeras pruebas dirigidas detectaron expectativas del test incorrectas: exigir un toast inexistente y esperar que una página pública redirigiese al salir. Se corrigieron esas expectativas, sin relajar autorizaciones ni tolerancias. El primer intento de cambio de identidad intentaba abrir login con sesión activa, que redirige por diseño; se sustituyó por un cambio controlado de persistencia con token real. El pase dirigido final dio 26/26 y el completo 142/142. También se corrigieron callbacks/controles de perfil que podían pertenecer a otra cuenta.

Diferencias visibles justificadas: límites de fecha en el modal, recuperación de cambios inciertos y scroll interior cuando el modal excede el viewport, para poder usar todos los controles en móvil. No cambian los estados comparados que caben en pantalla. No se rediseñan tarjetas ni formularios.

Evidencias locales ignoradas: `.verificacion/base-fase6.log`, `check-fase6.log`, `unitarias-fase6.log`, `cliente-integracion.log`, `cliente-navegador.log`, `fase6-completa.log`, y pares de capturas en `app/.verificacion/referencia`. Los emuladores y servidores quedaron detenidos; 94 hashes originales coinciden.

## K. Pendientes y siguiente fase

No quedan pruebas críticas fallidas del alcance ejecutado. Continúan los avisos heredados de dependencias: app 22 (9 moderados, 10 altos, 3 críticos), Functions 21 (15 moderados, 6 altos), herramientas raíz 14 moderados. La instalación de las librerías de fechas mantiene el recuento de app. No se presenta seguridad productiva certificada ni se hace una migración mayor fuera de alcance.

Fase 7: agenda/panel profesional, edición/publicación/copia de semanas, bloques y vacaciones con validación autoritativa y efectos sobre disponibilidad. Fases 8–9: administración general, estadísticas, exportaciones y recordatorios; sin adelantarlos. Safari físico, comprobación global y configuración productiva siguen en fases finales. No existe envío real de notificaciones, contratación ni recuperación de contraseña que se deba inventar aquí.
