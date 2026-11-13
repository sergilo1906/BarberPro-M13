import { HttpsError, onCall } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarSesion, comprobarUid } from "./permisos.js";
import { obtenerConfiguracionAgenda } from "./configuracion.js";
import { cargarSemanaPublicada, cargarBloqueosDia } from "./horarios.js";
import { validarFechaCalendario, convertirHoraAMinutos, convertirMinutosAHora, obtenerIndiceDia, seSolapanTramos, obtenerIntervaloUtc, comprobarAnticipacion } from "./fechas.js";
export const ESTADOS_OCUPANTES = ["pending", "confirmed", "done", "no_show"];
export function validarIdentificador(valor) {
    return comprobarUid(valor);
}
export function normalizarSeleccionProfesional(datos) {
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
        throw new HttpsError("invalid-argument", "Faltan los datos de seleccion.");
    }
    if (datos.anyBarber !== undefined && typeof datos.anyBarber !== "boolean") {
        throw new HttpsError("invalid-argument", "Seleccion de profesional no valida.");
    }
    const anyBarber = datos.anyBarber === true;
    const barberPreference = datos.barberPreference === "" || datos.barberPreference === undefined ? null : datos.barberPreference;
    if (barberPreference !== null) {
        validarIdentificador(barberPreference);
    }
    if (!anyBarber && !barberPreference) {
        throw new HttpsError("invalid-argument", "Selecciona un profesional.");
    }
    return { anyBarber, barberPreference };
}
export async function cargarServicio(id, transaccion = null) {
    const referencia = obtenerServiciosAdministrativos().baseDatos.doc("services/" + validarIdentificador(id));
    const documento = transaccion ? await transaccion.get(referencia) : await referencia.get();
    if (!documento.exists || documento.get("active") === false) {
        throw new HttpsError("failed-precondition", "Servicio no disponible.");
    }
    const datos = documento.data();
    const duracion = Number(datos.durationMin ?? 30);
    const precio = Number(datos.price ?? 0);
    if (!Number.isInteger(duracion) || duracion <= 0 || duracion > 1440 || !Number.isFinite(precio) || precio < 0) {
        throw new HttpsError("failed-precondition", "Datos de servicio no validos.");
    }
    return {
        id: documento.id, name: String(datos.name || "Servicio"), durationMin: duracion, price: precio
    };
}
export async function cargarProfesionalesActivos(transaccion = null) {
    const consulta = obtenerServiciosAdministrativos().baseDatos.collection("barbers");
    const documentos = transaccion ? await transaccion.get(consulta) : await consulta.get();
    const profesionales = [];
    for (const documento of documentos.docs) {
        const datos = documento.data();
        if (datos.active === false || datos.isActive === false) {
            continue;
        }
        profesionales.push({
            uid: documento.id, name: String(datos.name || datos.displayName || documento.id), order: Number(datos.order ?? Number.MAX_SAFE_INTEGER)
        });
    }
    profesionales.sort((primero, segundo) => primero.order - segundo.order || primero.uid.localeCompare(segundo.uid));
    return profesionales;
}
export function ordenarProfesionalesCandidatos(profesionales, preferencia, cualquiera) {
    if (!cualquiera) {
        validarIdentificador(preferencia);
        return profesionales.filter((profesional) => profesional.uid === preferencia);
    }
    if (preferencia) {
        validarIdentificador(preferencia);
    }
    const resultado = [];
    for (const profesional of profesionales) {
        if (profesional.uid === preferencia) {
            resultado.push(profesional);
        }
    }
    for (const profesional of profesionales) {
        if (profesional.uid !== preferencia) {
            resultado.push(profesional);
        }
    }
    return resultado;
}
export function obtenerDuracionCita(cita) {
    const duracion = Number(cita.serviceSnapshot?.durationMin ?? cita.durationMin ?? cita.duration ?? 30);
    if (!Number.isInteger(duracion) || duracion <= 0 || duracion > 1440) {
        throw new HttpsError("failed-precondition", "Duracion de cita no valida.");
    }
    return duracion;
}
export async function cargarCitasOcupantes(uid, fecha, transaccion = null) {
    const consulta = obtenerServiciosAdministrativos().baseDatos.collection("bookings").where("barberUid", "==", uid).where("dateStr", "==", fecha);
    const documentos = transaccion ? await transaccion.get(consulta) : await consulta.get();
    const citas = [];
    for (const documento of documentos.docs) {
        const datos = documento.data();
        if (!ESTADOS_OCUPANTES.includes(datos.status || "pending")) {
            continue;
        }
        const inicio = convertirHoraAMinutos(datos.timeStr);
        citas.push({
            id: documento.id, start: inicio, end: inicio + obtenerDuracionCita(datos)
        });
    }
    return citas;
}
async function cargarOcupacionBloqueos(uid, fecha, intervalo, transaccion) {
    const consulta = obtenerServiciosAdministrativos().baseDatos.collection("bookingLocks").where("barberUid", "==", uid).where("dateStr", "==", fecha);
    const documentos = transaccion ? await transaccion.get(consulta) : await consulta.get();
    const ocupacion = [];
    for (const documento of documentos.docs) {
        const datos = documento.data();
        if (!datos.bookingId || !datos.timeStr) {
            continue;
        }
        const inicio = convertirHoraAMinutos(datos.timeStr);
        const duracion = Number(datos.slotMin || intervalo);
        if (!Number.isInteger(duracion) || duracion <= 0 || duracion > 1440) {
            throw new HttpsError("failed-precondition", "Bloqueo de ocupacion no valido.");
        }
        ocupacion.push({
            id: datos.bookingId, start: inicio, end: inicio + duracion
        });
    }
    return ocupacion;
}
export function cabeEnHorario(horario, fecha, inicio, duracion) {
    const dia = horario?.days[obtenerIndiceDia(fecha)];
    if (!dia?.active) {
        return false;
    }
    let encaja = false;
    for (const tramo of dia.ranges) {
        // Se alinea desde el inicio del tramo, igual que las horas mostradas al cliente.
        if (inicio >= tramo.start && inicio + duracion <= tramo.end && (inicio - tramo.start) % horario.slotMin === 0) {
            encaja = true;
        }
    }
    if (!encaja) {
        return false;
    }
    for (const descanso of dia.breaks) {
        if (seSolapanTramos(inicio, inicio + duracion, descanso.start, descanso.end)) {
            return false;
        }
    }
    return true;
}
export function generarHorasCandidatas(horario, fecha, duracion) {
    const horas = new Set();
    const dia = horario?.days[obtenerIndiceDia(fecha)];
    if (!dia?.active) {
        return [];
    }
    for (const tramo of dia.ranges) {
        for (let inicio = tramo.start; inicio + duracion <= tramo.end; inicio += horario.slotMin) {
            if (cabeEnHorario(horario, fecha, inicio, duracion)) {
                horas.add(convertirMinutosAHora(inicio));
            }
        }
    }
    return Array.from(horas).sort();
}
export function estaBloqueadoElHueco(inicio, duracion, intervalos, ignorarId = null) {
    for (const intervalo of intervalos) {
        if (intervalo.id !== ignorarId && seSolapanTramos(inicio, inicio + duracion, intervalo.start, intervalo.end)) {
            return true;
        }
    }
    return false;
}
export async function calcularDisponibilidadProfesional(uid, fecha, servicio, zona, transaccion = null, ignorarId = null) {
    const horario = await cargarSemanaPublicada(uid, fecha, transaccion);
    if (!horario) {
        return { horario: null, availableTimes: [] };
    }
    const bloqueos = await cargarBloqueosDia(uid, fecha, transaccion);
    const citas = await cargarCitasOcupantes(uid, fecha, transaccion);
    const ocupacionBloqueos = await cargarOcupacionBloqueos(uid, fecha, horario.slotMin, transaccion);
    const horas = generarHorasCandidatas(horario, fecha, servicio.durationMin);
    const disponibles = [];
    for (const hora of horas) {
        const inicio = convertirHoraAMinutos(hora);
        if (estaBloqueadoElHueco(inicio, servicio.durationMin, bloqueos) || estaBloqueadoElHueco(inicio, servicio.durationMin, citas, ignorarId) || estaBloqueadoElHueco(inicio, servicio.durationMin, ocupacionBloqueos, ignorarId)) {
            continue;
        }
        try {
            const intervalo = obtenerIntervaloUtc(fecha, hora, servicio.durationMin, zona);
            if (intervalo.inicio.getTime() > Date.now()) {
                disponibles.push(hora);
            }
        }
        catch (error) {
            if (error.code !== "failed-precondition") {
                throw error;
            }
        }
    }
    return { horario, availableTimes: disponibles };
}
export const getAvailability = onCall(async (peticion) => {
    await comprobarSesion(peticion, true);
    const seleccion = normalizarSeleccionProfesional(peticion.data);
    const fecha = validarFechaCalendario(peticion.data?.dateStr);
    const configuracion = await obtenerConfiguracionAgenda();
    comprobarAnticipacion(fecha, configuracion.timezone);
    const servicio = await cargarServicio(peticion.data?.serviceId);
    const profesionales = ordenarProfesionalesCandidatos(await cargarProfesionalesActivos(), seleccion.barberPreference, seleccion.anyBarber);
    const huecos = new Map();
    for (const profesional of profesionales) {
        const disponibilidad = await calcularDisponibilidadProfesional(profesional.uid, fecha, servicio, configuracion.timezone);
        for (const hora of disponibilidad.availableTimes) {
            if (!huecos.has(hora)) {
                huecos.set(hora, profesional.uid);
            }
        }
    }
    const slots = [];
    for (const [timeStr, barberUid] of huecos) {
        slots.push({ timeStr, barberUid });
    }
    slots.sort((primero, segundo) => primero.timeStr.localeCompare(segundo.timeStr));
    return { ok: true, slots };
});
