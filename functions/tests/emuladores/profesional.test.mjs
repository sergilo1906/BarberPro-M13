import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, connectAuthEmulator, signInWithEmailAndPassword } from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { getFirestore, connectFirestoreEmulator, getDoc, doc, getDocs, collection, query, where, setDoc, deleteDoc } from "firebase/firestore";
import { randomUUID } from "node:crypto";
import { baseDatos, fechaPrueba, conectarCuenta } from "./datos-reservas.mjs";
import { horarioProfesional, prepararDatosProfesional, reiniciarAgendaProfesional } from "./datos-profesional.mjs";
import { obtenerLunesSemanaUtc } from "../../src/fechas.js";

const uid = "profesional-escritorio";
let contador = 0;
before(prepararDatosProfesional);
after(prepararDatosProfesional);
async function conectarProfesional(nombre = uid) {
  const app = initializeApp({ projectId: "demo-barberpro-m13", apiKey: "demo-api-key" }, "profesional-" + (++contador));
  const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const datos = getFirestore(app); connectFirestoreEmulator(datos, "127.0.0.1", 8088);
  const funciones = getFunctions(app, "europe-west1"); connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
  await signInWithEmailAndPassword(auth, nombre + "@example.test", "Prueba123!");
  return { datos, llamar: async (nombre, datos) => (await httpsCallable(funciones, nombre)(datos)).data, cerrar: () => deleteApp(app) };
}
function solicitudSemana(cambios = {}) { return { ...horarioProfesional(), barberUid: uid, weekStart: obtenerLunesSemanaUtc(fechaPrueba(7)), published: true, expectedRevision: 0, requestId: randomUUID(), ...cambios }; }
function solicitudBloqueo(cambios = {}) { return { barberUid: uid, type: "break", dateStr: fechaPrueba(7), start: "09:00", end: "10:00", reason: "Prueba ficticia", requestId: randomUUID(), ...cambios }; }
function solicitudCita(cambios = {}) { return { serviceId: "svc_haircut", dateStr: fechaPrueba(7), timeStr: "09:00", barberPreference: uid, anyBarber: false, requestId: randomUUID(), ...cambios }; }

