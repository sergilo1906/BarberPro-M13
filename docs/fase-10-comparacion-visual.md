# Fase 10 — evidencia de comparación recogida en auditoría

**Repetición en el cierre definitivo, 11/11/2026:** la nueva regresión completa termina 0 a las 20:22:24 UTC, con 126 comparaciones visuales incluidas en los 284 casos de navegador y ninguna omitida. El original seguro seguía disponible; se conservan aserciones, tolerancias, diseño y formatos. Evidencia nueva: `.verificacion/cierre-definitivo-2026-11-11/regresion-workspace.log` y [resultado final](cierre-definitivo/resultado-final.md). Los apartados siguientes conservan resultados históricos, sin atribuirlos al ZIP independiente.

**Cierre técnico del 11 de noviembre de 2026: COMPLETA CON LIMITACIONES.** La comparación de cierre iniciada a las 06:25:00 UTC pasa 126/126 casos, sin omisiones, tras reanudar el trabajo. Se conserva el intento previo de 123 aprobados y tres fallos de fixture de Perfil: se corrige la cuenta usada por la prueba, no el aspecto, las tolerancias o las aserciones. Esto no retrofecha ni certifica el orden histórico de las fases anteriores. Evidencia: .verificacion/cierre-profesor-2026-11-11/visual-corregida.log y [revisión total](revision-total-2026-11-10.md).

Se conservan 27 rutas. Hay 42 estados comparados por formato, incluyendo públicos, acceso, perfil, reserva, cliente, profesional, administración, resumen, KPIs, exportación y diagnóstico. Los formatos son escritorio 1440×1000, móvil iPhone 13 emulado en Chromium y tableta 820×1180. Los estados y la correspondencia por ruta se detallan en la auditoría visual; no se suman estados como si fueran páginas adicionales.

El servidor de referencia lee el original en disco y retira scripts/SDK. Sus renderizadores de presentación se aíslan y reciben fixtures ficticios autorizados. Los datos hostiles se escapan para mostrar texto en lugar de ejecutar HTML. Se utiliza el mismo rol, datos equivalentes, fuentes y geometría de ventana en ambas superficies.

Las pruebas verifican texto, estilos calculados, geometría y capturas reales. El margen general de geometría es 1/16 de píxel CSS, con el margen administrativo documentado de 1/8. La comparación de imagen conserva threshold 0.1 y maxDiffPixelRatio 0.0003. No se amplían tolerancias para ocultar fallos. Las imágenes de esta revisión se generan en app/.verificacion/referencia, fuera de Git.

Se revisaron manualmente, además, las dos capturas de Servicios en móvil de la nueva pasada; sus archivos se generaron a las 21:46:53 UTC del 10 de noviembre de 2026. Esta inspección puntual no se presenta como revisión manual de todas las imágenes. La comparación automatizada es la evidencia del resto de estados.

Las diferencias de espacios por el compilador y las correcciones visuales anteriores están registradas en la primera auditoría. La fórmula de KPI corregida se adapta explícitamente en la referencia: se compara presentación equivalente, sin afirmar que los errores de cómputo del original se hayan conservado. La corrección posterior del botón Activar/Desactivar afecta a comportamiento, no al aspecto.

Sin la compilación original, las pruebas se omiten expresamente: una extracción aislada del ZIP no inventa una referencia. Tampoco se certifican Safari, dispositivos físicos, todos los estados de error o todas las combinaciones posibles. La existencia de capturas y pruebas no cierra la trazabilidad semántica pendiente de la reestructuración.
