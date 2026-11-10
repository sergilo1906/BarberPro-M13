import { describe, it, expect } from "vitest";
import { validarHorarioFormulario, prepararHorarioFormulario } from "../../src/modulos/profesionales/formulario-horario";
import { obtenerLunesSemana, obtenerRangoPeriodo } from "../../src/comun/fechas";
import { comprobarTramoHorario } from "../../src/comun/formularios";

describe("horario profesional y calendario", () => {
  it("conserva defaults originales y descansos al normalizar semanas", () => {
    const horario = prepararHorarioFormulario();
    expect(horario.slot).toBe(30);
    expect(horario.days).toHaveLength(7);
    expect(horario.days.every((dia) => !dia.active && dia.ranges[0].start === "10:00" && dia.ranges[0].end === "20:00")).toBe(true);
    horario.days[1].active = true;
    horario.days[1].breaks = [{ start: "11:00", end: "11:30" }];
    const copia = prepararHorarioFormulario(horario);
    expect(copia.days[1].breaks).toEqual(horario.days[1].breaks);
    copia.days[1].breaks![0].start = "12:00";
    expect(horario.days[1].breaks[0].start).toBe("11:00");
    expect(() => validarHorarioFormulario(horario)).not.toThrow();
  });
  it("rechaza dias vacios, horas incompletas, intervalos invertidos, solapes y slots invalidos", () => {
    const horario = prepararHorarioFormulario();
    expect(() => validarHorarioFormulario(horario)).toThrow("Marca al menos");
    horario.days[1].active = true;
    horario.days[1].ranges = [{ start: "09:00", end: "14:00" }, { start: "13:30", end: "18:00" }];
    expect(() => validarHorarioFormulario(horario)).toThrow("solapados");
    horario.days[1].ranges[1].start = "14:00";
    expect(() => validarHorarioFormulario(horario)).not.toThrow();
    horario.slot = 0;
    expect(() => validarHorarioFormulario(horario)).toThrow("minutos");
    expect(comprobarTramoHorario("", "12:00")).not.toBe("");
    expect(comprobarTramoHorario("12:00", "11:00")).not.toBe("");
    expect(comprobarTramoHorario("09:00", "12:00")).toBe("");
    horario.days[1].ranges.push({ start: "18:00", end: "20:00" });
    expect(() => prepararHorarioFormulario(horario)).toThrow("mas de dos");
  });
  it("calcula lunes y periodos con dias de calendario en la zona del negocio", () => {
    expect(obtenerLunesSemana("2026-11-15")).toBe("2026-11-09");
    expect(obtenerLunesSemana("2026-02-30")).toBe("");
    expect(obtenerLunesSemana("2027-01-01")).toBe("2026-12-28");
    const rango = obtenerRangoPeriodo("week", "Europe/Madrid");
    expect((Date.parse(rango.hasta) - Date.parse(rango.desde)) / 86400000).toBe(6);
    const mes = obtenerRangoPeriodo("month", "Europe/Madrid");
    expect(mes.desde.endsWith("-01")).toBe(true);
    expect(Date.parse(mes.hasta)).toBeGreaterThan(Date.parse(mes.desde));
  });
});
