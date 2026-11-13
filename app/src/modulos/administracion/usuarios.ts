import { observarAreaAutorizada, obtenerEtiquetaRol, type ContextoProfesional } from "../../comun/permisos";
import { explicarErrorAdministracion } from "../../comun/errores";
import { formatearFechaNegocio, obtenerLunesSemana } from "../../comun/fechas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { buscarUsuariosPorCorreo } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { cambiarRolUsuario } from "../../datos/funciones-remotas";
import { crearTarjetaUsuario, obtenerEstadoOperativo } from "./tarjeta-usuario";
const formulario = document.querySelector<HTMLFormElement>("#search-form")!;
const correo = document.querySelector<HTMLInputElement>("#email")!;
const lista = document.getElementById("results")!;
const mensaje = document.getElementById("msg")!;
let contexto: ContextoProfesional | null = null;
let revision = 0;
let guardando = false;
function mostrarMensaje(texto: string, error = false): void {
    mensaje.textContent = texto;
    mensaje.className = error ? "text-sm text-red-700" : "text-sm text-gray-600";
}
async function buscarUsuarios(): Promise<void> {
    const actual = contexto;
    const consulta = ++revision;
    if (!actual?.esVigente() || guardando) {
        return;
    }
    const email = correo.value.trim();
    if (!email) {
        mostrarMensaje("Introduce un email para buscar.", true);
        return;
    }
    lista.textContent = "Buscando usuario...";
    try {
        const [usuarios, configuracion] = await Promise.all([buscarUsuariosPorCorreo(email), obtenerConfiguracionAgenda()]);
        const semana = obtenerLunesSemana(formatearFechaNegocio(configuracion.timezone));
        const tarjetas: HTMLElement[] = [];
        for (const usuario of usuarios) {
            const tarjeta = crearTarjetaUsuario(usuario, await obtenerEstadoOperativo(usuario.uid, usuario.role, semana));
            tarjeta.querySelector("button")!.addEventListener("click", async () => {
                if (guardando || !actual.esVigente()) {
                    return;
                }
                guardando = true;
                const selector = tarjeta.querySelector<HTMLSelectElement>("select")!;
                const boton = tarjeta.querySelector<HTMLButtonElement>("button")!;
                selector.disabled = true;
                boton.disabled = true;
                mostrarMensaje("Guardando cambios...");
                try {
                    await cambiarRolUsuario(usuario.uid, selector.value);
                    await esperarEstadoSesion();
                    if (!actual.esVigente()) {
                        return;
                    }
                    mostrarMensaje("Acceso actualizado para " + (usuario.name || "Usuario") + " (" + usuario.email + "): " + obtenerEtiquetaRol(selector.value as typeof usuario.role) + ".");
                    guardando = false;
                    await buscarUsuarios();
                }
                catch (error) {
                    await esperarEstadoSesion();
                    if (actual.esVigente()) {
                        mostrarMensaje(explicarErrorAdministracion(error), true);
                    }
                }
                finally {
                    if (contexto === actual) {
                        guardando = false;
                    }
                    if (actual.esVigente()) {
                        selector.disabled = false;
                        boton.disabled = false;
                    }
                }
            });
            tarjetas.push(tarjeta);
        }
        await esperarEstadoSesion();
        if (!actual.esVigente() || consulta !== revision) {
            return;
        }
        lista.replaceChildren(...tarjetas);
        if (!tarjetas.length) {
            lista.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-1"><p class="font-medium text-slate-900">Sin resultados para ese email.</p><p>Revisa la direccion y vuelve a intentarlo.</p></div>';
        }
    }
    catch {
        await esperarEstadoSesion();
        if (actual.esVigente() && consulta === revision) {
            lista.textContent = "Error buscando usuarios.";
        }
    }
}
formulario.addEventListener("submit", (evento) => {
    evento.preventDefault();
    void buscarUsuarios();
});
observarAreaAutorizada(["admin"], (actual) => {
    contexto = actual;
}, () => {
    contexto = null;
    revision++;
    guardando = false;
    lista.replaceChildren();
    correo.value = "";
    mostrarMensaje("");
});
