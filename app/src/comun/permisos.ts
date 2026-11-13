import { esperarEstadoSesion, observarSesion, obtenerUsuarioActual } from "../datos/sesion";
import type { EstadoSesion, Rol, UsuarioSesion } from "../modelos/cuentas";
export const PERMISOS_RUTA: Record<string, Rol[]> = {
  "/perfil": ["client", "admin"], "/reservar": ["client", "admin"], "/mis-citas": ["client", "admin"],
  "/admin": ["admin"], "/agenda": ["admin"], "/servicios": ["admin"], "/horarios": ["admin"],
};
export interface ContextoAutorizado {
    usuario: UsuarioSesion;
    esVigente: () => boolean;
}
// Un contexto por pantalla. No se reinicia un formulario editado por una renovación
// transitoria del token; un cambio de identidad/rol o un error sí invalida sus respuestas.
export function observarAreaAutorizada(roles: readonly Rol[], cargar: (contexto: ContextoAutorizado) => void, limpiar: () => void): void {
    let claveAnterior = "";
    let revision = 0;
    observarSesion((estado) => {
        if (estado.estado === "cargando") {
            return;
        }
        const usuario = estado.usuario;
        const clave = comprobarPermiso(estado, roles) && usuario ? usuario.uid + ":" + usuario.rol + ":" + usuario.versionRol : "";
        if (clave === claveAnterior) {
            return;
        }
        revision++;
        claveAnterior = clave;
        limpiar();
        if (!clave || !usuario) {
            return;
        }
        const actual = revision;
        cargar({ usuario, esVigente: () => actual === revision && comprobarPermiso(obtenerUsuarioActual(), roles)
                && obtenerUsuarioActual().usuario?.uid === usuario.uid && obtenerUsuarioActual().usuario?.rol === usuario.rol });
    });
}
export function obtenerEtiquetaRol(rol: Rol): string { return rol === "admin" ? "Administrador" : "Cliente"; }
export function obtenerDestinoInicial(rol: Rol): string { return rol === "admin" ? "/admin" : "/reservar"; }
export function comprobarPermiso(estado: EstadoSesion, roles: readonly Rol[], correoObligatorio = true): boolean {
    if (estado.estado !== "autenticado" || !estado.usuario) {
        return false;
    }
    if (correoObligatorio && !estado.usuario.correoVerificado) {
        return false;
    }
    return roles.includes(estado.usuario.rol);
}
export function obtenerRolSesion(): Rol | null {
    return obtenerUsuarioActual().usuario?.rol || null;
}
export async function exigirRol(roles: Rol[]): Promise<Rol | null> {
    const estado = await esperarEstadoSesion();
    if (comprobarPermiso(estado, roles)) {
        return estado.usuario!.rol;
    }
    return null;
}
export function mostrarPaginaAutorizada(): void {
    document.documentElement.removeAttribute("data-auth-pending");
}
export function protegerRutaActual(): void {
    const ruta = window.location.pathname.replace(/\/+$/, "") || "/";
    const roles = PERMISOS_RUTA[ruta];
    if (!roles) {
        return;
    }
    observarSesion((estado) => {
        document.documentElement.setAttribute("data-auth-pending", "");
        const aviso = document.getElementById("acceso-msg");
        if (aviso) {
            aviso.hidden = true;
        }
        if (estado.estado === "cargando") {
            return;
        }
        if (estado.estado === "invitado" || estado.estado === "desactivado") {
            window.location.replace("/login");
            return;
        }
        if (estado.estado === "error") {
            if (aviso) {
                aviso.textContent = estado.mensaje;
                aviso.hidden = false;
            }
            return;
        }
        if (ruta !== "/perfil" && !estado.usuario?.correoVerificado) {
            window.location.replace("/verify");
            return;
        }
        if (!comprobarPermiso(estado, roles, ruta !== "/perfil")) {
            window.location.replace("/?acceso=denegado");
            return;
        }
        mostrarPaginaAutorizada();
    });
}

