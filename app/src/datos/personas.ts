import { collection, getDocs, doc, getDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { PerfilUsuario, Profesional } from "../modelos/cuentas";

export async function obtenerProfesionales(): Promise<Profesional[]> {
  const servicios = obtenerServiciosFirebase();
  if (!servicios) throw new Error("Firebase local desactivado.");
  const documentos = await getDocs(collection(servicios.baseDatos, "barbers"));
  const resultado: Profesional[] = [];
  for (const documento of documentos.docs) {
    const datos = documento.data();
    if (datos.active === false || datos.isActive === false) continue;
    resultado.push({ uid: documento.id, name: String(datos.name || datos.displayName || "Profesional"), order: Number(datos.order ?? Number.MAX_SAFE_INTEGER) });
  }
  resultado.sort((primero, segundo) => primero.order - segundo.order || primero.uid.localeCompare(segundo.uid));
  return resultado;
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
