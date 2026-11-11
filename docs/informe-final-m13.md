# Informe final M13 — estado para revisión

El [cierre definitivo](cierre-definitivo/resultado-final.md) registra la nueva comprobación y la entrega final. Empezar por [leer primero](ENTREGA-LEER-PRIMERO.md); la [guía de defensa](GUIA-DEFENSA-M13.md) acompaña el material técnico. Los datos exactos del nuevo ZIP y del commit se identifican en su validación externa.

Informe técnico de cierre del 11 de noviembre de 2026 para preparar la defensa. Las doce fases quedan documentadas como completas con limitaciones en su alcance técnico actual; no se inventa una cronología histórica, horas del alumno ni revisión personal. La [guía de entrega](entrega-profesor.md), [revisión total](revision-total-2026-11-10.md) y validación adjunta del paquete identifican resultados y límites.

## A. Proyecto

BarberPro Studio gestiona reservas y agenda de barbería para cliente, profesional, responsable y administrador. La reconstrucción conserva 27 rutas y los trece exports backend originales; añade seis operaciones protegidas. El proyecto original se conserva como referencia, separado de esta fuente.

## B. Funcionalidades

Cuentas, perfil y verificación; servicios y disponibilidad; crear, cancelar y cambiar cita; historial del cliente; agenda, semanas y bloqueos profesionales; usuarios, roles, equipo y configuración; estadísticas, CSV/ICS, cola de recordatorios y herramientas demo. [Funcionalidades y límites](funcionalidades-finales.md).

## C. Tecnologías

Astro estático, TypeScript en frontend, Tailwind y Firebase SDK. Backend JavaScript ESM con Admin/Functions. Node 22.23.4. Pruebas con Vitest, Node Test Runner, Firebase Emulator Suite y Playwright/Chromium. Los lockfiles fijan las dependencias; los avisos moderados pendientes se describen en la revisión.

## D. Arquitectura

Páginas y componentes → controladores → datos/servicios → backend autorizado. Modelos, fechas, validaciones y exportaciones se comparten. [Estructura para explicar](estructura.md) y [arquitectura](arquitectura.md).

## E. Reestructuración

Hay 94 correspondencias de archivos y 3.122 registros con ubicación o decisión: 1.055 declaraciones, 552 contratos referenciados, 132 resoluciones manuales de funciones y 1.383 enlaces de ámbito reestructurado. Los módulos se fusionan o separan por responsabilidad y conservan los contratos necesarios. No se confunde esa trazabilidad con prueba formal de equivalencia individual ni ejecución del 100 %. [Mapas](mapa-archivos.md), [símbolos](mapa-simbolos.md) y [matriz funcional](matriz-requisitos.md).

## F. Seguridad

Roles/versiones contrastados con Auth y perfil; comprobación en transacciones; reglas que cierran escrituras de negocio; validaciones, idempotencia y controles diarios de agenda. Textos de datos sin HTML ejecutable; escapes CSV/ICS. Solo emuladores locales del proyecto demo; no se incluye una modalidad productiva. La revisión no equivale a garantía de seguridad absoluta ni prueba de producción.

## G. Pruebas

[Pruebas finales](pruebas-finales.md) describe comandos y alcance. La [revisión total](revision-total-2026-11-10.md) distingue ejecuciones nuevas, correcciones, pruebas del workspace y comprobaciones del paquete. Los resultados anteriores se conservan como evidencia histórica, sin atribuirlos automáticamente a otra versión.

## H. Comparación

Se comparan 42 estados de las 27 páginas en tres formatos con referencia original aislada. Se contrastan texto, estilos, geometría y capturas. No se ejecutan escritores ni SDK originales. Las correcciones de fórmulas KPI y seguridad no se presentan como equivalencia exacta de la lógica antigua. Los perfiles móvil/tableta son Chromium emulado.

## I. Limitaciones y registro académico

La trazabilidad conserva sus niveles de evidencia; no es una prueba matemática de cada símbolo. Persisten 14 nodos moderados en herramientas y nueve en Functions; app no tiene alertas y ninguno de los tres árboles presenta altas/críticas en el análisis ejecutado. Solo se ha verificado el entorno demo, sin SMTP, despliegue, dispositivos físicos o carga productiva. El [registro académico](registro-academico.md) declara asistencia de Codex y reserva los datos personales/horas a la información real del alumno. El intervalo de reanudación se registra sin afirmar una espera activa mantenida ni reconstruir el orden histórico.

## J. Entrega

Fuente pública: https://github.com/sergilo1906/BarberPro-M13. La [entrega definitiva](https://github.com/sergilo1906/BarberPro-M13/releases/tag/cierre-definitivo-2026-11-11) adjunta BarberPro-M13-cierre-definitivo-2026-11-11.zip, checksum y validación con lista de contenido. Las entregas anteriores se conservan como historial. El informe externo identifica commit, hash, instalación y pruebas sobre la extracción, evitando autorreferencias. La publicación de fuente autorizada no despliega la aplicación; el alumno revisa y envía personalmente la entrega.

**OPCIÓN B — APTO CON LIMITACIONES DOCUMENTADAS** para entregar esta demo local a revisión académica. No se certifican producción, equivalencia universal ni aceptación o calificación del profesor.
