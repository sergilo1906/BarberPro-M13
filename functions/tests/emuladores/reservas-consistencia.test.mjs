import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { Timestamp } from "firebase-admin/firestore";
import { collection, query, where, getDocs } from "firebase/firestore";
import { baseDatos, prepararCuentas, prepararAgenda, conectarCuenta, solicitudReserva, fechaPrueba, cuentasPrueba } from "./datos-reservas.mjs";
import { obtenerLunesSemanaUtc } from "../../src/fechas.js";

const conexiones = {};
before(async () => {
  await prepararCuentas();
  for (const rol of ["client", "otro", "worker", "manager", "admin", "pendiente"]) conexiones[rol] = await conectarCuenta(rol);
});
beforeEach(prepararAgenda);
after(async () => { await prepararAgenda(); for (const conexion of Object.values(conexiones)) await conexion.cerrar(); });

test("horas alineadas desde el tramo y duracion completa; descansos y tarde", async () => {
  const resultado = await conexiones.client.llamar("getAvailability", solicitudReserva());
  assert.ok(resultado.slots.some((hueco) => hueco.timeStr === "09:10"));
  assert.ok(resultado.slots.some((hueco) => hueco.timeStr === "09:25"));
  assert.ok(!resultado.slots.some((hueco) => hueco.timeStr === "09:00" || hueco.timeStr === "10:55" || hueco.timeStr === "13:55"));
  assert.ok(resultado.slots.some((hueco) => hueco.timeStr === "16:00"));
  const largo = await conexiones.client.llamar("getAvailability", solicitudReserva({ serviceId: "svc_combo" }));
  assert.ok(largo.slots.length < resultado.slots.length);
});

test("semana no publicada/ausente, descanso, profesional oculto y servicio inactivo", async () => {
  const semana = baseDatos.doc("barbers/demo_worker_1/weeklySchedules/" + obtenerLunesSemanaUtc(fechaPrueba()));
  await semana.update({ published: false });
  assert.equal((await conexiones.client.llamar("getAvailability", solicitudReserva())).slots.length, 0);
  await semana.update({ published: true, days: Array.from({ length: 7 }, () => ({ active: false, ranges: [] })) });
  assert.equal((await conexiones.client.llamar("getAvailability", solicitudReserva())).slots.length, 0);
  for (const uid of ["demo_sin_semana", "demo_oculto"]) assert.equal((await conexiones.client.llamar("getAvailability", solicitudReserva({ barberPreference: uid }))).slots.length, 0);
  await assert.rejects(conexiones.client.llamar("getAvailability", solicitudReserva({ serviceId: "svc_color" })), { code: "functions/failed-precondition" });
});

test("bloqueos, vacaciones inclusivas y seleccion automatica determinista", async () => {
  await baseDatos.doc("blocks/pausa").set({ barberUid: "demo_worker_1", type: "break", dateStr: fechaPrueba(), start: "09:00", end: "10:00" });
  const resultado = await conexiones.client.llamar("getAvailability", solicitudReserva());
  assert.ok(!resultado.slots.some((hueco) => hueco.timeStr === "09:10"));
  await baseDatos.doc("blocks/vacaciones").set({ barberUid: "demo_worker_1", type: "vacation", startDate: fechaPrueba(), endDate: fechaPrueba() });
  assert.equal((await conexiones.client.llamar("getAvailability", solicitudReserva())).slots.length, 0);
  const cualquiera = await conexiones.client.llamar("getAvailability", solicitudReserva({ anyBarber: true, barberPreference: null }));
  assert.ok(cualquiera.slots.length > 0);
  assert.ok(cualquiera.slots.every((hueco) => hueco.barberUid === "demo_worker_2"));
});

test("alta atomica mantiene identidad, snapshot, UTC, locks y notificacion sin confiar en el cliente", async () => {
  const resultado = await conexiones.client.llamar("createBooking", solicitudReserva({ userId: cuentasPrueba.admin, durationMin: 1, price: 0, status: "confirmed", customerPhone: "600123123", requestId: "alta-correcta" }));
  const cita = (await baseDatos.doc("bookings/" + resultado.bookingId).get()).data();
  assert.equal(cita.userId, cuentasPrueba.client);
  assert.equal(cita.status, "pending");
  assert.equal(cita.serviceSnapshot.price, 15);
  assert.equal(cita.endAt.toMillis() - cita.startAt.toMillis(), 1800000);
  assert.equal(cita.lockKeys.length, 2);
  assert.equal((await baseDatos.doc("bookingLocks/" + cita.lockKeys[0]).get()).get("timeStr"), "09:10");
  assert.equal((await baseDatos.doc("notifications/confirmation_" + resultado.bookingId).get()).get("status"), "queued");
  const disponibles = await conexiones.client.llamar("getAvailability", solicitudReserva());
  assert.ok(!disponibles.slots.some((hueco) => hueco.timeStr === "09:25"));
});

