# Segunda tanda: cliente, reserva y cambio de cita

Base de esta tanda: commit `8c9bbbe7a956e8640ad21d09cb7d558cdbfa65e7` en la rama `refactor/legibilidad-dam-2026-11-13`.

Se ha ordenado la lectura de tres controladores, sin modificar sus contratos ni sus rutas:
- `reservar-cita.ts`: selección de servicio, disponibilidad, confirmación e idempotencia al reintentar.
- `mis-citas.ts`: tarjetas del historial, botones de cancelación/reprogramación, limpieza al cambiar de sesión.
- `cambiar-cita.ts`: modal de cambio, consulta de huecos, confirmación y recuperación de respuesta incierta.

Las cadenas HTML constantes se representan ahora mediante fragmentos unidos con `join("")`. Se conserva el mismo texto HTML, sin insertar saltos de línea en el DOM.

## Recorrido para estudiar

1. En `reservar-cita.ts`, sigue `cargarServicios`, `cargarDisponibilidad`, `crearReserva` y `enviarReserva`.
2. En `mis-citas.ts`, sigue `cargarMisCitas`, `mostrarCitas`, `cancelarCita` y `cambiarCita`.
3. En `cambiar-cita.ts`, distingue el hueco elegido, la solicitud pendiente y el estado `enviando`. No son variables intercambiables.
4. El backend verifica por segunda vez los permisos y la ocupación antes de escribir la cita. La interfaz nunca es fuente de autorización.
5. La misma `requestId` se reutiliza al comprobar una operación cuya respuesta pudo perderse.

## Validación pendiente

Estos cambios se han preparado desde la API de GitHub, sin disponer de un entorno de ejecución del proyecto completo. Antes de fusionarlos hay que hacer la regresión real `npm test` en emuladores aislados, comprobar los formularios en navegador y crear una entrega nueva solo si todo pasa. La release histórica permanece intacta. Conservar la declaración de asistencia de IA.
