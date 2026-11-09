# Fase 5 — reservas y disponibilidad

Fecha: 9 de noviembre de 2026. Rama: `fase-5-reservas`. Proyecto: exclusivamente `BarberPro-M13`. Referencia vigente: **15 horas**, frente a las 12 del plan histórico; no son horas realmente imputadas. No se ha llevado un registro continuo de tiempo efectivo. Se conserva el objetivo global 92 + 8 horas y no se inicia fase 6.

## A. Resumen y revisión inicial

Se reconstruyen las cinco operaciones públicas `getAvailability`, `createBooking`, `cancelBooking`, `rescheduleBooking` y `updateBookingStatus`, el modelo de datos, consultas compartidas, cálculo de horarios, transacciones, controles de ocupación/idempotencia y la página original `/reservar`, con confirmación e ICS. Cancelación, reprogramación y consultas están disponibles como servicios reales y verificadas mediante SDK/HTTP/reglas. La pantalla completa de «Mis citas» se mantiene para fase 6; no se implementan sus filtros ni la agenda/paneles de fases 7–9.

Se ha revisado el original, la planificación de `../BarberPro-M13-Planificacion/docs` (arquitectura, mapas de archivos/símbolos, rutas/roles, funcionalidades, contratos, plan y cobertura), los informes de fases 3–4 y el estado de Git. Antes de programar se repitieron check, unitarias, build e integración/navegador de fase 4: 19 unitarias, 14 integraciones y 98 pruebas de navegador correctas. La base era funcional; no se asumió por el informe. El original se utiliza solo como referencia y se contrasta por los 94 hashes de fase 2.

Se eliminó una dependencia local `barberpro-m13: file:..` que se había colado en el manifiesto del backend de fase 4: Functions debe ser un paquete autosuficiente, sin depender del proyecto contenedor. Se incorporan únicamente las librerías ya utilizadas por el original y previstas en fase 2: `date-fns 3.6.0` y `date-fns-tz 3.2.0`. No hay framework, calendario ni proveedor de servicios nuevo. Los avisos de dependencias heredados siguen siendo un pendiente explícito de seguridad previo a publicación; no impiden el entorno aislado ni se presentan como resueltos.

## B. Estructura y archivos

Archivos relativos a la raíz. No se cuentan node_modules, dist, logs, capturas ni configuración demo ignorada.

| Archivo creado | Responsabilidad |
|---|---|
| `app/src/modelos/agenda.ts` | Servicio, Cita, EstadoCita, HuecoDisponible, solicitud y resultado con claves wire originales. |
| `app/src/modelos/interfaz.ts` | Opciones de confirmación, aviso y datos ICS usados realmente. |
| `app/src/comun/fechas.ts` | Fecha del negocio y suma de días de calendario independiente de la zona del navegador. |
| `app/src/comun/avisos.ts` | Confirmación y avisos con texto seguro, Escape, foco y cierre. |
| `app/src/datos/catalogo.ts` | Consulta de servicios activos y orden alfabético. |
| `app/src/datos/configuracion.ts` | Lectura de la zona y margen de cancelación. |
| `app/src/datos/agenda.ts` | Consultas propias, asignadas a profesional y por día para gestión. |
| `app/src/datos/funciones-remotas.ts` | SDK callable tipado para las cinco operaciones. |
| `app/src/modulos/reservas/reservar-cita.ts` | Coordinación del formulario, disponibilidad, confirmación, respuesta y reintento. |
| `app/src/modulos/reservas/huecos-reserva.ts` | Render de huecos y aviso vacío, sin acceso Firebase. |
| `app/src/exportaciones/calendario.ts` | Descarga `cita.ics` con timestamps UTC y escape de texto. |
| `functions/src/fechas.js` | Calendario real, horas, semana, zona IANA, intervalo y antelación. |
| `functions/src/configuracion.js` | Configuración autoritativa, también dentro de transacciones. |
| `functions/src/horarios.js` | Semanas publicadas, tramos, descansos y bloqueos/vacaciones. |
| `functions/src/disponibilidad.js` | Catálogo profesional, intervalos ocupados y export getAvailability. |
| `functions/src/persistencia-reservas.js` | Transacciones de creación, cambio, estados y liberación de locks. |
| `functions/src/reservas.js` | Cuatro exports de mutación: sesión verificada y coordinación del núcleo. |
| `functions/scripts/preparar-datos-reservas.mjs` | Fixtures locales explícitos; rechaza hosts/proyectos distintos. |
| `functions/tests/emuladores/datos-reservas.mjs` | Datos ficticios y clientes SDK reutilizados por pruebas/preparación local. |
| `functions/tests/emuladores/reservas-consistencia.test.mjs` | Validaciones, permisos, datos, estados, fallos y consultas reales. |
| `functions/tests/emuladores/reservas-concurrencia.test.mjs` | Cinco carreras reales de creación, idempotencia y reprogramación/cancelación. |
| `functions/tests/unit/disponibilidad.test.mjs` | Calendario, DST, intervalos, alineación y compatibilidad de horarios. |
| `app/tests/unit/fechas.test.ts` | Fecha de negocio e ICS seguro. |
| `app/tests/e2e/datos-reserva.ts` | Preparación común de los tests de reserva. |
| `app/tests/e2e/reservas.test.ts` | Flujo real, respuesta perdida, datos obsoletos y errores de conexión. |
| `app/tests/e2e/reservas-visual.test.ts` | Comparaciones disponible/vacío/confirmación con el dist original. |
| `docs/fase-5-reservas-disponibilidad.md` | Este informe. |

