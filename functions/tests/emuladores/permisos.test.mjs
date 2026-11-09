import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendEmailVerification, applyActionCode, reload,
} from "firebase/auth";
import { getFunctions, connectFunctionsEmulator, httpsCallable } from "firebase/functions";
import { doc, getDoc, setDoc, updateDoc, getDocs, collection, serverTimestamp } from "firebase/firestore";
import { comprobarEntornoLocal, obtenerServiciosAdministrativos } from "../../src/firebase.js";

comprobarEntornoLocal();
const proyecto = "demo-barberpro-m13";
const { autenticacion, baseDatos } = obtenerServiciosAdministrativos();
const aplicaciones = [];
let entorno;
let contador = 0;
const cuentas = {};
const contrasena = "Prueba123!"; // Exclusivamente datos públicos ficticios del emulador.

async function crearCuenta(rol = "client", verificado = true, uid = "integracion-" + (++contador)) {
  const email = uid + "@example.test";
  await autenticacion.createUser({ uid, email, password: contrasena, emailVerified: verificado, displayName: "Prueba " + rol });
  await autenticacion.setCustomUserClaims(uid, { role: rol, roleVersion: 0, plan: "free" });
  await baseDatos.doc("users/" + uid).set({ name: "Prueba " + rol, phone: "", email, role: rol, roleVersion: 0 });
  return { uid, email, rol };
}

async function cliente(cuenta) {
  const aplicacion = initializeApp({ projectId: proyecto, apiKey: "demo-api-key", authDomain: "localhost" }, "prueba-" + (++contador));
  aplicaciones.push(aplicacion);
  const auth = getAuth(aplicacion);
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  const funciones = getFunctions(aplicacion, "europe-west1");
  connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
  if (cuenta) await signInWithEmailAndPassword(auth, cuenta.email, contrasena);
  return { auth, llamar: async (nombre, datos = {}) => (await httpsCallable(funciones, nombre)(datos)).data };
}

function datosPerfil(email, cambios = {}) {
  return { name: "Cliente ficticio", phone: "", email, role: "client", roleVersion: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...cambios };
}

function datosRol(cuenta, cambios = {}) {
  return { email: cuenta.email, email_verified: true, role: cuenta.rol, roleVersion: 0, ...cambios };
}

before(async () => {
  entorno = await initializeTestEnvironment({ projectId: proyecto, firestore: { host: "127.0.0.1", port: 8088, rules: readFileSync(new URL("../../../firestore.rules", import.meta.url), "utf8") } });
  await entorno.clearFirestore();
  await fetch("http://127.0.0.1:9099/emulator/v1/projects/" + proyecto + "/accounts", { method: "DELETE" });
  for (const rol of ["client", "worker", "manager", "admin"]) cuentas[rol] = await crearCuenta(rol, true, "fase4-" + rol);
  cuentas.pendiente = await crearCuenta("client", false, "fase4-pendiente");
  await baseDatos.doc("bookings/propia").set({ userId: cuentas.client.uid, barberUid: cuentas.worker.uid });
  await baseDatos.doc("bookings/ajena").set({ userId: "otro-cliente", barberUid: "otro-profesional" });
  await baseDatos.doc("blocks/ajeno").set({ barberUid: "otro-profesional" });
});

after(async () => {
  await entorno?.cleanup();
  for (const aplicacion of aplicaciones) await deleteApp(aplicacion);
});

test("registro real, perfil limitado, correo de prueba y verificacion", async () => {
  const conexion = await cliente();
  const email = "registro-real@example.test";
  const credencial = await createUserWithEmailAndPassword(conexion.auth, email, contrasena);
  const uid = credencial.user.uid;
  assert.equal(credencial.user.emailVerified, false);
  const datos = entorno.authenticatedContext(uid, { email, email_verified: false }).firestore();
  await assertSucceeds(setDoc(doc(datos, "users", uid), datosPerfil(email)));
  assert.equal((await getDoc(doc(datos, "users", uid))).data().role, "client");
  await sendEmailVerification(credencial.user, { url: "http://127.0.0.1:4331/verify" });
  const respuesta = await fetch("http://127.0.0.1:9099/emulator/v1/projects/" + proyecto + "/oobCodes");
  const codigos = (await respuesta.json()).oobCodes;
  const codigo = codigos.find((actual) => actual.email === email && actual.requestType === "VERIFY_EMAIL");
  assert.ok(codigo);
  await applyActionCode(conexion.auth, codigo.oobCode);
  await reload(credencial.user);
  await credencial.user.getIdToken(true);
  assert.equal(credencial.user.emailVerified, true);
  await assert.rejects(applyActionCode(conexion.auth, codigo.oobCode));
  assert.equal((await conexion.llamar("whoAmI")).role, "client");
});

