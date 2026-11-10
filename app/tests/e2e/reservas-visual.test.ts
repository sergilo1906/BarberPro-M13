import { expect, test } from "@playwright/test";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";
import { existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { fechaReserva, abrirReserva } from "./datos-reserva";

const hayReferencia = existsSync(fileURLToPath(new URL("../../../../treball-barberia/app/dist/", import.meta.url)));

for (const estado of ["disponible", "vacio", "confirmacion"]) {
  test("reserva original en estado " + estado, async ({ page, context }, informacion) => {
    test.skip(!hayReferencia, "Falta el dist original para comparar.");
    await context.route("**/*", async (ruta) => {
      const host = new URL(ruta.request().url()).hostname;
      if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
      else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
    });
    const fecha = fechaReserva(14);
    await abrirReserva(page, fecha);
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo({ top: window.scrollY, behavior: "instant" });
    });
    if (estado === "vacio") {
      await page.locator("#barber-select").selectOption("demo_sin_semana");
      await expect(page.locator("#slots-msg")).toHaveText("Sin disponibilidad.");
    }
    const opciones = await page.locator("#barber-select").evaluate((elemento) => Array.from((elemento as HTMLSelectElement).options).map((opcion) => ({ value: opcion.value, text: opcion.text })));
    const huecos = await page.locator(".slot-btn").evaluateAll((elementos) => elementos.map((elemento) => ({ hora: (elemento as HTMLElement).dataset.time!, uid: (elemento as HTMLElement).dataset.barber!, nombre: elemento.children[1].textContent || "" })));
    const referencia = await context.newPage();
    await referencia.goto("http://127.0.0.1:4332/reservar");
    await referencia.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
    // Se usa el HTML compilado original sin scripts ni conexiones. Se representan
    // sus mismos estados dinámicos con el catálogo ficticio y los huecos de prueba.
    await referencia.evaluate(({ opciones, huecos, fecha, vacio }) => {
      for (const id of ["btn-login", "btn-register"]) document.getElementById(id)!.classList.add("hidden");
      for (const id of ["link-citas", "btn-profile", "btn-logout", "user-avatar"]) document.getElementById(id)!.classList.remove("hidden");
      document.getElementById("user-avatar")!.textContent = "P";
      const servicio = document.getElementById("service-select") as HTMLSelectElement;
      servicio.replaceChildren(new Option("Barba - 20 min - 10.00 EUR", "svc_beard"), new Option("Corte - 30 min - 15.00 EUR", "svc_haircut"), new Option("Corte + Barba - 50 min - 22.00 EUR", "svc_combo"));
      servicio.value = "svc_haircut";
      const profesional = document.getElementById("barber-select") as HTMLSelectElement;
      profesional.replaceChildren();
      for (const opcion of opciones) profesional.add(new Option(opcion.text, opcion.value));
      profesional.value = vacio ? "demo_sin_semana" : "demo_worker_1";
      (document.getElementById("any-barber") as HTMLInputElement).checked = false;
      (document.getElementById("date-select") as HTMLInputElement).value = fecha;
      document.getElementById("slots-msg")!.textContent = vacio ? "Sin disponibilidad." : "Selecciona una hora para confirmar tu reserva.";
      const lista = document.getElementById("slots-list")!;
      if (vacio) {
        lista.innerHTML = '<div class="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1"><p class="font-medium">Sin disponibilidad para esta seleccion.</p><p>Prueba otro dia, otro servicio o marca "Cualquier profesional disponible".</p></div>';
      } else {
        for (const hueco of huecos) {
          const boton = document.createElement("button");
          boton.type = "button";
          boton.className = "slot-btn rounded border border-green-500 bg-green-50 px-3 py-2 text-left hover:bg-green-100";
          const hora = document.createElement("div");
          hora.className = "font-medium text-green-900";
          hora.textContent = hueco.hora;
          const nombre = document.createElement("div");
          nombre.className = "text-xs text-green-700";
          nombre.textContent = hueco.nombre;
          boton.append(hora, nombre);
          lista.append(boton);
        }
      }
    }, { opciones, huecos, fecha, vacio: estado === "vacio" });
    if (estado === "confirmacion") {
      await page.locator('.slot-btn[data-time="09:10"]').click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await referencia.locator("h2").click();
      await referencia.evaluate((fecha) => {
        const fondo = document.createElement("div");
        fondo.className = "fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4";
        // Plantilla estática del modal original; los datos se escriben como texto.
        fondo.innerHTML = '<div class="relative w-full max-w-md rounded-xl bg-white p-4 shadow-2xl"><button type="button" class="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Cerrar">X</button><div class="pr-6"><div class="space-y-3"><h3 class="text-base font-semibold text-slate-900">Confirmar reserva</h3><p class="text-sm text-slate-600 whitespace-pre-line"></p><div class="flex justify-end gap-2 pt-2"><button type="button" class="rounded border px-3 py-2 text-sm">Seguir eligiendo</button><button type="button" data-confirmar class="rounded px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Confirmar reserva</button></div></div></div></div>';
        fondo.querySelector("p")!.textContent = "Servicio: Corte\nFecha: " + fecha + "\nHora: 09:10\nProfesional: Alex";
        document.body.append(fondo);
        fondo.querySelector<HTMLButtonElement>("[data-confirmar]")!.focus();
      }, fecha);
      const desplazamiento = await page.evaluate(() => window.scrollY);
      await referencia.evaluate((posicion) => window.scrollTo({ top: posicion, behavior: "instant" }), desplazamiento);
    } else {
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    }
    await page.evaluate(() => document.fonts.ready);
    await referencia.evaluate(() => document.fonts.ready);
    await page.mouse.move(0, 0);
    await referencia.mouse.move(0, 0);
    const medir = () => Array.from(document.querySelectorAll("main section, main header, main label, main select, main input, main textarea, main h2, #slots-msg, #slots-list, .slot-btn")).map((elemento) => {
      const caja = elemento.getBoundingClientRect();
      const estilo = getComputedStyle(elemento);
      return { etiqueta: elemento.tagName, ancho: caja.width, alto: caja.height, x: caja.x, fuente: estilo.fontFamily, tamano: estilo.fontSize, color: estilo.color, fondo: estilo.backgroundColor };
    });
    compararPresentacion(await page.evaluate(medir), await referencia.evaluate(medir));
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ")).toBe((await referencia.locator("main").innerText()).replace(/\s+/g, " "));
    const destino = informacion.snapshotPath("original.png");
    mkdirSync(path.dirname(destino), { recursive: true });
    await referencia.bringToFront();
    await referencia.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await referencia.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await referencia.screenshot({ path: destino, fullPage: true, animations: "disabled" });
    await page.bringToFront();
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    const imagen = await page.screenshot({ path: informacion.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
    expect(imagen).toMatchSnapshot("original.png", OPCIONES_IMAGEN);
    await referencia.close();
  });
}