Los 19 archivos modificados son:

| Archivo modificado | Cambio |
|---|---|
| `README.md` | Estado y comandos reproducibles con datos ficticios. |
| `app/src/comun/errores.ts` | Mensajes comprensibles de reservas. |
| `app/src/datos/personas.ts` | Consulta de profesionales activos. |
| `app/src/datos/sesion.ts` | Limpieza de operaciones temporales al salir. |
| `app/src/modelos/cuentas.ts` | Modelo Profesional. |
| `app/src/pages/reservar.astro` | Marcado original y controlador nuevo. |
| `app/tests/e2e/comparacion-visual.test.ts` | Capturas estables y escala móvil coherente; mismas tolerancias. |
| `app/tests/e2e/servidor-estatico.mjs` | Referencia `/reservar` aislada y sin scripts. |
| `app/tests/unit/sesion.test.ts` | Comprobación de limpieza al cerrar sesión. |
| `docs/control-avance.md` | Estado vigente de fase 5 e historial conservado. |
| `docs/control-cobertura.md` | Inventario, matriz de operaciones y límites. |
| `docs/estado-pausa.md` | Nueva autorización y parada antes de fase 6. |
| `firestore.indexes.json` | Índice adicional de ocupación, sin desplegar. |
| `functions/index.js` | Cinco exports públicos de reservas. |
| `functions/package.json` | Librerías de fechas y comandos de comprobación. |
| `functions/package-lock.json` | Versiones fijadas; eliminado enlace accidental al padre. |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | Tres suites backend en secuencia antes de build/navegador. |
| `package.json` | Versión de fase 5 y preparación local explícita. |
| `package-lock.json` | Metadatos del manifiesto raíz. |

Las reglas Firestore no se abren: las escrituras de reservas siguen exclusivamente en backend.

Las adiciones no previstas por nombre exacto son pruebas, fixtures y preparación local; no hay implementaciones paralelas. La última instrucción amplía expresamente fase 5 a la página de reserva y su confirmación/ICS, que el plan histórico situaba en fase 6. Se realiza ese alcance solicitado sin adelantar la pantalla completa de cliente, agenda o administración.

## C. Modelo de datos y contratos

Se conservan las colecciones `services`, `barbers`, `weeklySchedules`, `blocks`, `bookings`, `bookingLocks`, `notifications` y `config/app`.

Una reserva conserva `userId`, `userEmail`, `userName`, `userPhone`, `barberUid`, `serviceId`, `serviceSnapshot.{name,durationMin,price}`, `durationMin`, `dateStr`, `timeStr`, `customerNotes`, `status`, `lockKeys`, `startAt`, `endAt`, `createdAt`, `updatedAt`. Cancelar añade los campos originales `cancelledBy`, `cancelReason`, `cancelledAt`; cambiar enlaza `rescheduledFrom` y `rescheduledTo`. Se leen las duraciones legadas `duration` y el identificador legado `serviceSnapshot.id`.

