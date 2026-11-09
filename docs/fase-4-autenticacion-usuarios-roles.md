# Fase 4 — autenticación, usuarios, roles y seguridad

Fecha: 9 de noviembre de 2026. Rama local: `fase-4-autenticacion`. Alcance: exclusivamente `BarberPro-M13`. Referencia de trabajo: 8 horas; no se imputa esa estimación como tiempo trabajado. No hay un registro continuo de horas efectivas.

## A. Resumen e inspección inicial

Se han implementado autenticación real con Firebase en emuladores, registro de clientes, verificación/reenvío, edición y recuperación de perfil, estado compartido de sesión, navegación y guards de las 18 rutas privadas, cuatro roles y autorización en Firestore/Functions. No hay autenticación simulada. No se ha iniciado fase 5 ni se han desplegado servicios.

Fuentes revisadas: original `../treball-barberia`, planificación `../BarberPro-M13-Planificacion/docs` (arquitectura, mapa de archivos, mapa de símbolos e inventario de funciones, rutas/roles, funcionalidades, plan, cobertura y contratos), e informes de fase 3 y pausa. La pausa era un registro histórico; la nueva instrucción autoriza expresamente fase 4. Se ha contrastado el contenido de los 94 originales con los SHA-256 de `referencia-original.md`: 94 iguales, cero diferencias.

La base inicial pasó Astro/TypeScript (0 errores, warnings y hints), 7 tests unitarios y build de 27 páginas. Las 21 vistas reservadas no tenían autenticación. El original tenía registro, acceso, salida, verificación y perfil; **no tenía recuperación de contraseña**, por lo que no se añade. Sus roles canónicos son `client`, `worker`, `manager`, `admin`. El responsable puede consultar usuarios y operativa global, pero `/admin` y la asignación de roles son exclusivamente del administrador.

Problemas originales corregidos: selección del rol propio mediante flags demo; errores que distinguían cuentas inexistentes; listeners independientes y respuestas tardías de sesiones previas; campos de perfil insuficientemente limitados; guards que liberaban la vista antes de terminar la autorización; y permisos que seguían vigentes en un token antiguo después de cambiar el rol. Se mantiene el comportamiento correcto de las pantallas y sus URLs.

**Estado de entrega:** implementación funcional local; los resultados finales figuran en G. Los avisos críticos heredados de dependencias requieren revisión antes de cerrar una entrega sin pendientes de seguridad o publicar. No se certifica seguridad de producción ni se presenta el proyecto completo como terminado.

## B. Organización y archivos

Rutas relativas a la raíz del proyecto. Las dependencias/compilaciones/evidencias se excluyen del inventario propio.

| Archivo creado | Responsabilidad |
|---|---|
| `app/src/comun/errores.ts` | Traducción de errores Auth y de envío sin detalles internos. |
| `app/src/comun/formularios.ts` | Validación reutilizada de correo, credenciales y contacto; bloqueo real de controles. |
| `app/src/comun/permisos.ts` | Política única de rutas, etiquetas, destinos, comprobaciones y guard PRO inactivo. |
| `app/src/datos/personas.ts` | Perfil propio: escucha, lectura, creación idempotente y edición limitada. |
| `app/src/datos/sesion.ts` | Operaciones SDK y único estado de identidad por documento. |
| `app/src/modulos/cuentas/iniciar-sesion.ts` | Formulario y redirección del login. |
| `app/src/modulos/cuentas/crear-cuenta.ts` | Formulario de alta y manejo de cuenta parcialmente creada. |
| `app/src/modulos/cuentas/verificar-correo.ts` | Consumo único de códigos, mensajes y destinos. |
| `app/src/modulos/cuentas/editar-perfil.ts` | Contacto, verificación, recuperación del perfil y salida. |
| `app/src/modulos/navegacion/barra-navegacion.ts` | Actualización del menú/avatar/tarjeta del equipo, salida y activación del guard central. |
| `functions/src/permisos.js` | Identidad vigente, correo, expiración, revocación, rol y autorización administrativa. |
| `functions/src/cuentas.js` | `adminSetClaims`, `setMyRole`, `whoAmI`, versiones y sincronización profesional. |
| `functions/scripts/asignar-roles.mjs` | Asignación local por UID explícito, simulación predeterminada. |
| `functions/scripts/normalizar-roles.mjs` | Normalización individual a partir de claims, nunca de un perfil editable antiguo. |
| `functions/scripts/emuladores-locales.mjs` | CLI fijada, proyecto demo, configuración aislada y arranque/pruebas. |
| `functions/tests/emuladores/ejecutar-pruebas.mjs` | Integración, build demo y Playwright; propaga fallos. |
| `functions/tests/emuladores/permisos.test.mjs` | Reglas y callables reales con cuentas ficticias y ataques directos. |
| `functions/tests/unit/cuentas.test.mjs` | Entorno, roles legados y UID. |
| `app/tests/unit/formularios.test.ts` | Entradas inválidas y mensajes sin enumeración de cuentas. |
| `app/tests/unit/sesion.test.ts` | Listener único, carreras de sesión, alta parcial, fallo de correo y política. |
| `app/tests/e2e/autenticacion.test.ts` | Flujos reales, cuatro roles, URL directa, persistencia, red, pestañas y ausencia de JavaScript. |
| `app/tests/e2e/autenticacion-visual.test.ts` | Comparación contra el dist original aislado de las cuatro pantallas. |
| `docs/fase-4-autenticacion-usuarios-roles.md` | Este informe. |
| `docs/control-cobertura.md` | Cobertura funcional actual y correspondencia con el plan histórico. |

