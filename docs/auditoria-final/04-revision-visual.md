# Revisión visual de las 27 páginas

Se sirve el dist original en modo de referencia de solo lectura: sin sus scripts, SDK ni escritores. Los estados dinámicos se representan con renderizadores originales y adaptadores locales de datos ficticios. La reconstrucción sí utiliza Auth/Firestore/Functions emulados. No se conecta la aplicación original a datos reales ni se la recompila/modifica.

Mismas fuentes Manrope, tema claro, datos equivalentes, rol y estado. Escritorio 1440×1000 y móvil Chromium con perfil iPhone 13; tableta Chromium 820×1180. Es emulación de viewport, no Safari ni un dispositivo físico. Las fuentes se descargan de Google Fonts; si no están disponibles, la prueba puede fallar y no debe presentarse como una comparación equivalente.

Se compara texto, geometría, tipografía y colores, y se toman capturas reales original/reconstruida. Margen habitual 1/16 de CSS px; administración conserva el 1/8 previamente documentado. Umbral de imagen heredado: maxDiffPixelRatio 0.0003 y threshold 0.1. No se ampliaron para esconder los espacios eliminados por Astro nuevo.

## Estado por ruta

La pasada validada terminó con salida 0: 242 pruebas correctas en escritorio/móvil y 42 comparaciones correctas en tableta. Son 126 comparaciones visuales reales, sin omisiones, distribuidas en 42 estados por formato. Las 27 rutas del cuadro siguiente tienen comparación ejecutada en los tres tamaños. No se confunde el total de casos/estados con número de páginas.

| Ruta | Escenario comparado | Suite |
|---|---|---|
| / | Inicio público | comparacion-visual |
| /index-client | Entrada cliente pública | comparacion-visual |
| /ayuda | Contenido informativo | comparacion-visual |
| /legal | Contenido y enlaces | comparacion-visual |
| /planes | Presentación, sin contratación | comparacion-visual |
| /404 | Página no encontrada | comparacion-visual |
| /login | Formulario | autenticacion-visual |
| /registro | Formulario | autenticacion-visual |
| /verify | Aviso de verificación | autenticacion-visual |
| /perfil | Cuenta ficticia verificada | autenticacion-visual |
| /reservar | Disponible, vacío, confirmación | reservas-visual |
| /mis-citas | Vacío, listado, cancelar, mover | cliente-visual |
| /panel-barbero | Resumen profesional | personal-visual |
| /agenda | Vacío y listado | personal-visual |
| /setup-barber | Worker y gestión | personal-visual |
| /bloqueos | Vacío, bloque, vacaciones | personal-visual |
| /admin | Herramientas | administracion-visual |
| /admin/usuarios | Vacío y resultado | administracion-visual |
| /index-admin | Worker y gestión | administracion-visual |
| /equipo | Fichas | administracion-visual |
| /servicios | Catálogo administrativo | administracion-visual |
| /branding | Reglas de agenda | administracion-visual |
| /horarios | Resumen semanal | administracion-visual |
| /panel | Worker y gestión | restantes-visual |
| /kpis | Día, semana, mes | restantes-visual |
| /export | Listado y vacío | restantes-visual |
| /debug | Contenido informativo | restantes-visual |

Las capturas reales se conservan en app/.verificacion/referencia/{escritorio,movil,tableta}/{suite}/{caso}/original.png y reconstruida.png. Son evidencia local generada, excluida del código y del ZIP limpio. Se inspeccionaron además manualmente el par del resumen diario del profesional en escritorio y el par de KPIs diarios en tableta; no se atribuye inspección manual individual a todas las capturas automáticas.

## Diferencias detectadas y límites

La primera migración de compilador eliminó espacios entre elementos inline: Perfil concatenaba la etiqueta y el estado, y el selector KPI se desplazaba 2,8125 CSS px. Ocho comparaciones fallaron entre ambos dispositivos y tres periodos. Se corrigió con espacios explícitos en el marcado, conservando estilos y tolerancias. Las trazas de esa pasada se guardan ignoradas para contraste.

La referencia de estadísticas excluye registros rescheduled y pone a cero la duración cancelada solo al representar las tarjetas: documenta la corrección funcional del doble cómputo, no demuestra que la fórmula original fuera correcta. Las fórmulas se prueban aparte con datos conocidos. Los renderizadores originales que utilizan innerHTML reciben texto escapado para no ejecutar contenido hostil de fixtures. El nuevo DOM utiliza textContent.

Esta comparación abarca los estados enumerados; no todos los estados de cada página ni todas las combinaciones de navegadores, zoom, temas, accesibilidad o dispositivos. No se fabrican capturas de los escenarios no ejecutados.
