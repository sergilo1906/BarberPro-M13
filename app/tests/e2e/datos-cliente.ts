import { expect, type Page, type APIRequestContext } from "@playwright/test";
export { fechaReserva } from "./datos-reserva";

export async function iniciarCliente(page: Page, sufijo: string): Promise<void> {
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.locator("#login-email").fill("cliente-" + sufijo + "@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/reservar\/?$/);
}
export async function abrirMisCitas(page: Page, sufijo: string): Promise<void> {
  await iniciarCliente(page, sufijo);
  await page.locator("#link-citas").click();
  await expect(page).toHaveURL(/\/mis-citas\/?$/);
  await expect(page.locator("#my-msg")).not.toHaveText("Cargando citas...");
  await expect(page.locator("#my-list")).toBeVisible();
}
export async function llamarCliente(request: APIRequestContext, sufijo: string, nombre: string, datos: object) {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "cliente-" + sufijo + "@example.test", password: "Prueba123!", returnSecureToken: true } });
  const usuario = await acceso.json();
  expect(acceso.ok()).toBe(true);
  return request.post("http://127.0.0.1:5001/demo-barberpro-m13/europe-west1/" + nombre, { headers: { Authorization: "Bearer " + usuario.idToken }, data: { data: datos } });
}

export async function cambiarCuentaPersistida(page: Page, request: APIRequestContext, sufijo: string): Promise<void> {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "cliente-" + sufijo + "@example.test", password: "Prueba123!", returnSecureToken: true } });
  expect(acceso.ok()).toBe(true);
  const identidad = await acceso.json();
  // Solo en tests: simular la persistencia compartida de otra sesión con un token
  // real del emulador. El observador normal del SDK detecta el cambio de identidad.
  await page.evaluate((identidad) => new Promise<void>((resolver, rechazar) => {
    const apertura = indexedDB.open("firebaseLocalStorageDb");
    apertura.onerror = () => rechazar(apertura.error);
    apertura.onsuccess = () => {
      const base = apertura.result;
      const transaccion = base.transaction("firebaseLocalStorage", "readwrite");
      const almacen = transaccion.objectStore("firebaseLocalStorage");
      const clave = "firebase:authUser:demo-api-key:barberpro-m13-local";
      const lectura = almacen.get(clave);
      lectura.onsuccess = () => {
        if (!lectura.result?.value) { transaccion.abort(); return; }
        const registro = lectura.result;
        registro.value = { ...registro.value, uid: identidad.localId, email: identidad.email, emailVerified: true, displayName: null, providerData: [{ providerId: "password", uid: identidad.email, email: identidad.email, displayName: null, photoURL: null, phoneNumber: null }], stsTokenManager: { accessToken: identidad.idToken, refreshToken: identidad.refreshToken, expirationTime: Date.now() + Number(identidad.expiresIn) * 1000 } };
        almacen.put(registro);
      };
      transaccion.oncomplete = () => { base.close(); resolver(); };
      transaccion.onabort = () => { base.close(); rechazar(new Error("No se pudo preparar el cambio de cuenta del test.")); };
    };
  }), identidad);
}
