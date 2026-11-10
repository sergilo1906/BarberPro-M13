import { expect, test, type APIRequestContext } from "@playwright/test";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transpileModule, ScriptTarget, ModuleKind } from "typescript";
import { iniciarPersonal, llamarPersonal, fechaReserva } from "./datos-profesional";

const original = fileURLToPath(new URL("../../../../treball-barberia/app/", import.meta.url));
const hayReferencia = existsSync(path.join(original, "dist/agenda/index.html"));

async function obtenerDatos(request: APIRequestContext, cuenta: string, coleccion: string, uid: string, documento = "") {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: cuenta + "@example.test", password: "Prueba123!", returnSecureToken: true } });
  expect(acceso.ok()).toBe(true); const identidad = await acceso.json();
  const raiz = "http://127.0.0.1:8088/v1/projects/demo-barberpro-m13/databases/(default)/documents";
  const headers = { Authorization: "Bearer " + identidad.idToken };
  const respuesta = documento ? await request.get(raiz + "/" + documento, { headers }) : await request.post(raiz + ":runQuery", { headers, data: { structuredQuery: { from: [{ collectionId: coleccion }], where: { fieldFilter: { field: { fieldPath: "barberUid" }, op: "EQUAL", value: { stringValue: uid } } } } } });
  expect(respuesta.ok()).toBe(true);
  function valor(dato: any): any { if (dato.mapValue) return campos(dato.mapValue.fields || {}); if (dato.arrayValue) return (dato.arrayValue.values || []).map(valor); return dato.stringValue ?? dato.timestampValue ?? (dato.integerValue !== undefined ? Number(dato.integerValue) : dato.doubleValue ?? dato.booleanValue ?? null); }
  function campos(datos: Record<string, any>): Record<string, any> { const resultado: Record<string, any> = {}; for (const [clave, dato] of Object.entries(datos)) resultado[clave] = valor(dato); return resultado; }
  const datos = await respuesta.json();
  return documento ? campos(datos.fields) : datos.filter((fila: any) => fila.document).map((fila: any) => ({ ...campos(fila.document.fields), id: fila.document.name.split("/").pop() }));
}
function codigoOriginal(pagina: string, datos: object, uid: string, hoy: string, extras: object): string {
  const quitarImports = (texto: string) => texto.replace(/^\uFEFF/, "").replace(/^import[\s\S]*?;\r?\n/gm, "");
  const interfaz = readFileSync(path.join(original, "src/lib/ui.ts"), "utf8").replace(/export /g, "");
  const semana = pagina === "setup-barber" ? readFileSync(path.join(original, "src/lib/week.ts"), "utf8").replace(/export /g, "") : "";
  let controlador = quitarImports(readFileSync(path.join(original, "src/scripts/" + pagina + ".client.ts"), "utf8").split("void (async () => {")[0]);
  controlador = controlador.replace(/^const updateBookingStatusCall = httpsCallable[^\n]+\n/gm, "");
  const entrada = "const datosReferencia = " + JSON.stringify(datos) + "; const extrasReferencia = " + JSON.stringify(extras) + "; " + (pagina === "setup-barber" ? "currentTargetUid" : "currentUid") + " = " + JSON.stringify(uid) + "; currentRole = extrasReferencia.rol;";
  let render = "";
  if (pagina === "agenda") render = 'barberNames.set(currentUid, extrasReferencia.nombre); dateInput.value = extrasReferencia.fecha; bookingsCache = datosReferencia.filter(cita => cita.dateStr === extrasReferencia.fecha).sort((a,b) => a.timeStr.localeCompare(b.timeStr)); renderAgenda();';
  if (pagina === "panel-barbero") render = 'barberNames.set(currentUid, extrasReferencia.nombre); yyyymmdd = () => ' + JSON.stringify(hoy) + '; const citas = datosReferencia.filter(cita => cita.status !== "cancelled" && cita.status !== "rescheduled"); renderStats(citas); renderNext(citas);';
  if (pagina === "setup-barber") render = 'currentTargetUid = ' + JSON.stringify(uid) + '; barberWrap.classList.toggle("hidden", currentRole === "worker"); barberSelect.replaceChildren(); for (const opcion of extrasReferencia.opciones) barberSelect.add(new Option(opcion.texto,opcion.valor)); barberSelect.value = currentTargetUid; fillForm(buildScheduleForForm(datosReferencia)); syncWeekUi(datosReferencia.weekStart); weekPublished.checked = datosReferencia.published; barberHelp.textContent = professionalSummary({isActive:true}, datosReferencia);';
  if (pagina === "bloqueos") render = 'barberNames.set(currentUid,extrasReferencia.nombre); barberInput.replaceChildren(new Option(extrasReferencia.nombre,currentUid)); barberInput.disabled = true; dateInput.value = ' + JSON.stringify(hoy) + '; vacationStartInput.value = ' + JSON.stringify(hoy) + '; vacationEndInput.value = ' + JSON.stringify(hoy) + '; typeSel.value = extrasReferencia.tipo; yyyymmdd = () => ' + JSON.stringify(hoy) + '; refreshTypeView(); await loadBlocks();';
  const simuladores = 'const db = {}; const isStaff = rol => ["worker","manager","admin"].includes(rol); const collection = (...args) => args; const query = (...args) => args; const where = (...args) => args; const getDocs = async () => ({ docs: datosReferencia.map(dato => ({ id:dato.id, data:()=>dato })) }); const updateBookingStatusCall = async () => ({data:{ok:true}});';
  // Se ejecuta únicamente presentación original. No quedan imports, inicialización,
  // autenticación ni escritores Firebase originales; los adaptadores son locales.
  const codigo = interfaz + "\n" + semana + "\n" + controlador + "\n" + entrada + simuladores + render;
  return "(async () => {" + transpileModule(codigo, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None } }).outputText + "})()";
}