test("parametros manipulados, pasado, horizonte, fin fuera de tramo y doble ocupacion se rechazan", async () => {
  for (const cambios of [{ dateStr: "2026-02-30" }, { timeStr: "25:00" }, { serviceId: "a/b" }, { anyBarber: "true" }, { customerNotes: "a".repeat(2001) }]) {
    await assert.rejects(conexiones.client.llamar("createBooking", solicitudReserva(cambios)), { code: "functions/invalid-argument" });
  }
  for (const cambios of [{ dateStr: "2020-01-01" }, { dateStr: fechaPrueba(31) }, { serviceId: "no-existe" }, { serviceId: "svc_color" }]) {
    await assert.rejects(conexiones.client.llamar("createBooking", solicitudReserva(cambios)), { code: "functions/failed-precondition" });
  }
  for (const hora of ["09:00", "13:55", "10:55"]) await assert.rejects(conexiones.client.llamar("createBooking", solicitudReserva({ timeStr: hora })), { code: "functions/already-exists" });
  await conexiones.client.llamar("createBooking", solicitudReserva());
  await assert.rejects(conexiones.otro.llamar("createBooking", solicitudReserva()), { code: "functions/already-exists" });
  assert.equal((await baseDatos.collection("bookings").get()).size, 1);
});

test("idempotencia conserva el resultado tras perdida de respuesta y rechaza reutilizar clave con otro payload", async () => {
  const solicitud = solicitudReserva({ requestId: "respuesta-perdida" });
  const primero = await conexiones.client.llamar("createBooking", solicitud);
  const reintento = await conexiones.client.llamar("createBooking", solicitud);
  assert.deepEqual(reintento, primero);
  assert.equal((await baseDatos.collection("bookings").get()).size, 1);
  assert.equal((await baseDatos.collection("notifications").get()).size, 1);
  await assert.rejects(conexiones.client.llamar("createBooking", { ...solicitud, timeStr: "10:10" }), { code: "functions/failed-precondition" });
});

test("cancelacion autorizada libera capacidad y nunca elimina un lock de otro propietario", async () => {
  const alta = await conexiones.client.llamar("createBooking", solicitudReserva());
  await assert.rejects(conexiones.otro.llamar("cancelBooking", { bookingId: alta.bookingId }), { code: "functions/permission-denied" });
  await conexiones.client.llamar("cancelBooking", { bookingId: alta.bookingId });
  assert.ok((await conexiones.client.llamar("getAvailability", solicitudReserva())).slots.some((hueco) => hueco.timeStr === "09:10"));
  const segunda = await conexiones.client.llamar("createBooking", solicitudReserva());
  const cita = (await baseDatos.doc("bookings/" + segunda.bookingId).get()).data();
  await baseDatos.doc("bookingLocks/" + cita.lockKeys[0]).update({ bookingId: "propietario-distinto" });
  await conexiones.client.llamar("cancelBooking", { bookingId: segunda.bookingId, reason: "Prueba" });
  assert.equal((await baseDatos.doc("bookingLocks/" + cita.lockKeys[0]).get()).get("bookingId"), "propietario-distinto");
  assert.equal((await baseDatos.doc("bookingLocks/" + cita.lockKeys[1]).get()).exists, false);
  assert.ok(!(await conexiones.client.llamar("getAvailability", solicitudReserva())).slots.some((hueco) => hueco.timeStr === "09:10"));
  await conexiones.client.llamar("createBooking", solicitudReserva({ timeStr: "09:25" }));
  await conexiones.client.llamar("cancelBooking", { bookingId: alta.bookingId });
  await assert.rejects(conexiones.client.llamar("cancelBooking", { bookingId: "inexistente" }), { code: "functions/not-found" });
});

