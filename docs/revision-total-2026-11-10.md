# Segunda revisión total — BarberPro Studio M13

## Cierre técnico para entrega — 11 de noviembre de 2026

La continuación solicitada por el usuario completa los documentos exigidos, la matriz de 40 grupos funcionales y una trazabilidad reproducible de 3.122 registros, sin filas sin destino o decisión. Se mantienen niveles de evidencia distintos: 1.055 declaraciones, 552 contratos referenciados, 132 resoluciones manuales de funciones y 1.383 registros de ámbitos reestructurados. No se afirma una biyección semántica ni ejecución individual del 100 %. La guía canónica es [entrega para el profesor](entrega-profesor.md).

La regresión corregida del workspace termina 0 con 44 unitarias, 69 integraciones y 284 navegador, incluidas 126 visuales, sin omisiones; checker de 106 archivos sin diagnósticos y build de 27 páginas. La comparación de cierre del 11 de noviembre, iniciada a las 06:25 UTC, pasa de nuevo 126/126. Su primer intento pasó 123 y falló en tres perfiles por un fixture ausente: se corrige RT-06 conservando las aserciones. La extracción/instalación del ZIP final se acredita en el informe de validación adjunto, que identifica el artefacto exacto y sus resultados propios.

Se conservan los estados y resultados anteriores como historial. AF-09 queda documentado mediante decisiones por registro y anclas actuales, con su límite semántico explícito; AF-10 se cierra técnicamente mediante guías, registro neutro y paquete verificado. AF-11 permanece como limitación moderada de dependencias, sin altas/críticas en el análisis nuevo del 11 de noviembre. La revisión personal, las horas reales y las normas del centro corresponden al alumno; no se inventan. **OPCIÓN B — APTO CON LIMITACIONES DOCUMENTADAS** para esta demo local, sujeta a la evidencia del paquete adjunta, no a una garantía de calificación ni producción.

## Base y desarrollo de la segunda revisión

Base: `3e5839b466bfffecd8210506857c5e4815f24cac`, Git limpio al inicio, main público y 200 archivos propios versionados. Inicio de regresión nueva: 10 de noviembre de 2026, 21:37:23 UTC. La rama revision-total-2026-11-10 conserva el trabajo antes de integrarlo en main mediante avance directo. Los informes y recuentos de cada pasada se identifican por su momento; no se confunden con las verificaciones de otra versión.

## Objetivo y método

Se contrastan el prompt maestro de fases 8–12, la solicitud extra de auditoría y la petición actual con la fuente, las pruebas, el original y la publicación real. No se considera que un informe anterior demuestre por sí solo cumplimiento. Se leen los módulos de identidad, permisos, datos, reservas, horarios, administración, estadísticas y exportación; el inventario analiza todas las fuentes propias y las pruebas comprueban comportamiento por áreas.

Se verifican automáticamente los 200 archivos iniciales, sus bytes y hashes, JSON, enlaces documentales, rutas, imports, ciclos, declaraciones y contratos. Esto no equivale a revisión semántica individual de cada variable ni a cobertura de ejecución por archivo. No se modifican el original ni producción.

## Evidencia nueva ya comprobada

| Comprobación | Resultado |
| --- | --- |
| Original | 94/94 hashes iguales a la referencia, 94 destinos de correspondencia existentes. |
| Páginas | 27/27 rutas originales, sin rutas propias ausentes ni adicionales. |
| Fuente inicial | 200 archivos, 2.353.797 bytes, ninguno vacío, ningún duplicado byte a byte. |
| Referencias | Ningún enlace Markdown local roto; JSON válido; 369 imports locales resueltos, sin ciclos ni errores de parseo. |
| Backend | 19 exports; presentes los trece originales y seis operaciones protegidas adicionales. |
| DOM | Los seis IDs de navegación generados dinámicamente aparecen en el HTML compilado; no se confunden con controles eliminados. |
| Dependencias | npm audit nuevo: app cero; raíz 14 moderadas; Functions nueve moderadas; ninguna alta/crítica. |
| Secretos | Gitleaks inicial e historial completo, salida 0, sin fugas detectadas. |
| GitHub | main público coincide con 3e5839b; etiqueta de candidato en 5a7de04. |
| Descargas | Tres adjuntos públicos descargados sin autenticación, SHA256 idénticos a los locales. ZIP: 200 archivos y ninguna ruta privada/generada prohibida. |

