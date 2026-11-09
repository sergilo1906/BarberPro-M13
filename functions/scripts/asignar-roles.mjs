import { obtenerServiciosAdministrativos } from "../src/firebase.js";
import { asignarRolAutorizado } from "../src/cuentas.js";
import { comprobarUid, normalizarRolEntrada } from "../src/permisos.js";

const argumentos = process.argv.slice(2);
if (argumentos.indexOf("--uid") === -1 || argumentos.indexOf("--role") === -1) {
  throw new Error("Indica --uid y --role explicitos. Usa --aplicar solo para escribir en el emulador.");
}
const uid = comprobarUid(argumentos[argumentos.indexOf("--uid") + 1]);
const rol = normalizarRolEntrada(argumentos[argumentos.indexOf("--role") + 1]);
const { autenticacion } = obtenerServiciosAdministrativos();
await autenticacion.getUser(uid);
if (argumentos.includes("--aplicar")) {
  await asignarRolAutorizado(uid, rol);
  console.log("Rol actualizado en el emulador local.");
} else {
  console.log("Simulacion local: se asignaria el rol " + rol + ". Usa --aplicar para escribir.");
}
