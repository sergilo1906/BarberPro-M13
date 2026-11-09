import { esperarEstadoSesion, iniciarSesion, observarSesion } from "../../datos/sesion";
import { obtenerDestinoInicial } from "../../comun/permisos";
import { explicarErrorAcceso } from "../../comun/errores";
import { bloquearFormulario, comprobarFormulario } from "../../comun/formularios";

const formulario = document.querySelector<HTMLFormElement>("#login-form");
const mensaje = document.getElementById("login-msg");
let solicitudEnCurso = false;

observarSesion((estado) => {
  if (!formulario || !mensaje || solicitudEnCurso) return;
  bloquearFormulario(formulario, estado.estado === "cargando" || estado.estado === "desactivado");
  if (estado.estado === "autenticado" && estado.usuario) {
    window.location.replace(estado.usuario.correoVerificado ? obtenerDestinoInicial(estado.usuario.rol) : "/verify");
  } else if (estado.mensaje) {
    mensaje.textContent = estado.mensaje;
  } else if (new URLSearchParams(location.search).get("verified") === "1") {
    mensaje.textContent = "Email verificado. Ya puedes iniciar sesion.";
  }
});

formulario?.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if (!formulario || !mensaje || solicitudEnCurso) return;
  const campos = new FormData(formulario);
  const correo = String(campos.get("email") || "").trim();
  const contrasena = String(campos.get("password") || "");
  const errorValidacion = comprobarFormulario(correo, contrasena);
  if (errorValidacion) { mensaje.textContent = errorValidacion; return; }
  solicitudEnCurso = true;
  bloquearFormulario(formulario, true);
  mensaje.textContent = "Entrando...";
  try {
    await iniciarSesion(correo, contrasena);
    const estado = await esperarEstadoSesion();
    if (!estado.usuario) throw new Error("No se pudo comprobar la sesion.");
    window.location.replace(estado.usuario.correoVerificado ? obtenerDestinoInicial(estado.usuario.rol) : "/verify");
  } catch (error) {
    mensaje.textContent = explicarErrorAcceso(error);
    solicitudEnCurso = false;
    bloquearFormulario(formulario, false);
  }
});
