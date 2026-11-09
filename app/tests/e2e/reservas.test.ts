import { expect, test } from "@playwright/test";
import { fechaReserva, abrirReserva, ocuparHorario } from "./datos-reserva";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
    else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
});

test("seleccion, calendario nativo, confirmacion unica, reserva real e ICS", async ({ page }, informacion) => {
  const fecha = fechaReserva(informacion.project.name === "escritorio" ? 7 : 8);
  await abrirReserva(page, fecha);
  await expect(page.locator("#service-select option")).toHaveText(["Barba - 20 min - 10.00 EUR", "Corte - 30 min - 15.00 EUR", "Corte + Barba - 50 min - 22.00 EUR"]);
  await expect(page.locator('#barber-select option[value="demo_oculto"]')).toHaveCount(0);
  await expect(page.locator("#date-select")).toHaveAttribute("type", "date");
  await expect(page.locator("#date-select")).toHaveAttribute("min", fechaReserva(0));
  await expect(page.locator("#date-select")).toHaveAttribute("max", fechaReserva(30));
  await page.locator("#phone-input").fill("600123123");
  let envios = 0;
  page.on("request", (solicitud) => { if (solicitud.url().endsWith("/createBooking")) envios++; });
  await page.locator('.slot-btn[data-time="09:10"]').evaluate((boton) => {
    boton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    boton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
  await expect(page.locator("#booking-success")).toBeVisible();
  await expect(page.locator("#booking-summary")).toHaveText("Corte - " + fecha + " 09:10 - Alex");
  expect(envios).toBe(1);
  const descargaPendiente = page.waitForEvent("download");
  await page.locator("#booking-ics").click();
  expect((await descargaPendiente).suggestedFilename()).toBe("cita.ics");
  await expect(page.locator('.slot-btn[data-time="09:10"]')).toHaveCount(0);
});

test("un horario ocupado despues de consultar no muestra exito y actualiza la lista", async ({ page, request }, informacion) => {
  const fecha = fechaReserva(informacion.project.name === "escritorio" ? 9 : 10);
  await abrirReserva(page, fecha);
  await ocuparHorario(request, fecha);
  await page.locator('.slot-btn[data-time="09:10"]').click();
  await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
  await expect(page.locator("#slots-msg")).toContainText("Ese horario ya no esta disponible");
  await expect(page.locator("#booking-success")).toBeHidden();
  await expect(page.locator('.slot-btn[data-time="09:10"]')).toHaveCount(0);
});

test("respuesta perdida despues del commit se recupera tras recargar con el mismo requestId", async ({ page }, informacion) => {
  const fecha = fechaReserva(informacion.project.name === "escritorio" ? 11 : 12);
  await abrirReserva(page, fecha);
  const identificadores: string[] = [];
  page.on("request", (solicitud) => { if (solicitud.url().endsWith("/createBooking")) identificadores.push(solicitud.postDataJSON().data.requestId); });
  await page.route("**/europe-west1/createBooking", async (ruta) => {
    const respuesta = await ruta.fetch();
    expect(respuesta.ok()).toBe(true);
    await ruta.abort("failed");
  });
  await page.locator('.slot-btn[data-time="09:10"]').click();
  await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
  await expect(page.getByRole("button", { name: "Comprobar reserva" })).toBeVisible();
  await expect(page.locator("#booking-success")).toBeHidden();
  await page.unroute("**/europe-west1/createBooking");
  await page.reload();
  await page.getByRole("button", { name: "Comprobar reserva" }).click();
  await expect(page.locator("#booking-success")).toBeVisible();
  expect(identificadores.length).toBe(2);
  expect(identificadores[0]).toBe(identificadores[1]);
  expect(await page.evaluate(() => sessionStorage.getItem("barberpro-reserva-pendiente"))).toBeNull();
});

test("profesional sin semana y servicio distinto invalidan los huecos anteriores", async ({ page }) => {
  await abrirReserva(page, fechaReserva(14));
  await page.locator("#barber-select").selectOption("demo_sin_semana");
  await expect(page.locator("#slots-list")).toContainText("Sin disponibilidad para esta seleccion.");
  await page.locator("#barber-select").selectOption("demo_worker_1");
  await page.locator("#service-select").selectOption("svc_combo");
  await expect(page.locator("#slots-msg")).toHaveText("Selecciona una hora para confirmar tu reserva.");
  await expect(page.locator('.slot-btn[data-time="13:25"]')).toHaveCount(0);
  await expect(page.locator('.slot-btn[data-time="09:10"]')).toBeVisible();
});

test("una respuesta antigua de disponibilidad no sustituye la seleccion actual", async ({ page }) => {
  await abrirReserva(page, fechaReserva(14));
  let avisarPeticion: () => void = () => {};
  let liberarPeticion: () => void = () => {};
  let avisarEntrega: () => void = () => {};
  const recibida = new Promise<void>((resolver) => { avisarPeticion = resolver; });
  const permisoEntrega = new Promise<void>((resolver) => { liberarPeticion = resolver; });
  const entregada = new Promise<void>((resolver) => { avisarEntrega = resolver; });
  await page.route("**/europe-west1/getAvailability", async (ruta) => {
    if (ruta.request().postDataJSON().data.serviceId !== "svc_combo") { await ruta.continue(); return; }
    const respuesta = await ruta.fetch();
    avisarPeticion();
    await permisoEntrega;
    await ruta.fulfill({ response: respuesta });
    avisarEntrega();
  });
  try {
    await page.locator("#service-select").selectOption("svc_combo");
    await recibida;
    await page.locator("#service-select").selectOption("svc_haircut");
    await expect(page.locator('.slot-btn[data-time="13:25"]')).toBeVisible();
    liberarPeticion();
    await entregada;
    await expect(page.locator('.slot-btn[data-time="13:25"]')).toBeVisible();
  } finally { liberarPeticion(); }
});

test("fallo de conexion al consultar disponibilidad permite volver a intentarlo", async ({ page }) => {
  await abrirReserva(page, fechaReserva(14));
  await page.route("**/europe-west1/getAvailability", (ruta) => ruta.abort("failed"));
  await page.locator("#service-select").selectOption("svc_combo");
  await expect(page.locator("#slots-msg")).toContainText("No se pudo cargar disponibilidad. Comprueba la conexion");
  await expect(page.locator(".slot-btn")).toHaveCount(0);
  await page.unroute("**/europe-west1/getAvailability");
  await page.locator("#service-select").selectOption("svc_haircut");
  await expect(page.locator('.slot-btn[data-time="09:10"]')).toBeVisible();
});
