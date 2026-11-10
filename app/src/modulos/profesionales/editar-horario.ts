import { observarAreaProfesional, esPersonal, type ContextoProfesional } from "../../comun/permisos";
import { formatearFechaNegocio, obtenerLunesSemana, sumarDiasCalendario } from "../../comun/fechas";
import { explicarErrorAgenda, esRespuestaReservaIncierta } from "../../comun/errores";
import { mostrarAviso } from "../../comun/avisos";
import { obtenerUsuarioActual, esperarEstadoSesion } from "../../datos/sesion";
import { obtenerProfesionales, obtenerFichaProfesional } from "../../datos/personas";
import { obtenerSemanaProfesional } from "../../datos/agenda";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { borrarOperacionAgenda, ejecutarOperacionAgenda, guardarOperacionAgenda, recuperarOperacionAgenda } from "../../datos/funciones-remotas";
import { prepararHorarioFormulario, rellenarFormularioHorario, leerFormularioHorario, enlazarDiasHorario, alternarFilaHorario } from "./formulario-horario";
import type { OperacionAgenda, SemanaProfesional } from "../../modelos/agenda";

const selector = document.querySelector<HTMLSelectElement>("#setup-barber-select")!;
const contenedor = document.getElementById("setup-barber-wrap")!;
const ayuda = document.getElementById("setup-barber-help")!;
const fecha = document.querySelector<HTMLInputElement>("#week-date")!;
const publicada = document.querySelector<HTMLInputElement>("#week-published")!;
const guardar = document.querySelector<HTMLButtonElement>("#save-config")!;
const error = document.getElementById("config-error")!, correcto = document.getElementById("config-ok")!;
let contexto: ContextoProfesional | null = null;
let uidObjetivo = "", semanaActual = "", revision = 0;
let horarioActual = prepararHorarioFormulario(), semanaCargada: SemanaProfesional | null = null;
let pendiente: OperacionAgenda | null = null;
let ocupada = false, cargada = false;

