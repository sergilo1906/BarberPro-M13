import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { ConfiguracionAgenda } from "../modelos/aplicacion";
function baseDatos() {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase no configurado.");
  return servicios.baseDatos;
}
export async function obtenerConfiguracionAgenda(): Promise<ConfiguracionAgenda> {
  const documento = await getDoc(doc(baseDatos(), "config", "app"));
  if (!documento.exists()) return { timezone: "Europe/Madrid", days: Array.from({ length: 7 }, () => ({ active: false, ranges: [] })) };
  const datos = documento.data();
  if (!Array.isArray(datos.days) || datos.days.length !== 7) throw new Error("El horario anterior requiere una revision del administrador.");
  new Intl.DateTimeFormat("es", { timeZone: datos.timezone }).format();
  return { timezone: datos.timezone, days: datos.days };
}
export async function obtenerDiasCerrados(): Promise<string[]> {
  return (await getDocs(collection(baseDatos(), "closedDays"))).docs.map(d => d.id).sort();
}

