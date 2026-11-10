import { observarAreaAutorizada, type ContextoProfesional } from "../../comun/permisos";
import { explicarErrorAdministracion, esRespuestaReservaIncierta } from "../../comun/errores";
import { mostrarAviso } from "../../comun/avisos";
import { obtenerEquipo } from "../../datos/personas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { ejecutarOperacionAgenda, guardarOperacionAgenda, recuperarOperacionAgenda, borrarOperacionAgenda } from "../../datos/funciones-remotas";
import type { OperacionAgenda } from "../../modelos/agenda";
import type { FichaEquipo } from "../../modelos/cuentas";
const lista = document.getElementById("team-list")!, mensaje = document.getElementById("team-msg")!;
let contexto: ContextoProfesional | null = null, ocupada = false, pendiente: OperacionAgenda | null = null;
function bloquear(valor: boolean): void { ocupada = valor; for (const campo of lista.querySelectorAll<HTMLInputElement>("input")) campo.disabled = valor || !!pendiente; }
function mostrarMensaje(texto: string, error = false): void { mensaje.textContent = texto; mensaje.className = error ? "text-sm text-red-700" : "text-sm text-gray-600"; }
function ofrecerRecuperacion(): void {
  mostrarMensaje("No se pudo confirmar la operacion. ");
  const boton = document.createElement("button"); boton.type = "button"; boton.className = "underline"; boton.textContent = "Comprobar operacion";
  boton.addEventListener("click", () => { if (!ocupada) void ejecutarPendiente(); }); mensaje.append(boton);
}
async function ejecutarPendiente(): Promise<void> {
  const actual = contexto; if (!actual?.esVigente() || !pendiente || ocupada) return;
  bloquear(true); mostrarMensaje("Guardando...");
  try {
    await ejecutarOperacionAgenda(pendiente); await esperarEstadoSesion(); if (!actual.esVigente()) return;
    borrarOperacionAgenda(actual.usuario.uid, "equipo"); pendiente = null;
    mostrarAviso("Cambios guardados.", "success"); await cargarEquipo(); mostrarMensaje("Cambios guardados.");
  } catch (error) {
    await esperarEstadoSesion(); if (!actual.esVigente()) return;
    if (esRespuestaReservaIncierta(error)) ofrecerRecuperacion();
    else { borrarOperacionAgenda(actual.usuario.uid, "equipo"); pendiente = null; mostrarMensaje(explicarErrorAdministracion(error), true); }
  } finally { if (contexto === actual) bloquear(false); }
}
function guardarProfesional(tarjeta: HTMLElement, profesional: FichaEquipo): void {
  if (ocupada || pendiente || !contexto?.esVigente()) return;
  const nombre = tarjeta.querySelector<HTMLInputElement>(".team-name")!.value.trim(), activo = tarjeta.querySelector<HTMLInputElement>(".team-active")!.checked;
  if (!nombre || nombre.length > 100) { mostrarAviso("Escribe un nombre de hasta 100 caracteres.", "error"); return; }
  if (nombre === profesional.name && activo === profesional.active) return;
  pendiente = { tipo: "equipo", datos: { barberUid: profesional.uid, name: nombre, active: activo, expectedRevision: profesional.adminRevision, requestId: crypto.randomUUID() } };
  guardarOperacionAgenda(contexto.usuario.uid, "equipo", pendiente); void ejecutarPendiente();
}
async function cargarEquipo(): Promise<void> {
  const actual = contexto; if (!actual?.esVigente()) return;
  mostrarMensaje("Cargando equipo...");
  try {
    const equipo = await obtenerEquipo(); await esperarEstadoSesion(); if (!actual.esVigente()) return;
    lista.replaceChildren();
    for (const profesional of equipo) {
      const tarjeta = document.createElement("article"); tarjeta.className = "rounded-lg border border-gray-200 bg-white p-4"; tarjeta.dataset.id = profesional.uid;
      tarjeta.innerHTML = '<div class="grid gap-3 md:grid-cols-[minmax(0,1.1fr),minmax(0,1fr),220px] md:items-center"><label class="text-xs text-gray-600">Nombre<input class="team-name mt-1 w-full rounded border px-3 py-2 text-sm text-gray-900" /></label><div class="min-w-0"><p class="text-xs text-gray-600">Email</p><p class="mt-1 truncate text-sm text-gray-700" data-correo></p></div><label class="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"><input class="team-active h-4 w-4 rounded border-gray-300" type="checkbox" />Mostrar en reservas</label></div>';
      const nombre = tarjeta.querySelector<HTMLInputElement>(".team-name")!, activo = tarjeta.querySelector<HTMLInputElement>(".team-active")!;
      nombre.value = profesional.name; nombre.maxLength = 100; activo.checked = profesional.active === true;
      tarjeta.querySelector("[data-correo]")!.textContent = profesional.email || "Sin email";
      nombre.addEventListener("blur", () => guardarProfesional(tarjeta, profesional));
      nombre.addEventListener("keydown", (evento) => { if (evento.key === "Enter") { evento.preventDefault(); guardarProfesional(tarjeta, profesional); } });
      activo.addEventListener("change", () => guardarProfesional(tarjeta, profesional)); lista.append(tarjeta);
    }
    if (!equipo.length) { lista.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 space-y-1"><p class="font-medium text-slate-900">Aun no hay nadie en el equipo.</p><p>Anadelo desde Usuarios y roles.</p></div>'; mostrarMensaje("Sin profesionales."); }
    else mostrarMensaje("");
    bloquear(ocupada); if (pendiente) ofrecerRecuperacion();
  } catch { await esperarEstadoSesion(); if (actual.esVigente()) { lista.replaceChildren(); mostrarMensaje("No se pudo cargar el equipo.", true); } }
}
observarAreaAutorizada(["manager", "admin"], (actual) => { contexto = actual; pendiente = recuperarOperacionAgenda(actual.usuario.uid, "equipo"); void cargarEquipo(); }, () => { if (contexto) borrarOperacionAgenda(contexto.usuario.uid, "equipo"); contexto = null; ocupada = false; pendiente = null; lista.replaceChildren(); mostrarMensaje(""); });
