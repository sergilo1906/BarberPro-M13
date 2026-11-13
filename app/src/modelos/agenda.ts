import type { Timestamp } from "firebase/firestore";
export type EstadoCita = "confirmed" | "cancelled" | "done";
export interface Servicio {
    id: string;
    name: string;
    durationMin: number;
    price: number;
}
export interface ServicioAdministrable extends Servicio {
    active: boolean;
}
export interface Cita {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    userPhone?: string;
    serviceSnapshot?: Servicio;
    serviceId?: string;
    dateStr: string;
    timeStr: string;
    durationMin: number;
    // Los estados históricos se leen sin transformarlos ni habilitar acciones.
    status: string;
    startAt?: Timestamp;
}
export interface DiaHorario {
    active: boolean;
    ranges: {
        start: string;
        end: string;
    }[];
}
export interface SolicitudReserva {
    serviceId: string;
    dateStr: string;
    timeStr: string;
    requestId: string;
}
export interface ResultadoReserva {
    ok: boolean;
    bookingId: string;
    status: EstadoCita;
    startAt: string;
    endAt: string;
}
export interface HuecoDisponible {
    timeStr: string;
}
