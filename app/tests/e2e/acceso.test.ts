import { expect, test } from "@playwright/test";

const rutasPublicas = ["/", "/index-client", "/ayuda", "/legal", "/planes", "/404"];
const rutasPendientes = [
  "/perfil", "/reservar", "/mis-citas",
  "/agenda", "/panel-barbero", "/panel", "/index-admin", "/setup-barber",
  "/bloqueos", "/horarios", "/equipo", "/servicios", "/admin", "/admin/usuarios",
  "/branding", "/kpis", "/export", "/debug",
];

test.beforeEach(async ({ page }) => {
  await page.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (host === "127.0.0.1" || host === "localhost" || host === "fonts.googleapis.com" || host === "fonts.gstatic.com") {
      await ruta.continue();
    } else {
      throw new Error("Peticion externa no prevista: " + host);
    }
  });
});

for (const ruta of rutasPublicas) {
  test("pagina publica " + ruta, async ({ page }) => {
    const errores: string[] = [];
    page.on("pageerror", (error) => errores.push(error.message));
    const respuesta = await page.goto(ruta);
    expect(respuesta?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("footer")).toContainText("BarberPro Studio | Reservas y agenda de barberia");
    await expect(page.locator("#btn-login")).toBeVisible();
    await expect(page.locator("#link-admin")).toBeHidden();
    expect(errores).toEqual([]);
  });
}

for (const ruta of rutasPendientes) {
  test("ruta privada rechaza acceso invitado " + ruta, async ({ page }) => {
    await page.addInitScript(() => {
      // Un valor local no debe convertirse en autorización.
      localStorage.setItem("role", "admin");
    });
    await page.goto(ruta);
    await expect(page).toHaveURL(/\/login\/?$/);
    await expect(page.locator("#login-form")).toBeVisible();
    await expect(page.locator("#link-admin")).toBeHidden();
  });
}

test("navegacion publica y destino honesto de reserva", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Cliente Pedir cita" }).click();
  await expect(page).toHaveURL(/\/login\/?$/);
  await page.goto("/");
  await page.goto("/ayuda");
  await expect(page.getByRole("heading", { name: "Ayuda", exact: true })).toBeVisible();
  const hayDesbordamiento = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hayDesbordamiento).toBe(false);
});

test("recursos y estilos compartidos", async ({ page, request }) => {
  await page.goto("/");
  const favicon = await request.get("/favicon.svg");
  expect(favicon.status()).toBe(200);
  expect(favicon.headers()["content-type"]).toContain("image/svg+xml");
  expect(await favicon.text()).toContain("✂");
  const estilos = await page.locator('link[rel="stylesheet"]').evaluateAll((enlaces) => enlaces.map((enlace) => (enlace as HTMLLinkElement).href));
  for (const enlace of estilos) {
    if (enlace.startsWith("http://127.0.0.1")) {
      expect((await request.get(enlace)).status()).toBe(200);
    }
  }
  const fondo = await page.locator("body").evaluate((cuerpo) => getComputedStyle(cuerpo).backgroundColor);
  expect(fondo).toBe("rgb(243, 244, 246)");
});

test("ruta desconocida devuelve 404 con la pagina propia", async ({ page }) => {
  const respuesta = await page.goto("/ruta-que-no-existe");
  expect(respuesta?.status()).toBe(404);
  await expect(page.getByRole("heading")).toContainText("Esta pagina no existe");
});

test("las rutas con barra final conservan el cierre seguro", async ({ page }) => {
  await page.goto("/admin/usuarios/");
  await expect(page).toHaveURL(/\/login\/?$/);
  await expect(page.locator("#link-admin")).toBeHidden();
});
