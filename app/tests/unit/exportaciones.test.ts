import { describe, it, expect } from "vitest";
import { convertirACsv, escaparCeldaCsv } from "../../src/exportaciones/csv";
describe("CSV de agenda", () => {
  it("conserva cabeceras, Unicode, comillas, comas y saltos reales", () => {
    const csv = convertirACsv([{ fecha: "2026-11-10", cliente: 'José, "Pepe"\r\nSegunda linea', precio: 15.5 }]);
    expect(csv).toBe('fecha,cliente,precio\r\n2026-11-10,"José, ""Pepe""\r\nSegunda linea",15.5');
    expect(convertirACsv([])).toBe("");
  });
  it("no deja formulas ejecutables y conserva numeros negativos como numeros", () => {
    for (const entrada of ["=1+1", "+SUM(A1)", "-2+3", "@SUM(A1)", "  =1", "\t=1", "\r=1"]) expect(escaparCeldaCsv(entrada)).toContain("'");
    expect(escaparCeldaCsv(-15)).toBe("-15"); expect(escaparCeldaCsv("Corte normal")).toBe("Corte normal");
  });
});
