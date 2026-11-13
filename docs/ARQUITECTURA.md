# Arquitectura

Astro genera 27 páginas estáticas; TypeScript coordina formularios y sesión en el navegador. Tailwind define la presentación. Auth identifica al usuario; Firestore guarda perfiles, equipo, semanas, catálogo, citas, ocupación y notificaciones; Functions valida y guarda las operaciones privilegiadas. Todo funciona en emuladores locales.

| Carpeta | Responsabilidad |
| --- | --- |
| app/src/pages, layouts y components | Páginas y presentación común; se conservan las URLs, HTML, clases y accesibilidad. |
| app/src/modulos | Controladores organizados por cuentas, reservas, profesionales, administración, navegación y estadísticas. |
| app/src/datos | Observación de sesión, consultas y llamadas remotas. |
| app/src/comun, modelos, exportaciones | Validaciones/fechas/permisos compartidos, interfaces y CSV/ICS. |
| functions/index.js y functions/src | 19 exports, incluidos los 13 originales, separados por responsabilidad. |
| functions/scripts | Lanzador de emuladores y preparación explícita de fixtures/roles locales. |
| app/tests y functions/tests | Unidad, integración con reglas/Functions y navegador. |
| docs y scripts | Documentación final, trazabilidad reproducible y empaquetado. |

## Seguir una reserva

reservar.astro → reservar-cita.ts → funciones-remotas.ts → createBooking → intentarCrearReservaAtomica. El cliente presenta opciones, pero el backend vuelve a comprobar identidad, permisos, servicio activo, fecha/zona, duración, semana publicada, descansos y ocupación.

La transacción lee identidad vigente, recibo requestId, configuración, cita anterior cuando procede, profesionales/controles, disponibilidad y locks antes de escribir. La nueva cita se prepara en memoria. Después confirma conjuntamente cita, ocupación, controles diarios, historial de reprogramación, resultado idempotente y confirmación queued. No se divide en escrituras independientes. Los controles diarios permiten detectar carreras incluso entre intervalos parcialmente solapados o cambios de horario/bloqueos.

Si se pierde una respuesta, repetir requestId y datos devuelve el resultado guardado; cambiar sus datos se rechaza. Cancelar libera solo locks propios; una reprogramación fallida conserva la cita anterior. Las operaciones de agenda y administración aplican revisión e idempotencia, sin escribir antes de terminar sus lecturas.

## Sesión y autorización

El navegador usa contextos con revisión para descartar respuestas de una identidad anterior. Ocultar botones no autoriza: las reglas cierran escrituras de negocio y limitan lecturas. Functions comprueba Auth, correo cuando procede, claims, rol/versión y perfil; las transacciones vuelven a leer permisos del actor. setMyRole deniega el autoservicio de roles; adminSetClaims exige administrador autorizado. Auth y Firestore no comparten transacción: una versión discordante deniega el acceso hasta recuperar coherencia.

La fábrica Admin exige proyecto demo y hosts exactos en loopback. No hay configuración productiva activable ni secretos administrativos. CSV neutraliza fórmulas de texto, ICS usa UTC y plegado por bytes; los textos variables se muestran mediante textContent. [Límites](SEGURIDAD-Y-LIMITACIONES.md), [matriz](MATRIZ-REQUISITOS.md) y [trazabilidad](ANEXO-TRAZABILIDAD.md).
