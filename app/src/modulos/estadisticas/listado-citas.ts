import { observarAreaAutorizada, type ContextoProfesional } from "../../comun/permisos";
import { esFechaCalendarioValida, formatearFechaNegocio, sumarDiasCalendario } from "../../comun/fechas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { obtenerCitasPeriodo } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { mostrarAviso } from "../../comun/avisos";
import { convertirACsv } from "../../exportaciones/csv";
import { obtenerDuracionEstadistica } from "./calculos";
const desde = document.querySelector<HTMLInputElement>("#export-from")!, hasta = document.querySelector<HTMLInputElement>("#export-to")!;
const consultar = document.querySelector<HTMLButtonElement>("#export-preview")!, descargar = document.querySelector<HTMLButtonElement>("#export-download")!;
const mensaje = document.getElementById("export-msg")!, vista = document.getElementById("export-preview-list")!;
let contexto: ContextoProfesional | null = null, revision = 0, ocupada = false, filasGuardadas: Record<string, unknown>[] | null = null, rangoGuardado = "";
function mostrarMensaje(texto: string, error = false): void { mensaje.textContent = texto; mensaje.className = error ? "text-sm text-red-700" : "text-sm text-gray-600"; }
function rangoValido(): boolean { return esFechaCalendarioValida(desde.value) && esFechaCalendarioValida(hasta.value) && desde.value <= hasta.value; }
function bloquear(valor: boolean): void { ocupada = valor; consultar.disabled = valor || !contexto; descargar.disabled = valor || !contexto || !rangoValido(); }
function invalidarListado(): void { revision++; filasGuardadas = null; rangoGuardado = ""; vista.replaceChildren(); mostrarMensaje(rangoValido() ? "Rango modificado. Consulta el listado para actualizar los datos." : "Revisa el rango de fechas.", !rangoValido()); bloquear(ocupada); }
function mostrarVistaPrevia(filas: Record<string, unknown>[]): void {
  vista.replaceChildren();
  if (!filas.length) { vista.innerHTML = '<div class="p-4 text-sm text-gray-600">No hay citas en ese rango.</div>'; return; }
  const contenedor = document.createElement("div"); contenedor.className = "overflow-x-auto";
  contenedor.innerHTML = '<table class="min-w-full text-sm"><thead class="bg-gray-50 text-left text-gray-700"><tr><th class="px-3 py-2 font-medium">Fecha</th><th class="px-3 py-2 font-medium">Hora</th><th class="px-3 py-2 font-medium">Servicio</th><th class="px-3 py-2 font-medium">Profesional</th><th class="px-3 py-2 font-medium">Cliente</th><th class="px-3 py-2 font-medium">Estado</th></tr></thead><tbody class="divide-y divide-gray-200"></tbody></table>';
  const cuerpo = contenedor.querySelector("tbody")!;
  for (const fila of filas.slice(0, 8)) { const linea = document.createElement("tr"); for (const campo of ["fecha", "hora", "servicio", "profesional", "cliente", "estado"]) { const celda = document.createElement("td"); celda.className = "px-3 py-2"; celda.textContent = String(fila[campo] ?? ""); linea.append(celda); } cuerpo.append(linea); }
  vista.append(contenedor);
  if (filas.length > 8) { const nota = document.createElement("p"); nota.className = "px-3 py-2 text-xs text-gray-500"; nota.textContent = "Se muestran 8 de " + filas.length + " citas."; vista.append(nota); }
}
async function cargarListadoCitas(): Promise<Record<string, unknown>[] | null> {
  const actual = contexto; if (!actual?.esVigente() || ocupada) return null;
  if (!rangoValido()) { invalidarListado(); return null; }
  const inicio = desde.value, fin = hasta.value, consulta = ++revision;
  filasGuardadas = null; rangoGuardado = ""; vista.replaceChildren(); bloquear(true); mostrarMensaje("Buscando...");
  try {
    const [citas, profesionales] = await Promise.all([obtenerCitasPeriodo(inicio, fin), obtenerProfesionales(true)]);
    await esperarEstadoSesion(); if (!actual.esVigente() || consulta !== revision || inicio !== desde.value || fin !== hasta.value) return null;
    const nombres = new Map(profesionales.map((profesional) => [profesional.uid, profesional.name]));
    const filas = citas.map((cita) => {
      const precio = Number(cita.serviceSnapshot?.price || 0);
      return { fecha: String(cita.dateStr || ""), hora: String(cita.timeStr || ""), estado: String(cita.status || "pending"), servicio: String(cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio"), profesional: nombres.get(cita.barberUid) || String(cita.barberUid || ""), cliente: String(cita.userName || cita.userEmail || cita.userPhone || "Cliente sin nombre"), duracionMin: obtenerDuracionEstadistica(cita), precio: Number.isFinite(precio) ? precio : 0 };
    });
    filas.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
    filasGuardadas = filas; rangoGuardado = inicio + "/" + fin; mostrarVistaPrevia(filas); mostrarMensaje(filas.length ? filas.length + " citas encontradas." : "No hay citas en ese rango."); return filas;
  } catch { await esperarEstadoSesion(); if (actual.esVigente() && consulta === revision) mostrarMensaje("No se pudo cargar el listado. Reintenta la consulta.", true); return null; }
  finally { if (contexto === actual) bloquear(false); }
}
async function descargarCsv(): Promise<void> {
  const actual = contexto; if (ocupada || !actual?.esVigente() || !rangoValido()) return;
  const inicio = desde.value, fin = hasta.value;
  const filas = rangoGuardado === inicio + "/" + fin && filasGuardadas ? filasGuardadas : await cargarListadoCitas();
  if (!actual.esVigente() || inicio !== desde.value || fin !== hasta.value) return;
  if (!filas?.length) { mostrarAviso("No hay datos para exportar.", "error"); return; }
  const url = URL.createObjectURL(new Blob(["\uFEFF" + convertirACsv(filas)], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a"); enlace.href = url; enlace.download = "agenda-" + inicio + "-" + fin + ".csv"; enlace.click(); setTimeout(() => URL.revokeObjectURL(url), 3000); mostrarAviso("Archivo descargado.", "success");
}
consultar.addEventListener("click", () => { void cargarListadoCitas(); }); descargar.addEventListener("click", () => { void descargarCsv(); }); desde.addEventListener("input", invalidarListado); hasta.addEventListener("input", invalidarListado);
observarAreaAutorizada(["manager", "admin"], async (actual) => {
  contexto = actual; bloquear(true);
  try { const configuracion = await obtenerConfiguracionAgenda(); await esperarEstadoSesion(); if (!actual.esVigente()) return; desde.value = formatearFechaNegocio(configuracion.timezone); hasta.value = sumarDiasCalendario(desde.value, 7); bloquear(false); await cargarListadoCitas(); }
  catch { await esperarEstadoSesion(); if (actual.esVigente()) { mostrarMensaje("No se pudo cargar la configuracion.", true); bloquear(false); } }
}, () => { contexto = null; revision++; ocupada = false; filasGuardadas = null; rangoGuardado = ""; desde.value = ""; hasta.value = ""; vista.replaceChildren(); mostrarMensaje(""); bloquear(false); });
