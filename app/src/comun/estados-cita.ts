import type { Cita } from "../modelos/agenda";
import { obtenerInicioCita } from "./fechas";

export function obtenerEtiquetaEstadoCliente(estado = "pending"): string {
  if (estado === "confirmed") return "Confirmada";
  if (estado === "cancelled") return "Cancelada";
  if (estado === "done") return "Hecha";
  if (estado === "no_show") return "No show";
  if (estado === "rescheduled") return "Cambiada";
  return estado === "pending" ? "Pendiente" : estado;
}

export function obtenerClasesEstadoCliente(estado = "pending"): string {
  if (estado === "confirmed") return "bg-blue-100 text-blue-700 border-blue-300";
  if (estado === "cancelled") return "bg-gray-100 text-gray-700 border-gray-300";
  if (estado === "done") return "bg-green-100 text-green-700 border-green-300";
  if (estado === "no_show") return "bg-red-100 text-red-700 border-red-300";
  if (estado === "rescheduled") return "bg-slate-100 text-slate-700 border-slate-300";
  return "bg-yellow-100 text-yellow-700 border-yellow-300";
}

export function obtenerServicioCita(cita: Cita): string {
  return String(cita.serviceId || cita.serviceSnapshot?.id || "").trim();
}

export function calcularHorasHastaCita(cita: Cita, zona: string, ahora = new Date()): number {
  return (obtenerInicioCita(cita, zona).getTime() - ahora.getTime()) / 3600000;
}

export function puedeGestionarCita(cita: Cita, margen: number, zona: string, ahora = new Date()): boolean {
  const estado = cita.status || "pending";
  return (estado === "pending" || estado === "confirmed") && calcularHorasHastaCita(cita, zona, ahora) >= margen;
}

export function obtenerAvisoGestion(cita: Cita, margen: number, zona: string): string {
  const estado = cita.status || "pending";
  if ((estado !== "pending" && estado !== "confirmed") || puedeGestionarCita(cita, margen, zona)) return "";
  return "Solo se puede cambiar o cancelar con al menos " + margen + " h de margen.";
}

export function aplicarFiltrosCitas(citas: Cita[], fecha: string, estado: string): Cita[] {
  const resultado: Cita[] = [];
  for (const cita of citas) {
    if (fecha && cita.dateStr !== fecha) continue;
    if (estado !== "all" && (cita.status || "pending") !== estado) continue;
    resultado.push(cita);
  }
  return resultado;
}
