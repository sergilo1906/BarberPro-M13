# Cierre definitivo de BarberPro Studio M13

Revisión autorizada el 11 de noviembre de 2026 sobre BarberPro-M13, sin reconstruir las doce fases ni alterar el original. Base verificada: main limpia en `db4139dcf373c8d97af0f36eec40e2b1fa649a82`, 216 archivos y release preliminar intacta. La versión final se identifica por el commit de la etiqueta y por el informe de validación externo; no se incrusta aquí un hash autorreferencial del ZIP.

## Problemas y correcciones necesarias

No se encontró un defecto crítico o importante nuevo de la aplicación en la revisión de código. Se mantienen diseño, frameworks, lógica de negocio, atomicidad, reglas, fixtures, aserciones, tolerancias y versiones fijadas. Los cambios corrigen documentación de entrega incompleta y una referencia obsoleta del README a fases futuras; añaden una guía breve, defensa con 22 preguntas, borradores de mensaje ES/CAT y CI mínimo.

El [registro de pendientes](pendientes.md) distingue defectos, mejoras, verificaciones, límites y requisitos personales. Se detectan cuatro pequeños helpers locales idénticos `mostrarMensaje`; no son motores de reservas duplicados ni se refactorizan por estilo al cerrar la entrega. El contrato de plan PRO se conserva inactivo por decisión original. No se afirma análisis exhaustivo de código muerto ni equivalencia semántica por nombre.

## Cumplimiento y recorridos reales automatizados

| Área | Código/contrato y evidencia de ejecución |
| --- | --- |
| 27 páginas y 40 grupos | Rutas públicas, cuentas y 18 políticas privadas; matriz funcional completa con límites y decisiones justificadas. Cada una de las 27 páginas conserva su finalidad. |
| Backend | Los 13 exports originales están presentes entre los 19 actuales. Seis operaciones protegidas sustituyen escrituras del navegador. |
| Cliente | Registro/login/verificación/perfil; reserva, Mis citas, historia, filtros, cambio, cancelación, ICS y recuperación de respuestas perdidas. |
| Profesional | Panel/agenda propios, semana y dos tramos, copia/publicación, descansos, bloqueos/vacaciones, estados y rechazo de UID ajeno. |
| Responsable | Equipo/servicios, indicadores y exportación autorizados; sin permiso de administrador para asignar roles o modificar configuración exclusiva. |
| Administrador | Consulta de usuarios, asignación de roles, catálogo/configuración y operaciones demo protegidas, con validación backend. |
| Reservas | Duración completa, semana publicada, bloqueos y ocupación; transacción e idempotencia. Dos peticiones incompatibles no confirman el mismo intervalo; fallos y carreras conservan citas/locks coherentes. |
| Estadísticas y formatos | Totales/minutos y periodos, exclusión de historia reprogramada, CSV completo/escapado y limpieza de caché; ICS UTC con plegado UTF-8. |
| Recordatorios y demo | Ventanas configuradas, dryRun sin escritura, cola transaccional sin duplicados, mantenimiento solo demo y admin; job invocado manualmente, no cron desplegado. |

Son recorridos de Playwright con formularios, acciones, backend y persistencia; no se deducen del aspecto de un botón. La revisión/defensa personal del alumno permanece pendiente en el registro académico. La [matriz de 40 grupos](../matriz-requisitos.md) y los archivos `app/tests/e2e/{autenticacion,cliente,personal,administracion,reservas,restantes}.test.ts` detallan casos positivos y negativos por rol.

## Seguridad y arquitectura

Se revisan `adminSetClaims`, `setMyRole`, `whoAmI`, creación/cancelación/reprogramación/transiciones y sus validaciones compartidas. Rol y versión se contrastan entre token, Auth y perfil; las transacciones vuelven a leer permisos del actor. No hay autoservicio de elevación de rol, escritura directa de negocio ni modificación ajena no autorizada. Se conservan limpieza de sesión y descarte de respuestas pendientes. La fábrica Admin y las herramientas rechazan hosts/proyectos ajenos al demo local.

Se conservan 94 correspondencias de archivos, con destinos presentes, y 3.122 registros trazados. El generador portátil se ejecuta de nuevo con salida 0: 1.055 declaraciones, 552 contratos referenciados, 132 decisiones manuales y 1.383 ámbitos reestructurados; ningún registro sin destino o decisión. No son prueba matemática ni cobertura individual por variable. El inventario actual comprueba importaciones y ciclos; los resultados definitivos y secretos se acreditan con la validación externa del paquete.

Los 94 archivos propios del original siguen coincidiendo con los hashes de planificación. No se ejecutan escritores/SDK originales; la referencia visual se sirve aislada. No se despliega, envía correo real ni opera sobre Firebase de producción. Ausencia de hallazgos no garantiza seguridad absoluta.

