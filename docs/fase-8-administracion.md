# Fase 8 — administración

Estado: completada y verificada en entorno local. Solicitud vigente: prompt maestro de fases 8–12, con autorización posterior de publicación en GitHub. Referencia de diez horas sin imputación ficticia. Solo emuladores y cuentas de prueba. Base comprobada: commit 0815d8d, check y 33 unitarias repetidas correctamente; el log completo previo conserva 48 integraciones y 178 pruebas de navegador.

## Funcionalidades y correspondencias

Se reconstruyen `/admin`, `/admin/usuarios`, `/equipo`, `/servicios`, `/branding`, `/horarios` e `/index-admin`. Las siete páginas conservan el marcado visual original, con DisenoPrincipal y protección central. Hay seis módulos administrativos previstos y el controlador de entrada del personal. [Mapa de archivos](mapa-archivos.md) y [símbolos](mapa-simbolos.md) recogen los destinos, funciones y decisiones reales.

Usuarios busca por correo exacto; no existe edición general de perfiles ni estados de cuentas en esta pantalla original. Cambia roles con adminSetClaims existente y muestra ficha oculta, ausente, sin semana, guardada o publicada. Equipo permite nombre y visibilidad; email y asociación siguen siendo datos autorizados, no campos editables. Enter/blur/change no duplican escrituras. Horarios resume semana actual, incluidos ocultos, y abre el editor de fase 7.

Servicios conserva alta, nombre, minutos, precio, checkbox y activar/desactivar. No existe borrar, editar descripción ni reordenar manualmente. Ordenación por nombre del servidor, como original. El cambio de precio/duración se aplica a próximas operaciones; snapshots y timestamps de reservas guardadas permanecen intactos.

Branding realmente contiene reglas de agenda: zona horaria, margen de cancelación y ventanas de recordatorios. No hay nombre comercial, logo ni colores editables. `/admin` es una portada de herramientas y `/index-admin` la entrada del personal, no un dashboard con métricas inventadas. El resumen diario de `/panel` queda para fase 9 según el mapa aprobado.

## Seguridad y operaciones Firebase

| Operación | Client/worker | Manager | Admin |
|---|---|---|---|
| Entrada del personal | Solo worker | Sí | Sí |
| Usuarios / cambio de rol | No | No | Sí, adminSetClaims |
| Equipo / servicios | No | Sí | Sí |
| Resumen semanal | No | Sí | Sí |
| Reglas de agenda | No | No | Sí |
| Escritura SDK de negocio | No | No | No |

Se añaden saveTeamProfile, saveService y saveAgendaSettings en functions/src/administracion.js. ComprobarSesion valida Auth, correo, rol y versión actuales; la identidad se comprueba también dentro de la transacción. Solo se escriben campos expresamente permitidos, no roles, emails, vínculos, horarios ni flags demo enviados por el navegador. No se relajan reglas Firestore.

Cada escritura participa en una transacción con adminRevision, expectedRevision y recibo idempotente compartido de control-agenda. Dos formularios antiguos no se sobrescriben; el mismo requestId recupera el resultado sin duplicar una creación. Las operaciones pendientes se conservan por UID y área mediante el mecanismo existente. Cambio de identidad/rol limpia la interfaz e invalida respuestas pendientes.

La sincronización de ficha realizada por adminSetClaims también incrementa adminRevision. Así, un formulario de Equipo abierto antes de un cambio de rol no puede sobrescribir el nombre o la visibilidad recién sincronizados. La integración específica comprueba el rechazo y la conservación del nuevo rol/ficha. El contrato público de roles no cambia.

El motor de reservas ya lee servicio, ficha y configuración dentro de sus transacciones; las modificaciones concurrentes provocan revalidación. No se introduce otro cálculo de disponibilidad. Cambiar zona horaria con citas presentes/futuras ocupantes se rechaza: reinterpretarlas sin migración alteraría sus fechas/timestamps. El precio y duración históricos no se reescriben. Los campos de control son adiciones compatibles; no se migra producción.

## Validaciones y diferencias justificadas

Nombres no vacíos de hasta 100 caracteres. Duración entera de 5–1440 minutos en pasos de cinco, coherente con los campos originales; precio numérico finito no negativo; visibilidad booleana. Se comprueban zonas reales con Intl, margen positivo y todas las ventanas positivas/finitas; máximo técnico de 20 ventanas para acotar peticiones. Los duplicados se normalizan, los valores inválidos no se descartan silenciosamente.

