import { cerrarSesion, enviarVerificacion, observarSesion, obtenerUsuarioActual, esperarEstadoSesion } from "../../datos/sesion";
import { crearPerfilUsuario, guardarPerfilUsuario } from "../../datos/personas";
import { obtenerEtiquetaRol } from "../../comun/permisos";
import { comprobarContacto } from "../../comun/formularios";
import { explicarErrorAcceso, explicarErrorVerificacion } from "../../comun/errores";
import { mostrarAviso } from "../../comun/avisos";
const correo = document.getElementById("perfil-email");
const verificacion = document.getElementById("perfil-verif");
const rol = document.getElementById("perfil-role");
const nombre = document.querySelector<HTMLInputElement>("#perfil-name");
const telefono = document.querySelector<HTMLInputElement>("#perfil-phone");
const guardar = document.querySelector<HTMLButtonElement>("#perfil-save");
const reenviar = document.querySelector<HTMLButtonElement>("#perfil-send-verify");
const salir = document.querySelector<HTMLButtonElement>("#perfil-logout");
const mensaje = document.getElementById("perfil-msg");
let guardando = false;
let cerrando = false;
let perfilEditado = false;
let ultimoUid = "";
let revisionIdentidad = 0;
function mismaIdentidad(uid: string, revision: number): boolean {
    return revision === revisionIdentidad && obtenerUsuarioActual().usuario?.uid === uid;
}
function mostrarMensaje(texto: string): void {
    if (mensaje) {
        mensaje.textContent = texto;
    }
}
function mostrarEstadoVerificacion(verificado: boolean): void {
    if (!verificacion) {
        return;
    }
    verificacion.textContent = verificado ? "Verificado" : "Pendiente";
    verificacion.className = "inline-block rounded px-2 py-0.5 text-xs font-medium "
        + (verificado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800");
    reenviar?.classList.toggle("hidden", verificado);
}
nombre?.addEventListener("input", () => {
    perfilEditado = true;
});
telefono?.addEventListener("input", () => {
    perfilEditado = true;
});
observarSesion((estado) => {
    if (estado.estado === "cargando") {
        return;
    }
    const usuario = estado.usuario;
    if (estado.estado !== "autenticado" || !usuario) {
        revisionIdentidad++;
        if (correo) {
            correo.textContent = "";
        }
        if (rol) {
            rol.textContent = "";
        }
        if (nombre) {
            nombre.value = "";
        }
        if (telefono) {
            telefono.value = "";
        }
        ultimoUid = "";
        perfilEditado = false;
        guardando = false;
        if (guardar) {
            guardar.disabled = false;
        }
        if (reenviar) {
            reenviar.disabled = false;
        }
        mostrarMensaje("");
        document.getElementById("toast-root")?.remove();
        return;
    }
    if (ultimoUid !== usuario.uid) {
        revisionIdentidad++;
        mostrarMensaje("");
        perfilEditado = false;
        guardando = false;
        if (guardar) {
            guardar.disabled = false;
        }
        if (reenviar) {
            reenviar.disabled = false;
        }
    }
    if (correo) {
        correo.textContent = usuario.correo;
    }
    if (rol) {
        rol.textContent = obtenerEtiquetaRol(usuario.rol);
    }
    mostrarEstadoVerificacion(usuario.correoVerificado);
    if (!perfilEditado || ultimoUid !== usuario.uid) {
        if (nombre) {
            nombre.value = estado.perfil?.name || usuario.nombre;
        }
        if (telefono) {
            telefono.value = estado.perfil?.phone || "";
        }
    }
    ultimoUid = usuario.uid;
    if (estado.errorPerfil) {
        mostrarMensaje("No se pudieron cargar tus datos. Revisa la conexion antes de guardar.");
    }
    else if (!estado.perfil) {
        mostrarMensaje("Completa tus datos y pulsa Guardar cambios para terminar la configuracion inicial.");
    }
});
guardar?.addEventListener("click", async () => {
    if (guardando || !nombre || !telefono) {
        return;
    }
    const estado = obtenerUsuarioActual();
    const usuario = estado.usuario;
    if (estado.estado !== "autenticado" || !usuario) {
        return;
    }
    const errorValidacion = comprobarContacto(nombre.value, telefono.value);
    if (errorValidacion) {
        mostrarMensaje(errorValidacion);
        return;
    }
    guardando = true;
    guardar.disabled = true;
    const revision = revisionIdentidad;
    const nuevoNombre = nombre.value;
    const nuevoTelefono = telefono.value;
    mostrarMensaje("Guardando cambios...");
    try {
        await crearPerfilUsuario(usuario.uid, usuario.correo, nuevoNombre, nuevoTelefono);
        await esperarEstadoSesion();
        if (!mismaIdentidad(usuario.uid, revision)) {
            return;
        }
        await guardarPerfilUsuario(usuario.uid, nuevoNombre, nuevoTelefono);
        await esperarEstadoSesion();
        if (mismaIdentidad(usuario.uid, revision)) {
            perfilEditado = nombre.value !== nuevoNombre || telefono.value !== nuevoTelefono;
            mostrarMensaje("Cambios guardados.");
            mostrarAviso("Perfil guardado.", "success");
        }
    }
    catch (error) {
        if (mismaIdentidad(usuario.uid, revision)) {
            mostrarMensaje(explicarErrorAcceso(error));
        }
    }
    finally {
        if (revision === revisionIdentidad) {
            guardando = false;
            guardar.disabled = false;
        }
    }
});
reenviar?.addEventListener("click", async () => {
    if (reenviar.disabled) {
        return;
    }
    const uid = obtenerUsuarioActual().usuario?.uid;
    if (!uid) {
        return;
    }
    const revision = revisionIdentidad;
    reenviar.disabled = true;
    mostrarMensaje("Enviando correo de verificacion...");
    try {
        await enviarVerificacion();
        await esperarEstadoSesion();
        if (mismaIdentidad(uid, revision)) {
            mostrarMensaje("Correo enviado. Revisa tambien la carpeta de spam.");
        }
    }
    catch (error) {
        if (mismaIdentidad(uid, revision)) {
            mostrarMensaje(explicarErrorVerificacion(error));
        }
    }
    finally {
        if (revision === revisionIdentidad) {
            reenviar.disabled = false;
        }
    }
});
salir?.addEventListener("click", async () => {
    if (cerrando) {
        return;
    }
    cerrando = true;
    salir.disabled = true;
    try {
        await cerrarSesion();
        window.location.assign("/");
    }
    catch {
        mostrarMensaje("No se pudo cerrar sesion. Vuelve a intentarlo.");
    }
    finally {
        cerrando = false;
        salir.disabled = false;
    }
});
