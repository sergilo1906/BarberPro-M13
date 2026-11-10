import { collection, doc, getDoc, getDocs, query, where, type QueryConstraint } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { Cita, SemanaProfesional, Bloqueo } from "../modelos/agenda";

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

export function obtenerCitasPeriodo(desde: string, hasta: string, uid?: string): Promise<Cita[]> {
  const condiciones: QueryConstraint[] = [where("dateStr", ">=", desde), where("dateStr", "<=", hasta)];
  if (uid) condiciones.push(where("barberUid", "==", uid));
  return consultarCitas(condiciones);
}

export async function obtenerSemanaProfesional(uid: string, semana: string): Promise<SemanaProfesional | null> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documento = await getDoc(doc(servicios.baseDatos, "barbers", uid, "weeklySchedules", semana));
  return documento.exists() ? documento.data() as SemanaProfesional : null;
}

export async function obtenerBloqueosProfesional(uid: string): Promise<Bloqueo[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documentos = await getDocs(query(collection(servicios.baseDatos, "blocks"), where("barberUid", "==", uid)));
  const bloqueos: Bloqueo[] = [];
  for (const documento of documentos.docs) bloqueos.push({ ...documento.data(), id: documento.id } as Bloqueo);
  return bloqueos;
}