test("Auth rechaza correo invalido, clave debil, cuenta repetida y credenciales incorrectas", async () => {
  const conexion = await cliente();
  await assert.rejects(createUserWithEmailAndPassword(conexion.auth, "invalido", contrasena));
  await assert.rejects(createUserWithEmailAndPassword(conexion.auth, "debil@example.test", "123"));
  await assert.rejects(createUserWithEmailAndPassword(conexion.auth, cuentas.client.email, contrasena));
  await assert.rejects(signInWithEmailAndPassword(conexion.auth, cuentas.client.email, "Incorrecta123"));
  await assert.rejects(signInWithEmailAndPassword(conexion.auth, "no-existe@example.test", contrasena));
});

test("reglas deniegan perfiles y funciones sin sesion", async () => {
  const datos = entorno.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(datos, "users", cuentas.client.uid)));
  await assertFails(getDocs(collection(datos, "users")));
  await assertFails(setDoc(doc(datos, "users", "intruso"), datosPerfil("intruso@example.test")));
  const conexion = await cliente();
  await assert.rejects(conexion.llamar("whoAmI"), { code: "functions/unauthenticated" });
  await assert.rejects(conexion.llamar("adminSetClaims", { uid: cuentas.client.uid, role: "admin" }), { code: "functions/unauthenticated" });
});

test("perfil propio pendiente editable, campos protegidos inmutables y datos ajenos privados", async () => {
  const cuenta = cuentas.pendiente;
  const datos = entorno.authenticatedContext(cuenta.uid, datosRol(cuenta, { email_verified: false })).firestore();
  const referencia = doc(datos, "users", cuenta.uid);
  await assertSucceeds(getDoc(referencia));
  await assertSucceeds(updateDoc(referencia, { name: "Nombre nuevo", phone: "600123123", updatedAt: serverTimestamp() }));
  for (const cambios of [{ role: "admin" }, { roleVersion: 99 }, { email: "otro@example.test" }, { admin: true }, { createdAt: new Date() }]) {
    await assertFails(updateDoc(referencia, { ...cambios, updatedAt: serverTimestamp() }));
  }
  await assertFails(getDoc(doc(datos, "users", cuentas.admin.uid)));
  await assertFails(getDoc(doc(datos, "bookings", "propia")));
  await assertFails(updateDoc(referencia, { name: "x".repeat(101), updatedAt: serverTimestamp() }));
});

test("alta parcial recuperable sin aceptar roles, campos extra ni correo ajeno", async () => {
  const uid = "alta-parcial";
  const email = "parcial@example.test";
  const datos = entorno.authenticatedContext(uid, { email, email_verified: false }).firestore();
  const referencia = doc(datos, "users", uid);
  await assertFails(setDoc(referencia, datosPerfil(email, { role: "admin" })));
  await assertFails(setDoc(referencia, datosPerfil(email, { email: cuentas.admin.email })));
  await assertFails(setDoc(referencia, datosPerfil(email, { permissions: ["admin"] })));
  await assertFails(setDoc(referencia, datosPerfil(email, { createdAt: new Date(0) })));
  await assertSucceeds(setDoc(referencia, datosPerfil(email)));
  await assertSucceeds(updateDoc(referencia, { name: "Recuperado", updatedAt: serverTimestamp() }));
});

