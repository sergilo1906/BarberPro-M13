import { autenticacion, baseDatos } from "./datos-reservas.mjs";
import { comprobarEntornoLocal } from "../../src/firebase.js";
export async function prepararDatosAdministracion() {
  comprobarEntornoLocal();
  for (const sufijo of ["escritorio", "movil"]) {
    const uid = "admin-destino-" + sufijo, email = uid + "@example.test";
    try { await autenticacion.getUser(uid); } catch { await autenticacion.createUser({ uid, email, password: "Prueba123!", emailVerified: true }); }
    await autenticacion.setCustomUserClaims(uid, { role: "client", roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ name: "Destino " + sufijo, email, phone: "", role: "client", roleVersion: 0 });
    await baseDatos.doc("barbers/" + uid).set({ name: "Destino " + sufijo, email, active: false, isActive: false, order: 20, linkedUserId: uid, adminRevision: 0 });
    await baseDatos.doc("services/admin-servicio-" + sufijo).set({ name: "Servicio QA " + sufijo, durationMin: 30, price: 15, active: false, adminRevision: 0 });
  }
}
