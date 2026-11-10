import { collection, getDocs, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { PerfilUsuario, Profesional } from "../modelos/cuentas";
import type { HorarioSemanal } from "../modelos/agenda";

export async function obtenerProfesionales(incluirInactivos = false): Promise<Profesional[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documentos = await getDocs(collection(servicios.baseDatos, "barbers"));
  const resultado: Profesional[] = [];
  for (const documento of documentos.docs) {
    const datos = documento.data();
    const active = datos.active !== false && datos.isActive !== false;
    if (!active && !incluirInactivos) continue;
    resultado.push({ uid: documento.id, name: String(datos.name || datos.displayName || "Profesional"), order: Number(datos.order ?? Number.MAX_SAFE_INTEGER), active });
  }
  resultado.sort((primero, segundo) => primero.order - segundo.order || primero.uid.localeCompare(segundo.uid));
  return resultado;
}

export async function obtenerFichaProfesional(uid: string): Promise<(Profesional & { schedule?: HorarioSemanal }) | null> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documento = await getDoc(doc(servicios.baseDatos, "barbers", uid));
  if (!documento.exists()) return null;
  const datos = documento.data();
  return { uid, name: String(datos.name || datos.displayName || "Profesional"), order: Number(datos.order ?? 0), active: datos.active !== false && datos.isActive !== false, schedule: datos.schedule };
}

function referenciaPerfil(uid: string) {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  return doc(servicios.baseDatos, "users", uid);
}

export async function obtenerPerfilUsuario(uid: string): Promise<PerfilUsuario | null> {
  const documento = await getDoc(referenciaPerfil(uid));
  if (!documento.exists()) return null;
  return documento.data() as PerfilUsuario;
}

export function observarPerfilUsuario(uid: string, recibir: (perfil: PerfilUsuario | null) => void, fallar: () => void) {
  return onSnapshot(referenciaPerfil(uid), (documento) => {
    recibir(documento.exists() ? documento.data() as PerfilUsuario : null);
  }, fallar);
}

export async function crearPerfilUsuario(uid: string, correo: string, nombre: string, telefono: string): Promise<void> {
  const referencia = referenciaPerfil(uid);
  // Idempotente: recuperar un alta parcial nunca pisa el rol ni un perfil existente.
  await runTransaction(referencia.firestore, async (transaccion) => {
    const documento = await transaccion.get(referencia);
    if (!documento.exists()) {
      transaccion.set(referencia, {
        name: nombre.trim(), phone: telefono.trim(), email: correo,
        role: "client", roleVersion: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function guardarPerfilUsuario(uid: string, nombre: string, telefono: string): Promise<void> {
  await updateDoc(referenciaPerfil(uid), {
    name: nombre.trim(), phone: telefono.trim(), updatedAt: serverTimestamp(),
  });
}
