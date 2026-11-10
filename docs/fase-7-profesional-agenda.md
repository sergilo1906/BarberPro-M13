# Fase 7 — profesional, agenda, horarios y bloqueos

Fecha: 10 de noviembre de 2026. Rama `fase-7-profesional`. Referencia vigente: **11 horas**, frente a las 10 históricas del plan; no son horas efectivas imputadas. Se mantiene la planificación global de 92 + 8 horas. Solo se trabaja en BarberPro-M13 y emuladores demo.

## A. Resumen y comprobación inicial

Se reconstruyen `/panel-barbero`, `/agenda`, `/setup-barber` y `/bloqueos`, con sesión profesional, consultas autorizadas, estados, semanas, publicación, copia, pausas/excepciones/internos/vacaciones y su efecto real sobre la disponibilidad. No se implementan administración general, estadísticas administrativas, CSV, mantenimiento ni recordatorios de fases 8–9.

Se revisaron original y planificación en `../BarberPro-M13-Planificacion/docs`: arquitectura, mapas de archivos/símbolos y sus inventarios, rutas/roles, funcionalidades, contratos, plan y cobertura; además de informes 5–6 y estado-pausa. Se leyeron las cuatro páginas/controladores originales, week, UI, reservas, reglas y backend. La nueva solicitud permite una reanudación autorizada. El registro distingue el intervalo entre logs de una espera activa que no se puede certificar.

La fase 6 había terminado sus pruebas el 9 de noviembre, pero aún faltaban informe y commit. Antes de esta fase se completaron su registro y cobertura, guardados en `ffa81bb`. Se repitió la base: check, 28 unitarias, 37 integraciones, build de 27 páginas y 142 pruebas de navegador correctas. No se asumió el estado por una afirmación anterior. Fases 8–11 y publicación GitHub no se dan por ejecutadas por haber recibido sus solicitudes.

## B. Archivos y estructura

Rutas relativas a la raíz. Se excluyen dependencias, dist, configuración demo y evidencias ignoradas.

| Creado | Responsabilidad |
|---|---|
| `app/src/modulos/profesionales/agenda-diaria.ts` | Consulta diaria, filtros y cambio autorizado de estados. |
| `app/src/modulos/profesionales/tarjetas-citas.ts` | Tarjetas de agenda y listado de citas del día, sin SDK. |
| `app/src/modulos/profesionales/panel-profesional.ts` | Resumen por periodo y cinco citas pendientes/confirmadas de hoy. |
| `app/src/modulos/profesionales/editar-horario.ts` | Profesional/semana seleccionados, lectura, copia y guardado recuperable. |
| `app/src/modulos/profesionales/formulario-horario.ts` | Siete días, dos tramos, defaults, validación y preservación de descansos. |
| `app/src/modulos/profesionales/bloqueos.ts` | Consulta, creación, eliminación y recuperación de operaciones. |
| `app/src/modulos/profesionales/formulario-bloqueo.ts` | Campos por tipo y validación de fecha/hora/motivo. |
| `functions/src/control-agenda.js` | Control diario compartido y recibos de idempotencia de agenda. |
| `functions/src/persistencia-horarios.js` | Tres operaciones autorizadas y transaccionales de semana/bloqueos. |
| `app/tests/e2e/datos-profesional.ts` | Acceso ficticio, fechas y llamadas locales de pruebas. |
| `app/tests/e2e/personal.test.ts` | Diez recorridos funcionales por dispositivo. |
| `app/tests/e2e/personal-visual.test.ts` | Ocho estados visuales originales por dispositivo. |
| `app/tests/e2e/comparar-presentacion.ts` | Comparación común de estilos/geometría y margen de rasterizado documentado. |
| `app/tests/unit/profesional.test.ts` | Horarios, defaults, descansos, solapes y semanas/periodos. |
| `functions/tests/emuladores/datos-profesional.mjs` | Tres profesionales y un cliente ficticios, semanas y citas. |
| `functions/tests/emuladores/profesional.test.mjs` | Once integraciones, incluidas carreras entre escritores. |
| `functions/tests/unit/horarios.test.mjs` | Contratos, calendario, límites y cambios de hora. |
| `docs/fase-7-profesional-agenda.md` | Este informe. |

