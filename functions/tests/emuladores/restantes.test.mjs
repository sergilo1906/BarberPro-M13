import { before, beforeEach, after, test } from "node:test";
import assert from "node:assert/strict";
import { Timestamp } from "firebase-admin/firestore";
import { baseDatos, autenticacion, conectarCuenta, prepararCuentas, prepararAgenda, fechaPrueba } from "./datos-reservas.mjs";
import { prepararDatosCliente } from "./datos-cliente.mjs";
import { prepararDatosProfesional } from "./datos-profesional.mjs";
import { prepararDatosAdministracion } from "./datos-administracion.mjs";
import { procesarRecordatorios, bookingRemindersJob } from "../../src/recordatorios.js";
const ahora = new Date("2035-03-25T01:00:00Z"), propietario = "recordatorio-ficticio";
async function limpiarRecordatorios() {
  for (const nombre of ["bookings", "notifications"]) { const documentos = await baseDatos.collection(nombre).where("userId", "==", propietario).get(); for (const documento of documentos.docs) await documento.ref.delete(); }
}
async function crearCitaRecordatorio(id, horas, cambios = {}) {
  const inicio = new Date(ahora.getTime() + horas * 3600000);
  const datos = { userId: propietario, barberUid: "demo_worker_1", dateStr: inicio.toISOString().slice(0, 10), timeStr: inicio.toISOString().slice(11, 16), serviceSnapshot: { name: "Corte ficticio", durationMin: 30 }, durationMin: 30, status: "confirmed", startAt: Timestamp.fromDate(inicio), ...cambios };
  await baseDatos.doc("bookings/" + id).set(datos); return baseDatos.doc("bookings/" + id);
}
async function fotoDatos() {
  const resultado = {};
  for (const nombre of ["bookings", "bookingLocks", "blocks", "notifications", "services", "barbers", "config", "users"]) {
    const documentos = await baseDatos.collection(nombre).get(); resultado[nombre] = documentos.docs.map((documento) => ({ id: documento.id, datos: documento.data() }));
  }
  const fichas = await baseDatos.collection("barbers").get(); resultado.semanas = [];
  for (const ficha of fichas.docs) { const semanas = await ficha.ref.collection("weeklySchedules").get(); for (const semana of semanas.docs) resultado.semanas.push({ ruta: semana.ref.path, datos: semana.data() }); }
  return JSON.stringify(resultado);
}
before(async () => { await limpiarRecordatorios(); });
beforeEach(async () => { await limpiarRecordatorios(); await baseDatos.doc("config/app").set({ timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: [24, 2] }, { merge: true }); });
after(async () => { await prepararCuentas(); await prepararAgenda(); await prepararDatosCliente(); await prepararDatosProfesional(); await prepararDatosAdministracion(); });

