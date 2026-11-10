# Entrega, secretos y GitHub

Actualización posterior al cierre de auditoría: el usuario autoriza «Subelo todo al github». La publicación de las correcciones y el candidato verificado se registra en [publicación GitHub](../fase-github-publicacion.md). Los apartados siguientes conservan el estado comprobado antes de esta autorización; los informes incluidos en el ZIP permanecen congelados y no se altera el paquete validado.

## Estado inicial y fuente

No existía ZIP final de la reconstrucción al recibir la auditoría. El ZIP del directorio padre es el original y se conserva intacto. No se afirma haber validado una entrega de fase 12 inexistente.

La fuente auditada contiene frontend, backend, reglas, índices, manifiestos/lockfiles, recursos, tests y documentación. scripts/preparar-entrega.ps1 enumera únicamente archivos propios versionados/versionables del checkout, rechaza rutas privadas/generadas y no sobrescribe un paquete anterior. Copia los bytes del workspace para conservar sus hashes; .git, node_modules, dist, .astro, .verificacion, .env locales, logs, resultados de navegador y entrega quedan fuera. Se conserva app/.env.example ficticio. El archivo original no se incluye.

Los fixtures contienen valores públicos ficticios y contraseñas de prueba para cuentas example.test efímeras del emulador; no representan credenciales privadas ni usuarios reales. No se describe falsamente el código de pruebas como carente de cualquier literal de contraseña. Los tokens, enlaces de verificación y bases de datos generadas durante tests no forman parte del paquete.

## Paquete candidato de auditoría

Se generó BarberPro-M13-auditoria-ejecucion-2026-11-10.zip, 199 archivos, SHA256 d3ea5c1e9a9440521e34ba8cdce6a1c20f2df378c218ee307a58207e3f87c73e. Se extrajo en una carpeta nueva dentro de .verificacion/auditoria-final, sin reutilizar node_modules. Los 197 archivos con hash del inventario coincidieron byte a byte; los dos informes autogenerados no se incluyen en sus propios hashes. El original no se copia ni modifica.

npm ci en raíz, app y Functions terminó con salida 0, y se comprobó la instalación de Chromium siguiendo README. El shim npm.ps1 de Windows utilizó el Node global 24 y mostró un aviso de engine para Functions, aunque el PATH apuntara al runtime privado 22. No se oculta ese aviso: la comprobación final de instalación invoca explícitamente npm-cli.js con Node 22.23.4, sin modificar el Node global.

En el paquete de ejecución se ejecutó npm test con salida 0: checker y build de 27 páginas, 44 unitarias, 69 integraciones y 158 pruebas funcionales de navegador correctas. Se omiten explícitamente 84 comparaciones en escritorio/móvil y 42 en tableta por no existir el original junto a la extracción. Las 126 visuales no se cuentan como superadas en este paquete; sus PASS pertenecen a la ejecución del workspace. Log en .verificacion/auditoria-final/pruebas-extraidas.log. La suite detuvo sus servicios.

El candidato final BarberPro-M13-auditoria-2026-11-10-r1.zip incorpora estos resultados y el recuento AST del original, sin introducir cambios adicionales en la aplicación ni backend. Se extrae nuevamente y se verifica instalación, checker, build, unitarias y arranque. Los resultados y SHA256 exactos del artefacto final se guardan junto a él, en entrega/validacion-auditoria-2026-11-10.md y el archivo .sha256, para evitar que un informe se referencie mediante su propio hash. Se conservan los paquetes de ejecución y revisión documental anteriores, sin sobrescribirlos.

Gitleaks 8.30.1 revisó historial completo y fuente exacta del paquete de ejecución: ambos salieron 0 sin fugas detectadas, con informes redactados fuera de Git. El original conserva sus 94 hashes de referencia. El candidato final vuelve a escanearse antes del cierre. El paquete es un candidato auditado con limitaciones, no una certificación de que las doce fases estén cerradas.

## Repositorio remoto

URL: https://github.com/sergilo1906/BarberPro-M13. Propietario confirmado: sergilo1906. El conector verifica visibilidad public y rama main. git ls-remote confirma 5b11204de6b391e582ce41aaa3634c157ea2b313 como versión publicada anterior. Hay 177 archivos en aquella publicación, con Astro/Vitest heredados y sin los informes/correcciones de esta auditoría.

Los cambios se conservan en la rama local auditoria-final-2026-11-10, creada desde main tras comprobar que no había modificaciones del usuario. No se hace push, no se crea otro repositorio, no se cambia visibilidad ni se reescribe historia. Un commit local no equivale a publicación; el paquete auditado no coincide con GitHub hasta una autorización posterior explícita para subirlo.

La clonación e instalación limpia de la publicación anterior están documentadas en fase-github-publicacion.md; no se presentan como instalación de este candidato nuevo. Las diferencias materiales incluyen runtime/dependencias, permisos transaccionales de roles, conservación de ficha, ICS, disponibilidad, pruebas y documentación. La asistencia de IA permanece declarada y no se inventan horas ni revisión manual del alumno.