| Modificado | Responsabilidad del cambio |
|---|---|
| `app/src/comun/errores.ts` | Mensajes de agenda sin trazas ni detalles internos. |
| `app/src/comun/estados-cita.ts` | Etiquetas/colores profesionales y siguientes estados permitidos. |
| `app/src/comun/fechas.ts` | Lunes y periodos con días de calendario en la zona del negocio. |
| `app/src/comun/formularios.ts` | Validación compartida de intervalo horario. |
| `app/src/comun/permisos.ts` | Contexto profesional que invalida respuestas al cambiar identidad/rol. |
| `app/src/datos/agenda.ts` | Consultas por periodo, semana profesional y bloqueos propios. |
| `app/src/datos/funciones-remotas.ts` | Nuevas llamadas tipadas y almacenamiento temporal de operaciones. |
| `app/src/datos/personas.ts` | Ficha y listado con inactivos únicamente cuando se solicita. |
| `app/src/modelos/agenda.ts`, `app/src/modelos/cuentas.ts` | Horarios, días, tramos, bloques, operaciones y visibilidad profesional. |
| `app/src/pages/agenda.astro`, `panel-barbero.astro`, `setup-barber.astro`, `bloqueos.astro` | Markup original con layout y controladores nuevos. |
| `app/tests/e2e/autenticacion.test.ts` | Rutas ahora funcionales y privacidad sin JavaScript. |
| `app/tests/e2e/servidor-estatico.mjs` | Referencias originales de las cuatro páginas, aisladas y sin scripts. |
| `app/tests/e2e/comparacion-visual.test.ts` | Estabilización de fuentes/tabla y misma superficie para referencias públicas. |
| `app/tests/e2e/autenticacion-visual.test.ts`, `cliente-visual.test.ts`, `reservas-visual.test.ts` | Aplicar la misma precisión de medición a las regresiones visuales anteriores. |
| `app/playwright.config.ts` | Render tipográfico de QA uniforme para original y reconstrucción. |
| `firestore.indexes.json` | Octavo índice: bookings(barberUid,dateStr), para rangos por profesional. |
| `functions/index.js` | Tres exports nuevos de escritura de agenda. |
| `functions/package.json` | Comprobación de los módulos nuevos y unitarias de horarios. |
| `functions/scripts/preparar-datos-reservas.mjs` | Preparación explícita de fixtures profesionales locales. |
| `functions/src/fechas.js` | Suma/enumeración de días de calendario, máximo 366 por operación. |
| `functions/src/permisos.js` | Comprobación transaccional de identidad extraída de reservas para reutilizarla. |
| `functions/src/persistencia-reservas.js` | Importar identidad y control diario compartidos, conservando su protocolo. |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | Nueva suite profesional después de las anteriores. |
| `package.json`, `package-lock.json` | Metadatos de versión 0.7.0. |
| `README.md` | Alcance y exploración con cuentas ficticias. |
| `docs/control-avance.md`, `docs/control-cobertura.md`, `docs/estado-pausa.md` | Estado, cobertura, límites y siguiente fase. |

Son 18 nuevos y 35 modificados; 145 archivos propios versionables. De 132 destinos previstos existen físicamente 111 (110 versionables más .env.local demo ignorado); faltan 21. Hay 35 adiciones justificadas frente al plan. El 84,09 % de presencia no es cobertura funcional ni de pruebas. Los dos módulos backend adicionales separan control compartido y escrituras validadas; no son implementaciones paralelas del cálculo de disponibilidad. El auxiliar de QA evita repetir criterios numéricos en las cinco suites visuales.

## C. Panel y agenda

El UID profesional procede de la sesión. Worker consulta `barberUid == UID` y fecha/periodo; manager/admin pueden consultar la operativa global autorizada. No se descarga toda la agenda para filtrar un worker después. Las consultas están en datos/agenda; presentación en tarjetas-citas y coordinación en sus controladores.

La agenda original es diaria, con input date y filtro de estado; no existe una agenda semanal visual adicional. Se conserva orden por hora, servicio, cliente (nombre y fallbacks originales), profesional, badge y acciones. El detalle está en la tarjeta; no se inventa otra página de cliente ni un modal de datos personales. La consulta es puntual, como en el original, y se repite al cambiar fecha o tras acciones; no se afirma una suscripción realtime inexistente.

