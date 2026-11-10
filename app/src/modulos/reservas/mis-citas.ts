import { obtenerCitasUsuario } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { cancelarReserva } from "../../datos/funciones-remotas";
import { observarSesion, obtenerUsuarioActual, esperarEstadoSesion } from "../../datos/sesion";
import { aplicarFiltrosCitas, obtenerAvisoGestion, obtenerClasesEstadoCliente, obtenerEtiquetaEstadoCliente, obtenerServicioCita, puedeGestionarCita } from "../../comun/estados-cita";
import { cerrarModalActivo, mostrarAviso, pedirConfirmacion } from "../../comun/avisos";
import { explicarErrorCancelacion } from "../../comun/errores";
import { abrirCambioCita, limpiarCambioPendiente, recuperarCambioPendiente } from "./cambiar-cita";
import type { Cita } from "../../modelos/agenda";

const mensaje = document.getElementById("my-msg")!;
const contenedorListado = document.getElementById("my-list")!;
const filtroFecha = document.querySelector<HTMLInputElement>("#filter-date")!;
const filtroEstado = document.querySelector<HTMLSelectElement>("#filter-status")!;
let uidSesion = "";
let citasCargadas: Cita[] = [];
let margenCancelacionHoras = 12;
let zona = "Europe/Madrid";
let nombresProfesionales = new Map<string, string>();
let revisionConsulta = 0;
let revisionIdentidad = 0;
let sesionCargando = true;
let accionEnCurso = false;

