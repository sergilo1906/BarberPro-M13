import { it, expect } from "vitest";
import { calcularIndicadores, contarServicios, contarProfesionales, obtenerDuracionEstadistica } from "../../src/modulos/estadisticas/calculos";
import type { Cita } from "../../src/modelos/agenda";
const citas = ["pending", "confirmed", "done", "cancelled", "no_show", "rescheduled"].map((status, indice) => ({ id: String(indice), status, durationMin: 30, barberUid: indice < 3 ? "uno" : "dos", serviceSnapshot: { name: indice < 3 ? "Corte" : "Barba", durationMin: 30 } } as Cita));
it("seis registros con una reprogramacion representan cinco citas y 120 minutos ocupados", () => {
  expect(calcularIndicadores(citas)).toEqual({ total: 5, confirmadas: 1, hechas: 1, incidencias: 2, minutos: 120 });
  expect(contarServicios(citas)).toEqual([["Corte", 3], ["Barba", 2]]);
  expect(contarProfesionales(citas, new Map([["uno", "Alex"], ["dos", "Marta"]]))).toEqual([["Alex", 3], ["Marta", 2]]);
});
it("vacíos y duraciones legadas invalidas no producen NaN ni horas negativas", () => {
  expect(calcularIndicadores([])).toEqual({ total: 0, confirmadas: 0, hechas: 0, incidencias: 0, minutos: 0 });
  expect(obtenerDuracionEstadistica({ durationMin: NaN, serviceSnapshot: {} } as Cita)).toBe(0);
  expect(obtenerDuracionEstadistica({ durationMin: -30 } as Cita)).toBe(0);
});
