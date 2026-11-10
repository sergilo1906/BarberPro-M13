import { Timestamp } from "firebase-admin/firestore";
import { autenticacion, baseDatos, fechaPrueba } from "./datos-reservas.mjs";
import { comprobarEntornoLocal } from "../../src/firebase.js";
import { obtenerIntervaloUtc, obtenerLunesSemanaUtc } from "../../src/fechas.js";

export function horarioProfesional() {
  const days = [];
  for (let indice = 0; indice < 7; indice++) days.push({ active: true, ranges: [{ start: "09:00", end: "14:00" }, { start: "16:00", end: "20:00" }], breaks: [{ start: "11:00", end: "11:20" }], start: "09:00", end: "14:00" });
  return { slot: 30, days };
}
export async function reiniciarAgendaProfesional(uid, conCitas = false) {
  comprobarEntornoLocal();
  for (const coleccion of ["bookings", "blocks", "bookingLocks"]) {
    const documentos = await baseDatos.collection(coleccion).where("barberUid", "==", uid).get();
    for (const documento of documentos.docs) await documento.ref.delete();
  }
  const horario = horarioProfesional();
  await baseDatos.doc("barbers/" + uid).set({ name: uid.endsWith("movil") ? "Profesional movil" : uid.endsWith("otro") ? "Profesional otro" : "Profesional escritorio", linkedUserId: uid, active: true, isActive: true, order: uid.endsWith("movil") ? 11 : uid.endsWith("otro") ? 12 : 10, schedule: horario });
  const semanas = new Set();
  for (let dias = -7; dias <= 35; dias++) semanas.add(obtenerLunesSemanaUtc(fechaPrueba(dias)));
  for (const semana of semanas) await baseDatos.doc("barbers/" + uid + "/weeklySchedules/" + semana).set({ ...horario, weekStart: semana, published: true, revision: 0 });
  if (conCitas) {
    for (const [indice, estado] of ["pending", "confirmed", "done", "cancelled", "rescheduled"].entries()) {
      const timeStr = ["09:00", "10:00", "12:00", "13:00", "16:00"][indice];
      const intervalo = obtenerIntervaloUtc(fechaPrueba(0), timeStr, 30, "Europe/Madrid");
      await baseDatos.doc("bookings/" + uid + "-" + estado).set({ barberUid: uid, userId: "cliente-profesional", userName: "Cliente ficticio " + uid, userEmail: "cliente-profesional@example.test", serviceId: "svc_haircut", serviceSnapshot: { name: "Corte", durationMin: 30, price: 15 }, durationMin: 30, dateStr: fechaPrueba(0), timeStr, status: estado, startAt: Timestamp.fromDate(intervalo.inicio), endAt: Timestamp.fromDate(intervalo.fin), lockKeys: [] });
    }
  }
}
export async function prepararDatosProfesional() {
  comprobarEntornoLocal();
  for (const [uid, role] of [["profesional-escritorio", "worker"], ["profesional-movil", "worker"], ["profesional-otro", "worker"], ["cliente-profesional", "client"]]) {
    const email = uid + "@example.test";
    try { await autenticacion.getUser(uid); } catch { await autenticacion.createUser({ uid, email, password: "Prueba123!", emailVerified: true }); }
    await autenticacion.setCustomUserClaims(uid, { role, roleVersion: 0 });
    await baseDatos.doc("users/" + uid).set({ name: role === "worker" ? "Profesional " + uid.slice(12) : "Cliente profesional", email, phone: "600123123", role, roleVersion: 0 });
    if (role === "worker") await reiniciarAgendaProfesional(uid, uid !== "profesional-otro");
  }
}
