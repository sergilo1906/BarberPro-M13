import { expect, test } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const hayReferencia = existsSync(fileURLToPath(new URL("../../../../treball-barberia/app/dist/", import.meta.url)));

for (const ruta of ["/login", "/registro", "/verify", "/perfil"]) {
  test("apariencia original de " + ruta, async ({ page, context }, informacion) => {
    test.skip(!hayReferencia, "Falta el dist original; comparacion omitida de forma explicita.");
    await context.route("**/*", async (peticion) => {
      const host = new URL(peticion.request().url()).hostname;
      if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await peticion.continue();
      else { await peticion.abort(); throw new Error("Conexion externa no permitida: " + host); }
    });
    if (ruta === "/perfil") {
      await page.goto("/login");
      await expect(page.locator("#login-email")).toBeEnabled();
      await page.locator("#login-email").fill("fase4-client@example.test");
      await page.locator("#login-password").fill("Prueba123!");
      await page.getByRole("button", { name: "Entrar", exact: true }).click();
      await expect(page).toHaveURL(/\/reservar\/?$/);
    }
    const referencia = await context.newPage();
    await referencia.goto("http://127.0.0.1:4332" + ruta);
    await page.goto(ruta);
    if (ruta === "/login") await expect(page.locator("#login-email")).toBeEnabled();
    if (ruta === "/registro") await expect(page.locator("#reg-name")).toBeEnabled();
    if (ruta === "/verify") {
      await expect(page.locator("#verify-msg")).toHaveText("Abre el enlace del correo de verificacion para completar el acceso.");
      await referencia.locator("#verify-msg").evaluate((elemento) => {
        elemento.textContent = "Abre el enlace del correo de verificacion para completar el acceso.";
      });
    }
    if (ruta === "/perfil") {
      await expect(page.locator("#perfil-role")).toHaveText("Cliente");
      // Representación estática de los mismos datos ficticios que cargaría el controlador original.
      await referencia.evaluate(() => {
        for (const id of ["btn-login", "btn-register"]) document.getElementById(id)!.classList.add("hidden");
        for (const id of ["link-citas", "btn-profile", "btn-logout", "user-avatar"]) document.getElementById(id)!.classList.remove("hidden");
        document.getElementById("user-avatar")!.textContent = "P";
        document.getElementById("perfil-email")!.textContent = "fase4-client@example.test";
        document.getElementById("perfil-role")!.textContent = "Cliente";
        const verificacion = document.getElementById("perfil-verif")!;
        verificacion.textContent = "Verificado";
        verificacion.className = "inline-block rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700";
        (document.getElementById("perfil-name") as HTMLInputElement).value = "Prueba client";
      });
    }
    await referencia.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.fonts.ready);
    const medir = () => {
      const elementos = document.querySelectorAll("main, main section, main form, main input, main button, main p, main label, main h1, main h2");
      const medidas = [];
      for (const elemento of elementos) {
        const caja = elemento.getBoundingClientRect();
        const estilo = getComputedStyle(elemento);
        medidas.push({ etiqueta: elemento.tagName, ancho: caja.width, alto: caja.height, x: caja.x,
          fuente: estilo.fontFamily, tamano: estilo.fontSize, color: estilo.color, fondo: estilo.backgroundColor });
      }
      return medidas;
    };
    expect(await page.locator("main").innerText()).toBe(await referencia.locator("main").innerText());
    expect(await page.evaluate(medir)).toEqual(await referencia.evaluate(medir));
    expect(await referencia.locator("script").count()).toBe(0);
    const destino = informacion.snapshotPath("original.png");
    mkdirSync(path.dirname(destino), { recursive: true });
    await referencia.bringToFront();
    await referencia.locator("main").screenshot({ path: destino, animations: "disabled" });
    await page.bringToFront();
    const captura = await page.locator("main").screenshot({ path: informacion.snapshotPath("reconstruida.png"), animations: "disabled" });
    await informacion.attach("autenticacion-reconstruida", { body: captura, contentType: "image/png" });
    expect(captura).toMatchSnapshot("original.png", { maxDiffPixelRatio: 0.0001, threshold: 0.1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    await referencia.close();
  });
}
