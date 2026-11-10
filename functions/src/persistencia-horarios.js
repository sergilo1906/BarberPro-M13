import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarSesion, comprobarUid, comprobarIdentidadTransaccion } from "./permisos.js";
import { obtenerConfiguracionAgenda } from "./configuracion.js";
import { normalizarHorario, normalizarTramos } from "./horarios.js";
import { ESTADOS_OCUPANTES, obtenerDuracionCita } from "./disponibilidad.js";
import { validarFechaCalendario, convertirHoraAMinutos, convertirAFechaUtc, obtenerIntervaloUtc, obtenerIndiceDia, obtenerLunesSemanaUtc, enumerarDias, sumarDiasCalendario, seSolapanTramos } from "./fechas.js";
import { leerControlesAgenda, actualizarControlesAgenda, obtenerOperacionAgenda, leerResultadoOperacion, guardarResultadoOperacion } from "./control-agenda.js";

function autorizarProfesional(identidad, uid) {
  if (!["worker", "manager", "admin"].includes(identidad.rol) || (identidad.rol === "worker" && uid !== identidad.usuario.uid)) {
    throw new HttpsError("permission-denied", "No puedes modificar esta agenda.");
  }
}
export function normalizarSemanaEntrada(datos) {
  const barberUid = comprobarUid(datos?.barberUid);
  const requestId = comprobarUid(datos?.requestId);
  const weekStart = validarFechaCalendario(datos.weekStart);
  if (weekStart !== obtenerLunesSemanaUtc(weekStart)) throw new HttpsError("invalid-argument", "La semana debe empezar en lunes.");
  if (!Number.isInteger(datos.expectedRevision) || datos.expectedRevision < 0 || typeof datos.published !== "boolean" || !Number.isInteger(datos.slot)) throw new HttpsError("invalid-argument", "Datos de semana no validos.");
  if (!Array.isArray(datos.days) || datos.days.length !== 7) throw new HttpsError("invalid-argument", "La semana necesita siete dias.");
  const days = [];
  for (const dia of datos.days) {
    if (!dia || typeof dia.active !== "boolean" || !Array.isArray(dia.ranges) || dia.ranges.length > 2 || (dia.active && !dia.ranges.length)) throw new HttpsError("invalid-argument", "Dia o tramos no validos.");
    normalizarTramos(dia.ranges);
    if (dia.breaks !== undefined && !Array.isArray(dia.breaks)) throw new HttpsError("invalid-argument", "Descansos no validos.");
    normalizarTramos(dia.breaks || []);
    const ranges = dia.active ? dia.ranges.map((tramo) => ({ start: tramo.start, end: tramo.end })) : [];
    days.push({ active: dia.active, ranges, start: ranges[0]?.start || "10:00", end: ranges[0]?.end || "20:00", breaks: (dia.breaks || []).map((tramo) => ({ start: tramo.start, end: tramo.end })) });
  }
  if (!days.some((dia) => dia.active)) throw new HttpsError("invalid-argument", "Marca al menos un dia de trabajo.");
  normalizarHorario({ days, slot: datos.slot });
  return { barberUid, requestId, weekStart, days, slot: datos.slot, published: datos.published, expectedRevision: datos.expectedRevision };
}
export function normalizarBloqueoEntrada(datos) {
  const barberUid = comprobarUid(datos?.barberUid), requestId = comprobarUid(datos?.requestId);
  if (!["exception", "break", "internal", "vacation"].includes(datos.type)) throw new HttpsError("invalid-argument", "Tipo de bloqueo no valido.");
  if (datos.reason !== undefined && (typeof datos.reason !== "string" || datos.reason.trim().length > 500)) throw new HttpsError("invalid-argument", "Motivo no valido.");
  const bloqueo = { barberUid, type: datos.type, reason: (datos.reason || "").trim() };
  if (bloqueo.type === "vacation") {
    bloqueo.startDate = validarFechaCalendario(datos.startDate); bloqueo.endDate = validarFechaCalendario(datos.endDate);
    enumerarDias(bloqueo.startDate, bloqueo.endDate);
  } else {
    bloqueo.dateStr = validarFechaCalendario(datos.dateStr);
    normalizarTramos([{ start: datos.start, end: datos.end }]);
    bloqueo.start = datos.start; bloqueo.end = datos.end;
  }
  return { ...bloqueo, requestId };
}
function fechasBloqueo(bloqueo) {
  return bloqueo.type === "vacation" ? enumerarDias(bloqueo.startDate, bloqueo.endDate) : [validarFechaCalendario(bloqueo.dateStr)];
}
async function leerOcupacion(transaccion, baseDatos, uid, desde, hasta) {
  const consulta = baseDatos.collection("bookings").where("barberUid", "==", uid).where("dateStr", ">=", desde).where("dateStr", "<=", hasta);
  const citas = await transaccion.get(consulta);
  const ocupacion = [];
  for (const documento of citas.docs) {
    const cita = documento.data();
    if (!ESTADOS_OCUPANTES.includes(cita.status || "pending")) continue;
    const inicio = convertirHoraAMinutos(cita.timeStr);
    ocupacion.push({ fecha: validarFechaCalendario(cita.dateStr), inicio, fin: inicio + obtenerDuracionCita(cita) });
  }
  const celdas = await transaccion.get(baseDatos.collection("bookingLocks").where("barberUid", "==", uid).where("dateStr", ">=", desde).where("dateStr", "<=", hasta));
  for (const documento of celdas.docs) {
    const celda = documento.data();
    const inicio = convertirHoraAMinutos(celda.timeStr);
    const duracion = Number(celda.slotMin || 30);
    if (!Number.isFinite(duracion) || duracion <= 0 || duracion > 1440) throw new HttpsError("failed-precondition", "Ocupacion legada no valida.");
    ocupacion.push({ fecha: validarFechaCalendario(celda.dateStr), inicio, fin: inicio + duracion });
  }
  return ocupacion;
}
function comprobarCitasEnHorario(ocupacion, horario) {
  for (const intervalo of ocupacion) {
    const dia = horario.days[obtenerIndiceDia(intervalo.fecha)];
    let encaja = false;
    if (dia.active) for (const tramo of dia.ranges) if (intervalo.inicio >= tramo.start && intervalo.fin <= tramo.end) encaja = true;
    for (const descanso of dia.breaks) if (seSolapanTramos(intervalo.inicio, intervalo.fin, descanso.start, descanso.end)) encaja = false;
    // Cambiar la cuadrícula no invalida la hora acordada de una cita ya existente.
    if (!encaja) throw new HttpsError("failed-precondition", "La semana dejaria una cita existente fuera de jornada o descanso.");
  }
}
export async function guardarHorarioAtomico(identidad, entrada) {
  const datos = normalizarSemanaEntrada(entrada);
  autorizarProfesional(identidad, datos.barberUid);
  const { baseDatos } = obtenerServiciosAdministrativos();
  const operacion = obtenerOperacionAgenda(baseDatos, identidad.usuario.uid, "semana", datos);
  const referenciaSemana = baseDatos.doc("barbers/" + datos.barberUid + "/weeklySchedules/" + datos.weekStart);
  const referenciaFicha = baseDatos.doc("barbers/" + datos.barberUid);
  return baseDatos.runTransaction(async (transaccion) => {
    const perfil = await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const anterior = await leerResultadoOperacion(transaccion, operacion);
    if (anterior) return anterior;
    const ficha = await transaccion.get(referenciaFicha);
    if (!ficha.exists && !(identidad.rol === "worker" && datos.barberUid === identidad.usuario.uid)) throw new HttpsError("not-found", "Profesional no encontrado.");
    const semana = await transaccion.get(referenciaSemana);
    if (Number(semana.get("revision") || 0) !== datos.expectedRevision) throw new HttpsError("failed-precondition", "La semana ha cambiado. Vuelve a cargarla.");
    const fechas = enumerarDias(datos.weekStart, sumarDiasCalendario(datos.weekStart, 6));
    const controles = await leerControlesAgenda(transaccion, baseDatos, datos.barberUid, fechas);
    const configuracion = await obtenerConfiguracionAgenda(transaccion);
    const ocupacion = await leerOcupacion(transaccion, baseDatos, datos.barberUid, fechas[0], fechas[6]);
    const horario = normalizarHorario(datos);
    comprobarCitasEnHorario(ocupacion, horario);
    for (const fecha of fechas) {
      const dia = datos.days[obtenerIndiceDia(fecha)];
      if (dia.active) for (const tramo of [...dia.ranges, ...dia.breaks]) { convertirAFechaUtc(fecha, tramo.start, configuracion.timezone); convertirAFechaUtc(fecha, tramo.end, configuracion.timezone); }
    }
    const revision = datos.expectedRevision + 1;
    const payload = { weekStart: datos.weekStart, days: datos.days, slot: datos.slot, published: datos.published, revision, updatedAt: FieldValue.serverTimestamp() };
    if (datos.published && semana.get("published") !== true) payload.publishedAt = FieldValue.serverTimestamp();
    transaccion.set(referenciaSemana, payload, { merge: true });
    const espejo = { schedule: { days: datos.days, slot: datos.slot }, linkedUserId: datos.barberUid, lastConfiguredWeekStart: datos.weekStart, updatedAt: FieldValue.serverTimestamp() };
    if (!ficha.exists) Object.assign(espejo, { name: perfil.name || identidad.usuario.displayName || identidad.usuario.email || "Profesional", email: identidad.usuario.email || "", active: true, isActive: true, createdAt: FieldValue.serverTimestamp() });
    if (datos.published) espejo.lastPublishedWeekStart = datos.weekStart;
    transaccion.set(referenciaFicha, espejo, { merge: true });
    actualizarControlesAgenda(transaccion, controles);
    const resultado = { ok: true, revision, visible: datos.published && (!ficha.exists || (ficha.get("active") !== false && ficha.get("isActive") !== false)) };
    guardarResultadoOperacion(transaccion, operacion, resultado);
    return resultado;
  });
}
export async function crearBloqueoAtomico(identidad, entrada) {
  const datos = normalizarBloqueoEntrada(entrada);
  autorizarProfesional(identidad, datos.barberUid);
  const { baseDatos } = obtenerServiciosAdministrativos();
  const operacion = obtenerOperacionAgenda(baseDatos, identidad.usuario.uid, "crear-bloqueo", datos);
  const referencia = baseDatos.collection("blocks").doc();
  return baseDatos.runTransaction(async (transaccion) => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const anterior = await leerResultadoOperacion(transaccion, operacion);
    if (anterior) return anterior;
    const ficha = await transaccion.get(baseDatos.doc("barbers/" + datos.barberUid));
    if (!ficha.exists) throw new HttpsError("not-found", "Profesional no encontrado.");
    const fechas = fechasBloqueo(datos);
    const controles = await leerControlesAgenda(transaccion, baseDatos, datos.barberUid, fechas);
    const configuracion = await obtenerConfiguracionAgenda(transaccion);
    if (datos.type !== "vacation") obtenerIntervaloUtc(datos.dateStr, datos.start, convertirHoraAMinutos(datos.end) - convertirHoraAMinutos(datos.start), configuracion.timezone);
    const ocupacion = await leerOcupacion(transaccion, baseDatos, datos.barberUid, fechas[0], fechas[fechas.length - 1]);
    const inicio = datos.type === "vacation" ? 0 : convertirHoraAMinutos(datos.start), fin = datos.type === "vacation" ? 1440 : convertirHoraAMinutos(datos.end);
    for (const intervalo of ocupacion) if (seSolapanTramos(inicio, fin, intervalo.inicio, intervalo.fin)) throw new HttpsError("already-exists", "El bloqueo coincide con una cita u ocupacion existente.");
    const existentes = await transaccion.get(baseDatos.collection("blocks").where("barberUid", "==", datos.barberUid));
    for (const documento of existentes.docs) {
      const bloqueo = documento.data();
      const campos = datos.type === "vacation" ? ["type", "startDate", "endDate"] : ["type", "dateStr", "start", "end"];
      if (campos.every((campo) => bloqueo[campo] === datos[campo])) throw new HttpsError("already-exists", "Este bloqueo ya existe.");
    }
    const { requestId, ...payload } = datos;
    transaccion.set(referencia, { ...payload, createdBy: identidad.usuario.uid, createdAt: FieldValue.serverTimestamp() });
    actualizarControlesAgenda(transaccion, controles);
    const resultado = { ok: true, blockId: referencia.id };
    guardarResultadoOperacion(transaccion, operacion, resultado);
    return resultado;
  });
}
export async function eliminarBloqueoAtomico(identidad, entrada) {
  if (!["worker", "manager", "admin"].includes(identidad.rol)) throw new HttpsError("permission-denied", "Acceso denegado.");
  const datos = { blockId: comprobarUid(entrada?.blockId), requestId: comprobarUid(entrada?.requestId) };
  const { baseDatos } = obtenerServiciosAdministrativos();
  const referencia = baseDatos.doc("blocks/" + datos.blockId);
  const operacion = obtenerOperacionAgenda(baseDatos, identidad.usuario.uid, "eliminar-bloqueo", datos);
  return baseDatos.runTransaction(async (transaccion) => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const anterior = await leerResultadoOperacion(transaccion, operacion);
    if (anterior) return anterior;
    const documento = await transaccion.get(referencia);
    if (!documento.exists) throw new HttpsError("not-found", "El bloqueo ya no existe.");
    const bloqueo = documento.data();
    autorizarProfesional(identidad, comprobarUid(bloqueo.barberUid));
    const controles = await leerControlesAgenda(transaccion, baseDatos, bloqueo.barberUid, fechasBloqueo(bloqueo));
    transaccion.delete(referencia);
    actualizarControlesAgenda(transaccion, controles);
    const resultado = { ok: true, blockId: datos.blockId };
    guardarResultadoOperacion(transaccion, operacion, resultado);
    return resultado;
  });
}
export const saveWeeklySchedule = onCall(async (peticion) => guardarHorarioAtomico(await comprobarSesion(peticion, true), peticion.data));
export const createScheduleBlock = onCall(async (peticion) => crearBloqueoAtomico(await comprobarSesion(peticion, true), peticion.data));
export const deleteScheduleBlock = onCall(async (peticion) => eliminarBloqueoAtomico(await comprobarSesion(peticion, true), peticion.data));
