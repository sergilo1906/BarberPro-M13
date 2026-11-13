import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";
import { validarHorario } from "./horarios.js";

export const UID_PROFESIONAL = "principal";

export function validarZona(timezone) {
  if (typeof timezone !== "string" || !timezone.trim()) throw new HttpsError("invalid-argument", "Indica la zona horaria.");
  try { new Intl.DateTimeFormat("es", { timeZone: timezone }).format(); }
  catch { throw new HttpsError("invalid-argument", "Zona horaria no valida."); }
  return timezone;
}

// El horario habitual se guarda una sola vez y se aplica a todas las semanas.
export async function obtenerConfiguracionAgenda(transaccion = null) {
  const { baseDatos } = obtenerServiciosAdministrativos();
  const referencia = baseDatos.doc("config/app");
  const documento = transaccion ? await transaccion.get(referencia) : await referencia.get();
  if (!documento.exists) throw new HttpsError("failed-precondition", "El administrador debe configurar el horario.");
  return {
    timezone: validarZona(documento.get("timezone")),
    days: validarHorario(documento.get("days")),
    revision: Number(documento.get("revision") || 0),
  };
}

// Todas las operaciones de agenda comparten este control. Un cambio concurrente obliga a releer.
export function actualizarControlAgenda(transaccion, baseDatos, configuracion) {
  transaccion.update(baseDatos.doc("config/app"), { revision: configuracion.revision + 1 });
}
