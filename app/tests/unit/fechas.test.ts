import { describe, expect, it } from "vitest";
import { formatearFechaNegocio, sumarDiasCalendario } from "../../src/comun/fechas";
import { crearContenidoCalendario } from "../../src/exportaciones/calendario";

describe("fechas del negocio y calendario", () => {
  it("usa Madrid aunque el mismo instante pertenezca al dia anterior en otro pais", () => {
    const instante = new Date("2026-11-09T23:30:00Z");
    expect(formatearFechaNegocio("Europe/Madrid", instante)).toBe("2026-11-10");
    expect(formatearFechaNegocio("Pacific/Honolulu", instante)).toBe("2026-11-09");
    expect(sumarDiasCalendario("2026-12-20", 30)).toBe("2027-01-19");
  });
  it("genera UTC e impide inyectar otra linea de evento a traves del texto", () => {
    const contenido = crearContenidoCalendario({ title: "Corte, barba\nBEGIN:VEVENT", startUtc: "2026-11-10T08:10:00Z", endUtc: "2026-11-10T08:40:00Z" });
    expect(contenido).toContain("DTSTART:20261110T081000Z\r\n");
    expect(contenido.match(/\r\nBEGIN:VEVENT/g)?.length).toBe(1);
    expect(contenido).toContain("Corte\\, barba\\nBEGIN:VEVENT");
  });
});