| Archivo modificado | Cambio |
|---|---|
| `app/src/datos/firebase.ts` | Inicialización Auth por contraseña, persistencia y los tres emuladores antes de exponer SDK. |
| `app/src/modelos/cuentas.ts` | PerfilUsuario, UsuarioSesion y EstadoSesion; campos externos conservados. |
| `app/src/components/BarraNavegacion.astro` | Importa el controlador compartido; conserva marcado. |
| `app/src/layouts/DisenoPrincipal.astro` | Vista pendiente desde HTML, aviso accesible y CSP para aislamiento local. |
| `app/src/styles/tailwind.css` | Oculta main privado hasta autorizar; sin datos privados en HTML. |
| `app/src/pages/login.astro`, `registro.astro`, `verify.astro`, `perfil.astro` | Formularios y marcado originales, scripts nuevos y mensajes accesibles. |
| `app/tests/unit/configuracion.test.ts` | Mock del inicializador Auth y límites del entorno. |
| `app/tests/e2e/acceso.test.ts` | Adapta expectativas de fase 3 a los guards reales. |
| `app/tests/e2e/comparacion-visual.test.ts` | Espera al invitado y mide elementos de la página, excluyendo el aviso común oculto. |
| `app/tests/e2e/servidor-estatico.mjs` | Referencias de autenticación sin ejecutar scripts originales. |
| `firestore.rules` | Perfiles, inmutabilidad de privilegios, roles vigentes y lecturas autorizadas. |
| `functions/src/firebase.js` | Admin diferido exclusivamente en los dos emuladores demo. |
| `functions/index.js` | Cuatro exports públicos reales; no crea exports vacíos de negocio. |
| `functions/package.json`, `functions/package-lock.json` | SDK de pruebas/reglas fijado, scripts y Node 20. |
| `package.json`, `package-lock.json` | CLI fijada y comandos de integración. |
| `README.md`, `docs/control-avance.md`, `docs/estado-pausa.md` | Arranque, resultados actuales y sustitución del punto histórico de reanudación. |

`comun/formularios.ts` y el lanzador de emuladores son adiciones justificadas al manifiesto: validaciones compartidas usadas realmente y aislamiento de la CLI sin credenciales. Las pruebas específicas y estos informes amplían el plan sin duplicar implementaciones. `storage.rules`, la configuración Firebase de puertos y el informe de fase 3 se conservan.

## C. Funcionamiento

Flujo de lectura del código: modelos → datos/firebase → datos/personas y datos/sesion → comun/permisos/errores/formularios → controladores de página/barra. Los módulos de datos no importan interfaz ni guards. En servidor: firebase → permisos → cuentas → exports.

**Registro:** nombre obligatorio (hasta 100), teléfono opcional (hasta 30), correo válido, contraseña mínima de 6 y confirmación. Se deshabilitan controles y se rechaza doble envío. Auth crea la cuenta y el perfil se crea transaccionalmente solo si no existe, con `role=client`, `roleVersion=0`, email del token y fechas del servidor. No se guardan contraseñas en Firestore. Tras enviar verificación se navega a `/verify?sent=1`; un fallo de correo mantiene la cuenta y ofrece reenvío. Si falla nombre/perfil tras crear Auth se va a `/perfil?alta=incompleta`: se completan los datos y Guardar recupera el documento sin crear otra cuenta ni sobrescribir un rol existente. No se promete rollback entre Auth y Firestore.