test("margen del cliente y profesional actuando como cliente; gestion autorizada puede cancelar", async () => {
  const alta = await conexiones.worker.llamar("createBooking", solicitudReserva({ barberPreference: "demo_worker_2", timeStr: "09:00" }));
  await baseDatos.doc("bookings/" + alta.bookingId).update({ startAt: Timestamp.fromMillis(Date.now() + 3600000) });
  await assert.rejects(conexiones.worker.llamar("cancelBooking", { bookingId: alta.bookingId }), { code: "functions/failed-precondition" });
  await conexiones.manager.llamar("cancelBooking", { bookingId: alta.bookingId });
  const propio = await conexiones.worker.llamar("createBooking", solicitudReserva({ barberPreference: "demo_worker_2", timeStr: "10:00" }));
  await conexiones.worker.llamar("cancelBooking", { bookingId: propio.bookingId });
});

test("reprogramacion atomica conserva propietario y notas, enlaza historia y permite reintento", async () => {
  const alta = await conexiones.client.llamar("createBooking", solicitudReserva({ customerNotes: "Nota ficticia" }));
  await baseDatos.doc("bookings/" + alta.bookingId).update({ userName: "", userEmail: "" });
  await baseDatos.doc("services/svc_haircut").update({ durationMin: 20, price: 17 });
  const cambio = { bookingId: alta.bookingId, newDateStr: fechaPrueba(8), newTimeStr: "09:00", barberPreference: "demo_worker_2", anyBarber: false, requestId: "cambio-correcto" };
  await assert.rejects(conexiones.otro.llamar("rescheduleBooking", cambio), { code: "functions/permission-denied" });
  const resultado = await conexiones.manager.llamar("rescheduleBooking", cambio);
  assert.deepEqual(await conexiones.manager.llamar("rescheduleBooking", cambio), resultado);
  const anterior = (await baseDatos.doc("bookings/" + alta.bookingId).get()).data();
  const nueva = (await baseDatos.doc("bookings/" + resultado.newBookingId).get()).data();
  assert.equal(anterior.status, "rescheduled");
  assert.equal(anterior.rescheduledTo, resultado.newBookingId);
  assert.equal(nueva.rescheduledFrom, alta.bookingId);
  assert.equal(nueva.userId, cuentasPrueba.client);
  assert.equal(nueva.userName, "Prueba client");
  assert.equal(nueva.userEmail, cuentasPrueba.client + "@example.test");
  assert.equal(nueva.customerNotes, "Nota ficticia");
  assert.equal(nueva.serviceSnapshot.durationMin, 20);
  assert.equal(nueva.serviceSnapshot.price, 17);
  assert.equal(anterior.serviceSnapshot.durationMin, 30);
  for (const clave of anterior.lockKeys) assert.equal((await baseDatos.doc("bookingLocks/" + clave).get()).exists, false);
  for (const clave of nueva.lockKeys) assert.equal((await baseDatos.doc("bookingLocks/" + clave).get()).get("bookingId"), resultado.newBookingId);
});

test("reprogramar a un hueco ocupado o bloquearlo antes de escribir conserva la cita anterior", async () => {
  const alta = await conexiones.client.llamar("createBooking", solicitudReserva());
  await conexiones.otro.llamar("createBooking", solicitudReserva({ timeStr: "10:10" }));
  await assert.rejects(conexiones.client.llamar("rescheduleBooking", { bookingId: alta.bookingId, newDateStr: fechaPrueba(), newTimeStr: "10:10", barberPreference: "demo_worker_1", anyBarber: false }), { code: "functions/already-exists" });
  assert.equal((await baseDatos.doc("bookings/" + alta.bookingId).get()).get("status"), "pending");
  assert.equal((await baseDatos.collection("bookings").get()).size, 2);
  const solicitud = solicitudReserva({ timeStr: "12:10" });
  await conexiones.client.llamar("getAvailability", solicitud);
  await baseDatos.doc("blocks/nuevo").set({ barberUid: "demo_worker_1", type: "exception", dateStr: fechaPrueba(), start: "12:00", end: "13:00" });
  await assert.rejects(conexiones.client.llamar("createBooking", solicitud), { code: "functions/already-exists" });
});

