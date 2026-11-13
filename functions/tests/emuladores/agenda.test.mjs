import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { doc, setDoc, getDoc, getDocs, collection, query, where, updateDoc } from "firebase/firestore";
import { cuentas, baseDatos, autenticacion, horario, fechaPrueba, prepararCuentas, prepararAgenda, conectarCuenta, solicitud } from "./datos-reservas.mjs";
let cliente, otro, admin, invitado, pendiente, worker, manager;
before(async () => {
  await prepararCuentas();
  [cliente,otro,admin,invitado,pendiente,worker,manager] = await Promise.all(["client","otro","admin",null,"pendiente","worker","manager"].map(conectarCuenta));
});
beforeEach(prepararAgenda);
after(async () => { for (const cuenta of [cliente,otro,admin,invitado,pendiente,worker,manager]) await cuenta?.cerrar(); });
const disponibilidad = () => ({serviceId:"corte",dateStr:fechaPrueba()});
test("invitado, correo sin verificar y roles retirados no operan", async () => {
  for (const cuenta of [invitado,pendiente,worker,manager]) {
    await assert.rejects(cuenta.llamar("getAvailability", disponibilidad()));
    await assert.rejects(getDoc(doc(cuenta.datos,"services/corte")));
  }
});
test("cliente sin permisos de gestion ni escritura directa de negocio", async () => {
  for (const nombre of ["saveService","saveSchedule","setClosedDay","completeBooking"]) await assert.rejects(cliente.llamar(nombre,{}), e => e.code === "functions/permission-denied");
  for (const ruta of ["bookings/falsa","bookingLocks/falso","services/falso","config/app","closedDays/2030-01-01","notifications/falsa","barbers/principal"]) await assert.rejects(setDoc(doc(cliente.datos,ruta),{role:"admin"}));
  await assert.rejects(updateDoc(doc(cliente.datos,"users/"+cuentas.client),{role:"admin"}));
  await assert.rejects(getDoc(doc(cliente.datos,"users/"+cuentas.otro)));
});
test("reserva confirmada idempotente, snapshot e identidad del servidor", async () => {
  const datos = solicitud({userId:cuentas.otro,barberPreference:"otro"});
  const primera = await cliente.llamar("createBooking",datos);
  const repetida = await cliente.llamar("createBooking",datos);
  assert.equal(primera.status,"confirmed"); assert.equal(primera.bookingId,repetida.bookingId);
  const cita = await baseDatos.doc("bookings/"+primera.bookingId).get();
  assert.equal(cita.get("userId"),cuentas.client); assert.equal(cita.get("barberUid"),"principal");
  assert.equal(cita.get("serviceSnapshot.price"),15); assert.equal((await baseDatos.collection("bookings").get()).size,1);
  await assert.rejects(cliente.llamar("createBooking",{...datos,timeStr:"10:00"}));
  await admin.llamar("saveService",{serviceId:"corte",name:"Nuevo",durationMin:60,price:50,active:true});
  assert.equal((await cita.ref.get()).get("serviceSnapshot.price"),15);
});
test("30 minutos y 60 minutos bloquean toda su duracion", async () => {
  const cita = await cliente.llamar("createBooking",solicitud({serviceId:"completo",timeStr:"09:30"}));
  const huecos = (await cliente.llamar("getAvailability",disponibilidad())).slots.map(h => h.timeStr);
  assert.equal(huecos.includes("09:30"),false); assert.equal(huecos.includes("10:00"),false); assert.equal(huecos.includes("10:30"),true);
  assert.equal((await baseDatos.doc("bookings/"+cita.bookingId).get()).get("lockKeys").length,2);
  await assert.rejects(otro.llamar("createBooking",solicitud({timeStr:"10:00"})));
});
test("cancelar libera el hueco, conserva idempotencia y no permite acceso ajeno", async () => {
  const datos = solicitud(); const cita = await cliente.llamar("createBooking",datos);
  await assert.rejects(otro.llamar("cancelBooking",{bookingId:cita.bookingId}));
  await assert.rejects(getDoc(doc(otro.datos,"bookings/"+cita.bookingId)));
  await cliente.llamar("cancelBooking",{bookingId:cita.bookingId}); await cliente.llamar("cancelBooking",{bookingId:cita.bookingId});
  assert.equal((await baseDatos.collection("bookingLocks").get()).size,0);
  assert.equal((await cliente.llamar("createBooking",datos)).status,"cancelled");
  assert.equal((await cliente.llamar("getAvailability",disponibilidad())).slots.some(h=>h.timeStr==="09:00"),true);
  await otro.llamar("createBooking",solicitud());
});
test("dos clientes simultaneos: solo una reserva incompatible de 30/60 tiene exito", async () => {
  const resultados = await Promise.allSettled([cliente.llamar("createBooking",solicitud({serviceId:"completo",timeStr:"09:00"})),otro.llamar("createBooking",solicitud({timeStr:"09:30"}))]);
  assert.equal(resultados.filter(r=>r.status==="fulfilled").length,1);
  assert.equal((await baseDatos.collection("bookings").get()).size,1);
});
test("reintentos simultaneos de una solicitud no duplican cita ni locks", async () => {
  const datos=solicitud(); const resultados=await Promise.all([cliente.llamar("createBooking",datos),cliente.llamar("createBooking",datos)]);
  assert.equal(resultados[0].bookingId,resultados[1].bookingId); assert.equal((await baseDatos.collection("bookingLocks").get()).size,1);
});
test("crear solo en cuadricula, servicio activo, jornada y proximos 30 dias", async () => {
  for (const cambios of [{timeStr:"09:15"},{timeStr:"14:00"},{timeStr:"13:30",serviceId:"completo"},{serviceId:"inactivo"},{dateStr:fechaPrueba(-1)},{dateStr:fechaPrueba(31)},{dateStr:"2030-02-30"}]) await assert.rejects(cliente.llamar("createBooking",solicitud(cambios)));
});
test("cerrar y reabrir una fecha cambia disponibilidad y confirmacion", async () => {
  await admin.llamar("setClosedDay",{dateStr:fechaPrueba(),closed:true});
  assert.equal((await cliente.llamar("getAvailability",disponibilidad())).slots.length,0);
  await assert.rejects(cliente.llamar("createBooking",solicitud()));
  await admin.llamar("setClosedDay",{dateStr:fechaPrueba(),closed:false});
  await cliente.llamar("createBooking",solicitud());
  await assert.rejects(admin.llamar("setClosedDay",{dateStr:fechaPrueba(),closed:true}));
});
test("cerrar un dia y crear una cita a la vez nunca producen un cierre con cita", async () => {
  await Promise.allSettled([admin.llamar("setClosedDay",{dateStr:fechaPrueba(),closed:true}),cliente.llamar("createBooking",solicitud())]);
  const cerrado=(await baseDatos.doc("closedDays/"+fechaPrueba()).get()).exists;
  const citas=(await baseDatos.collection("bookings").get()).size;
  assert.equal(cerrado && citas>0,false); assert.equal(cerrado || citas===1,true);
});
test("horario habitual valida citas existentes y aplica el nuevo horario", async () => {
  await baseDatos.doc("config/app").update({campoHistorico:"conservar"});
  await cliente.llamar("createBooking",solicitud());
  const nuevo=horario(); nuevo.forEach(d=>d.ranges=[{start:"10:00",end:"14:00"}]);
  await assert.rejects(admin.llamar("saveSchedule",{timezone:"Europe/Madrid",days:nuevo}));
  await assert.rejects(admin.llamar("saveSchedule",{timezone:"UTC",days:horario()}));
  nuevo.forEach(d=>d.ranges=[{start:"09:00",end:"12:00"}]);
  await admin.llamar("saveSchedule",{timezone:"Europe/Madrid",days:nuevo});
  assert.equal((await baseDatos.doc("config/app").get()).get("campoHistorico"),"conservar");
  const huecos=(await cliente.llamar("getAvailability",disponibilidad())).slots;
  assert.equal(huecos.some(h=>h.timeStr==="12:00"),false);
});
test("cambiar horario y reservar simultaneamente mantienen la cita dentro de jornada", async () => {
  const nuevo=horario(); nuevo.forEach(d=>d.ranges=[{start:"10:00",end:"14:00"}]);
  await Promise.allSettled([admin.llamar("saveSchedule",{timezone:"Europe/Madrid",days:nuevo}),cliente.llamar("createBooking",solicitud())]);
  const citas=(await baseDatos.collection("bookings").get()).size;
  const inicio=(await baseDatos.doc("config/app").get()).get("days")[0].ranges[0].start;
  assert.equal(citas===1 && inicio==="10:00",false);
});
test("admin ve agenda y completa, cliente solo ve sus citas y no completa", async () => {
  const reserva=await cliente.llamar("createBooking",solicitud());
  assert.equal((await getDocs(query(collection(admin.datos,"bookings"),where("dateStr","==",fechaPrueba())))).size,1);
  assert.equal((await getDocs(query(collection(cliente.datos,"bookings"),where("userId","==",cuentas.client)))).size,1);
  await assert.rejects(getDocs(collection(cliente.datos,"bookings")));
  await admin.llamar("completeBooking",{bookingId:reserva.bookingId}); await admin.llamar("completeBooking",{bookingId:reserva.bookingId});
  assert.equal((await baseDatos.doc("bookings/"+reserva.bookingId).get()).get("status"),"done");
  await assert.rejects(cliente.llamar("cancelBooking",{bookingId:reserva.bookingId}));
  await admin.llamar("setClosedDay",{dateStr:fechaPrueba(),closed:true});
});
test("una cuenta deshabilitada no puede crear reservas con un token anterior", async () => {
  await autenticacion.updateUser(cuentas.otro,{disabled:true});
  try { await assert.rejects(otro.llamar("createBooking",solicitud())); }
  finally { await autenticacion.updateUser(cuentas.otro,{disabled:false}); }
});
test("datos antiguos permanecen de solo lectura y no se convierten en confirmados", async () => {
  const resultado=await cliente.llamar("createBooking",solicitud());
  await baseDatos.doc("bookings/"+resultado.bookingId).update({status:"pending"});
  await assert.rejects(admin.llamar("completeBooking",{bookingId:resultado.bookingId}));
  await assert.rejects(cliente.llamar("cancelBooking",{bookingId:resultado.bookingId}));
  assert.equal((await baseDatos.doc("bookings/"+resultado.bookingId).get()).get("status"),"pending");
  assert.equal((await cliente.llamar("getAvailability",disponibilidad())).slots.some(h=>h.timeStr==="09:00"),false);
});
test("claims desactualizados dejan de autorizar las funciones y las reglas", async () => {
  await autenticacion.setCustomUserClaims(cuentas.admin,{role:"client",roleVersion:1});
  await baseDatos.doc("users/"+cuentas.admin).update({role:"client",roleVersion:1});
  await assert.rejects(admin.llamar("saveService",{serviceId:"x",name:"X",durationMin:30,price:1,active:true}));
  await assert.rejects(getDoc(doc(admin.datos,"services/corte")));
  // Restaurar el actor sin renovar su token para no alterar las demas pruebas.
  await autenticacion.setCustomUserClaims(cuentas.admin,{role:"admin",roleVersion:0});
  await baseDatos.doc("users/"+cuentas.admin).update({role:"admin",roleVersion:0});
});

