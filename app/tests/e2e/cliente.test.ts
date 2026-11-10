import { expect, test } from "@playwright/test";
import { abrirMisCitas, iniciarCliente, fechaReserva, llamarCliente, cambiarCuentaPersistida } from "./datos-cliente";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
    else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
});
test("mis citas conserva historia, orden, estados, detalle en tarjeta, filtros y margen", async ({ page }, informacion) => {
  const sufijo = informacion.project.name;
  await abrirMisCitas(page, sufijo);
  await expect(page.locator("#my-list article")).toHaveCount(8);
  const fechas = await page.locator('[data-cita="resumen"]').allTextContents();
  expect(fechas).toEqual([...fechas].sort());
  const prefijo = 'article[data-id="cliente-' + sufijo + '-';
  await expect(page.locator(prefijo + 'confirmed"]')).toContainText("Confirmada");
  await expect(page.locator(prefijo + 'legada"]')).toContainText("Corte antiguo");
  await expect(page.locator(prefijo + 'legada"]')).toContainText("Duracion: 45 min");
  await expect(page.locator(prefijo + 'cercana"]')).toContainText("12 h de margen");
  for (const estado of ["cancelled", "done", "no_show", "rescheduled", "cercana"]) await expect(page.locator(prefijo + estado + '"] button')).toHaveCount(0);
  await page.locator("#filter-status").selectOption("done");
  await expect(page.locator("#my-list article")).toHaveCount(1);
  await expect(page.locator("#my-list")).toContainText("2020-01-03");
  await page.locator("#filter-date").fill(fechaReserva(29));
  await expect(page.locator("#my-list")).toContainText("No hay citas para los filtros seleccionados.");
  await expect(page.locator("#link-agenda")).toBeHidden();
  await expect(page.locator("#link-admin")).toBeHidden();
});
test("cliente vacio puede navegar a reservar y consultar su perfil", async ({ page }) => {
  await abrirMisCitas(page, "vacio");
  await expect(page.locator("#my-list article")).toHaveCount(0);
  await page.locator('#my-list a[href="/reservar"]').click();
  await expect(page).toHaveURL(/\/reservar\/?$/);
  await page.goto("/index-client");
  await page.getByRole("link", { name: "Ver mis citas" }).click();
  await expect(page.locator("#my-list")).toContainText("No hay citas");
  await page.locator("#btn-profile").click();
  await expect(page.locator("#perfil-email")).toHaveText("cliente-vacio@example.test");
});
test("recorrido real de reserva, consulta, cambio y cancelacion sin duplicados", async ({ page }, informacion) => {
  const dias = informacion.project.name === "escritorio" ? 16 : 17;
  await iniciarCliente(page, informacion.project.name);
  await expect(page.locator("#service-select")).toBeEnabled();
  await page.locator("#service-select").selectOption("svc_haircut");
  await page.locator("#any-barber").uncheck();
  await page.locator("#barber-select").selectOption("demo_worker_1");
  await page.locator("#date-select").fill(fechaReserva(dias));
  await page.locator('.slot-btn[data-time="09:10"]').click();
  await page.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
  await expect(page.locator("#booking-success")).toBeVisible();
  await page.locator("#link-citas").click();
  await page.locator("#filter-date").fill(fechaReserva(dias));
  await expect(page.locator("#my-list article")).toHaveCount(1);
  await expect(page.locator("#my-list article")).toContainText("Profesional: Alex");
  await page.getByRole("button", { name: "Cambiar cita", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.locator('[data-field="date"]')).toHaveValue(fechaReserva(dias + 1));
  await page.locator('.slot-choice[data-time="09:10"]').click();
  let enviosCambio = 0;
  page.on("request", (peticion) => { if (peticion.url().endsWith("/rescheduleBooking")) enviosCambio++; });
  await page.getByRole("button", { name: "Guardar cambio", exact: true }).evaluate((boton) => { boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#my-list article")).toContainText("Cambiada");
  expect(enviosCambio).toBe(1);
  await page.locator("#filter-date").fill(fechaReserva(dias + 1));
  await expect(page.locator("#my-list article")).toHaveCount(1);
  await expect(page.locator("#my-list article")).toContainText("Pendiente");
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#my-list article")).toContainText("Pendiente");
  await page.getByRole("button", { name: "Cancelar", exact: true }).evaluate((boton) => { boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page.getByRole("button", { name: "Cancelar cita", exact: true }).click();
  await expect(page.locator("#my-msg")).toHaveText("Cita cancelada.");
  await expect(page.locator("#my-list article")).toContainText("Cancelada");
  await page.reload();
  await page.locator("#filter-date").fill(fechaReserva(dias + 1));
  await expect(page.locator("#my-list article")).toContainText("Cancelada");
});
test("el cambio ocupado conserva la cita anterior y no confirma exito", async ({ page, request }, informacion) => {
  const sufijo = informacion.project.name;
  await abrirMisCitas(page, sufijo);
  await page.locator('article[data-id="cliente-' + sufijo + '-confirmed"] .reschedule-btn').click();
  const fecha = fechaReserva(sufijo === "escritorio" ? 26 : 27);
  await page.locator('[data-field="date"]').fill(fecha);
  await page.locator('.slot-choice[data-time="09:10"]').click();
  const ocupada = await llamarCliente(request, "alterno", "createBooking", { dateStr: fecha, timeStr: "09:10", serviceId: "svc_haircut", barberPreference: "demo_worker_1", anyBarber: false });
  expect(ocupada.ok()).toBe(true);
  await page.getByRole("button", { name: "Guardar cambio", exact: true }).click();
  await expect(page.locator('[data-field="slot-msg"]')).toHaveText("Ese hueco ya no esta libre.");
  await page.getByRole("button", { name: "Cerrar", exact: true }).click();
  await expect(page.locator('article[data-id="cliente-' + sufijo + '-confirmed"]')).toContainText("Confirmada");
  await expect(page.locator("#toast-root").filter({ hasText: "Cita cambiada correctamente." })).toHaveCount(0);
});
test("respuesta perdida del cambio se comprueba despues de recargar sin otra sucesora", async ({ page }, informacion) => {
  await abrirMisCitas(page, informacion.project.name);
  await page.locator('article[data-id="cliente-' + informacion.project.name + '-pending"] .reschedule-btn').click();
  await page.locator('[data-field="date"]').fill(fechaReserva(informacion.project.name === "escritorio" ? 21 : 22));
  await page.locator('.slot-choice[data-time="09:10"]').click();
  const identificadores: string[] = [];
  page.on("request", (peticion) => { if (peticion.url().endsWith("/rescheduleBooking")) identificadores.push(peticion.postDataJSON().data.requestId); });
  await page.route("**/europe-west1/rescheduleBooking", async (ruta) => { const respuesta = await ruta.fetch(); expect(respuesta.ok()).toBe(true); await ruta.abort("failed"); });
  await page.getByRole("button", { name: "Guardar cambio", exact: true }).click();
  await expect(page.getByRole("button", { name: "Comprobar cambio", exact: true })).toBeEnabled();
  await expect(page.locator('[data-field="date"]')).toBeDisabled();
  await page.unroute("**/europe-west1/rescheduleBooking");
  await page.reload();
  await page.getByRole("button", { name: "Comprobar cambio", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Comprobar cambio", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("#toast-root")).toContainText("Cita cambiada correctamente.");
  expect(identificadores.length).toBe(2);
  expect(identificadores[0]).toBe(identificadores[1]);
  expect(await page.evaluate(() => sessionStorage.getItem("barberpro-cambio-pendiente"))).toBeNull();
});
test("una consulta manipulada denegada muestra error y permite recargar", async ({ page }, informacion) => {
  await iniciarCliente(page, informacion.project.name);
  let manipulada = false;
  await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (ruta) => {
    const cuerpo = ruta.request().postData() || "";
    if (!manipulada && cuerpo.includes("bookings")) { manipulada = true; await ruta.continue({ postData: cuerpo.replaceAll("cliente-" + informacion.project.name, "cliente-ajeno") }); }
    else await ruta.continue();
  });
  await page.locator("#link-citas").click();
  await expect(page.locator("#my-msg")).toContainText("No se pudieron cargar tus citas", { timeout: 15000 });
  expect(manipulada).toBe(true);
  await expect(page.locator("#my-list article")).toHaveCount(0);
  await page.unroute("**/google.firestore.v1.Firestore/Listen/channel**");
  await page.getByRole("button", { name: "Actualizar listado", exact: true }).click();
  await expect(page.locator("#my-list article").first()).toBeVisible();
});
test("cambiar de cuenta durante la consulta descarta los datos anteriores", async ({ page, context, request }, informacion) => {
  await iniciarCliente(page, informacion.project.name);
  let avisar: () => void = () => {};
  let liberar: () => void = () => {};
  const recibida = new Promise<void>((resolver) => { avisar = resolver; });
  const permiso = new Promise<void>((resolver) => { liberar = resolver; });
  let retenida = false;
  await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (ruta) => {
    if (!retenida && (ruta.request().postData() || "").includes("bookings")) { retenida = true; avisar(); await permiso; }
    await ruta.continue();
  });
  const otraPagina = await context.newPage();
  try {
    await page.locator("#link-citas").click(); await recibida;
    await otraPagina.goto("/");
    await cambiarCuentaPersistida(otraPagina, request, "vacio");
    await expect(page.locator("#my-list")).toContainText("No hay citas", { timeout: 15000 });
    liberar();
    await expect(page.locator("#my-list article")).toHaveCount(0);
    await expect(page.locator("#btn-profile")).toBeVisible();
    await otraPagina.goto("/perfil");
    await expect(otraPagina.locator("#perfil-email")).toHaveText("cliente-vacio@example.test");
    await page.locator("#btn-logout").click();
    await expect(otraPagina).toHaveURL(/\/login\/?$/);
  } finally { liberar(); await otraPagina.close(); }
});
test("perfil muestra la denegacion de escritura y conserva los datos del servidor", async ({ page }, informacion) => {
  await iniciarCliente(page, informacion.project.name);
  await page.goto("/perfil");
  await expect(page.locator("#perfil-name")).toHaveValue("Cliente " + informacion.project.name);
  let manipulada = false;
  await page.route("**/google.firestore.v1.Firestore/Write/channel**", async (ruta) => {
    const cuerpo = ruta.request().postData() || "";
    if (cuerpo.includes("cliente-" + informacion.project.name)) { manipulada = true; await ruta.continue({ postData: cuerpo.replaceAll("cliente-" + informacion.project.name, "cliente-ajeno") }); }
    else await ruta.continue();
  });
  await page.locator("#perfil-name").fill("Cambio rechazado");
  await page.locator("#perfil-save").click();
  await expect(page.locator("#perfil-msg")).toHaveText("No se pudo completar la operacion. Vuelve a intentarlo.", { timeout: 15000 });
  expect(manipulada).toBe(true);
  await expect(page.locator("#perfil-save")).toBeEnabled();
  await page.unroute("**/google.firestore.v1.Firestore/Write/channel**");
  await page.reload();
  await expect(page.locator("#perfil-name")).toHaveValue("Cliente " + informacion.project.name);
});
test("perfil valida, persiste y limpia una escritura pendiente al cambiar de cuenta", async ({ page, context, request }, informacion) => {
  await iniciarCliente(page, informacion.project.name);
  await page.goto("/perfil");
  await expect(page.locator("#perfil-email")).toHaveText("cliente-" + informacion.project.name + "@example.test");
  await page.locator("#perfil-name").fill("  ");
  await page.locator("#perfil-save").click();
  await expect(page.locator("#perfil-msg")).toHaveText("Completa el nombre.");
  await page.locator("#perfil-name").fill("Cliente " + informacion.project.name);
  await page.locator("#perfil-phone").fill("+34 600 123 123");
  await page.locator("#perfil-save").click();
  await expect(page.locator("#perfil-msg")).toHaveText("Cambios guardados.");
  await page.reload();
  await expect(page.locator("#perfil-phone")).toHaveValue("+34 600 123 123");
  await expect(page.locator("#perfil-role")).toHaveText("Cliente");
  await page.route("**/google.firestore.v1.Firestore/Write/channel**", (ruta) => ruta.abort("failed"));
  await page.locator("#perfil-name").fill("Cambio sin confirmar");
  await page.locator("#perfil-save").click();
  await expect(page.locator("#perfil-msg")).not.toHaveText("Cambios guardados.");
  await expect(page.locator("#perfil-save")).toBeDisabled();
  const otraPagina = await context.newPage();
  await otraPagina.goto("/");
  await cambiarCuentaPersistida(otraPagina, request, "vacio");
  await expect(page.locator("#perfil-email")).toHaveText("cliente-vacio@example.test");
  await expect(page.locator("#perfil-name")).toHaveValue("Cliente vacio");
  await expect(page.locator("#perfil-save")).toBeEnabled();
  await expect(page.locator("#perfil-msg")).not.toHaveText("Cambios guardados.");
  await page.locator("#perfil-logout").click();
  await expect(page).toHaveURL(/\/$/);
  await page.unroute("**/google.firestore.v1.Firestore/Write/channel**");
  await otraPagina.close();
});
