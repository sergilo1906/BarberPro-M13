import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarUid, comprobarAdministrador, comprobarSesion, comprobarIdentidadTransaccion, normalizarRolEntrada } from "./permisos.js";
export async function asignarRolAutorizado(uidRecibido, rolRecibido, identidadAdministradora = null) {
    const uid = comprobarUid(uidRecibido);
    const rol = normalizarRolEntrada(rolRecibido);
    const { autenticacion, baseDatos } = obtenerServiciosAdministrativos();
    let usuario;
    try {
        usuario = await autenticacion.getUser(uid);
    }
    catch {
        throw new HttpsError("not-found", "No se encontro el usuario.");
    }
    const referencia = baseDatos.doc("users/" + uid);
    // Auth y Firestore no comparten transacción. Una versión discordante deniega el acceso;
    // nunca se conserva un permiso antiguo si una escritura intermedia falla.
    const version = await baseDatos.runTransaction(async (transaccion) => {
        // El permiso del actor debe seguir vigente al confirmar el cambio de rol.
        // Las herramientas CLI locales no reciben una sesión de navegador.
        if (identidadAdministradora) {
            await comprobarIdentidadTransaccion(transaccion, baseDatos, identidadAdministradora);
        }
        const documento = await transaccion.get(referencia);
        const siguienteVersion = Math.max(documento.get("roleVersion") || 0, usuario.customClaims?.roleVersion || 0) + 1;
        const cambios = {
            role: rol, roleVersion: siguienteVersion, updatedAt: FieldValue.serverTimestamp()
        };
        if (!documento.exists) {
            Object.assign(cambios, {
                name: usuario.displayName || "", phone: "", email: usuario.email || "", createdAt: FieldValue.serverTimestamp()
            });
        }
        transaccion.set(referencia, cambios, { merge: true });
        return siguienteVersion;
    });
    await autenticacion.setCustomUserClaims(uid, {
        ...usuario.customClaims, role: rol, roleVersion: version
    });
    await sincronizarFichaProfesional(uid, rol, usuario);
    const usuarioFinal = await autenticacion.getUser(uid);
    const perfilFinal = await referencia.get();
    if (perfilFinal.get("roleVersion") !== version || usuarioFinal.customClaims?.roleVersion !== version) {
        throw new HttpsError("aborted", "Otro cambio de rol esta en curso. Repite la operacion.");
    }
    return {
        ok: true, uid, role: rol, roleVersion: version
    };
}
async function sincronizarFichaProfesional(uid, rol, usuario) {
    const { baseDatos } = obtenerServiciosAdministrativos();
    await baseDatos.runTransaction(async (transaccion) => {
        const referencia = baseDatos.doc("barbers/" + uid);
        const perfil = await transaccion.get(referencia);
        const cuenta = await transaccion.get(baseDatos.doc("users/" + uid));
        if (cuenta.get("role") !== rol) {
            return;
        }
        if (rol !== "worker" && !perfil.exists) {
            return;
        }
        const eraProfesional = perfil.get("role") === "worker";
        const visible = rol === "worker" && (!eraProfesional || (perfil.get("active") !== false && perfil.get("isActive") !== false));
        const cambios = {
            linkedUserId: uid, role: rol, active: visible, isActive: visible,
            adminRevision: Number(perfil.get("adminRevision") || 0) + 1,
            updatedAt: FieldValue.serverTimestamp(),
        };
        if (rol === "worker") {
            Object.assign(cambios, {
                name: cuenta.get("professionalName") || perfil.get("name") || cuenta.get("name") || usuario.displayName || "Profesional " + uid.slice(0, 6).toUpperCase(),
                email: usuario.email || "",
            });
            if (!perfil.exists) {
                cambios.createdAt = FieldValue.serverTimestamp();
            }
        }
        else {
            cambios.deactivatedAt = FieldValue.serverTimestamp();
        }
        transaccion.set(referencia, cambios, { merge: true });
    });
}
export const adminSetClaims = onCall(async (peticion) => {
    const identidad = await comprobarAdministrador(peticion);
    return asignarRolAutorizado(peticion.data?.uid, peticion.data?.role, identidad);
});
// Se conserva el contrato público, pero no existe autoservicio de roles privilegiados.
export const setMyRole = onCall(async (peticion) => {
    await comprobarSesion(peticion);
    throw new HttpsError("permission-denied", "El rol solo puede cambiarlo un administrador autorizado.");
});
export const whoAmI = onCall(async (peticion) => {
    const { usuario, rol, version } = await comprobarSesion(peticion);
    const clavesClaims = Object.keys(peticion.auth.token).sort();
    return {
        ok: true, uid: usuario.uid, email: usuario.email || "", role: rol, roleVersion: version,
        claimsKeys: clavesClaims, tokenClaimsKeys: clavesClaims,
        timestamp: new Date().toISOString(), region: "europe-west1",
    };
});
