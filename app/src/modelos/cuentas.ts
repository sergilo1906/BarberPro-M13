export type Rol = "client" | "admin";
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
}
export interface EstadoSesion {
  estado: "cargando" | "invitado" | "autenticado" | "error" | "desactivado";
  usuario: UsuarioSesion | null;
  perfil: PerfilUsuario | null;
  errorPerfil: boolean;
  mensaje: string;
}

