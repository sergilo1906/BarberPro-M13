import { observarSesion, registrarUsuario } from "../../datos/sesion";
import { obtenerDestinoInicial } from "../../comun/permisos";
import { explicarErrorAcceso } from "../../comun/errores";
import { bloquearFormulario, comprobarContacto, comprobarFormulario } from "../../comun/formularios";
const formulario = document.querySelector<HTMLFormElement>("#reg-form");
const mensaje = document.getElementById("reg-msg");
let solicitudEnCurso = false;
observarSesion((estado) => {
    if (!formulario || !mensaje || solicitudEnCurso) {
        return;
    }
    bloquearFormulario(formulario, estado.estado === "cargando" || estado.estado === "desactivado");
    if (estado.estado === "autenticado" && estado.usuario) {
        window.location.replace(estado.usuario.correoVerificado ? obtenerDestinoInicial(estado.usuario.rol) : "/verify");
    }
    else if (estado.mensaje) {
        mensaje.textContent = estado.mensaje;
    }
});
formulario?.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    if (!formulario || !mensaje || solicitudEnCurso) {
        return;
    }
    const campos = new FormData(formulario);
    const nombre = String(campos.get("name") || "").trim();
    const telefono = String(campos.get("phone") || "").trim();
    const correo = String(campos.get("email") || "").trim();
    const contrasena = String(campos.get("password") || "");
    const confirmacion = String(campos.get("password2") || "");
    let errorValidacion = comprobarContacto(nombre, telefono) || comprobarFormulario(correo, contrasena);
    if (!errorValidacion && contrasena !== confirmacion) {
        errorValidacion = "Las contrasenas no coinciden.";
    }
    if (errorValidacion) {
        mensaje.textContent = errorValidacion;
        return;
    }
    solicitudEnCurso = true;
    bloquearFormulario(formulario, true);
    mensaje.textContent = "Creando cuenta...";
    try {
        const resultado = await registrarUsuario(correo, contrasena, nombre, telefono);
        if (!resultado.perfilCreado) {
            window.location.assign("/perfil?alta=incompleta");
        }
        else {
            window.location.assign(resultado.correoEnviado ? "/verify?sent=1" : "/verify?sendError=1");
        }
    }
    catch (error) {
        mensaje.textContent = explicarErrorAcceso(error);
        solicitudEnCurso = false;
        bloquearFormulario(formulario, false);
    }
});
