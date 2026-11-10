import { fromZonedTime } from "date-fns-tz";
import type { Cita } from "../modelos/agenda";

export function esFechaCalendarioValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const instante = new Date(fecha + "T00:00:00Z");
  return Number.isFinite(instante.getTime()) && instante.toISOString().slice(0, 10) === fecha;
}

export function obtenerInicioCita(cita: Pick<Cita, "startAt" | "dateStr" | "timeStr">, zona: string): Date {
  if (cita.startAt && typeof cita.startAt.toDate === "function") return cita.startAt.toDate();
  // Compatibilidad con documentos antiguos: nunca interpretar la hora en la zona del navegador.
  const hora = cita.timeStr || "00:00";
  if (!esFechaCalendarioValida(cita.dateStr) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return new Date(NaN);
  const instante = fromZonedTime(cita.dateStr + "T" + hora + ":00", zona);
  const partes = new Intl.DateTimeFormat("en-GB", { timeZone: zona, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(instante);
  if (formatearFechaNegocio(zona, instante) !== cita.dateStr || partes !== hora) return new Date(NaN);
  return instante;
}

export function formatearFechaNegocio(zona: string, instante = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instante);
  let anio = "";
  let mes = "";
  let dia = "";
  for (const parte of partes) {
    if (parte.type === "year") anio = parte.value;
    if (parte.type === "month") mes = parte.value;
    if (parte.type === "day") dia = parte.value;
  }
  return anio + "-" + mes + "-" + dia;
}

export function sumarDiasCalendario(fecha: string, dias: number): string {
  const instante = new Date(fecha + "T00:00:00Z");
  instante.setUTCDate(instante.getUTCDate() + dias);
  return instante.toISOString().slice(0, 10);
}
