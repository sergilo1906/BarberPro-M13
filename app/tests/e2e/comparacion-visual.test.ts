import { expect, test } from "@playwright/test";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const carpetaReferencia = fileURLToPath(new URL("../../../../treball-barberia/app/dist/", import.meta.url));
const hayReferencia = existsSync(carpetaReferencia);
const rutasPublicas = ["/", "/index-client", "/ayuda", "/legal", "/planes", "/404"];

for (const ruta of rutasPublicas) {
  test("comparacion con original " + ruta, async ({ page, context }, informacionPrueba) => {
    test.skip(!hayReferencia, "No hay compilacion original local para comparar; no se inventa una referencia.");
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
    async function prepararSuperficie(): Promise<void> {
      await page.bringToFront();
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(async () => {
        for (const peso of [400, 500, 600, 700]) await document.fonts.load(peso + " 14px Manrope");
        // Chromium puede conservar anchos intrínsecos de la tabla calculados con
        // la fuente provisional. Recalcular después de cargar las fuentes no
        // modifica el diseño final ni la tolerancia de la comparación.
        for (const tabla of document.querySelectorAll<HTMLTableElement>("table")) {
          const anterior = tabla.style.display;
          tabla.style.display = "none";
          void tabla.offsetWidth;
          tabla.style.display = anterior;
        }
        await new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver())));
      });
    }

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
    // Ambas navegaciones usan la misma superficie de Chromium. Dos pestañas
    // pueden rasterizar los bordes de las letras con distintas cachés gráficas.
    const respuestaReferencia = await page.goto("http://127.0.0.1:4332" + ruta);
    expect(respuestaReferencia?.status()).toBe(200);
    await prepararSuperficie();
    expect(await page.locator("script").count()).toBe(0);
    const textoReferencia = (await page.locator("main").innerText()).replace(/\s+/g, " ").trim();
    const medidasReferencia = await page.evaluate(medirPresentacion);
    const archivoReferencia = informacionPrueba.snapshotPath("original.png");
    mkdirSync(path.dirname(archivoReferencia), { recursive: true });
    await page.screenshot({ path: archivoReferencia, fullPage: true, animations: "disabled" });

    await page.goto("http://127.0.0.1:4331" + ruta);
    await expect(page.locator("#btn-login")).toBeVisible();
    await prepararSuperficie();
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ").trim()).toBe(textoReferencia);
    expect(peticionesNoPermitidas).toEqual([]);
    const medidasNuevas = await page.evaluate(medirPresentacion);
    compararPresentacion(medidasNuevas, medidasReferencia);
    const imagenNueva = await page.screenshot({ path: informacionPrueba.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
    await informacionPrueba.attach("pagina-reconstruida", { body: imagenNueva, contentType: "image/png" });
    // Estilos exactos, margen geométrico de 1/16 CSS px y rasterizado común.
    // Playwright espera a capturas consecutivas estables antes de comparar; evita
    // tomar como cambio de diseño un frame transitorio de rasterizado de la fuente.
    await expect(page).toHaveScreenshot("original.png", { fullPage: true, animations: "disabled", scale: "device", ...OPCIONES_IMAGEN });
  });
}