Se insertan datos con textContent/value, sin interpolar nombres o emails en HTML. Se bloquean dobles envíos y guardados desde una carga fallida; el éxito requiere confirmación del servidor. Errores comprensibles sin trazas; una respuesta incierta permite comprobar la misma operación. No se inventan nuevas capacidades de administración.

## Pruebas y estado

La implementación pasa Astro/TypeScript sin diagnósticos y compila 27 páginas. Nueve integraciones nuevas superadas junto con las 48 anteriores: matriz de roles y SDK cerrado; creación idempotente simultánea; parámetros inválidos; dos ediciones concurrentes; conservación de vínculo/rol/email/semana; reglas y flags; conflicto de zona; duración nueva frente a snapshot histórico; invalidación del formulario de Equipo tras cambiar el rol. Dos unitarias nuevas validan entradas extremas y ventanas inválidas.

Navegador: ocho recorridos nuevos por dispositivo y nueve estados visuales por dispositivo, usando original aislado y funciones de presentación originales con adaptadores locales de solo lectura. Incluye un rechazo real del backend al crear servicio, conservación del formulario y envío posterior corregido. No se ejecuta el SDK original.

El primer pase completo dio 209/210 pruebas de navegador: todos los recorridos funcionales pasaron, pero la entrada del profesional móvil se midió antes de que terminara la restauración de Auth. El menú copiado a la referencia aún podía ser el de invitado, con distinta altura. La comparación espera ahora a que desaparezca data-auth-pending y a que el enlace profesional sea visible antes de copiar la navegación. No se amplía la tolerancia ni se cambia el diseño. Log fallido conservado en `.verificacion/fase8-captura-menu.log`. Se amplió también la prueba sin JavaScript a las 18 rutas privadas.

El pase siguiente dio 210/210. Tras añadir el caso de versión de equipo y el de error definitivo de servicio, el pase ampliado dio 211/212, con estilos coincidentes pero 5/64 CSS px de diferencia geométrica en el resumen semanal. Se calibra exclusivamente la suite administrativa a 1/8 CSS px; las demás mantienen 1/16, y todas conservan estilos medidos exactos y el máximo de 0,03 % de rasterizado. No se modifica CSS ni se sustituyen las referencias. Logs conservados: `.verificacion/fase8-base-administracion-verde.log` y `.verificacion/fase8-redondeo-horarios.log`.

Resultado final ejecutado: `npm test`, salida 0, 35 unitarias (24 app y 11 backend), 57 integraciones y 212 pruebas de navegador correctas, ninguna omitida. Incluye 16 recorridos administrativos y 68 comparaciones visuales totales, 18 nuevas. Build de 27 páginas. Astro/TypeScript informa cero errores, warnings y hints sobre 96 archivos; `npm run check` independiente también termina con salida 0. En el arranque de Astro aparece un mensaje auxiliar de esbuild «The build was canceled», aunque checker y build concluyen correctamente; queda registrado para la revisión de herramientas/dependencias de fase 11, sin ocultarlo como una salida totalmente silenciosa.

El inventario contiene 162 archivos propios versionables: 119 destinos planificados presentes físicamente (118 versionables y .env.local demo ignorado), 13 pendientes y 44 adiciones justificadas frente al plan. La presencia del 90,15 % no es cobertura funcional ni de pruebas. Se actualizan README, avance, cobertura, mapas y estado-pausa. El trabajo se ha realizado con asistencia de Codex; no se inventan horas reales ni autoría manual.

Pendientes: panel diario, KPIs, CSV, diagnóstico, recordatorios y herramientas demo en fase 9; pausa obligatoria antes de fase 10; comparación integral, revisión de dependencias/seguridad y entrega después. Los avisos heredados no se dan por resueltos ni se certifica producción. No se ha operado sobre producción ni modificado el original. La instrucción posterior autoriza subir el estado comprobado a GitHub, identificándolo como reconstrucción todavía en curso.

<!-- inicio-inventario -->
## Inventario de cambios de fase 8

17 archivos nuevos y 29 modificados respecto a 0815d8d. Se excluyen dependencias, compilaciones, emuladores, capturas y configuracion demo ignorada.

### Creados