Los timestamps son Firestore UTC; los campos de fecha/hora describen el negocio en `config/app.timezone`, con compatibilidad `tz` y valor predeterminado `Europe/Madrid`. No se confía en duración, precio, estado o identidad enviados por el navegador. El propietario procede de Auth; una reprogramación administrativa conserva al propietario original y recupera su contacto del perfil cuando falta en una cita antigua.

Ampliaciones aditivas justificadas, sin migración productiva:

- `requestId` opcional en createBooking/rescheduleBooking. La UI nueva siempre lo envía; los consumidores antiguos siguen siendo aceptados.
- `bookingLocks/control_{barberUid}_{dateStr}`: `kind=day_guard`, revisión y fecha del servidor. Serializa el día profesional; no figura entre los locks liberables de una cita.
- `bookingLocks/operacion_{hash}`: `kind=request_guard`, huella y recibo del resultado. Hash de UID/requestId y huella de payload normalizado; no se almacena el payload sensible completo.
- Los locks de intervalo mantienen campos originales y añaden `slotMin` para conocer la longitud real de cada celda, incluida la última parcial. La hora se calcula explícitamente; no se deduce separando un UID por guiones bajos.
- Confirmación con ID `notifications/confirmation_{bookingId}`, dentro de la transacción y estado `queued`. No se afirma que sea correo enviado ni se activa un proveedor.

El recibo de idempotencia confirma una operación ya realizada; no sustituye una consulta del estado vigente de la cita. No hay TTL automático: `expiresAt` es metadato y no se usa como prueba de disponibilidad. La limpieza de recibos/controles requerirá una política de mantenimiento posterior.

## D. Disponibilidad y calendario

El calendario original es un **input nativo type=date**, no una cuadrícula mensual propia. Se conserva. Sus límites son hoy y hoy+30 días, ahora calculados en la zona del negocio; el backend también comprueba el máximo para evitar eludir el navegador. No se inventan otros márgenes mínimos de creación ni restricciones por servicio/profesional: todos los profesionales activos pueden prestar los servicios activos, como en el original.

El cálculo sigue este orden:

1. Comprobar usuario/correo, fecha real, servicio disponible, duración/precio válidos y preferencia profesional.
2. Ordenar profesionales por `order` y UID; respetar `active/isActive`, preferencia y «cualquiera».
3. Obtener el lunes de la semana; admitir solo documento con `published === true`. Una semana ausente/no publicada no aporta horas.
4. Elegir el día conservando domingo=0; normalizar `ranges` y los legados `start/end`, mantener `breaks`, validar tramos ordenados y sin solapes.
5. Generar inicios desde el comienzo de cada tramo con su `slot/slotMin`; exigir que quepa toda la duración en un mismo tramo y no cruce descansos.
6. Excluir pausas, excepciones, internos y vacaciones inclusivas; excluir reservas `pending`, `confirmed`, `done`, `no_show` y celdas de ocupación conservadas.
7. Convertir el intervalo a UTC, descartar pasado/horas imposibles y devolver `slots[{timeStr,barberUid}]` ordenados. Con «cualquiera», una hora aparece una vez, con el primer profesional elegible.

Los intervalos son semiabiertos `[inicio, fin)`: una cita puede empezar exactamente cuando termina otra. Bloquear solo el comienzo no basta; se compara el intervalo completo. Los locks huérfanos/legados se tratan de forma conservadora y no se borran automáticamente: pueden requerir mantenimiento local explícito, nunca se ignoran para forzar una reserva.

**Zona y DST:** conversión mediante `fromZonedTime`; comprobación de vuelta mediante `Intl.DateTimeFormat` en la zona IANA. Se detectó que formatear con un Date local intermedio podía normalizar una hora inexistente de la zona del servidor y ocultar el error; la verificación directa con Intl evita esa dependencia. Se rechazan horas inexistentes y servicios cuyo tiempo real no coincide con la duración local al atravesar un cambio horario. El contrato HH:mm no distingue las dos ocurrencias del otoño: solo se expone la conversión canónica de la librería. No se promete reservar ambas ocurrencias con el mismo identificador de hora.

## E. Creación e interfaz

La página conserva sección, grid, selects, checkbox «cualquier profesional», fecha, teléfono, notas, leyenda Libre/Ocupado, botones verdes, modal y panel de éxito originales. Los servicios se ordenan alfabéticamente y muestran nombre/duración/precio; los profesionales conservan orden y nombres. Se usan datos ficticios del seed original (Corte, Barba, Corte + Barba, Color) para comprobar distintos tamaños; no hay catálogo hardcodeado en la aplicación.

