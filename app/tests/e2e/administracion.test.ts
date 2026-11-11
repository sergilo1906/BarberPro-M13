import { expect, test } from "@playwright/test";
import { iniciarPersonal } from "./datos-profesional";
import { cambiarCuentaPersistida } from "./datos-cliente";
test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (ruta) => { const host = new URL(ruta.request().url()).hostname; if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue(); else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); } });
});
test("administracion conserva accesos y resumen semanal autorizado", async ({ page }) => {
  await iniciarPersonal(page, "reservas-admin"); await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Administracion", exact: true })).toBeVisible();
  await page.getByRole("link", { name: /Usuarios Cambia roles/ }).click(); await expect(page.locator("#search-form")).toBeVisible();
  await page.goto("/horarios"); await expect(page.locator("#hours-msg")).toContainText("Resumen cargado");
  await expect(page.locator("#hours-list")).toContainText("Perfil oculto"); await expect(page.locator("#hours-list")).toContainText("Semana visible");
  await page.locator('#hours-list a[href*="profesional-otro"]').click(); await expect(page.locator("#setup-barber-select")).toHaveValue("profesional-otro");
});
test("usuarios busca correo exacto, muestra vacio y cambia rol mediante backend", async ({ page }, informacion) => {
  const uid = "admin-destino-" + informacion.project.name;
  await iniciarPersonal(page, "reservas-admin"); await page.goto("/admin/usuarios");
  await page.locator("#email").fill("ausente@example.test"); await page.getByRole("button", { name: "Buscar usuario", exact: true }).click(); await expect(page.locator("#results")).toContainText("Sin resultados para ese email.");
  await page.locator("#email").fill(uid + "@example.test"); await page.getByRole("button", { name: "Buscar usuario", exact: true }).click();
  await expect(page.locator("#results article")).toHaveCount(1); await expect(page.locator("#results")).toContainText("Ficha oculta.");
  await page.locator(".role-select").selectOption("worker"); await page.locator(".apply-role").click();
  await expect(page.locator("#results")).toContainText("Acceso: Profesional");
  await expect(page.locator("#results")).toContainText("Tiene ficha, pero sin horarios.");
  await page.locator(".role-select").selectOption("client"); await page.locator(".apply-role").click(); await expect(page.locator("#results")).toContainText("Acceso: Cliente");
});
test("equipo guarda por Enter sin doble envio y cambia visibilidad", async ({ page }, informacion) => {
  const uid = "admin-destino-" + informacion.project.name;
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/equipo");
  const tarjeta = page.locator('article[data-id="' + uid + '"]'); await expect(tarjeta).toBeVisible();
  let envios = 0; page.on("request", (peticion) => { if (peticion.url().endsWith("/saveTeamProfile")) envios++; });
  await tarjeta.locator(".team-name").fill("Profesional QA " + informacion.project.name); await tarjeta.locator(".team-name").press("Enter");
  await expect(page.locator("#team-msg")).toHaveText("Cambios guardados."); expect(envios).toBe(1);
  await page.reload(); await expect(tarjeta.locator(".team-name")).toHaveValue("Profesional QA " + informacion.project.name);
  await tarjeta.locator(".team-active").check(); await expect(page.locator("#team-msg")).toHaveText("Cambios guardados.");
  await expect(tarjeta.locator(".team-active")).toBeChecked(); await tarjeta.locator(".team-active").uncheck(); await expect(page.locator("#team-msg")).toHaveText("Cambios guardados.");
});
test("servicios valida, crea una vez, modifica y activa sin borrar", async ({ page }, informacion) => {
  const nombre = "Servicio web " + informacion.project.name;
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/servicios"); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.locator("#service-name").fill(nombre); await page.locator("#service-duration").fill("7");
  await page.locator("#service-create-form").evaluate((formulario) => formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await expect(page.locator("#service-create-msg")).toHaveText("Revisa nombre, duracion y precio.");
  await page.locator("#service-duration").fill("30"); await page.locator("#service-active").uncheck();
  let envios = 0; page.on("request", (peticion) => { if (peticion.url().endsWith("/saveService")) envios++; });
  await page.locator("#service-create-form").evaluate((formulario) => { formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
  await expect(page.locator("#service-create-msg")).toHaveText("Servicio creado."); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados."); expect(envios).toBe(1);
  // Los valores de inputs se asignan mediante propiedades DOM, sin HTML de datos.
  const id = await page.locator("#services-list article").evaluateAll((tarjetas, nombre) => tarjetas.find((tarjeta) => tarjeta.querySelector<HTMLInputElement>(".svc-name")?.value === nombre)?.getAttribute("data-id"), nombre);
  const fila = page.locator('article[data-id="' + id + '"]'); await expect(fila).toBeVisible();
  await fila.locator(".svc-duration").fill("45"); await fila.locator(".svc-price").fill("20"); await fila.locator(".svc-save").click(); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.reload(); await expect(fila.locator(".svc-duration")).toHaveValue("45"); await fila.locator(".svc-toggle").click(); await expect(fila.locator(".svc-active")).toBeChecked();
  // Editar la casilla sin guardar no debe invertir la accion anunciada por el boton.
  await expect(fila.locator(".svc-toggle")).toHaveText("Desactivar");
  await fila.locator(".svc-active").uncheck(); await fila.locator(".svc-toggle").click();
  await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.reload(); await expect(fila.locator(".svc-active")).not.toBeChecked();
  await expect(fila.locator(".svc-toggle")).toHaveText("Activar");
  await fila.locator(".svc-active").check(); await fila.locator(".svc-toggle").click();
  await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.reload(); await expect(fila.locator(".svc-active")).toBeChecked();
  await fila.locator(".svc-toggle").click(); await expect(fila.locator(".svc-active")).not.toBeChecked();
});
test("reglas validan zona y avisos y persisten configuracion autorizada", async ({ page }) => {
  await iniciarPersonal(page, "reservas-admin"); await page.goto("/branding"); await expect(page.locator("#cfg-msg")).toHaveText("Configuracion cargada.");
  await page.locator("#cfg-timezone").fill("Zona/Invalida"); await page.locator("#cfg-save").click(); await expect(page.locator("#cfg-msg")).toContainText("Revisa la zona horaria");
  await page.locator("#cfg-timezone").fill("Europe/Madrid"); await page.locator("#cfg-reminders").fill("24, texto"); await page.locator("#cfg-save").click(); await expect(page.locator("#cfg-msg")).toContainText("Revisa la zona horaria");
  await page.locator("#cfg-reminders").fill("24, 2"); await page.locator("#cfg-cancel-hours").fill("12"); await page.locator("#cfg-save").click(); await expect(page.locator("#cfg-msg")).toHaveText("Cambios guardados.");
  await page.reload(); await expect(page.locator("#cfg-reminders")).toHaveValue("24, 2");
});
test("alta de servicio rechazada conserva formulario y permite corregir el envio", async ({ page }, informacion) => {
  const nombre = "Servicio error " + informacion.project.name;
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/servicios"); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.locator("#service-name").fill(nombre); await page.locator("#service-active").uncheck();
  await page.route("**/europe-west1/saveService", async (ruta) => { const datos = ruta.request().postDataJSON(); await ruta.continue({ postData: JSON.stringify({ ...datos, data: { ...datos.data, serviceId: "servicio-inexistente-del-test" } }) }); });
  await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
  await expect(page.locator("#service-create-msg")).toContainText("El registro ya no existe"); await expect(page.locator("#service-name")).toHaveValue(nombre); await expect(page.getByRole("button", { name: "Crear servicio", exact: true })).toBeEnabled();
  await page.unroute("**/europe-west1/saveService"); await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
  await expect(page.locator("#service-create-msg")).toHaveText("Servicio creado."); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
});
test("respuesta perdida de alta conserva requestId y permite comprobar sin duplicar", async ({ page }, informacion) => {
  const nombre = "Servicio recuperado " + informacion.project.name;
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/servicios"); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.locator("#service-name").fill(nombre); await page.locator("#service-active").uncheck();
  let peticiones = 0;
  await page.route("**/europe-west1/saveService", async (ruta) => { peticiones++; const respuesta = await ruta.fetch(); expect(respuesta.ok()).toBe(true); await ruta.abort("failed"); });
  await page.getByRole("button", { name: "Crear servicio", exact: true }).click(); await expect(page.getByRole("button", { name: "Comprobar operacion", exact: true })).toBeVisible(); expect(peticiones).toBe(1);
  await page.unroute("**/europe-west1/saveService"); await page.reload(); await page.getByRole("button", { name: "Comprobar operacion", exact: true }).click(); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  const nombres = await page.locator(".svc-name").evaluateAll((campos) => campos.map((campo) => (campo as HTMLInputElement).value)); expect(nombres.filter((valor) => valor === nombre)).toHaveLength(1);
});
test("cambio de identidad descarta una respuesta administrativa retenida", async ({ page, context, request }, informacion) => {
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/servicios"); await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  await page.locator("#service-name").fill("Servicio sesion " + informacion.project.name); await page.locator("#service-active").uncheck();
  let avisar: () => void = () => {}, liberar: () => void = () => {};
  const guardada = new Promise<void>((resolver) => { avisar = resolver; }), permiso = new Promise<void>((resolver) => { liberar = resolver; });
  await page.route("**/europe-west1/saveService", async (ruta) => { const respuesta = await ruta.fetch(); expect(respuesta.ok()).toBe(true); avisar(); await permiso; await ruta.fulfill({ response: respuesta }); });
  const otra = await context.newPage();
  try {
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click(); await guardada; await otra.goto("/"); await expect(otra.locator("#link-setup")).toBeVisible();
    await cambiarCuentaPersistida(otra, request, "vacio"); await page.bringToFront(); await expect(page).toHaveURL(/\/\?acceso=denegado$/, { timeout: 15000 }); liberar();
    await expect(page.locator("#service-create-msg")).toHaveCount(0); await expect(page.locator("#link-servicios")).toBeHidden();
  } finally { liberar(); await otra.close(); }
});
