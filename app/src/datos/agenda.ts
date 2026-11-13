import { collection, getDocs, query, where, type QueryConstraint } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { Cita } from "../modelos/agenda";
async function consultarCitas(condicion: QueryConstraint): Promise<Cita[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase no configurado.");
  const documentos = await getDocs(query(collection(servicios.baseDatos, "bookings"), condicion));
  return documentos.docs.map(documento => ({ ...documento.data(), id: documento.id } as Cita))
    .sort((a, b) => (a.dateStr + a.timeStr).localeCompare(b.dateStr + b.timeStr));
}
export function obtenerCitasUsuario(uid: string) { return consultarCitas(where("userId", "==", uid)); }
export function obtenerCitasDia(fecha: string) { return consultarCitas(where("dateStr", "==", fecha)); }