Cada cambio invalida los huecos anteriores. Una revisión descarta respuestas retrasadas de otra selección. Seleccionar una hora captura una solicitud concreta y abre confirmación; el estado en curso impide abrir dos modales/enviar dos solicitudes. Solo tras respuesta válida se muestra éxito; después se consulta la disponibilidad otra vez. Los datos de catálogo se insertan mediante Option/textContent, nunca HTML sin escapar.

El servidor vuelve a leer configuración, perfil vigente, catálogo, profesional, semana, bloqueos, citas y controles dentro de la transacción. Crea una reserva pending con snapshot autoritativo, locks, revisión del día y notificación. El resultado conserva `ok`, `bookingId`, `barberUid`, `status`, `startAt`, `endAt`.

Ante una respuesta incierta se conserva el mismo requestId y payload en memoria/sessionStorage del tab y se ofrece **«Comprobar reserva»**, incluso después de recargar. No se inicia automáticamente otra operación con un nonce nuevo. El servidor devuelve el recibo ya persistido o completa la misma solicitud. Una clave reutilizada con datos distintos se rechaza. Es una adaptación visible de seguridad respecto al original. Si el navegador prohíbe sessionStorage, el reintento continúa en memoria, pero no se garantiza recuperación del nonce después de recargar. Al salir se borran solo claves temporales `barberpro-`; nunca datos de otra aplicación. No se guardan tokens ni contraseñas.

ICS mantiene el botón y nombre `cita.ics`, fechas UTC y título original. Se escapan saltos de línea/texto para impedir inyección de propiedades. No hay sincronización con calendarios externos.

## F. Prevención de conflictos

Consultar primero y guardar después no garantiza exclusión. Todos los escritores nuevos leen y actualizan el mismo documento de control de profesional/día **dentro de la transacción**, además de comprobar los intervalos ocupados. Una operación concurrente provoca reintento y recalcula contra los datos actualizados; no se apoya solo en claves de celdas que podrían pertenecer a cuadrículas distintas.

Creación, cancelación, cambio de estado y reprogramación participan en el control. Cambiar de día/profesional lee ambos controles en orden estable y actualiza ambos, evitando liberar el origen por separado. Toda lectura precede a cualquier escritura. Se limita el conjunto de celdas leído a 450 para mantener operaciones grandes dentro de un tamaño seguro; excederlo falla sin cambios. No se añade ningún escritor cliente directo.

El protocolo cubre este backend reconstruido. Un escritor antiguo/Admin externo que modifique citas sin el control no ofrece esa garantía: no se mezcla con producción ni se afirma concurrencia segura entre dos implementaciones distintas.

## G. Cancelación

Solo pending/confirmed. Cliente: propia y margen configurado (12 h por defecto). Worker: asignada como profesional, o propia como cliente con el mismo margen. Manager/admin: gestión autorizada. La corrección permite que un worker gestione su reserva personal con otro profesional sin atribuirle permisos globales.

La transacción valida permisos/estado/margen y cambia a cancelled, registra motivo/actor/fechas, actualiza el control y libera exclusivamente locks cuyo `bookingId` coincide con la cita. Nunca borra una celda reasignada a otro propietario. Repetir una cancelación ya aplicada no vuelve a liberar recursos; una consulta posterior refleja los bloqueos que realmente siguen ocupados.

## H. Reprogramación

Mismos permisos, margen y estados que cancelar. La petición usa `bookingId`, `newDateStr`, `newTimeStr`, `barberPreference`, `anyBarber` y requestId opcional. El servicio se toma de la reserva; compatibilidad con `serviceSnapshot.id`/payload legado cuando falta el identificador. Precio y duración nuevos se leen del catálogo actual, como hacía el original; el snapshot histórico anterior no se altera.

La cita vieja se excluye al comprobar su propio destino para permitir un cambio que reutilice parte del intervalo. En una sola transacción se valida el hueco nuevo, crea la sucesora pending, enlaza ambas, marca la anterior rescheduled, libera sus locks propios que no se reutilizan y ocupa los nuevos. Si no hay hueco o falla una precondición, la anterior mantiene su estado/locks y no aparece una sucesora parcial. Dos cambios simultáneos de una cita no crean dos sucesoras; el requestId permite recuperar el resultado de una respuesta perdida.

