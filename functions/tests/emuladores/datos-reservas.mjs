import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { formatInTimeZone } from "date-fns-tz";
import { obtenerServiciosAdministrativos, comprobarEntornoLocal } from "../../src/firebase.js";
import { obtenerLunesSemanaUtc } from "../../src/fechas.js";

comprobarEntornoLocal();
export const { baseDatos, autenticacion } = obtenerServiciosAdministrativos();
export const cuentasPrueba = { client: "reservas-client", otro: "reservas-client-2", worker: "demo_worker_1", manager: "reservas-manager", admin: "reservas-admin", pendiente: "reservas-pendiente" };
let contador = 0;

export function fechaPrueba(dias = 7) {
  const hoy = formatInTimeZone(new Date(), "Europe/Madrid", "yyyy-MM-dd");
  const fecha = new Date(hoy + "T00:00:00Z");
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export async function prepararCuentas() {
  for (const [rol, uid] of Object.entries(cuentasPrueba)) {
    const correo = uid + "@example.test";
    try { await autenticacion.getUser(uid); }
    catch { await autenticacion.createUser({ uid, email: correo, password: "Prueba123!", emailVerified: rol !== "pendiente" }); }
    const rolCanonico = rol === "otro" || rol === "pendiente" ? "client" : rol;
    await autenticacion.setCustomUserClaims(uid, { role: rolCanonico, roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ name: "Prueba " + rol, phone: "", email: correo, role: rolCanonico, roleVersion: 0 });
  }
}

export async function prepararAgenda() {
  comprobarEntornoLocal();
  for (const nombre of ["bookings", "bookingLocks", "notifications", "blocks"]) {
    const documentos = await baseDatos.collection(nombre).get();
    for (let inicio = 0; inicio < documentos.size; inicio += 400) {
      const lote = baseDatos.batch();
      for (let indice = inicio; indice < Math.min(inicio + 400, documentos.size); indice++) lote.delete(documentos.docs[indice].ref);
      await lote.commit();
    }
  }
  await baseDatos.doc("config/app").set({ timezone: "Europe/Madrid", cancelWindowHours: 12 });
  const servicios = [
    { id: "svc_haircut", name: "Corte", durationMin: 30, price: 15, active: true },
    { id: "svc_beard", name: "Barba", durationMin: 20, price: 10, active: true },
    { id: "svc_combo", name: "Corte + Barba", durationMin: 50, price: 22, active: true },
    { id: "svc_color", name: "Color", durationMin: 60, price: 30, active: false },
  ];
  for (const servicio of servicios) await baseDatos.doc("services/" + servicio.id).set(servicio);
  const profesionales = [
    { uid: "demo_worker_1", name: "Alex", order: 1, active: true, isActive: true },
    { uid: "demo_worker_2", name: "Marta", order: 2, active: true, isActive: true },
    { uid: "demo_sin_semana", name: "Sin horario", order: 3, active: true, isActive: true },
    { uid: "demo_oculto", name: "Oculto", order: 4, active: false, isActive: false },
  ];
  for (const profesional of profesionales) await baseDatos.doc("barbers/" + profesional.uid).set(profesional);
  const semanas = new Set();
  for (let indice = 0; indice <= 30; indice++) semanas.add(obtenerLunesSemanaUtc(fechaPrueba(indice)));
  for (const semana of semanas) {
    for (const uid of ["demo_worker_1", "demo_worker_2", "demo_oculto"]) {
      const days = [];
      for (let dia = 0; dia < 7; dia++) days.push({ active: true, ranges: [{ start: uid === "demo_worker_2" ? "09:00" : "09:10", end: "14:00" }, { start: "16:00", end: "20:00" }], breaks: [{ start: "11:00", end: "11:20" }] });
      await baseDatos.doc("barbers/" + uid + "/weeklySchedules/" + semana).set({ weekStart: semana, published: true, slot: uid === "demo_worker_2" ? 20 : 15, days });
    }
  }
}

export async function conectarCuenta(rol = "client") {
  const app = initializeApp({ projectId: "demo-barberpro-m13", apiKey: "demo-api-key" }, "reservas-" + (++contador));
  const auth = getAuth(app);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const funciones = getFunctions(app, "europe-west1");
  const datos = getFirestore(app);
  connectFirestoreEmulator(datos, "127.0.0.1", 8088);
  connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
  if (rol) await signInWithEmailAndPassword(auth, cuentasPrueba[rol] + "@example.test", "Prueba123!");
  return { auth, datos, llamar: async (nombre, datos = {}) => (await httpsCallable(funciones, nombre)(datos)).data, cerrar: () => deleteApp(app) };
}

export function solicitudReserva(cambios = {}) {
  return { dateStr: fechaPrueba(), timeStr: "09:10", serviceId: "svc_haircut", barberPreference: "demo_worker_1", anyBarber: false, ...cambios };
}
