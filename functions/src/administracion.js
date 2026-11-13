import { FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { comprobarAdministrador, comprobarIdentidadTransaccion, comprobarUid } from "./permisos.js";
import { validarDuracion } from "./disponibilidad.js";
import { validarHorario, cabeEnHorario } from "./horarios.js";
import { validarZona, obtenerConfiguracionAgenda, actualizarControlAgenda } from "./configuracion.js";
import { validarFechaCalendario, convertirHoraAMinutos, formatearFechaZona } from "./fechas.js";

// Guardamos únicamente los campos del servicio; las citas conservan su snapshot anterior.
export const saveService = onCall(async peticion => {
  const identidad = await comprobarAdministrador(peticion);
  const datos = peticion.data;
  const id = comprobarUid(datos?.serviceId);
  if (typeof datos.name !== "string" || !datos.name.trim() || datos.name.trim().length > 100 || typeof datos.price !== "number" || !Number.isFinite(datos.price) || datos.price < 0 || typeof datos.active !== "boolean") throw new HttpsError("invalid-argument", "Revisa nombre, precio y estado del servicio.");
  const durationMin = validarDuracion(datos.durationMin);
  const { baseDatos } = obtenerServiciosAdministrativos();
  return baseDatos.runTransaction(async transaccion => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const referencia = baseDatos.doc("services/" + id);
    await transaccion.get(referencia);
    transaccion.set(referencia, { name: datos.name.trim(), price: datos.price, durationMin, active: datos.active, updatedAt: FieldValue.serverTimestamp() });
    return { ok: true, id };
  });
});

// Antes de cambiar el horario revisamos las citas futuras. El control compartido detecta carreras.
export const saveSchedule = onCall(async peticion => {
  const identidad = await comprobarAdministrador(peticion);
  const timezone = validarZona(peticion.data?.timezone);
  const days = validarHorario(peticion.data?.days);
  const { baseDatos } = obtenerServiciosAdministrativos();
  return baseDatos.runTransaction(async transaccion => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const referencia = baseDatos.doc("config/app");
    const documento = await transaccion.get(referencia);
    const zonaAnterior = documento.get("timezone") || timezone;
    const hoy = formatearFechaZona(new Date(), zonaAnterior).slice(0, 10);
    const citas = await transaccion.get(baseDatos.collection("bookings").where("dateStr", ">=", hoy));
    for (const fila of citas.docs) {
      const cita = fila.data();
      if (cita.status === "cancelled") continue;
      if (zonaAnterior !== timezone) throw new HttpsError("failed-precondition", "Hay citas futuras: no cambies su zona horaria sin revisarlas.");
      const duracion = validarDuracion(cita.durationMin ?? cita.serviceSnapshot?.durationMin);
      const fecha = validarFechaCalendario(cita.dateStr);
      if (!cabeEnHorario(days, fecha, convertirHoraAMinutos(cita.timeStr), duracion)) throw new HttpsError("failed-precondition", "El horario dejaria una cita existente fuera de jornada.");
    }
    transaccion.set(referencia, { timezone, days, revision: Number(documento.get("revision") || 0) + 1 });
    return { ok: true };
  });
});

// Un día cerrado es una fecha completa. No se cierra si quedan citas sin resolver.
export const setClosedDay = onCall(async peticion => {
  const identidad = await comprobarAdministrador(peticion);
  const fecha = validarFechaCalendario(peticion.data?.dateStr);
  if (typeof peticion.data?.closed !== "boolean") throw new HttpsError("invalid-argument", "Indica si el dia esta cerrado.");
  const { baseDatos } = obtenerServiciosAdministrativos();
  return baseDatos.runTransaction(async transaccion => {
    await comprobarIdentidadTransaccion(transaccion, baseDatos, identidad);
    const configuracion = await obtenerConfiguracionAgenda(transaccion);
    if (peticion.data.closed) {
      const citas = await transaccion.get(baseDatos.collection("bookings").where("dateStr", "==", fecha));
      for (const cita of citas.docs) {
        if (cita.get("status") !== "cancelled") throw new HttpsError("failed-precondition", "Resuelve las citas de ese dia antes de cerrarlo.");
      }
    }
    const referencia = baseDatos.doc("closedDays/" + fecha);
    if (peticion.data.closed) transaccion.set(referencia, { dateStr: fecha });
    else transaccion.delete(referencia);
    actualizarControlAgenda(transaccion, baseDatos, configuracion);
    return { ok: true };
  });
});
