import type { DiaHorario, HorarioSemanal } from "../../modelos/agenda";
import { comprobarTramoHorario } from "../../comun/formularios";

export const NOMBRES_DIAS = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];
function obtenerCamposDia(indice: number) {
  return {
    active: document.querySelector<HTMLInputElement>("#work-" + indice)!,
    start: document.querySelector<HTMLInputElement>("#start-" + indice)!,
    end: document.querySelector<HTMLInputElement>("#end-" + indice)!,
    start2: document.querySelector<HTMLInputElement>("#start2-" + indice)!,
    end2: document.querySelector<HTMLInputElement>("#end2-" + indice)!,
  };
}
export function normalizarDiaHorario(dia?: DiaHorario): DiaHorario {
  if (dia?.ranges && dia.ranges.length > 2) throw new Error("El horario tiene mas de dos tramos. No se sobrescribira desde este formulario.");
  const primero = dia?.ranges?.[0] || { start: dia?.start || "10:00", end: dia?.end || "20:00" };
  return { ...dia, active: dia?.active === true, ranges: [{ ...primero }, ...(dia?.ranges?.[1] ? [{ ...dia.ranges[1] }] : [])], breaks: dia?.breaks?.map((tramo) => ({ ...tramo })) || [] };
}
export function prepararHorarioFormulario(horario?: HorarioSemanal | null): HorarioSemanal {
  const days: DiaHorario[] = [];
  for (let indice = 0; indice < 7; indice++) days.push(normalizarDiaHorario(horario?.days?.[indice]));
  return { days, slot: horario?.slot ?? 30 };
}
export function rellenarFormularioHorario(horario: HorarioSemanal): void {
  for (let indice = 0; indice < 7; indice++) {
    const campos = obtenerCamposDia(indice), dia = horario.days[indice];
    campos.active.checked = dia.active;
    campos.start.value = dia.ranges[0]?.start || "10:00";
    campos.end.value = dia.ranges[0]?.end || "20:00";
    campos.start2.value = dia.ranges[1]?.start || "";
    campos.end2.value = dia.ranges[1]?.end || "";
    alternarFilaHorario(indice);
  }
  document.querySelector<HTMLInputElement>("#slot-minutes")!.value = String(horario.slot);
}
export function alternarFilaHorario(indice: number, ocupado = false): void {
  const campos = obtenerCamposDia(indice);
  for (const campo of [campos.start, campos.end, campos.start2, campos.end2]) campo.disabled = ocupado || !campos.active.checked;
}
export function validarHorarioFormulario(horario: HorarioSemanal): void {
  if (!Number.isInteger(horario.slot) || horario.slot < 5 || horario.slot > 1440) throw new Error("Revisa los minutos de hueco (entre 5 y 1440).");
  let diasActivos = 0;
  for (let indice = 0; indice < 7; indice++) {
    const dia = horario.days[indice];
    if (!dia.active) continue;
    diasActivos++;
    if (!dia.ranges.length) throw new Error("Completa el primer tramo de " + NOMBRES_DIAS[indice] + ".");
    const ordenados = [...dia.ranges].sort((primero, segundo) => primero.start.localeCompare(segundo.start));
    for (let tramo = 0; tramo < ordenados.length; tramo++) {
      const error = comprobarTramoHorario(ordenados[tramo].start, ordenados[tramo].end);
      if (error) throw new Error(error + " " + NOMBRES_DIAS[indice] + ".");
      if (tramo && ordenados[tramo].start < ordenados[tramo - 1].end) throw new Error("Tramos solapados en " + NOMBRES_DIAS[indice] + ".");
    }
  }
  if (!diasActivos) throw new Error("Marca al menos un dia de trabajo.");
}
export function leerFormularioHorario(anterior: HorarioSemanal): HorarioSemanal {
  const days: DiaHorario[] = [];
  for (let indice = 0; indice < 7; indice++) {
    const campos = obtenerCamposDia(indice);
    const ranges = campos.active.checked ? [{ start: campos.start.value, end: campos.end.value }] : [];
    if (campos.active.checked && (campos.start2.value || campos.end2.value)) ranges.push({ start: campos.start2.value, end: campos.end2.value });
    // Los descansos no tienen editor en el original: se preservan al guardar/copiar.
    days.push({ active: campos.active.checked, ranges, start: campos.start.value || "10:00", end: campos.end.value || "20:00", breaks: anterior.days[indice]?.breaks || [] });
  }
  const horario = { days, slot: Number(document.querySelector<HTMLInputElement>("#slot-minutes")!.value) };
  validarHorarioFormulario(horario);
  return horario;
}
export function enlazarDiasHorario(): void {
  for (let indice = 0; indice < 7; indice++) {
    const campos = obtenerCamposDia(indice);
    campos.active.setAttribute("aria-label", "Disponible " + NOMBRES_DIAS[indice]);
    for (const [campo, etiqueta] of [[campos.start, "Inicio 1"], [campos.end, "Fin 1"], [campos.start2, "Inicio 2"], [campos.end2, "Fin 2"]] as const) campo.setAttribute("aria-label", etiqueta + " " + NOMBRES_DIAS[indice]);
    campos.active.addEventListener("change", () => alternarFilaHorario(indice));
  }
}
