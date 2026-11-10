import { esFechaCalendarioValida, formatearFechaNegocio } from "../../comun/fechas";
import { comprobarTramoHorario } from "../../comun/formularios";
import type { DatosBloqueo, TipoBloqueo } from "../../modelos/agenda";

export function mostrarCamposTipoBloqueo(): void {
  const vacaciones = document.querySelector<HTMLSelectElement>("#block-type")!.value === "vacation";
  for (const clase of [".vacation-start-wrap", ".vacation-end-wrap"]) document.querySelector(clase)!.classList.toggle("hidden", !vacaciones);
  for (const clase of [".block-date-wrap", ".block-start-wrap", ".block-end-wrap"]) document.querySelector(clase)!.classList.toggle("hidden", vacaciones);
}
export function leerFormularioBloqueo(uid: string): DatosBloqueo {
  const valor = (id: string) => document.querySelector<HTMLInputElement | HTMLSelectElement>("#" + id)!.value.trim();
  const type = valor("block-type") as TipoBloqueo;
  const datos: DatosBloqueo = { barberUid: uid, type, reason: valor("block-reason") };
  if (!["exception", "break", "internal", "vacation"].includes(type)) throw new Error("Selecciona un tipo valido.");
  if (datos.reason.length > 500) throw new Error("El motivo no puede superar 500 caracteres.");
  if (type === "vacation") {
    datos.startDate = valor("vacation-start"); datos.endDate = valor("vacation-end");
    if (!esFechaCalendarioValida(datos.startDate) || !esFechaCalendarioValida(datos.endDate) || datos.startDate > datos.endDate) throw new Error("Rango de vacaciones invalido.");
    if ((Date.parse(datos.endDate) - Date.parse(datos.startDate)) / 86400000 >= 366) throw new Error("Selecciona como maximo 366 dias por operacion.");
  } else {
    datos.dateStr = valor("block-date"); datos.start = valor("block-start"); datos.end = valor("block-end");
    if (!esFechaCalendarioValida(datos.dateStr)) throw new Error("Fecha invalida.");
    const error = comprobarTramoHorario(datos.start, datos.end);
    if (error) throw new Error(error);
  }
  return datos;
}
export function prepararFechasBloqueo(zona: string): void {
  for (const id of ["block-date", "vacation-start", "vacation-end"]) document.querySelector<HTMLInputElement>("#" + id)!.value = formatearFechaNegocio(zona);
  document.querySelector<HTMLInputElement>("#block-reason")!.maxLength = 500;
  mostrarCamposTipoBloqueo();
}
