import { obtenerServicios } from "../../datos/catalogo";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { consultarDisponibilidad, solicitarReserva } from "../../datos/funciones-remotas";
import { esperarEstadoSesion, obtenerUsuarioActual, observarSesion } from "../../datos/sesion";
import { formatearFechaNegocio, sumarDiasCalendario } from "../../comun/fechas";
import { explicarErrorReserva, obtenerCodigoError } from "../../comun/errores";
import { cerrarModalActivo, pedirConfirmacion, mostrarAviso } from "../../comun/avisos";
import { descargarCalendario } from "../../exportaciones/calendario";
import { mostrarHuecos } from "./huecos-reserva";
import type { Servicio, HuecoDisponible, SolicitudReserva, ResultadoReserva } from "../../modelos/agenda";
import type { Profesional } from "../../modelos/cuentas";
import type { DatosCalendario } from "../../modelos/interfaz";

const selectorServicio = document.querySelector<HTMLSelectElement>("#service-select")!;
const selectorProfesional = document.querySelector<HTMLSelectElement>("#barber-select")!;
const cualquierProfesional = document.querySelector<HTMLInputElement>("#any-barber")!;
const selectorFecha = document.querySelector<HTMLInputElement>("#date-select")!;
const telefono = document.querySelector<HTMLInputElement>("#phone-input")!;
const notas = document.querySelector<HTMLTextAreaElement>("#notes-input")!;
const mensaje = document.getElementById("slots-msg")!;
const contenedorHuecos = document.getElementById("slots-list")!;
const confirmacion = document.getElementById("booking-success")!;
const resumen = document.getElementById("booking-summary")!;
const botonCalendario = document.querySelector<HTMLButtonElement>("#booking-ics")!;
const CLAVE_PENDIENTE = "barberpro-reserva-pendiente";
let servicios: Servicio[] = [];
let profesionales: Profesional[] = [];
let revisionDisponibilidad = 0;
let esperaDisponibilidad: number | undefined;
let solicitudEnCurso = false;
let pendiente: SolicitudReserva | null = null;
let ultimoCalendario: DatosCalendario | null = null;
let uidPagina = "";
let botonComprobar: HTMLButtonElement | null = null;
let sesionEnError = false;

function mostrarMensajeReserva(texto: string, esError = false): void {
  mensaje.textContent = texto;
  mensaje.className = esError ? "text-sm text-red-700 mt-4 min-h-[1.5rem]" : "text-sm text-gray-600 mt-4 min-h-[1.5rem]";
}

function marcarReservaOcupada(ocupada: boolean): void {
  for (const campo of [selectorServicio, selectorProfesional, cualquierProfesional, selectorFecha, telefono, notas]) {
    campo.disabled = ocupada;
  }
  if (!ocupada) selectorProfesional.disabled = cualquierProfesional.checked;
  const botones = contenedorHuecos.querySelectorAll<HTMLButtonElement>("button");
  for (const boton of botones) {
    boton.disabled = ocupada;
  }
}

function obtenerNombreProfesional(uid: string): string {
  return profesionales.find((actual) => actual.uid === uid)?.name || "Profesional";
}
function obtenerServicioSeleccionado(id = selectorServicio.value): Servicio | undefined {
  return servicios.find((actual) => actual.id === id);
}

async function cargarServicios(): Promise<void> {
  servicios = await obtenerServicios();
  selectorServicio.replaceChildren();
  for (const servicio of servicios) {
    selectorServicio.add(new Option(servicio.name + " - " + servicio.durationMin + " min - " + servicio.price.toFixed(2) + " EUR", servicio.id));
  }
  if (!servicios.length) selectorServicio.add(new Option("Sin servicios activos", ""));
}

async function cargarProfesionales(): Promise<void> {
  profesionales = await obtenerProfesionales();
  selectorProfesional.replaceChildren();
  for (const profesional of profesionales) {
    selectorProfesional.add(new Option(profesional.name, profesional.uid));
  }
  if (!profesionales.length) selectorProfesional.add(new Option("Sin profesionales activos", ""));
}

async function prepararSelectorFecha(): Promise<void> {
  const configuracion = await obtenerConfiguracionAgenda();
  const hoy = formatearFechaNegocio(configuracion.timezone);
  selectorFecha.min = hoy;
  selectorFecha.max = sumarDiasCalendario(hoy, 30);
  if (!selectorFecha.value) {
    selectorFecha.value = hoy;
  }
}

