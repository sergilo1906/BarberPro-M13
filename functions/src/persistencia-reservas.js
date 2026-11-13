import { createHash } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { obtenerConfiguracionAgenda } from "./configuracion.js";
import { validarFechaCalendario, validarHora, convertirHoraAMinutos, convertirMinutosAHora, comprobarAnticipacion, comprobarFechaFutura, obtenerIntervaloUtc } from "./fechas.js";
import { calcularDisponibilidadProfesional, cargarProfesionalesActivos, ordenarProfesionalesCandidatos, cargarServicio, validarIdentificador, normalizarSeleccionProfesional } from "./disponibilidad.js";
import { comprobarIdentidadTransaccion } from "./permisos.js";
import { referenciaControl, actualizarControl } from "./control-agenda.js";
const TRANSICIONES = {
    pending: ["confirmed", "cancelled"], confirmed: ["done", "no_show", "cancelled"], cancelled: [], done: [], no_show: [], rescheduled: []
};
export function normalizarSolicitudReserva(datos, esCambio = false) {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        throw new HttpsError("invalid-argument", "Faltan los datos de la reserva.");
    }
    const seleccion = normalizarSeleccionProfesional(datos);
    const solicitud = {
        dateStr: validarFechaCalendario(esCambio ? datos.newDateStr : datos.dateStr),
        timeStr: validarHora(esCambio ? datos.newTimeStr : datos.timeStr),
        serviceId: esCambio ? datos.serviceId || null : validarIdentificador(datos.serviceId),
        barberPreference: seleccion.barberPreference, anyBarber: seleccion.anyBarber,
        customerPhone: leerTextoLimitado(datos.customerPhone, 30), customerNotes: leerTextoLimitado(datos.customerNotes, 2000),
        requestId: datos.requestId === undefined ? null : validarIdentificador(datos.requestId),
        bookingId: esCambio ? validarIdentificador(datos.bookingId) : null,
    };
    return solicitud;
}
export function leerTextoLimitado(valor, maximo) {
    if (valor === undefined || valor === null) {
        return "";
    }
    if (typeof valor !== "string" || valor.trim().length > maximo) {
        throw new HttpsError("invalid-argument", "Texto no valido o demasiado largo.");
    }
    return valor.trim();
}
function obtenerOperacion(baseDatos, identidad, solicitud, tipo) {
    if (!solicitud.requestId) {
        return null;
    }
    const clave = createHash("sha256").update(JSON.stringify([identidad.usuario.uid, solicitud.requestId])).digest("hex");
    const huella = createHash("sha256").update(JSON.stringify({ ...solicitud, tipo })).digest("hex");
    return { referencia: baseDatos.doc("bookingLocks/operacion_" + clave), huella };
}
function comprobarGestionReserva(identidad, cita, configuracion) {
    const uid = identidad.usuario.uid;
    const gestion = identidad.rol === "admin" || identidad.rol === "manager" || (identidad.rol === "worker" && cita.barberUid === uid);
    if (!gestion && cita.userId !== uid) {
        throw new HttpsError("permission-denied", "Solo puedes gestionar tus citas.");
    }
    if (!gestion) {
        const inicio = cita.startAt?.toDate?.() || comprobarFechaFutura(cita.dateStr, cita.timeStr, configuracion.timezone);
        if ((inicio.getTime() - Date.now()) / 3600000 < configuracion.cancelWindowHours) {
            throw new HttpsError("failed-precondition", "Solo se puede cambiar o cancelar con " + configuracion.cancelWindowHours + " h de margen.");
        }
    }
}
export function crearClavesBloqueo(uid, fecha, inicio, duracion, intervalo) {
    const claves = [];
    for (let minuto = inicio; minuto < inicio + duracion; minuto += intervalo) {
        claves.push(uid + "_" + fecha + "_" + convertirMinutosAHora(minuto));
    }
    return claves;
}
async function leerBloqueosReserva(transaccion, baseDatos, claves) {
    const bloqueos = new Map();
    for (const clave of new Set(claves)) {
        if (typeof clave !== "string" || clave.includes("/") || clave.length > 1500) {
            throw new HttpsError("failed-precondition", "Bloqueos de reserva no validos.");
        }
        const referencia = baseDatos.doc("bookingLocks/" + clave);
        bloqueos.set(clave, await transaccion.get(referencia));
    }
    return bloqueos;
}
export function liberarBloqueosReserva(transaccion, bloqueos, idReserva, conservar = new Set()) {
    for (const [clave, documento] of bloqueos) {
        if (!conservar.has(clave) && documento.exists && documento.get("bookingId") === idReserva) {
            transaccion.delete(documento.ref);
        }
    }
}
async function prepararDestino(transaccion, baseDatos, solicitud, servicio, configuracion, citaAnterior) {
    const profesionales = ordenarProfesionalesCandidatos(await cargarProfesionalesActivos(transaccion), solicitud.barberPreference, solicitud.anyBarber);
    if (!profesionales.length) {
        throw new HttpsError("failed-precondition", "No hay profesionales disponibles.");
    }
    const referenciasControl = new Map();
    if (citaAnterior) {
        const referencia = referenciaControl(baseDatos, citaAnterior.barberUid, validarFechaCalendario(citaAnterior.dateStr));
        referenciasControl.set(referencia.path, referencia);
    }
    for (const profesional of profesionales) {
        const referencia = referenciaControl(baseDatos, profesional.uid, solicitud.dateStr);
        referenciasControl.set(referencia.path, referencia);
    }
    const controles = new Map();
    for (const ruta of Array.from(referenciasControl.keys()).sort()) {
        controles.set(ruta, await transaccion.get(referenciasControl.get(ruta)));
    }
    for (const profesional of profesionales) {
        const disponibilidad = await calcularDisponibilidadProfesional(profesional.uid, solicitud.dateStr, servicio, configuracion.timezone, transaccion, citaAnterior?.id);
        if (disponibilidad.availableTimes.includes(solicitud.timeStr)) {
            return {
                profesional, intervalo: disponibilidad.horario.slotMin, controles
            };
        }
    }
    throw new HttpsError("already-exists", "No hay disponibilidad para ese horario.");
}
export async function intentarCrearReservaAtomica(identidad, datos, esCambio = false) {
    const solicitud = normalizarSolicitudReserva(datos, esCambio);
    const { baseDatos } = obtenerServiciosAdministrativos();
    const referenciaNueva = baseDatos.collection("bookings").doc();
    const operacion = obtenerOperacion(baseDatos, identidad, solicitud, esCambio ? "reschedule" : "create");
    return baseDatos.runTransaction(async (transaccion) => {
        // Confirmar permisos vigentes antes de recuperar o crear la operación.
        const perfil = await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
        if (operacion) {
            const anterior = await transaccion.get(operacion.referencia);
            if (anterior.exists) {
                if (anterior.get("fingerprint") !== operacion.huella) {
                    throw new HttpsError("failed-precondition", "El identificador de operacion ya se utilizo con otros datos.");
                }
                return anterior.get("result");
            }
        }
        // Todas las consultas de servicio, jornada y ocupación preceden a las escrituras.
        const configuracion = await obtenerConfiguracionAgenda(transaccion);
        let citaAnterior = null;
        let referenciaAnterior = null;
        let perfilPropietario = perfil;
        if (esCambio) {
            referenciaAnterior = baseDatos.doc("bookings/" + solicitud.bookingId);
            const documento = await transaccion.get(referenciaAnterior);
            if (!documento.exists) {
                throw new HttpsError("not-found", "Reserva no encontrada.");
            }
            citaAnterior = { ...documento.data(), id: documento.id };
            validarIdentificador(citaAnterior.userId);
            comprobarGestionReserva(identidad, citaAnterior, configuracion);
            if (!["pending", "confirmed"].includes(citaAnterior.status || "pending")) {
                throw new HttpsError("failed-precondition", "Solo se puede reprogramar una reserva pendiente o confirmada.");
            }
            if (citaAnterior.userId !== identidad.usuario.uid) {
                const propietario = await transaccion.get(baseDatos.doc("users/" + citaAnterior.userId));
                perfilPropietario = propietario.data() || {};
            }
        }
        comprobarAnticipacion(solicitud.dateStr, configuracion.timezone);
        comprobarFechaFutura(solicitud.dateStr, solicitud.timeStr, configuracion.timezone);
        const servicio = await cargarServicio(citaAnterior ? citaAnterior.serviceId || citaAnterior.serviceSnapshot?.id || solicitud.serviceId : solicitud.serviceId, transaccion);
        const destino = await prepararDestino(transaccion, baseDatos, solicitud, servicio, configuracion, citaAnterior);
        const uidProfesional = destino.profesional.uid;
        const clavesNuevas = crearClavesBloqueo(uidProfesional, solicitud.dateStr, convertirHoraAMinutos(solicitud.timeStr), servicio.durationMin, destino.intervalo);
        const bloqueos = await leerBloqueosReserva(transaccion, baseDatos, [...clavesNuevas, ...(citaAnterior?.lockKeys || [])]);
        if (bloqueos.size > 450) {
            throw new HttpsError("failed-precondition", "La reserva requiere demasiados documentos de ocupacion.");
        }
        for (const clave of clavesNuevas) {
            const bloqueo = bloqueos.get(clave);
            if (bloqueo.exists && bloqueo.get("bookingId") !== citaAnterior?.id) {
                throw new HttpsError("already-exists", "Horario ocupado. Actualiza la disponibilidad.");
            }
        }
        const intervalo = obtenerIntervaloUtc(solicitud.dateStr, solicitud.timeStr, servicio.durationMin, configuracion.timezone);
        if (intervalo.inicio.getTime() <= Date.now()) {
            throw new HttpsError("failed-precondition", "La hora seleccionada ya ha pasado.");
        }
        // Preparar el documento en memoria no modifica la cita anterior.
        const citaNueva = {
            userId: citaAnterior?.userId || identidad.usuario.uid,
            userEmail: citaAnterior ? citaAnterior.userEmail || perfilPropietario.email || "" : identidad.usuario.email || "",
            userName: citaAnterior?.userName || perfilPropietario.name || "",
            userPhone: citaAnterior ? citaAnterior.userPhone || "" : solicitud.customerPhone,
            customerNotes: citaAnterior ? citaAnterior.customerNotes || "" : solicitud.customerNotes,
            barberUid: uidProfesional, serviceId: servicio.id,
            serviceSnapshot: {
                name: servicio.name, durationMin: servicio.durationMin, price: servicio.price
            },
            durationMin: servicio.durationMin, dateStr: solicitud.dateStr, timeStr: solicitud.timeStr,
            status: "pending", lockKeys: clavesNuevas, startAt: Timestamp.fromDate(intervalo.inicio), endAt: Timestamp.fromDate(intervalo.fin),
            createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
        };
        if (citaAnterior) {
            citaNueva.rescheduledFrom = citaAnterior.id;
        }
        // A partir de aquí no se hace ninguna lectura. Cita, locks, controles,
        // historial y confirmación se confirman o fallan como una sola operación.
        if (citaAnterior) {
            liberarBloqueosReserva(transaccion, bloqueos, citaAnterior.id, new Set(clavesNuevas));
            transaccion.update(referenciaAnterior, {
                status: "rescheduled", rescheduledTo: referenciaNueva.id, updatedAt: FieldValue.serverTimestamp()
            });
        }
        transaccion.create(referenciaNueva, citaNueva);
        for (const clave of clavesNuevas) {
            const horaBloqueo = convertirMinutosAHora(convertirHoraAMinutos(solicitud.timeStr) + clavesNuevas.indexOf(clave) * destino.intervalo);
            transaccion.set(baseDatos.doc("bookingLocks/" + clave), {
                bookingId: referenciaNueva.id, barberUid: uidProfesional, dateStr: solicitud.dateStr, timeStr: horaBloqueo, slotMin: Math.min(destino.intervalo, servicio.durationMin - clavesNuevas.indexOf(clave) * destino.intervalo),
                createdAt: FieldValue.serverTimestamp(), expiresAt: Timestamp.fromMillis(intervalo.fin.getTime() + 86400000),
            });
        }
        const controlNuevo = referenciaControl(baseDatos, uidProfesional, solicitud.dateStr);
        actualizarControl(transaccion, controlNuevo, destino.controles.get(controlNuevo.path));
        if (citaAnterior) {
            const controlAnterior = referenciaControl(baseDatos, citaAnterior.barberUid, citaAnterior.dateStr);
            if (controlAnterior.path !== controlNuevo.path) {
                actualizarControl(transaccion, controlAnterior, destino.controles.get(controlAnterior.path));
            }
        }
        transaccion.create(baseDatos.doc("notifications/confirmation_" + referenciaNueva.id), {
            bookingId: referenciaNueva.id, userId: citaNueva.userId, channel: "in_app", kind: "confirmation", status: "queued",
            payload: {
                dateStr: solicitud.dateStr, timeStr: solicitud.timeStr, barberUid: uidProfesional, serviceName: servicio.name
            },
            createdAt: FieldValue.serverTimestamp(),
        });
        const resultado = esCambio
            ? {
                ok: true, oldBookingId: citaAnterior.id, newBookingId: referenciaNueva.id, status: "rescheduled"
            }
            : {
                ok: true, bookingId: referenciaNueva.id, barberUid: uidProfesional, status: "pending", startAt: intervalo.inicio.toISOString(), endAt: intervalo.fin.toISOString()
            };
        if (operacion) {
            transaccion.create(operacion.referencia, {
                kind: "request_guard", fingerprint: operacion.huella, result: resultado, createdAt: FieldValue.serverTimestamp()
            });
        }
        return resultado;
    });
}
export async function cambiarEstadoReserva(identidad, datos, esCancelacion = false) {
    const idReserva = validarIdentificador(datos?.bookingId);
    const siguienteEstado = esCancelacion ? "cancelled" : datos?.nextStatus;
    if (typeof siguienteEstado !== "string" || !Object.hasOwn(TRANSICIONES, siguienteEstado)) {
        throw new HttpsError("invalid-argument", "Estado no valido.");
    }
    const motivo = leerTextoLimitado(datos?.reason, 500);
    const { baseDatos } = obtenerServiciosAdministrativos();
    return baseDatos.runTransaction(async (transaccion) => {
        await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
        const referencia = baseDatos.doc("bookings/" + idReserva);
        const documento = await transaccion.get(referencia);
        if (!documento.exists) {
            throw new HttpsError("not-found", "Reserva no encontrada.");
        }
        const cita = documento.data();
        const configuracion = await obtenerConfiguracionAgenda(transaccion);
        if (esCancelacion) {
            comprobarGestionReserva(identidad, cita, configuracion);
        }
        else if (!["worker", "manager", "admin"].includes(identidad.rol) || (identidad.rol === "worker" && cita.barberUid !== identidad.usuario.uid)) {
            throw new HttpsError("permission-denied", "No puedes cambiar el estado de esta cita.");
        }
        const estadoActual = cita.status || "pending";
        if (esCancelacion && estadoActual === "cancelled") {
            return {
                ok: true, bookingId: idReserva, status: "cancelled"
            };
        }
        if (!TRANSICIONES[estadoActual]?.includes(siguienteEstado)) {
            throw new HttpsError("failed-precondition", "Transicion invalida.");
        }
        const control = referenciaControl(baseDatos, cita.barberUid, validarFechaCalendario(cita.dateStr));
        const estadoControl = await transaccion.get(control);
        const bloqueos = await leerBloqueosReserva(transaccion, baseDatos, cita.lockKeys || []);
        const cambios = { status: siguienteEstado, updatedAt: FieldValue.serverTimestamp() };
        if (siguienteEstado === "cancelled") {
            Object.assign(cambios, {
                cancelledBy: identidad.rol, cancelledAt: FieldValue.serverTimestamp(), cancelReason: motivo
            });
            liberarBloqueosReserva(transaccion, bloqueos, idReserva);
        }
        transaccion.update(referencia, cambios);
        actualizarControl(transaccion, control, estadoControl);
        return {
            ok: true, bookingId: idReserva, status: siguienteEstado
        };
    });
}
