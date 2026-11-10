# Publicación de la fuente en GitHub

Fecha: 10 de noviembre de 2026, UTC. Autorización vigente: «subelo todo al github» y «Continua», junto con la solicitud anterior que especificaba repositorio público, propietario autenticado y rama main. Esta instrucción posterior permite publicar la fuente comprobada aunque la reconstrucción de las fases 9–12 todavía esté pendiente; no se presenta como entrega final ni despliegue de la aplicación.

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