test("simular recordatorios produce conteo sin modificar ninguna coleccion ni la cita", async () => {
  await crearCitaRecordatorio("recordatorio-dry", 2); const antes = await fotoDatos();
  assert.deepEqual(await procesarRecordatorios(true, ahora), { ok: true, processed: 1, dryRun: true });
  assert.equal(await fotoDatos(), antes);
});
test("recordatorio real queda queued y nunca sent; reintentos no duplican", async () => {
  const referencia = await crearCitaRecordatorio("recordatorio-cola", 2);
  assert.equal((await procesarRecordatorios(false, ahora)).processed, 1);
  assert.equal((await procesarRecordatorios(false, ahora)).processed, 0);
  const notificaciones = await baseDatos.collection("notifications").where("userId", "==", propietario).get(); assert.equal(notificaciones.size, 1);
  const aviso = notificaciones.docs[0].data(); assert.equal(aviso.kind, "reminder_2h"); assert.equal(aviso.status, "queued"); assert.equal(aviso.channel, "in_app"); assert.equal(aviso.sentAt, null);
  const cita = (await referencia.get()).data(); assert.ok(cita.reminders.h2QueuedAt); assert.equal(cita.reminders.h2SentAt, undefined);
});
test("dos ejecuciones simultaneas encolan una sola notificacion por cita y ventana", async () => {
  await crearCitaRecordatorio("recordatorio-carrera", 24);
  const resultados = await Promise.all([procesarRecordatorios(false, ahora), procesarRecordatorios(false, ahora)]);
  assert.equal(resultados.reduce((total, resultado) => total + resultado.processed, 0), 1);
  assert.equal((await baseDatos.collection("notifications").where("bookingId", "==", "recordatorio-carrera").get()).size, 1);
});
test("estados terminales, citas pasadas, ventanas y marcas legadas se respetan", async () => {
  for (const estado of ["done", "cancelled", "no_show", "rescheduled"]) await crearCitaRecordatorio("recordatorio-" + estado, 2, { status: estado });
  await crearCitaRecordatorio("recordatorio-pasada", -1); await crearCitaRecordatorio("recordatorio-fuera", 5);
  await crearCitaRecordatorio("recordatorio-legado", 2, { reminders: { h2SentAt: Timestamp.now() } });
  await crearCitaRecordatorio("recordatorio-cola-legada", 2); await baseDatos.doc("notifications/recordatorio-legado").set({ bookingId: "recordatorio-cola-legada", kind: "reminder_2h", userId: propietario, status: "queued" });
  assert.equal((await procesarRecordatorios(false, ahora)).processed, 0);
});
test("ventanas configurables no se confunden con la marca de dos horas", async () => {
  await baseDatos.doc("config/app").set({ reminderWindowsHours: [6, 6] }, { merge: true });
  await crearCitaRecordatorio("recordatorio-seis", 6);
  assert.equal((await procesarRecordatorios(false, ahora)).processed, 1);
  const aviso = await baseDatos.collection("notifications").where("bookingId", "==", "recordatorio-seis").get(); assert.equal(aviso.docs[0].get("kind"), "reminder_6h");
  await baseDatos.doc("config/app").set({ reminderWindowsHours: [24, -2] }, { merge: true });
  await assert.rejects(procesarRecordatorios(false, ahora), { code: "failed-precondition" });
});
test("callables de recordatorios y demo comprueban roles y verificacion reales", async () => {
  for (const rol of [null, "client", "worker", "pendiente"]) {
    const cuenta = await conectarCuenta(rol);
    try { for (const nombre of ["runReminders", "resetDemoData", "seedDemoData"]) await assert.rejects(cuenta.llamar(nombre), (error) => ["functions/permission-denied", "functions/unauthenticated"].includes(error.code)); }
    finally { await cuenta.cerrar(); }
  }
  const gestion = await conectarCuenta("manager");
  try { assert.equal((await gestion.llamar("runReminders")).dryRun, true); await assert.rejects(gestion.llamar("seedDemoData"), { code: "functions/permission-denied" }); await assert.rejects(gestion.llamar("resetDemoData"), { code: "functions/permission-denied" }); }
  finally { await gestion.cerrar(); }
});
test("handler programado se ejecuta manualmente en emulador sin instalar un job", async () => {
  await crearCitaRecordatorio("recordatorio-job", 2, { startAt: Timestamp.fromMillis(Date.now() + 7200000) });
  const resultado = await bookingRemindersJob.run({ scheduleTime: new Date().toISOString() });
  assert.ok(resultado.processed >= 1); const avisos = await baseDatos.collection("notifications").where("bookingId", "==", "recordatorio-job").get(); assert.equal(avisos.size, 1); assert.equal(avisos.docs[0].get("status"), "queued");
});
test("demo simula por defecto sin escrituras y exige confirmacion del proyecto para aplicar", async () => {
  const admin = await conectarCuenta("admin");
  try {
    const antes = await fotoDatos(); assert.equal((await admin.llamar("resetDemoData")).dryRun, true); assert.equal((await admin.llamar("seedDemoData", { reset: true })).dryRun, true); assert.equal(await fotoDatos(), antes);
    for (const nombre of ["resetDemoData", "seedDemoData"]) await assert.rejects(admin.llamar(nombre, { dryRun: false, confirmProject: "proyecto-ajeno" }), { code: "functions/failed-precondition" });
    assert.equal(await fotoDatos(), antes);
  } finally { await admin.cerrar(); }
});
test("seed sin reset conserva catalogo, fichas y semanas ya existentes", async () => {
  const admin = await conectarCuenta("admin"), referencia = baseDatos.doc("services/svc_haircut");
  await referencia.set({ name: "Personalizado ficticio", price: 99 }, { merge: true });
  try {
    await admin.llamar("seedDemoData", { dryRun: false, confirmProject: "demo-barberpro-m13" });
    assert.equal((await referencia.get()).get("price"), 99); assert.equal((await referencia.get()).get("name"), "Personalizado ficticio");
    assert.equal((await admin.llamar("seedDemoData", { dryRun: false, confirmProject: "demo-barberpro-m13" })).created, 0);
    assert.equal((await baseDatos.doc("config/app").get()).get("allowRoleSwitch"), false);
  } finally { await admin.cerrar(); }
});
test("reset confirmado borra datos demo y subcolecciones, conserva usuarios y permite seed limpio", async () => {
  const admin = await conectarCuenta("admin"), usuariosAntes = (await baseDatos.collection("users").get()).size;
  await baseDatos.doc("barbers/demo_worker_1/weeklySchedules/2099-01-05").set({ published: false });
  try {
    assert.equal((await admin.llamar("resetDemoData", { dryRun: false, confirmProject: "demo-barberpro-m13" })).dryRun, false);
    for (const nombre of ["bookings", "bookingLocks", "blocks", "notifications", "services", "barbers"]) assert.equal((await baseDatos.collection(nombre).get()).size, 0);
    assert.equal((await baseDatos.doc("barbers/demo_worker_1/weeklySchedules/2099-01-05").get()).exists, false);
    assert.equal((await baseDatos.collection("users").get()).size, usuariosAntes); assert.equal((await autenticacion.getUser("reservas-admin")).customClaims.role, "admin");
    const sembrado = await admin.llamar("seedDemoData", { dryRun: false, confirmProject: "demo-barberpro-m13" }); assert.equal(sembrado.services, 4); assert.equal(sembrado.barbers, 2);
    const horario = (await baseDatos.doc("barbers/demo_worker_1/weeklySchedules/" + sembrado.weekStart).get()).data(); assert.equal(horario.published, true); assert.equal(horario.days[0].active, false); assert.equal(horario.days[6].ranges.length, 1);
    assert.equal((await baseDatos.doc("config/app").get()).get("allowRoleSwitch"), false);
  } finally { await admin.cerrar(); }
});