function obtenerNombreProfesional(uid: string): string {
  return uid ? nombresProfesionales.get(uid) || "Profesional" : "Profesional no asignado";
}
function sigueAutorizado(uid = uidSesion, revision = revisionIdentidad): boolean {
  const estado = obtenerUsuarioActual();
  return estado.estado === "autenticado" && estado.usuario?.correoVerificado === true && estado.usuario.uid === uid && revision === revisionIdentidad;
}
function mostrarMensaje(texto: string): void { mensaje.textContent = texto; }
function agregarBotonMensaje(texto: string, actuar: () => void): void {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "ml-2 text-blue-700 underline";
  boton.textContent = texto;
  boton.addEventListener("click", actuar);
  mensaje.append(boton);
}
function marcarAccion(ocupada: boolean): void {
  accionEnCurso = ocupada;
  const pendiente = !!recuperarCambioPendiente(uidSesion);
  for (const boton of contenedorListado.querySelectorAll<HTMLButtonElement>("button")) boton.disabled = ocupada || pendiente;
}
function mostrarCitas(citas: Cita[]): void {
  contenedorListado.replaceChildren();
  if (!citas.length) {
    const vacio = document.createElement("div");
    vacio.className = "p-4 text-sm text-gray-600 space-y-1";
    vacio.innerHTML = '<p class="font-medium text-gray-800">No hay citas para los filtros seleccionados.</p><p>Si aun no reservaste, puedes hacerlo desde <a href="/reservar" class="text-blue-700 underline">Reservar</a>.</p>';
    contenedorListado.append(vacio);
    return;
  }
  for (const cita of citas) {
    const articulo = document.createElement("article");
    articulo.className = "p-3";
    articulo.dataset.id = cita.id;
    articulo.innerHTML = '<div class="flex flex-wrap items-start justify-between gap-3"><div class="space-y-1"><p data-cita="resumen" class="font-medium text-gray-900"></p><p data-cita="profesional" class="text-xs text-gray-600"></p><p data-cita="duracion" class="text-xs text-gray-500"></p></div><div data-cita="acciones" class="text-right space-y-2"><span class="inline-block rounded border px-2 py-1 text-xs font-medium"></span></div></div>';
    articulo.querySelector('[data-cita="resumen"]')!.textContent = cita.dateStr + " " + cita.timeStr + " - " + (cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio");
    articulo.querySelector('[data-cita="profesional"]')!.textContent = "Profesional: " + obtenerNombreProfesional(cita.barberUid);
    articulo.querySelector('[data-cita="duracion"]')!.textContent = "Duracion: " + Number(cita.durationMin || cita.serviceSnapshot?.durationMin || 30) + " min";
    const estado = articulo.querySelector("span")!;
    estado.textContent = obtenerEtiquetaEstadoCliente(cita.status || "pending");
    estado.className += " " + obtenerClasesEstadoCliente(cita.status || "pending");
    const acciones = articulo.querySelector('[data-cita="acciones"]')!;
    if (puedeGestionarCita(cita, margenCancelacionHoras, zona)) {
      const botones = document.createElement("div"); botones.className = "flex flex-col gap-1 items-end";
      const cancelar = document.createElement("button");
      cancelar.type = "button"; cancelar.dataset.id = cita.id;
      cancelar.className = "cancel-btn rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-800";
      cancelar.textContent = "Cancelar"; botones.append(cancelar);
      if (obtenerServicioCita(cita)) {
        const cambiar = document.createElement("button");
        cambiar.type = "button"; cambiar.dataset.id = cita.id;
        cambiar.className = "reschedule-btn rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs text-blue-800";
        cambiar.textContent = "Cambiar cita"; botones.append(cambiar);
      }
      acciones.append(botones);
    } else {
      const aviso = obtenerAvisoGestion(cita, margenCancelacionHoras, zona);
      if (aviso) { const texto = document.createElement("p"); texto.className = "max-w-[16rem] text-right text-[11px] text-amber-700"; texto.textContent = aviso; acciones.append(texto); }
    }
    contenedorListado.append(articulo);
  }
  marcarAccion(accionEnCurso);
}
function actualizarListado(): void { mostrarCitas(aplicarFiltrosCitas(citasCargadas, filtroFecha.value, filtroEstado.value)); }
function mostrarComprobacionPendiente(): void {
  const pendiente = recuperarCambioPendiente(uidSesion);
  if (!pendiente) return;
  mostrarMensaje("Hay un cambio pendiente de comprobar.");
  agregarBotonMensaje("Comprobar cambio", () => {
    if (accionEnCurso) return;
    const cita = citasCargadas.find((actual) => actual.id === pendiente.bookingId);
    if (cita) cambiarCita(cita, true);
    else mostrarMensaje("No se ha encontrado la cita del cambio pendiente. Actualiza el listado o vuelve a iniciar sesion.");
  });
  marcarAccion(accionEnCurso);
}
async function cargarMisCitas(): Promise<void> {
  const uid = uidSesion;
  const revision = ++revisionConsulta;
  const identidad = revisionIdentidad;
  contenedorListado.replaceChildren();
  mostrarMensaje("Cargando citas...");
  try {
    const [citas, profesionales, configuracion] = await Promise.all([obtenerCitasUsuario(uid), obtenerProfesionales(), obtenerConfiguracionAgenda()]);
    await esperarEstadoSesion();
    if (!sigueAutorizado(uid, identidad) || revision !== revisionConsulta) return;
    citasCargadas = citas;
    nombresProfesionales = new Map();
    for (const profesional of profesionales) nombresProfesionales.set(profesional.uid, profesional.name);
    margenCancelacionHoras = configuracion.cancelWindowHours;
    zona = configuracion.timezone;
    actualizarListado(); mostrarMensaje(""); mostrarComprobacionPendiente();
  } catch {
    if (!sigueAutorizado(uid, identidad) || revision !== revisionConsulta) return;
    citasCargadas = []; contenedorListado.replaceChildren();
    mostrarMensaje("No se pudieron cargar tus citas. Comprueba la conexion y tu sesion.");
    agregarBotonMensaje("Actualizar listado", () => { void cargarMisCitas(); });
  }
}
async function cancelarCita(cita: Cita): Promise<void> {
  if (accionEnCurso || recuperarCambioPendiente(uidSesion) || !sigueAutorizado() || cita.userId !== uidSesion) return;
  const uid = uidSesion;
  const identidad = revisionIdentidad;
  marcarAccion(true);
  try {
    const confirmada = await pedirConfirmacion({ title: "Cancelar cita", message: "Se cancelara la cita del " + cita.dateStr + " a las " + cita.timeStr + ".", confirmText: "Cancelar cita", cancelText: "Mantener cita", danger: true });
    await esperarEstadoSesion();
    if (!confirmada || !sigueAutorizado(uid, identidad)) return;
    mostrarMensaje("Cancelando cita...");
    const respuesta = await cancelarReserva(cita.id, "cancelled-by-client");
    await esperarEstadoSesion();
    if (!sigueAutorizado(uid, identidad)) return;
    if (!respuesta.ok) throw new Error("Respuesta no valida.");
    await cargarMisCitas();
    if (!sigueAutorizado(uid, identidad)) return;
    mostrarAviso("Cita cancelada.", "success");
    // Un error de recarga no debe ocultarse con un mensaje de éxito del listado.
    if (citasCargadas.length) mostrarMensaje("Cita cancelada.");
  } catch (error) {
    await esperarEstadoSesion();
    if (sigueAutorizado(uid, identidad)) {
      mostrarMensaje(explicarErrorCancelacion(error, margenCancelacionHoras));
      agregarBotonMensaje("Actualizar listado", () => { void cargarMisCitas(); });
    }
  } finally { if (uid === uidSesion && identidad === revisionIdentidad) marcarAccion(false); }
}
function cambiarCita(cita: Cita, recuperar = false): void {
  if (accionEnCurso || !sigueAutorizado() || cita.userId !== uidSesion) return;
  const pendiente = recuperarCambioPendiente(uidSesion);
  if (pendiente && !recuperar) return;
  const uid = uidSesion;
  const identidad = revisionIdentidad;
  marcarAccion(true);
  abrirCambioCita(cita, { uid, zona, margen: margenCancelacionHoras, obtenerNombreProfesional,
    sigueAutorizado: () => sigueAutorizado(uid, identidad),
    alTerminar: (cambiada) => {
      if (uid !== uidSesion || identidad !== revisionIdentidad) return;
      marcarAccion(false);
      if (!sigueAutorizado(uid, identidad)) return;
      if (cambiada) void cargarMisCitas();
      else mostrarComprobacionPendiente();
    },
  }, recuperar ? pendiente : null);
}
contenedorListado.addEventListener("click", (evento) => {
  const boton = evento.target instanceof Element ? evento.target.closest<HTMLButtonElement>("button[data-id]") : null;
  if (!boton || boton.disabled || !contenedorListado.contains(boton)) return;
  const cita = citasCargadas.find((actual) => actual.id === boton.dataset.id);
  if (!cita || !puedeGestionarCita(cita, margenCancelacionHoras, zona)) return;
  if (boton.classList.contains("cancel-btn")) void cancelarCita(cita);
  if (boton.classList.contains("reschedule-btn")) cambiarCita(cita);
});
filtroFecha.addEventListener("change", actualizarListado);
filtroEstado.addEventListener("change", actualizarListado);
observarSesion((estado) => {
  if (estado.estado === "cargando") {
    sesionCargando = true; revisionConsulta++; contenedorListado.replaceChildren(); return;
  }
  if (estado.estado !== "autenticado" || !estado.usuario?.correoVerificado || estado.usuario.uid !== uidSesion) {
    revisionIdentidad++; revisionConsulta++;
    cerrarModalActivo(); document.getElementById("toast-root")?.remove();
    if (estado.estado === "invitado" || (estado.usuario && uidSesion && estado.usuario.uid !== uidSesion)) limpiarCambioPendiente();
    citasCargadas = []; nombresProfesionales.clear(); contenedorListado.replaceChildren(); mostrarMensaje("");
    filtroFecha.value = ""; filtroEstado.value = "all"; accionEnCurso = false;
    uidSesion = estado.estado === "autenticado" && estado.usuario?.correoVerificado ? estado.usuario.uid : "";
    if (uidSesion) { sesionCargando = false; void cargarMisCitas(); }
    return;
  }
  if (sesionCargando) { sesionCargando = false; void cargarMisCitas(); }
});
