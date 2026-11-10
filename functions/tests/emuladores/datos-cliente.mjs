import { Timestamp } from "firebase-admin/firestore";
import { baseDatos, autenticacion, fechaPrueba } from "./datos-reservas.mjs";
import { obtenerIntervaloUtc, formatearFechaZona } from "../../src/fechas.js";
import { comprobarEntornoLocal } from "../../src/firebase.js";

export async function prepararDatosCliente() {
  comprobarEntornoLocal();
  for (const sufijo of ["escritorio", "movil", "vacio", "alterno"]) {
    const uid = "cliente-" + sufijo;
    const email = uid + "@example.test";
    try { await autenticacion.getUser(uid); }
    catch { await autenticacion.createUser({ uid, email, password: "Prueba123!", emailVerified: true }); }
    await autenticacion.setCustomUserClaims(uid, { role: "client", roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ name: "Cliente " + sufijo, phone: "600123123", email, role: "client", roleVersion: 0 });
    if (sufijo === "vacio" || sufijo === "alterno") continue;
    const prefijo = "cliente-" + sufijo + "-";
    const estados = ["pending", "confirmed", "cancelled", "done", "no_show", "rescheduled"];
    for (let indice = 0; indice < estados.length; indice++) {
      const dateStr = indice === 3 || indice === 4 ? "2020-01-0" + indice : fechaPrueba(23 + (sufijo === "movil" ? 1 : 0));
      const timeStr = ["10:10", "12:10", "16:00", "09:00", "09:30", "17:00"][indice];
      const intervalo = obtenerIntervaloUtc(dateStr, timeStr, 30, "Europe/Madrid");
      await baseDatos.doc("bookings/" + prefijo + estados[indice]).set({ userId: uid, barberUid: "demo_worker_1", serviceId: "svc_haircut", serviceSnapshot: { name: "Corte", durationMin: 30, price: 15 }, durationMin: 30, dateStr, timeStr, status: estados[indice], startAt: Timestamp.fromDate(intervalo.inicio), endAt: Timestamp.fromDate(intervalo.fin), lockKeys: [] });
    }
    // Documento legado sin timestamps: prueba explícita de la conversión en la zona del negocio.
    await baseDatos.doc("bookings/" + prefijo + "legada").set({ userId: uid, barberUid: "profesional-archivado", serviceSnapshot: { id: "svc_haircut", name: "Corte antiguo", durationMin: 45, price: 12 }, dateStr: fechaPrueba(25), timeStr: "16:00", status: "confirmed", lockKeys: [] });
    const proxima = new Date(Date.now() + 2 * 3600000);
    const fechaHora = formatearFechaZona(proxima, "Europe/Madrid");
    await baseDatos.doc("bookings/" + prefijo + "cercana").set({ userId: uid, barberUid: "demo_worker_1", serviceId: "svc_haircut", serviceSnapshot: { name: "Corte proximo", durationMin: 30, price: 15 }, dateStr: fechaHora.slice(0, 10), timeStr: fechaHora.slice(11), status: "pending", startAt: Timestamp.fromDate(proxima), lockKeys: [] });
  }
}
