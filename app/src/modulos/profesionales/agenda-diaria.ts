import { observarAreaProfesional, type ContextoProfesional } from "../../comun/permisos";
import { cerrarModalActivo, pedirConfirmacion, mostrarAviso } from "../../comun/avisos";
import { formatearFechaNegocio, esFechaCalendarioValida } from "../../comun/fechas";
import { obtenerEtiquetaEstadoAgenda, obtenerEstadosSiguientes } from "../../comun/estados-cita";
import { explicarErrorAgenda } from "../../comun/errores";
import { obtenerCitasDia, obtenerCitasProfesional } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { esperarEstadoSesion } from "../../datos/sesion";
import { actualizarEstadoReserva } from "../../datos/funciones-remotas";
import { mostrarTarjetasAgenda } from "./tarjetas-citas";
import type { Cita, EstadoCita } from "../../modelos/agenda";
const fecha = document.querySelector<HTMLInputElement>("#agenda-date")!;
const filtro = document.querySelector<HTMLSelectElement>("#agenda-status")!;
const lista = document.getElementById("agenda-list")!;
const mensaje = document.getElementById("agenda-msg")!;
let contexto: ContextoProfesional | null = null;
let citasCargadas: Cita[] = [];
let nombres = new Map<string, string>();
let revision = 0;
let ocupada = false;
function marcarOcupada(valor: boolean): void {
    ocupada = valor;
    fecha.disabled = valor;
    filtro.disabled = valor;
    for (const boton of lista.querySelectorAll<HTMLButtonElement>("button")) {
        boton.disabled = valor;
    }
}
function mostrarAgenda(): void {
    const citas: Cita[] = [];
    for (const cita of citasCargadas) {
        if (filtro.value === "all" || (cita.status || "pending") === filtro.value) {
            citas.push(cita);
        }
    }
    mostrarTarjetasAgenda(lista, citas, nombres, (cita, estado) => {
        void cambiarEstadoCita(cita, estado);
    });
    marcarOcupada(ocupada);
}
async function cargarAgendaDia(): Promise<boolean> {
    const actual = contexto;
    const consulta = ++revision;
    if (!actual?.esVigente()) {
        return false;
    }
    lista.replaceChildren();
    citasCargadas = [];
    if (!esFechaCalendarioValida(fecha.value)) {
        mensaje.textContent = "Selecciona una fecha valida.";
        return false;
    }
    mensaje.textContent = "Cargando agenda...";
    try {
        const citas = actual.usuario.rol === "worker" ? await obtenerCitasProfesional(actual.usuario.uid, fecha.value) : await obtenerCitasDia(fecha.value);
        await esperarEstadoSesion();
        if (!actual.esVigente() || consulta !== revision) {
            return false;
        }
        citasCargadas = citas;
        mostrarAgenda();
        mensaje.textContent = "";
        return true;
    }
    catch {
        if (actual.esVigente() && consulta === revision) {
            mensaje.textContent = "No se pudo cargar agenda. Comprueba la conexion y vuelve a seleccionar la fecha.";
        }
        return false;
    }
}
async function cambiarEstadoCita(cita: Cita, siguiente: EstadoCita): Promise<void> {
    const actual = contexto;
    if (ocupada || !actual?.esVigente() || !obtenerEstadosSiguientes(cita.status || "pending").includes(siguiente)) {
        return;
    }
    marcarOcupada(true);
    try {
        if (siguiente !== "confirmed") {
            const confirmado = await pedirConfirmacion({
                title: "Confirmar cambio de estado", message: 'La cita pasara a "' + obtenerEtiquetaEstadoAgenda(siguiente) + '".', confirmText: "Guardar cambio", cancelText: "Volver", danger: siguiente === "cancelled" || siguiente === "no_show"
            });
            await esperarEstadoSesion();
            if (!confirmado || !actual.esVigente()) {
                return;
            }
        }
        mensaje.textContent = "Actualizando estado...";
        const respuesta = await actualizarEstadoReserva(cita.id, siguiente);
        await esperarEstadoSesion();
        if (!actual.esVigente()) {
            return;
        }
        if (!respuesta.ok) {
            throw new Error("Respuesta no valida.");
        }
        if (await cargarAgendaDia()) {
            mensaje.textContent = "Estado actualizado.";
        }
        if (actual.esVigente()) {
            mostrarAviso("Estado actualizado a " + obtenerEtiquetaEstadoAgenda(siguiente) + ".", "success");
        }
    }
    catch (error) {
        await esperarEstadoSesion();
        if (actual.esVigente()) {
            mensaje.textContent = explicarErrorAgenda(error) + " Vuelve a seleccionar la fecha para comprobar el estado.";
        }
    }
    finally {
        if (contexto === actual) {
            marcarOcupada(false);
        }
    }
}
fecha.addEventListener("change", () => {
    if (!ocupada) {
        void cargarAgendaDia();
    }
});
filtro.addEventListener("change", mostrarAgenda);
mensaje.setAttribute("role", "status");
observarAreaProfesional((actual) => {
    contexto = actual;
    marcarOcupada(true);
    void (async () => {
        try {
            const [configuracion, profesionales] = await Promise.all([obtenerConfiguracionAgenda(), obtenerProfesionales()]);
            await esperarEstadoSesion();
            if (!actual.esVigente()) {
                return;
            }
            nombres = new Map();
            for (const profesional of profesionales) {
                nombres.set(profesional.uid, profesional.name);
            }
            fecha.value = formatearFechaNegocio(configuracion.timezone);
            await cargarAgendaDia();
        }
        catch {
            if (actual.esVigente()) {
                mensaje.textContent = "No se pudo cargar la agenda. Actualiza la pagina.";
            }
        }
        finally {
            if (contexto === actual) {
                marcarOcupada(false);
            }
        }
    })();
}, () => {
    revision++;
    contexto = null;
    citasCargadas = [];
    nombres.clear();
    lista.replaceChildren();
    mensaje.textContent = "";
    cerrarModalActivo();
    document.getElementById("toast-root")?.remove();
    marcarOcupada(false);
});
