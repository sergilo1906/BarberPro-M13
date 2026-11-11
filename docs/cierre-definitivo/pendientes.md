# Problemas y decisiones del cierre definitivo

Base comprobada el 11/11/2026: rama main limpia, commit `db4139dcf373c8d97af0f36eec40e2b1fa649a82`, remoto público autorizado sin avance inesperado. La release preliminar y su validación se conservan. No se reinician las doce fases.

| ID | Tipo | Hallazgo real y tratamiento | Estado |
| --- | --- | --- | --- |
| CD-01 | Mejora menor | Faltaban una entrada breve única, guía de defensa con preguntas y borradores ES/CAT. Se añaden sin reescribir la lógica o diseño. | Resuelto documentalmente. |
| CD-02 | Mejora menor | No había workflow de GitHub Actions. Se prepara comprobación mínima, acciones fijadas a commit, permiso contents:read y sin despliegue/secretos. | Preparado; resultado remoto en validación adjunta. |
| CD-03 | Verificación pendiente resuelta | Repetir regresión, cuatro roles, concurrencia y visuales con el original seguro disponible. | npm test 0, 11/11/2026 20:10:44–20:22:24 UTC: 44 unitarias, 69 integraciones y 284 navegador, incluidos 126 visuales; sin fallos/omisiones. |
| CD-04 | Verificación del artefacto | Probar el nuevo ZIP exacto desde cero y verificar los adjuntos públicos. No reutilizar el verde del paquete anterior. | La validación externa identifica hash/commit, instalación, pruebas y descargas del ZIP congelado; consultar ese adjunto para acreditar el artefacto. |
| CD-05 | Limitación conocida | npm audit nuevo: raíz 14 nodos moderados, app 0, Functions 9; ninguna alta/crítica. Sin reparación compatible dentro de los rangos actuales en la simulación segura. | Riesgo analizado en dependencias.md; avisos no resueltos ni ocultados. |
| CD-06 | Limitación conocida | Emuladores, cola sin envío, cron/hosting sin desplegar, Chromium emulado, ausencia de certificación productiva y cobertura individual de símbolos. | Deliberado, documentado; no es funcionalidad esencial rota. |
| CD-07 | Requisito académico personal | Nombre/datos, horas reales, revisión y comprensión del alumno; normas exactas del centro no facilitadas. | Pendiente exclusivamente de confirmación personal, sin estimaciones inventadas. |
| CD-08 | Mejora menor conservada | Cuatro helpers locales mostrarMensaje tienen el mismo cuerpo corto. No duplican disponibilidad o persistencia. | Sin refactorización cosmética; se conservan para no alterar código probado. |

No se ha identificado un error crítico ni importante nuevo en los recorridos comprobados. La conclusión se apoya en las pruebas nuevas y en la validación específica adjunta del ZIP; no se deduce de los informes anteriores. Las limitaciones y los datos personales no confirmados permanecen expresamente abiertos, sin eliminar pruebas ni relajar tolerancias.

Ver [resultado final](resultado-final.md), [registro académico](../registro-academico.md) y la validación adjunta de la release de cierre. Los artefactos anteriores se conservan como historial.
