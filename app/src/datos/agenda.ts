import { collection, getDocs, query, where, type QueryConstraint } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { Cita } from "../modelos/agenda";

async function consultarCitas(restricciones: QueryConstraint[]): Promise<Cita[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documentos = await getDocs(query(collection(servicios.baseDatos, "bookings"), ...restricciones));
  const citas: Cita[] = [];
  for (const documento of documentos.docs) citas.push({ ...documento.data(), id: documento.id } as Cita);
  citas.sort((primera, segunda) => (primera.dateStr + primera.timeStr).localeCompare(segunda.dateStr + segunda.timeStr));
  return citas;
}

export function obtenerCitasUsuario(uid: string): Promise<Cita[]> { return consultarCitas([where("userId", "==", uid)]); }
export function obtenerCitasProfesional(uid: string, fecha: string): Promise<Cita[]> { return consultarCitas([where("barberUid", "==", uid), where("dateStr", "==", fecha)]); }
export function obtenerCitasDia(fecha: string): Promise<Cita[]> { return consultarCitas([where("dateStr", "==", fecha)]); }
