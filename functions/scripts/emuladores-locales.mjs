import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

const raiz = fileURLToPath(new URL("../../", import.meta.url));
const modoPruebas = process.argv.includes("--pruebas");
const argumentos = [fileURLToPath(new URL("../../node_modules/firebase-tools/lib/bin/firebase.js", import.meta.url)),
  modoPruebas ? "emulators:exec" : "emulators:start", "--only", "auth,firestore,functions", "--project", "demo-barberpro-m13"];
if (modoPruebas) argumentos.push('node functions/tests/emuladores/ejecutar-pruebas.mjs');
// Perfil vacío por ejecución: no reutiliza cuentas globales ni deja cachés en la fuente.
const carpetaTemporal = realpathSync(tmpdir());
const configuracionCli = mkdtempSync(join(carpetaTemporal, "barberpro-m13-cli-"));
function limpiarConfiguracionCli() {
  const destino = resolve(configuracionCli);
  if (!destino.startsWith(carpetaTemporal + sep) || !destino.startsWith(join(carpetaTemporal, "barberpro-m13-cli-"))) {
    throw new Error("Ruta temporal de Firebase no valida.");
  }
  rmSync(destino, { recursive: true, force: true });
}
const entorno = {
  ...process.env, XDG_CONFIG_HOME: configuracionCli,
  FUNCTIONS_DISCOVERY_TIMEOUT: "60", FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true", CI: "true",
};
// La CLI local no reutiliza la sesión global ni credenciales de aplicaciones reales.
delete entorno.GOOGLE_APPLICATION_CREDENTIALS;
delete entorno.FIREBASE_TOKEN;
delete entorno.DEBUG;
const proceso = spawn(process.execPath, argumentos, { cwd: raiz, env: entorno, stdio: "inherit" });
proceso.on("error", () => { limpiarConfiguracionCli(); process.exitCode = 1; });
// Un proceso interrumpido devuelve null: nunca debe presentarse como éxito.
proceso.on("exit", (codigo) => {
  limpiarConfiguracionCli();
  process.exitCode = typeof codigo === "number" ? codigo : 1;
});
