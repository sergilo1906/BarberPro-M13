import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { aplicarFiltrosCitas, puedeGestionarCita, obtenerEtiquetaEstadoCliente, obtenerServicioCita } from "../../src/comun/estados-cita";
import { esFechaCalendarioValida, obtenerInicioCita } from "../../src/comun/fechas";
import type { Cita } from "../../src/modelos/agenda";

const cita = { id: "propia", userId: "cliente", dateStr: "2026-11-10", timeStr: "10:00", status: "pending", serviceSnapshot: { id: "svc_haircut" } } as Cita;
describe("presentacion y limites de las citas del cliente", () => {
  it("clasifica por el estado persistido y mantiene el historial en los filtros", () => {
    const cancelada = { ...cita, id: "cancelada", status: "cancelled" } as Cita;
    expect(aplicarFiltrosCitas([cita, cancelada], "", "all")).toHaveLength(2);
    expect(aplicarFiltrosCitas([cita, cancelada], "2026-11-10", "cancelled")).toEqual([cancelada]);
    expect(aplicarFiltrosCitas([cita], "2026-11-11", "all")).toEqual([]);
    expect(obtenerEtiquetaEstadoCliente("rescheduled")).toBe("Cambiada");
    expect(obtenerServicioCita(cita)).toBe("svc_haircut");
  });
  it("aplica exactamente el margen, usa timestamps y nunca ofrece acciones terminales", () => {
    const ahora = new Date("2026-11-09T21:00:00Z");
    expect(puedeGestionarCita(cita, 12, "Europe/Madrid", ahora)).toBe(true);
    expect(puedeGestionarCita(cita, 12, "Europe/Madrid", new Date(ahora.getTime() + 1))).toBe(false);
    for (const status of ["cancelled", "done", "no_show", "rescheduled"] as const) expect(puedeGestionarCita({ ...cita, status }, 0, "Europe/Madrid", ahora)).toBe(false);
    expect(obtenerInicioCita({ ...cita, startAt: Timestamp.fromDate(ahora) }, "Europe/Madrid")).toEqual(ahora);
  });
  it("convierte datos legados en la zona del negocio y rechaza fechas/horas imposibles", () => {
    expect(obtenerInicioCita(cita, "Europe/Madrid").toISOString()).toBe("2026-11-10T09:00:00.000Z");
    expect(obtenerInicioCita({ ...cita, dateStr: "2026-07-01" }, "Europe/Madrid").toISOString()).toBe("2026-07-01T08:00:00.000Z");
    expect(esFechaCalendarioValida("2026-02-30")).toBe(false);
    expect(esFechaCalendarioValida("2028-02-29")).toBe(true);
    expect(puedeGestionarCita({ ...cita, dateStr: "2026-03-29", timeStr: "02:30" }, 0, "Europe/Madrid", new Date("2026-01-01"))).toBe(false);
  });
});