Se reutiliza `updateBookingStatus` de fase 5. Pending permite confirmar/cancelar; confirmed permite hecha/no_show/cancelar. Los demás son terminales. Las acciones destructivas/hecha requieren confirmación con los textos originales. Se bloquea doble envío; solo se cambia la tarjeta después del resultado del servidor. Un fallo conserva el estado y permite consultar de nuevo, sin mostrar trazas.

El panel conserva Hoy, Últimos 7 días (hoy y seis anteriores) y Mes actual, calculados en la zona del negocio. Citas/minutos/horas/contadores proceden de reservas del periodo. Se corrige el doble cómputo de la cita antigua reprogramada: cancelled y rescheduled no suman. Se mantienen done/no_show como registros realizados/ocupados según el modelo anterior. «Próximas citas» conserva la lógica original: hasta cinco pending/confirmed de hoy, ordenadas; no se presenta como listado de todas las futuras.

## D. Horario semanal

Se conserva la tabla Domingo–Sábado (índices 0–6), aunque el documento semanal empieza el lunes. La fecha elegida se normaliza a lunes; botones anterior/siguiente y copiar semana pasada. Dos tramos por día, checkbox laboral, intervalo de huecos y «Mostrar en reservas». Defaults originales: días inactivos, 10:00–20:00 y slot 30. No se publican semanas por defecto nuevas.

Al faltar una semana, se usa la plantilla `barbers.schedule` únicamente para rellenar el formulario; no genera disponibilidad hasta guardar/publicar el documento semanal. Copiar lee la anterior y conserva tramos, descansos y publicación en el formulario: no escribe nada hasta Guardar. El destino y su revisión no se sustituyen por los de la semana copiada.

Al seleccionar otra semana se invalida el formulario cargado antes de consultar. Si la lectura falla, Guardar queda deshabilitado y su manejador también rechaza envíos sintéticos: nunca se guarda el formulario anterior en la nueva fecha. Los controles de navegación permiten volver a una semana válida. La prueba provoca una denegación real de lectura en el emulador, sin añadir interruptores de fallo al producto.

Se validan siete días, booleanos, HH:mm, inicio menor que fin, tramos completos/no solapados, al menos un día activo y slot entero 5–1440, coherente con disponibilidad. No hay turnos nocturnos nuevos. Los descansos existentes se preservan aunque el original no ofrece editor para ellos. Un documento legado con más de dos tramos se bloquea para edición antes de truncarlo silenciosamente; requiere revisión de datos o una ampliación autorizada del editor.

Guardar usa `saveWeeklySchedule`, en una transacción: semana, espejo de ficha, publicación, control de días y recibo. Se conservan los campos `days`, `slot`, `weekStart`, `published`, `publishedAt`, `schedule`, `lastConfiguredWeekStart`, `lastPublishedWeekStart`. Se añade `revision` (ausente equivale a cero) y se exige expectedRevision para evitar sobrescribir un formulario antiguo. No se cambia el esquema existente ni se ejecuta una migración.

Worker siempre usa su UID, ignorando barberUid ajeno de la URL. Gestión puede seleccionar fichas, incluidas ocultas, como en el original. Una ficha propia ausente se crea al guardar explícitamente la primera semana, usando identidad/perfil actuales; las existentes no se reactivan. Una semana publicada de un profesional oculto no ofrece reservas: se informa sin afirmar falsamente que ya aparece en el selector.

## E. Bloqueos

Se conservan exception, break, internal y vacation; los tres primeros tienen dateStr/start/end, y vacaciones startDate/endDate inclusivos. Un día completo se representa mediante vacaciones con inicio y fin iguales; no se inventa otro tipo. Se muestran los bloques actuales/futuros, ordenados por fecha/hora, profesional y motivo, con confirmación de eliminación. No existía editor de bloque: edición directa se marca no aplicable.

