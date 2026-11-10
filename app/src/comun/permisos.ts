import { esperarEstadoSesion, observarSesion, obtenerUsuarioActual } from "../datos/sesion";
import type { EstadoSesion, Rol, UsuarioSesion } from "../modelos/cuentas";

const TODOS: Rol[] = ["client", "worker", "manager", "admin"];
const PERSONAL: Rol[] = ["worker", "manager", "admin"];
const GESTION: Rol[] = ["manager", "admin"];

export const PERMISOS_RUTA: Record<string, Rol[]> = {
  "/perfil": TODOS, "/reservar": TODOS, "/mis-citas": TODOS,
  "/agenda": PERSONAL, "/panel-barbero": PERSONAL, "/panel": PERSONAL,
  "/index-admin": PERSONAL, "/setup-barber": PERSONAL, "/bloqueos": PERSONAL,
  "/horarios": GESTION, "/equipo": GESTION, "/servicios": GESTION,
  "/kpis": GESTION, "/export": GESTION,
  "/admin": ["admin"], "/admin/usuarios": ["admin"], "/branding": ["admin"], "/debug": ["admin"],
};

export function esPersonal(rol: Rol): boolean {
  return PERSONAL.includes(rol);
}

export interface ContextoProfesional { usuario: UsuarioSesion; esVigente: () => boolean; }

// Un contexto por pantalla. No se reinicia un formulario editado por una renovación
// transitoria del token; un cambio de identidad/rol o un error sí invalida sus respuestas.
export function observarAreaProfesional(cargar: (contexto: ContextoProfesional) => void, limpiar: () => void): void {
  observarAreaAutorizada(PERSONAL, cargar, limpiar);
}

export function observarAreaAutorizada(roles: readonly Rol[], cargar: (contexto: ContextoProfesional) => void, limpiar: () => void): void {
  let claveAnterior = "";
  let revision = 0;
  observarSesion((estado) => {
    if (estado.estado === "cargando") return;
    const usuario = estado.usuario;
    const clave = comprobarPermiso(estado, roles) && usuario ? usuario.uid + ":" + usuario.rol + ":" + usuario.versionRol : "";
    if (clave === claveAnterior) return;
    revision++; claveAnterior = clave; limpiar();
    if (!clave || !usuario) return;
    const actual = revision;
    cargar({ usuario, esVigente: () => actual === revision && comprobarPermiso(obtenerUsuarioActual(), roles)
      && obtenerUsuarioActual().usuario?.uid === usuario.uid && obtenerUsuarioActual().usuario?.rol === usuario.rol });
  });
}

export function obtenerEtiquetaRol(rol: Rol): string {
  if (rol === "worker") return "Profesional";
  if (rol === "manager") return "Responsable";
  if (rol === "admin") return "Administrador";
  return "Cliente";
}

export function obtenerDestinoInicial(rol: Rol): string {
  if (rol === "worker") return "/panel-barbero";
  if (rol === "manager" || rol === "admin") return "/index-admin";
  return "/reservar";
}

export function comprobarPermiso(estado: EstadoSesion, roles: readonly Rol[], correoObligatorio = true): boolean {
  if (estado.estado !== "autenticado" || !estado.usuario) return false;
  if (correoObligatorio && !estado.usuario.correoVerificado) return false;
  return roles.includes(estado.usuario.rol);
}

export function obtenerRolSesion(): Rol | null {
  return obtenerUsuarioActual().usuario?.rol || null;
}

export async function exigirRol(roles: Rol[]): Promise<Rol | null> {
  const estado = await esperarEstadoSesion();
  if (comprobarPermiso(estado, roles)) return estado.usuario!.rol;
  return null;
}

// Capacidad original inactiva. No hay contratación ni páginas que exijan este plan.
export async function exigirPlanPro(): Promise<boolean> {
  const estado = await esperarEstadoSesion();
  if (!comprobarPermiso(estado, TODOS)) return false;
  if (estado.usuario?.plan === "pro" || estado.usuario?.rol === "admin") return true;
  window.location.replace("/planes?upgrade=1");
  return false;
}

export function mostrarPaginaAutorizada(): void {
  document.documentElement.removeAttribute("data-auth-pending");
}

export function protegerRutaActual(): void {
  const ruta = window.location.pathname.replace(/\/+$/, "") || "/";
  const roles = PERMISOS_RUTA[ruta];
  if (!roles) return;
  observarSesion((estado) => {
    document.documentElement.setAttribute("data-auth-pending", "");
    const aviso = document.getElementById("acceso-msg");
    if (aviso) aviso.hidden = true;
    if (estado.estado === "cargando") return;
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