## I. Estados y permisos

Estados conservados: pending, confirmed, cancelled, done, no_show, rescheduled. Transiciones ordinarias: pending → confirmed/cancelled; confirmed → done/no_show/cancelled; los demás son terminales. Rescheduled solo se produce por la operación atómica de cambio. Done/no_show siguen ocupando el intervalo, según la política original.

| Operación | Cliente | Profesional | Responsable | Administrador | Comprobación |
|---|---|---|---|---|---|
| Disponibilidad/crear | Sí | Sí, como cliente | Sí | Sí | Auth actual, correo, versión de permisos y datos autoritativos. |
| Consultar citas propias | Propias | Propias | Propias/todas | Propias/todas | Firestore por userId; gestión con claims vigentes. |
| Consultar agenda asignada | No | Solo asignadas | Todas | Todas | Firestore por barberUid/día o gestión. |
| Cancelar/reprogramar | Propias con margen | Asignadas; propias como cliente con margen | Autorizadas globales | Autorizadas globales | Backend y perfil vigente dentro de la transacción. |
| Cambiar estado ordinario | No | Solo asignadas | Sí | Sí | Rol, propiedad profesional y tabla de transiciones. |
| Escribir citas/locks/notificaciones desde SDK | No | No | No | No | Reglas deniegan; solamente Admin backend. |

`firestore.rules` de fase 4 sigue asegurando los datos; no se relaja por las pruebas. Los seis índices anteriores se conservan. Se añade `bookingLocks(barberUid,dateStr)` para consultar ocupación; total siete. El emulador permite verificar las consultas, pero no demuestra que los índices estén desplegados ni todas las restricciones operativas de un proyecto productivo.

## J. Correspondencias

| Original | Destino / símbolo nuevo | Decisión |
|---|---|---|
| `reservar.astro`, `Layout`, `Legend` | Mismo archivo; DisenoPrincipal y LeyendaDisponibilidad | Markup/URLs conservados, labels asociados y mensajes accesibles. |
| `scripts/reservar.client.ts` | `modulos/reservas/reservar-cita.ts`, `huecos-reserva.ts`, módulos datos | SDK fuera del controlador; render sin HTML de usuario. |
| loadServices/loadBarbers/loadAvailability/renderSlots | cargarServicios/cargarProfesionales/cargarDisponibilidad/mostrarHuecos | Un servicio de datos por responsabilidad. |
| selectedServiceId/selectedBarberUid/lastIcs | selectorServicio.value/selectorProfesional.value/ultimoCalendario | Estado concreto sin listas Firebase duplicadas. |
| createBooking/setBusy/bindEvents/initDateInput | crearReserva/marcarReservaOcupada/enlazarEventosReserva/prepararSelectorFecha | Confirmación, bloqueo, listeners y fecha separados. |
| Service/AvailabilitySlot/Barber | Servicio/HuecoDisponible/Profesional | Interfaces sencillas; campos externos iguales. |
| lib/ui.ts, lib/ics.ts | comun/avisos.ts, exportaciones/calendario.ts | pedirConfirmacion/mostrarAviso/descargarCalendario; texto y estructura originales. |
| functions getAppConfig / fecha y horario | configuracion.js / fechas.js / horarios.js | Configuración validada; validarFechaCalendario, convertirAFechaUtc, obtenerLunesSemanaUtc, normalizarHorario. |
| computeBarberAvailability/generateCandidateTimes/fitsInSchedule | calcularDisponibilidadProfesional/generarHorasCandidatas/cabeEnHorario | Mismo propósito, corrección de alineación y validación integral. |
| attemptCreateBooking/releaseLocks | intentarCrearReservaAtomica/liberarBloqueosReserva | Operación completa transaccional y liberación por propietario. |
| Cinco exports públicos de reservas | Mismos nombres en index.js | Región europe-west1 y payloads compatibles; sin prefijos nuevos. |

Los nombres internos usan español; `dateStr`, `timeStr`, `barberUid`, `serviceSnapshot`, IDs HTML y colecciones siguen siendo contratos públicos. No se renombra la base de datos ni se importa código ejecutable fuera del paquete Functions.

## K. Pruebas, comparación y resultados