| Archivo | Responsabilidad |
|---|---|
| `app/src/modulos/administracion/equipo.ts` | Editar el nombre y la visibilidad de profesionales. |
| `app/src/modulos/administracion/reglas-agenda.ts` | Leer y editar las reglas generales de la agenda. |
| `app/src/modulos/administracion/resumen-horarios.ts` | Presentar el estado de las semanas de cada profesional. |
| `app/src/modulos/administracion/servicios.ts` | Crear, editar y activar o desactivar servicios. |
| `app/src/modulos/administracion/tarjeta-usuario.ts` | Representar usuarios y su preparación operativa con texto seguro. |
| `app/src/modulos/administracion/usuarios.ts` | Buscar usuarios por correo y coordinar cambios de acceso. |
| `app/src/modulos/navegacion/inicio-equipo.ts` | Mostrar las opciones de entrada del personal según su rol. |
| `app/tests/e2e/administracion-visual.test.ts` | Nueve estados originales aislados por dispositivo. |
| `app/tests/e2e/administracion.test.ts` | Roles, equipo, catálogo y configuración. |
| `docs/ejecucion-fases-8-12.md` | Autorizacion, orden, pausa obligatoria y estado recuperable del bloque. |
| `docs/fase-8-administracion.md` | Alcance, decisiones, seguridad, pruebas e inventario de esta fase. |
| `docs/mapa-archivos.md` | Correspondencias reales con los originales administrativos. |
| `docs/mapa-simbolos.md` | Nombres implementados y contratos conservados. |
| `functions/src/administracion.js` | Validar y guardar equipo, servicios y reglas en transacciones idempotentes. |
| `functions/tests/emuladores/administracion.test.mjs` | Nueve integraciones de permisos, concurrencia, snapshots y configuracion. |
| `functions/tests/emuladores/datos-administracion.mjs` | Preparar dos cuentas/perfiles y servicios ficticios sin modificar produccion. |
| `functions/tests/unit/administracion.test.mjs` | Validacion pura de nombres, precios, duraciones, zonas y ventanas. |

### Modificados

| Archivo | Responsabilidad |
|---|---|
| `README.md` | Mapa de entrada y comandos locales; completar para entrega. |
| `app/src/comun/errores.ts` | Traducir errores Auth/Functions a mensajes de interfaz sin ocultar causas. |
| `app/src/comun/permisos.ts` | Esperar sesión, verificar correo, exigir rol y conservar el guard PRO inactivo. |
| `app/src/datos/catalogo.ts` | Consultas y escrituras del catálogo de servicios. |
| `app/src/datos/configuracion.ts` | Lectura y edición autorizada de config/app. |
| `app/src/datos/funciones-remotas.ts` | Adaptar los seis callables usados por la interfaz sin cambiar nombres públicos. |
| `app/src/datos/personas.ts` | Consultas y escrituras de usuarios y profesionales; búsquedas y fichas. |
| `app/src/modelos/agenda.ts` | Servicio, Cita, EstadoCita, HuecoDisponible, HorarioSemanal, DiaHorario, TramoHorario y Bloqueo. |
| `app/src/modelos/cuentas.ts` | Rol, PerfilUsuario y Profesional; DTO con campos Firestore conservados. |
| `app/src/pages/admin/index.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/admin/usuarios.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/branding.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/equipo.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/horarios.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/index-admin.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/src/pages/servicios.astro` | Conservar ruta y marcado visual; conectar con el módulo específico. |
| `app/tests/e2e/autenticacion.test.ts` | Integrar administracion y mantener referencias y pruebas coherentes. |
| `app/tests/e2e/comparar-presentacion.ts` | Margen geometrico parametrizado; estilos e imagenes conservan su comprobacion. |
| `app/tests/e2e/servidor-estatico.mjs` | Servidor local del dist reconstruido; nunca ejecutar sobre el original. |
| `docs/control-avance.md` | Estado vigente e historial conservado. |
| `docs/control-cobertura.md` | Separar implementacion, pruebas y pendientes. |
| `docs/estado-pausa.md` | Recuperacion y condiciones de la pausa antes de fase 10. |
| `functions/index.js` | Entrada ESM; reexportar los trece contratos con sus nombres exactos. |
| `functions/package.json` | Conservar ESM y Node 20 de runtime; ampliar scripts de pruebas sin importar backend productivo. |
| `functions/scripts/preparar-datos-reservas.mjs` | Integrar administracion y mantener referencias y pruebas coherentes. |
| `functions/src/cuentas.js` | Incrementar la revision administrativa al sincronizar una ficha por cambio de rol. |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | Ejecutar solo pruebas locales; distinguir omitido, fallido y aprobado sin falsos verdes. |
| `package-lock.json` | Mantener el bloqueo raíz; regenerar solo si cambia su manifiesto en la reconstrucción. |
| `package.json` | Coordinar scripts de frontend, backend y pruebas sin monorepo adicional. |

<!-- fin-inventario -->
