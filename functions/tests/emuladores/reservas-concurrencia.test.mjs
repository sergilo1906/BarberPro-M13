import assert from "node:assert/strict";
import { before, beforeEach, after, test } from "node:test";
import { baseDatos, prepararCuentas, prepararAgenda, conectarCuenta, solicitudReserva, fechaPrueba } from "./datos-reservas.mjs";

let cliente;
let otroCliente;
before(async () => { await prepararCuentas(); cliente = await conectarCuenta(); otroCliente = await conectarCuenta("otro"); });
beforeEach(prepararAgenda);
after(async () => { await prepararAgenda(); await cliente.cerrar(); await otroCliente.cerrar(); });

test("dos solicitudes simultaneas al mismo hueco solo confirman una reserva", async () => {
  const resultados = await Promise.allSettled([
    cliente.llamar("createBooking", solicitudReserva({ requestId: "simultanea-1" })),
    otroCliente.llamar("createBooking", solicitudReserva({ requestId: "simultanea-2" })),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
  assert.equal((await baseDatos.collection("bookings").get()).size, 1);
  assert.equal((await baseDatos.collection("notifications").get()).size, 1);
});

test("intervalos parcialmente solapados de distinta duracion tampoco se confirman a la vez", async () => {
  const resultados = await Promise.allSettled([
    cliente.llamar("createBooking", solicitudReserva({ serviceId: "svc_combo", timeStr: "09:10" })),
    otroCliente.llamar("createBooking", solicitudReserva({ serviceId: "svc_beard", timeStr: "09:40" })),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
  assert.equal((await baseDatos.collection("bookings").get()).size, 1);
});

test("dos envios simultaneos del mismo requestId devuelven el mismo resultado", async () => {
  const solicitud = solicitudReserva({ requestId: "misma-operacion" });
  const resultados = await Promise.all([cliente.llamar("createBooking", solicitud), cliente.llamar("createBooking", solicitud)]);
  assert.deepEqual(resultados[0], resultados[1]);
  assert.equal((await baseDatos.collection("bookings").get()).size, 1);
});

test("dos reprogramaciones de la misma cita producen una unica sucesora", async () => {
  const inicial = await cliente.llamar("createBooking", solicitudReserva());
  const solicitud = { bookingId: inicial.bookingId, newDateStr: fechaPrueba(), newTimeStr: "10:10", barberPreference: "demo_worker_1", anyBarber: false };
  const resultados = await Promise.allSettled([
    cliente.llamar("rescheduleBooking", { ...solicitud, requestId: "cambio-1" }),
    cliente.llamar("rescheduleBooking", { ...solicitud, newTimeStr: "12:10", requestId: "cambio-2" }),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
  const citas = await baseDatos.collection("bookings").get();
  assert.equal(citas.size, 2);
  const anterior = citas.docs.find((documento) => documento.id === inicial.bookingId);
  const activa = citas.docs.find((documento) => documento.get("status") === "pending");
  assert.equal(anterior.get("rescheduledTo"), activa.id);
});

test("cancelacion y reprogramacion concurrentes mantienen historia y locks coherentes", async () => {
  const inicial = await cliente.llamar("createBooking", solicitudReserva());
  const resultados = await Promise.allSettled([
    cliente.llamar("cancelBooking", { bookingId: inicial.bookingId }),
    cliente.llamar("rescheduleBooking", { bookingId: inicial.bookingId, newDateStr: fechaPrueba(), newTimeStr: "12:10", barberPreference: "demo_worker_1", anyBarber: false }),
  ]);
  assert.equal(resultados.filter((resultado) => resultado.status === "fulfilled").length, 1);
  const citas = await baseDatos.collection("bookings").get();
  const locks = await baseDatos.collection("bookingLocks").get();
  for (const lock of locks.docs) {
    if (!lock.get("bookingId")) continue;
    const cita = citas.docs.find((documento) => documento.id === lock.get("bookingId"));
    assert.equal(cita.get("status"), "pending");
  }
  assert.ok(["cancelled", "rescheduled"].includes((await baseDatos.doc("bookings/" + inicial.bookingId).get()).get("status")));
});
