import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../../../", import.meta.url));
const fecha = (dias = 7) => {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valor = (tipo: string) => partes.find(p => p.type === tipo)!.value;
  const instante = new Date(valor("year") + "-" + valor("month") + "-" + valor("day") + "T00:00:00Z");
  instante.setUTCDate(instante.getUTCDate() + dias);
  return instante.toISOString().slice(0, 10);
};
async function entrar(page: Page, cuenta = "client") {
  await page.goto("/login");
  await page.locator("#login-email").fill("demo-" + cuenta + "@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.locator("#login-form button").click();
  await expect(page).toHaveURL(cuenta === "admin" ? /\/admin\/?$/ : /\/reservar\/?$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-auth-pending");
}
async function reservar(page: Page, dias = 7, servicio = "corte", hora = "09:00") {
  await page.goto("/reservar");
  await expect(page.locator("#service-select option[value='corte']")).toBeAttached();
  await page.locator("#service-select").selectOption(servicio);
  await page.locator("#date-select").fill(fecha(dias));
  await page.locator("#slots-list button").filter({ hasText: hora }).click();
  await expect(page.locator("#booking-success")).toBeVisible();
  await expect(page.locator("#booking-summary")).toContainText("Cita confirmada");
}
test.beforeAll(() => {
  execFileSync(process.execPath, ["functions/scripts/preparar-datos-reservas.mjs"], { cwd: raiz, env: process.env, stdio: "pipe" });
});
test("paginas publicas adaptadas, enlaces validos y anchura de pantalla", async ({ page }) => {
  for (const ruta of ["/", "/ayuda", "/legal", "/login", "/registro", "/verify", "/404"]) {
    await page.goto(ruta);
    await expect(page.locator("nav")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const enlaces = await page.locator("a[href^='/']").evaluateAll(elementos => elementos.map(e => e.getAttribute("href")));
    for (const enlace of enlaces) expect(["/", "/ayuda", "/legal", "/login", "/registro", "/verify", "/perfil", "/reservar", "/mis-citas", "/admin", "/agenda", "/horarios", "/servicios"]).toContain(enlace);
  }
  const respuesta = await page.goto("/panel-barbero"); expect(respuesta?.status()).toBe(404);
});
test("registro, verificacion real en Auth local y cierre de sesion", async ({ page, request }) => {
  const correo = "alta-" + crypto.randomUUID() + "@example.test";
  await page.goto("/registro");
  await page.locator("#reg-name").fill("Cliente de prueba");
  await page.locator("#reg-email").fill(correo);
  await page.locator("#reg-password").fill("Prueba123!");
  await page.locator("#reg-password2").fill("Prueba123!");
  await page.locator("#reg-form button").click();
  await expect(page).toHaveURL(/\/verify/);
  const respuesta = await request.get("http://127.0.0.1:9099/emulator/v1/projects/demo-barberpro-m13/oobCodes");
  const codigos = (await respuesta.json()).oobCodes;
  const codigo = codigos.find((c: {email: string}) => c.email === correo);
  expect(codigo).toBeTruthy();
  await page.goto("/verify?mode=verifyEmail&oobCode=" + encodeURIComponent(codigo.oobCode));
  await expect(page).toHaveURL(/\/reservar\/?$/);
  await page.goto("/perfil");
  await expect(page.locator("#perfil-role")).toHaveText("Cliente");
  await expect(page.locator("#perfil-verif")).toHaveText("Verificado");
  await page.locator("#btn-logout").click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/mis-citas"); await expect(page).toHaveURL(/\/login/);
});
test("cliente reserva, ve solo sus citas, cancela y recupera la hora", async ({ page }) => {
  await entrar(page); await reservar(page);
  await page.reload(); await expect(page.locator("html")).not.toHaveAttribute("data-auth-pending");
  await page.goto("/mis-citas");
  await expect(page.locator("#my-list")).toContainText("Confirmada");
  page.once("dialog", dialogo => dialogo.accept());
  await page.getByRole("button", { name: "Cancelar cita", exact: true }).click();
  await expect(page.locator("#my-list")).toContainText("Cancelada");
  await page.goto("/reservar");
  await expect(page.locator("#service-select option[value='corte']")).toBeAttached();
  await page.locator("#service-select").selectOption("corte");
  await page.locator("#date-select").fill(fecha());
  await expect(page.getByRole("button", { name: "09:00", exact: true })).toBeVisible();
  await page.goto("/admin"); await expect(page).toHaveURL(/acceso=denegado/);
  await expect(page.locator("#link-admin")).toBeHidden();
});
test("perfil editado se conserva al recargar y se vacia al cambiar de cuenta", async ({ page }) => {
  await entrar(page); await page.goto("/perfil");
  await expect(page.locator("#perfil-email")).toHaveText("demo-client@example.test");
  await page.locator("#perfil-name").fill("Nombre revisado");
  await page.locator("#perfil-phone").fill("600123123");
  await page.locator("#perfil-save").click(); await expect(page.locator("#perfil-msg")).toHaveText("Cambios guardados.");
  await page.reload(); await expect(page.locator("#perfil-name")).toHaveValue("Nombre revisado");
  await page.locator("#btn-logout").click(); await expect(page).toHaveURL(/\/login/);
  await entrar(page, "otro"); await page.goto("/perfil");
  await expect(page.locator("#perfil-name")).toHaveValue("Prueba otro");
  await expect(page.locator("#perfil-phone")).toHaveValue("");
});
test("admin consulta agenda y completa una reserva de 60 minutos", async ({ page }) => {
  await entrar(page); await reservar(page, 8, "completo", "10:00");
  await page.locator("#btn-logout").click(); await expect(page).toHaveURL(/\/login/);
  await entrar(page, "admin"); await page.goto("/agenda");
  await page.locator("#agenda-date").fill(fecha(8));
  await expect(page.locator("#agenda-list")).toContainText("Confirmada");
  page.once("dialog", dialogo => dialogo.accept());
  await page.getByRole("button", { name: "Marcar hecha", exact: true }).click();
  await expect(page.locator("#agenda-list")).toContainText("Hecha");
  await expect(page.getByRole("button", { name: "Marcar hecha", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("admin crea, edita y desactiva un servicio", async ({ page }) => {
  await entrar(page, "admin"); await page.goto("/servicios");
  await page.locator("#service-name").fill("Servicio evaluacion");
  await page.locator("#service-duration").fill("60");
  await page.locator("#service-price").fill("30");
  await page.locator("#service-create-form button").click();
  await expect(page.locator("#services-msg")).toHaveText("Servicio guardado.");
  const fila = page.locator("#services-list form").filter({ has: page.locator("input[value='Servicio evaluacion']") });
  await expect(fila).toHaveCount(1);
  await fila.locator("input[type='checkbox']").uncheck();
  await fila.getByRole("button", { name: "Guardar servicio" }).click();
  await expect(page.locator("#services-msg")).toHaveText("Servicio guardado.");
  await expect(fila.locator("input[type='checkbox']")).not.toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("admin cambia horario habitual, cierra y reabre una fecha", async ({ page }) => {
  await entrar(page, "admin"); await page.goto("/horarios");
  await expect(page.locator("#schedule-form button")).toBeEnabled();
  await page.locator("#schedule-form button").click();
  await expect(page.locator("#hours-msg")).toHaveText("Cambios guardados.");
  await page.locator("#closed-date").fill(fecha(12));
  await page.locator("#closed-form button").click();
  await expect(page.locator("#closed-msg")).toHaveText("Cambios guardados.");
  await expect(page.locator("#closed-list")).toContainText(fecha(12));
  await page.locator("#closed-state").uncheck(); await page.locator("#closed-form button").click();
  await expect(page.locator("#closed-msg")).toHaveText("Cambios guardados.");
  await expect(page.locator("#closed-list")).not.toContainText(fecha(12));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test("sin autenticar las siete rutas privadas requieren iniciar sesion", async ({ page }) => {
  for (const ruta of ["/perfil", "/reservar", "/mis-citas", "/admin", "/agenda", "/servicios", "/horarios"]) {
    await page.goto(ruta); await expect(page).toHaveURL(/\/login/);
  }
});
