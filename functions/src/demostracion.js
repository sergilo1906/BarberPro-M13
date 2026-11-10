import { FieldValue } from "firebase-admin/firestore";
import { formatInTimeZone } from "date-fns-tz";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarAdministrador, comprobarIdentidadTransaccion } from "./permisos.js";
import { obtenerLunesSemanaUtc } from "./fechas.js";

const COLECCIONES_DEMO = ["bookingLocks", "bookings", "blocks", "notifications", "services", "barbers"];
function comprobarSolicitudDemo(datos) {
  if (datos?.dryRun !== undefined && typeof datos.dryRun !== "boolean") throw new HttpsError("invalid-argument", "Simulacion no valida.");
  if (datos?.reset !== undefined && typeof datos.reset !== "boolean") throw new HttpsError("invalid-argument", "Reset no valido.");
  const dryRun = datos?.dryRun !== false;
  if (!dryRun && datos?.confirmProject !== "demo-barberpro-m13") throw new HttpsError("failed-precondition", "Confirma explicitamente el proyecto demo local.");
  return dryRun;
}
export async function vaciarColeccionDemo(nombre) {
  const { baseDatos } = obtenerServiciosAdministrativos();
  if (!COLECCIONES_DEMO.includes(nombre) || nombre === "barbers") throw new HttpsError("invalid-argument", "Coleccion de demostracion no valida.");
  while (true) {
    const documentos = await baseDatos.collection(nombre).limit(300).get();
    if (documentos.empty) return;
    const lote = baseDatos.batch(); for (const documento of documentos.docs) lote.delete(documento.ref); await lote.commit();
  }
}
export async function borrarProfesionalesDemo() {
  const { baseDatos } = obtenerServiciosAdministrativos();
  const documentos = await baseDatos.collection("barbers").get();
  for (const documento of documentos.docs) await baseDatos.recursiveDelete(documento.ref);
}
async function contarDatosDemo() {
  const { baseDatos } = obtenerServiciosAdministrativos(), conteos = {};
  for (const nombre of COLECCIONES_DEMO) conteos[nombre] = (await baseDatos.collection(nombre).count().get()).data().count;
  return conteos;
}
async function restablecerDatosDemo(dryRun) {
  const { baseDatos } = obtenerServiciosAdministrativos(), counts = await contarDatosDemo();
  if (dryRun) return { ok: true, dryRun: true, counts };
  for (const nombre of COLECCIONES_DEMO) if (nombre !== "barbers") await vaciarColeccionDemo(nombre);
  await borrarProfesionalesDemo();
  await baseDatos.doc("config/app").set({ allowRoleSwitch: false, demoMode: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { ok: true, dryRun: false, counts };
}
export function crearHorarioDemo(weekStart) {
  const days = [];
  for (let dia = 0; dia < 7; dia++) {
    const ranges = dia === 0 ? [] : dia === 6 ? [{ start: "09:00", end: "14:00" }] : [{ start: "09:00", end: "14:00" }, { start: "16:00", end: "20:00" }];
    days.push({ active: dia !== 0, ranges, breaks: [] });
  }
  return { weekStart, published: true, slot: 15, days, updatedAt: FieldValue.serverTimestamp(), publishedAt: FieldValue.serverTimestamp() };
}
async function sembrarDatosDemo(identidad, dryRun, reset) {
  const { baseDatos } = obtenerServiciosAdministrativos();
  if (reset) await restablecerDatosDemo(dryRun);
  const servicios = [
    { id: "svc_haircut", name: "Corte", durationMin: 30, price: 15, active: true },
    { id: "svc_beard", name: "Barba", durationMin: 20, price: 10, active: true },
    { id: "svc_combo", name: "Corte + Barba", durationMin: 50, price: 22, active: true },
    { id: "svc_color", name: "Color", durationMin: 60, price: 30, active: true },
  ];
  const equipo = [{ uid: "demo_worker_1", name: "Alex", order: 1, isActive: true, active: true }, { uid: "demo_worker_2", name: "Marta", order: 2, isActive: true, active: true }];
  return baseDatos.runTransaction(async (transaccion) => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const referenciaConfig = baseDatos.doc("config/app"), documentoConfig = await transaccion.get(referenciaConfig);
    const zona = reset ? "Europe/Madrid" : documentoConfig.get("timezone") || documentoConfig.get("tz") || "Europe/Madrid";
    const weekStart = obtenerLunesSemanaUtc(formatInTimeZone(new Date(), zona, "yyyy-MM-dd"));
    const inserciones = [];
    for (const servicio of servicios) {
      const referencia = baseDatos.doc("services/" + servicio.id), documento = await transaccion.get(referencia);
      if (!documento.exists) inserciones.push({ referencia, datos: { ...servicio, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() } });
    }
    for (const profesional of equipo) {
      const referencia = baseDatos.doc("barbers/" + profesional.uid), documento = await transaccion.get(referencia);
      const semana = baseDatos.doc("barbers/" + profesional.uid + "/weeklySchedules/" + weekStart), documentoSemana = await transaccion.get(semana);
      if (!documento.exists) inserciones.push({ referencia, datos: { ...profesional, updatedAt: FieldValue.serverTimestamp() } });
      if (!documentoSemana.exists) inserciones.push({ referencia: semana, datos: crearHorarioDemo(weekStart) });
    }
    if (!dryRun) {
      for (const insercion of inserciones) transaccion.set(insercion.referencia, insercion.datos);
      const config = { demoMode: true, allowRoleSwitch: false, updatedAt: FieldValue.serverTimestamp() };
      if (!documentoConfig.exists || reset) Object.assign(config, { timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: [24, 2], adminRevision: FieldValue.increment(1) });
      transaccion.set(referenciaConfig, config, { merge: true });
    }
    return { ok: true, services: servicios.length, barbers: equipo.length, weekStart, dryRun, created: dryRun ? 0 : inserciones.length };
  });
}
export const resetDemoData = onCall(async (peticion) => { await comprobarAdministrador(peticion); return restablecerDatosDemo(comprobarSolicitudDemo(peticion.data)); });
export const seedDemoData = onCall(async (peticion) => { const identidad = await comprobarAdministrador(peticion); return sembrarDatosDemo(identidad, comprobarSolicitudDemo(peticion.data), peticion.data?.reset === true); });
