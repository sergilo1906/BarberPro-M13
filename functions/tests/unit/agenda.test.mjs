import test from "node:test";
import assert from "node:assert/strict";
import { validarHorario, cabeEnHorario } from "../../src/horarios.js";
import { calcularHorasLibres, validarDuracion } from "../../src/disponibilidad.js";
import { validarFechaCalendario, obtenerIntervaloUtc } from "../../src/fechas.js";
import { normalizarRolEntrada, ROLES } from "../../src/permisos.js";
const days = () => Array.from({length: 7}, () => ({active: true, ranges: [{start: "09:00", end: "11:00"}, {start: "12:00", end: "13:00"}]}));
test("solo dos roles; ningun rol historico se convierte en administrador", () => {
  assert.deepEqual(ROLES, ["client", "admin"]); assert.equal(normalizarRolEntrada("cliente"), "client");
  for (const rol of ["worker", "manager", "barbero", null]) assert.throws(() => normalizarRolEntrada(rol));
});
test("valida siete dias, como maximo dos tramos, sin solapes y cuadricula de 30", () => {
  assert.equal(validarHorario(days()).length, 7);
  for (const modificar of [d => d.pop(), d => d[0].ranges.push({start:"14:00",end:"15:00"}), d => d[0].ranges[0].start="09:15", d => d[0].ranges[1].start="10:30"]) {
    const d = days(); modificar(d); assert.throws(() => validarHorario(d));
  }
});
test("un servicio completo cabe en un tramo y nunca cruza la pausa", () => {
  assert.equal(cabeEnHorario(days(), "2030-01-01", 600, 60), true);
  assert.equal(cabeEnHorario(days(), "2030-01-01", 630, 60), false);
  assert.equal(cabeEnHorario(days(), "2030-01-01", 555, 30), false);
  for (const v of [15,45,90,"30"]) assert.throws(() => validarDuracion(v));
});
test("mismo motor de huecos excluye duracion completa, ocupacion y pasado", () => {
  const config = {timezone:"Europe/Madrid",days:days()};
  assert.deepEqual(calcularHorasLibres(config,"2030-01-01",60,[{inicio:570,fin:600}],new Date("2029-01-01")), ["10:00","12:00"]);
  assert.deepEqual(calcularHorasLibres(config,"2030-01-01",30,[],new Date("2031-01-01")), []);
});
test("calendario real y cambios de hora IANA", () => {
  assert.throws(() => validarFechaCalendario("2030-02-30"));
  assert.throws(() => obtenerIntervaloUtc("2027-03-28","02:00",30,"Europe/Madrid"));
  assert.throws(() => obtenerIntervaloUtc("2027-03-28","01:30",60,"Europe/Madrid"));
  assert.equal(obtenerIntervaloUtc("2030-01-01","09:00",30,"Europe/Madrid").inicio.toISOString(), "2030-01-01T08:00:00.000Z");
});

