import { httpsCallable } from "firebase/functions";
import { obtenerServiciosFirebase } from "./firebase";
import type { HuecoDisponible, SolicitudReserva, ResultadoReserva, ServicioAdministrable } from "../modelos/agenda";
import type { ConfiguracionAgenda } from "../modelos/aplicacion";
async function llamar<Entrada, Salida>(nombre: string, datos: Entrada): Promise<Salida> {
    const servicios = obtenerServiciosFirebase();
    if (!servicios) {
        throw new Error("Firebase no configurado.");
    }
    return (await httpsCallable<Entrada, Salida>(servicios.funcionesRemotas, nombre)(datos)).data;
}
export function consultarDisponibilidad(datos: Pick<SolicitudReserva, "dateStr" | "serviceId">) {
    return llamar<typeof datos, {
        slots: HuecoDisponible[];
    }>("getAvailability", datos);
}
export function solicitarReserva(datos: SolicitudReserva) {
    return llamar<SolicitudReserva, ResultadoReserva>("createBooking", datos);
}
export function cancelarReserva(bookingId: string) {
    return llamar("cancelBooking", { bookingId });
}
export function completarReserva(bookingId: string) {
    return llamar("completeBooking", { bookingId });
}
export function guardarServicio(servicio: ServicioAdministrable) {
    return llamar("saveService", { ...servicio, serviceId: servicio.id });
}
export function guardarHorario(datos: ConfiguracionAgenda) {
    return llamar("saveSchedule", datos);
}
export function cerrarDia(dateStr: string, closed: boolean) {
    return llamar("setClosedDay", { dateStr, closed });
}