const estados = ["agenda-vacia", "agenda-listado", "panel", "horario-worker", "horario-manager", "bloqueos-vacio", "bloqueos-listado", "bloqueos-vacaciones"];
for (const estado of estados) test("profesional original " + estado, async ({ page, context, request }, informacion) => {
  test.skip(!hayReferencia, "Falta el dist original.");
  await context.route("**/*", async (ruta) => { const host = new URL(ruta.request().url()).hostname; if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue(); else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); } });
  const uid = "profesional-" + (informacion.project.name === "tableta" ? "escritorio" : informacion.project.name), gestion = estado === "horario-manager";
  const cuenta = gestion ? "reservas-manager" : uid, rol = gestion ? "manager" : "worker";
  const pagina = estado.startsWith("agenda") ? "agenda" : estado.startsWith("horario") ? "setup-barber" : estado === "panel" ? "panel-barbero" : "bloqueos";
  let creado = "";
  if (estado === "bloqueos-listado") {
    const respuesta = await llamarPersonal(request, cuenta, "createScheduleBlock", { barberUid: uid, type: "internal", dateStr: fechaReserva(28), start: "16:00", end: "17:00", reason: "Formacion ficticia", requestId: "visual-" + crypto.randomUUID() });
    expect(respuesta.ok()).toBe(true); creado = (await respuesta.json()).result.blockId;
  }
  let referencia: import("@playwright/test").Page | null = null;
  try {
    await iniciarPersonal(page, cuenta);
    await page.goto("/" + pagina + (gestion ? "?barberUid=" + uid : ""));
    if (pagina === "agenda") { await expect(page.locator("#agenda-list article")).toHaveCount(5); if (estado === "agenda-vacia") { await page.locator("#agenda-date").fill(fechaReserva(5)); await expect(page.locator("#agenda-list")).toContainText("No hay citas"); } }
    if (pagina === "panel-barbero") await expect(page.locator("#stats-cards > div")).toHaveCount(4);
    if (pagina === "setup-barber") await expect(page.locator("#save-config")).toBeEnabled();
    if (pagina === "bloqueos") { await expect(page.locator("#block-date")).toHaveValue(fechaReserva(0)); await expect(page.locator("#blocks-list")).not.toHaveText("Cargando bloqueos..."); if (estado === "bloqueos-vacaciones") await page.locator("#block-type").selectOption("vacation"); }
    const hoy = fechaReserva(0), fecha = pagina === "agenda" ? await page.locator("#agenda-date").inputValue() : hoy;
    const nombre = (informacion.project.name === "tableta" ? "escritorio" : informacion.project.name) === "movil" ? "Profesional movil" : "Profesional escritorio";
    let datos: object = [];
    if (pagina === "agenda" || pagina === "panel-barbero") datos = await obtenerDatos(request, cuenta, "bookings", uid);
    if (pagina === "setup-barber") datos = await obtenerDatos(request, cuenta, "", uid, "barbers/" + uid + "/weeklySchedules/" + await page.locator("#week-date").inputValue());
    if (pagina === "bloqueos") datos = await obtenerDatos(request, cuenta, "blocks", uid);
    const opciones = pagina === "setup-barber" ? await page.locator("#setup-barber-select").evaluate((elemento) => Array.from((elemento as HTMLSelectElement).options).map((opcion) => ({ texto: opcion.text, valor: opcion.value }))) : [];
    const navegacion = await page.locator("nav [id]").evaluateAll((elementos) => elementos.map((elemento) => ({ id: elemento.id, visible: !elemento.classList.contains("hidden"), texto: elemento.id === "user-avatar" ? elemento.textContent : null })));
    referencia = await context.newPage(); await referencia.goto("http://127.0.0.1:4332/" + pagina);
    await referencia.evaluate((navegacion) => { document.documentElement.removeAttribute("data-auth-pending"); for (const item of navegacion) { const elemento = document.getElementById(item.id); if (elemento) { elemento.classList.toggle("hidden", !item.visible); if (item.texto !== null) elemento.textContent = item.texto; } } }, navegacion);
    await referencia.evaluate(codigoOriginal(pagina, datos, uid, hoy, { rol, fecha, nombre, opciones, tipo: estado === "bloqueos-vacaciones" ? "vacation" : "exception" }));
    for (const superficie of [referencia, page]) {
      await superficie.evaluate(async () => { await document.fonts.ready; for (const peso of [400, 500, 600, 700]) await document.fonts.load(peso + " 14px Manrope"); });
      await superficie.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo({ top: 0, behavior: "instant" }); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await superficie.mouse.move(0, 0); await superficie.bringToFront(); await superficie.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    }
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ")).toBe((await referencia.locator("main").innerText()).replace(/\s+/g, " "));
    const medir = () => Array.from(document.querySelectorAll("main section, main h1, main h2, main h3, main label, main input, main select, main button, main article, main p, main table, main th, main td")).map((elemento) => { const caja = elemento.getBoundingClientRect(), estilo = getComputedStyle(elemento); return { tag: elemento.tagName, x: caja.x, y: caja.y, ancho: caja.width, alto: caja.height, fuente: estilo.fontFamily, tamano: estilo.fontSize, peso: estilo.fontWeight, color: estilo.color, fondo: estilo.backgroundColor }; });
    const medidasNuevas = await page.evaluate(medir), medidasOriginales = await referencia.evaluate(medir);
    compararPresentacion(medidasNuevas, medidasOriginales);
    const destino = informacion.snapshotPath("original.png"); mkdirSync(path.dirname(destino), { recursive: true });
    await referencia.bringToFront(); await referencia.screenshot({ path: destino, fullPage: true, animations: "disabled" }); await page.bringToFront();
    await expect(page).toHaveScreenshot("original.png", { fullPage: true, animations: "disabled", scale: "device", ...OPCIONES_IMAGEN });
    await page.screenshot({ path: informacion.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
  } finally {
    await referencia?.close();
    if (creado) { const respuesta = await llamarPersonal(request, cuenta, "deleteScheduleBlock", { blockId: creado, requestId: crypto.randomUUID() }); expect(respuesta.ok()).toBe(true); }
  }
});
