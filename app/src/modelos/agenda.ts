import type { Timestamp } from "firebase/firestore";

export type EstadoCita = "pending" | "confirmed" | "cancelled" | "done" | "no_show" | "rescheduled";
export interface Servicio { id: string; name: string; durationMin: number; price: number; }
export interface HuecoDisponible { timeStr: string; barberUid: string; }
export interface SolicitudReserva {
  dateStr: string; timeStr: string; serviceId: string; barberPreference: string | null;
  anyBarber: boolean; customerPhone?: string; customerNotes?: string; requestId?: string;
}
export interface ResultadoReserva { ok: boolean; bookingId: string; barberUid: string; status: EstadoCita; startAt: string; endAt: string; }
export interface Cita {
  id: string; userId: string; userEmail: string; userName: string; userPhone: string;
  barberUid: string; serviceId: string; serviceSnapshot: Omit<Servicio, "id">;
  durationMin: number; dateStr: string; timeStr: string; customerNotes: string; status: EstadoCita;
  startAt: Timestamp; endAt: Timestamp; lockKeys: string[]; rescheduledFrom?: string; rescheduledTo?: string;
}
