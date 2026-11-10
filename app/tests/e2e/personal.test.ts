import { expect, test } from "@playwright/test";
import { iniciarPersonal, abrirHorario, fechaReserva, semanaProfesional, diaProfesional } from "./datos-profesional";
import { cambiarCuentaPersistida, iniciarCliente, llamarCliente } from "./datos-cliente";

test.beforeEach(async ({ context }) => {
  await context.route("**/*", async (ruta) => {
    const host = new URL(ruta.request().url()).hostname;
    if (["127.0.0.1", "localhost", "fonts.googleapis.com", "fonts.gstatic.com"].includes(host)) await ruta.continue();
    else { await ruta.abort(); throw new Error("Conexion externa no permitida: " + host); }
  });
});
test("panel y agenda muestran solo citas asignadas, estados, orden y vacio", async ({ page }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await iniciarPersonal(page, uid);
  await expect(page.locator("#stats-cards > div").nth(0)).toHaveText("Citas3");
  await expect(page.locator("#stats-cards > div").nth(1)).toHaveText("Minutos90 min");
  await expect(page.locator("#pro-next-list article")).toHaveCount(2);
  await expect(page.locator("#pro-next-list")).toContainText("Cliente ficticio " + uid);
  await page.locator("#stats-range").selectOption("week");
  await expect(page.locator("#stats-msg")).toHaveText("");
  await page.locator("#link-agenda").click();
  await expect(page.locator("#agenda-list article")).toHaveCount(5);
  const horas = await page.locator('[data-cita="servicio"]').allTextContents(); expect(horas).toEqual([...horas].sort());
  await expect(page.locator("#agenda-list")).not.toContainText("Cliente ficticio profesional-" + (informacion.project.name === "movil" ? "escritorio" : "movil"));
  await page.locator("#agenda-status").selectOption("confirmed");
  await expect(page.locator("#agenda-list article")).toHaveCount(1);
  await page.locator("#agenda-date").fill(fechaReserva(5));
  await expect(page.locator("#agenda-list")).toContainText("No hay citas para los filtros seleccionados.");
});
test("profesional cambia estados con confirmacion y evita dobles envios", async ({ page }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await iniciarPersonal(page, uid); await page.goto("/agenda");
  const tarjeta = page.locator('article[data-id="' + uid + '-pending"]');
  let envios = 0; page.on("request", (peticion) => { if (peticion.url().endsWith("/updateBookingStatus")) envios++; });
  await tarjeta.getByRole("button", { name: "Confirmar", exact: true }).evaluate((boton) => { boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); boton.dispatchEvent(new MouseEvent("click", { bubbles: true })); });
  await expect(tarjeta).toContainText("Confirmada"); expect(envios).toBe(1);
  await tarjeta.getByRole("button", { name: "Marcar hecha", exact: true }).click();
  await page.keyboard.press("Escape"); await expect(page.getByRole("dialog")).toHaveCount(0); await expect(tarjeta).toContainText("Confirmada");
  await tarjeta.getByRole("button", { name: "Marcar hecha", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText('La cita pasara a "Hecha".');
  await page.getByRole("button", { name: "Guardar cambio", exact: true }).click();
  await expect(tarjeta).toContainText("Hecha"); await expect(tarjeta.locator("button")).toHaveCount(0);
  await page.reload(); await expect(tarjeta).toContainText("Hecha");
});
test("horario valida solapes y conserva copia sin guardar, publicacion y descansos", async ({ page, request }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await abrirHorario(page, uid, 14);
  await expect(page.locator("#setup-barber-wrap")).toBeHidden();
  await expect(page.locator("#slot-minutes")).toHaveValue("30");
  await page.locator("#start2-1").fill("13:00");
  await page.locator("#save-config").click();
  await expect(page.locator("#config-error")).toContainText("Tramos solapados");
  await page.locator("#start2-1").fill("16:00");
  await page.locator("#work-0").uncheck();
  await page.locator("#week-published").uncheck();
  await page.locator("#slot-minutes").fill("20");
  await page.locator("#save-config").click();
  await expect(page.locator("#config-ok")).toBeVisible();
  await expect(page.locator("#config-ok")).toHaveText("Semana guardada.");
  await page.reload();
  await page.locator("#week-date").fill(semanaProfesional(14));
  await expect(page.locator("#save-config")).toBeEnabled();
  await expect(page.locator("#slot-minutes")).toHaveValue("20"); await expect(page.locator("#work-0")).not.toBeChecked();
  await page.locator("#week-date").fill(semanaProfesional(21));
  await expect(page.locator("#slot-minutes")).toHaveValue("30");
  await page.locator("#copy-week").click();
  await expect(page.locator("#config-ok")).toHaveText("Semana copiada. Guarda cuando la revises.");
  await expect(page.locator("#slot-minutes")).toHaveValue("20");
  const disponibilidad = await llamarCliente(request, "profesional", "getAvailability", { dateStr: diaProfesional(21), serviceId: "svc_haircut", anyBarber: false, barberPreference: uid });
  expect((await disponibilidad.json()).result.slots.length).toBeGreaterThan(0);
  // Copiar no ha persistido: una recarga recupera la cuadrícula original del destino.
  await page.reload(); await page.locator("#week-date").fill(semanaProfesional(21));
  await expect(page.locator("#slot-minutes")).toHaveValue("30");
});
test("una semana cuya lectura falla no puede guardarse reutilizando el formulario anterior", async ({ page }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await abrirHorario(page, uid, 7);
  let manipulada = false, escrituras = 0;
  page.on("request", (peticion) => { if (peticion.url().endsWith("/saveWeeklySchedule")) escrituras++; });
  await page.route("**/google.firestore.v1.Firestore/Listen/channel**", async (ruta) => {
    const cuerpo = ruta.request().postData() || "";
    if (cuerpo.includes("weeklySchedules") && cuerpo.includes(semanaProfesional(35))) { manipulada = true; await ruta.continue({ postData: cuerpo.replaceAll(uid, "profesional-ajeno-inexistente") }); }
    else await ruta.continue();
  });
  await page.locator("#week-date").fill(semanaProfesional(35));
  await expect(page.locator("#config-error")).toContainText("No se pudo cargar la semana", { timeout: 15000 });
  expect(manipulada).toBe(true);
  await expect(page.locator("#save-config")).toBeDisabled();
  await page.locator("#save-config").evaluate((boton) => boton.dispatchEvent(new MouseEvent("click", { bubbles: true })));
  expect(escrituras).toBe(0);
  await page.unroute("**/google.firestore.v1.Firestore/Listen/channel**");
  await page.locator("#week-date").fill(semanaProfesional(7));
  await expect(page.locator("#save-config")).toBeEnabled();
  await expect(page.locator("#slot-minutes")).toHaveValue("30");
});
test("horario, reserva cliente, agenda, bloqueo y cancelacion mantienen disponibilidad coherente", async ({ page, browser, request }, informacion) => {
  test.setTimeout(60000);
  const uid = "profesional-" + informacion.project.name, fecha = diaProfesional(7);
  await abrirHorario(page, uid, 7);
  for (let indice = 0; indice < 7; indice++) { await page.locator("#start-" + indice).fill("10:00"); await page.locator("#end-" + indice).fill("14:00"); }
  await page.locator("#week-published").check(); await page.locator("#save-config").click();
  await expect(page.locator("#config-ok")).toHaveText("Semana guardada y ya visible en reservas.");
  const contextoCliente = await browser.newContext(); const cliente = await contextoCliente.newPage();
  try {
    await iniciarCliente(cliente, "profesional");
    await expect(cliente.locator("#service-select")).toBeEnabled(); await cliente.locator("#service-select").selectOption("svc_haircut");
    await cliente.locator("#any-barber").uncheck(); await cliente.locator("#barber-select").selectOption(uid); await cliente.locator("#date-select").fill(fecha);
    await cliente.locator('.slot-btn[data-time="10:00"]').click(); await cliente.getByRole("button", { name: "Confirmar reserva", exact: true }).click();
    await expect(cliente.locator("#booking-success")).toBeVisible();
    await page.goto("/agenda"); await page.locator("#agenda-date").fill(fecha);
    await expect(page.locator("#agenda-list article")).toHaveCount(1);
    await page.goto("/bloqueos"); await expect(page.locator("#block-barber")).toHaveValue(uid);
    await page.locator("#block-type").selectOption("break"); await page.locator("#block-date").fill(fecha); await page.locator("#block-start").fill("16:00"); await page.locator("#block-end").fill("17:00");
    await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click(); await expect(page.locator("#blocks-msg")).toHaveText("Bloqueo guardado.");
    const disponibilidad = await llamarCliente(request, "profesional", "getAvailability", { dateStr: fecha, serviceId: "svc_haircut", anyBarber: false, barberPreference: uid });
    expect((await disponibilidad.json()).result.slots.some((hueco: { timeStr: string }) => hueco.timeStr === "16:00")).toBe(false);
    await page.goto("/setup-barber"); await page.locator("#week-date").fill(semanaProfesional(7)); await expect(page.locator("#save-config")).toBeEnabled();
    for (let indice = 0; indice < 7; indice++) await page.locator("#end2-" + indice).fill("19:00");
    await page.locator("#save-config").click(); await expect(page.locator("#config-ok")).toBeVisible(); await expect(page.locator("#config-ok")).toContainText("Semana guardada");
    await page.goto("/agenda"); await page.locator("#agenda-date").fill(fecha); await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Guardar cambio", exact: true }).click(); await expect(page.locator("#agenda-list article")).toContainText("Cancelada");
    const libre = await llamarCliente(request, "profesional", "getAvailability", { dateStr: fecha, serviceId: "svc_haircut", anyBarber: false, barberPreference: uid });
    expect((await libre.json()).result.slots.some((hueco: { timeStr: string }) => hueco.timeStr === "10:00")).toBe(true);
  } finally { await contextoCliente.close(); }
});
test("bloqueos validan formularios, vacaciones y eliminacion confirmada", async ({ page }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await iniciarPersonal(page, uid); await page.goto("/bloqueos"); await expect(page.locator("#block-barber")).toHaveValue(uid); await expect(page.locator("#block-barber")).toBeDisabled();
  await page.locator("#block-date").fill(fechaReserva(28)); await page.locator("#block-start").fill("18:00"); await page.locator("#block-end").fill("17:00");
  await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click(); await expect(page.locator("#blocks-msg")).toContainText("fin debe ser mayor");
  await page.locator("#block-start").fill("17:00"); await page.locator("#block-end").fill("18:00"); await page.locator("#block-reason").fill("Formacion ficticia");
  await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click(); await expect(page.locator("#blocks-list")).toContainText("Formacion ficticia");
  const fila = page.locator("#blocks-list li").filter({ hasText: "Formacion ficticia" });
  await fila.getByRole("button", { name: "Eliminar", exact: true }).click(); await page.getByRole("button", { name: "Mantener", exact: true }).click(); await expect(fila).toBeVisible();
  await fila.getByRole("button", { name: "Eliminar", exact: true }).click(); await page.getByRole("dialog").getByRole("button", { name: "Eliminar", exact: true }).click(); await expect(fila).toHaveCount(0);
  await page.locator("#block-type").selectOption("vacation"); await expect(page.locator("#block-date")).toBeHidden(); await expect(page.locator("#vacation-start")).toBeVisible();
  await page.locator("#vacation-start").fill(fechaReserva(30)); await page.locator("#vacation-end").fill(fechaReserva(29));
  await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click(); await expect(page.locator("#blocks-msg")).toHaveText("Rango de vacaciones invalido.");
  await page.locator("#vacation-start").fill(fechaReserva(29)); await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click();
  await expect(page.locator("#blocks-list")).toContainText(fechaReserva(29) + " -> " + fechaReserva(29) + " (vacaciones)");
});
test("respuesta perdida de bloqueo se recupera tras recargar con la misma operacion", async ({ page }, informacion) => {
  await iniciarPersonal(page, "profesional-" + informacion.project.name); await page.goto("/bloqueos");
  await expect(page.locator("#block-date")).toHaveValue(fechaReserva(0)); await page.locator("#block-date").fill(fechaReserva(27));
  await page.locator("#block-type").selectOption("internal"); await page.locator("#block-start").fill("18:00"); await page.locator("#block-end").fill("19:00"); await page.locator("#block-reason").fill("Respuesta perdida");
  const claves: string[] = []; page.on("request", (peticion) => { if (peticion.url().endsWith("/createScheduleBlock")) claves.push(peticion.postDataJSON().data.requestId); });
  await page.route("**/europe-west1/createScheduleBlock", async (ruta) => { const respuesta = await ruta.fetch(); expect(respuesta.ok()).toBe(true); await ruta.abort("failed"); });
  await page.getByRole("button", { name: "Guardar bloqueo", exact: true }).click(); await expect(page.getByRole("button", { name: "Comprobar operacion", exact: true })).toBeEnabled();
  await page.unroute("**/europe-west1/createScheduleBlock"); await page.reload(); await page.getByRole("button", { name: "Comprobar operacion", exact: true }).click();
  await expect(page.locator("#blocks-msg")).toHaveText("Bloqueo guardado."); await expect(page.locator("#blocks-list li").filter({ hasText: "Respuesta perdida" })).toHaveCount(1);
  expect(claves).toHaveLength(2); expect(claves[0]).toBe(claves[1]);
});
for (const rol of ["manager", "admin"]) test("gestion autorizada selecciona profesionales: " + rol, async ({ page }) => {
  await iniciarPersonal(page, "reservas-" + rol); await page.goto("/setup-barber?barberUid=profesional-otro");
  await expect(page.locator("#setup-barber-wrap")).toBeVisible(); await expect(page.locator("#setup-barber-select")).toHaveValue("profesional-otro"); await expect(page.locator("#save-config")).toBeEnabled();
  await page.goto("/bloqueos?barberUid=profesional-otro"); await expect(page.locator("#block-barber")).toHaveValue("profesional-otro"); await expect(page.locator("#block-barber")).toBeEnabled();
  await page.goto("/agenda"); await expect(page.locator("#agenda-list article").first()).toBeVisible();
});
test("worker ignora UID ajeno y limpia una respuesta pendiente al cambiar de identidad", async ({ page, context, request }, informacion) => {
  const uid = "profesional-" + informacion.project.name;
  await iniciarPersonal(page, uid); await page.goto("/setup-barber?barberUid=profesional-otro");
  await expect(page).toHaveURL(new RegExp("barberUid=" + uid)); await expect(page.locator("#setup-barber-wrap")).toBeHidden();
  await page.locator("#week-date").fill(semanaProfesional(35)); await expect(page.locator("#save-config")).toBeEnabled();
  let avisar: () => void = () => {}, liberar: () => void = () => {};
  const guardada = new Promise<void>((resolver) => { avisar = resolver; }), permiso = new Promise<void>((resolver) => { liberar = resolver; });
  await page.route("**/europe-west1/saveWeeklySchedule", async (ruta) => { const respuesta = await ruta.fetch(); expect(respuesta.ok()).toBe(true); avisar(); await permiso; await ruta.fulfill({ response: respuesta }); });
  const otraPagina = await context.newPage();
  try {
    await page.locator("#save-config").click(); await guardada; await otraPagina.goto("/");
    // La segunda pestaña debe terminar de inicializar Auth antes de cambiar su
    // persistencia; de otro modo puede restaurar después la identidad anterior.
    await expect(otraPagina.locator("#link-setup")).toBeVisible();
    await cambiarCuentaPersistida(otraPagina, request, "vacio"); await page.bringToFront();
    await expect(page).toHaveURL(/\/\?acceso=denegado$/, { timeout: 15000 }); liberar(); await expect(page.locator("#link-setup")).toBeHidden();
    await expect(page.locator("#config-ok")).toHaveCount(0);
  } finally { liberar(); await otraPagina.close(); }
});