for (const rol of ["client", "worker", "manager", "admin"]) {
  test("permisos de datos y callable para " + rol, async () => {
    const cuenta = cuentas[rol];
    const datos = entorno.authenticatedContext(cuenta.uid, datosRol(cuenta)).firestore();
    const conexion = await cliente(cuenta);
    const identidad = await conexion.llamar("whoAmI");
    assert.equal(identidad.role, rol);
    assert.equal(identidad.uid, cuenta.uid);
    assert.equal("token" in identidad, false);
    await assertSucceeds(getDoc(doc(datos, "users", cuenta.uid)));
    if (rol === "manager" || rol === "admin") {
      await assertSucceeds(getDocs(collection(datos, "users")));
      await assertSucceeds(getDoc(doc(datos, "bookings", "ajena")));
    } else {
      await assertFails(getDocs(collection(datos, "users")));
      await assertFails(getDoc(doc(datos, "users", cuentas.admin.uid)));
      await assertSucceeds(getDoc(doc(datos, "bookings", "propia")));
      await assertFails(getDoc(doc(datos, "bookings", "ajena")));
      await assertFails(getDoc(doc(datos, "blocks", "ajeno")));
    }
    if (rol !== "admin") {
      await assert.rejects(conexion.llamar("adminSetClaims", { uid: cuenta.uid, role: "admin" }), { code: "functions/permission-denied" });
    }
    await assert.rejects(conexion.llamar("setMyRole", { role: "admin" }), { code: "functions/permission-denied" });
    await assertFails(updateDoc(doc(datos, "users", cuenta.uid), { role: rol === "admin" ? "manager" : "admin", updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(datos, "bookings", "inventada"), { userId: cuenta.uid }));
  });
}

test("el administrador valida UID y rol y sincroniza claims, usuario y ficha profesional", async () => {
  const administrador = await cliente(cuentas.admin);
  const objetivo = await crearCuenta();
  for (const datos of [{ uid: "a/b", role: "admin" }, { uid: objetivo.uid, role: "__proto__" }, { uid: objetivo.uid, role: { role: "admin" } }, { role: "admin" }]) {
    await assert.rejects(administrador.llamar("adminSetClaims", datos), { code: "functions/invalid-argument" });
  }
  await assert.rejects(administrador.llamar("adminSetClaims", { uid: "inexistente", role: "worker" }), { code: "functions/not-found" });
  await administrador.llamar("adminSetClaims", { uid: objetivo.uid, role: "barbero" });
  assert.equal((await autenticacion.getUser(objetivo.uid)).customClaims.role, "worker");
  assert.equal((await baseDatos.doc("users/" + objetivo.uid).get()).get("role"), "worker");
  assert.equal((await baseDatos.doc("barbers/" + objetivo.uid).get()).get("active"), true);
  await administrador.llamar("adminSetClaims", { uid: objetivo.uid, role: "client" });
  assert.equal((await baseDatos.doc("barbers/" + objetivo.uid).get()).get("active"), false);
});

test("un token privilegiado anterior pierde permisos en reglas y funciones tras la degradacion", async () => {
  const objetivo = await crearCuenta("admin");
  const conexion = await cliente(objetivo);
  const administrador = await cliente(cuentas.admin);
  const datos = entorno.authenticatedContext(objetivo.uid, datosRol(objetivo)).firestore();
  await assertSucceeds(getDocs(collection(datos, "users")));
  await administrador.llamar("adminSetClaims", { uid: objetivo.uid, role: "client" });
  await assertFails(getDocs(collection(datos, "users")));
  await assert.rejects(conexion.llamar("adminSetClaims", { uid: objetivo.uid, role: "admin" }), { code: "functions/permission-denied" });
  await conexion.auth.currentUser.getIdToken(true);
  assert.equal((await conexion.llamar("whoAmI")).role, "client");
});

test("un cambio interrumpido de version falla cerrado y puede repararse con una asignacion autorizada", async () => {
  const objetivo = await crearCuenta("worker");
  await baseDatos.doc("users/" + objetivo.uid).update({ roleVersion: 1 });
  const conexion = await cliente(objetivo);
  await assert.rejects(conexion.llamar("whoAmI"), { code: "functions/permission-denied" });
  const datos = entorno.authenticatedContext(objetivo.uid, datosRol(objetivo)).firestore();
  await assertFails(getDoc(doc(datos, "bookings", "ajena")));
  const administrador = await cliente(cuentas.admin);
  await administrador.llamar("adminSetClaims", { uid: objetivo.uid, role: "worker" });
  await conexion.auth.currentUser.getIdToken(true);
  assert.equal((await conexion.llamar("whoAmI")).role, "worker");
});

test("correo pendiente, sesion cerrada, token caducado y cuenta deshabilitada no administran", async () => {
  const pendiente = await crearCuenta("admin", false);
  const conexion = await cliente(pendiente);
  await assert.rejects(conexion.llamar("adminSetClaims", { uid: pendiente.uid, role: "admin" }), { code: "functions/permission-denied" });
  await signOut(conexion.auth);
  await assert.rejects(conexion.llamar("whoAmI"), { code: "functions/unauthenticated" });
  const respuesta = await fetch("http://127.0.0.1:5001/" + proyecto + "/europe-west1/whoAmI", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer caducado-o-invalido" }, body: JSON.stringify({ data: {} }),
  });
  assert.equal(respuesta.status, 401);
  const deshabilitado = await crearCuenta("admin");
  const otraConexion = await cliente(deshabilitado);
  await autenticacion.updateUser(deshabilitado.uid, { disabled: true });
  await assert.rejects(otraConexion.llamar("whoAmI"), { code: "functions/unauthenticated" });
});

test("un token realmente caducado y un rol manipulado se rechazan aunque el emulador no compruebe la firma", async () => {
  const conexion = await cliente(cuentas.client);
  const token = await conexion.auth.currentUser.getIdToken();
  const partes = token.split(".");
  const payload = JSON.parse(Buffer.from(partes[1], "base64url").toString());
  for (const cambios of [{ exp: Math.floor(Date.now() / 1000) - 3600 }, { role: "admin" }]) {
    const alterado = partes[0] + "." + Buffer.from(JSON.stringify({ ...payload, ...cambios })).toString("base64url") + ".";
    const respuesta = await fetch("http://127.0.0.1:5001/" + proyecto + "/europe-west1/adminSetClaims", {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + alterado },
      body: JSON.stringify({ data: { uid: cuentas.client.uid, role: "admin" } }),
    });
    assert.ok(respuesta.status === 401 || respuesta.status === 403);
  }
  assert.equal((await autenticacion.getUser(cuentas.client.uid)).customClaims.role, "client");
});
