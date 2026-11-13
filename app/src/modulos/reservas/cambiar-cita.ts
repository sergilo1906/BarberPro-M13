import { consultarDisponibilidad, reprogramarReserva } from "../../datos/funciones-remotas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { abrirModal, mostrarAviso } from "../../comun/avisos";
import { esFechaCalendarioValida, formatearFechaNegocio, sumarDiasCalendario } from "../../comun/fechas";
import { obtenerServicioCita } from "../../comun/estados-cita";
import { esRespuestaReservaIncierta, explicarErrorCambioCita } from "../../comun/errores";
import type { Cita, HuecoDisponible, SolicitudCambio } from "../../modelos/agenda";

const CLAVE_CAMBIO = "barberpro-cambio-pendiente";
let cambioEnMemoria: { uid: string; solicitud: SolicitudCambio } | null = null;

export function recuperarCambioPendiente(uid: string): SolicitudCambio | null {
  try {
    const guardado = JSON.parse(sessionStorage.getItem(CLAVE_CAMBIO) || "null");
    if (guardado?.uid === uid
      && typeof guardado.solicitud?.bookingId === "string"
      && typeof guardado.solicitud?.requestId === "string") {
      cambioEnMemoria = guardado;
    }
  } catch { /* El reintento en memoria funciona incluso sin almacenamiento del navegador. */ }
  return cambioEnMemoria?.uid === uid ? cambioEnMemoria.solicitud : null;
}

export function limpiarCambioPendiente(): void {
  cambioEnMemoria = null;
  try {
    sessionStorage.removeItem(CLAVE_CAMBIO);
  } catch {
    // El reintento en memoria sigue disponible.
  }
}

function guardarCambioPendiente(uid: string, solicitud: SolicitudCambio): void {
  cambioEnMemoria = { uid, solicitud };
  try {
    sessionStorage.setItem(CLAVE_CAMBIO, JSON.stringify(cambioEnMemoria));
  } catch {
    // Se conserva en memoria si sessionStorage está deshabilitado.
  }
}

interface ContextoCambio {
  uid: string;
  zona: string;
  margen: number;
  obtenerNombreProfesional: (uid: string) => string;
  sigueAutorizado: () => boolean;
  alTerminar: (cambiada: boolean) => void;
}

