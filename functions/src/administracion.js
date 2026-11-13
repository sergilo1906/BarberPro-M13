import { FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { formatInTimeZone } from "date-fns-tz";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarSesion, comprobarUid, comprobarIdentidadTransaccion } from "./permisos.js";
import { obtenerConfiguracionAgenda, validarVentanasRecordatorio } from "./configuracion.js";
import { ESTADOS_OCUPANTES } from "./disponibilidad.js";
import { obtenerOperacionAgenda, leerResultadoOperacion, guardarResultadoOperacion } from "./control-agenda.js";
function nombreValido(valor) {
    if (typeof valor !== "string" || !valor.trim() || valor.trim().length > 100) {
        throw new HttpsError("invalid-argument", "Escribe un nombre de hasta 100 caracteres.");
    }
    return valor.trim();
}
function comprobarRevision(datos) {
    comprobarUid(datos?.requestId);
    if (!Number.isInteger(datos.expectedRevision) || datos.expectedRevision < 0) {
        throw new HttpsError("invalid-argument", "Revision no valida.");
    }
}
export function validarServicio(datos) {
    comprobarRevision(datos);
    if (!Number.isInteger(datos.durationMin) || datos.durationMin < 5 || datos.durationMin > 1440 || datos.durationMin % 5 !== 0
        || typeof datos.price !== "number" || !Number.isFinite(datos.price) || datos.price < 0 || typeof datos.active !== "boolean") {
        throw new HttpsError("invalid-argument", "Revisa nombre, duracion y precio.");
    }
    return {
        name: nombreValido(datos.name), durationMin: datos.durationMin, price: datos.price, active: datos.active
    };
}
export function validarReglasAgenda(datos) {
    comprobarRevision(datos);
    if (typeof datos.timezone !== "string" || !datos.timezone.trim()) {
        throw new HttpsError("invalid-argument", "Zona horaria no valida.");
    }
    const timezone = datos.timezone.trim();
    try {
        new Intl.DateTimeFormat("es", { timeZone: timezone }).format();
    }
    catch {
        throw new HttpsError("invalid-argument", "Zona horaria no valida.");
    }
    if (typeof datos.cancelWindowHours !== "number" || !Number.isFinite(datos.cancelWindowHours) || datos.cancelWindowHours <= 0
        || !Array.isArray(datos.reminderWindowsHours) || !datos.reminderWindowsHours.length || datos.reminderWindowsHours.length > 20) {
        throw new HttpsError("invalid-argument", "Reglas de agenda no validas.");
    }
    return {
        timezone, cancelWindowHours: datos.cancelWindowHours, reminderWindowsHours: validarVentanasRecordatorio(datos.reminderWindowsHours, "invalid-argument")
    };
}
async function guardarAdministracion(identidad, tipo, entrada) {
    if (!["manager", "admin"].includes(identidad.rol) || (tipo === "reglas" && identidad.rol !== "admin")) {
        throw new HttpsError("permission-denied", "Acceso denegado.");
    }
    comprobarRevision(entrada);
    let cambios;
    if (tipo === "servicio") {
        cambios = validarServicio(entrada);
    }
    else if (tipo === "reglas") {
        cambios = validarReglasAgenda(entrada);
    }
    else {
        if (typeof entrada.active !== "boolean") {
            throw new HttpsError("invalid-argument", "Visibilidad no valida.");
        }
        cambios = {
            name: nombreValido(entrada.name), active: entrada.active, isActive: entrada.active
        };
    }
    const { baseDatos } = obtenerServiciosAdministrativos();
    let referencia;
    if (tipo === "equipo") {
        referencia = baseDatos.doc("barbers/" + comprobarUid(entrada.barberUid));
    }
    else if (tipo === "reglas") {
        referencia = baseDatos.doc("config/app");
    }
    else {
        referencia = entrada.serviceId ? baseDatos.doc("services/" + comprobarUid(entrada.serviceId)) : baseDatos.collection("services").doc();
    }
    const operacion = obtenerOperacionAgenda(baseDatos, identidad.usuario.uid, tipo, entrada);
    return baseDatos.runTransaction(async (transaccion) => {
        await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
        const anterior = await leerResultadoOperacion(transaccion, operacion);
        if (anterior) {
            return anterior;
        }
        const documento = await transaccion.get(referencia);
        if (!documento.exists && (tipo === "equipo" || (tipo === "servicio" && entrada.serviceId))) {
            throw new HttpsError("not-found", "El registro no existe.");
        }
        if (Number(documento.get("adminRevision") || 0) !== entrada.expectedRevision) {
            throw new HttpsError("failed-precondition", "Los datos han cambiado. Vuelve a cargarlos.");
        }
        if (tipo === "reglas") {
            const configuracion = await obtenerConfiguracionAgenda(transaccion);
            if (configuracion.timezone !== cambios.timezone) {
                // Las citas guardan fecha local y timestamps. No se reinterpretan citas
                // pendientes al cambiar de zona: requiere una migración explícita aparte.
                const hoy = formatInTimeZone(new Date(), configuracion.timezone, "yyyy-MM-dd");
                const citas = await transaccion.get(baseDatos.collection("bookings").where("dateStr", ">=", hoy));
                if (citas.docs.some((cita) => ESTADOS_OCUPANTES.includes(cita.get("status") || "pending"))) {
                    throw new HttpsError("failed-precondition", "Hay citas existentes. No cambies su zona horaria sin una migracion.");
                }
            }
        }
        const revision = entrada.expectedRevision + 1;
        const payload = {
            ...cambios, adminRevision: revision, updatedAt: FieldValue.serverTimestamp()
        };
        if (!documento.exists && tipo === "servicio") {
            payload.createdAt = FieldValue.serverTimestamp();
        }
        // Solo estos campos están permitidos: nunca se guardan roles, vínculos,
        // horarios ni flags demo recibidos libremente desde el navegador.
        transaccion.set(referencia, payload, { merge: true });
        const resultado = {
            ok: true, id: referencia.id, revision
        };
        guardarResultadoOperacion(transaccion, operacion, resultado);
        return resultado;
    });
}
export const saveTeamProfile = onCall(async (peticion) => guardarAdministracion(await comprobarSesion(peticion, true), "equipo", peticion.data));
export const saveService = onCall(async (peticion) => guardarAdministracion(await comprobarSesion(peticion, true), "servicio", peticion.data));
export const saveAgendaSettings = onCall(async (peticion) => guardarAdministracion(await comprobarSesion(peticion, true), "reglas", peticion.data));
