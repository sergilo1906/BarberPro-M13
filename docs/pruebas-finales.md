# Pruebas finales y alcance

Los resultados vigentes y los intentos de esta segunda revisión se consolidan en [revisión total](revision-total-2026-11-10.md). Este documento no convierte una fase parcial en cerrada ni afirma cobertura de ejecución del 100 %.

**Cierre técnico del 11 de noviembre: COMPLETA CON LIMITACIONES.** La regresión corregida completa termina 0: checker de 106 archivos sin diagnósticos, 44 unitarias, 69 integraciones y 284 navegador, incluidas 126 visuales, sin omisiones; build de 27 páginas. La nueva comparación visual de cierre pasa 126/126 en tres formatos. Se conservan los intentos fallidos y sus correcciones RT-02/RT-05/RT-06. No se suman las pasadas como si fueran casos distintos. La instalación/pruebas del ZIP exacto se acreditan separadamente en el informe de validación adjunto.

## Entorno y comandos

Node 22.23.4 y npm 10.9.0; Java 21 para Firestore; Chromium de Playwright. Instalación y activación demo en [README](../README.md). Los tres emuladores deben ser desechables y sus puertos estar libres. No se utilizan datos reales, correo real ni Firebase productivo.

```powershell
npm ci
npm --prefix app ci
npm --prefix functions ci
npm --prefix app exec -- playwright install chromium
npm test
```

`npm test` encadena checker, sintaxis backend, unitarias y el lanzador de emuladores. Este ejecuta integraciones, build, navegador escritorio/móvil y comparación en tableta. Elimina únicamente fixtures de demo-barberpro-m13 y detiene sus servicios. Un fallo mantiene salida distinta de cero.

## Qué se comprueba

| Grupo | Comportamiento comprobado |
| --- | --- |
| Tipos y compilación | Plantillas Astro, TypeScript, sintaxis backend y generación de 27 páginas. |
| Unitarias | Fechas reales/DST, formularios, sesión, horarios, estados, KPIs, CSV, ICS y validaciones backend. |
| Auth y reglas | Cuatro roles, verificación, token/versión, perfil propio, intentos de escalada y lecturas/escrituras ajenas. |
| Reservas | Disponibilidad, duración, descansos, preferencias, conflictos, concurrencia, locks, cancelación, cambio e idempotencia. |
| Profesional y administración | Semanas, bloques, permisos, revisión, servicios, equipo, roles y configuración. |
| Restantes | Recordatorios y simulación sin escrituras, demo protegida, KPIs, CSV y limpieza al cambiar de identidad. |
| Navegador | Navegación, formularios, datos, errores, reintentos, respuestas perdidas y descarga. |
| Visual | 42 estados de las 27 rutas en escritorio, móvil y tableta; original aislado y datos ficticios equivalentes. |
| Entrega | Descarga pública y checksum; exclusiones de archivos privados/generados; instalación del candidato con su alcance explícito. |

La [primera auditoría](auditoria-final/06-pruebas-ejecutadas.md) registra 44 unitarias, 69 integraciones y 284 pruebas de navegador correctas, incluidas 126 visuales. Son resultados históricos identificados, no una afirmación anticipada sobre una nueva ejecución. La nueva revisión distingue la pasada inicial de la regresión posterior a sus correcciones.

## Límites

Sin la compilación original local, las comparaciones visuales se omiten expresamente. No se cuentan como aprobadas. No se prueban Safari ni dispositivos físicos, correo real, despliegues, índices productivos, carga productiva o cada combinación posible de datos. Las pruebas del emulador no certifican firmas criptográficas productivas. No se ha medido un porcentaje de líneas/rama ni la equivalencia individual de cada símbolo histórico.

Los logs de pruebas y credenciales ficticias efímeras permanecen en carpetas ignoradas. Los informes conservan comandos, cantidades y errores relevantes sin publicar tokens. La lectura de los tests y los resultados debe acompañar cualquier afirmación de cumplimiento.