async function cargarDisponibilidad(): Promise<void> {
  const revision = ++revisionDisponibilidad;
  contenedorHuecos.replaceChildren();
  if (!selectorServicio.value || !selectorFecha.value) {
    mostrarMensajeReserva("Selecciona servicio y fecha para ver horas disponibles.");
    return;
  }
  if (!selectorFecha.checkValidity()) {
    mostrarMensajeReserva("Selecciona una fecha dentro de los proximos 30 dias.", true);
    return;
  }
  const seleccion = {
    dateStr: selectorFecha.value,
    serviceId: selectorServicio.value,
    anyBarber: cualquierProfesional.checked,
    barberPreference: cualquierProfesional.checked ? null : selectorProfesional.value,
  };
  mostrarMensajeReserva("Calculando disponibilidad...");
  try {
    const respuesta = await consultarDisponibilidad(seleccion);
    const estado = await esperarEstadoSesion();
    if (revision !== revisionDisponibilidad || estado.usuario?.uid !== uidPagina) return;
    if (!respuesta.ok || !Array.isArray(respuesta.slots)) throw new Error("Respuesta no valida.");
    mostrarHuecos(contenedorHuecos, respuesta.slots, profesionales, (hueco) => {
      void crearReserva(hueco);
    });
    mostrarMensajeReserva(respuesta.slots.length ? "Selecciona una hora para confirmar tu reserva." : "Sin disponibilidad.");
  } catch (error) {
    if (revision !== revisionDisponibilidad) return;
    const codigo = obtenerCodigoError(error);
    const mensajeError = ["functions/unavailable", "functions/internal", ""].includes(codigo)
      ? "No se pudo cargar disponibilidad. Comprueba la conexion y vuelve a intentarlo."
      : explicarErrorReserva(error);
    mostrarMensajeReserva(mensajeError, true);
  }
}

function guardarOperacion(solicitud: SolicitudReserva): void {
  pendiente = solicitud;
  // No almacena credenciales ni permisos. La identidad se vuelve a comprobar en el servidor.
  try {
    sessionStorage.setItem(CLAVE_PENDIENTE, JSON.stringify({ uid: uidPagina, solicitud }));
  } catch {
    // El reintento en memoria sigue disponible.
  }
}

function limpiarOperacion(): void {
  pendiente = null;
  try {
    sessionStorage.removeItem(CLAVE_PENDIENTE);
  } catch {
    // El almacenamiento puede estar deshabilitado.
  }
  botonComprobar?.remove();
  botonComprobar = null;
}

function mostrarOperacionPendiente(): void {
  marcarReservaOcupada(true);
  contenedorHuecos.replaceChildren();
  mostrarMensajeReserva("No se pudo confirmar la respuesta. Comprueba la reserva antes de volver a enviarla.", true);
  if (!botonComprobar) {
    botonComprobar = document.createElement("button");
    botonComprobar.type = "button";
    botonComprobar.className = "rounded border px-3 py-2 text-sm";
    botonComprobar.textContent = "Comprobar reserva";
    botonComprobar.addEventListener("click", () => {
      if (pendiente) void enviarReserva(pendiente);
    });
    mensaje.after(botonComprobar);
  }
  botonComprobar.disabled = false;
}

function mostrarReservaCreada(solicitud: SolicitudReserva, resultado: ResultadoReserva): void {
  const servicio = obtenerServicioSeleccionado(solicitud.serviceId);
  confirmacion.classList.remove("hidden");
  resumen.textContent = (servicio?.name || "Servicio") + " - " + solicitud.dateStr + " " + solicitud.timeStr + " - " + obtenerNombreProfesional(resultado.barberUid);
  ultimoCalendario = {
    title: "Cita barberia - " + (servicio?.name || "Servicio"),
    startUtc: resultado.startAt,
    endUtc: resultado.endAt,
    description: "Reserva " + (servicio?.name || "Servicio") + " (" + (servicio?.durationMin || "") + " min).",
    location: "Barberia",
  };
  botonCalendario.disabled = false;
  mostrarAviso("Reserva creada correctamente.", "success");
}

async function enviarReserva(solicitud: SolicitudReserva): Promise<void> {
  if (solicitudEnCurso) return;
  solicitudEnCurso = true;
  marcarReservaOcupada(true);
  if (botonComprobar) botonComprobar.disabled = true;
  mostrarMensajeReserva("Creando reserva...");
  guardarOperacion(solicitud);
  try {
    const resultado = await solicitarReserva(solicitud);
    const estado = await esperarEstadoSesion();
    if (estado.usuario?.uid !== uidPagina) return;
    if (!resultado.ok || !resultado.bookingId || !resultado.startAt || !resultado.endAt) throw new Error("Respuesta incompleta.");
    limpiarOperacion();
    mostrarReservaCreada(solicitud, resultado);
    await cargarDisponibilidad();
  } catch (error) {
    const estado = await esperarEstadoSesion();
    if (estado.usuario?.uid !== uidPagina) return;
    const codigo = obtenerCodigoError(error);
    if (["functions/already-exists", "functions/invalid-argument", "functions/failed-precondition", "functions/permission-denied", "functions/unauthenticated", "functions/not-found"].includes(codigo)) {
      limpiarOperacion();
      await cargarDisponibilidad();
      mostrarMensajeReserva(explicarErrorReserva(error), true);
    } else {
      mostrarOperacionPendiente();
    }
  } finally {
    solicitudEnCurso = false;
    if (!pendiente) marcarReservaOcupada(false);
  }
}

