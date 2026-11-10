import { test } from "node:test";
import assert from "node:assert/strict";
import { validarServicio, validarReglasAgenda } from "../../src/administracion.js";
const base = { expectedRevision: 0, requestId: "ficticio" };
test("validacion administrativa no convierte textos en precios o booleanos", () => {
  assert.equal(validarServicio({ ...base, name: " Corte ", durationMin: 30, price: 0, active: true }).name, "Corte");
  for (const datos of [{ price: NaN }, { price: Infinity }, { durationMin: 2.5 }, { active: 1 }]) assert.throws(() => validarServicio({ ...base, name: "Corte", durationMin: 30, price: 15, active: true, ...datos }));
});
test("reglas administrativas validan zonas reales y no descartan avisos incorrectos", () => {
  assert.deepEqual(validarReglasAgenda({ ...base, timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: [24, 2, 24] }).reminderWindowsHours, [24, 2]);
  for (const horas of [[NaN], [Infinity], [0], [-1], []]) assert.throws(() => validarReglasAgenda({ ...base, timezone: "Europe/Madrid", cancelWindowHours: 12, reminderWindowsHours: horas }));
});
