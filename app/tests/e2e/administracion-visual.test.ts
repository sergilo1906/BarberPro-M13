import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { transpileModule, ScriptTarget, ModuleKind } from "typescript";
import { iniciarPersonal } from "./datos-profesional";
import { semanaProfesional } from "./datos-profesional";
import { compararPresentacion, OPCIONES_IMAGEN } from "./comparar-presentacion";
const original = fileURLToPath(new URL("../../../../treball-barberia/app/", import.meta.url));
async function datosVisuales(request: APIRequestContext, uid: string) {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "reservas-admin@example.test", password: "Prueba123!", returnSecureToken: true } });
  expect(acceso.ok()).toBe(true); const identidad = await acceso.json();
  const raiz = "http://127.0.0.1:8088/v1/projects/demo-barberpro-m13/databases/(default)/documents", headers = { Authorization: "Bearer " + identidad.idToken };
  function valor(dato: any): any { if (dato.mapValue) return campos(dato.mapValue.fields || {}); if (dato.arrayValue) return (dato.arrayValue.values || []).map(valor); return dato.stringValue ?? dato.timestampValue ?? (dato.integerValue !== undefined ? Number(dato.integerValue) : dato.doubleValue ?? dato.booleanValue ?? null); }
  function campos(datos: Record<string, any>): Record<string, any> { const resultado: Record<string, any> = {}; for (const [clave, dato] of Object.entries(datos)) resultado[clave] = valor(dato); return resultado; }
  async function coleccion(nombre: string, ordenar = "__name__") {
    const respuesta = await request.post(raiz + ":runQuery", { headers, data: { structuredQuery: { from: [{ collectionId: nombre }], orderBy: [{ field: { fieldPath: ordenar }, direction: "ASCENDING" }] } } }); expect(respuesta.ok()).toBe(true);
    return (await respuesta.json()).filter((fila: any) => fila.document).map((fila: any) => ({ ...campos(fila.document.fields || {}), id: fila.document.name.split("/").pop() }));
  }
  const barbers = await coleccion("barbers"), users = await coleccion("users"), services = await coleccion("services", "name");
  const documentos: Record<string, object> = {};
  for (const usuario of users) documentos["users/" + usuario.id] = usuario;
  for (const profesional of barbers) {
    documentos["barbers/" + profesional.id] = profesional;
    const respuesta = await request.get(raiz + "/barbers/" + profesional.id + "/weeklySchedules/" + semanaProfesional(0), { headers });
    if (respuesta.ok()) documentos["barbers/" + profesional.id + "/weeklySchedules/" + semanaProfesional(0)] = campos((await respuesta.json()).fields || {});
    else expect(respuesta.status()).toBe(404);
  }
  const configuracion = await request.get(raiz + "/config/app", { headers }); expect(configuracion.ok()).toBe(true); documentos["config/app"] = campos((await configuracion.json()).fields || {});
  return { barbers, users, services, documentos, uid, semana: semanaProfesional(0) };
}
function presentarOriginal(pagina: string, datos: object, conUsuario: boolean): string {
  let codigo = readFileSync(path.join(original, "src/scripts/" + pagina + ".client.ts"), "utf8").replace(/^\uFEFF/, "").replace(/^import[\s\S]*?;\r?\n/gm, "").split("void (async () => {")[0];
  const semana = ["horarios", "admin-users"].includes(pagina) ? readFileSync(path.join(original, "src/lib/week.ts"), "utf8").replace(/export /g, "") : "";
  const adaptadores = `
    const datosReferencia = ${JSON.stringify(datos)};
    const db = {}, fns = {};
    const doc = (_db,...partes) => partes.join('/');
    const collection = (_db,nombre) => nombre;
    const query = (coleccion,...resto) => coleccion;
    const orderBy = () => null, where = () => null;
    const instantanea = (id,dato) => ({id,exists:()=>!!dato,data:()=>dato});
    const getDoc = async ruta => instantanea(ruta.split('/').pop(), datosReferencia.documentos[ruta]);
    const getDocs = async nombre => { const docs = datosReferencia[nombre].map(dato => instantanea(dato.id,dato)); return {docs,empty:!docs.length,forEach:recibir=>docs.forEach(recibir)}; };
    const denegarEscritura = () => { throw new Error('Escritor original no autorizado en comparacion'); };
    const setDoc = denegarEscritura, updateDoc = denegarEscritura, addDoc = denegarEscritura, serverTimestamp = denegarEscritura;
    const httpsCallable = () => denegarEscritura, toast = denegarEscritura;
  `;
  if (pagina === "admin-users") codigo += '\nweekStartToday = () => datosReferencia.semana; setMsg("");' + (conUsuario ? 'list.innerHTML = await renderUserCard(instantanea(datosReferencia.uid,datosReferencia.documentos["users/"+datosReferencia.uid])); bindApplyButtons();' : "");
  else if (pagina === "horarios") codigo += "\ncurrentWeekStart = () => datosReferencia.semana; await loadHoursSummary();";
  else if (pagina === "equipo") codigo += "\nawait loadTeam();";
  else if (pagina === "services") codigo += "\nawait loadServices();";
  else if (pagina === "branding") codigo += "\nawait loadConfig();";
  return "(async () => {" + transpileModule(adaptadores + semana + codigo, { compilerOptions: { target: ScriptTarget.ES2022, module: ModuleKind.None } }).outputText + "})()";
}
const estados = ["admin", "usuarios-vacio", "usuarios-resultado", "equipo", "servicios", "branding", "horarios", "entrada-worker", "entrada-manager"];
for (const estado of estados) test("administracion original " + estado, async ({ page, context, request }, informacion) => {
  test.skip(!existsSync(path.join(original, "dist/admin/index.html")), "No hay dist original local.");
  await context.route("**/*", async (ruta) => { const host = new URL(ruta.request().url()).hostname; if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue(); else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); } });
  const cuenta = estado === "entrada-worker" ? "profesional-" + informacion.project.name : estado === "entrada-manager" ? "reservas-manager" : "reservas-admin";
  const ruta = estado.startsWith("entrada") ? "/index-admin" : estado.startsWith("usuarios") ? "/admin/usuarios" : "/" + estado;
  await iniciarPersonal(page, cuenta); await page.goto(ruta);
  await expect(page.locator("html")).not.toHaveAttribute("data-auth-pending", "");
  await expect(page.locator("#link-setup")).toBeVisible();
  if (estado.startsWith("usuarios")) await expect(page.locator("#search-form")).toBeVisible();
  if (estado === "usuarios-resultado") { await page.locator("#email").fill("admin-destino-" + informacion.project.name + "@example.test"); await page.getByRole("button", { name: "Buscar usuario", exact: true }).click(); await expect(page.locator("#results article")).toHaveCount(1); }
  if (estado === "equipo") await expect(page.locator("#team-list article").first()).toBeVisible();
  if (estado === "servicios") await expect(page.locator("#services-msg")).toHaveText("Servicios cargados.");
  if (estado === "branding") await expect(page.locator("#cfg-msg")).toHaveText("Configuracion cargada.");
  if (estado === "horarios") await expect(page.locator("#hours-msg")).toContainText("Resumen cargado");
  const navegacion = await page.locator("nav [id]").evaluateAll((elementos) => elementos.map((elemento) => ({ id: elemento.id, visible: !elemento.classList.contains("hidden"), texto: elemento.id === "user-avatar" ? elemento.textContent : null })));
  const referencia = await context.newPage();
  try {
    await referencia.goto("http://127.0.0.1:4332" + ruta);
    await referencia.evaluate((navegacion) => { document.documentElement.removeAttribute("data-auth-pending"); for (const item of navegacion) { const elemento = document.getElementById(item.id); if (elemento) { elemento.classList.toggle("hidden", !item.visible); if (item.texto !== null) elemento.textContent = item.texto; } } }, navegacion);
    if (estado.startsWith("entrada")) await referencia.evaluate((gestion) => { for (const elemento of document.querySelectorAll("[data-manager-only]")) { elemento.classList.toggle("hidden", !gestion); elemento.classList.toggle("flex", gestion); } }, estado === "entrada-manager");
    else if (estado !== "admin") {
      const pagina = estado.startsWith("usuarios") ? "admin-users" : estado === "servicios" ? "services" : estado;
      const datos = await datosVisuales(request, "admin-destino-" + informacion.project.name);
      await referencia.evaluate(presentarOriginal(pagina, datos, estado === "usuarios-resultado"));
      if (estado === "usuarios-resultado") await referencia.locator("#email").fill("admin-destino-" + informacion.project.name + "@example.test");
    }
    for (const superficie of [referencia, page]) {
      await superficie.evaluate(async () => { await document.fonts.ready; for (const peso of [400, 500, 600, 700]) await document.fonts.load(peso + " 14px Manrope"); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); window.scrollTo({ top: 0, behavior: "instant" }); });
      await superficie.mouse.move(0, 0); await superficie.bringToFront(); await superficie.evaluate(() => new Promise<void>((resolver) => requestAnimationFrame(() => requestAnimationFrame(() => resolver()))));
    }
    expect((await page.locator("main").innerText()).replace(/\s+/g, " ")).toBe((await referencia.locator("main").innerText()).replace(/\s+/g, " "));
    const medir = () => Array.from(document.querySelectorAll("main section, main h1, main h2, main h3, main p, main article, main input, main select, main label, main button, main a")).map((elemento) => { const caja = elemento.getBoundingClientRect(), estilo = getComputedStyle(elemento); return { etiqueta: elemento.tagName, x: caja.x, y: caja.y, ancho: caja.width, alto: caja.height, fuente: estilo.fontFamily, tamano: estilo.fontSize, peso: estilo.fontWeight, color: estilo.color, fondo: estilo.backgroundColor }; });
    // Se midieron 5/64 CSS px de redondeo en el reparto flex del resumen.
    // Solo esta suite admite 1/8; estilos y umbral de capturas no cambian.
    compararPresentacion(await page.evaluate(medir), await referencia.evaluate(medir), 1 / 8);
    const destino = informacion.snapshotPath("original.png"); mkdirSync(path.dirname(destino), { recursive: true }); await referencia.bringToFront(); await referencia.screenshot({ path: destino, fullPage: true, animations: "disabled" }); await page.bringToFront();
    await expect(page).toHaveScreenshot("original.png", { fullPage: true, animations: "disabled", scale: "device", ...OPCIONES_IMAGEN });
    await page.screenshot({ path: informacion.snapshotPath("reconstruida.png"), fullPage: true, animations: "disabled" });
  } finally { await referencia.close(); }
});
