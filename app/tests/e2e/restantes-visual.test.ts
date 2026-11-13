import { expect, test, type APIRequestContext } from "@playwright/test";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transpileModule, ScriptTarget, ModuleKind } from "typescript";
import { iniciarPersonal } from "./datos-profesional";
import { fechaReserva } from "./datos-reserva";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";

const original = fileURLToPath(new URL("../../../../treball-barberia/app/", import.meta.url));
type FilaReferencia = Record<string, any>;
function convertirCampos(campos: Record<string, any>): FilaReferencia {
  const resultado: FilaReferencia = {};
  for (const [clave, valor] of Object.entries(campos)) {
    if (valor.mapValue) resultado[clave] = convertirCampos(valor.mapValue.fields || {});
    else if (valor.arrayValue) resultado[clave] = (valor.arrayValue.values || []).map((elemento: any) => convertirCampos({ valor: elemento }).valor);
    else if (valor.integerValue !== undefined || valor.doubleValue !== undefined) resultado[clave] = Number(valor.integerValue ?? valor.doubleValue);
    else resultado[clave] = valor.stringValue ?? valor.booleanValue ?? valor.timestampValue ?? null;
  }
  return resultado;
}
async function leerDatos(request: APIRequestContext) {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "reservas-admin@example.test", password: "Prueba123!", returnSecureToken: true } });
  expect(acceso.ok()).toBe(true);
  const headers = { Authorization: "Bearer " + (await acceso.json()).idToken };
  async function coleccion(nombre: string): Promise<FilaReferencia[]> {
    const respuesta = await request.get("http://127.0.0.1:8088/v1/projects/demo-barberpro-m13/databases/(default)/documents/" + nombre + "?pageSize=1000", { headers });
    expect(respuesta.ok()).toBe(true); const datos = await respuesta.json(); expect(datos.nextPageToken).toBeUndefined();
    return (datos.documents || []).map((documento: any) => ({ id: documento.name.split("/").pop(), ...convertirCampos(documento.fields || {}) }));
  }
  return { citas: await coleccion("bookings"), equipo: await coleccion("barbers") };
}
function ejecutarPresentacion(pagina: string, datos: object, entrada: string): string {
  const codigo = readFileSync(path.join(original, "src/scripts/" + pagina + ".client.ts"), "utf8").replace(/^\uFEFF/, "").replace(/^import[\s\S]*?;\r?\n/gm, "").split("void (async () => {")[0];
  // Ningún import, SDK ni escritor original se ejecuta. Solo sus renderizadores.
  const adaptadores = "const datosReferencia = " + JSON.stringify(datos) + "; const auth = {}, db = {};";
  return "(async () => {" + transpileModule(adaptadores + codigo + entrada, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None } }).outputText + "})()";
}
const estados = ["panel-worker", "panel-manager", "kpis-day", "kpis-week", "kpis-month", "export-listado", "export-vacio"];
for (const estado of estados) test("restantes original " + estado, async ({ page, context, request }, informacion) => {
  test.skip(!existsSync(path.join(original, "dist/panel/index.html")), "Falta compilacion original local; no se fabrica referencia.");
  await context.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
    else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
  const escenario = informacion.project.name === "tableta" ? "escritorio" : informacion.project.name;
  const worker = estado === "panel-worker", uid = "profesional-" + escenario;
  const ruta = estado.startsWith("panel") ? "/panel" : estado.startsWith("kpis") ? "/kpis" : "/export";
  await iniciarPersonal(page, worker ? uid : "reservas-admin"); await page.goto(ruta);
  await expect(page.locator("html")).not.toHaveAttribute("data-auth-pending", ""); await expect(page.locator("#link-setup")).toBeVisible();
  if (ruta === "/panel") await expect(page.locator("#stat-total-min")).not.toHaveText("0 min");
  if (ruta === "/kpis") { await page.locator("#kpi-range").selectOption(estado.slice(5)); await expect(page.locator("#kpi-msg")).toContainText("Periodo:"); }
  if (ruta === "/export") {
    await expect(page.locator("#export-msg")).toContainText("citas encontradas.");
    if (estado === "export-vacio") { await page.locator("#export-from").fill("1999-01-01"); await page.locator("#export-to").fill("1999-01-02"); await page.locator("#export-preview").click(); await expect(page.locator("#export-msg")).toHaveText("No hay citas en ese rango."); }
  }
  const navegacion = await page.locator("nav [id]").evaluateAll((elementos) => elementos.map((elemento) => ({ id: elemento.id, visible: !elemento.classList.contains("hidden"), texto: elemento.id === "user-avatar" ? elemento.textContent : null })));
  const datos = await leerDatos(request);
  const referencia = await context.newPage();
  try {
    await referencia.goto("http://127.0.0.1:4332" + ruta);
    await referencia.evaluate((navegacion) => { document.documentElement.removeAttribute("data-auth-pending"); for (const item of navegacion) { const elemento = document.getElementById(item.id); if (elemento) { elemento.classList.toggle("hidden", !item.visible); if (item.texto !== null) elemento.textContent = item.texto; } } }, navegacion);
    // Los renderizadores originales usan innerHTML. Escapar datos evita ejecutar
    // el contenido hostil de los fixtures sin cambiar la apariencia del texto.
    const escapar = (valor: unknown) => String(valor ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
    if (ruta === "/panel") {
      const citas = datos.citas.filter((cita) => cita.dateStr === fechaReserva(0) && (!worker || cita.barberUid === uid) && !["cancelled", "rescheduled"].includes(cita.status));
      const nombres = datos.equipo.filter((persona) => persona.active !== false && persona.isActive !== false).map((persona) => [persona.id, escapar(persona.name)]);
      const seguras = citas.map((cita) => ({ ...cita, userName: escapar(cita.userName), serviceSnapshot: { ...cita.serviceSnapshot, name: escapar(cita.serviceSnapshot?.name || cita.serviceName || "Servicio") } }));
      await referencia.evaluate(ejecutarPresentacion("panel", { citas: seguras, nombres, rol: worker ? "worker" : "admin" }, '\nrole=datosReferencia.rol; for(const [uid,nombre] of datosReferencia.nombres)barberNames.set(uid,nombre); renderStats(datosReferencia.citas); renderNextBookings(datosReferencia.citas); panelMsg.textContent="";'));
    } else if (ruta === "/kpis") {
      const periodo = (await page.locator("#kpi-msg").innerText()).match(/(\d{4}-\d{2}-\d{2}) a (\d{4}-\d{2}-\d{2})/)!;
      const citas = datos.citas.filter((cita) => cita.dateStr >= periodo[1] && cita.dateStr <= periodo[2] && cita.status !== "rescheduled");
      // Diferencia funcional explícita: canceladas no consumen tiempo reservado.
      const tarjetas = citas.map((cita) => cita.status === "cancelled" ? { ...cita, durationMin: 0, serviceSnapshot: { ...cita.serviceSnapshot, durationMin: 0 } } : cita);
      const seguras = citas.map((cita) => ({ ...cita, serviceSnapshot: { ...cita.serviceSnapshot, name: escapar(cita.serviceSnapshot?.name || cita.serviceName || "Servicio") } }));
      const nombres = datos.equipo.map((persona) => [persona.id, escapar(persona.name)]);
      await referencia.locator("#kpi-range").selectOption(estado.slice(5));
      await referencia.evaluate(ejecutarPresentacion("kpis", { tarjetas, citas: seguras, nombres, mensaje: await page.locator("#kpi-msg").innerText() }, '\nrenderCards(datosReferencia.tarjetas); renderTopServices(datosReferencia.citas); renderStaffLoad(datosReferencia.citas,new Map(datosReferencia.nombres)); setMsg(datosReferencia.mensaje);'));
    } else if (ruta === "/export") {
      const inicio = await page.locator("#export-from").inputValue(), fin = await page.locator("#export-to").inputValue();
      const nombres = new Map(datos.equipo.map((persona) => [persona.id, persona.name]));
      const filas = datos.citas.filter((cita) => cita.dateStr >= inicio && cita.dateStr <= fin).sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.timeStr.localeCompare(b.timeStr)).map((cita) => ({ fecha: cita.dateStr, hora: cita.timeStr, estado: cita.status || "pending", servicio: escapar(cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio"), profesional: escapar(nombres.get(cita.barberUid) || cita.barberUid || ""), cliente: escapar(cita.userName || cita.userEmail || cita.userPhone || "Cliente sin nombre") }));
      await referencia.locator("#export-from").fill(inicio); await referencia.locator("#export-to").fill(fin);
      await referencia.evaluate(ejecutarPresentacion("export", { filas, mensaje: await page.locator("#export-msg").innerText() }, '\nrenderPreview(datosReferencia.filas); setMsg(datosReferencia.mensaje);'));
    }
    for (const superficie of [referencia, page]) {
      await superficie.evaluate(async () => { await document.fonts.ready; for (const peso of [400, 500, 600, 700]) await document.fonts.load(peso + " 14px Manrope"); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
      await superficie.mouse.move(0, 0); await superficie.bringToFront(); await superficie.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    }
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ")).toBe((await referencia.locator("main").innerText()).replace(/\s+/g, " "));
    const medir = () => Array.from(document.querySelectorAll("main section, main h1, main h2, main h3, main p, main article, main input, main select, main button, main td, main th")).map((elemento) => { const caja = elemento.getBoundingClientRect(), estilo = getComputedStyle(elemento); return { etiqueta: elemento.tagName, x: caja.x, y: caja.y, ancho: caja.width, alto: caja.height, fuente: estilo.fontFamily, tamano: estilo.fontSize, peso: estilo.fontWeight, color: estilo.color, fondo: estilo.backgroundColor }; });
    compararPresentacion(await page.evaluate(medir), await referencia.evaluate(medir));
    const destino = informacion.snapshotPath("original.png"); mkdirSync(path.dirname(destino), { recursive: true }); await referencia.bringToFront(); await referencia.screenshot({ path: destino, fullPage: true, animations: "disabled" }); await page.bringToFront();
    await expect(page).toHaveScreenshot("original.png", { fullPage: true, animations: "disabled", scale: "device", ...OPCIONES_IMAGEN });
    await page.screenshot({ path: informacion.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
  } finally { await referencia.close(); }
});
