import { expect, test, type Page, type APIRequestContext } from "@playwright/test";

async function iniciarCuenta(page: Page, rol: string): Promise<void> {
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.locator("#login-email").fill("fase4-" + rol + "@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

async function asignarRol(request: APIRequestContext, uid: string, rol: string): Promise<void> {
  const respuesta = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", {
    data: { email: "fase4-admin@example.test", password: "Prueba123!", returnSecureToken: true },
  });
  const identidad = await respuesta.json();
  expect(respuesta.ok()).toBe(true);
  const cambio = await request.post("http://127.0.0.1:5001/demo-barberpro-m13/europe-west1/adminSetClaims", {
    headers: { Authorization: "Bearer " + identidad.idToken }, data: { data: { uid, role: rol } },
  });
  expect(cambio.ok()).toBe(true);
}

test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (peticion) => {
    const host = new URL(peticion.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await peticion.continue();
    else { await peticion.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
});

test("login invalido, campos vacios y doble envio", async ({ page }) => {
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login\/?$/);
  await page.locator("#login-email").fill("no-existe@example.test");
  await page.locator("#login-password").fill("Incorrecta123");
  let solicitudes = 0;
  page.on("request", (solicitud) => { if (solicitud.url().includes("accounts:signInWithPassword")) solicitudes++; });
  await page.locator("#login-form").evaluate((formulario) => {
    formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    formulario.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  await expect(page.locator("#login-msg")).toHaveText("Email o contrasena incorrectos.");
  expect(solicitudes).toBe(1);
  await page.locator("#login-email").fill("fase4-client@example.test");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("#login-msg")).toHaveText("Email o contrasena incorrectos.");
});

test("registro, confirmacion, verificacion, perfil persistente y salida", async ({ page, request }, informacion) => {
  const email = "alta-" + informacion.project.name + "-" + Date.now() + "@example.test";
  await page.goto("/registro");
  await expect(page.locator("#reg-name")).toBeEnabled();
  await page.locator("#reg-name").fill("Persona ficticia");
  await page.locator("#reg-phone").fill("600123123");
  await page.locator("#reg-email").fill(email);
  await page.locator("#reg-password").fill("Prueba123!");
  await page.locator("#reg-password2").fill("Distinta123!");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page.locator("#reg-msg")).toHaveText("Las contrasenas no coinciden.");
  await page.locator("#reg-password2").fill("Prueba123!");
  await page.getByRole("button", { name: "Crear cuenta", exact: true }).click();
  await expect(page).toHaveURL(/\/verify\?sent=1/);
  await expect(page.locator("#link-agenda")).toBeHidden();
  await page.goto("/perfil");
  await expect(page.locator("#perfil-role")).toHaveText("Cliente");
  await expect(page.locator("#perfil-verif")).toHaveText("Pendiente");
  await expect(page.locator("#perfil-name")).toHaveValue("Persona ficticia");
  await page.locator("#perfil-send-verify").click();
  await expect(page.locator("#perfil-msg")).toContainText("Correo enviado");
  const codigosRespuesta = await request.get("http://127.0.0.1:9099/emulator/v1/projects/demo-barberpro-m13/oobCodes");
  const codigos = (await codigosRespuesta.json()).oobCodes as { email: string; oobCode: string }[];
  const codigo = codigos.find((actual) => actual.email === email);
  expect(codigo).toBeDefined();
  await page.goto("/verify?mode=verifyEmail&oobCode=" + codigo!.oobCode);
  await expect(page).toHaveURL(/\/reservar\/?$/);
  await page.goto("/perfil");
  await expect(page.locator("#perfil-verif")).toHaveText("Verificado");
  await page.locator("#perfil-name").fill("Nombre actualizado");
  await page.locator("#perfil-save").click();
  await expect(page.locator("#perfil-msg")).toHaveText("Cambios guardados.");
  await page.reload();
  await expect(page.locator("#perfil-name")).toHaveValue("Nombre actualizado");
  await page.locator("#perfil-logout").click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("#btn-login")).toBeVisible();
  await expect(page.locator("#user-avatar")).toBeHidden();
  await page.goto("/perfil");
  await expect(page).toHaveURL(/\/login\/?$/);
});

const rutasPersonal = ["/agenda", "/panel-barbero", "/panel", "/index-admin", "/setup-barber", "/bloqueos"];
const rutasGestion = ["/horarios", "/equipo", "/servicios", "/kpis", "/export"];
const rutasAdministrador = ["/admin", "/admin/usuarios", "/branding", "/debug"];

