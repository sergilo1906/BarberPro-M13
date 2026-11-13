import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { obtenerServiciosFirebase } from "./firebase";
import type { Servicio, ServicioAdministrable } from "../modelos/agenda";
export async function obtenerServicios(): Promise<Servicio[]> {
    const servicios = obtenerServiciosFirebase();
    if (!servicios) {
        throw new Error("Firebase no configurado.");
    }
    const documentos = await getDocs(query(collection(servicios.baseDatos, "services"), where("active", "==", true)));
    const resultado: Servicio[] = [];
    for (const documento of documentos.docs) {
        const datos = documento.data();
        const duracion = Number(datos.durationMin ?? 30);
        const precio = Number(datos.price ?? 0);
        if (!Number.isInteger(duracion) || ![30, 60].includes(duracion) || !Number.isFinite(precio) || precio < 0) {
            continue;
        }
        resultado.push({
            id: documento.id, name: String(datos.name || "Servicio"), durationMin: duracion, price: precio
        });
    }
    resultado.sort((primero, segundo) => primero.name.localeCompare(segundo.name));
    return resultado;
}
export async function obtenerCatalogoCompleto(): Promise<ServicioAdministrable[]> {
    const servicios = obtenerServiciosFirebase();
    if (!servicios) {
        throw new Error("Firebase no configurado.");
    }
    const documentos = await getDocs(query(collection(servicios.baseDatos, "services"), orderBy("name", "asc")));
    const resultado: ServicioAdministrable[] = [];
    for (const documento of documentos.docs) {
        const datos = documento.data();
        resultado.push({
            id: documento.id, name: String(datos.name || ""), durationMin: Number(datos.durationMin ?? 30), price: Number(datos.price ?? 0), active: datos.active !== false
        });
    }
    return resultado;
}