Los seis IDs dinámicos se contrastan con el HTML generado, no solo con una búsqueda literal en plantillas. La comprobación de imports y AST no demuestra una biyección de los 3.122 registros de planificación.

## Hallazgos de esta revisión

| ID | Nivel | Hallazgo | Tratamiento |
| --- | --- | --- | --- |
| RT-01 | MENOR | README y estados de fases/cobertura mezclan pendientes históricos con pruebas ya ejecutadas y publicación posterior. | Avisos vigentes y redacción corregidos; registros históricos conservados. |
| RT-02 | IMPORTANTE | Servicios: una casilla editada sin guardar invierte el resultado de Activar/Desactivar respecto al texto del botón. Reproducción aislada del controlador: etiqueta Desactivar, petición active:true. El original también tenía esa incoherencia. | CORREGIDO. Se invierte servicio.active, el estado cargado que anuncia el botón. Reproducción aislada y recorrido real pasan en ambos formatos, con casilla sin guardar y persistencia tras recargar. Regresión completa 0; se mantienen las comprobaciones anteriores. |
| RT-03 | MENOR | Functions declara una dependencia de la raíz file:.. sin ninguna importación de ese paquete. | CORREGIDO. Se retiran dependencia/enlace/metadatos huérfanos sin cambiar ninguna otra dependencia. npm ci de Functions y la instalación aislada terminan 0; el backend pasa su regresión. |
| RT-04 | IMPORTANTE, documentación | Faltaban los informes concretos de fases 9/10 y las cinco entradas de entrega exigidas, además de una estructura de registro académico, aunque había información repartida en auditoría/README. | Se crean ocho documentos con fuente, evidencia, límites y campos académicos pendientes, además de este informe. No se declaran cerradas las fases por añadir archivos. |
| RT-05 | IMPORTANTE, arranque | El lanzador escribía FUNCTION_DISCOVERY_TIMEOUT; Firebase CLI lee FUNCTIONS_DISCOVERY_TIMEOUT. El valor pretendido de 60 s se ignoraba y una carga en frío agotó los 10 s por defecto, dejando los endpoints sin registrar. | CORREGIDO. Nombre contrastado con CLI y documentación oficial. Se registran los 19 exports y la regresión completa termina 0; no se cambian timeouts de pruebas ni aserciones. |
| RT-06 | MENOR, fixture | La comparación de Perfil dependía de fase4-client, creado por otra suite. Ejecutar solo visuales con los datos demo producía tres fallos de login. | CORREGIDO. Usa reservas-client, incluido en el seeder, y los mismos datos de nombre/rol/verificación. Comparación completa 126/126, sin omisiones ni tolerancias relajadas. |

La primera reproducción auxiliar de RT-02 agotó la espera en about:blank, donde faltaba randomUUID de origen seguro. Se corrigió únicamente el arnés aislado; su segunda ejecución mostró el envío incorrecto. No se presenta aquel timeout auxiliar como fallo de Firebase ni como prueba funcional completa. La regresión real de navegador se registra por separado.

La primera actualización del lockfile con --prefix dejó nuevamente la referencia local a la raíz. Se corrigió ejecutando desde functions y retirando los metadatos huérfanos; se contrastó el resultado con el lockfile inicial y no cambió ninguna otra dependencia. Se conserva date-fns porque date-fns-tz la declara como peer, aunque los controladores propios no la importen directamente.

## Estado de las doce fases

| Fase | Estado actual | Motivo |
| --- | --- | --- |
| 1 — Original | COMPLETA CON LIMITACIONES | 94 archivos y hashes, 27 páginas y trece exports recontrastados; producción solo como referencia. |
| 2 — Arquitectura | COMPLETA CON LIMITACIONES | Separación, imports, 94 destinos y 3.122 decisiones; niveles estructurales/manuales/de ámbito explícitos, sin prueba formal de equivalencia. |
| 3 — Base | COMPLETA CON LIMITACIONES | Astro, estilos, navegación, checker, build y ejecución local; no modalidad productiva. |
| 4 — Cuentas y roles | COMPLETA CON LIMITACIONES | Cuatro roles, Auth/reglas/backend y negativas probadas en emuladores. |
| 5 — Reservas | COMPLETA CON LIMITACIONES | Disponibilidad, concurrencia, cancelación, cambio y recuperación; sin carga productiva certificada. |
| 6 — Cliente | COMPLETA CON LIMITACIONES | Mis citas, perfil, filtros y acciones con datos propios; sin dispositivos físicos. |
| 7 — Profesional | COMPLETA CON LIMITACIONES | Panel, agenda, semanas y bloqueos; fixtures y permisos emulados. |
| 8 — Administración | COMPLETA CON LIMITACIONES | Usuarios, equipo, catálogo y configuración; RT-02 pasa con comprobaciones ampliadas y regresión completa. |
| 9 — Restantes | COMPLETA CON LIMITACIONES | Vistas/exports, pruebas, informe y matriz global; cola sin correo real y herramientas solo demo. |
| 10 — Comparación | COMPLETA CON LIMITACIONES | Cierre actual 126/126 en tres formatos; no se retrofecha el orden histórico ni se certifican dispositivos físicos. |
| 11 — Pruebas | COMPLETA CON LIMITACIONES | Regresión real, correcciones y trazabilidad documentadas; moderadas aceptadas y sin cobertura universal. |
| 12 — Entrega | COMPLETA CON LIMITACIONES | Guías, registro neutro, fuente y paquete con validación adjunta; no se suplanta la revisión personal ni la decisión del profesor. |

