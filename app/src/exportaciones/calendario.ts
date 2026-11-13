import type { DatosCalendario } from "../modelos/interfaz";
function formatearInstante(iso: string): string {
    return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}
function escaparTexto(texto: string): string {
    return texto.replace(/\r/g, "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
function plegarLineaCalendario(linea: string): string {
    const codificador = new TextEncoder();
    const partes: string[] = [];
    let parte = "";
    let octetos = 0;
    // RFC 5545: plegar sin dividir los bytes de un carácter UTF-8.
    for (const caracter of linea) {
        const longitud = codificador.encode(caracter).length;
        if (octetos + longitud > 75) {
            partes.push(parte);
            parte = " ";
            octetos = 1;
        }
        parte += caracter;
        octetos += longitud;
    }
    partes.push(parte);
    return partes.join("\r\n");
}
export function crearContenidoCalendario(datos: DatosCalendario): string {
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Barber PRO//ES", "BEGIN:VEVENT",
        "UID:" + crypto.randomUUID() + "@barber-pro", "DTSTAMP:" + formatearInstante(new Date().toISOString()),
        "DTSTART:" + formatearInstante(datos.startUtc), "DTEND:" + formatearInstante(datos.endUtc),
        "SUMMARY:" + escaparTexto(datos.title), "DESCRIPTION:" + escaparTexto(datos.description || ""),
        "LOCATION:" + escaparTexto(datos.location || ""), "END:VEVENT", "END:VCALENDAR", ""].map(plegarLineaCalendario).join("\r\n");
}
export function descargarCalendario(datos: DatosCalendario): void {
    const url = URL.createObjectURL(new Blob([crearContenidoCalendario(datos)], { type: "text/calendar" }));
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = "cita.ics";
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
}