Crear y eliminar usan `createScheduleBlock` y `deleteScheduleBlock`, respectivamente. Se comprueban sesión/correo/rol vigentes, propietario profesional, tipo, calendario real, horas, motivo hasta 500 caracteres y rango máximo de 366 días por operación. Este límite protege el tamaño de la transacción de controles diarios; no es un nuevo límite de anticipación para reservas.

Una solicitud exacta repetida con requestId devuelve el mismo resultado; otro requestId para el mismo tipo/intervalo se rechaza como duplicado. Se permite la superposición de bloques distintos, que siguen restando disponibilidad. Eliminar solo borra el bloque autorizado y actualiza controles; nunca borra citas ni sus locks. createdBy procede del servidor, no del navegador.

## F. Excepciones y prioridades

El original usa exception como intervalo de indisponibilidad, igual que pausa/interno. No ofrece aperturas positivas ni sustitución de jornada. La prioridad se conserva: profesional/servicio activos y semana publicada → día y tramos → descansos/bloques/vacaciones → ocupación por citas/locks. Un bloque nunca amplía horarios ni anula una cita automáticamente.

## G. Integración, atomicidad y fechas

Los tres endpoints son adiciones justificadas: las escrituras SDK originales no validaban todos los intervalos ni coordinaban cambios con reservas. Se mantienen las reglas Firestore cerradas para escritura de negocio y se valida en backend. Los nueve exports originales ya reconstruidos mantienen sus nombres/contratos; ahora hay además tres nuevos. Los otros cuatro originales siguen pendientes de sus fases.

Todas las escrituras usan los mismos documentos `bookingLocks/control_{barberUid}_{dateStr}` que crear/cancelar/reprogramar/cambiar estados. Guardar semana participa en sus siete días; vacaciones en todos sus días inclusivos. Se leen controles, perfil, catálogo profesional, configuración y ocupación antes de escribir. Una carrera provoca revalidación; no se confía solo en consultar y después escribir un documento distinto.

Un nuevo bloqueo que solape citas pending/confirmed/done/no_show u ocupación conservada se rechaza. Una jornada que deje una cita fuera de sus tramos o dentro de un descanso también se rechaza; no se exige que una cita ya acordada se alinee con una cuadrícula nueva. Despublicar cierra nuevas reservas y conserva las existentes si siguen cabiendo. Locks legados/huérfanos se tratan de manera conservadora; no se limpian automáticamente.

Los recibos de agenda se guardan como request_guard en `bookingLocks/agenda_operacion_{hash}` con huella y resultado; sin payload sensible completo. El requestId se asocia al actor y no puede reutilizarse con datos diferentes. Confirma una operación realizada, no sustituye una lectura del estado actual. Después del éxito se recarga la semana/listado.

En el navegador, datos/requestId se conservan por UID y área en memoria/sessionStorage, sin contraseñas ni tokens adicionales. Ante respuesta incierta se ofrece Comprobar guardado/operación y se bloquea otro envío; puede recuperarse tras recargar. Si sessionStorage está deshabilitado solo hay recuperación en memoria. Salir/cambiar identidad limpia los datos temporales; los errores de sesión no provocan un reintento nuevo automático.

Se reutilizan validadores y conversiones de fase 5: timezone/tz del negocio, fallback Madrid, fechas ISO validadas, UTC para timestamps e intervalos semiabiertos. Un fin puede coincidir con el siguiente inicio. No se usan horas del navegador como autoridad. Se rechazan endpoints horarios inexistentes y bloques que crucen un cambio horario que HH:mm no pueda representar; vacaciones completas siguen fechas locales incluso con DST. Las reservas nuevas conservan el horizonte de 30 días; la planificación profesional no hereda artificialmente ese límite.

Se añade el índice bookings(barberUid,dateStr) para rangos por profesional; total ocho. No se despliega. Emuladores no certifican índices productivos ni concurrencia con escritores externos que omitan el protocolo.

## H. Seguridad

| Operación | Cliente | Worker | Manager/admin |
|---|---|---|---|
| Área profesional / agenda | No | Asignada al UID | Global autorizada |
| Leer semana no publicada | No | Propia | Sí |
| Guardar semana / publicar / copiar | No | Propia | Profesional seleccionado |
| Crear/eliminar bloques | No | Propios | Profesional autorizado |
| Cambiar estado | No | Cita asignada, transición válida | Transición válida |
| Escritura SDK de citas/semanas/bloques/locks | No | No | No; se usan callables |
| Roles, usuarios y configuración administrativa | No | No | Continúan en sus fases; no se abren aquí |

