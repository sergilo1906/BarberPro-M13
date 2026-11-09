import { expect, type Page, type APIRequestContext } from "@playwright/test";

export function fechaReserva(dias: number): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const valores: Record<string, string> = {};
  for (const parte of partes) valores[parte.type] = parte.value;
  const fecha = new Date(valores.year + "-" + valores.month + "-" + valores.day + "T00:00:00Z");
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export async function abrirReserva(page: Page, fecha: string): Promise<void> {
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.locator("#login-email").fill("reservas-client@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/reservar\/?$/);
  await expect(page.locator("#service-select")).toBeEnabled();
  await page.locator("#service-select").selectOption("svc_haircut");
  await page.locator("#any-barber").uncheck();
  await page.locator("#barber-select").selectOption("demo_worker_1");
  await page.locator("#date-select").fill(fecha);
  await expect(page.locator('.slot-btn[data-time="09:10"]')).toBeVisible({ timeout: 15_000 });
}

export async function ocuparHorario(request: APIRequestContext, fecha: string): Promise<void> {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: "reservas-client-2@example.test", password: "Prueba123!", returnSecureToken: true } });
  const usuario = await acceso.json();
  const respuesta = await request.post("http://127.0.0.1:5001/demo-barberpro-m13/europe-west1/createBooking", {
    headers: { Authorization: "Bearer " + usuario.idToken },
    data: { data: { dateStr: fecha, timeStr: "09:10", serviceId: "svc_haircut", barberPreference: "demo_worker_1", anyBarber: false } },
  });
  expect(respuesta.ok()).toBe(true);
}
