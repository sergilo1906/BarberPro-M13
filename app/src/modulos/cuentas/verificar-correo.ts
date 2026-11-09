import { actualizarUsuarioSesion, aplicarVerificacion, esperarEstadoSesion, obtenerUsuarioActual } from "../../datos/sesion";
import { obtenerDestinoInicial } from "../../comun/permisos";

const mensaje = document.getElementById("verify-msg");

function leerParametroUrl(nombre: string): string {
  return new URLSearchParams(location.search).get(nombre) || "";
}

function irAlInicioDelRol(): void {
  const usuario = obtenerUsuarioActual().usuario;
  window.location.replace(usuario ? obtenerDestinoInicial(usuario.rol) : "/login?verified=1");
}

async function procesarVerificacion(): Promise<void> {
  if (!mensaje) return;
  const estado = await esperarEstadoSesion();
  if (estado.estado === "desactivado" || estado.estado === "error") {
    mensaje.textContent = estado.mensaje;
    return;
  }
  const codigo = leerParametroUrl("oobCode");
  if (leerParametroUrl("mode") === "verifyEmail" && codigo) {
    mensaje.textContent = "Verificando...";
    try {
      await aplicarVerificacion(codigo);
      await esperarEstadoSesion();
      mensaje.textContent = "Email verificado. Redirigiendo...";
      // Los códigos se consumen una sola vez; nunca se confía en continueUrl recibido.
      window.history.replaceState(null, "", "/verify");
      irAlInicioDelRol();
    } catch {
      mensaje.textContent = "Enlace invalido o caducado. Vuelve a tu perfil y reenvia la verificacion.";
    }
    return;
  }
  if (estado.usuario) {
    try { await actualizarUsuarioSesion(); } catch { mensaje.textContent = "No se pudo comprobar el email. Vuelve a intentarlo."; return; }
    await esperarEstadoSesion();
    if (obtenerUsuarioActual().usuario?.correoVerificado) { irAlInicioDelRol(); return; }
  }
  if (leerParametroUrl("sendError")) {
    mensaje.textContent = "La cuenta se creo, pero el correo no pudo enviarse. Ve a tu perfil y pulsa en reenviar verificacion.";
  } else if (leerParametroUrl("sent")) {
    mensaje.textContent = "Te hemos enviado un email de verificacion. Abrelo y pulsa en el enlace.";
  } else {
    mensaje.textContent = "Abre el enlace del correo de verificacion para completar el acceso.";
  }
}

void procesarVerificacion();
