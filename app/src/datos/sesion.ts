import { applyActionCode, createUserWithEmailAndPassword, getIdTokenResult, onIdTokenChanged, reload, sendEmailVerification, signInWithEmailAndPassword, signOut, updateProfile, type User, } from "firebase/auth";
import { obtenerServiciosFirebase } from "./firebase";
import { crearPerfilUsuario, observarPerfilUsuario } from "./personas";
import type { EstadoSesion, Rol } from "../modelos/cuentas";
let estadoSesion: EstadoSesion = {
    estado: "cargando", usuario: null, perfil: null, errorPerfil: false, mensaje: ""
};
const suscriptores = new Set<(estado: EstadoSesion) => void>();
let iniciado = false;
let revisionSesion = 0;
let cancelarPerfil: (() => void) | null = null;
let actualizacion: Promise<void> | null = null;
let ultimoCambioPermisos = "";
export function normalizarRol(valor: unknown): Rol | null {
    if (valor === undefined) {
        return "client";
    }
    if (valor === "client" || valor === "admin") {
        return valor;
    }
    return null;
}
function publicarEstado(estado: EstadoSesion): void {
    estadoSesion = estado;
    for (const recibir of suscriptores) {
        recibir(estadoSesion);
    }
}
function estadoVacio(estado: EstadoSesion["estado"], mensaje = ""): EstadoSesion {
    return {
        estado, usuario: null, perfil: null, errorPerfil: false, mensaje
    };
}
function limpiarDatosTemporalesSesion(): void {
    try {
        // Solo se eliminan datos temporales de esta aplicación, nunca claves ajenas.
        for (let indice = sessionStorage.length - 1; indice >= 0; indice--) {
            const clave = sessionStorage.key(indice);
            if (clave?.startsWith("barberpro-")) {
                sessionStorage.removeItem(clave);
            }
        }
    }
    catch { /* La sesión también puede cerrarse con el almacenamiento deshabilitado. */
    }
}
function exigirServicios() {
    const servicios = obtenerServiciosFirebase();
    if (!servicios) {
        throw new Error("Firebase no configurado.");
    }
    return servicios;
}
async function cargarUsuario(usuario: User | null): Promise<void> {
    const revision = ++revisionSesion;
    cancelarPerfil?.();
    cancelarPerfil = null;
    publicarEstado(estadoVacio("cargando"));
    if (!usuario) {
        limpiarDatosTemporalesSesion();
        publicarEstado(estadoVacio("invitado"));
        return;
    }
    try {
        const token = await getIdTokenResult(usuario);
        if (revision !== revisionSesion) {
            return;
        }
        const rol = normalizarRol(token.claims.role);
        if (!rol) {
            throw new Error("Rol no reconocido.");
        }
        const usuarioSesion = {
            uid: usuario.uid, correo: usuario.email || "", correoVerificado: usuario.emailVerified,
            nombre: usuario.displayName || "", rol, versionRol: Number(token.claims.roleVersion || 0),
        };
        // Solo existe un listener del perfil actual; la revisión descarta respuestas de otra sesión.
        cancelarPerfil = observarPerfilUsuario(usuario.uid, (perfil) => {
            if (revision !== revisionSesion) {
                return;
            }
            if (!perfil && rol !== "client") {
                publicarEstado(estadoVacio("error", "No se pudieron confirmar tus permisos. Contacta con un administrador."));
                return;
            }
            if (perfil && (perfil.role !== rol || (perfil.roleVersion || 0) !== usuarioSesion.versionRol)) {
                publicarEstado(estadoVacio("error", "Tus permisos han cambiado. Actualiza la pagina o vuelve a iniciar sesion."));
                const cambioPermisos = usuario.uid + ":" + perfil.role + ":" + (perfil.roleVersion || 0);
                if (ultimoCambioPermisos !== cambioPermisos) {
                    ultimoCambioPermisos = cambioPermisos;
                    void actualizarUsuarioSesion().catch(() => {
                    });
                }
                return;
            }
            publicarEstado({
                estado: "autenticado", usuario: usuarioSesion, perfil, errorPerfil: false, mensaje: ""
            });
        }, () => {
            if (revision !== revisionSesion) {
                return;
            }
            // Se permite recuperar el perfil; un error no concede acceso al personal.
            if (rol !== "client") {
                publicarEstado(estadoVacio("error", "No se pudieron comprobar tus permisos. Vuelve a iniciar sesion."));
            }
            else {
                publicarEstado({
                    estado: "autenticado", usuario: usuarioSesion, perfil: null, errorPerfil: true, mensaje: "No se pudieron cargar tus datos."
                });
            }
        });
    }
    catch {
        if (revision === revisionSesion) {
            publicarEstado(estadoVacio("error", "No se pudo comprobar la sesion. Vuelve a iniciar sesion."));
        }
    }
}
function iniciarObservacion(): void {
    if (iniciado) {
        return;
    }
    iniciado = true;
    try {
        const servicios = obtenerServiciosFirebase();
        if (!servicios) {
            publicarEstado(estadoVacio("desactivado", "La autenticacion esta desactivada. Consulta la configuracion en README."));
            return;
        }
        onIdTokenChanged(servicios.autenticacion, (usuario) => {
            void cargarUsuario(usuario);
        }, () => {
            revisionSesion++;
            cancelarPerfil?.();
            publicarEstado(estadoVacio("error", "No se pudo comprobar la sesion. Vuelve a iniciar sesion."));
        });
        window.addEventListener("focus", () => {
            void actualizarUsuarioSesion().catch(() => {
            });
        });
        window.addEventListener("pageshow", (evento) => {
            if (evento.persisted) {
                window.location.reload();
            }
        });
    }
    catch {
        publicarEstado(estadoVacio("error", "No se pudo preparar la autenticacion. Revisa la configuracion."));
    }
}
export function observarSesion(recibir: (estado: EstadoSesion) => void): () => void {
    suscriptores.add(recibir);
    recibir(estadoSesion);
    iniciarObservacion();
    return () => {
        suscriptores.delete(recibir);
    };
}
export function obtenerUsuarioActual(): EstadoSesion {
    return estadoSesion;
}
export function esperarEstadoSesion(): Promise<EstadoSesion> {
    iniciarObservacion();
    if (estadoSesion.estado !== "cargando") {
        return Promise.resolve(estadoSesion);
    }
    return new Promise((resolver) => {
        const recibir = (estado: EstadoSesion) => {
            if (estado.estado !== "cargando") {
                suscriptores.delete(recibir);
                resolver(estado);
            }
        };
        suscriptores.add(recibir);
    });
}
export async function iniciarSesion(correo: string, contrasena: string): Promise<void> {
    await signInWithEmailAndPassword(exigirServicios().autenticacion, correo, contrasena);
    await actualizarUsuarioSesion();
}
export async function registrarUsuario(correo: string, contrasena: string, nombre: string, telefono: string) {
    const credencial = await createUserWithEmailAndPassword(exigirServicios().autenticacion, correo, contrasena);
    try {
        await updateProfile(credencial.user, { displayName: nombre.trim() });
        await crearPerfilUsuario(credencial.user.uid, credencial.user.email || correo, nombre, telefono);
    }
    catch {
        return { perfilCreado: false, correoEnviado: false };
    }
    try {
        await enviarVerificacion();
        return { perfilCreado: true, correoEnviado: true };
    }
    catch {
        return { perfilCreado: true, correoEnviado: false };
    }
}
export async function actualizarUsuarioSesion(): Promise<void> {
    if (actualizacion) {
        return actualizacion;
    }
    actualizacion = (async () => {
        const usuario = exigirServicios().autenticacion.currentUser;
        if (!usuario) {
            return;
        }
        try {
            await reload(usuario);
            await getIdTokenResult(usuario, true);
        }
        catch (error) {
            revisionSesion++;
            cancelarPerfil?.();
            publicarEstado(estadoVacio("error", "No se pudo actualizar la sesion. Vuelve a iniciar sesion."));
            throw error;
        }
        if (exigirServicios().autenticacion.currentUser?.uid === usuario.uid) {
            await cargarUsuario(usuario);
        }
    })().finally(() => {
        actualizacion = null;
    });
    return actualizacion;
}
export async function cerrarSesion(): Promise<void> {
    // Vaciar antes de esperar la red impide conservar datos privados de la sesión anterior.
    revisionSesion++;
    cancelarPerfil?.();
    limpiarDatosTemporalesSesion();
    publicarEstado(estadoVacio("cargando"));
    try {
        await signOut(exigirServicios().autenticacion);
        publicarEstado(estadoVacio("invitado"));
    }
    catch (error) {
        publicarEstado(estadoVacio("error", "No se pudo cerrar sesion. Vuelve a intentarlo."));
        throw error;
    }
}
export function obtenerUrlVerificacion(): string {
    return window.location.origin + "/verify";
}
export async function enviarVerificacion(): Promise<void> {
    const usuario = exigirServicios().autenticacion.currentUser;
    if (!usuario) {
        throw new Error("Sesion requerida.");
    }
    await sendEmailVerification(usuario, { url: obtenerUrlVerificacion(), handleCodeInApp: false });
}
export async function aplicarVerificacion(codigo: string): Promise<void> {
    await applyActionCode(exigirServicios().autenticacion, codigo);
    await actualizarUsuarioSesion();
}
