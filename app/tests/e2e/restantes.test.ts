import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { iniciarPersonal } from "./datos-profesional";
import { cambiarCuentaPersistida } from "./datos-cliente";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
    else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
});

test("resumen diario del profesional cuenta tres citas activas y noventa minutos", async ({ page }, informacion) => {
  await iniciarPersonal(page, "profesional-" + informacion.project.name);
  await page.goto("/panel");
  await expect(page.locator("#stat-total-bookings")).toHaveText("3");
  await expect(page.locator("#stat-total-min")).toHaveText("90 min");
  await expect(page.locator("#stat-total-hours")).toHaveText("1.5 h");
  await expect(page.locator("#stat-services")).toHaveText("Corte: 3");
  await expect(page.locator("#panel-next-list")).not.toContainText("cancelled");
  await expect(page.locator("#panel-next-list")).not.toContainText("rescheduled");
});

test("responsable consulta KPIs y cambia los tres periodos sin conservar tarjetas antiguas", async ({ page }) => {
  await iniciarPersonal(page, "reservas-manager"); await page.goto("/kpis");
  for (const periodo of ["day", "week", "month"]) {
    await page.locator("#kpi-range").selectOption(periodo);
    await expect(page.locator("#kpi-msg")).toContainText("Periodo:");
    await expect(page.locator("#kpi-cards article")).toHaveCount(6);
    await expect(page.locator("#kpi-cards")).toContainText("Canceladas o ausencias");
    const valores = await page.locator("#kpi-cards article p:nth-child(2)").allTextContents();
    expect(valores.every((valor) => !valor.includes("NaN"))).toBe(true);
  }
});

test("CSV descarga todas las citas y vaciar o invertir el rango invalida la cache", async ({ page }) => {
  await iniciarPersonal(page, "reservas-admin"); await page.goto("/export");
  await expect(page.locator("#export-msg")).toContainText("citas encontradas.");
  const cantidad = Number((await page.locator("#export-msg").innerText()).match(/^\d+/)![0]);
  expect(cantidad).toBeGreaterThan(8);
  await expect(page.locator("#export-preview-list tbody tr")).toHaveCount(8);
  const descargaPendiente = page.waitForEvent("download");
  await page.locator("#export-download").click();
  const descarga = await descargaPendiente;
  const bytes = await readFile((await descarga.path())!);
  expect([...bytes.subarray(0, 3)]).toEqual([239, 187, 191]);
  const csv = bytes.toString("utf8").replace(/^\uFEFF/, "");
  expect(csv.split("\r\n")[0]).toBe("fecha,hora,estado,servicio,profesional,cliente,duracionMin,precio");
  expect(csv.split("\r\n")).toHaveLength(cantidad + 1);
  expect(descarga.suggestedFilename()).toMatch(/^agenda-\d{4}-\d{2}-\d{2}-\d{4}-\d{2}-\d{2}\.csv$/);
  await page.locator("#export-from").fill("1999-01-01");
  await page.locator("#export-to").fill("1999-01-02");
  await expect(page.locator("#export-preview-list tbody tr")).toHaveCount(0);
  await page.locator("#export-preview").click();
  await expect(page.locator("#export-msg")).toHaveText("No hay citas en ese rango.");
  let descargasExtra = 0; page.on("download", () => { descargasExtra++; });
  await page.locator("#export-download").click();
  await expect(page.locator("#toast-root")).toContainText("No hay datos para exportar.");
  expect(descargasExtra).toBe(0);
  await page.locator("#export-from").fill("1999-01-03");
  await expect(page.locator("#export-download")).toBeDisabled();
  await page.locator("#export-preview").click();
  await expect(page.locator("#export-msg")).toHaveText("Revisa el rango de fechas.");
});

test("consulta CSV denegada limpia la vista y permite reintentar sin datos cacheados", async ({ page }) => {
  await iniciarPersonal(page, "reservas-manager");
  let manipulada = false;
  await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (ruta) => {
    const cuerpo = ruta.request().postData() || "";
    if (!manipulada && cuerpo.includes("bookings")) { manipulada = true; await ruta.continue({ postData: cuerpo.replaceAll("bookings", "coleccion-interna-no-permitida") }); }
    else await ruta.continue();
  });
  await page.goto("/export");
  await expect(page.locator("#export-msg")).toContainText("No se pudo cargar el listado", { timeout: 15000 });
  expect(manipulada).toBe(true);
  await expect(page.locator("#export-preview-list tbody tr")).toHaveCount(0);
  await page.unroute("**/google.firestore.v1.Firestore/Listen/channel**");
  await page.locator("#export-preview").click();
  await expect(page.locator("#export-msg")).toContainText("citas encontradas.");
});

test("cambiar a cliente durante una consulta CSV pendiente descarta su respuesta", async ({ page, context, request }) => {
  await iniciarPersonal(page, "reservas-admin");
  let avisar: () => void = () => {}, liberar: () => void = () => {};
  const recibida = new Promise<void>((resolver) => { avisar = resolver; });
  const permiso = new Promise<void>((resolver) => { liberar = resolver; });
  let retenida = false;
  await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (ruta) => {
    if (!retenida && (ruta.request().postData() || "").includes("bookings")) { retenida = true; avisar(); await permiso; }
    await ruta.continue();
  });
  const otraPagina = await context.newPage();
  try {
    await page.goto("/export");
    await Promise.race([recibida, new Promise((_, rechazar) => setTimeout(() => rechazar(new Error("No se intercepto la consulta CSV")), 15000))]);
    await otraPagina.goto("/"); await expect(otraPagina.locator("#link-setup")).toBeVisible();
    await cambiarCuentaPersistida(otraPagina, request, "vacio");
    await page.bringToFront();
    await expect(page).toHaveURL(/\/?\?acceso=denegado$/, { timeout: 15000 });
    liberar(); await expect(page.locator("#export-preview-list")).toHaveCount(0);
  } finally { liberar(); await otraPagina.close(); }
});

