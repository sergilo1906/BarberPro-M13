import { httpsCallable } from "firebase/functions";
import { obtenerServiciosFirebase } from "./firebase";
import type { HuecoDisponible, ResultadoReserva, SolicitudReserva, EstadoCita, OperacionAgenda } from "../modelos/agenda";

async function llamarFuncion<Entrada, Salida>(nombre: string, datos: Entrada): Promise<Salida> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  return (await httpsCallable<Entrada, Salida>(servicios.funcionesRemotas, nombre)(datos)).data;
}

export function consultarDisponibilidad(datos: Pick<SolicitudReserva, "dateStr" | "serviceId" | "barberPreference" | "anyBarber">) {
  return llamarFuncion<typeof datos, { ok: boolean; slots: HuecoDisponible[] }>("getAvailability", datos);
}
export function solicitarReserva(datos: SolicitudReserva) { return llamarFuncion<SolicitudReserva, ResultadoReserva>("createBooking", datos); }
export function cancelarReserva(bookingId: string, reason = "") {
  return llamarFuncion<{ bookingId: string; reason: string }, { ok: boolean; bookingId: string; status: EstadoCita }>("cancelBooking", { bookingId, reason });
}
export function reprogramarReserva(datos: { bookingId: string; newDateStr: string; newTimeStr: string; barberPreference: string | null; anyBarber: boolean; requestId?: string }) {
  return llamarFuncion<typeof datos, { ok: boolean; oldBookingId: string; newBookingId: string; status: EstadoCita }>("rescheduleBooking", datos);
}
export function actualizarEstadoReserva(bookingId: string, nextStatus: EstadoCita) {
  return llamarFuncion<{ bookingId: string; nextStatus: EstadoCita }, { ok: boolean; bookingId: string; status: EstadoCita }>("updateBookingStatus", { bookingId, nextStatus });
}

export function ejecutarOperacionAgenda(operacion: OperacionAgenda) {
  const nombre = operacion.tipo === "semana" ? "saveWeeklySchedule" : operacion.tipo === "crear-bloqueo" ? "createScheduleBlock" : "deleteScheduleBlock";
  return llamarFuncion<typeof operacion.datos, { ok: boolean; blockId?: string; revision?: number; visible?: boolean }>(nombre, operacion.datos);
}

const operacionesAgenda = new Map<string, OperacionAgenda>();
function claveOperacion(uid: string, area: string): string { return "barberpro-agenda-" + area + "-" + uid; }
export function guardarOperacionAgenda(uid: string, area: string, operacion: OperacionAgenda): void {
  const clave = claveOperacion(uid, area);
  operacionesAgenda.set(clave, operacion);
  try { sessionStorage.setItem(clave, JSON.stringify(operacion)); } catch { /* Recuperación en memoria si no hay almacenamiento. */ }
}
export function recuperarOperacionAgenda(uid: string, area: string): OperacionAgenda | null {
  const clave = claveOperacion(uid, area);
  try {
    const operacion = JSON.parse(sessionStorage.getItem(clave) || "null");
    if (!operacion) operacionesAgenda.delete(clave);
    if (["semana", "crear-bloqueo", "eliminar-bloqueo"].includes(operacion?.tipo) && typeof operacion.datos?.requestId === "string") operacionesAgenda.set(clave, operacion);
  } catch { /* Se conserva la recuperación en memoria. */ }
  return operacionesAgenda.get(clave) || null;
}
export function borrarOperacionAgenda(uid: string, area: string): void {
  const clave = claveOperacion(uid, area);
  operacionesAgenda.delete(clave);
  try { sessionStorage.removeItem(clave); } catch { /* Almacenamiento deshabilitado. */ }
}