El inventario histórico se vuelve a contar: 2.827 filas S/R más 295 bindings = 3.122. La entrada, resoluciones y [tabla final](trazabilidad/simbolos-actuales.md) son autocontenidas. Se localizan las 252 filas con nombre funcional del plan: 120 por declaración y 132 por resolución explícita; sus criterios no son idénticos al recuento AST de funciones declaradas. Cero registros quedan sin destino o decisión. La trazabilidad de ámbito no se etiqueta como equivalencia de cada local. Hay cero clases propias detectadas; no se inventan clases.

## Áreas funcionales y permisos

| Área | Fuente contrastada | Evidencia de comportamiento |
| --- | --- | --- |
| Cuentas/sesión | datos/sesion y personas; módulos cuentas; permisos y cuentas backend | Alta parcial, perfil propio, verificación, recarga, identidad cambiada y rechazo de escalada. |
| Reservas | disponibilidad, fechas, horarios, persistencia-reservas; controladores de reserva/cambio | Duración, bloqueos, DST, dos operaciones incompatibles, cancelación/reprogramación, locks e idempotencia. |
| Cliente | mis-citas, estados y perfil; consultas de agenda y reglas | Historia/filtros, errores de red/permiso, respuesta perdida y limpieza de datos ajenos. |
| Profesional | panel, agenda, editor de semana, bloqueos; persistencia-horarios | Worker propio, gestión delegada, revisión de semana y conflictos con reservas existentes. |
| Administración | usuarios, equipo, servicios, reglas-agenda; administracion backend | Búsqueda, roles, visibilidad, alta/edición y revisión; caso nuevo RT-02. |
| Restantes | cálculos, indicadores, listado, CSV/ICS, recordatorios y demostracion | Cantidades y periodos, descarga, escape, simulación, cola sin duplicados y mantenimiento solo demo. |
| Seguridad | fábrica Admin, configuración cliente, roles/versión, reglas y transacciones | Denegaciones SDK/callable, datos ajenos, actor revocado, textos hostiles y recuperación sin duplicar. |

Las dieciocho políticas privadas y sus menús organizan navegación; la autorización efectiva se contrasta también en reglas y backend. Cancelar/cambiar requiere propiedad o permiso profesional/gestión; se comprueba identidad nuevamente en las transacciones. El reset demo mantiene el límite documentado de no concurrencia con otros escritores. No se presenta la ausencia de fallos en estos ensayos como garantía universal.

## Pasadas de esta revisión

Primera regresión completa terminada con salida 0: checker de 106 archivos sin diagnósticos, 44 unitarias, 69 integraciones y 284 pruebas de navegador correctas, ninguna omitida. Incluye 126 comparaciones visuales y build de 27 páginas. Los emuladores y servidores se detuvieron. Ese verde no cubría RT-02; por eso se amplió la prueba existente sin retirar comprobaciones ni aumentar contadores artificialmente.

La pasada iniciada a las 21:55:07 UTC termina con salida 1: checker y 44 unitarias correctas, pero Functions no descubre los endpoints en 10 s. En el primer grupo de 33 integraciones pasan tres y fallan 30 por la ausencia de funciones; los otros grupos y navegador no se ejecutan. Esos fallos se conservan como fallos y no se contabilizan como treinta defectos independientes de permisos o reservas. Exponen RT-05. La instalación paralela pudo añadir carga de disco, pero no se considera demostrada como causa única ni se atribuye el fallo a retirar una dependencia sin uso.

