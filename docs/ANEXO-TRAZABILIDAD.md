# Anexo de trazabilidad

Se conserva la evidencia necesaria sin repetir inventarios ni diarios de ejecución:

- trazabilidad/archivos-originales.json: 94 correspondencias entre originales y destinos, con decisiones y límites.
- trazabilidad/simbolos-originales.json: 3.122 metadatos de nombres, posiciones y ámbitos; no copia código ni credenciales originales.
- trazabilidad/resoluciones-funciones.json: 132 decisiones manuales de funciones renombradas, fusionadas, sustituidas o retiradas por seguridad.
- trazabilidad/simbolos-actuales.json: salida generada con referencias reales y niveles de evidencia. Es el único inventario extenso actual; no se duplica en Markdown.

Tras instalar app: node scripts/trazar-simbolos.mjs. Funciona desde el ZIP sin .git, planificación ni original. Valida IDs, archivos, anclas y evidencias. La refactorización conserva nombres públicos y recalcula posiciones/referencias; los niveles pueden variar por la estructura de declaraciones. Ninguna fila se equipara a prueba formal de equivalencia individual o ejecución de cada variable. Los tests verifican comportamiento por áreas; [matriz](MATRIZ-REQUISITOS.md), [arquitectura](ARQUITECTURA.md) y [pruebas](PRUEBAS.md) aportan contexto.

Se revisan las 27 páginas sin rediseño. Los trece contratos originales se mantienen entre los 19 exports actuales; setMyRole se conserva pero deniega elevar privilegios. Se preservan transacciones, requestId, ocupación y versiones de permisos. El original separado sigue de referencia, sin modificaciones.

La documentación histórica y generadores redundantes se retiran del árbol actual tras incorporar su información necesaria; Git y releases anteriores conservan procedencia, correcciones e intentos. No se han quitado tests, aserciones o funcionalidades para reducir archivos.
