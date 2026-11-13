import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
export const ROLES = ["client", "admin"];
export function normalizarRolEntrada(valor) {
    if (typeof valor !== "string") {
        throw new HttpsError("invalid-argument", "Rol no valido.");
    }
    const rol = valor.trim().toLowerCase();
    if (rol === "cliente") {
        return "client";
    }
    if (!ROLES.includes(rol)) {
        throw new HttpsError("invalid-argument", "Rol no valido.");
    }
    return rol;
}
export function comprobarUid(uid) {
    if (typeof uid !== "string" || uid.length < 1 || uid.length > 128 || /[\s/\u0000-\u001f]/.test(uid)) {
        throw new HttpsError("invalid-argument", "Identificador no valido.");
    }
    return uid;
}
// Contrastamos el token con la cuenta actual y el perfil para no aceptar permisos antiguos.
export async function comprobarSesion(peticion, correoObligatorio = false) {
    if (!peticion.auth?.uid) {
        throw new HttpsError("unauthenticated", "Inicia sesion para continuar.");
    }
    if (typeof peticion.auth.token.exp !== "number" || peticion.auth.token.exp <= Date.now() / 1000) {
        throw new HttpsError("unauthenticated", "La sesion ha caducado. Vuelve a iniciar sesion.");
    }
    const { autenticacion, baseDatos } = obtenerServiciosAdministrativos();
    let usuario;
    try {
        usuario = await autenticacion.getUser(peticion.auth.uid);
    }
    catch {
        throw new HttpsError("unauthenticated", "La sesion ya no es valida.");
    }
    if (usuario.disabled) {
        throw new HttpsError("unauthenticated", "La sesion ya no es valida.");
    }
    const instanteValido = Math.floor(Date.parse(usuario.tokensValidAfterTime || "1970-01-01") / 1000);
    if (Number(peticion.auth.token.auth_time || 0) < instanteValido) {
        throw new HttpsError("unauthenticated", "Vuelve a iniciar sesion.");
    }
    if (correoObligatorio && (!usuario.emailVerified || peticion.auth.token.email_verified !== true)) {
        throw new HttpsError("permission-denied", "Verifica tu email para continuar.");
    }
    const rol = usuario.customClaims?.role || "client";
    const version = usuario.customClaims?.roleVersion || 0;
    if (!ROLES.includes(rol) || (peticion.auth.token.role || "client") !== rol
        || (peticion.auth.token.roleVersion || 0) !== version) {
        throw new HttpsError("permission-denied", "Tus permisos han cambiado. Actualiza la sesion.");
    }
    const perfil = await baseDatos.doc("users/" + usuario.uid).get();
    if ((perfil.exists && (perfil.get("role") !== rol || (perfil.get("roleVersion") || 0) !== version))
        || (!perfil.exists && rol !== "client")) {
        throw new HttpsError("permission-denied", "No se pudieron confirmar tus permisos.");
    }
    return {
        usuario, rol, version
    };
}
// La gestion siempre exige administrador y correo verificado.
export async function comprobarAdministrador(peticion) {
    const identidad = await comprobarSesion(peticion, true);
    if (identidad.rol !== "admin") {
        throw new HttpsError("permission-denied", "Acceso denegado.");
    }
    return identidad;
}
// Volvemos a leer el perfil dentro de la transaccion por si cambian los permisos.
export async function comprobarIdentidadTransaccion(transaccion, baseDatos, identidad) {
    const perfil = await transaccion.get(baseDatos.doc("users/" + identidad.usuario.uid));
    if ((perfil.exists && (perfil.get("role") !== identidad.rol || (perfil.get("roleVersion") || 0) !== identidad.version)) || (!perfil.exists && identidad.rol !== "client")) {
        throw new HttpsError("permission-denied", "Tus permisos han cambiado. Actualiza la sesion.");
    }
    return perfil.data() || {};
}
