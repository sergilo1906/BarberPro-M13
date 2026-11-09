import assert from "node:assert/strict";
import { test } from "node:test";
import { validarFechaCalendario, convertirAFechaUtc, obtenerIntervaloUtc, obtenerLunesSemanaUtc, seSolapanTramos } from "../../src/fechas.js";
import { normalizarHorario } from "../../src/horarios.js";
import { generarHorasCandidatas, obtenerDuracionCita } from "../../src/disponibilidad.js";

test("calendario real, bisiesto, lunes y limites semiabiertos", () => {
  assert.equal(validarFechaCalendario("2028-02-29"), "2028-02-29");
  for (const fecha of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-1-1"]) assert.throws(() => validarFechaCalendario(fecha));
  assert.equal(obtenerLunesSemanaUtc("2026-11-15"), "2026-11-09");
  assert.equal(seSolapanTramos(0, 30, 30, 60), false);
  assert.equal(seSolapanTramos(0, 50, 30, 60), true);
});

test("zona IANA de negocio, verano/invierno y hora inexistente", () => {
  assert.equal(convertirAFechaUtc("2026-11-10", "09:00", "Europe/Madrid").toISOString(), "2026-11-10T08:00:00.000Z");
  assert.equal(convertirAFechaUtc("2026-07-10", "09:00", "Europe/Madrid").toISOString(), "2026-07-10T07:00:00.000Z");
  assert.throws(() => convertirAFechaUtc("2027-03-28", "02:30", "Europe/Madrid"));
  const repetida = convertirAFechaUtc("2026-10-25", "02:30", "Europe/Madrid");
  assert.equal(repetida.toISOString(), convertirAFechaUtc("2026-10-25", "02:30", "Europe/Madrid").toISOString());
  assert.throws(() => obtenerIntervaloUtc("2027-03-28", "01:30", 120, "Europe/Madrid"));
});

test("alineacion desde tramo, duracion completa, descansos y formato legado", () => {
  const days = Array.from({ length: 7 }, () => ({ active: true, start: "09:10", end: "11:00", breaks: [{ start: "10:00", end: "10:20" }] }));
  const horario = normalizarHorario({ slotMin: 15, days });
  const horas = generarHorasCandidatas(horario, "2026-11-10", 30);
  assert.deepEqual(horas, ["09:10", "09:25", "10:25"]);
  assert.equal(obtenerDuracionCita({ duration: 50 }), 50);
  assert.throws(() => normalizarHorario({ slot: 0 }));
  assert.throws(() => normalizarHorario({ days: [{ active: true, ranges: [{ start: "10:00", end: "09:00" }] }] }));
});
