import { createHash } from "node:crypto";
import { Timestamp, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarSesion, comprobarIdentidadTransaccion } from "./permisos.js";
import { validarVentanasRecordatorio } from "./configuracion.js";

export function estaEnVentanaRecordatorio(inicio, ahora, horas) {
  const instante = inicio instanceof Date ? inicio.getTime() : NaN;
  const actual = ahora instanceof Date ? ahora.getTime() : NaN;
  return Number.isFinite(instante) && Number.isFinite(actual) && Number.isFinite(horas) && horas > 0
    && instante > actual && Math.abs(instante - (actual + horas * 3600000)) <= 900000;
}
export function obtenerTipoRecordatorio(horas) { return "reminder_" + String(horas).replace(".", "_") + "h"; }
export async function prepararRecordatorioCita(referencia, horas, ahora, dryRun, identidad = null) {
  const { baseDatos } = obtenerServiciosAdministrativos();
  const tipo = obtenerTipoRecordatorio(horas), clave = "h" + String(horas).replace(".", "_");
  const id = createHash("sha256").update(JSON.stringify([referencia.id, horas])).digest("hex");
  const notificacion = baseDatos.doc("notifications/reminder_" + id);
  return baseDatos.runTransaction(async (transaccion) => {
    if (identidad) await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const documento = await transaccion.get(referencia), cita = documento.data();
    if (!cita || !["pending", "confirmed"].includes(cita.status) || !cita.startAt?.toDate || !estaEnVentanaRecordatorio(cita.startAt.toDate(), ahora, horas)) return false;
    const recordatorios = cita.reminders || {};
    if (recordatorios.queuedWindows?.[clave] || (horas === 24 && recordatorios.h24SentAt) || (horas === 2 && recordatorios.h2SentAt)) return false;
    const existentes = await transaccion.get(baseDatos.collection("notifications").where("bookingId", "==", documento.id).where("kind", "==", tipo).limit(1));
    if (!existentes.empty) return false;
    // Simular no escribe ni la cola, ni marcas en la cita, ni recibos auxiliares.
    if (dryRun) return true;
    transaccion.set(notificacion, {
      bookingId: documento.id, userId: cita.userId || "", channel: "in_app", kind: tipo, status: "queued",
      payload: { dateStr: cita.dateStr || "", timeStr: cita.timeStr || "", serviceName: cita.serviceSnapshot?.name || cita.serviceName || "Servicio", barberUid: cita.barberUid || "" },
      createdAt: FieldValue.serverTimestamp(), sentAt: null,
    });
    const marcas = { ...recordatorios, queuedWindows: { ...recordatorios.queuedWindows, [clave]: FieldValue.serverTimestamp() } };
    if (horas === 24) marcas.h24QueuedAt = FieldValue.serverTimestamp();
    if (horas === 2) marcas.h2QueuedAt = FieldValue.serverTimestamp();
    transaccion.set(referencia, { reminders: marcas, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}
export async function procesarRecordatorios(dryRun = true, ahora = new Date(), identidad = null) {
  const { baseDatos } = obtenerServiciosAdministrativos();
  if (typeof dryRun !== "boolean" || !(ahora instanceof Date) || !Number.isFinite(ahora.getTime())) throw new HttpsError("invalid-argument", "Simulacion o fecha no valida.");
  const configuracion = (await baseDatos.doc("config/app").get()).data() || {};
  const ventanas = validarVentanasRecordatorio(configuracion.reminderWindowsHours ?? [24, 2]);
  let processed = 0;
  for (const horas of ventanas) {
    const centro = ahora.getTime() + horas * 3600000;
    const candidatas = await baseDatos.collection("bookings").where("status", "in", ["pending", "confirmed"])
      .where("startAt", ">=", Timestamp.fromMillis(centro - 900000)).where("startAt", "<=", Timestamp.fromMillis(centro + 900000)).get();
    for (const documento of candidatas.docs) if (await prepararRecordatorioCita(documento.ref, horas, ahora, dryRun, identidad)) processed++;
  }
  return { ok: true, processed, dryRun };
}
export const runReminders = onCall(async (peticion) => {
  const identidad = await comprobarSesion(peticion, true);
  if (!["manager", "admin"].includes(identidad.rol)) throw new HttpsError("permission-denied", "Solo manager/admin.");
  if (peticion.data?.dryRun !== undefined && typeof peticion.data.dryRun !== "boolean") throw new HttpsError("invalid-argument", "Simulacion no valida.");
  return procesarRecordatorios(peticion.data?.dryRun !== false, new Date(), identidad);
});