**Acceso:** SDK oficial, persistencia IndexedDB/localStorage (memoria si no están disponibles), mensajes genéricos de credenciales y actualización del estado. Cliente → `/reservar`; profesional → `/panel-barbero`; responsable/administrador → `/index-admin`. Correo pendiente → `/verify`. Los destinos de negocio siguen siendo vistas reservadas para fases posteriores.

**Salida:** `signOut`, invalidación de lecturas anteriores, cancelación del listener de perfil y ocultación inmediata de datos/menús. Barra → `/login`, perfil → `/`. Se propaga por la persistencia Firebase a otras pestañas; `pageshow` evita recuperar una vista privada congelada desde la caché de navegación. Los controladores consultan el usuario actual al actuar y no capturan una cuenta antigua. El botón de salida permite reintentar si hay error.

**Verificación:** `sendEmailVerification`, reenvío desde perfil, `applyActionCode`, recarga Auth y renovación del token. El código se consume una vez y se elimina de la URL al terminar; no se sigue una URL de redirección recibida del navegador. Sin sesión se vuelve a `/login?verified=1`. Códigos inválidos/caducados muestran el mensaje original. El emulador conserva códigos ficticios en `/emulator/v1/projects/demo-barberpro-m13/oobCodes`; no entrega correo real.

**Perfil:** email/UID/verificación vienen de Auth; nombre/teléfono de `users/{uid}`; rol/plan de claims. El rol del documento es un espejo protegido que debe coincidir con claims y su versión, no una fuente editable de permisos. Solo se cambian `name`, `phone`, `updatedAt`. No hay elección de rol en registro/perfil ni gestión general de cuentas. La búsqueda/tabla administrativa queda para fase 8; las reglas permiten las consultas legítimas de responsable/administrador.

**Estado:** `cargando`, `invitado`, `autenticado`, `error`, `desactivado`. Un único `onIdTokenChanged` y un listener de perfil actual sirven a todos los consumidores. Una revisión incremental descarta respuestas tardías; un cambio de perfil/versión fuerza una renovación acotada, sin bucle de reintentos. Un fallo de permisos retira las opciones privadas. El perfil del cliente puede recuperarse cuando falta; el personal sin espejo válido no obtiene acceso.

**Rutas:** el HTML estático no contiene datos privados. `data-auth-pending` oculta main desde el primer render, incluso sin JS. Después se comprueban sesión, correo y lista explícita de roles, normalizando la barra final. `/perfil` admite correo pendiente; el resto exige verificación. Sin sesión → login; sin rol → inicio con aviso; error de permisos → contenido oculto y mensaje. La descarga del HTML estático sigue siendo pública: la autorización real está en reglas y backend. No se introduce una sesión de servidor propia.

## D. Matriz de permisos

«Preparada» significa política/lecturas, no funcionalidad de reserva o gestión implementada.

| Operación | Cliente | Profesional | Responsable | Administrador | Autorización real |
|---|---|---|---|---|---|
| Información pública/registro/acceso | Sí | Sí | Sí | Sí | Sin datos privados. |
| Leer/editar contacto propio | Sí | Sí | Sí | Sí | Auth; UID propio; campos limitados; admite correo pendiente. |
| Leer perfiles ajenos/listar usuarios | No | No | Sí | Sí | Reglas: correo + claim/versión vigentes. |
| Leer citas propias (preparada) | Sí | Sí | Sí | Sí | Reglas por `userId` y correo verificado. |
| Leer citas asignadas (preparada) | No | Solo propias asignadas | Todas | Todas | Claim worker + `barberUid`, o gestión. |
| Leer bloqueos (preparada) | No | Solo propios | Todos | Todos | Reglas por profesional/gestión; datos privados no expuestos a clientes. |
| `/agenda`, `/panel-barbero`, `/panel`, `/index-admin`, `/setup-barber`, `/bloqueos` | No | Sí | Sí | Sí | Guard por lista; operaciones futuras aún indisponibles. |
| `/horarios`, `/equipo`, `/servicios`, `/kpis`, `/export` | No | No | Sí | Sí | Guard gestión; escrituras de negocio aún denegadas. |
| `/admin`, `/admin/usuarios`, `/branding`, `/debug` | No | No | No | Sí | Guard admin; gestión general pendiente. |
| `whoAmI` | Propio | Propio | Propio | Propio | Callable comprueba cuenta real, vigencia y espejo; no devuelve tokens. |
| `adminSetClaims` | No | No | No | Sí | Cuenta/token verificados, rol actual admin, UID/rol validados. |
| `setMyRole` | No | No | No | No | Callable deniega siempre, aunque existan flags demo. |
| Cambiar rol/email/fechas administrativas desde Firestore | No | No | No | No | Campos inmutables desde SDK; Admin autorizado para roles. |
| Escribir citas/locks/notificaciones desde SDK | No | No | No | No | Denegación; futuros handlers Admin en sus fases. |

