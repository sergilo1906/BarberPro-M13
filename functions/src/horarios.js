import { HttpsError } from "firebase-functions/v2/https";
import { convertirHoraAMinutos, obtenerIndiceDia, seSolapanTramos } from "./fechas.js";
export const INTERVALO_MINUTOS = 30;
// Admitimos hasta dos tramos al día, siempre alineados con la cuadrícula de media hora.
// Comprobamos siete dias, hasta dos tramos sin solapes y limites de media hora.
export function validarHorario(days) {
    if (!Array.isArray(days) || days.length !== 7) {
        throw new HttpsError("invalid-argument", "Indica los siete dias de la semana.");
    }
    const resultado = [];
    for (const dia of days) {
        if (!dia || typeof dia.active !== "boolean" || !Array.isArray(dia.ranges) || dia.ranges.length > 2) {
            throw new HttpsError("invalid-argument", "Dia de trabajo no valido.");
        }
        const ranges = [];
        if (dia.active && !dia.ranges.length) {
            throw new HttpsError("invalid-argument", "Un dia abierto necesita un tramo.");
        }
        if (dia.active) {
            for (const tramo of dia.ranges) {
                const inicio = convertirHoraAMinutos(tramo?.start);
                const fin = convertirHoraAMinutos(tramo?.end);
                if (inicio >= fin || inicio % 30 !== 0 || fin % 30 !== 0) {
                    throw new HttpsError("invalid-argument", "Usa tramos ordenados de media hora.");
                }
                ranges.push({ start: tramo.start, end: tramo.end });
            }
            ranges.sort((primero, segundo) => primero.start.localeCompare(segundo.start));
            if (ranges.length === 2 && ranges[0].end > ranges[1].start) {
                throw new HttpsError("invalid-argument", "Los tramos no pueden solaparse.");
            }
        }
        resultado.push({ active: dia.active, ranges });
    }
    return resultado;
}
// La duración completa debe caber dentro de un tramo; no saltamos la pausa del mediodía.
// La duracion completa debe caber en un tramo, sin atravesar una pausa.
export function cabeEnHorario(days, fecha, inicio, duracion) {
    const dia = days[obtenerIndiceDia(fecha)];
    if (!dia?.active || inicio % 30 !== 0) {
        return false;
    }
    for (const tramo of dia.ranges) {
        if (inicio >= convertirHoraAMinutos(tramo.start) && inicio + duracion <= convertirHoraAMinutos(tramo.end)) {
            return true;
        }
    }
    return false;
}
export function estaOcupado(inicio, duracion, ocupacion) {
    for (const cita of ocupacion) {
        if (seSolapanTramos(inicio, inicio + duracion, cita.inicio, cita.fin)) {
            return true;
        }
    }
    return false;
}
