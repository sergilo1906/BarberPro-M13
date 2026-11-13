import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, updateDoc } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { PerfilUsuario } from "../modelos/cuentas";
function referenciaPerfil(uid: string) {
    const servicios = obtenerServiciosFirebase();
    if (!servicios) {
        throw new Error("Firebase no configurado.");
    }
    return doc(servicios.baseDatos, "users", uid);
}
export async function obtenerPerfilUsuario(uid: string): Promise<PerfilUsuario | null> {
    const documento = await getDoc(referenciaPerfil(uid));
    if (!documento.exists()) {
        return null;
    }
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

