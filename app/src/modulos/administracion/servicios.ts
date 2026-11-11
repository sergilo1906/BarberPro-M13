import { observarAreaAutorizada, type ContextoProfesional } from "../../comun/permisos";
import { explicarErrorAdministracion, esRespuestaReservaIncierta } from "../../comun/errores";
import { mostrarAviso } from "../../comun/avisos";
import { obtenerCatalogoCompleto } from "../../datos/catalogo";
import { esperarEstadoSesion } from "../../datos/sesion";
import { ejecutarOperacionAgenda, guardarOperacionAgenda, recuperarOperacionAgenda, borrarOperacionAgenda } from "../../datos/funciones-remotas";
import type { ServicioAdministrable, OperacionAgenda } from "../../modelos/agenda";
const formulario = document.querySelector<HTMLFormElement>("#service-create-form")!, lista = document.getElementById("services-list")!;
const mensaje = document.getElementById("services-msg")!, alta = document.getElementById("service-create-msg")!;
let contexto: ContextoProfesional | null = null, ocupada = false, cargada = false, pendiente: OperacionAgenda | null = null;
function bloquear(valor: boolean): void { ocupada = valor; for (const campo of document.querySelectorAll<HTMLInputElement | HTMLButtonElement>("main input, main button")) campo.disabled = valor || !!pendiente || !cargada; }
function mostrarMensaje(texto: string, error = false): void { mensaje.textContent = texto; mensaje.className = error ? "text-xs text-red-700" : "text-xs text-green-700"; }
function mostrarAlta(texto: string, error = false): void { alta.textContent = texto; alta.className = error ? "text-xs text-red-700" : "text-xs text-green-700"; }
function ofrecerRecuperacion(): void { mostrarMensaje("No se pudo confirmar la operacion. "); const boton = document.createElement("button"); boton.textContent = "Comprobar operacion"; boton.type = "button"; boton.className = "underline"; boton.addEventListener("click", () => { if (!ocupada) void ejecutarPendiente(); }); mensaje.append(boton); }
async function ejecutarPendiente(): Promise<void> {
  const actual = contexto; if (!actual?.esVigente() || !pendiente || ocupada) return;
  const esAlta = pendiente.tipo === "servicio" && !pendiente.datos.serviceId;
  bloquear(true);
  mostrarMensaje(esAlta ? "Creando servicio..." : "Guardando...");
  if (esAlta) mostrarAlta("Creando servicio...");
  try {
    await ejecutarOperacionAgenda(pendiente); await esperarEstadoSesion(); if (!actual.esVigente()) return;
    borrarOperacionAgenda(actual.usuario.uid, "servicios"); pendiente = null;
    if (esAlta) { formulario.reset(); document.querySelector<HTMLInputElement>("#service-active")!.checked = true; mostrarAlta("Servicio creado."); }
    mostrarAviso(esAlta ? "Servicio creado correctamente." : "Servicio actualizado.", "success"); await cargarServicios();
  } catch (error) {
    await esperarEstadoSesion(); if (!actual.esVigente()) return;
    if (esAlta) mostrarAlta(explicarErrorAdministracion(error), true);
    if (esRespuestaReservaIncierta(error)) ofrecerRecuperacion();
    else { borrarOperacionAgenda(actual.usuario.uid, "servicios"); pendiente = null; mostrarMensaje(explicarErrorAdministracion(error), true); }
  } finally { if (contexto === actual) { bloquear(false); mensaje.querySelector<HTMLButtonElement>("button")?.removeAttribute("disabled"); } }
}
function prepararGuardado(datos: { name: string; durationMin: number; price: number; active: boolean; serviceId?: string; expectedRevision: number }): void {
  if (ocupada || pendiente || !cargada || !contexto?.esVigente()) return;
  if (!datos.name || datos.name.length > 100 || !Number.isInteger(datos.durationMin) || datos.durationMin < 5 || datos.durationMin > 1440 || datos.durationMin % 5 !== 0 || !Number.isFinite(datos.price) || datos.price < 0) { if (!datos.serviceId) mostrarAlta("Revisa nombre, duracion y precio.", true); else mostrarMensaje("Revisa nombre, duracion y precio.", true); return; }
  pendiente = { tipo: "servicio", datos: { ...datos, requestId: crypto.randomUUID() } }; guardarOperacionAgenda(contexto.usuario.uid, "servicios", pendiente); void ejecutarPendiente();
}
function crearTarjetaServicio(servicio: ServicioAdministrable): HTMLElement {
  const tarjeta = document.createElement("article"); tarjeta.className = "border rounded-lg p-3 grid md:grid-cols-[1.3fr,140px,140px,140px,180px] gap-2 items-center"; tarjeta.dataset.id = servicio.id;
  tarjeta.innerHTML = '<input class="svc-name border rounded px-2 py-1" placeholder="Nombre del servicio" aria-label="Nombre del servicio" /><input class="svc-duration border rounded px-2 py-1" type="number" min="5" max="1440" step="5" aria-label="Duracion" /><input class="svc-price border rounded px-2 py-1" type="number" min="0" step="0.5" aria-label="Precio" /><label class="text-xs flex items-center gap-2"><input class="svc-active" type="checkbox" /><span></span></label><div class="flex items-center gap-2"><button class="svc-save rounded border px-3 py-1 text-sm hover:bg-gray-50" type="button">Guardar</button><button class="svc-toggle rounded border px-3 py-1 text-sm hover:bg-gray-50" type="button"></button></div>';
  const nombre = tarjeta.querySelector<HTMLInputElement>(".svc-name")!, duracion = tarjeta.querySelector<HTMLInputElement>(".svc-duration")!, precio = tarjeta.querySelector<HTMLInputElement>(".svc-price")!, activo = tarjeta.querySelector<HTMLInputElement>(".svc-active")!;
  nombre.value = servicio.name; nombre.maxLength = 100; duracion.value = String(servicio.durationMin); precio.value = String(servicio.price); activo.checked = servicio.active;
  tarjeta.querySelector("span")!.textContent = servicio.active ? "Activo" : "Inactivo"; tarjeta.querySelector(".svc-toggle")!.textContent = servicio.active ? "Desactivar" : "Activar";
  tarjeta.querySelector(".svc-save")!.addEventListener("click", () => prepararGuardado({ name: nombre.value.trim(), durationMin: Number(duracion.value), price: precio.value === "" ? NaN : Number(precio.value), active: activo.checked, serviceId: servicio.id, expectedRevision: servicio.adminRevision }));
  // Activar/Desactivar describe el estado cargado, incluso con una casilla sin guardar.
  tarjeta.querySelector(".svc-toggle")!.addEventListener("click", () => prepararGuardado({ name: servicio.name, durationMin: servicio.durationMin, price: servicio.price, active: !servicio.active, serviceId: servicio.id, expectedRevision: servicio.adminRevision }));
  return tarjeta;
}
async function cargarServicios(): Promise<void> {
  const actual = contexto; if (!actual?.esVigente()) return;
  cargada = false; bloquear(true); mostrarMensaje("Cargando servicios...");
  try {
    const servicios = await obtenerCatalogoCompleto(); await esperarEstadoSesion(); if (!actual.esVigente()) return;
    lista.replaceChildren(...servicios.map(crearTarjetaServicio)); cargada = true;
    if (!servicios.length) lista.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1"><p class="font-medium text-slate-900">Todavia no hay servicios creados.</p><p>Crea el primer servicio desde el formulario superior para habilitar reservas.</p></div>';
    mostrarMensaje("Servicios cargados."); if (pendiente) ofrecerRecuperacion();
  } catch { await esperarEstadoSesion(); if (actual.esVigente()) { lista.replaceChildren(); mostrarMensaje("No se pudieron cargar servicios.", true); } }
  finally { if (contexto === actual) { bloquear(false); mensaje.querySelector<HTMLButtonElement>("button")?.removeAttribute("disabled"); document.querySelector<HTMLButtonElement>("#services-refresh")!.disabled = !!pendiente; } }
}
formulario.addEventListener("submit", (evento) => { evento.preventDefault(); prepararGuardado({ name: document.querySelector<HTMLInputElement>("#service-name")!.value.trim(), durationMin: Number(document.querySelector<HTMLInputElement>("#service-duration")!.value), price: document.querySelector<HTMLInputElement>("#service-price")!.value === "" ? NaN : Number(document.querySelector<HTMLInputElement>("#service-price")!.value), active: document.querySelector<HTMLInputElement>("#service-active")!.checked, expectedRevision: 0 }); });
document.getElementById("services-refresh")!.addEventListener("click", () => { if (!ocupada && !pendiente) void cargarServicios(); });
observarAreaAutorizada(["manager", "admin"], (actual) => { contexto = actual; pendiente = recuperarOperacionAgenda(actual.usuario.uid, "servicios"); void cargarServicios(); }, () => { if (contexto) borrarOperacionAgenda(contexto.usuario.uid, "servicios"); contexto = null; pendiente = null; cargada = false; ocupada = false; lista.replaceChildren(); formulario.reset(); mostrarMensaje(""); alta.textContent = ""; bloquear(false); });
