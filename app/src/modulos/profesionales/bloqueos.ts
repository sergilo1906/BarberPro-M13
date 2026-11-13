import { observarAreaProfesional, esPersonal, type ContextoProfesional } from "../../comun/permisos";
import { formatearFechaNegocio } from "../../comun/fechas";
import { cerrarModalActivo, pedirConfirmacion, mostrarAviso } from "../../comun/avisos";
import { explicarErrorAgenda, esRespuestaReservaIncierta } from "../../comun/errores";
import { obtenerUsuarioActual, esperarEstadoSesion } from "../../datos/sesion";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerBloqueosProfesional } from "../../datos/agenda";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { borrarOperacionAgenda, ejecutarOperacionAgenda, guardarOperacionAgenda, recuperarOperacionAgenda } from "../../datos/funciones-remotas";
import { mostrarCamposTipoBloqueo, leerFormularioBloqueo, prepararFechasBloqueo } from "./formulario-bloqueo";
import type { Bloqueo, OperacionAgenda } from "../../modelos/agenda";
const formulario = document.querySelector<HTMLFormElement>("#block-form")!;
const selector = document.querySelector<HTMLSelectElement>("#block-barber")!;
const botonGuardar = formulario.querySelector<HTMLButtonElement>('button[type="submit"]')!;
const mensaje = document.getElementById("blocks-msg")!;
const lista = document.getElementById("blocks-list")!;
let contexto: ContextoProfesional | null = null;
let nombres = new Map<string, string>();
let zona = "Europe/Madrid";
let revision = 0;
let ocupada = false;
let pendiente: OperacionAgenda | null = null;
function uidObjetivo(): string {
    return contexto?.usuario.rol === "worker" ? contexto.usuario.uid : selector.value;
}
function mostrarMensaje(texto: string, esError = false): void {
    mensaje.textContent = texto;
    mensaje.className = esError ? "text-sm text-red-700" : "text-sm text-gray-600";
}
function marcarOcupada(valor: boolean): void {
    ocupada = valor;
    for (const campo of formulario.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>("input, select, button")) {
        campo.disabled = valor || !!pendiente || !contexto;
    }
    selector.disabled = valor || !!pendiente || !contexto || contexto.usuario.rol === "worker";
    botonGuardar.disabled = valor || !contexto;
    if (valor) {
        botonGuardar.textContent = "Guardando...";
    } else if (pendiente) {
        botonGuardar.textContent = "Comprobar operacion";
    } else {
        botonGuardar.textContent = "Guardar bloqueo";
    }
    for (const boton of lista.querySelectorAll<HTMLButtonElement>("button")) {
        boton.disabled = valor || !!pendiente;
    }
}
function describirBloqueo(bloqueo: Bloqueo): string {
    return bloqueo.type === "vacation" ? bloqueo.startDate + " -> " + bloqueo.endDate + " (vacaciones)" : bloqueo.dateStr + " " + bloqueo.start + "-" + bloqueo.end + " (" + (bloqueo.type || "excepcion") + ")";
}
function mostrarBloqueos(bloqueos: Bloqueo[]): void {
    lista.replaceChildren();
    if (!bloqueos.length) {
        lista.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1"><p class="font-medium text-slate-900">Sin bloqueos registrados.</p><p>Puedes crear una pausa, una excepcion o unas vacaciones desde el formulario superior.</p></div>';
        return;
    }
    const listado = document.createElement("ul");
    listado.className = "space-y-2";
    for (const bloqueo of bloqueos) {
        const fila = document.createElement("li");
        fila.className = "border rounded p-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between";
        fila.innerHTML = '<div><div data-bloqueo="descripcion" class="font-medium"></div><div data-bloqueo="profesional" class="text-sm text-gray-600"></div><div data-bloqueo="motivo" class="text-sm text-gray-600"></div></div>';
        fila.querySelector('[data-bloqueo="descripcion"]')!.textContent = describirBloqueo(bloqueo);
        fila.querySelector('[data-bloqueo="profesional"]')!.textContent = "Profesional: " + (nombres.get(bloqueo.barberUid) || "Profesional");
        fila.querySelector('[data-bloqueo="motivo"]')!.textContent = bloqueo.reason || "Sin motivo";
        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.dataset.id = bloqueo.id;
        eliminar.className = "delete-block rounded border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-800";
        eliminar.textContent = "Eliminar";
        eliminar.addEventListener("click", () => {
            void eliminarBloqueo(bloqueo);
        });
        fila.append(eliminar);
        listado.append(fila);
    }
    lista.append(listado);
    marcarOcupada(ocupada);
}
async function cargarBloqueos(): Promise<void> {
    const actual = contexto;
    const consulta = ++revision;
    const uid = uidObjetivo();
    if (!actual?.esVigente()) {
        return;
    }
    if (!uid) {
        lista.innerHTML = '<p class="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">Selecciona un profesional para ver sus pausas y bloqueos.</p>';
        return;
    }
    lista.textContent = "Cargando bloqueos...";
    try {
        const documentos = await obtenerBloqueosProfesional(uid);
        await esperarEstadoSesion();
        if (!actual.esVigente() || consulta !== revision) {
            return;
        }
        const hoy = formatearFechaNegocio(zona);
        const bloqueos: Bloqueo[] = [];
        for (const bloqueo of documentos) {
            if ((bloqueo.type === "vacation" ? bloqueo.endDate || "" : bloqueo.dateStr || "") >= hoy) {
                bloqueos.push(bloqueo);
            }
        }
        bloqueos.sort((primero, segundo) => ((primero.startDate || primero.dateStr || "") + (primero.start || "00:00")).localeCompare((segundo.startDate || segundo.dateStr || "") + (segundo.start || "00:00")));
        mostrarBloqueos(bloqueos);
    }
    catch {
        if (actual.esVigente() && consulta === revision) {
            lista.textContent = "No se pudieron cargar los bloqueos. Vuelve a seleccionar el profesional o actualiza la pagina.";
        }
    }
}
async function enviarOperacion(): Promise<void> {
    const actual = contexto;
    if (ocupada || !actual?.esVigente() || !pendiente) {
        return;
    }
    marcarOcupada(true);
    const eraEliminar = pendiente.tipo === "eliminar-bloqueo";
    mostrarMensaje(eraEliminar ? "Eliminando bloqueo..." : "Guardando bloqueo...");
    try {
        const respuesta = await ejecutarOperacionAgenda(pendiente);
        await esperarEstadoSesion();
        if (!actual.esVigente()) {
            return;
        }
        if (!respuesta.ok) {
            throw new Error("Respuesta no valida.");
        }
        borrarOperacionAgenda(actual.usuario.uid, "bloqueos");
        pendiente = null;
        const texto = eraEliminar ? "Bloqueo eliminado." : "Bloqueo guardado.";
        mostrarMensaje(texto);
        mostrarAviso(eraEliminar ? texto : "Bloqueo guardado correctamente.", "success");
        await cargarBloqueos();
    }
    catch (fallo) {
        await esperarEstadoSesion();
        if (!actual.esVigente()) {
            return;
        }
        if (!esRespuestaReservaIncierta(fallo)) {
            borrarOperacionAgenda(actual.usuario.uid, "bloqueos");
            pendiente = null;
        }
        mostrarMensaje(explicarErrorAgenda(fallo), true);
    }
    finally {
        if (contexto === actual) {
            marcarOcupada(false);
        }
    }
}
async function eliminarBloqueo(bloqueo: Bloqueo): Promise<void> {
    const actual = contexto;
    if (ocupada || pendiente || !actual?.esVigente()) {
        return;
    }
    marcarOcupada(true);
    const confirmado = await pedirConfirmacion({
        title: "Eliminar bloqueo", message: "Esta accion quitara el bloqueo seleccionado.", confirmText: "Eliminar", cancelText: "Mantener", danger: true
    });
    await esperarEstadoSesion();
    if (!actual.esVigente()) {
        return;
    }
    marcarOcupada(false);
    if (!confirmado) {
        return;
    }
    pendiente = { tipo: "eliminar-bloqueo", datos: { blockId: bloqueo.id, requestId: crypto.randomUUID() } };
    guardarOperacionAgenda(actual.usuario.uid, "bloqueos", pendiente);
    await enviarOperacion();
}
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    if (ocupada || !contexto?.esVigente()) {
        return;
    }
    if (!pendiente) {
        try {
            const uid = uidObjetivo();
            if (!uid) {
                throw new Error("Selecciona un profesional.");
            }
            pendiente = { tipo: "crear-bloqueo", datos: { ...leerFormularioBloqueo(uid), requestId: crypto.randomUUID() } };
            guardarOperacionAgenda(contexto.usuario.uid, "bloqueos", pendiente);
        }
        catch (fallo) {
            mostrarMensaje(fallo instanceof Error ? fallo.message : "Formulario invalido.", true);
            return;
        }
    }
    void enviarOperacion();
});
document.getElementById("block-type")!.addEventListener("change", mostrarCamposTipoBloqueo);
selector.addEventListener("change", () => {
    if (ocupada || pendiente) {
        return;
    }
    const url = new URL(location.href);
    if (selector.value) {
        url.searchParams.set("barberUid", selector.value);
    }
    else {
        url.searchParams.delete("barberUid");
    }
    history.replaceState({}, "", url);
    void cargarBloqueos();
});
mensaje.setAttribute("role", "status");
marcarOcupada(false);
observarAreaProfesional((actual) => {
    contexto = actual;
    void (async () => {
        try {
            const [configuracion, profesionales] = await Promise.all([obtenerConfiguracionAgenda(), obtenerProfesionales()]);
            await esperarEstadoSesion();
            if (!actual.esVigente()) {
                return;
            }
            zona = configuracion.timezone;
            prepararFechasBloqueo(zona);
            nombres = new Map();
            for (const profesional of profesionales) {
                nombres.set(profesional.uid, profesional.name);
            }
            selector.replaceChildren();
            if (actual.usuario.rol === "worker") {
                selector.add(new Option(nombres.get(actual.usuario.uid) || "Profesional", actual.usuario.uid));
            }
            else {
                selector.add(new Option("Selecciona un profesional", ""));
                for (const profesional of profesionales) {
                    selector.add(new Option(profesional.name, profesional.uid));
                }
            }
            pendiente = recuperarOperacionAgenda(actual.usuario.uid, "bloqueos");
            if (pendiente?.tipo === "semana") {
                pendiente = null;
            }
            const pedido = pendiente?.tipo === "crear-bloqueo" ? pendiente.datos.barberUid : new URLSearchParams(location.search).get("barberUid");
            if (actual.usuario.rol !== "worker" && pedido && profesionales.some((profesional) => profesional.uid === pedido)) {
                selector.value = pedido;
            }
            await cargarBloqueos();
            if (pendiente) {
                mostrarMensaje("Hay una operacion pendiente de comprobar. Se utilizara la misma solicitud.", true);
            }
            marcarOcupada(false);
        }
        catch {
            if (actual.esVigente()) {
                mostrarMensaje("No se pudieron cargar los profesionales. Actualiza la pagina.", true);
            }
        }
    })();
}, () => {
    const estado = obtenerUsuarioActual();
    if (contexto && (estado.estado === "invitado" || (estado.usuario && (estado.usuario.uid !== contexto.usuario.uid || !esPersonal(estado.usuario.rol))))) {
        borrarOperacionAgenda(contexto.usuario.uid, "bloqueos");
    }
    revision++;
    contexto = null;
    pendiente = null;
    nombres.clear();
    formulario.reset();
    selector.replaceChildren();
    lista.replaceChildren();
    mostrarMensaje("");
    cerrarModalActivo();
    document.getElementById("toast-root")?.remove();
    marcarOcupada(false);
});