## Pruebas nuevas del cierre

Entorno contrastado: Node 22.23.4, npm 10.9.0, Java 21 y Chromium. La nueva `npm test`, del 11/11/2026 entre 20:10:44 y 20:22:24 UTC, termina con **código 0**: checker de 106 archivos sin diagnósticos, **44 unitarias, 69 integraciones y 284 casos de navegador, incluidos 126 visuales**, sin fallos ni omisiones. Build de 27 páginas. Los cuatro roles ejecutan acciones y verifican sus resultados en escritorio/móvil; las 42 comparaciones restantes pasan en tableta. No se suman los 126 visuales otra vez. Registro local: `.verificacion/cierre-definitivo-2026-11-11/regresion-workspace.log`.

`npm test` ya encadena tipos/sintaxis y unitarias; no se repiten por separado sin motivo. El build explícito y el generador de trazabilidad también se comprueban. El informe externo recoge su salida y la ejecución sobre el ZIP definitivo, sin reutilizar el resultado de esta carpeta como prueba de la extracción.

La comparación con el original disponible cubre 42 estados en tres formatos y está incluida en la regresión del workspace; nunca se suma dos veces. Se mantienen tolerancias y diseño. La validación del ZIP nuevo distingue sus resultados de los del workspace y de los artefactos históricos; las visuales sin original se omiten expresamente y no se cuentan como aprobadas.

GitHub Actions instala raíz/app/Functions y ejecuta tipos/sintaxis, build y unitarias con Node fijado, permisos mínimos y sin secretos, emuladores o despliegue. La validación externa identifica la ejecución real sobre el commit publicado, o su limitación si el servicio no la permite. No sustituye las pruebas de integración y navegador locales.

## Dependencias y límites conservados

El análisis nuevo mantiene raíz 14 nodos moderados, app cero y Functions nueve; ninguna alerta alta/crítica. La simulación de reparación no resuelve los avisos dentro de los rangos instalados. Los parches y cadenas, exposición local y motivo de no forzar cambios mayores están en [dependencias](dependencias.md). Ningún aviso se declara resuelto por usar emuladores.

La entrega sigue siendo demo local: no se necesita cuenta Firebase, no hay hosting público de la web, SMTP ni cron desplegado. Notificaciones `queued` no significan enviadas. No se certifican producción, carga, dispositivos físicos, Safari, todas las combinaciones de estado ni cobertura de líneas del 100 %. Una web accesible por enlace requeriría otra autorización y despliegue. Son límites deliberados, no funcionalidades esenciales rotas.

## Fuente, paquete y comprobación pública

- Repositorio autorizado y público: https://github.com/sergilo1906/BarberPro-M13
- Release final: https://github.com/sergilo1906/BarberPro-M13/releases/tag/cierre-definitivo-2026-11-11
- Paquete: `BarberPro-M13-cierre-definitivo-2026-11-11.zip`.
- Adjuntos separados: `.zip.sha256` y `validacion-cierre-definitivo-2026-11-11.md` con lista de contenido.

El informe adjunto identifica **commit final, SHA-256, tamaño, instalación limpia y resultados del ZIP exacto**, ejecución CI y descarga pública. Es la evidencia necesaria para dar por validado ese paquete; no se atribuye al nuevo ZIP el resultado del anterior. Las publicaciones previas se conservan sin sobrescritura, push forzado o borrado de historia. No se envía nada automáticamente al profesor.

## Material para el profesor y acciones personales

Empezar por [ENTREGA-LEER-PRIMERO](../ENTREGA-LEER-PRIMERO.md). Incluye descarga/checksum, requisitos Windows/PowerShell, los tres npm ci, configuración ficticia, emuladores/datos/web, URL, cuentas, cuatro recorridos, pruebas y límites. La [guía de defensa](../GUIA-DEFENSA-M13.md) aporta presentación de dos minutos, arquitectura, transacciones, roles, demostración de diez minutos y preguntas para comprender el código. Los mensajes [castellano](../MENSAJE-PROFESOR-ES.md) y [catalán](../MENSAJE-PROFESOR-CAT.md) son borradores sin enviar.

El alumno debe revisar y comprender el proyecto, recorrer personalmente los cuatro roles, completar nombre/datos y horas reales en [registro-academico.md](../registro-academico.md), contrastar las normas del centro y enviar los archivos por el canal del profesor. No se inventa autoría exclusivamente manual, trabajo personal, rúbrica ni calificación. La asistencia de Codex queda declarada.

**B — APTO CON LIMITACIONES DOCUMENTADAS**, para revisión académica de la demo local, respaldado por los resultados identificados y la validación adjunta del paquete final.
