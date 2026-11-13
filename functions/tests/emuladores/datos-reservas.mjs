import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { obtenerServiciosAdministrativos, comprobarEntornoLocal } from "../../src/firebase.js";
import { formatearFechaZona, sumarDiasCalendario } from "../../src/fechas.js";
comprobarEntornoLocal();
export const { baseDatos, autenticacion } = obtenerServiciosAdministrativos();
export const cuentas = { client: "demo-client", otro: "demo-otro", admin: "demo-admin", pendiente: "demo-pendiente", worker: "demo-worker", manager: "demo-manager" };
export const horario = () => Array.from({ length: 7 }, () => ({ active: true, ranges: [{ start: "09:00", end: "14:00" }, { start: "16:00", end: "20:00" }] }));
export const fechaPrueba = (dias = 7) => sumarDiasCalendario(formatearFechaZona(new Date(), "Europe/Madrid").slice(0, 10), dias);
export async function prepararCuentas() {
  comprobarEntornoLocal();
  for (const [nombre, uid] of Object.entries(cuentas)) {
    try { await autenticacion.getUser(uid); }
    catch { await autenticacion.createUser({ uid, email: uid + "@example.test", password: "Prueba123!", emailVerified: nombre !== "pendiente" }); }
    const role = ["otro", "pendiente"].includes(nombre) ? "client" : nombre;
    await autenticacion.updateUser(uid, { disabled: false, emailVerified: nombre !== "pendiente" });
    await autenticacion.setCustomUserClaims(uid, { role, roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ name: "Prueba " + nombre, email: uid + "@example.test", phone: "", role, roleVersion: 0 });
  }
}
export async function prepararAgenda() {
  comprobarEntornoLocal();
  // Borrado exclusivamente de datos ficticios en el proyecto demo y puertos fijos.
  for (const nombre of ["bookings", "bookingLocks", "closedDays", "services"]) {
    for (const documento of (await baseDatos.collection(nombre).get()).docs) await documento.ref.delete();
  }
  await baseDatos.doc("config/app").set({ timezone: "Europe/Madrid", days: horario(), revision: 0 });
  for (const servicio of [
    { id: "corte", name: "Corte", durationMin: 30, price: 15, active: true },
    { id: "completo", name: "Corte y barba", durationMin: 60, price: 25, active: true },
    { id: "inactivo", name: "Inactivo", durationMin: 30, price: 10, active: false },
  ]) await baseDatos.doc("services/" + servicio.id).set(servicio);
}
let contador = 0;
export async function conectarCuenta(nombre = "client") {
  const app = initializeApp({ projectId: "demo-barberpro-m13", apiKey: "demo-api-key" }, "prueba-" + (++contador));
  const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const datos = getFirestore(app); connectFirestoreEmulator(datos, "127.0.0.1", 8088);
  const funciones = getFunctions(app, "europe-west1"); connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
  if (nombre) await signInWithEmailAndPassword(auth, cuentas[nombre] + "@example.test", "Prueba123!");
  return { auth, datos, llamar: async (nombre, entrada = {}) => (await httpsCallable(funciones, nombre)(entrada)).data, cerrar: () => deleteApp(app) };
}
export const solicitud = (cambios = {}) => ({ serviceId: "corte", dateStr: fechaPrueba(), timeStr: "09:00", requestId: crypto.randomUUID(), ...cambios });

