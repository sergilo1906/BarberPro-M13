import { expect, test, type APIRequestContext } from "@playwright/test";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transpileModule, ScriptTarget, ModuleKind } from "typescript";
import { abrirMisCitas } from "./datos-cliente";

const original = fileURLToPath(new URL("../../../../treball-barberia/app/", import.meta.url));
const hayReferencia = existsSync(path.join(original, "dist/mis-citas/index.html"));
const huecos = [{ timeStr: "09:10", barberUid: "demo_worker_1" }, { timeStr: "09:25", barberUid: "demo_worker_1" }];

async function obtenerDatosReferencia(request: APIRequestContext, sufijo: string) {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "cliente-" + sufijo + "@example.test", password: "Prueba123!", returnSecureToken: true } });
  const identidad = await acceso.json();
  const consulta = await request.post("http://127.0.0.1:8088/v1/projects/demo-barberpro-m13/databases/(default)/documents:runQuery", {
    headers: { Authorization: "Bearer " + identidad.idToken },
    data: { structuredQuery: { from: [{ collectionId: "bookings" }], where: { fieldFilter: { field: { fieldPath: "userId" }, op: "EQUAL", value: { stringValue: "cliente-" + sufijo } } } } },
  });
  expect(consulta.ok()).toBe(true);
  function convertir(valor: Record<string, any>): any {
    if (valor.mapValue) return convertirCampos(valor.mapValue.fields || {});
    if (valor.arrayValue) return (valor.arrayValue.values || []).map(convertir);
    return valor.stringValue ?? valor.timestampValue ?? (valor.integerValue !== undefined ? Number(valor.integerValue) : valor.doubleValue ?? valor.booleanValue ?? null);
  }
  function convertirCampos(campos: Record<string, any>): Record<string, any> {
    const resultado: Record<string, any> = {};
    for (const [clave, valor] of Object.entries(campos)) resultado[clave] = convertir(valor);
    return resultado;
  }
  const datos = await consulta.json();
  return datos.filter((fila: any) => fila.document).map((fila: any) => ({ ...convertirCampos(fila.document.fields), id: fila.document.name.split("/").pop() }));
}

function obtenerRenderOriginal(citas: object[]): string {
  // Solo UI original: sin imports Firebase, sin inicialización y sin SDK ejecutable.
  const interfaz = readFileSync(path.join(original, "src/lib/ui.ts"), "utf8").replace(/export /g, "");
  let controlador = readFileSync(path.join(original, "src/scripts/mis-citas.client.ts"), "utf8").split("void (async () => {")[0];
  controlador = controlador.replace(/^import[^\n]+\n/gm, "").replace(/^const (?:cancelBookingCall|rescheduleBookingCall|getAvailabilityCall) = httpsCallable[^\n]+\n/gm, "");
  const codigo = interfaz + "\n" + controlador + '\nconst cancelBookingCall = async () => ({data:{ok:true}}); const rescheduleBookingCall = cancelBookingCall; const getAvailabilityCall = async () => ({data:{slots:' + JSON.stringify(huecos) + '}}); bookingsCache = ' + JSON.stringify(citas) + '.map((cita) => ({...cita, startAt: cita.startAt ? {toDate: () => new Date(cita.startAt)} : undefined})); bookingsCache.sort((a,b) => (a.dateStr+a.timeStr).localeCompare(b.dateStr+b.timeStr)); barberNames.set("demo_worker_1", "Alex"); barberNames.set("demo_worker_2", "Marta"); renderBookings(bookingsCache);';
  return "(() => {" + transpileModule(codigo, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None } }).outputText + "})()";
}

for (const estado of ["vacio", "listado", "cancelacion", "cambio"]) {
  test("cliente original en estado " + estado, async ({ page, context, request }, informacion) => {
    test.skip(!hayReferencia, "Falta la compilacion original para comparar.");
    await context.route("**/*", async (ruta) => {
      const host = new URL(ruta.request().url()).hostname;
      if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
      else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
    });
    if (estado === "cambio") await page.route("**/europe-west1/getAvailability", (ruta) => ruta.fulfill({ json: { result: { ok: true, slots: huecos } } }));
    const sufijo = estado === "vacio" ? "vacio" : (informacion.project.name === "tableta" ? "escritorio" : informacion.project.name);
    await abrirMisCitas(page, sufijo);
    await expect(page.locator("#my-list article")).toHaveCount(estado === "vacio" ? 0 : 8);
    const citas = await obtenerDatosReferencia(request, sufijo);
    const referencia = await context.newPage();
    await referencia.goto("http://127.0.0.1:4332/mis-citas");
    await referencia.evaluate(() => {
      document.documentElement.removeAttribute("data-auth-pending");
      for (const id of ["btn-login", "btn-register"]) document.getElementById(id)!.classList.add("hidden");
      for (const id of ["link-citas", "btn-profile", "btn-logout", "user-avatar"]) document.getElementById(id)!.classList.remove("hidden");
      document.getElementById("user-avatar")!.textContent = "C";
    });
    await referencia.evaluate(obtenerRenderOriginal(citas));
    if (estado === "cancelacion" || estado === "cambio") {
      const selector = 'article[data-id="cliente-' + sufijo + '-confirmed"] .' + (estado === "cambio" ? "reschedule-btn" : "cancel-btn");
      await page.locator(selector).click(); await referencia.locator(selector).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      if (estado === "cambio") { await expect(page.locator(".slot-choice")).toHaveCount(2); await expect(referencia.locator(".slot-choice")).toHaveCount(2); }
    }
    for (const superficie of [referencia, page]) {
      await superficie.evaluate(() => document.fonts.ready);
      await superficie.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo({ top: 0, behavior: "instant" }); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await superficie.mouse.move(0, 0);
      await superficie.bringToFront();
      await superficie.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    }
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ")).toBe((await referencia.locator("main").innerText()).replace(/\s+/g, " "));
    const medir = () => Array.from(document.querySelectorAll("main section, main h2, main label, main input, main select, #my-msg, #my-list, article, article p, article span, article button, [data-modal-content]")).map((elemento) => {
      const caja = elemento.getBoundingClientRect(), estilo = getComputedStyle(elemento);
      return { tag: elemento.tagName, x: caja.x, ancho: caja.width, alto: caja.height, fuente: estilo.fontFamily, tamano: estilo.fontSize, color: estilo.color, fondo: estilo.backgroundColor };
    });
    compararPresentacion(await page.evaluate(medir), await referencia.evaluate(medir));
    const destino = informacion.snapshotPath("original.png"); mkdirSync(path.dirname(destino), { recursive: true });
    await referencia.bringToFront(); await referencia.screenshot({ path: destino, fullPage: true, animations: "disabled" });
    await page.bringToFront();
    await expect(page).toHaveScreenshot("original.png", { fullPage: true, animations: "disabled", scale: "device", ...OPCIONES_IMAGEN });
    await page.screenshot({ path: informacion.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
    await referencia.close();
  });
}
