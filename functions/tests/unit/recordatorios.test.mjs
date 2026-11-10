import { test } from "node:test";
import assert from "node:assert/strict";
import { estaEnVentanaRecordatorio, obtenerTipoRecordatorio } from "../../src/recordatorios.js";
import { validarVentanasRecordatorio } from "../../src/configuracion.js";
import { crearHorarioDemo, vaciarColeccionDemo } from "../../src/demostracion.js";
test("ventanas inclusivas de quince minutos usan UTC tambien al cambiar horario", () => {
  const ahora = new Date("2026-10-24T01:30:00Z");
  assert.equal(estaEnVentanaRecordatorio(new Date("2026-10-25T01:15:00Z"), ahora, 24), true);
  assert.equal(estaEnVentanaRecordatorio(new Date("2026-10-25T01:45:00Z"), ahora, 24), true);
  assert.equal(estaEnVentanaRecordatorio(new Date("2026-10-25T01:45:00.001Z"), ahora, 24), false);
  assert.equal(estaEnVentanaRecordatorio(ahora, ahora, 0.01), false);
  assert.equal(estaEnVentanaRecordatorio(new Date(NaN), ahora, 2), false);
});
test("ventanas distintas mantienen claves distintas y rechazan desbordamientos", () => {
  assert.equal(obtenerTipoRecordatorio(24), "reminder_24h"); assert.equal(obtenerTipoRecordatorio(2), "reminder_2h"); assert.equal(obtenerTipoRecordatorio(6), "reminder_6h");
  assert.deepEqual(validarVentanasRecordatorio([24, 2, 24]), [24, 2]);
  for (const entrada of [[Infinity], [1e300], [0], [-1], ["2"], []]) assert.throws(() => validarVentanasRecordatorio(entrada));
});
test("horario demo conserva domingo libre, sabado corto y dos tramos entre semana", () => {
  const horario = crearHorarioDemo("2035-03-26"); assert.equal(horario.days.length, 7); assert.equal(horario.days[0].active, false); assert.deepEqual(horario.days[0].ranges, []);
  assert.deepEqual(horario.days[6].ranges, [{ start: "09:00", end: "14:00" }]); assert.equal(horario.days[1].ranges.length, 2); assert.equal(horario.slot, 15); assert.equal(horario.published, true);
});
test("herramientas demo rechazan cualquier entorno productivo antes de acceder a datos", async () => {
  const anterior = process.env.GCLOUD_PROJECT; process.env.GCLOUD_PROJECT = "proyecto-no-autorizado";
  try { await assert.rejects(vaciarColeccionDemo("bookings"), /emuladores locales/); }
  finally { if (anterior === undefined) delete process.env.GCLOUD_PROJECT; else process.env.GCLOUD_PROJECT = anterior; }
});
