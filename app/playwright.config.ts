import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const carpetaReferencia = path.resolve(fileURLToPath(new URL("../../treball-barberia/app/dist/", import.meta.url)));
const hayReferencia = existsSync(carpetaReferencia);

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/../../.verificacion/referencia/{projectName}/{testFilePath}/{testName}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:4331",
    trace: "retain-on-failure",
    colorScheme: "light",
    // Fijar el render tipográfico de QA evita diferencias de subpíxel/ClearType
    // entre superficies Windows. Se aplica igual al original y a la reconstrucción.
    launchOptions: { args: ["--disable-lcd-text", "--disable-font-subpixel-positioning"] },
  },
  webServer: [
    {
      command: "node tests/e2e/servidor-estatico.mjs 4331",
      url: "http://127.0.0.1:4331",
      reuseExistingServer: false,
    },
    ...(hayReferencia ? [{
      command: 'node tests/e2e/servidor-estatico.mjs 4332 --referencia "' + carpetaReferencia + '"',
      url: "http://127.0.0.1:4332",
      reuseExistingServer: false,
    }] : []),
  ],
  projects: [
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "movil", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    { name: "tableta", testMatch: /.*visual\.test\.ts/, use: { ...devices["Desktop Chrome"], viewport: { width: 820, height: 1180 } } },
  ],
});
