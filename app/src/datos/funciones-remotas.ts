import { httpsCallable } from "firebase/functions";
import { obtenerServiciosFirebase } from "./firebase";
import type { HuecoDisponible, ResultadoReserva, SolicitudReserva, EstadoCita } from "../modelos/agenda";

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