La ejecución final de `npm test` terminó con código 0 el 9 de noviembre de 2026. No se cuentan los intentos fallidos como éxitos. El núcleo solicitado queda implementado y verificado en el entorno local, con los pendientes de seguridad y alcance de la sección L.

| Comprobación | Evidencia / resultado |
|---|---|
| Check inicial de fase 4 | 0 errores/warnings/hints; unitarias e integración/navegador repetidos correctamente. |
| `npm run check` | Correcto: Astro/TypeScript con 0 errores, 0 warnings y 0 hints; sintaxis de todos los módulos backend y scripts correcta. |
| `npm run test:unit` | 25 correctas: 18 app y 7 backend. Fechas, zona, DST, intervalos, horarios, ICS y limpieza de sesión, además de fase 4. |
| `npm run test:emuladores` / `npm test` | 33 integraciones correctas contra Auth/Firestore/Functions, incluidas cinco carreras. 116 pruebas de navegador correctas en escritorio/móvil, con 26 comparaciones visuales incluidas y ninguna omitida. Salida global 0; emuladores detenidos al finalizar. |
| `npm run datos:local` | Ejecutado correctamente contra los emuladores demo; solo fixtures públicos ficticios. |
| Build | Correcto: 27 rutas estáticas; sin importaciones ausentes. |
| Original | 94 hashes SHA-256 coincidentes con la referencia de fase 2; ningún archivo original modificado. |

La suite de reservas prueba: servicios/duraciones/activo, profesionales sin semana/ocultos, semana sin publicar, descanso, pausas y vacaciones, mañana/tarde, alineación no múltiplo de medianoche, fecha imposible/pasada/fuera de horizonte, cierre, catálogo inexistente, parámetros e identidad manipulados, creación/snapshot/UTC/locks/notificación, repetición y requestId reutilizado con otro payload, cinco operaciones sin sesión, correo pendiente, consultas reales de cada rol, cancelación ajena/inexistente/repetida, margen antes/después y worker como cliente, locks con otro propietario, reprogramación y preservación de contacto/historia/notas, catálogo actualizado, fallo por ocupación/bloqueo, transiciones válidas/terminales/no_show y personal no asignado.

Cinco carreras reales: dos altas iguales; intervalos parcialmente solapados de duraciones distintas; dos envíos de una operación; dos cambios de una cita; cancelar contra reprogramar. Las aserciones comprueban datos persistidos, sucesora única, notificación única y propietario de los locks, además de respuestas HTTP. No se usan reglas permisivas ni knobs de fallo en el backend para obtener verdes.

Navegador: catálogo/formato, calendario nativo/límites, profesional específico/cualquiera, confirmación y doble clic, creación y descarga ICS, hueco ocupado después de consultar, respuesta abortada **después del commit** recuperada tras recargar con el mismo requestId, cambio de servicio/profesional, respuesta antigua retenida que no sustituye la nueva y pérdida de conexión al consultar. Los casos de cancelación/reprogramación se verifican en servicios/backend; su interfaz completa es de fase 6.

**Comparación visual real:** dist original servido en 4332, scripts eliminados y conexiones prohibidas por CSP; reconstrucción en 4331. Se preparan los mismos datos ficticios y estados dinámicos a partir del markup/render original, sin ejecutar su SDK contra Firebase. Se comparan texto, geometría, fuentes/colores y capturas para disponible, vacío y modal en ambos dispositivos, además de las comparaciones de fases anteriores. No se utiliza una copia de la página nueva como HTML de referencia. Los datos de opciones/huecos se igualan para aislar el diseño de las correcciones del cálculo.

Se normalizan foco/hover y posición de scroll en las dos superficies; el modal fijo se captura con el mismo viewport/scroll. Se conserva la tolerancia de fase 3: threshold 0.1 y máximo 0,01 % de píxeles; no se amplía para esconder diferencias. Los estados de teclado se conservan funcionalmente: foco inicial, Tab dentro del modal y Escape. Cambios visibles justificados: botón de comprobación solo ante respuesta incierta y mensajes de error/recuperación. Labels/aria-live/maxlength no cambian la distribución.

Incidencias resueltas: fecha inexistente normalizada por un Date intermedio del host; entrada de dependencia al directorio padre; expectativa incorrecta de una hora fuera de la cuadrícula de Marta; contacto de administrador usado como fallback de una cita legada; y diferencias de capturas por foco UA/scroll suave/hover. La latencia de arranque de Functions local puede exceder 5 s; el helper espera hasta 15 s a los huecos sin convertir un timeout en aprobado. El formulario espera al estado de sesión definitivo antes de aceptar una respuesta durante una renovación de Auth; una carga transitoria no se trata como salida. No se atribuyen diferencias de cálculo corregidas a un rediseño.

