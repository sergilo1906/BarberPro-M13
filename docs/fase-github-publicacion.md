# Publicación de la fuente en GitHub

## Cierre definitivo — 11 de noviembre de 2026

La [release de cierre](https://github.com/sergilo1906/BarberPro-M13/releases/tag/cierre-definitivo-2026-11-11) identifica la nueva fuente con instrucciones breves, defensa, mensajes sin enviar y CI mínimo. Adjunta ZIP nuevo, checksum y validación externa con commit, instalación/pruebas del paquete exacto, lista de contenido, CI y comprobación de descargas públicas. No se sobrescriben las publicaciones anteriores ni se despliega la web. La entrada actual es [ENTREGA-LEER-PRIMERO](ENTREGA-LEER-PRIMERO.md); los apartados siguientes son historial de entregas anteriores.

## Entrega actual para revisión del profesor — 11 de noviembre de 2026

La solicitud de continuar hasta preparar la entrega consolida la fuente corregida, trazabilidad y documentos. Se conserva la autorización explícita anterior de subir todo a este repositorio público, sin crear otro, alterar visibilidad, reescribir historia o desplegar la aplicación. La entrega se identifica en [entrega-profesor-2026-11-11](https://github.com/sergilo1906/BarberPro-M13/releases/tag/entrega-profesor-2026-11-11): ZIP limpio, .sha256 e informe de validación adjunto. Este último registra el commit y la comprobación pública del artefacto concreto, después de su instalación/pruebas aisladas.

La [guía del profesor](entrega-profesor.md), [informe M13](informe-final-m13.md) y [revisión de cierre](revision-total-2026-11-10.md) son las referencias actuales. Valoración B para la demo local, con límites explícitos de dependencias, entorno y evidencia. No se presenta esta publicación como envío al profesor ni como calificación académica. Los apartados siguientes son registros de publicaciones anteriores; se mantienen sus etiquetas, ZIP y hashes inmutables.

## Publicación posterior de la auditoría — 10 de noviembre de 2026

El usuario ha autorizado expresamente «Subelo todo al github» después de recibir el resultado de la auditoría. Esta autorización posterior sustituye su prohibición de publicar automáticamente durante la revisión; no autoriza un despliegue de la aplicación ni operaciones productivas.

Se publica la fuente auditada `5a7de04193e67e0f3a19372bc5a3e96a116541bb`, con 200 archivos, y se conservan los registros históricos siguientes. Los commits posteriores modifican documentación de publicación y regeneran su inventario; no cambian frontend, backend, reglas, dependencias ni pruebas validadas. Se mantiene la rama principal main sin reescribir historial.

La descarga está publicada en https://github.com/sergilo1906/BarberPro-M13/releases/tag/auditoria-2026-11-10 como publicación preliminar del commit auditado. Incluye únicamente el candidato final BarberPro-M13-auditoria-2026-11-10-r1.zip, su .sha256 y validacion-auditoria-2026-11-10.md. SHA256 del ZIP: `297e6bc0be1bfc1b004d7cf7df07c95db2512d014024e2099f67e6fb1b357d11`. No se reconstruye ni se altera el paquete validado. Sus informes describen el cierre de auditoría previo a esta nueva autorización; este registro y las notas de publicación recogen el estado posterior.

Evidencia ya ejecutada en la auditoría: checker sin diagnósticos, build de 27 páginas, 44 unitarias, 69 integraciones y 284 navegador correctas, con 126 comparaciones visuales incluidas. El ZIP de ejecución superó instalación y pruebas aisladas; el candidato final r1 superó instalación con Node 22.23.4, checker, build, 44 unitarias y preview HTTP. Los límites y las pruebas no repetidas están distinguidos en los informes. No se vuelven a atribuir esas pruebas a los cambios exclusivamente documentales de esta publicación.

La valoración académica continúa siendo OPCIÓN C — NO APTO TODAVÍA: la trazabilidad semántica individual y cierres globales siguen pendientes; npm registra 14 nodos moderados en raíz y nueve en Functions, ninguno alto/crítico, y cero alertas en app. AF-12 queda resuelto con la verificación pública siguiente; no cambia el estado de los demás pendientes.

Se excluyen dependencias instaladas, compilaciones, cachés, logs, datos de emuladores, configuración privada, archivos del original y paquetes intermedios. Los valores de fixtures son públicos y ficticios. Se revisan secretos en el contenido exacto a publicar y el historial, sin mostrar valores privados.

### Comprobación pública realizada — 21:34:34 UTC

Se consultan la API pública y los enlaces de descarga sin cabecera de autorización. El repositorio es público; main contiene `9721c2486a8fa8e02d6e210c39ee4a1d3dcfcc6b` y la etiqueta auditoria-2026-11-10 apunta a `5a7de04193e67e0f3a19372bc5a3e96a116541bb`. La publicación no es borrador y se marca como preliminar. El commit de esta comprobación se añade después a main sin cambiar el código auditado ni mover la etiqueta.

Los tres adjuntos se descargan desde GitHub a una carpeta local ignorada. Sus tamaños y SHA256 coinciden exactamente con los archivos locales preparados:

| Adjunto | Bytes | SHA256 descargado |
| --- | ---: | --- |
| BarberPro-M13-auditoria-2026-11-10-r1.zip | 562203 | `297e6bc0be1bfc1b004d7cf7df07c95db2512d014024e2099f67e6fb1b357d11` |
| BarberPro-M13-auditoria-2026-11-10-r1.zip.sha256 | 109 | `13bb7d485f1df4e2204b0333458a7ba78e5f39c02f75442c46af710bc8e411c3` |
| validacion-auditoria-2026-11-10.md | 4330 | `551c4b95103c1c1e2ced1a5e87672dc6c24c4c5511b65af604caa7289e35b829` |

Antes de subir, Gitleaks termina con salida 0 y sin fugas detectadas en la fuente exacta preparada y en todo el historial. Se conserva el historial sin force push. La aplicación validada no se modifica; esta operación no requiere repetir las pruebas funcionales de la auditoría. Tampoco implica despliegue, operaciones productivas o una pausa de tres horas.

## Registro histórico de las publicaciones anteriores

Fecha: 10 de noviembre de 2026, UTC. Autorización vigente: «subelo todo al github» y «Continua», junto con la solicitud anterior que especificaba repositorio público, propietario autenticado y rama main. Esta instrucción posterior permite publicar la fuente comprobada aunque la reconstrucción de las fases 9–12 todavía esté pendiente; no se presenta como entrega final ni despliegue de la aplicación.

## Actualización — conservación de todos los cambios disponibles

La continuación de la subida incorpora también el avance de fase 9: panel diario, KPIs, listado/CSV, diagnóstico, recordatorios y herramientas demo, junto con tests y documentación. El README y [estado de fase 9](fase-9-estado-en-curso.md) distinguen la implementación disponible de su cierre todavía pendiente. La arquitectura actual se describe dentro de este mismo repositorio, sin exigir acceso a la planificación externa.

La fuente preparada contiene 177 archivos versionados. No se incluyen artefactos, dependencias instaladas, configuración privada ni el original. Las ramas locales anteriores no contienen commits ausentes de main: se conserva todo su historial sin force push ni reescrituras. Los 94 hashes de referencia del proyecto original siguen coincidiendo.

Se ejecutó de nuevo `npm test` sobre este avance, con salida 0: checker Astro/TypeScript sobre 104 archivos sin diagnósticos, sintaxis backend correcta, 43 unitarias (28 frontend y 15 backend), 67 integraciones y 212 pruebas de navegador correctas, sin omisiones. Incluye diez integraciones nuevas de recordatorios/demo y las 68 comparaciones visuales de fases anteriores. La compilación genera las 27 páginas. El lanzador terminó y detuvo emuladores y servidores de pruebas. El log completo se conserva ignorado en .verificacion/github-pendientes-verificacion.log.

Estas pruebas de navegador no incorporan todavía recorridos específicos ni comparaciones visuales de los cuatro controladores nuevos de fase 9; sus accesos por rol sí entran en la matriz existente. Por eso esta publicación no declara cerrada fase 9. Siguen pendientes la pausa posterior, fases 10–12 y el ZIP final. Los avisos de seguridad de dependencias heredadas no se han corregido durante la subida.

Gitleaks volvió a revisar el historial completo y la exportación exacta de los archivos preparados, con salida 0 y sin fugas detectadas. Los informes redactados quedan fuera de Git. Los apartados siguientes conservan la evidencia de la primera publicación y su clonación limpia, anterior a este avance; no se atribuyen a esa copia las pruebas nuevas.

El avance se publicó en `86cd8bc05b72f6d8e6149e7c6ba3c7741c26919c`. Una consulta anónima a GitHub confirmó visibilidad pública, rama main y árbol completo de 177 archivos; la referencia remota coincidía con HEAD local. Después se actualizó por fast-forward la copia clonada e instalada anteriormente, sin reinstalar dependencias ni reutilizar node_modules del workspace principal: check, build de 27 páginas y las 43 unitarias finalizaron con salida 0 y Git quedó limpio. No se repitieron allí emuladores ni navegador; esos resultados pertenecen al workspace principal. Evidencia en .verificacion/github-continuacion-clon.log. Este registro se publica en un commit documental posterior, sin cambios de código.

## Repositorio comprobado

- Nombre: BarberPro-M13.
- Propietario: sergilo1906, confirmado tanto por el conector GitHub como por la sesión de la CLI.
- URL: https://github.com/sergilo1906/BarberPro-M13.
- Visibilidad: pública, comprobada mediante GitHub (visibility=public e isPrivate=false).
- Rama principal: main.
- Primer commit de fuente publicado: `e02d5968c0ea1f67b6d875b92b089bf826863196`.
- Cierre funcional de fase 8: `0e9855c`.
- Estado: fuente inicial subida, clonación e instalación limpia comprobadas.

La referencia remota y el HEAD de la copia clonada coinciden con ese SHA. No existía previamente un repositorio accesible con ese nombre; se creó en la cuenta autenticada después de verificar el contenido. No se utilizó force push ni se reescribió el historial. Se conservan las ramas locales de trabajo anteriores. La documentación de publicación se incorpora mediante un commit posterior; consultar main para su HEAD más reciente.

## Contenido incluido y excluido

La primera fuente publicada contiene 162 archivos versionados: frontend Astro/TypeScript, backend Functions, reglas e índices locales, estilos y favicon, manifiestos y lockfiles, tests, README, mapas vigentes e informes. Se publica la reconstrucción; no se sube la carpeta del proyecto original ni su ZIP.

Se excluyen node_modules, dist, cachés, .astro, .git como contenido, .env locales, resultados de navegador, logs y toda la carpeta .verificacion. Se mantiene .env.example con valores ficticios. Los usuarios y credenciales que construyen los fixtures pertenecen exclusivamente a emuladores y dominios example.test; no son cuentas reales ni credenciales administrativas de servicios externos. El README no contiene contraseñas.

## Revisión de seguridad

Gitleaks 8.30.1 descargado de su publicación oficial, con SHA256 del ZIP verificado antes de ejecutarlo. Se revisó el historial completo de las ramas locales y una exportación exacta del contenido versionado: ambas ejecuciones finalizaron con salida 0 y sin fugas detectadas. Los informes se generaron con redacción de valores y se conservan únicamente en .verificacion.

Se revisaron también las rutas incluidas: ningún node_modules, dist, .env local, resultado de pruebas o directorio original está versionado. Se sustituyeron las referencias actuales a la carpeta personal de adjuntos por identificadores documentales. No se copiaron credenciales del original. Los commits nuevos usan la identidad pública verificada del propietario y dirección noreply; se conserva sin reescribir la identidad de ejemplo de commits históricos. La asistencia de Codex se declara en README e informes.

Esta revisión de secretos no equivale a una auditoría completa de dependencias. Los avisos npm heredados y la revisión final de seguridad continúan registrados para fase 11. La aplicación sigue restringida a emuladores; no se han desplegado Cloud Functions, reglas, hosting ni recursos productivos.

## Verificación técnica

La implementación de fase 8 superó npm test con salida 0: 35 unitarias, 57 integraciones y 212 pruebas de navegador, incluidas 68 visuales, sin omisiones; build de 27 páginas. Astro/TypeScript informa cero errores, warnings y hints. El mensaje auxiliar «The build was canceled» de esbuild, que no impide concluir checker y build, está registrado en el informe de fase 8 para la revisión de herramientas. No se oculta como una consola totalmente silenciosa.

Se clonó el repositorio público en un directorio aislado ignorado dentro de .verificacion, con HEAD coincidente. npm ci, npm --prefix app ci y npm --prefix functions ci terminaron con salida 0, sin reutilizar node_modules del workspace. Los avisos heredados se reprodujeron: raíz 14 moderados; app 22 (9 moderados, 10 altos, 3 críticos); Functions 21 (15 moderados, 6 altos). No se ejecutó npm audit fix --force ni se declararon resueltos.

En esa copia limpia, npm run check, npm run build y npm run test:unit finalizaron con salida 0: checker sin diagnósticos, build de 27 páginas y 35 unitarias correctas. Se reproduce el mensaje auxiliar de esbuild ya documentado. La instalación no modificó archivos versionados. El frontend arrancó con npm --prefix app run preview -- --port 4321 y respondió HTTP 200 en /, /ayuda, /login y /favicon.svg; después se detuvo el servidor. No se ejecutó de nuevo la suite de emuladores/navegador en el clon, ni se afirma que se haya hecho.

La visibilidad pública se verificó además con una petición anónima a la API de GitHub, sin cabecera de autorización: repositorio sergilo1906/BarberPro-M13, private=false y default_branch=main. Se comprobaron frontend, backend, reglas, índices, README, documentación y favicon en la copia clonada. Los logs y copias de comprobación permanecen ignorados dentro de .verificacion.

## Limitaciones y continuación

Quedan fases 9, pausa obligatoria de tres horas, comparación integral de fase 10, auditoría/limpieza de fase 11 y documentación/ZIP de fase 12. La publicación inicial contiene cuatro vistas todavía reservadas y cuatro exports backend originales pendientes, identificados en cobertura. No se afirma que las 27 páginas tengan toda su funcionalidad final ni que el ZIP de entrega exista ya.

El prompt maestro sigue autorizado para continuar en ese orden. Los cambios posteriores se subirán de forma ordinaria, conservando las comprobaciones y sin publicar secretos o artefactos generados. El proyecto no se envía al profesor automáticamente.
