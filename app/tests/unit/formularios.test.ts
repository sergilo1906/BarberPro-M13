import { describe, expect, it } from "vitest";
import { comprobarContacto, comprobarCorreo, comprobarFormulario } from "../../src/comun/formularios";
import { explicarErrorAcceso } from "../../src/comun/errores";

describe("formularios de cuentas", () => {
  it("rechaza campos vacios, correo invalido y contrasena corta", () => {
    expect(comprobarFormulario("", "")).not.toBe("");
    expect(comprobarCorreo("correo-invalido")).not.toBe("");
    expect(comprobarFormulario("ficticio@example.test", "123")).not.toBe("");
    expect(comprobarFormulario("ficticio@example.test", "Prueba123!")).toBe("");
  });
  it("limita los datos del perfil y permite telefono opcional", () => {
    expect(comprobarContacto(" ", "")).not.toBe("");
    expect(comprobarContacto("a".repeat(101), "")).not.toBe("");
    expect(comprobarContacto("Ana", "1".repeat(31))).not.toBe("");
    expect(comprobarContacto("Ana", "")).toBe("");
  });
  it("no distingue una cuenta inexistente de una clave equivocada", () => {
    expect(explicarErrorAcceso({ code: "auth/user-not-found" })).toBe(explicarErrorAcceso({ code: "auth/wrong-password" }));
    expect(explicarErrorAcceso({ code: "auth/network-request-failed" })).toContain("conexion");
  });
});
