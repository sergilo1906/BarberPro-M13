import { setGlobalOptions } from "firebase-functions/v2";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Configuración del backend; no inicializa Admin ni consulta servicios remotos.
setGlobalOptions({
  region: "europe-west1",
  memoryMiB: 256,
  timeoutSeconds: 120,
});

export function comprobarEntornoLocal() {
  if (process.env.GCLOUD_PROJECT !== "demo-barberpro-m13"
      || process.env.FIREBASE_AUTH_EMULATOR_HOST !== "127.0.0.1:9099"
      || process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8088") {
    throw new Error("Las operaciones de cuentas requieren los emuladores locales de demo-barberpro-m13.");
  }
}

export function obtenerServiciosAdministrativos() {
  comprobarEntornoLocal();
  let aplicacion = getApps().find((actual) => actual.name === "cuentas-m13");
  if (!aplicacion) aplicacion = initializeApp({ projectId: "demo-barberpro-m13" }, "cuentas-m13");
  return { autenticacion: getAuth(aplicacion), baseDatos: getFirestore(aplicacion) };
}
