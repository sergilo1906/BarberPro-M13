import type { Timestamp } from "firebase/firestore";

export type EstadoCita = "pending" | "confirmed" | "cancelled" | "done" | "no_show" | "rescheduled";
export interface Servicio { id: string; name: string; durationMin: number; price: number; }
export interface ServicioAdministrable extends Servicio { active: boolean; adminRevision: number; }
export interface HuecoDisponible { timeStr: string; barberUid: string; }
export interface SolicitudReserva {
  dateStr: string; timeStr: string; serviceId: string; barberPreference: string | null;
  anyBarber: boolean; customerPhone?: string; customerNotes?: string; requestId?: string;
}
export interface ResultadoReserva { ok: boolean; bookingId: string; barberUid: string; status: EstadoCita; startAt: string; endAt: string; }
export interface Cita {
  id: string; userId: string; userEmail: string; userName: string; userPhone: string;
  barberUid: string; serviceId: string; serviceSnapshot: Partial<Omit<Servicio, "id">> & { id?: string };
  durationMin: number; dateStr: string; timeStr: string; customerNotes: string; status: EstadoCita;
  startAt?: Timestamp; endAt?: Timestamp; lockKeys: string[]; rescheduledFrom?: string; rescheduledTo?: string;
  serviceName?: string; service?: string;
}
export interface SolicitudCambio {
  bookingId: string; newDateStr: string; newTimeStr: string;
  barberPreference: string | null; anyBarber: boolean; requestId: string;
}

export interface TramoHorario { start: string; end: string; }
export interface DiaHorario { active: boolean; ranges: TramoHorario[]; start?: string; end?: string; breaks?: TramoHorario[]; }
export interface HorarioSemanal { days: DiaHorario[]; slot: number; }
export interface SemanaProfesional extends HorarioSemanal { weekStart: string; published: boolean; revision?: number; }
export type TipoBloqueo = "exception" | "break" | "internal" | "vacation";
export interface DatosBloqueo {
  barberUid: string; type: TipoBloqueo; reason: string;
  dateStr?: string; start?: string; end?: string; startDate?: string; endDate?: string;
}
export interface Bloqueo extends DatosBloqueo { id: string; createdBy?: string; }
export type OperacionAgenda =
  | { tipo: "semana"; datos: SemanaProfesional & { barberUid: string; expectedRevision: number; requestId: string } }
  | { tipo: "crear-bloqueo"; datos: DatosBloqueo & { requestId: string } }
  | { tipo: "eliminar-bloqueo"; datos: { blockId: string; requestId: string } }
  | { tipo: "equipo"; datos: { barberUid: string; name: string; active: boolean; expectedRevision: number; requestId: string } }
  | { tipo: "servicio"; datos: Omit<ServicioAdministrable, "id" | "adminRevision"> & { serviceId?: string; expectedRevision: number; requestId: string } }
  | { tipo: "reglas"; datos: { timezone: string; cancelWindowHours: number; reminderWindowsHours: number[]; expectedRevision: number; requestId: string } };
