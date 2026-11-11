# Estructura para la defensa de BarberPro M13

Esta guía describe la aplicación reconstruida. El [informe de revisión total](revision-total-2026-11-10.md) distingue lo comprobado de los requisitos pendientes. La [arquitectura](arquitectura.md) amplía este resumen.

| Ubicación | Qué hace |
| --- | --- |
| app/src/pages | Las 27 pantallas Astro y sus rutas. |
| app/src/layouts y components | Presentación común, navegación y leyenda de disponibilidad. |
| app/src/modulos | Responde a formularios, botones y cambios de sesión de cada área. |
| app/src/datos | Integra Auth, lecturas Firestore y llamadas a Functions. |
| app/src/modelos | Define las interfaces de cuentas, citas, horarios e interfaz. |
| app/src/comun | Comparte fechas, permisos, validaciones, errores y modales. |
| app/src/exportaciones | Genera CSV e ICS en el navegador. |
| functions/index.js | Declara los nombres públicos de las operaciones backend. |
| functions/src | Valida identidad, permisos y datos; calcula y guarda operaciones. |
| functions/scripts | Herramientas explícitas para el entorno demo local. |
| app/tests y functions/tests | Pruebas unitarias, de integración y navegador. |
| docs y scripts | Evidencias, mapas, inventario y preparación de paquetes. |

Una reserva recorre reservar.astro → reservar-cita.ts → funciones-remotas.ts → createBooking → persistencia-reservas.js. El navegador presenta opciones; el backend vuelve a validar identidad, horario, servicio y ocupación antes de confirmar la transacción.

Auth identifica al usuario. Firestore guarda perfiles, profesionales, semanas, servicios, citas, bloqueos, controles y notificaciones. Functions ejecuta las operaciones privilegiadas. Las reglas impiden escribir datos de negocio directamente desde el SDK del navegador. Ocultar una pantalla no sustituye esos permisos.

Las transacciones leen los controles diarios que también modifican reservas, semanas y bloqueos. Una operación concurrente incompatible obliga a reevaluar la ocupación. Los identificadores de solicitud permiten recuperar respuestas perdidas sin duplicar altas.

Se reutilizan las tarjetas de citas, los modelos y las funciones de datos. No se han añadido clases artificiales. Las transacciones y el modal de cambio de cita conservan funciones extensas por su coordinación; conviene explicarlas con un recorrido y sus pruebas.

El proyecto acepta exclusivamente emuladores demo en loopback. No existe una configuración productiva habilitada. El original se consulta como referencia y no forma parte de la instalación ni de la entrega. Consultar [README](../README.md), [rutas](rutas-y-roles.md) y [correspondencias](auditoria-final/correspondencias-archivos.md).
