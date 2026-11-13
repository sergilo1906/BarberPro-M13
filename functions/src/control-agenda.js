import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
export function referenciaControl(baseDatos, uid, fecha) {
    return baseDatos.doc("bookingLocks/control_" + uid + "_" + fecha);
}
export function actualizarControl(transaccion, referencia, documento) {
    transaccion.set(referencia, {
        kind: "day_guard", revision: Number(documento.get("revision") || 0) + 1, updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
}
export async function leerControlesAgenda(transaccion, baseDatos, uid, fechas) {
    const controles = new Map();
    for (const fecha of [...fechas].sort()) {
        const referencia = referenciaControl(baseDatos, uid, fecha);
        controles.set(referencia.path, await transaccion.get(referencia));
    }
    return controles;
}
export function actualizarControlesAgenda(transaccion, controles) {
    for (const documento of controles.values()) {
        actualizarControl(transaccion, documento.ref, documento);
    }
}
export function obtenerOperacionAgenda(baseDatos, uid, tipo, datos) {
    const clave = createHash("sha256").update(JSON.stringify([uid, datos.requestId])).digest("hex");
    const huella = createHash("sha256").update(JSON.stringify({ tipo, datos })).digest("hex");
    return { referencia: baseDatos.doc("bookingLocks/agenda_operacion_" + clave), huella };
}
export async function leerResultadoOperacion(transaccion, operacion) {
    const documento = await transaccion.get(operacion.referencia);
    if (!documento.exists) {
        return null;
    }
    if (documento.get("fingerprint") !== operacion.huella) {
        throw new HttpsError("failed-precondition", "Identificador utilizado para otros datos.");
    }
    return documento.get("result");
}
export function guardarResultadoOperacion(transaccion, operacion, resultado) {
    transaccion.set(operacion.referencia, {
        kind: "request_guard", fingerprint: operacion.huella, result: resultado, createdAt: FieldValue.serverTimestamp()
    });
}