Dos ejecuciones completas intermedias dieron 115 de 116 pruebas de navegador: una detectó redondeos subpíxel en la tabla pública Planes y otra 158 píxeles en bordes de letras del 404. Se inspeccionó la diferencia y se mantuvieron las tolerancias: se activan las superficies antes de medir y la comparación pública usa `toHaveScreenshot`, que espera capturas estables, siguiendo la [API de Playwright](https://playwright.dev/docs/api/class-snapshotassertions). Un tercer pase dio 110 de 116 por la escala CSS predeterminada de esa aserción frente a la escala de dispositivo de la captura original móvil (390 frente a 1170 píxeles). Se igualó explícitamente `scale: "device"` y el pase dirigido de las 12 páginas públicas terminó correctamente. Estas ejecuciones no se presentan como verdes; la tabla final recoge el resultado completo posterior.

Evidencias locales ignoradas: `.verificacion/base-fase5.log`, `.verificacion/reservas-backend.log`, `.verificacion/reservas-navegador.log`, `.verificacion/reservas-visual.log`, `.verificacion/publicas-visual.log`, `.verificacion/fase5-completa.log` y `app/.verificacion/referencia` (pares original/reconstruida). El log completo corresponde al último pase correcto. Los logs del emulador pueden contener enlaces ficticios de verificación; no se versionan ni contienen cuentas de producción.

Referencias primarias consultadas: [transacciones Firestore y reintentos](https://firebase.google.com/docs/firestore/manage-data/transactions), [date-fns-tz](https://github.com/marnusw/date-fns-tz). No se ha ejecutado el backend original: la equivalencia de sus reglas procede de lectura del código; la comparación visual usa su compilación estática aislada.

## L. Pendientes y cierre de alcance

`npm audit --json` se ejecutó por separado en raíz, app y Functions. Es una fotografía de las dependencias instaladas, no un recuento de vulnerabilidades explotadas ni sumable entre paquetes:

| Paquete | Moderadas | Altas | Críticas | Total |
|---|---:|---:|---:|---:|
| Herramientas raíz | 14 | 0 | 0 | 14 |
| App | 9 | 10 | 3 | 22 |
| Functions | 15 | 6 | 0 | 21 |

Se mantienen las versiones heredadas de Astro/Vitest y SDK salvo las dependencias de fechas justificadas. No se ejecuta `audit fix --force` ni una migración mayor fuera de alcance. Los JSON de auditoría se conservan localmente en `.verificacion/auditoria-{app,functions,herramientas}-fase5.json`. La validación funcional local no resuelve estos avisos ni certifica seguridad para publicación.

- **Fase 6:** conectar la pantalla completa de Mis citas, filtros, consulta/gestión del cliente y modal de cambio sobre los servicios ya probados. La reserva/confirmación/ICS solicitadas en esta fase ya quedan integradas; no se desarrollan otros paneles de cliente por anticipación.
- **Fase 7:** agenda profesional, resumen, editor/publicación de semanas y gestión de bloqueos con validaciones de escritura. Las lecturas/cálculo actuales ya manejan esos datos de fixtures.
- **Fase 8:** administración general de servicios/equipo/usuarios/configuración. No hay endpoints nuevos para permitir modificaciones arbitrarias de esos datos.
- **Fase 9:** recordatorios y herramientas demo públicas con barreras; no hay correos reales, job activado ni afirmación de envío desde queued.
- Revisar los avisos heredados de dependencias antes de publicar/cerrar una entrega sin pendientes de seguridad. Mantener los servidores solo en loopback. No se despliega ni migra nada.
- Safari/dispositivo físico, comparación global de estados y validación productiva de índices/límites pertenecen a integración final. Los emuladores no certifican firmas ni configuración de producción.
- La garantía de exclusión requiere todos los escritores usando este protocolo. No mezclar backend antiguo/nuevo ni borrar locks por expiresAt sin verificar su propietario.

El trabajo se detiene tras la entrega de esta fase y se esperan nuevas instrucciones. No se inicia fase 6.