export function abrirCambioCita(cita: Cita, contexto: ContextoCambio, recuperada: SolicitudCambio | null = null): void {
  const servicio = obtenerServicioCita(cita);
  if (!servicio && !recuperada) {
    mostrarAviso("Esta cita ya no se puede cambiar desde aqui.", "error");
    return;
  }
  const contenido = document.createElement("div");
  contenido.className = "space-y-3";
  contenido.innerHTML = [
    "<h3 class=\"text-base font-semibold text-slate-900\">Cambiar cita",
    "</h3>",
    "<p data-field=\"hint\" class=\"text-xs text-slate-600\">",
    "</p>",
    "<label class=\"block text-sm text-slate-700\">Nuevo dia",
    "<input data-field=\"date\" type=\"date\" class=\"mt-1 w-full rounded border px-2 py-2 text-sm\" />",
    "</label>",
    "<label class=\"flex items-center gap-2 text-sm text-slate-700\">",
    "<input data-field=\"any-barber\" type=\"checkbox\" class=\"h-4 w-4 rounded border-slate-300\" />Buscar tambien con otro profesional",
    "</label>",
    "<p data-field=\"slot-msg\" role=\"status\" aria-live=\"polite\" class=\"text-xs text-slate-600\">Buscando horas libres...",
    "</p>",
    "<div data-field=\"slot-list\" class=\"grid gap-2 sm:grid-cols-2\">",
    "</div>",
    "<p data-field=\"picked\" class=\"text-xs text-slate-600\">",
    "</p>",
    "<div class=\"flex justify-end gap-2 pt-2\">",
    "<button type=\"button\" data-action=\"cancel\" class=\"rounded border px-3 py-2 text-sm\">Cancelar",
    "</button>",
    "<button type=\"button\" data-action=\"confirm\" class=\"rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700\" disabled>Guardar cambio",
    "</button>",
    "</div>"
  ].join("");
  contenido.querySelector('[data-field="hint"]')!.textContent = "Elige un hueco libre. Los cambios solo se permiten con " + contexto.margen + " h de margen.";
  const fecha = contenido.querySelector<HTMLInputElement>('[data-field="date"]')!;
  const cualquiera = contenido.querySelector<HTMLInputElement>('[data-field="any-barber"]')!;
  const mensaje = contenido.querySelector<HTMLElement>('[data-field="slot-msg"]')!;
  const lista = contenido.querySelector<HTMLElement>('[data-field="slot-list"]')!;
  const elegido = contenido.querySelector<HTMLElement>('[data-field="picked"]')!;
  const guardar = contenido.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
  const cancelar = contenido.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
  fecha.min = formatearFechaNegocio(contexto.zona);
  fecha.max = sumarDiasCalendario(fecha.min, 30);
  const sugerida = esFechaCalendarioValida(cita.dateStr) ? sumarDiasCalendario(cita.dateStr, 1) : fecha.min;
  fecha.value = recuperada?.newDateStr || (sugerida > fecha.max ? fecha.max : sugerida < fecha.min ? fecha.min : sugerida);
  let seleccion: HuecoDisponible | null = recuperada ? { timeStr: recuperada.newTimeStr, barberUid: recuperada.barberPreference || "" } : null;
  let solicitud = recuperada;
  let enviando = false;
  let cerrado = false;
  let cambiada = false;
  let revision = 0;
  const cerrar = abrirModal(contenido, () => {
    cerrado = true;
    revision++;
    contexto.alTerminar(cambiada);
  }, () => !enviando);
  function vigente(): boolean {
    return !cerrado && contexto.sigueAutorizado();
  }
  function mostrarHuecoElegido(): void {
    elegido.textContent = seleccion ? "Nuevo hueco: " + fecha.value + " a las " + seleccion.timeStr + " con " + contexto.obtenerNombreProfesional(seleccion.barberUid) + "." : "";
  }
  function bloquearCampos(): void {
    fecha.disabled = enviando || !!solicitud;
    cualquiera.disabled = enviando || !!solicitud;
    cancelar.disabled = enviando;
    guardar.disabled = enviando || (!seleccion && !solicitud);
    guardar.textContent = enviando ? "Guardando..." : solicitud ? "Comprobar cambio" : "Guardar cambio";
    for (const boton of lista.querySelectorAll<HTMLButtonElement>("button")) {
      boton.disabled = enviando || !!solicitud;
    }
  }
  function mostrarHuecos(huecos: HuecoDisponible[]): void {
    lista.replaceChildren();
    if (!huecos.length) {
      const vacio = document.createElement("div");
      vacio.className = "rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2";
      vacio.textContent = "No hay horas libres para ese dia. Prueba con otra fecha.";
      lista.append(vacio);
      mensaje.textContent = "No hay horas libres para ese dia.";
      return;
    }
    mensaje.textContent = "Elige una hora para guardar el cambio.";
    for (const hueco of huecos) {
      lista.append(crearBotonHueco(hueco, huecos));
    }
  }
  function crearBotonHueco(hueco: HuecoDisponible, huecos: HuecoDisponible[]): HTMLButtonElement {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.dataset.time = hueco.timeStr;
    boton.dataset.barber = hueco.barberUid;
    const marcado = seleccion?.timeStr === hueco.timeStr && seleccion?.barberUid === hueco.barberUid;
    boton.className = "slot-choice rounded border px-3 py-2 text-left text-sm " + (marcado ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50");
    boton.setAttribute("aria-pressed", String(marcado));
    const hora = document.createElement("div");
    hora.className = "font-medium";
    hora.textContent = hueco.timeStr;
    const profesional = document.createElement("div");
    profesional.className = "text-xs text-slate-600";
    profesional.textContent = contexto.obtenerNombreProfesional(hueco.barberUid);
    boton.append(hora, profesional);
    boton.addEventListener("click", () => {
      if (enviando || solicitud) return;
      seleccion = hueco;
      mostrarHuecoElegido();
      mostrarHuecos(huecos);
      bloquearCampos();
    });
    return boton;
  }
  async function cargarHuecosCambio(): Promise<void> {
    const actual = ++revision;
    seleccion = null;
    mostrarHuecoElegido();
    bloquearCampos();
    lista.replaceChildren();
    if (!esFechaCalendarioValida(fecha.value) || !fecha.checkValidity()) {
      mensaje.textContent = "Elige una fecha valida dentro de los proximos 30 dias.";
      return;
    }
    mensaje.textContent = "Buscando horas libres...";
    try {
      const respuesta = await consultarDisponibilidad({ dateStr: fecha.value, serviceId: servicio, barberPreference: cualquiera.checked ? null : cita.barberUid || null, anyBarber: cualquiera.checked });
      const estado = await esperarEstadoSesion();
      if (!vigente() || actual !== revision || estado.usuario?.uid !== contexto.uid) return;
      mostrarHuecos(respuesta.slots);
    } catch {
      if (vigente() && actual === revision) {
        mensaje.textContent = "No se pudieron cargar las horas libres. Cambia la fecha para volver a intentarlo.";
      }
    }
  }
  async function guardarCambio(): Promise<void> {
    if (enviando || !vigente() || (!seleccion && !solicitud)) return;
    solicitud ||= {
      bookingId: cita.id,
      newDateStr: fecha.value,
      newTimeStr: seleccion!.timeStr,
      barberPreference: seleccion!.barberUid,
      anyBarber: false,
      requestId: crypto.randomUUID(),
    };
    guardarCambioPendiente(contexto.uid, solicitud);
    enviando = true;
    bloquearCampos();
    try {
      const respuesta = await reprogramarReserva(solicitud);
      const estado = await esperarEstadoSesion();
      if (!vigente() || estado.usuario?.uid !== contexto.uid) return;
      if (!respuesta.ok) throw new Error("Respuesta no valida.");
      limpiarCambioPendiente();
      cambiada = true;
      cerrar();
      mostrarAviso("Cita cambiada correctamente.", "success");
    } catch (error) {
      if (!vigente()) return;
      if (!esRespuestaReservaIncierta(error)) {
        limpiarCambioPendiente();
        solicitud = null;
      }
      mensaje.textContent = explicarErrorCambioCita(error, contexto.margen);
      if (!solicitud) {
        seleccion = null;
        lista.replaceChildren();
        elegido.textContent = "";
      }
    } finally {
      enviando = false;
      if (vigente()) bloquearCampos();
    }
  }
  fecha.addEventListener("change", () => {
    if (!solicitud) void cargarHuecosCambio();
  });
  cualquiera.addEventListener("change", () => {
    if (!solicitud) void cargarHuecosCambio();
  });
  cancelar.addEventListener("click", cerrar);
  guardar.addEventListener("click", () => {
    void guardarCambio();
  });
  if (solicitud) {
    mensaje.textContent = "Hay un cambio pendiente de comprobar. Se utilizara la misma solicitud.";
    mostrarHuecoElegido();
    bloquearCampos();
  }
  else void cargarHuecosCambio();
}
