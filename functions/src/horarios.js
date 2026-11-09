import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { convertirHoraAMinutos, obtenerLunesSemanaUtc, validarFechaCalendario } from "./fechas.js";

export function normalizarTramos(tramos) {
  if (!Array.isArray(tramos)) return [];
  const resultado = [];
  for (const tramo of tramos) {
    const inicio = convertirHoraAMinutos(tramo?.start);
    const fin = convertirHoraAMinutos(tramo?.end);
    if (fin <= inicio) throw new HttpsError("failed-precondition", "Horario con un tramo invertido.");
    resultado.push({ start: inicio, end: fin });
  }
  resultado.sort((primero, segundo) => primero.start - segundo.start);
  for (let indice = 1; indice < resultado.length; indice++) {
    if (resultado[indice].start < resultado[indice - 1].end) {
      throw new HttpsError("failed-precondition", "Horario con tramos solapados.");
    }
  }
  return resultado;
}

export function normalizarHorario(datos) {
  const slotMin = Number(datos.slot ?? datos.slotMin ?? 30);
  if (!Number.isInteger(slotMin) || slotMin < 5 || slotMin > 1440) {
    throw new HttpsError("failed-precondition", "Intervalo de horario no valido.");
  }
  const dias = [];
  for (let indice = 0; indice < 7; indice++) {
    const dia = datos.days?.[indice] || {};
    const tramos = Array.isArray(dia.ranges) && dia.ranges.length ? dia.ranges : dia.start && dia.end ? [{ start: dia.start, end: dia.end }] : [];
    dias.push({ active: dia.active === true,
      ranges: dia.active === true ? normalizarTramos(tramos) : [],
      breaks: dia.active === true ? normalizarTramos(dia.breaks || []) : [] });
  }
  return { slotMin, days: dias };
}

export async function cargarSemanaPublicada(uid, fecha, transaccion = null) {
  const referencia = obtenerServiciosAdministrativos().baseDatos.doc("barbers/" + uid + "/weeklySchedules/" + obtenerLunesSemanaUtc(fecha));
  const documento = transaccion ? await transaccion.get(referencia) : await referencia.get();
  if (!documento.exists || documento.get("published") !== true) return null;
  return normalizarHorario(documento.data());
}

export async function cargarBloqueosDia(uid, fecha, transaccion = null) {
  const consulta = obtenerServiciosAdministrativos().baseDatos.collection("blocks").where("barberUid", "==", uid);
  const documentos = transaccion ? await transaccion.get(consulta) : await consulta.get();
  const bloqueos = [];
  for (const documento of documentos.docs) {
    const datos = documento.data();
    if (datos.type === "vacation") {
      validarFechaCalendario(datos.startDate);
      validarFechaCalendario(datos.endDate);
      if (datos.startDate > datos.endDate) throw new HttpsError("failed-precondition", "Vacaciones con fechas invertidas.");
      if (fecha >= datos.startDate && fecha <= datos.endDate) bloqueos.push({ start: 0, end: 1440 });
    } else if (datos.dateStr === fecha) {
      const tramo = normalizarTramos([{ start: datos.start, end: datos.end }]);
      bloqueos.push(tramo[0]);
    }
  }
  return bloqueos;
}