for (const rol of ["client", "worker", "manager", "admin"]) {
  test("rutas directas, menu y persistencia de " + rol, async ({ page }) => {
    await iniciarCuenta(page, rol);
    await expect(page).toHaveURL(rol === "client" ? /\/reservar\/?$/ : rol === "worker" ? /\/panel-barbero\/?$/ : /\/index-admin\/?$/);
    await expect(page.locator("#link-citas")).toBeVisible();
    await expect(page.locator("#link-agenda")).toBeVisible({ visible: rol !== "client" });
    await expect(page.locator("#link-servicios")).toBeVisible({ visible: rol === "manager" || rol === "admin" });
    await expect(page.locator("#link-admin")).toBeVisible({ visible: rol === "admin" });
    for (const ruta of [...rutasPersonal, ...rutasGestion, ...rutasAdministrador]) {
      const permitido = rol === "admin" || (rutasPersonal.includes(ruta) && rol !== "client") || (rutasGestion.includes(ruta) && rol === "manager");
      await page.goto(ruta + "/");
      if (permitido) {
        const titulos: Record<string, string> = { "/agenda": "Agenda diaria", "/panel-barbero": "Panel del profesional", "/setup-barber": "Horarios", "/bloqueos": "Bloqueos y excepciones", "/index-admin": "Agenda de hoy", "/admin": "Administracion", "/admin/usuarios": "Usuarios y roles", "/equipo": "Equipo", "/servicios": "Servicios", "/horarios": "Resumen de horarios", "/branding": "Reglas de la agenda" };
        if (titulos[ruta]) await expect(page.getByRole("heading", { name: titulos[ruta], exact: true })).toBeVisible();
        else await expect(page.locator('[data-estado="no-disponible"]')).toBeVisible();
      } else {
        await expect(page).toHaveURL(/\/\?acceso=denegado$/);
      }
    }
    await page.goto("/perfil");
    await page.reload();
    await expect(page.locator("#perfil-email")).toHaveText("fase4-" + rol + "@example.test");
    await page.locator("#btn-logout").click();
    await expect(page).toHaveURL(/\/login\/?$/);
  });
}

test("correo pendiente solo accede al perfil y no a la operativa", async ({ page }) => {
  await iniciarCuenta(page, "pendiente");
  await expect(page).toHaveURL(/\/verify\/?$/);
  await page.goto("/perfil");
  await expect(page.locator("#perfil-verif")).toHaveText("Pendiente");
  await expect(page.locator("#link-citas")).toBeHidden();
  await page.goto("/reservar/");
  await expect(page).toHaveURL(/\/verify\/?$/);
});

test("codigo invalido y fallo de red del login muestran errores comprensibles", async ({ page }) => {
  await page.goto("/verify?mode=verifyEmail&oobCode=invalido");
  await expect(page.locator("#verify-msg")).toContainText("Enlace invalido o caducado");
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.route("**/accounts:signInWithPassword?*", (peticion) => peticion.abort("failed"));
  await page.locator("#login-email").fill("fase4-client@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("#login-msg")).toContainText("conexion");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeEnabled();
});

test("cerrar sesion se propaga a otra pestana y volver atras no recupera el perfil", async ({ page, context }) => {
  await iniciarCuenta(page, "client");
  await page.goto("/perfil");
  const otraPagina = await context.newPage();
  await otraPagina.goto("/perfil");
  await expect(otraPagina.locator("#perfil-email")).toHaveText("fase4-client@example.test");
  await page.locator("#btn-logout").click();
  await expect(otraPagina).toHaveURL(/\/login\/?$/);
  await page.goBack();
  await expect(page.locator("#perfil-email")).not.toBeVisible();
  await otraPagina.close();
});

test("el cambio de rol actualiza una sesion abierta y retira el menu profesional", async ({ page, request }) => {
  await iniciarCuenta(page, "worker");
  await expect(page.locator("#link-agenda")).toBeVisible();
  try {
    await asignarRol(request, "fase4-worker", "client");
    await expect(page).toHaveURL(/\/\?acceso=denegado$/);
    await expect(page.locator("#link-agenda")).toBeHidden();
    await page.goto("/perfil");
    await expect(page.locator("#perfil-role")).toHaveText("Cliente");
  } finally { await asignarRol(request, "fase4-worker", "worker"); }
});

test("sin JavaScript las paginas privadas no muestran contenido ni datos de usuario", async ({ browser }) => {
  const contexto = await browser.newContext({ javaScriptEnabled: false });
  const pagina = await contexto.newPage();
  for (const ruta of ["/perfil", "/reservar", "/mis-citas", "/agenda", "/panel-barbero", "/panel", "/index-admin", "/setup-barber", "/bloqueos", "/horarios", "/equipo", "/servicios", "/kpis", "/export", "/admin", "/admin/usuarios", "/branding", "/debug"]) {
    await pagina.goto("http://127.0.0.1:4331" + ruta);
    await expect(pagina.locator("main")).toBeHidden();
    if (await pagina.locator("#perfil-email").count()) {
      expect(await pagina.locator("#perfil-email").textContent()).toBe("");
    }
  }
  await contexto.close();
});
