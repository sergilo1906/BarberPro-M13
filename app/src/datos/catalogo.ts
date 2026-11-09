import { collection, getDocs, query, where } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { Servicio } from "../modelos/agenda";

export async function obtenerServicios(): Promise<Servicio[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documentos = await getDocs(query(collection(servicios.baseDatos, "services"), where("active", "==", true)));
  const resultado: Servicio[] = [];
  for (const documento of documentos.docs) {
    const datos = documento.data();
    const duracion = Number(datos.durationMin ?? 30);
    const precio = Number(datos.price ?? 0);
    if (!Number.isInteger(duracion) || duracion <= 0 || !Number.isFinite(precio) || precio < 0) continue;
    resultado.push({ id: documento.id, name: String(datos.name || "Servicio"), durationMin: duracion, price: precio });
  }
  resultado.sort((primero, segundo) => primero.name.localeCompare(segundo.name));
  return resultado;
}