No hay herencia implícita. Todos pueden actuar como cliente para sus citas futuras; worker accede además a su operativa y manager no recibe la administración de roles. El guard PRO se conserva inactivo; no se añaden pagos.

## E. Correspondencias y nombres

| Original | Nuevo | Correspondencia |
|---|---|---|
| `lib/firebase.ts` | `datos/firebase.ts` | `auth/db/fns` → `autenticacion/baseDatos/funcionesRemotas`; se conserva SDK y región. |
| `lib/auth-flow.ts` | `datos/sesion.ts`, `comun/permisos.ts`, `comun/errores.ts` | `refreshUser` → `actualizarUsuarioSesion`; `getRoleHomePath` → `obtenerDestinoInicial(rol)`; errores separados. |
| `lib/rbac.ts` y `scripts/guards.client.ts` + guards de rol | `comun/permisos.ts` | `getRole/requireRole/isStaff/releaseProtectedPage` → `obtenerRolSesion/exigirRol/esPersonal/mostrarPaginaAutorizada`. |
| `scripts/login.client.ts` | `modulos/cuentas/iniciar-sesion.ts` | `humanError` → `explicarErrorAcceso`; SDK pasa a datos. |
| `scripts/registro.client.ts` | `modulos/cuentas/crear-cuenta.ts` | `submitInFlight` → `solicitudEnCurso`; bloqueo/validación compartidos. |
| `scripts/perfil.client.ts` | `modulos/cuentas/editar-perfil.ts` | `roleLabel/setMsg/renderVerificationState` → `obtenerEtiquetaRol/mostrarMensaje/mostrarEstadoVerificacion`. |
| `scripts/verify.client.ts` | `modulos/cuentas/verificar-correo.ts` | `getParam/handleVerify/goToRoleHome` → `leerParametroUrl/procesarVerificacion/irAlInicioDelRol`. |
| `scripts/navbar.client.ts` y tarjeta de home | `modulos/navegacion/barra-navegacion.ts` | Una suscripción al estado compartido; sin lecturas duplicadas de perfil. |
| `functions/index.js` (roles) | `functions/src/cuentas.js`, `permisos.js` | Exports conservados; `assertAuth/assertAdmin/syncBarberProfileForRole` → `comprobarSesion/comprobarAdministrador/sincronizarFichaProfesional`. |
| scripts de asignación/migración originales | `functions/scripts/asignar-roles.mjs`, `normalizar-roles.mjs` | UID explícito, simulación y entorno local obligatorios; ningún objetivo fijo real. |

Se mantienen IDs HTML, nombres de colecciones, claves wire (`role`, `name`, `phone`, `email`, `barberUid`…), región `europe-west1` y exports de Functions. `roleVersion` es una ampliación aditiva. Una ausencia de versión significa 0 para compatibilidad con datos legados; cada cambio autorizado la incrementa. `normalizarRolEntrada` se comparte desde permisos para que servidor/scripts tengan una sola política; se documenta esta ubicación respecto al inventario que la situaba en cuentas. No se migran datos reales.

Ejemplos nuevos: `estadoSesion`, `usuarioSesion`, `revisionSesion`, `ultimoCambioPermisos`, `solicitudEnCurso`, `perfilEditado`, `comprobarFormulario`, `registrarUsuario`, `iniciarSesion`, `cerrarSesion`, `obtenerUsuarioActual`, `comprobarPermiso`. No se han introducido clases artificiales ni variables globales de rol editables como autorización.

## F. Seguridad y decisiones