Las comprobaciones Auth/perfil/versión se reutilizan, incluida validación del perfil dentro de la transacción. Cambiar identidad/rol invalida respuestas pendientes y vacía las pantallas. Una renovación transitoria del token no destruye un formulario editado. Guards y reglas/backend siguen protegiendo datos aunque se manipule el DOM o una URL. Todos los datos de catálogo, nombres, cliente y motivo se insertan como texto; HTML queda limitado a plantillas constantes.

## I. Correspondencias

| Origen | Destino / nombre nuevo |
|---|---|
| agenda.client.ts | profesionales/agenda-diaria + tarjetas-citas + datos/agenda |
| renderAgenda / loadDay / handleStatusChange | mostrarAgenda / cargarAgendaDia / cambiarEstadoCita |
| panel-barbero.client.ts, renderStats/renderNext/loadStats | panel-profesional, mostrarResumen/mostrarCitasDelDia/cargarResumen |
| setup-barber.client.ts | editar-horario + formulario-horario; SDK fuera del controlador |
| getRowRefs/fillForm/readForm/normalizeDayCfg | obtenerCamposDia/rellenarFormularioHorario/leerFormularioHorario/normalizarDiaHorario |
| loadWeekSchedule/loadTarget | cargarHorarioSemanal/cargarProfesionalSeleccionado |
| bloqueos.client.ts | bloqueos + formulario-bloqueo + datos/agenda + callables nuevos |
| refreshTypeView/blockLabel/deleteBlock | mostrarCamposTipoBloqueo/describirBloqueo/eliminarBloqueo |
| currentUid/currentRole/bookingsCache/barberNames | contexto.usuario.uid/rol, citasCargadas, nombres |
| currentTargetUid/currentWeekStart/currentWeeklyDoc | uidObjetivo/semanaActual/semanaCargada |
| ProfessionalRow, tipos any locales | Profesional, Cita, HorarioSemanal, SemanaProfesional, Bloqueo y OperacionAgenda |
| yyyymmdd/week locales | formatearFechaNegocio/obtenerLunesSemana/sumarDiasCalendario |
| statusLabel/statusClass | Etiquetas/clases compartidas con variante Agenda; se conserva Reprogramada y color púrpura |
| requireRole/guards de página | Política central + observarAreaProfesional |
| Layout/Navbar/UI | DisenoPrincipal/BarraNavegacion/avisos existentes |

Se mantienen URLs, barberUid, IDs de campos/botones, day=domingo0, nombres de colecciones y campos. Las importaciones apuntan a módulos reales. No se crean clases artificiales ni stubs de funcionalidades administrativas.

## J. Pruebas y comparación

| Comprobación | Resultado ejecutado |
|---|---|
| Base de fase 6 | 28 unitarias, 37 integraciones, 142 navegador; check/build correctos. |
| Unitarias actuales | 33 correctas: 24 app y 9 backend. |
| Nuevas integraciones | Once correctas, añadidas a las 37 anteriores. |
| Navegador dirigido inicial | 18 recorridos profesionales correctos; 16 comparaciones visuales profesionales correctas. |
| Primera suite completa | 33 unitarias y 48 integraciones correctas; 175/176 navegador por geometría subpíxel en Planes. No se registra como verde. |
| Comparación pública dirigida | 12 correctas después de calibrar el render de QA y la precisión geométrica; los intentos anteriores fallidos no se cuentan como verdes. |
| Pase con nueva prueba de lectura | 20 recorridos profesionales correctos; 177/178 navegador por 1/64 CSS px en agenda listada de escritorio. No se registra como verde. |
| Pase con precisión geométrica profesional | 174/178 navegador: redondeo en dos vistas de cliente, rasterizado de Legal y preparación prematura del cambio de identidad móvil. No se registra como verde. |
| Último pase completo | `npm test`, salida 0: check sin errores/warnings/hints, 33 unitarias, 48 integraciones y 178 pruebas de navegador (50 visuales incluidas, ninguna omitida); build de 27 páginas. |

