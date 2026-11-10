import type { Cita } from "../../modelos/agenda";

export function obtenerDuracionEstadistica(cita: Cita): number {
  const minutos = Number(cita.durationMin || cita.serviceSnapshot?.durationMin || 0);
  return Number.isFinite(minutos) && minutos >= 0 ? minutos : 0;
}
export function obtenerCitasEstadisticas(citas: Cita[]): Cita[] {
  // La cita antigua reprogramada enlaza a su sucesora: no vuelve a contar
  // como una cita independiente en los indicadores operativos.
  return citas.filter((cita) => cita.status !== "rescheduled");
}
export function calcularIndicadores(citas: Cita[]) {
  const registros = obtenerCitasEstadisticas(citas);
  let confirmadas = 0, hechas = 0, incidencias = 0, minutos = 0;
  for (const cita of registros) {
    const estado = cita.status || "pending";
    if (estado === "confirmed") confirmadas++;
    if (estado === "done") hechas++;
    if (estado === "cancelled" || estado === "no_show") incidencias++;
    if (["pending", "confirmed", "done", "no_show"].includes(estado)) minutos += obtenerDuracionEstadistica(cita);
  }
  return { total: registros.length, confirmadas, hechas, incidencias, minutos };
}
export function contarServicios(citas: Cita[]): [string, number][] {
  const conteos = new Map<string, number>();
  for (const cita of obtenerCitasEstadisticas(citas)) {
    const nombre = String(cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio");
    conteos.set(nombre, (conteos.get(nombre) || 0) + 1);
  }
  return [...conteos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
export function contarProfesionales(citas: Cita[], nombres: Map<string, string>): [string, number][] {
  const conteos = new Map<string, number>();
  // Se conserva la agrupación visible por nombre del original, incluidos
  // sus nombres de reserva para fichas ausentes. No se añaden datos privados.
  for (const cita of obtenerCitasEstadisticas(citas)) {
    const nombre = nombres.get(cita.barberUid) || "Profesional";
    conteos.set(nombre, (conteos.get(nombre) || 0) + 1);
  }
  return [...conteos].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
