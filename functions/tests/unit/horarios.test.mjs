import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizarSemanaEntrada, normalizarBloqueoEntrada } from "../../src/persistencia-horarios.js";
import { enumerarDias, obtenerIntervaloUtc } from "../../src/fechas.js";

function semana() {
  const days = [];
  for (let dia = 0; dia < 7; dia++) days.push({ active: dia === 1, ranges: dia === 1 ? [{ start: "09:00", end: "14:00" }] : [], breaks: [] });
  return { barberUid: "profesional", requestId: "operacion", weekStart: "2026-11-09", expectedRevision: 0, published: false, slot: 15, days };
}
test("entrada semanal admite siete dias y conserva descansos sin aceptar contratos manipulados", () => {
  const datos = semana(); datos.days[1].breaks.push({ start: "11:00", end: "11:20" });
  assert.equal(normalizarSemanaEntrada(datos).days[1].breaks.length, 1);
  for (const cambio of [{ weekStart: "2026-11-10" }, { published: 1 }, { expectedRevision: -1 }, { slot: 0 }, { days: [] }]) assert.throws(() => normalizarSemanaEntrada({ ...datos, ...cambio }));
  datos.days[1].ranges.push({ start: "13:00", end: "16:00" });
  assert.throws(() => normalizarSemanaEntrada(datos));
});
test("bloqueos validan tipos, fechas reales, limites inclusivos y cambios de hora", () => {
  const datos = { barberUid: "profesional", requestId: "operacion", type: "vacation", startDate: "2026-12-31", endDate: "2027-01-01", reason: "" };
  assert.equal(normalizarBloqueoEntrada(datos).startDate, "2026-12-31");
  assert.deepEqual(enumerarDias(datos.startDate, datos.endDate), ["2026-12-31", "2027-01-01"]);
  assert.throws(() => normalizarBloqueoEntrada({ ...datos, endDate: "2026-02-30" }));
  assert.throws(() => normalizarBloqueoEntrada({ ...datos, type: "nuevo" }));
  assert.throws(() => enumerarDias("2026-01-01", "2027-01-02"));
  assert.throws(() => obtenerIntervaloUtc("2026-03-29", "01:30", 120, "Europe/Madrid"));
  assert.equal(obtenerIntervaloUtc("2026-12-01", "09:00", 60, "Europe/Madrid").inicio.toISOString(), "2026-12-01T08:00:00.000Z");
});