test("transiciones validas y terminales, personal asignado y correo verificado", async () => {
  const alta = await conexiones.client.llamar("createBooking", solicitudReserva());
  await assert.rejects(conexiones.client.llamar("updateBookingStatus", { bookingId: alta.bookingId, nextStatus: "confirmed" }), { code: "functions/permission-denied" });
  await assert.rejects(conexiones.pendiente.llamar("createBooking", solicitudReserva()), { code: "functions/permission-denied" });
  await assert.rejects(conexiones.admin.llamar("updateBookingStatus", { bookingId: alta.bookingId, nextStatus: "done" }), { code: "functions/failed-precondition" });
  await conexiones.worker.llamar("updateBookingStatus", { bookingId: alta.bookingId, nextStatus: "confirmed" });
  await conexiones.worker.llamar("updateBookingStatus", { bookingId: alta.bookingId, nextStatus: "done" });
  await assert.rejects(conexiones.admin.llamar("updateBookingStatus", { bookingId: alta.bookingId, nextStatus: "pending" }), { code: "functions/failed-precondition" });
  await assert.rejects(conexiones.client.llamar("rescheduleBooking", { bookingId: alta.bookingId, newDateStr: fechaPrueba(8), newTimeStr: "09:10", barberPreference: "demo_worker_1", anyBarber: false }), { code: "functions/failed-precondition" });
  const ajena = await conexiones.client.llamar("createBooking", solicitudReserva({ timeStr: "12:00", barberPreference: "demo_worker_2" }));
  await assert.rejects(conexiones.worker.llamar("updateBookingStatus", { bookingId: ajena.bookingId, nextStatus: "confirmed" }), { code: "functions/permission-denied" });
  await conexiones.manager.llamar("updateBookingStatus", { bookingId: ajena.bookingId, nextStatus: "confirmed" });
  await conexiones.manager.llamar("updateBookingStatus", { bookingId: ajena.bookingId, nextStatus: "no_show" });
  await assert.rejects(conexiones.client.llamar("cancelBooking", { bookingId: ajena.bookingId }), { code: "functions/failed-precondition" });
});

test("consultas compartidas de cliente, profesional y gestion respetan los permisos de Firestore", async () => {
  await conexiones.client.llamar("createBooking", solicitudReserva());
  await conexiones.otro.llamar("createBooking", solicitudReserva({ timeStr: "12:10" }));
  const propias = await getDocs(query(collection(conexiones.client.datos, "bookings"), where("userId", "==", cuentasPrueba.client)));
  assert.equal(propias.size, 1);
  await assert.rejects(getDocs(collection(conexiones.client.datos, "bookings")), { code: "permission-denied" });
  const asignadas = await getDocs(query(collection(conexiones.worker.datos, "bookings"), where("barberUid", "==", cuentasPrueba.worker), where("dateStr", "==", fechaPrueba())));
  assert.equal(asignadas.size, 2);
  for (const rol of ["manager", "admin"]) assert.equal((await getDocs(query(collection(conexiones[rol].datos, "bookings"), where("dateStr", "==", fechaPrueba())))).size, 2);
});

test("limite de antelacion aplica a cancelacion y reprogramacion", async () => {
  const alta = await conexiones.client.llamar("createBooking", solicitudReserva());
  const referencia = baseDatos.doc("bookings/" + alta.bookingId);
  await referencia.update({ startAt: Timestamp.fromMillis(Date.now() + 12 * 3600000 - 60000) });
  await assert.rejects(conexiones.client.llamar("cancelBooking", { bookingId: alta.bookingId }), { code: "functions/failed-precondition" });
  await assert.rejects(conexiones.client.llamar("rescheduleBooking", { bookingId: alta.bookingId, newDateStr: fechaPrueba(8), newTimeStr: "09:10", barberPreference: "demo_worker_1", anyBarber: false }), { code: "functions/failed-precondition" });
  await referencia.update({ startAt: Timestamp.fromMillis(Date.now() + 12 * 3600000 + 60000) });
  await conexiones.client.llamar("cancelBooking", { bookingId: alta.bookingId });
});

test("las cinco operaciones de reservas rechazan peticiones sin sesion", async () => {
  const invitado = await conectarCuenta(null);
  try {
    for (const operacion of ["getAvailability", "createBooking", "cancelBooking", "rescheduleBooking", "updateBookingStatus"]) {
      await assert.rejects(invitado.llamar(operacion, solicitudReserva()), { code: "functions/unauthenticated" });
    }
  } finally { await invitado.cerrar(); }
});
