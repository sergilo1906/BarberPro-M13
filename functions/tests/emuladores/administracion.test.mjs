import { before, after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { doc, setDoc } from "firebase/firestore";
import { baseDatos, autenticacion, conectarCuenta, fechaPrueba } from "./datos-reservas.mjs";
import { asignarRolAutorizado } from "../../src/cuentas.js";
import { prepararDatosAdministracion } from "./datos-administracion.mjs";
import { prepararDatosProfesional } from "./datos-profesional.mjs";
const ficha = "admin-destino-escritorio";
function servicio(cambios = {}) { return { name: "Servicio ficticio", durationMin: 30, price: 15, active: false, expectedRevision: 0, requestId: randomUUID(), ...cambios }; }
function equipo(cambios = {}) { return { barberUid: ficha, name: "Nombre ficticio", active: false, expectedRevision: 0, requestId: randomUUID(), ...cambios }; }
function reglas(cambios = {}) { return { timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: [24, 2], expectedRevision: 0, requestId: randomUUID(), ...cambios }; }
before(prepararDatosAdministracion);
after(async () => { await prepararDatosAdministracion(); await prepararDatosProfesional(); await baseDatos.doc("config/app").set({ timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: [24, 2] }, { merge: false }); });

test("administrador revocado durante una asignacion no puede confirmar otro cambio de rol", async () => {
  const usuario = await autenticacion.getUser("reservas-admin");
  const identidadAnterior = { usuario, rol: "admin", version: usuario.customClaims?.roleVersion || 0 };
  const destino = "admin-destino-escritorio";
  const perfilAntes = (await baseDatos.doc("users/" + destino).get()).data();
  const claimsAntes = (await autenticacion.getUser(destino)).customClaims;
  try {
    await asignarRolAutorizado(usuario.uid, "client");
    await assert.rejects(asignarRolAutorizado(destino, "admin", identidadAnterior), { code: "permission-denied" });
    assert.deepEqual((await baseDatos.doc("users/" + destino).get()).data(), perfilAntes);
    assert.deepEqual((await autenticacion.getUser(destino)).customClaims, claimsAntes);
  } finally {
    await asignarRolAutorizado(usuario.uid, "admin");
  }
});

test("reasignar worker conserva ocultacion y nombre administrados de la ficha existente", async () => {
  const uid = "auditoria-ocultacion", email = uid + "@example.test";
  const cuenta = await conectarCuenta("admin");
  try {
    await autenticacion.createUser({ uid, email, emailVerified: true });
    await autenticacion.setCustomUserClaims(uid, { role: "worker", roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ role: "worker", roleVersion: 0, name: "Nombre de cuenta", email });
    await baseDatos.doc("barbers/" + uid).set({ role: "worker", linkedUserId: uid, active: false, isActive: false, name: "Nombre administrado", adminRevision: 0 });
    await cuenta.llamar("adminSetClaims", { uid, role: "worker" });
    const ficha = (await baseDatos.doc("barbers/" + uid).get()).data();
    assert.equal(ficha.active, false); assert.equal(ficha.isActive, false);
    assert.equal(ficha.name, "Nombre administrado"); assert.equal(ficha.adminRevision, 1);
  } finally {
    await baseDatos.doc("users/" + uid).delete(); await baseDatos.doc("barbers/" + uid).delete();
    await autenticacion.deleteUser(uid).catch(() => {}); await cuenta.cerrar();
  }
});

test("matriz administrativa exige sesion, verificacion y rol; SDK directo sigue cerrado", async () => {
  for (const rol of [null, "client", "worker", "pendiente"]) {
    const cuenta = await conectarCuenta(rol);
    try { for (const [nombre, datos] of [["saveService", servicio()], ["saveTeamProfile", equipo()], ["saveAgendaSettings", reglas()]]) await assert.rejects(cuenta.llamar(nombre, datos), (error) => ["functions/permission-denied", "functions/unauthenticated"].includes(error.code)); }
    finally { await cuenta.cerrar(); }
  }
  for (const rol of ["manager", "admin"]) {
    const cuenta = await conectarCuenta(rol);
    try {
      for (const ruta of ["services/sdk-directo", "barbers/" + ficha, "config/app"]) await assert.rejects(setDoc(doc(cuenta.datos, ruta), { name: "No autorizado" }), { code: "permission-denied" });
      if (rol === "manager") await assert.rejects(cuenta.llamar("saveAgendaSettings", reglas()), { code: "functions/permission-denied" });
    } finally { await cuenta.cerrar(); }
  }
});
test("servicio nuevo es idempotente incluso con dos peticiones simultaneas", async () => {
  const cuenta = await conectarCuenta("manager"), datos = servicio();
  try {
    const resultados = await Promise.all([cuenta.llamar("saveService", datos), cuenta.llamar("saveService", datos)]);
    assert.equal(resultados[0].id, resultados[1].id); assert.equal(resultados[0].revision, 1);
    assert.equal((await baseDatos.collection("services").where("name", "==", datos.name).get()).size, 1);
    await assert.rejects(cuenta.llamar("saveService", { ...datos, price: 99 }), { code: "functions/failed-precondition" });
  } finally { await cuenta.cerrar(); }
});
test("nombre, duracion, precio, visibilidad y revision invalidos se rechazan sin crear", async () => {
  const cuenta = await conectarCuenta("admin");
  try {
    for (const cambio of [{ name: " " }, { name: "a".repeat(101) }, { durationMin: 0 }, { durationMin: 7 }, { durationMin: 1445 }, { price: -1 }, { price: "15" }, { active: "true" }, { expectedRevision: -1 }]) await assert.rejects(cuenta.llamar("saveService", servicio(cambio)), { code: "functions/invalid-argument" });
    await assert.rejects(cuenta.llamar("saveTeamProfile", equipo({ name: "" })), { code: "functions/invalid-argument" });
    await assert.rejects(cuenta.llamar("saveTeamProfile", equipo({ barberUid: "ausente" })), { code: "functions/not-found" });
  } finally { await cuenta.cerrar(); }
});
test("dos ediciones de servicio con la misma revision no se sobrescriben", async () => {
  const cuenta = await conectarCuenta("manager");
  try {
    const creada = await cuenta.llamar("saveService", servicio({ name: "Carrera ficticia" }));
    const resultados = await Promise.allSettled([cuenta.llamar("saveService", servicio({ serviceId: creada.id, expectedRevision: 1, price: 20 })), cuenta.llamar("saveService", servicio({ serviceId: creada.id, expectedRevision: 1, price: 25 }))]);
    assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
    assert.equal((await baseDatos.doc("services/" + creada.id).get()).get("adminRevision"), 2);
  } finally { await cuenta.cerrar(); }
});
test("equipo conserva vinculo, email, horarios y rol; datos extra no escalan permisos", async () => {
  const cuenta = await conectarCuenta("manager");
  const semana = baseDatos.doc("barbers/" + ficha + "/weeklySchedules/2099-01-05");
  await semana.set({ published: false, prueba: "conservar" });
  try {
    const datos = equipo({ active: true, role: "admin", email: "otro@example.test", schedule: {}, linkedUserId: "otro" });
    const resultado = await cuenta.llamar("saveTeamProfile", datos); assert.equal(resultado.revision, 1);
    assert.deepEqual(await cuenta.llamar("saveTeamProfile", datos), resultado);
    const perfil = (await baseDatos.doc("barbers/" + ficha).get()).data();
    assert.equal(perfil.active, true); assert.equal(perfil.linkedUserId, ficha); assert.equal(perfil.email, ficha + "@example.test"); assert.equal(perfil.role, undefined); assert.equal(perfil.schedule, undefined);
    assert.equal((await baseDatos.doc("users/" + ficha).get()).get("role"), "client"); assert.equal((await semana.get()).get("prueba"), "conservar");
    await assert.rejects(cuenta.llamar("saveTeamProfile", equipo()), { code: "functions/failed-precondition" });
  } finally { await semana.delete(); await cuenta.cerrar(); }
});
test("configuracion valida zona, ventanas y margen; no acepta flags peligrosos", async () => {
  const cuenta = await conectarCuenta("admin");
  try {
    for (const cambio of [{ timezone: "Zona/Inexistente" }, { cancelWindowHours: 0 }, { reminderWindowsHours: [24, -1] }, { reminderWindowsHours: [] }, { reminderWindowsHours: ["2"] }]) await assert.rejects(cuenta.llamar("saveAgendaSettings", reglas(cambio)), { code: "functions/invalid-argument" });
    const datos = reglas({ cancelWindowHours: 24, reminderWindowsHours: [24, 24, 2], allowDemoTools: true });
    const resultado = await cuenta.llamar("saveAgendaSettings", datos); assert.equal(resultado.revision, 1);
    assert.deepEqual(await cuenta.llamar("saveAgendaSettings", datos), resultado);
    const configuracion = (await baseDatos.doc("config/app").get()).data();
    assert.equal(configuracion.cancelWindowHours, 24); assert.deepEqual(configuracion.reminderWindowsHours, [24, 2]); assert.equal(configuracion.allowDemoTools, undefined);
  } finally { await cuenta.cerrar(); }
});
test("un cambio de rol invalida el formulario antiguo del equipo", async () => {
  const gestion = await conectarCuenta("manager"), admin = await conectarCuenta("admin");
  try {
    const revision = Number((await baseDatos.doc("barbers/" + ficha).get()).get("adminRevision") || 0);
    await admin.llamar("adminSetClaims", { uid: ficha, role: "worker" });
    await assert.rejects(gestion.llamar("saveTeamProfile", equipo({ expectedRevision: revision, active: false })), { code: "functions/failed-precondition" });
    assert.equal((await baseDatos.doc("barbers/" + ficha).get()).get("active"), true);
    assert.equal((await baseDatos.doc("users/" + ficha).get()).get("role"), "worker");
  } finally { await admin.llamar("adminSetClaims", { uid: ficha, role: "client" }); await admin.cerrar(); await gestion.cerrar(); }
});
test("cambiar zona con citas existentes se rechaza conservando configuracion y citas", async () => {
  const cuenta = await conectarCuenta("admin"), antes = (await baseDatos.doc("config/app").get()).data();
  const referencia = baseDatos.doc("bookings/admin-conflicto-zona");
  await referencia.set({ dateStr: fechaPrueba(1), status: "confirmed", userId: "ficticio", barberUid: ficha });
  try {
    await assert.rejects(cuenta.llamar("saveAgendaSettings", reglas({ timezone: "Europe/London", expectedRevision: antes.adminRevision })), { code: "functions/failed-precondition" });
    assert.equal((await baseDatos.doc("config/app").get()).get("timezone"), "Europe/Madrid"); assert.equal((await referencia.get()).exists, true);
  } finally { await referencia.delete(); await cuenta.cerrar(); }
});
test("editar duracion afecta nuevas consultas y conserva snapshot y duracion de citas", async () => {
  const gestion = await conectarCuenta("admin"), cliente = await conectarCuenta("client");
  try {
    const creada = await gestion.llamar("saveService", servicio({ active: true, name: "Duracion ficticia" }));
    const cita = await cliente.llamar("createBooking", { serviceId: creada.id, dateStr: fechaPrueba(7), timeStr: "09:00", barberPreference: "profesional-otro", anyBarber: false, requestId: randomUUID() });
    const antes = (await baseDatos.doc("bookings/" + cita.bookingId).get()).data();
    await gestion.llamar("saveService", servicio({ serviceId: creada.id, expectedRevision: 1, durationMin: 60, price: 35, active: true }));
    const despues = (await baseDatos.doc("bookings/" + cita.bookingId).get()).data();
    assert.equal(despues.durationMin, 30); assert.deepEqual(despues.serviceSnapshot, antes.serviceSnapshot); assert.equal(despues.endAt.toMillis(), antes.endAt.toMillis());
    const disponibilidad = await cliente.llamar("getAvailability", { serviceId: creada.id, dateStr: fechaPrueba(7), barberPreference: "profesional-otro", anyBarber: false });
    assert.equal(disponibilidad.slots.some((hueco) => hueco.timeStr === "09:00"), false);
    await gestion.llamar("saveService", servicio({ serviceId: creada.id, expectedRevision: 2, active: false }));
    await assert.rejects(cliente.llamar("createBooking", { serviceId: creada.id, dateStr: fechaPrueba(7), timeStr: "12:00", barberPreference: "profesional-otro", anyBarber: false }), { code: "functions/failed-precondition" });
  } finally { await cliente.cerrar(); await gestion.cerrar(); }
});
