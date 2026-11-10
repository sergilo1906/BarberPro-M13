import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { fechaReserva } from "./datos-reserva";
import { obtenerLunesSemana, sumarDiasCalendario } from "../../src/comun/fechas";
export { fechaReserva };
export function semanaProfesional(dias = 7): string { return obtenerLunesSemana(fechaReserva(dias)); }
export function diaProfesional(dias = 7): string { return sumarDiasCalendario(semanaProfesional(dias), 1); }

export async function iniciarPersonal(page: Page, cuenta: string): Promise<void> {
  await page.goto("/login");
  await expect(page.locator("#login-email")).toBeEnabled();
  await page.locator("#login-email").fill(cuenta + "@example.test");
  await page.locator("#login-password").fill("Prueba123!");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(cuenta.startsWith("profesional-") ? /\/panel-barbero\/?$/ : /\/index-admin\/?$/);
}
export async function abrirHorario(page: Page, cuenta: string, dias = 7): Promise<void> {
  await iniciarPersonal(page, cuenta);
  await page.goto("/setup-barber");
  await expect(page.locator("#save-config")).toBeEnabled();
  await page.locator("#week-date").fill(semanaProfesional(dias));
  await expect(page.locator("#week-date")).toHaveValue(semanaProfesional(dias));
  await expect(page.locator("#save-config")).toBeEnabled();
}
export async function llamarPersonal(request: APIRequestContext, cuenta: string, nombre: string, datos: object) {
  const acceso = await request.post("http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-api-key", { data: { email: cuenta + "@example.test", password: "Prueba123!", returnSecureToken: true } });
  expect(acceso.ok()).toBe(true);
  const identidad = await acceso.json();
  return request.post("http://127.0.0.1:5001/demo-barberpro-m13/europe-west1/" + nombre, { headers: { Authorization: "Bearer " + identidad.idToken }, data: { data: datos } });
}