function mostrarError(texto: string): void { error.textContent = texto; error.classList.remove("hidden"); correcto.classList.add("hidden"); }
function mostrarCorrecto(texto: string): void { correcto.textContent = texto; correcto.classList.remove("hidden"); error.classList.add("hidden"); }
function marcarOcupada(valor: boolean): void {
  ocupada = valor;
  for (const campo of document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>("main input, main select, main button")) campo.disabled = valor || !!pendiente || !cargada;
  for (const id of ["setup-barber-select", "week-date", "week-prev", "week-next", "copy-week"]) document.querySelector<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("#" + id)!.disabled = valor || !!pendiente || !contexto || !uidObjetivo;
  if (!valor && !pendiente && cargada) for (let indice = 0; indice < 7; indice++) alternarFilaHorario(indice);
  guardar.disabled = valor || (!pendiente && !cargada);
  guardar.textContent = valor ? "Guardando..." : pendiente ? "Comprobar guardado" : "Guardar semana";
}
function sincronizarSemana(semana: string): void {
  fecha.value = semana;
  document.getElementById("week-current-label")!.textContent = "Del " + semana + " al " + sumarDiasCalendario(semana, 6);
}
async function cargarHorarioSemanal(semana: string, copiar = false): Promise<void> {
  const actual = contexto, consulta = ++revision, uid = uidObjetivo;
  if (!actual?.esVigente()) return;
  if (!semana) { semanaActual = ""; cargada = false; mostrarError("Selecciona una semana valida."); marcarOcupada(false); return; }
  const destino = copiar ? semanaActual : semana;
  if (!copiar) { cargada = false; semanaCargada = null; semanaActual = semana; sincronizarSemana(semana); }
  marcarOcupada(true);
  try {
    const [ficha, documento] = await Promise.all([obtenerFichaProfesional(uid), obtenerSemanaProfesional(uid, semana)]);
    await esperarEstadoSesion(); if (!actual.esVigente() || consulta !== revision) return;
    if (copiar && !documento) { mostrarError("No hay una semana anterior guardada para copiar."); return; }
    const horario = prepararHorarioFormulario(documento || ficha?.schedule);
    horarioActual = horario; rellenarFormularioHorario(horario);
    if (!copiar) semanaCargada = documento;
    publicada.checked = documento?.published === true;
    cargada = true; sincronizarSemana(destino);
    ayuda.className = "text-xs text-blue-800";
    ayuda.textContent = (ficha?.active === false ? "Oculto. " : "En equipo. ") + (documento?.published ? "Semana visible." : documento ? "Semana guardada." : "Sin semana.");
    if (!ficha && actual.usuario.rol === "worker") ayuda.textContent = "Tu ficha profesional se creara al guardar la primera semana.";
    if (copiar) mostrarCorrecto("Semana copiada. Guarda cuando la revises.");
    else { error.classList.add("hidden"); correcto.classList.add("hidden"); }
  } catch (fallo) {
    await esperarEstadoSesion();
    if (actual.esVigente() && consulta === revision) { cargada = false; mostrarError(fallo instanceof Error && fallo.message.includes("mas de dos tramos") ? fallo.message : "No se pudo cargar la semana. Actualiza la pagina."); }
  } finally { if (contexto === actual && consulta === revision) marcarOcupada(false); }
}
async function cargarProfesionalSeleccionado(uid: string): Promise<void> {
  if (!contexto || !uid) return;
  uidObjetivo = contexto.usuario.rol === "worker" ? contexto.usuario.uid : uid;
  selector.value = uidObjetivo;
  const url = new URL(location.href); url.searchParams.set("barberUid", uidObjetivo); history.replaceState({}, "", url);
  await cargarHorarioSemanal(semanaActual);
}
async function guardarHorario(): Promise<void> {
  const actual = contexto;
  if (ocupada || !actual?.esVigente() || (!pendiente && !cargada)) return;
  try {
    if (!pendiente) {
      const horario = leerFormularioHorario(horarioActual);
      pendiente = { tipo: "semana", datos: { ...horario, barberUid: uidObjetivo, weekStart: semanaActual, published: publicada.checked, expectedRevision: semanaCargada?.revision || 0, requestId: crypto.randomUUID() } };
      guardarOperacionAgenda(actual.usuario.uid, "semana", pendiente);
    }
  } catch (fallo) { mostrarError(fallo instanceof Error ? fallo.message : "Formulario invalido."); return; }
  marcarOcupada(true);
  try {
    const respuesta = await ejecutarOperacionAgenda(pendiente);
    await esperarEstadoSesion(); if (!actual.esVigente()) return;
    if (!respuesta.ok) throw new Error("Respuesta no valida.");
    const solicitadaVisible = pendiente.tipo === "semana" && pendiente.datos.published;
    borrarOperacionAgenda(actual.usuario.uid, "semana"); pendiente = null;
    await cargarHorarioSemanal(semanaActual);
    if (actual.esVigente()) {
      const texto = respuesta.visible ? "Semana guardada y ya visible en reservas." : solicitadaVisible ? "Semana guardada. El profesional esta oculto y no aparece en reservas." : "Semana guardada.";
      if (cargada) mostrarCorrecto(texto);
      mostrarAviso(texto, "success");
    }
  } catch (fallo) {
    await esperarEstadoSesion(); if (!actual.esVigente()) return;
    if (!esRespuestaReservaIncierta(fallo)) { borrarOperacionAgenda(actual.usuario.uid, "semana"); pendiente = null; }
    mostrarError(explicarErrorAgenda(fallo));
  } finally { if (contexto === actual) marcarOcupada(false); }
}
enlazarDiasHorario(); marcarOcupada(false);
guardar.addEventListener("click", () => { void guardarHorario(); });
selector.addEventListener("change", () => { if (!ocupada && !pendiente) void cargarProfesionalSeleccionado(selector.value); });
fecha.addEventListener("change", () => { if (!ocupada && !pendiente) void cargarHorarioSemanal(obtenerLunesSemana(fecha.value)); });
for (const [id, dias] of [["week-prev", -7], ["week-next", 7]] as const) document.getElementById(id)!.addEventListener("click", () => { if (!ocupada && !pendiente && semanaActual) void cargarHorarioSemanal(sumarDiasCalendario(semanaActual, dias)); });
document.getElementById("copy-week")!.addEventListener("click", () => { if (!ocupada && !pendiente && semanaActual) void cargarHorarioSemanal(sumarDiasCalendario(semanaActual, -7), true); });
error.setAttribute("role", "status"); correcto.setAttribute("role", "status");
observarAreaProfesional((actual) => {
  contexto = actual;
  void (async () => {
    try {
      const [configuracion, equipo] = await Promise.all([obtenerConfiguracionAgenda(), obtenerProfesionales(true)]);
      await esperarEstadoSesion(); if (!actual.esVigente()) return;
      pendiente = recuperarOperacionAgenda(actual.usuario.uid, "semana");
      if (pendiente?.tipo !== "semana") pendiente = null;
      semanaActual = pendiente?.datos.weekStart || obtenerLunesSemana(formatearFechaNegocio(configuracion.timezone));
      contenedor.classList.toggle("hidden", actual.usuario.rol === "worker");
      selector.replaceChildren();
      const ordenados = [...equipo].sort((primero, segundo) => primero.order - segundo.order || primero.name.localeCompare(segundo.name));
      for (const profesional of ordenados) selector.add(new Option(profesional.name + (profesional.active === false ? " - Inactivo" : ""), profesional.uid));
      const pedido = pendiente?.datos.barberUid || new URLSearchParams(location.search).get("barberUid");
      const destino = actual.usuario.rol === "worker" ? actual.usuario.uid : equipo.find((profesional) => profesional.uid === pedido)?.uid || ordenados[0]?.uid;
      if (!destino) {
        selector.add(new Option("Sin perfiles activos", "")); selector.disabled = true;
        ayuda.textContent = "Todavia no hay nadie visible en el equipo. Revisa Usuarios y roles."; ayuda.className = "text-xs text-red-700";
        return;
      }
      await cargarProfesionalSeleccionado(destino);
      if (pendiente) { mostrarError("Hay un guardado pendiente de comprobar. Se utilizara la misma solicitud."); marcarOcupada(false); }
    } catch { if (actual.esVigente()) mostrarError("No se pudieron cargar los profesionales. Actualiza la pagina."); }
  })();
}, () => {
  const estado = obtenerUsuarioActual();
  if (contexto && (estado.estado === "invitado" || (estado.usuario && (estado.usuario.uid !== contexto.usuario.uid || !esPersonal(estado.usuario.rol))))) borrarOperacionAgenda(contexto.usuario.uid, "semana");
  contexto = null; revision++; pendiente = null; cargada = false; uidObjetivo = ""; semanaCargada = null;
  horarioActual = prepararHorarioFormulario(); rellenarFormularioHorario(horarioActual);
  publicada.checked = false; ayuda.textContent = ""; error.classList.add("hidden"); correcto.classList.add("hidden"); marcarOcupada(false);
});