Tras corregir RT-05 se inicia una regresión nueva a las 22:00:49 UTC, en regresion-final.log. Se mantiene la configuración de pruebas existente y el valor de 60 s que el lanzador ya pretendía usar. La variable correcta está documentada en [Firebase](https://firebase.google.com/docs/functions/tips#avoid_deployment_timeouts_during_initialization) y en node_modules/firebase-tools/lib/deploy/functions/runtimes/discovery/index.js del CLI instalado. No se despliega nada.

La instalación aislada de 209 archivos propios, sin .git, dependencias instaladas, configuración local ni original, termina con salida 0 para npm ci en raíz, app y Functions, checker, build de 27 páginas y 44 unitarias. Se utiliza Node 22.23.4 y npm 10.9.0 explícitos. El lanzador corregido se sincroniza en esa copia antes de finalizar su comprobación; el arranque emulado se valida en la regresión del workspace, no se inicia otro juego de emuladores en paralelo. Los cambios posteriores del informe son documentales; se contrastarán los hashes de toda la fuente no documental antes de empaquetar.

También se arranca el preview Astro real de esa copia en 127.0.0.1:4431: `/`, `/ayuda`, `/login` y `/favicon.svg` devuelven HTTP 200. Se detiene explícitamente con Ctrl+C (salida 1 por interrupción solicitada, no por fallo de compilación) y se comprueba que el puerto queda libre. La copia aislada carece de .env.local y Firebase está desactivado por defecto; los recorridos autenticados se prueban con la configuración demo del workspace. Los 165 archivos no documentales coinciden byte a byte entre copia instalada y fuente corregida.

Esa coincidencia e instalación de 209 archivos corresponden al momento anterior al nuevo generador de trazabilidad y a RT-06. No se presentan como prueba de la extracción final posterior. La validación adjunta identifica el ZIP definitivo y ejecuta su instalación propia, checker, unitarias, integraciones y navegador; las visuales sin el original se omiten expresamente, sin contarlas como PASS.

## Límites conservados para la entrega

- AF-09: la trazabilidad documental está completa por registros y distingue sus niveles. No existe una prueba formal de equivalencia semántica individual ni cobertura de ejecución por variable; ese límite no se oculta mediante un porcentaje.
- AF-10: cierre técnico y material de entrega documentado. Registro personal, horas reales y revisión del alumno no se inventan; el profesor determina aceptación y rúbrica.
- AF-11: 14 nodos moderados en raíz y nueve en Functions, app cero, ninguna alta/crítica en el análisis nuevo. Actualizar SDK/herramientas para producción exigiría una validación separada.
- Pausa/reanudación: entre fin de regresión 10/11 22:15:30 UTC y comprobación de reanudación 11/11 05:55:06 UTC transcurren 7 h 39 min 36 s sin trabajo del agente registrado en la conversación. No se ejecutó una sesión Start-Sleep mantenida ni se afirma haber reconstruido el orden histórico. El usuario reanudó expresamente; el intervalo no se imputa a desarrollo.
- Producción, SMTP, índices desplegados, Safari/dispositivos físicos y carga real no certificados. Solo emuladores.

AF-12, publicación remota anterior, estaba resuelto antes de esta segunda revisión. Las correcciones nuevas se identificarán separadamente respecto a main y al ZIP publicado.

## Evidencia local de ejecución

Resultados y metadatos en `.verificacion/revision-total-2026-11-10/` (ignorada): integridad-inicial.json, estructura-y-contratos.json, audit-{raiz,app,functions}.json, github-publico.json, gitleaks-inicial/historial.json y regresion-completa.log. Los logs no se distribuyen porque contienen detalles efímeros de emuladores. La instalación aislada del candidato anterior conserva su evidencia en auditoria-final/08-entrega-github.md y en el adjunto público de validación.

Los avisos se contrastan con las publicaciones originales: [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq), [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) y [OpenTelemetry](https://github.com/advisories/GHSA-8988-4f7v-96qf). Los contadores npm son nodos afectados del árbol; no son 23 vulnerabilidades independientes.

## Recomendación de entrega

Los seis grupos RT quedan corregidos o documentados con evidencia y no quedan defectos críticos/importantes conocidos del código en los recorridos comprobados. Se adjunta un paquete limpio con su validación específica. La ausencia de hallazgos no garantiza seguridad o equivalencia universal; el alcance sigue siendo la demo local y la revisión académica.

**OPCIÓN B — APTO CON LIMITACIONES DOCUMENTADAS**.