Integraciones: propiedad/consulta de agenda, bloques y perfiles; escrituras directas denegadas; semana y espejo atómicos, publicación, descansos, idempotencia y versión; parámetros/horas/fechas manipulados; roles, invitado y correo pendiente; tipos de bloqueo, duplicados, vacaciones inclusivas y eliminación ajena; cita visible en agenda, conflicto y jornada incompatible sin cambios parciales; ficha ausente/oculta. Carreras nuevas: bloque contra alta, jornada contra alta, bloque contra reprogramación, dos guardados y repetición simultánea del mismo bloque.

Navegador: panel/agenda propia, orden/filtros/vacío; confirmar/hecha y Escape; validación de solapes, persistencia, día no laborable y copia sin guardar; configurar semana→reservar como cliente→ver agenda→bloquear intervalo compatible→modificar jornada→cancelar→recuperar disponibilidad; vacaciones y eliminación confirmada; respuesta de creación perdida después del commit y recuperada tras recarga; selección autorizada de manager/admin; UID ajeno ignorado y cambio de identidad durante respuesta retenida. Se repiten las suites completas de fases 4–6 y privacidad sin JavaScript.

La revisión final añadió un décimo caso funcional por dispositivo: lectura fallida de otra semana, bloqueo del guardado de datos anteriores y recuperación por navegación. Se interrumpió expresamente el pase que estaba en curso para incorporar la corrección y reconstruir; ese pase parcial no se cuenta como resultado completo.

Referencia visual: dist original aislado y funciones de presentación originales, con imports/inicialización/escritores Firebase eliminados y adaptadores de datos locales. Los datos ficticios se obtienen mediante consultas autorizadas. Ocho estados × escritorio/móvil: agenda vacía/listada, panel, horarios worker/manager y bloques vacío/listado/vacaciones. El panel recibe el mismo conjunto de citas legítimas en ambas superficies; el cambio de conteo de rescheduled se verifica funcionalmente y se documenta aparte. No se ejecuta el backend original.

Se comparan texto, geometría, fuentes/colores y capturas. El criterio final común mantiene threshold 0.1 y admite como máximo 0,03 % de píxeles distintos en imágenes (antes 0,01 %). La geometría medida de las cinco suites admite como máximo 1/16 CSS px de diferencia; los estilos medidos siguen siendo exactos. Se comprueban también posición vertical y peso tipográfico profesional. No se rediseñan las pantallas. Se añadieron etiquetas accesibles, bloqueo de controles durante operaciones y mensajes de conflicto/recuperación. La ficha oculta conserva su estado y no recibe una confirmación falsa de visibilidad.

Incidencias resueltas durante pruebas: una aserción leía el texto estático de éxito todavía oculto y recargaba antes del resultado, activando correctamente la recuperación; ahora exige visibilidad. Algunos originales tienen BOM: el aislamiento visual debe retirarlo antes de eliminar sus imports, para no emitir un módulo CommonJS. Se añadió el predicado de rol al adaptador visual local.

