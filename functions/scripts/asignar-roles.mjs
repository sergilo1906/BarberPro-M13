import { obtenerServiciosAdministrativos, comprobarEntornoLocal } from "../src/firebase.js";
import { asignarRolAutorizado } from "../src/cuentas.js";
import { comprobarUid, normalizarRolEntrada } from "../src/permisos.js";

// Herramienta privada de operador; nunca es una Function publica.
const argumentos = process.argv.slice(2);
function leer(nombre) {
  const indice = argumentos.indexOf(nombre);
  if (indice < 0 || !argumentos[indice + 1] || argumentos[indice + 1].startsWith("--")) {
    throw new Error("Falta " + nombre);
  }
  return argumentos[indice + 1];
}
const proyecto = leer("--project");
const uid = comprobarUid(leer("--uid"));
const rol = normalizarRolEntrada(leer("--role"));
if (proyecto === "demo-barberpro-m13") {
  process.env.GCLOUD_PROJECT = proyecto;
  comprobarEntornoLocal();
} else {
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST
      || process.env.FUNCTIONS_EMULATOR === "true" || proyecto.startsWith("demo-")) {
    throw new Error("No mezcles configuracion WEB y LOCAL.");
  }
  if (leer("--confirmar-proyecto") !== proyecto) {
    throw new Error("Confirma el proyecto WEB exacto.");
  }
  if (process.env.GCLOUD_PROJECT && process.env.GCLOUD_PROJECT !== proyecto) {
    throw new Error("GCLOUD_PROJECT pertenece a otro proyecto.");
  }
  process.env.GCLOUD_PROJECT = proyecto;
}
const { autenticacion } = obtenerServiciosAdministrativos();
await autenticacion.getUser(uid);
if (argumentos.includes("--aplicar")) {
  await asignarRolAutorizado(uid, rol);
  console.log("Rol actualizado en " + proyecto + ". La cuenta debe renovar su sesion.");
} else {
  console.log("Simulacion: se asignaria " + rol + " en " + proyecto + ". No se ha escrito nada. Usa --aplicar para guardar.");
}
