import { observarAreaAutorizada, type ContextoProfesional } from "../../comun/permisos";
import { explicarErrorAdministracion, esRespuestaReservaIncierta } from "../../comun/errores";
import { mostrarAviso } from "../../comun/avisos";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { esperarEstadoSesion } from "../../datos/sesion";
import { ejecutarOperacionAgenda, guardarOperacionAgenda, recuperarOperacionAgenda, borrarOperacionAgenda } from "../../datos/funciones-remotas";
import type { OperacionAgenda } from "../../modelos/agenda";
const zona = document.querySelector<HTMLInputElement>("#cfg-timezone")!;
const margen = document.querySelector<HTMLInputElement>("#cfg-cancel-hours")!;
const avisos = document.querySelector<HTMLInputElement>("#cfg-reminders")!;
const guardar = document.querySelector<HTMLButtonElement>("#cfg-save")!;
const mensaje = document.getElementById("cfg-msg")!;
let contexto: ContextoProfesional | null = null;
let ocupada = false;
let cargada = false;
let revision = 0;
let pendiente: OperacionAgenda | null = null;
function mostrarMensaje(texto: string, error = false): void {
  mensaje.textContent = texto;
  mensaje.className = error ? "text-sm text-red-700" : "text-sm text-gray-600";
}
function bloquear(valor: boolean): void {
  ocupada = valor;
  for (const campo of [zona, margen, avisos]) {
    campo.disabled = valor || !!pendiente || !cargada;
  }
  guardar.disabled = valor || (!pendiente && !cargada);
  guardar.textContent = pendiente ? "Comprobar guardado" : "Guardar";
}
async function cargarConfiguracion(): Promise<void> {
  const actual = contexto;
  if (!actual?.esVigente()) return;
  cargada = false;
  bloquear(true);
  mostrarMensaje("Cargando...");
  try {
    const datos = await obtenerConfiguracionAgenda();
    await esperarEstadoSesion();
    if (!actual.esVigente()) return;
    zona.value = datos.timezone;
    margen.value = String(datos.cancelWindowHours);
    avisos.value = datos.reminderWindowsHours.join(", ");
    revision = datos.adminRevision;
    cargada = true;
    mostrarMensaje("Configuracion cargada.");
    if (pendiente) mostrarMensaje("Hay un guardado pendiente de comprobar.");
  } catch {
    await esperarEstadoSesion();
    if (actual.esVigente()) {
      mostrarMensaje("No se pudo cargar la configuracion. Actualiza la pagina.", true);
    }
  }
  finally {
    if (contexto === actual) bloquear(false);
  }
}
async function guardarConfiguracion(): Promise<void> {
  const actual = contexto;
  if (ocupada || !actual?.esVigente() || (!pendiente && !cargada)) return;
  if (!pendiente) {
    const timezone = zona.value.trim();
    const cancelWindowHours = Number(margen.value);
    const reminderWindowsHours = avisos.value.split(",").map((valor) => Number(valor.trim()));
    try {
      if (!timezone) throw new Error();
      new Intl.DateTimeFormat("es", { timeZone: timezone }).format();
    }
    catch {
      mostrarMensaje("Revisa la zona horaria, el margen para cancelar y los avisos previos.", true);
      return;
    }
    const margenInvalido = !Number.isFinite(cancelWindowHours) || cancelWindowHours <= 0;
    const avisosInvalidos = reminderWindowsHours.length > 20
      || reminderWindowsHours.some((valor) => !Number.isFinite(valor) || valor <= 0);
    if (margenInvalido || avisosInvalidos) {
      mostrarMensaje("Revisa la zona horaria, el margen para cancelar y los avisos previos.", true);
      return;
    }
    pendiente = {
      tipo: "reglas",
      datos: { timezone, cancelWindowHours, reminderWindowsHours, expectedRevision: revision, requestId: crypto.randomUUID() },
    };
    guardarOperacionAgenda(actual.usuario.uid, "reglas", pendiente);
  }
  bloquear(true);
  mostrarMensaje("Guardando...");
  try {
    await ejecutarOperacionAgenda(pendiente);
    await esperarEstadoSesion();
    if (!actual.esVigente()) return;
    borrarOperacionAgenda(actual.usuario.uid, "reglas");
    pendiente = null;
    await cargarConfiguracion();
    if (actual.esVigente()) {
      mostrarMensaje("Cambios guardados.");
      mostrarAviso("Cambios guardados.", "success");
    }
  } catch (error) {
    await esperarEstadoSesion();
    if (!actual.esVigente()) return;
    if (!esRespuestaReservaIncierta(error)) {
      borrarOperacionAgenda(actual.usuario.uid, "reglas");
      pendiente = null;
    }
    mostrarMensaje(explicarErrorAdministracion(error), true);
  } finally {
    if (contexto === actual) bloquear(false);
  }
}
guardar.addEventListener("click", () => { void guardarConfiguracion(); });
observarAreaAutorizada(["admin"], (actual) => {
  contexto = actual;
  pendiente = recuperarOperacionAgenda(actual.usuario.uid, "reglas");
  void cargarConfiguracion();
}, () => {
  if (contexto) borrarOperacionAgenda(contexto.usuario.uid, "reglas");
  contexto = null;
  pendiente = null;
  cargada = false;
  zona.value = "";
  margen.value = "";
  avisos.value = "";
  mostrarMensaje("");
  bloquear(false);
});
