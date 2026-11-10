import { before, test } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, collection, query, where, getDocs, getDoc, doc, updateDoc } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { prepararDatosCliente } from "./datos-cliente.mjs";
import { fechaPrueba } from "./datos-reservas.mjs";

before(prepararDatosCliente);
let contador = 0;
async function conectarCliente(sufijo) {
  const app = initializeApp({ projectId: "demo-barberpro-m13", apiKey: "demo-api-key" }, "cliente-" + (++contador));
  const auth = getAuth(app); connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const datos = getFirestore(app); connectFirestoreEmulator(datos, "127.0.0.1", 8088);
  const funciones = getFunctions(app, "europe-west1"); connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
  await signInWithEmailAndPassword(auth, "cliente-" + sufijo + "@example.test", "Prueba123!");
  return { datos, llamar: (nombre, datos) => httpsCallable(funciones, nombre)(datos), cerrar: () => deleteApp(app) };
}
test("cliente obtiene sus ocho citas con estados, historia y datos legados; vacio obtiene cero", async () => {
  for (const sufijo of ["escritorio", "vacio"]) {
    const cliente = await conectarCliente(sufijo);
    try {
      const citas = await getDocs(query(collection(cliente.datos, "bookings"), where("userId", "==", "cliente-" + sufijo)));
      assert.equal(citas.size, sufijo === "vacio" ? 0 : 8);
      if (sufijo === "escritorio") {
        assert.ok(citas.docs.some((cita) => cita.get("dateStr") === "2020-01-03" && cita.get("status") === "done"));
        assert.ok(citas.docs.some((cita) => cita.get("serviceSnapshot.id") === "svc_haircut" && !cita.get("startAt")));
      }
    } finally { await cliente.cerrar(); }
  }
});
test("conocer otro UID o ID no permite consultar su lista, detalle ni perfil", async () => {
  const cliente = await conectarCliente("escritorio");
  try {
    await assert.rejects(getDocs(query(collection(cliente.datos, "bookings"), where("userId", "==", "cliente-movil"))), { code: "permission-denied" });
    await assert.rejects(getDoc(doc(cliente.datos, "bookings/cliente-movil-confirmed")), { code: "permission-denied" });
    await assert.rejects(getDoc(doc(cliente.datos, "users/cliente-movil")), { code: "permission-denied" });
  } finally { await cliente.cerrar(); }
});
test("un cliente no puede cambiar campos protegidos ni escribir una cita directamente", async () => {
  const cliente = await conectarCliente("escritorio");
  try {
    for (const datos of [{ role: "admin" }, { email: "otro@example.test" }, { roleVersion: 10 }]) await assert.rejects(updateDoc(doc(cliente.datos, "users/cliente-escritorio"), datos), { code: "permission-denied" });
    await assert.rejects(updateDoc(doc(cliente.datos, "bookings/cliente-escritorio-pending"), { status: "cancelled" }), { code: "permission-denied" });
  } finally { await cliente.cerrar(); }
});
test("IDs de otra cuenta se rechazan al cancelar, reprogramar o cambiar estados", async () => {
  const cliente = await conectarCliente("escritorio");
  try {
    await assert.rejects(cliente.llamar("cancelBooking", { bookingId: "cliente-movil-confirmed" }), { code: "functions/permission-denied" });
    await assert.rejects(cliente.llamar("rescheduleBooking", { bookingId: "cliente-movil-confirmed", newDateStr: fechaPrueba(20), newTimeStr: "09:10", anyBarber: false, barberPreference: "demo_worker_1" }), { code: "functions/permission-denied" });
    await assert.rejects(cliente.llamar("updateBookingStatus", { bookingId: "cliente-escritorio-pending", nextStatus: "confirmed" }), { code: "functions/permission-denied" });
  } finally { await cliente.cerrar(); }
});