test("worker consulta solo agenda y bloques propios; cliente/worker no escriben directamente", async () => {
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const propias = await getDocs(query(collection(worker.datos, "bookings"), where("barberUid", "==", uid), where("dateStr", "==", fechaPrueba(0))));
    assert.equal(propias.size, 5);
    await assert.rejects(getDocs(query(collection(worker.datos, "bookings"), where("barberUid", "==", "profesional-movil"))), { code: "permission-denied" });
    await assert.rejects(getDoc(doc(worker.datos, "bookings/profesional-movil-pending")), { code: "permission-denied" });
    await assert.rejects(getDocs(query(collection(cliente.datos, "blocks"), where("barberUid", "==", uid))), { code: "permission-denied" });
    await assert.rejects(setDoc(doc(worker.datos, "barbers/" + uid + "/weeklySchedules/" + obtenerLunesSemanaUtc(fechaPrueba(7))), solicitudSemana()), { code: "permission-denied" });
    await assert.rejects(setDoc(doc(worker.datos, "blocks/manual"), solicitudBloqueo()), { code: "permission-denied" });
    await assert.rejects(deleteDoc(doc(worker.datos, "blocks/manual")), { code: "permission-denied" });
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("semanas se guardan atomicas con espejo, publicacion, descansos, revision e idempotencia", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional();
  try {
    const solicitud = solicitudSemana({ published: false });
    const resultado = await worker.llamar("saveWeeklySchedule", solicitud);
    assert.equal(resultado.revision, 1);
    assert.deepEqual(await worker.llamar("saveWeeklySchedule", solicitud), resultado);
    const semana = await baseDatos.doc("barbers/" + uid + "/weeklySchedules/" + solicitud.weekStart).get();
    const ficha = await baseDatos.doc("barbers/" + uid).get();
    assert.deepEqual(semana.get("days"), ficha.get("schedule.days"));
    assert.deepEqual(semana.get("days.0.breaks") || semana.get("days")[0].breaks, [{ start: "11:00", end: "11:20" }]);
    await assert.rejects(worker.llamar("saveWeeklySchedule", solicitudSemana()), { code: "functions/failed-precondition" });
    await assert.rejects(worker.llamar("saveWeeklySchedule", { ...solicitud, slot: 20 }), { code: "functions/failed-precondition" });
    await worker.llamar("saveWeeklySchedule", solicitudSemana({ expectedRevision: 1, published: true }));
    assert.ok((await semana.ref.get()).get("publishedAt"));
    const oculta = await worker.llamar("saveWeeklySchedule", solicitudSemana({ expectedRevision: 2, published: false }));
    assert.equal(oculta.revision, 3);
    const cliente = await conectarCuenta("client");
    try { assert.equal((await cliente.llamar("getAvailability", solicitudCita())).slots.length, 0); } finally { await cliente.cerrar(); }
  } finally { await worker.cerrar(); }
});
test("se rechazan horas, solapes, fechas imposibles, tipos y parametros manipulados sin escrituras", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional();
  try {
    for (const cambio of [{ weekStart: "2026-02-30" }, { published: "si" }, { slot: 0 }, { expectedRevision: -1 }, { days: [] }]) await assert.rejects(worker.llamar("saveWeeklySchedule", solicitudSemana(cambio)));
    const solapada = solicitudSemana(); solapada.days[0].ranges[1] = { start: "13:00", end: "18:00" };
    await assert.rejects(worker.llamar("saveWeeklySchedule", solapada));
    for (const cambio of [{ type: "inventado" }, { dateStr: "2026-02-30" }, { start: "25:00" }, { start: "12:00", end: "11:00" }, { type: "vacation", startDate: fechaPrueba(9), endDate: fechaPrueba(8) }, { barberUid: "../otro" }]) await assert.rejects(worker.llamar("createScheduleBlock", solicitudBloqueo(cambio)));
    assert.equal((await baseDatos.collection("blocks").where("barberUid", "==", uid).get()).size, 0);
  } finally { await worker.cerrar(); }
});
test("worker no modifica agendas ajenas; cliente/invitado/correo pendiente no mutan; gestion si", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client"), invitado = await conectarCuenta(null), pendiente = await conectarCuenta("pendiente");
  try {
    await assert.rejects(worker.llamar("saveWeeklySchedule", solicitudSemana({ barberUid: "profesional-movil" })), { code: "functions/permission-denied" });
    await assert.rejects(worker.llamar("createScheduleBlock", solicitudBloqueo({ barberUid: "profesional-movil" })), { code: "functions/permission-denied" });
    for (const cuenta of [cliente, invitado, pendiente]) {
      await assert.rejects(cuenta.llamar("saveWeeklySchedule", solicitudSemana()));
      await assert.rejects(cuenta.llamar("createScheduleBlock", solicitudBloqueo()));
      await assert.rejects(cuenta.llamar("deleteScheduleBlock", { blockId: "inexistente", requestId: randomUUID() }));
    }
    for (const rol of ["manager", "admin"]) {
      const gestion = await conectarCuenta(rol);
      try { const bloqueo = await gestion.llamar("createScheduleBlock", solicitudBloqueo({ dateStr: fechaPrueba(10), type: rol === "manager" ? "internal" : "exception" })); await gestion.llamar("deleteScheduleBlock", { blockId: bloqueo.blockId, requestId: randomUUID() }); }
      finally { await gestion.cerrar(); }
    }
  } finally { for (const cuenta of [worker, cliente, invitado, pendiente]) await cuenta.cerrar(); }
});
test("bloques, excepciones y vacaciones inclusivas restan disponibilidad y borrado la recupera", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const consultar = async (dias) => (await cliente.llamar("getAvailability", solicitudCita({ dateStr: fechaPrueba(dias) }))).slots;
    assert.ok((await consultar(7)).some((hueco) => hueco.timeStr === "09:00"));
    for (const type of ["break", "internal", "exception"]) {
      const solicitud = solicitudBloqueo({ type });
      const creada = await worker.llamar("createScheduleBlock", solicitud);
      assert.deepEqual(await worker.llamar("createScheduleBlock", solicitud), creada);
      assert.ok(!(await consultar(7)).some((hueco) => hueco.timeStr === "09:00"));
      await assert.rejects(worker.llamar("createScheduleBlock", solicitudBloqueo({ type })), { code: "functions/already-exists" });
      const borrado = { blockId: creada.blockId, requestId: randomUUID() };
      await worker.llamar("deleteScheduleBlock", borrado); await worker.llamar("deleteScheduleBlock", borrado);
    }
    const vacaciones = await worker.llamar("createScheduleBlock", solicitudBloqueo({ type: "vacation", startDate: fechaPrueba(8), endDate: fechaPrueba(10) }));
    for (const dia of [8, 9, 10]) assert.equal((await consultar(dia)).length, 0);
    assert.ok((await consultar(11)).length);
    const otro = await conectarProfesional("profesional-movil");
    try { await assert.rejects(otro.llamar("deleteScheduleBlock", { blockId: vacaciones.blockId, requestId: randomUUID() }), { code: "functions/permission-denied" }); } finally { await otro.cerrar(); }
    await worker.llamar("deleteScheduleBlock", { blockId: vacaciones.blockId, requestId: randomUUID() });
    assert.ok((await consultar(8)).length);
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("reserva creada aparece en agenda y protege contra bloqueos y recortes de jornada", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const cita = await cliente.llamar("createBooking", solicitudCita());
    const agenda = await getDocs(query(collection(worker.datos, "bookings"), where("barberUid", "==", uid), where("dateStr", "==", fechaPrueba(7))));
    assert.ok(agenda.docs.some((documento) => documento.id === cita.bookingId));
    await assert.rejects(worker.llamar("createScheduleBlock", solicitudBloqueo()), { code: "functions/already-exists" });
    const semana = solicitudSemana(); for (const dia of semana.days) dia.ranges[0].start = "10:00";
    await assert.rejects(worker.llamar("saveWeeklySchedule", semana), { code: "functions/failed-precondition" });
    assert.equal((await baseDatos.doc("bookings/" + cita.bookingId).get()).get("status"), "pending");
    await worker.llamar("updateBookingStatus", { bookingId: cita.bookingId, nextStatus: "confirmed" });
    await worker.llamar("updateBookingStatus", { bookingId: cita.bookingId, nextStatus: "cancelled" });
    await worker.llamar("createScheduleBlock", solicitudBloqueo());
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("crear bloqueo y reservar simultaneamente no confirma dos intervalos incompatibles", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const resultados = await Promise.allSettled([worker.llamar("createScheduleBlock", solicitudBloqueo()), cliente.llamar("createBooking", solicitudCita())]);
    assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
    const citas = await baseDatos.collection("bookings").where("barberUid", "==", uid).get(), bloques = await baseDatos.collection("blocks").where("barberUid", "==", uid).get();
    assert.equal(citas.size + bloques.size, 1);
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("cambiar jornada y reservar simultaneamente mantienen los intervalos y la revision", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const semana = solicitudSemana(); for (const dia of semana.days) dia.ranges[0].start = "10:00";
    const resultados = await Promise.allSettled([worker.llamar("saveWeeklySchedule", semana), cliente.llamar("createBooking", solicitudCita())]);
    assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
    const documento = await baseDatos.doc("barbers/" + uid + "/weeklySchedules/" + semana.weekStart).get();
    const citas = await baseDatos.collection("bookings").where("barberUid", "==", uid).get();
    if (citas.size) assert.equal(documento.get("revision"), 0); else assert.equal(documento.get("revision"), 1);
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("reprogramar y crear un bloqueo en el destino no dejan dos intervalos incompatibles", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional(), cliente = await conectarCuenta("client");
  try {
    const original = await cliente.llamar("createBooking", solicitudCita());
    const resultados = await Promise.allSettled([
      worker.llamar("createScheduleBlock", solicitudBloqueo({ dateStr: fechaPrueba(8) })),
      cliente.llamar("rescheduleBooking", { bookingId: original.bookingId, newDateStr: fechaPrueba(8), newTimeStr: "09:00", barberPreference: uid, anyBarber: false, requestId: randomUUID() }),
    ]);
    assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
    const anterior = await baseDatos.doc("bookings/" + original.bookingId).get();
    const destino = await baseDatos.collection("bookings").where("barberUid", "==", uid).where("dateStr", "==", fechaPrueba(8)).get();
    const bloques = await baseDatos.collection("blocks").where("barberUid", "==", uid).get();
    if (destino.size) { assert.equal(anterior.get("status"), "rescheduled"); assert.equal(bloques.size, 0); }
    else { assert.equal(anterior.get("status"), "pending"); assert.equal(bloques.size, 1); for (const clave of anterior.get("lockKeys")) assert.equal((await baseDatos.doc("bookingLocks/" + clave).get()).get("bookingId"), original.bookingId); }
  } finally { await worker.cerrar(); await cliente.cerrar(); }
});
test("dos guardados y dos bloques iguales concurrentes tienen un unico efecto", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional();
  try {
    const resultados = await Promise.allSettled([worker.llamar("saveWeeklySchedule", solicitudSemana()), worker.llamar("saveWeeklySchedule", solicitudSemana())]);
    assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
    const solicitud = solicitudBloqueo();
    const [primero, segundo] = await Promise.all([worker.llamar("createScheduleBlock", solicitud), worker.llamar("createScheduleBlock", solicitud)]);
    assert.equal(primero.blockId, segundo.blockId);
    assert.equal((await baseDatos.collection("blocks").where("barberUid", "==", uid).get()).size, 1);
  } finally { await worker.cerrar(); }
});
test("una ficha ausente se recupera al guardar y una oculta nunca se reactiva", async () => {
  await reiniciarAgendaProfesional(uid);
  const worker = await conectarProfesional();
  try {
    await baseDatos.doc("barbers/" + uid).delete();
    await worker.llamar("saveWeeklySchedule", solicitudSemana());
    assert.equal((await baseDatos.doc("barbers/" + uid).get()).get("active"), true);
    await baseDatos.doc("barbers/" + uid).update({ active: false, isActive: false });
    const oculta = await worker.llamar("saveWeeklySchedule", solicitudSemana({ expectedRevision: 1 }));
    assert.equal(oculta.visible, false);
    assert.equal((await baseDatos.doc("barbers/" + uid).get()).get("active"), false);
  } finally { await worker.cerrar(); }
});
