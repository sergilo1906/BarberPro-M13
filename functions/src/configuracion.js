import { HttpsError } from "firebase-functions/v2/https";
import { obtenerServiciosAdministrativos } from "./firebase.js";

export async function obtenerConfiguracionAgenda(transaccion = null) {
  const referencia = obtenerServiciosAdministrativos().baseDatos.doc("config/app");
  const documento = transaccion ? await transaccion.get(referencia) : await referencia.get();
  const datos = documento.data() || {};
  const timezone = datos.timezone || datos.tz || "Europe/Madrid";
  const cancelWindowHours = Number(datos.cancelWindowHours ?? 12);
  try { new Intl.DateTimeFormat("es", { timeZone: timezone }).format(); }
  catch { throw new HttpsError("failed-precondition", "La zona horaria del negocio no es valida."); }
  if (!Number.isFinite(cancelWindowHours) || cancelWindowHours < 0) {
    throw new HttpsError("failed-precondition", "El margen de cancelacion no es valido.");
  }
  return { timezone, cancelWindowHours };
}
