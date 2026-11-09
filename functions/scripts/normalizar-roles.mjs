import { obtenerServiciosAdministrativos } from "../src/firebase.js";
import { asignarRolAutorizado } from "../src/cuentas.js";
import { comprobarUid, normalizarRolEntrada } from "../src/permisos.js";

const argumentos = process.argv.slice(2);
const posicionUid = argumentos.indexOf("--uid");
if (posicionUid === -1) throw new Error("Indica un unico --uid explicito. No hay migracion masiva.");
const uid = comprobarUid(argumentos[posicionUid + 1]);
const { autenticacion } = obtenerServiciosAdministrativos();
const usuario = await autenticacion.getUser(uid);
// Un rol guardado en un perfil antiguo no es prueba de autorización.
const rol = normalizarRolEntrada(usuario.customClaims?.role || "client");
if (argumentos.includes("--aplicar")) {
  await asignarRolAutorizado(uid, rol);
  console.log("Claims y perfil normalizados en el emulador local.");
} else {
  console.log("Simulacion local: se normalizaria a " + rol + ". Usa --aplicar para escribir.");
}
