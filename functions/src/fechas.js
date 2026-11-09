import { HttpsError } from "firebase-functions/v2/https";
import { fromZonedTime } from "date-fns-tz";

export function formatearFechaZona(instante, zona) {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(instante);
  const valores = {};
  for (const parte of partes) valores[parte.type] = parte.value;
  return valores.year + "-" + valores.month + "-" + valores.day + "T" + valores.hour + ":" + valores.minute;
}

export function validarFechaCalendario(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    throw new HttpsError("invalid-argument", "Fecha no valida.");
  }
  const instante = new Date(fecha + "T00:00:00Z");
  if (!Number.isFinite(instante.getTime()) || instante.toISOString().slice(0, 10) !== fecha) {
    throw new HttpsError("invalid-argument", "La fecha no existe en el calendario.");
  }
  return fecha;
}

export function validarHora(hora) {
  if (typeof hora !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) {
    throw new HttpsError("invalid-argument", "Hora no valida.");
  }
  return hora;
}

export function convertirHoraAMinutos(hora) {
  validarHora(hora);
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3));
}

export function convertirMinutosAHora(minutos) {
  return String(Math.floor(minutos / 60)).padStart(2, "0") + ":" + String(minutos % 60).padStart(2, "0");
}

export function obtenerLunesSemanaUtc(fecha) {
  const dia = new Date(validarFechaCalendario(fecha) + "T00:00:00Z");
  dia.setUTCDate(dia.getUTCDate() - (dia.getUTCDay() + 6) % 7);
  return dia.toISOString().slice(0, 10);
}

export function obtenerIndiceDia(fecha) {
  return new Date(validarFechaCalendario(fecha) + "T00:00:00Z").getUTCDay();
}

export function seSolapanTramos(inicio, fin, otroInicio, otroFin) {
  return inicio < otroFin && otroInicio < fin;
}

export function convertirAFechaUtc(fecha, hora, zona) {
  validarFechaCalendario(fecha);
  validarHora(hora);
  const instante = fromZonedTime(fecha + "T" + hora + ":00", zona);
  // La vuelta a la zona IANA detecta horas inexistentes durante el salto de primavera.
  if (!Number.isFinite(instante.getTime()) || formatearFechaZona(instante, zona) !== fecha + "T" + hora) {
    throw new HttpsError("failed-precondition", "La hora no existe en la zona horaria del negocio.");
  }
  return instante;
}

export function obtenerIntervaloUtc(fecha, hora, duracion, zona) {
  const inicio = convertirAFechaUtc(fecha, hora, zona);
  const fin = new Date(inicio.getTime() + duracion * 60000);
  const minutosFin = convertirHoraAMinutos(hora) + duracion;
  // Un contrato HH:mm no distingue las dos repeticiones de una hora. Se usa siempre
  // la conversión canónica de la librería y se excluyen intervalos que cruzan el cambio.
  if (minutosFin >= 1440 || formatearFechaZona(fin, zona) !== fecha + "T" + convertirMinutosAHora(minutosFin)) {
    throw new HttpsError("failed-precondition", "El intervalo cruza un cambio de hora o de dia.");
  }
  return { inicio, fin };
}

export function comprobarFechaFutura(fecha, hora, zona, ahora = new Date()) {
  const instante = convertirAFechaUtc(fecha, hora, zona);
  if (instante <= ahora) throw new HttpsError("failed-precondition", "No puedes crear una reserva en fecha/hora pasada.");
  return instante;
}

export function comprobarAnticipacion(fecha, zona, ahora = new Date()) {
  const hoy = formatearFechaZona(ahora, zona).slice(0, 10);
  const limite = new Date(hoy + "T00:00:00Z");
  limite.setUTCDate(limite.getUTCDate() + 30);
  if (fecha > limite.toISOString().slice(0, 10)) {
    throw new HttpsError("failed-precondition", "Solo se puede reservar con 30 dias de antelacion.");
  }
}
