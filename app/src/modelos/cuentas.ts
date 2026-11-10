// Estos valores son contratos de Firebase. No representan una sesión iniciada.
export type Rol = "client" | "worker" | "manager" | "admin";

export interface Profesional { uid: string; name: string; order: number; active?: boolean; }

export interface PerfilUsuario {
  name: string;
  phone: string;
  email: string;
  role: Rol;
  roleVersion?: number;
}

export interface UsuarioSesion {
  uid: string;
  correo: string;
  correoVerificado: boolean;
  nombre: string;
  rol: Rol;
  versionRol: number;
  plan: string;
}

export interface EstadoSesion {
  estado: "cargando" | "invitado" | "autenticado" | "error" | "desactivado";
  usuario: UsuarioSesion | null;
  perfil: PerfilUsuario | null;
  errorPerfil: boolean;
  mensaje: string;
}
