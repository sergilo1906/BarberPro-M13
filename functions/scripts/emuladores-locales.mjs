import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../../", import.meta.url));
const modoPruebas = process.argv.includes("--pruebas");
const argumentos = [fileURLToPath(new URL("../../node_modules/firebase-tools/lib/bin/firebase.js", import.meta.url)),
  modoPruebas ? "emulators:exec" : "emulators:start", "--only", "auth,firestore,functions", "--project", "demo-barberpro-m13"];
if (modoPruebas) argumentos.push('node functions/tests/emuladores/ejecutar-pruebas.mjs');
const entorno = {
  ...process.env, XDG_CONFIG_HOME: fileURLToPath(new URL("../../.verificacion/firebase-cli/", import.meta.url)),
  FUNCTION_DISCOVERY_TIMEOUT: "60", FIREBASE_CLI_DISABLE_UPDATE_CHECK: "true", CI: "true",
};
// La CLI local no reutiliza la sesión global ni credenciales de aplicaciones reales.
delete entorno.GOOGLE_APPLICATION_CREDENTIALS;
delete entorno.FIREBASE_TOKEN;
delete entorno.DEBUG;
const proceso = spawn(process.execPath, argumentos, { cwd: raiz, env: entorno, stdio: "inherit" });
proceso.on("error", () => { process.exitCode = 1; });
// Un proceso interrumpido devuelve null: nunca debe presentarse como éxito.
proceso.on("exit", (codigo) => { process.exitCode = typeof codigo === "number" ? codigo : 1; });
