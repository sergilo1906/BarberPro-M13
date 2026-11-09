import { expect, test } from "@playwright/test";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const carpetaReferencia = fileURLToPath(new URL("../../../../treball-barberia/app/dist/", import.meta.url));
const hayReferencia = existsSync(carpetaReferencia);
const rutasPublicas = ["/", "/index-client", "/ayuda", "/legal", "/planes", "/404"];

for (const ruta of rutasPublicas) {
  test("comparacion con original " + ruta, async ({ page, context }, informacionPrueba) => {
    test.skip(!hayReferencia, "No hay compilacion original local para comparar; no se inventa una referencia.");
    const referencia = await context.newPage();
    const peticionesNoPermitidas: string[] = [];
    await context.route("**/*", async (peticion) => {
      const host = new URL(peticion.request().url()).hostname;
      if (host === "localhost" || host === "127.0.0.1" || host === "fonts.googleapis.com" || host === "fonts.gstatic.com") {
        await peticion.continue();
      } else {
        peticionesNoPermitidas.push(host);
        await peticion.abort();
      }
    });
    const respuestaReferencia = await referencia.goto("http://127.0.0.1:4332" + ruta);
    expect(respuestaReferencia?.status()).toBe(200);
    await page.goto(ruta);
    await expect(page.locator("#btn-login")).toBeVisible();
    await referencia.evaluate(() => document.fonts.ready);
    await page.evaluate(() => document.fonts.ready);

    const textoReferencia = (await referencia.locator("main").innerText()).replace(/\s+/g, " ").trim();
    const textoNuevo = (await page.locator("main").innerText()).replace(/\s+/g, " ").trim();
    expect(textoNuevo).toBe(textoReferencia);
    expect(peticionesNoPermitidas).toEqual([]);
    expect(await referencia.locator("script").count()).toBe(0);

    const medirPresentacion = () => {
      const elementos = document.querySelectorAll("nav, main, footer, main h1, main h2, main h3, main p, main th, main td");
      const medidas = [];
      for (const elemento of elementos) {
        const caja = elemento.getBoundingClientRect();
        const estilo = getComputedStyle(elemento);
        medidas.push({
          etiqueta: elemento.tagName,
          x: caja.x, y: caja.y, ancho: caja.width, alto: caja.height,
          fuente: estilo.fontFamily, tamano: estilo.fontSize,
          peso: estilo.fontWeight, color: estilo.color, fondo: estilo.backgroundColor,
        });
      }
      return medidas;
    };
    expect(await page.evaluate(medirPresentacion)).toEqual(await referencia.evaluate(medirPresentacion));

    const archivoReferencia = informacionPrueba.snapshotPath("original.png");
    mkdirSync(path.dirname(archivoReferencia), { recursive: true });
    await referencia.bringToFront();
    await referencia.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    await referencia.screenshot({ path: archivoReferencia, fullPage: true, animations: "disabled" });
    await page.bringToFront();
    await page.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    const imagenNueva = await page.screenshot({ path: informacionPrueba.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
    await informacionPrueba.attach("pagina-reconstruida", { body: imagenNueva, contentType: "image/png" });
    // Geometría y estilos ya se exigen exactos. Este umbral evita falsos fallos
    // por pequeños cambios de rasterizado de texto entre superficies Chromium:
    // se admite como máximo el 0,01 % de píxeles con diferencia perceptible.
    expect(imagenNueva).toMatchSnapshot("original.png", { maxDiffPixelRatio: 0.0001, threshold: 0.1 });
    await referencia.close();
  });
}
