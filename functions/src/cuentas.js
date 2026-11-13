import { FieldValue } from "firebase-admin/firestore";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarUid, normalizarRolEntrada } from "./permisos.js";

// Herramienta privada de operador: no se exporta como Function ni existe un botón para elevar roles.
export async function asignarRolAutorizado(uidRecibido, rolRecibido) {
  const uid = comprobarUid(uidRecibido);
  const rol = normalizarRolEntrada(rolRecibido);
  const { autenticacion, baseDatos } = obtenerServiciosAdministrativos();
  const usuario = await autenticacion.getUser(uid);
  const referencia = baseDatos.doc("users/" + uid);
  // Auth y Firestore no comparten transacción: cualquier versión discordante deniega acceso.
  const version = await baseDatos.runTransaction(async transaccion => {
    const perfil = await transaccion.get(referencia);
    const siguiente = Math.max(Number(perfil.get("roleVersion") || 0), Number(usuario.customClaims?.roleVersion || 0)) + 1;
    transaccion.set(referencia, { name: perfil.get("name") || usuario.displayName || "Usuario", phone: perfil.get("phone") || "", email: usuario.email || "", role: rol, roleVersion: siguiente, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return siguiente;
  });
  await autenticacion.setCustomUserClaims(uid, { ...usuario.customClaims, role: rol, roleVersion: version });
  return { uid, role: rol, roleVersion: version };
}
