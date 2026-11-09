import { cerrarSesion, observarSesion } from "../../datos/sesion";
import { comprobarPermiso, obtenerDestinoInicial, protegerRutaActual } from "../../comun/permisos";
import type { EstadoSesion } from "../../modelos/cuentas";

function mostrarElemento(selector: string, mostrar: boolean): void {
  document.querySelector(selector)?.classList.toggle("hidden", !mostrar);
}

function actualizarNavegacion(estado: EstadoSesion): void {
  const autenticado = estado.estado === "autenticado";
  const usuario = estado.usuario;
  const invitado = estado.estado === "invitado" || estado.estado === "desactivado" || estado.estado === "error";
  mostrarElemento("#btn-login", invitado);
  mostrarElemento("#btn-register", invitado);
  mostrarElemento("#btn-profile", autenticado);
  mostrarElemento("#btn-logout", autenticado || estado.estado === "error");
  mostrarElemento("#user-avatar", autenticado);
  mostrarElemento("#link-citas", autenticado && usuario?.correoVerificado === true);
  const avatar = document.getElementById("user-avatar");
  if (avatar) avatar.textContent = autenticado ? (estado.perfil?.name || usuario?.nombre || usuario?.correo || "?").trim().slice(0, 1).toUpperCase() : "";
  const enlaces = document.querySelectorAll<HTMLElement>("[data-roles]");
  for (let indice = 0; indice < enlaces.length; indice++) {
    const roles = enlaces[indice].dataset.roles?.split(" ") || [];
    const permitido = autenticado && usuario?.correoVerificado === true && roles.includes(usuario.rol);
    enlaces[indice].classList.toggle("hidden", !permitido);
  }
  const panel = document.querySelector<HTMLAnchorElement>("#link-panel");
  if (panel && usuario) panel.href = obtenerDestinoInicial(usuario.rol);
  const tarjeta = document.querySelector<HTMLAnchorElement>("#admin-card");
  if (tarjeta) {
    const permitido = comprobarPermiso(estado, ["worker", "manager", "admin"]);
    tarjeta.classList.toggle("hidden", !permitido);
    tarjeta.classList.toggle("flex", permitido);
    if (usuario) tarjeta.href = obtenerDestinoInicial(usuario.rol);
  }
}

const botonSalir = document.querySelector<HTMLButtonElement>("#btn-logout");
let cierreEnCurso = false;
if (botonSalir) {
  botonSalir.disabled = false;
  botonSalir.addEventListener("click", async () => {
    if (cierreEnCurso) return;
    cierreEnCurso = true;
    botonSalir.disabled = true;
    botonSalir.textContent = "Saliendo...";
    try {
      await cerrarSesion();
      window.location.assign("/login");
    } catch {
      botonSalir.textContent = "Reintentar salida";
    } finally {
      cierreEnCurso = false;
      botonSalir.disabled = false;
    }
  });
}

observarSesion(actualizarNavegacion);
protegerRutaActual();
if (new URLSearchParams(location.search).get("acceso") === "denegado") {
  const aviso = document.getElementById("acceso-msg");
  if (aviso) {
    aviso.textContent = "No tienes permiso para acceder a esta seccion.";
    aviso.hidden = false;
  }
}
