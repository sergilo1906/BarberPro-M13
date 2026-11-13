import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
// Identifica el recurso de la barbería; no es el UID de una persona.
export const UID_PROFESIONAL = "principal";
export function validarVentanasRecordatorio(valores, codigo = "failed-precondition") {
    if (!Array.isArray(valores) || !valores.length || valores.length > 20) {
        throw new HttpsError(codigo, "Avisos previos no validos.");
    }
    for (const horas of valores) {
        const limite = Date.now() + horas * 3600000 + 900000;
        if (typeof horas !== "number" || !Number.isFinite(horas) || horas <= 0 || !Number.isFinite(limite) || limite > 253402300799999) {
            throw new HttpsError(codigo, "Avisos previos no validos.");
        }
    }
    return [...new Set(valores)];
}
export async function obtenerConfiguracionAgenda(transaccion = null) {
    const referencia = obtenerServiciosAdministrativos().baseDatos.doc("config/app");
    const documento = transaccion ? await transaccion.get(referencia) : await referencia.get();
    const datos = documento.data() || {};
    const timezone = datos.timezone || datos.tz || "Europe/Madrid";
    const cancelWindowHours = Number(datos.cancelWindowHours ?? 12);
    try {
        new Intl.DateTimeFormat("es", { timeZone: timezone }).format();
    }
    catch {
        throw new HttpsError("failed-precondition", "La zona horaria del negocio no es valida.");
    }
    if (!Number.isFinite(cancelWindowHours) || cancelWindowHours < 0) {
        throw new HttpsError("failed-precondition", "El margen de cancelacion no es valido.");
    }
    return { timezone, cancelWindowHours };
}