1. Cliente y Admin rechazan proyectos/hosts ajenos a los dos emuladores demo. La CLI se ejecuta sin sesión global; no se copian secretos ni se usa una cuenta administrativa productiva. No hay despliegues, migraciones ni usuarios de producción.
2. La firma del token la valida Firebase/callables en un entorno real; el emulador no equivale a esa garantía criptográfica. El backend consulta además la cuenta Auth actual, expiración, revocación, disabled, correo y claims vigentes. Las pruebas de token manipulado explotan deliberadamente la falta de firma del emulador para comprobar esas barreras adicionales.
3. Registro con rol fijo cliente; reglas rechazan campos extra, email ajeno, timestamps inventados y cualquier cambio efectivo de rol/versión. Incluso admin usa el callable en lugar de escribir roles desde SDK.
4. Cambio de rol: transacción actualiza espejo/versión → Admin actualiza claims conservando otros claims → sincronización de ficha profesional → comprobación final. Auth/Firestore **no son una transacción conjunta**. Discordancia o carrera falla cerrada para permisos operativos; se recupera repitiendo una asignación administrativa autorizada. No se promete rollback automático. El listener fuerza renovación y las reglas rechazan tokens con la versión anterior inmediatamente.
5. Se desactiva la autoasignación `setMyRole` también en demo. Los scripts son herramientas locales del desarrollador, no una API de autoservicio del navegador. Nunca adoptan un `users.role` legado como prueba de privilegios.
6. El profesional no escribe libremente su ficha ni consulta perfiles privados ajenos. Las escrituras de servicios, configuración, horarios y bloqueos quedan cerradas hasta sus fases, para añadir validaciones completas. Es una restricción temporal respecto al original, no una eliminación definitiva de permisos legítimos. Los clientes no leen detalles privados de bloqueos; disponibilidad futura se resolverá en backend.
7. Datos del usuario mediante `textContent`/propiedades; sin HTML interpolado ni contraseñas/tokens en console de aplicación. Mensajes accesibles; errores de login genéricos. Los logs propios del emulador incluyen enlaces ficticios de correo y se ignoran en Git.
8. Auth se inicializa sin resolver OAuth porque solo hay contraseña. Evita la carga preventiva de iframe/GAPI en móvil. La CSP restringe scripts y conexiones al origen/emuladores y conserva Google Fonts. También bloquea la imagen externa de diagnóstico de WebChannel observada durante navegación rápida.

