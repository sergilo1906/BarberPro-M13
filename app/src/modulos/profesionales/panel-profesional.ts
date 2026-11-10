import { observarAreaProfesional, type ContextoProfesional } from "../../comun/permisos";
import { obtenerRangoPeriodo, formatearFechaNegocio } from "../../comun/fechas";
import { obtenerCitasPeriodo } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { esperarEstadoSesion } from "../../datos/sesion";
import { mostrarCitasDelDia } from "./tarjetas-citas";
import type { Cita } from "../../modelos/agenda";

const periodo = document.querySelector<HTMLSelectElement>("#stats-range")!;
const tarjetas = document.getElementById("stats-cards")!;
const lista = document.getElementById("pro-next-list")!;
const mensaje = document.getElementById("stats-msg")!;
let contexto: ContextoProfesional | null = null;
let zona = "Europe/Madrid", revision = 0;
let nombres = new Map<string, string>();
export function resumirCitasProfesional(citas: Cita[]) {
  let minutos = 0, pendientes = 0, confirmadas = 0, hechas = 0, total = 0;
  for (const cita of citas) {
    if (cita.status === "cancelled" || cita.status === "rescheduled") continue;
    total++; minutos += Number(cita.durationMin || cita.serviceSnapshot?.durationMin || 0);
    if ((cita.status || "pending") === "pending") pendientes++;
    if (cita.status === "confirmed") confirmadas++;
    if (cita.status === "done") hechas++;
  }
  return { minutos, pendientes, confirmadas, hechas, total };
}
function mostrarResumen(citas: Cita[]): void {
  const resumen = resumirCitasProfesional(citas);
  const datos = [["Citas", String(resumen.total)], ["Minutos", resumen.minutos + " min"], ["Horas", (resumen.minutos / 60).toFixed(1) + " h"], ["Estado", "Pendientes: " + resumen.pendientes + " | Confirmadas: " + resumen.confirmadas + " | Hechas: " + resumen.hechas]];
  tarjetas.replaceChildren();
  for (const [titulo, valor] of datos) {
    const tarjeta = document.createElement("div"); tarjeta.className = "bg-gray-50 rounded border p-3";
    const etiqueta = document.createElement("div"); etiqueta.className = "text-[11px] text-gray-500 uppercase"; etiqueta.textContent = titulo;
    const numero = document.createElement("div"); numero.className = titulo === "Estado" ? "text-[13px] leading-tight" : "text-lg font-semibold"; numero.textContent = valor;
    tarjeta.append(etiqueta, numero); tarjetas.append(tarjeta);
  }
}
async function cargarResumen(): Promise<void> {
  const actual = contexto, consulta = ++revision;
  if (!actual?.esVigente()) return;
  mensaje.textContent = "Cargando..."; tarjetas.replaceChildren(); lista.replaceChildren();
  try {
    const rango = obtenerRangoPeriodo(periodo.value, zona);
    const citas = await obtenerCitasPeriodo(rango.desde, rango.hasta, actual.usuario.rol === "worker" ? actual.usuario.uid : undefined);
    await esperarEstadoSesion(); if (!actual.esVigente() || consulta !== revision) return;
    mostrarResumen(citas);
    mostrarCitasDelDia(lista, citas, formatearFechaNegocio(zona), actual.usuario.rol === "worker", nombres);
    mensaje.textContent = "";
  } catch { if (actual.esVigente() && consulta === revision) mensaje.textContent = "No se pudo cargar el resumen. Cambia el periodo para volver a intentarlo."; }
}
periodo.addEventListener("change", () => { void cargarResumen(); }); mensaje.setAttribute("role", "status");
observarAreaProfesional((actual) => {
  contexto = actual;
  void (async () => {
    try {
      const [configuracion, profesionales] = await Promise.all([obtenerConfiguracionAgenda(), obtenerProfesionales()]);
      await esperarEstadoSesion(); if (!actual.esVigente()) return;
      zona = configuracion.timezone; nombres = new Map(); for (const profesional of profesionales) nombres.set(profesional.uid, profesional.name);
      await cargarResumen();
    } catch { if (actual.esVigente()) mensaje.textContent = "No se pudo cargar el resumen. Actualiza la pagina."; }
  })();
}, () => { revision++; contexto = null; tarjetas.replaceChildren(); lista.replaceChildren(); nombres.clear(); mensaje.textContent = ""; });