Planes presentó diferencias de 1/64–1/32 píxel en anchos intrínsecos; se carga explícitamente Manrope, se recalculan las tablas y se admitió inicialmente un máximo de 1/16 CSS px solo en la medición geométrica pública. Otros pases dirigidos detectaron 251 píxeles en bordes de letras de Legal y 163/170 en Inicio/Ayuda, con geometría idéntica. Cambiar de superficie no bastó por sí solo. Se fijó el render de texto de QA con `--disable-lcd-text` y `--disable-font-subpixel-positioning`, por igual para original y nuevo. En ese intento se conservó la tolerancia de imágenes y el pase público posterior dio 12/12. Los flags y su efecto tipográfico están descritos en el [código de Chromium](https://chromium.googlesource.com/chromium/src/%2B/c46abcfee2e9cc108441ea9fba406548671840ed/ui/gfx/switches.cc). Estas capturas normalizadas no certifican el antialias de todos los dispositivos físicos.

Un pase posterior completo pasó 177/178 pruebas, incluida la recuperación de lectura en ambos dispositivos, pero midió diferencias de 1/64 CSS px en anchos de título/texto/botones de la agenda de escritorio. Se extendió el mismo margen geométrico de 1/16 a esas comparaciones, cargando explícitamente los pesos de Manrope en ambas superficies; estilos exactos y umbral de imágenes permanecen iguales. No se modifica el producto para esta calibración. Su log fallido se conserva en `fase7-subpixel-agenda.log`.

El siguiente pase detectó el mismo redondeo de 1/64 en badges/botones de Mis citas y 201 píxeles distintos en Legal. Se inspeccionó su imagen de diferencias: cambios aislados en bordes de letras, sin desplazamiento de distribución ni cambios de texto/estilos. Se unificó la comparación geométrica y se calibró explícitamente el máximo de imágenes a 0,03 %, manteniendo threshold 0.1; no se cambiaron referencias ni CSS para ocultar cambios. El margen sigue acompañado de igualdad de textos y estilos y geometría de 1/16 CSS px.

Ese pase también agotó los cinco segundos de la prueba móvil de cambio de cuenta. El fixture modificaba IndexedDB mientras la segunda pestaña aún podía inicializar Auth y restaurar la cuenta anterior. Ahora espera a que esa pestaña muestre el menú profesional antes de cambiar su persistencia, activa la pestaña observada y permite hasta 15 segundos de propagación del SDK, como la prueba equivalente de fase 6. No se añade un bypass de sesión al producto ni se libera la respuesta retenida antes de verificar el rechazo de acceso.

Evidencias locales ignoradas: `.verificacion/base-fase7.log`, `check-fase7.log`, `unitarias-fase7.log`, `profesional-integracion.log`, `personal-navegador.log`, `personal-visual.log`, `publicas-fase7.log`, `fase7-subpixel-agenda.log`, `fase7-rasterizado-identidad.log`, `fase7-completa.log` y `app/.verificacion/referencia`. Los logs de emuladores solo contienen cuentas ficticias y no se versionan.

## K. Pendientes y cierre de alcance

Auditoría `npm audit --json` repetida por paquete: raíz 14 moderadas; app 22 (9 moderadas, 10 altas, 3 críticas); Functions 21 (15 moderadas, 6 altas). No se suman entre paquetes ni se presentan como vulnerabilidades explotadas. Se conservan en `.verificacion/auditoria-{raiz,app,functions}-fase7.json`. No hubo dependencias nuevas ni migración mayor en esta fase. Los avisos heredados requieren revisión antes de publicar o certificar seguridad productiva.

Fase 8: administración de usuarios/roles, equipo, servicios, resumen semanal y configuración autorizada. Fase 9: estadísticas administrativas, CSV, recordatorios y herramientas auxiliares restringidas. Fases finales: Safari/dispositivo físico, comparación global, auditoría y documentación final. No hay envío real de correos, jobs activados, pagos ni funciones inventadas.

Datos legados inválidos, semanas con más de dos tramos y limpieza de ocupaciones huérfanas requieren revisión explícita; no se destruyen ni se ignoran para forzar disponibilidad. La exclusión concurrente requiere todos los escritores usando este backend/protocolo. Emuladores no certifican firmas, índices ni límites de un despliegue productivo. No se modifica el original ni se despliega nada.

Verificación de cierre: 10 de noviembre de 2026, 07:29 UTC. Fase 7 implementada y comprobada en entorno local: 33 unitarias, 48 integraciones y 178 pruebas de navegador correctas, incluidas 20 funcionales profesionales y 50 visuales totales. Astro/TypeScript sobre 87 archivos y comprobación backend sin diagnósticos; build de 27 páginas. Se conservan 94 hashes originales coincidentes y todos los cambios en la rama `fase-7-profesional`. Los puertos de desarrollo, servidores de comparación y emuladores quedan libres; no hay una ejecución crítica pendiente.

Se actualizan README, avance, cobertura y estado-pausa. Se guarda el cierre mediante commit local, sin push ni despliegue. La fase está completada en su alcance local con las limitaciones anteriores; no equivale a certificación productiva ni a completar las fases restantes. Se presenta el informe y se detiene el trabajo. No se inicia fase 8 automáticamente.
