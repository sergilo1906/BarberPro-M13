import { observarAreaAutorizada, type ContextoAutorizado } from "../../comun/permisos";
import { obtenerServicios } from "../../datos/catalogo";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { consultarDisponibilidad, solicitarReserva } from "../../datos/funciones-remotas";
import { formatearFechaNegocio, sumarDiasCalendario } from "../../comun/fechas";
import type { SolicitudReserva } from "../../modelos/agenda";
const servicio = document.querySelector<HTMLSelectElement>("#service-select")!;
const fecha = document.querySelector<HTMLInputElement>("#date-select")!;
const lista = document.getElementById("slots-list")!;
const mensaje = document.getElementById("slots-msg")!;
const exito = document.getElementById("booking-success")!;
const resumen = document.getElementById("booking-summary")!;
const reintentar = document.querySelector<HTMLButtonElement>("#booking-retry")!;
let contexto: ContextoAutorizado | null = null;
let revision = 0;
let ocupada = false;
let pendiente: SolicitudReserva | null = null;
function clave() { return "barberpro-reserva-" + contexto!.usuario.uid; }
function guardarPendiente() {
  try { if (pendiente) sessionStorage.setItem(clave(), JSON.stringify(pendiente)); else sessionStorage.removeItem(clave()); } catch { /* Se conserva en memoria. */ }
}
function bloquear(valor: boolean) {
  ocupada = valor;
  servicio.disabled = valor; fecha.disabled = valor; reintentar.disabled = valor;
  lista.querySelectorAll("button").forEach(boton => { boton.disabled = valor; });
}
async function reservar(datos: SolicitudReserva) {
  const actual = contexto;
  if (!actual?.esVigente() || ocupada) return;
  pendiente = datos; guardarPendiente(); bloquear(true);
  mensaje.textContent = "Confirmando reserva...";
  try {
    const resultado = await solicitarReserva(datos);
    if (!actual.esVigente()) return;
    pendiente = null; guardarPendiente(); reintentar.hidden = true;
    resumen.textContent = resultado.status === "confirmed"
      ? "Cita confirmada: " + datos.dateStr + " a las " + datos.timeStr
      : "Esta solicitud ya corresponde a una cita " + (resultado.status === "cancelled" ? "cancelada" : "hecha") + ". Consulta Mis citas.";
    exito.classList.remove("hidden"); mensaje.textContent = ""; lista.replaceChildren();
  } catch (error) {
    if (!actual.esVigente()) return;
    mensaje.textContent = error instanceof Error ? error.message : "No se pudo confirmar. Reintenta la misma solicitud.";
    reintentar.hidden = false;
  } finally { if (actual.esVigente()) bloquear(false); }
}
async function cargarHoras() {
  const actual = contexto;
  if (!actual?.esVigente() || ocupada) return;
  const consulta = ++revision;
  lista.replaceChildren(); exito.classList.add("hidden");
  // Una seleccion nueva es una solicitud nueva. Los reintentos conservan su identificador.
  pendiente = null; guardarPendiente(); reintentar.hidden = true;
  if (!servicio.value || !fecha.value) { mensaje.textContent = "Selecciona servicio y fecha."; return; }
  mensaje.textContent = "Consultando disponibilidad...";
  try {
    const datos = { serviceId: servicio.value, dateStr: fecha.value };
    const resultado = await consultarDisponibilidad(datos);
    if (!actual.esVigente() || consulta !== revision) return;
    mensaje.textContent = resultado.slots.length ? "Selecciona una hora para confirmar la cita." : "No hay horas disponibles para esa fecha.";
    for (const hueco of resultado.slots) {
      const boton = document.createElement("button");
      boton.type = "button"; boton.textContent = hueco.timeStr;
      boton.className = "rounded border border-blue-300 px-3 py-2 hover:bg-blue-50";
      boton.addEventListener("click", () => void reservar({ ...datos, timeStr: hueco.timeStr, requestId: crypto.randomUUID() }));
      lista.append(boton);
    }
  } catch (error) { if (actual.esVigente() && consulta === revision) mensaje.textContent = error instanceof Error ? error.message : "No se pudo consultar. Prueba otra vez."; }
}
servicio.addEventListener("change", () => void cargarHoras());
fecha.addEventListener("change", () => void cargarHoras());
reintentar.addEventListener("click", () => { if (pendiente) void reservar(pendiente); });
observarAreaAutorizada(["client", "admin"], actual => {
  contexto = actual;
  void (async () => {
    try {
      const [catalogo, config] = await Promise.all([obtenerServicios(), obtenerConfiguracionAgenda()]);
      if (!actual.esVigente()) return;
      servicio.replaceChildren(new Option("Selecciona un servicio", ""));
      for (const item of catalogo) servicio.add(new Option(item.name + " · " + item.durationMin + " min · " + item.price + " EUR", item.id));
      fecha.min = formatearFechaNegocio(config.timezone); fecha.max = sumarDiasCalendario(fecha.min, 30);
      document.getElementById("booking-zone")!.textContent = config.timezone;
      mensaje.textContent = catalogo.length ? "Selecciona servicio y fecha." : "No hay servicios activos.";
      try {
        const guardada = JSON.parse(sessionStorage.getItem(clave()) || "null");
        if (guardada && typeof guardada.serviceId === "string" && typeof guardada.dateStr === "string" && typeof guardada.timeStr === "string" && typeof guardada.requestId === "string") {
          pendiente = guardada; servicio.value = guardada.serviceId; fecha.value = guardada.dateStr; reintentar.hidden = false;
          mensaje.textContent = "Hay una solicitud sin confirmar. Reintenta para consultar su resultado sin duplicarla.";
        }
      } catch { /* Un dato corrupto no se ejecuta. */ }
    } catch (error) { if (actual.esVigente()) mensaje.textContent = error instanceof Error ? error.message : "No se pudieron cargar los servicios."; }
  })();
}, () => {
  revision++; contexto = null; pendiente = null; bloquear(true);
  lista.replaceChildren(); servicio.replaceChildren(); fecha.value = ""; mensaje.textContent = ""; resumen.textContent = ""; exito.classList.add("hidden"); reintentar.hidden = true;
});
// La carga inicial habilita los controles despues de confirmar la identidad.
observarAreaAutorizada(["client", "admin"], () => bloquear(false), () => {});