async function crearReserva(hueco: HuecoDisponible): Promise<void> {
  if (solicitudEnCurso || pendiente) return;
  const servicio = obtenerServicioSeleccionado();
  if (!servicio || obtenerUsuarioActual().usuario?.uid !== uidPagina) return;
  solicitudEnCurso = true;
  const solicitud: SolicitudReserva = {
    dateStr: selectorFecha.value,
    timeStr: hueco.timeStr,
    serviceId: servicio.id,
    barberPreference: hueco.barberUid,
    anyBarber: cualquierProfesional.checked,
    customerPhone: telefono.value.trim(),
    customerNotes: notas.value.trim(),
    requestId: crypto.randomUUID(),
  };
  const confirmado = await pedirConfirmacion({
    title: "Confirmar reserva",
    message: "Servicio: " + servicio.name + "\nFecha: " + solicitud.dateStr + "\nHora: " + solicitud.timeStr
      + "\nProfesional: " + obtenerNombreProfesional(hueco.barberUid),
    confirmText: "Confirmar reserva",
    cancelText: "Seguir eligiendo",
  });
  solicitudEnCurso = false;
  if (!confirmado || obtenerUsuarioActual().usuario?.uid !== uidPagina) {
    marcarReservaOcupada(false);
    return;
  }
  await enviarReserva(solicitud);
}

function enlazarEventosReserva(): void {
  for (const campo of [selectorServicio, selectorProfesional, selectorFecha, cualquierProfesional]) {
    campo.addEventListener("change", () => {
    revisionDisponibilidad++;
    selectorProfesional.disabled = cualquierProfesional.checked;
    window.clearTimeout(esperaDisponibilidad);
    contenedorHuecos.replaceChildren();
    mostrarMensajeReserva("Calculando disponibilidad...");
    // Agrupar una selección rápida evita abrir un proceso backend por cada campo.
    // La revisión anterior ya está invalidada mientras esperamos la selección final.
    esperaDisponibilidad = window.setTimeout(() => {
      esperaDisponibilidad = undefined;
      if (obtenerUsuarioActual().usuario?.uid === uidPagina && !solicitudEnCurso && !pendiente) void cargarDisponibilidad();
    }, 250);
    });
  }
  botonCalendario.addEventListener("click", () => {
    if (ultimoCalendario) descargarCalendario(ultimoCalendario);
  });
}

observarSesion((estado) => {
  if (estado.estado === "cargando") return;
  if (estado.estado === "error") {
    sesionEnError = true;
    window.clearTimeout(esperaDisponibilidad);
    revisionDisponibilidad++;
    cerrarModalActivo();
    return;
  }
  if (estado.usuario?.uid === uidPagina) {
    if (sesionEnError && !solicitudEnCurso) {
      sesionEnError = false;
      if (pendiente) mostrarOperacionPendiente();
      else void cargarDisponibilidad();
    }
    return;
  }
  if (uidPagina) {
    window.clearTimeout(esperaDisponibilidad);
    revisionDisponibilidad++;
    contenedorHuecos.replaceChildren();
    confirmacion.classList.add("hidden");
    resumen.textContent = "";
    telefono.value = "";
    notas.value = "";
    ultimoCalendario = null;
    limpiarOperacion();
    cerrarModalActivo();
  }
});

void (async () => {
  const estado = await esperarEstadoSesion();
  if (!estado.usuario?.correoVerificado) return;
  uidPagina = estado.usuario.uid;
  marcarReservaOcupada(true);
  try {
    await Promise.all([cargarServicios(), cargarProfesionales(), prepararSelectorFecha()]);
    const estadoActual = await esperarEstadoSesion();
    if (estadoActual.usuario?.uid !== uidPagina) return;
    enlazarEventosReserva();
    if (!servicios.length || !profesionales.length) {
      marcarReservaOcupada(false);
      mostrarMensajeReserva(!servicios.length ? "No hay servicios disponibles ahora. Contacta con el equipo o vuelve mas tarde." : "No hay profesionales activos para reservar.");
      return;
    }
    let guardado: string | null = null;
    try { guardado = sessionStorage.getItem(CLAVE_PENDIENTE); } catch { /* El navegador puede impedir almacenamiento persistente. */ }
    if (guardado) {
      let datos: { uid?: string; solicitud?: SolicitudReserva } = {};
      try { datos = JSON.parse(guardado); } catch { limpiarOperacion(); }
      if (datos.uid === uidPagina && datos.solicitud?.requestId) {
        pendiente = datos.solicitud;
        mostrarOperacionPendiente();
        return;
      }
      limpiarOperacion();
    }
    marcarReservaOcupada(false);
    await cargarDisponibilidad();
  } catch { mostrarMensajeReserva("No se pudieron cargar los datos de reserva. Comprueba la conexion y vuelve a cargar la pagina.", true); }
})();
