import { doc, getDoc } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";

export async function obtenerConfiguracionAgenda() {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documento = await getDoc(doc(servicios.baseDatos, "config", "app"));
  const datos = documento.data() || {};
  const timezone = String(datos.timezone || datos.tz || "Europe/Madrid");
  new Intl.DateTimeFormat("es", { timeZone: timezone }).format();
  const cancelWindowHours = Number(datos.cancelWindowHours ?? 12);
  if (!Number.isFinite(cancelWindowHours) || cancelWindowHours < 0) throw new Error("Margen de cancelacion no valido.");
  return { timezone, cancelWindowHours, reminderWindowsHours: Array.isArray(datos.reminderWindowsHours) ? datos.reminderWindowsHours as number[] : [24, 2], adminRevision: Number(datos.adminRevision || 0) };
}