Referencias primarias consultadas: [claims y renovación](https://firebase.google.com/docs/auth/admin/custom-claims), [emulador Auth y códigos de correo](https://firebase.google.com/docs/emulator-suite/connect_auth), [pruebas de reglas](https://firebase.google.com/docs/rules/unit-tests), [dependencias explícitas de Auth](https://firebase.google.com/docs/auth/web/custom-dependencies).

## G. Pruebas y evidencia

Comandos ejecutados y resultados finales se actualizan al terminar la comprobación. No se cuentan como aprobadas las ejecuciones intermedias fallidas ni omitidas.

| Comprobación | Resultado |
|---|---|
| `npm run check` | Astro/TypeScript y sintaxis backend: 0 errores, warnings y hints. |
| `npm run test:unit` | 19 tests: 15 frontend y 4 backend. |
| Integración real de Auth, reglas y Functions | 14 casos, incluidos expiración y token manipulado; sin cuentas reales. |
| Build | 27 páginas Astro estáticas. |
| `npm run test:emuladores` | Con CLI 15.35.0: 14 integraciones, build y 98 pruebas de navegador superadas; 20 comparaciones visuales incluidas; cero omitidas. Salida 0 y servicios detenidos automáticamente. |
| Scripts de roles | Ambos ejecutados en modo simulación sobre `fase4-client` del emulador, sin cambios de rol. |
| Preview de desarrollo | `/login` responde 200 en 127.0.0.1:4321, sin errores ni warnings del navegador; servidor detenido tras revisar. |
| Original | 94 hashes iguales; cero modificaciones. |

Casos de integración: registro, correo inválido, clave débil, duplicados, credenciales incorrectas/inexistentes; verificación válida y código reutilizado; perfil de correo pendiente, lectura ajena, campos protegidos y alta parcial; cuatro roles; llamadas sin sesión, cliente/profesional/responsable no administran; `setMyRole` denegado; UID/rol manipulados; ficha profesional activa/inactiva; degradación con token anterior; fallo intermedio de versión recuperable; sesión cerrada, usuario disabled, token inválido/caducado y rol falsificado. Las reglas prueban denegación de datos, no solo botones ocultos.

Casos de navegador: validación HTML y confirmación, doble envío, registro→correo→verificación→perfil→recarga→salida, destinos de los cuatro roles, 15 rutas directas por rol, navegación con barra final, fallo de conexión, correo pendiente, dos pestañas, volver atrás, cambio de rol con sesión abierta y contenido privado oculto sin JavaScript. Las pruebas unitarias cubren explícitamente respuestas tardías y fallos parciales que no se provocan en producción.

Incidencias corregidas durante la implementación: timeout de discovery de Functions aumentado a 60 s; expectativas antiguas sobre vistas reservadas; un test que intentaba rechazar una escritura sin cambio efectivo de rol; petición externa de Auth en móvil resuelta con `initializeAuth`; imagen diagnóstica bloqueada por CSP; referencia de perfil preparada con el mismo estado de sesión; medición visual que incluía un aviso oculto nuevo; y lanzador que ejecutaba Astro desde la raíz en lugar de `app`, impidiendo que Tailwind encontrara su contexto. No se han relajado reglas para hacer pasar tests.

**Comparación visual:** se sirve únicamente el dist original leído en 4332, sin sus scripts, con CSP que prohíbe conexiones. Se compara con la reconstrucción en 4331. Se preparan estados equivalentes: formularios desbloqueados; texto de verificación de espera; perfil con los mismos datos ficticios, insignia y navegación de cliente. No se ejecuta el original contra Firebase. Se comprueban textos, geometría, estilos, campos, botones y capturas de main para las cuatro pantallas en escritorio y móvil; además continúan las seis páginas públicas completas. Se mantiene la tolerancia limitada de fase 3 (threshold 0.1, máximo 0,01 % de píxeles), sin afirmar identidad absoluta. Añadidos visibles justificados: mensajes de recuperación de alta, denegación y errores; aria-live/noindex no alteran el diseño. No se añade pantalla de recuperación ni acceso denegado nueva.

Evidencias ignoradas: `.verificacion/suite-fase4.log` y resultado final `.verificacion/suite-fase4-cli-actual.log`, auditorías JSON y `app/.verificacion/referencia`. Se conservan allí `original.png` y `reconstruida.png` para cada comparación. Se han inspeccionado capturas reales de perfil de escritorio y de registro/perfil móvil, además de la comparación automática. Los enlaces de correo/cuentas en esas pruebas son únicamente fixtures efímeros. No se incluyen tokens reales ni claves en el repositorio.

**Auditoría de dependencias:** se ha repetido `npm audit --json` en raíz/app/functions. App conserva 22 avisos (9 moderados, 10 altos, 3 críticos); Functions con SDK de pruebas 21 (15 moderados, 6 altos, 0 críticos). La CLI inicialmente fijada a 13.35.1 introducía un crítico de tar: se ha actualizado a **firebase-tools 15.35.0**, compatible con Node 20 y Java 21; raíz queda con 14 avisos moderados y cero altos/críticos. Los críticos restantes de app incluyen Astro/optimizador AVIF/funcionalidades servidor, Vitest/servidor de pruebas y tinypool. El proyecto usa salida estática, no optimizador remoto/SSR, y Vitest en modo run, sin UI pública; esto limita exposición pero **no elimina los avisos ni certifica que todos sean inaplicables**. No se ejecuta `audit fix --force`: propone cambios mayores de Astro/Vitest y alteraría las versiones acordadas. Se mantiene un pendiente explícito de revisión y actualización compatible antes de declarar una entrega sin problemas críticos de dependencias/publicar.

## H. Pendientes y preparación de fase 5

- No se inicia fase 5. La base ofrece usuario/claims vigentes, perfiles y permisos comprobados; la fase siguiente puede añadir disponibilidad/reservas sobre datos ficticios.
- Antes de sus operaciones, preparar catálogo/profesionales/semanas/bloqueos ficticios, implementar validaciones/handlers autorizados y ampliar reglas con pruebas. No abrir escrituras generales por estar autenticado.
- Reservas, locks, concurrencia de reservas, ICS y pantallas completas de cliente/profesional/administración/estadísticas se mantienen para sus fases. Los cuatro exports existentes son 4 de los 13 contratos originales; los otros 9 siguen pendientes.
- Administración visual de usuarios/roles y búsquedas corresponde a fase 8. La capacidad backend mínima ya está probada; no se finge una tabla administrativa operativa.
- Completar revisión de dependencias heredadas y nuevas herramientas de desarrollo; no se presenta esta entrega como lista para producción. La comprobación en Chromium móvil emulado no sustituye Safari/dispositivo físico. Faltan la comparación global de estados complejos y la integración final de fases 10–11.
- Los fallos parciales se recuperan por perfil o reasignación administrativa según el caso; no existe una transacción entre Auth y Firestore. Documentar esa condición al preparar cualquier transición futura. No ejecutar migraciones productivas por inferencia.

Se detiene el trabajo al entregar fase 4; no se dejan servidores de prueba ni operaciones administrativas activas.
