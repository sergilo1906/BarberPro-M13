import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { comprobarEntornoLocal } from "../../src/firebase.js";

comprobarEntornoLocal();
const raizProyecto = fileURLToPath(new URL("../../../", import.meta.url));
const entorno = {
  ...process.env,
  PUBLIC_USE_FIREBASE_EMULATORS: "1", PUBLIC_USE_FUNCTIONS_EMULATOR: "1",
  PUBLIC_FIREBASE_API_KEY: "demo-api-key", PUBLIC_FIREBASE_AUTH_DOMAIN: "localhost",
  PUBLIC_FIREBASE_PROJECT_ID: "demo-barberpro-m13", PUBLIC_FIREBASE_APP_ID: "1:123456789:web:demo",
};

function ejecutar(argumentos, carpetaTrabajo = raizProyecto) {
  const resultado = spawnSync(process.execPath, argumentos, { cwd: carpetaTrabajo, env: entorno, stdio: "inherit" });
  if (resultado.error || resultado.status !== 0) process.exit(resultado.status || 1);
}

ejecutar(["--test", "--test-concurrency=1", "functions/tests/emuladores/permisos.test.mjs", "functions/tests/emuladores/reservas-consistencia.test.mjs", "functions/tests/emuladores/reservas-concurrencia.test.mjs"]);
ejecutar(["--test", "functions/tests/emuladores/cliente.test.mjs"]);
ejecutar(["--test", "functions/tests/emuladores/profesional.test.mjs"]);
ejecutar(["--test", "functions/tests/emuladores/administracion.test.mjs"]);
ejecutar(["--test", "functions/tests/emuladores/restantes.test.mjs"]);
const carpetaApp = fileURLToPath(new URL("../../../app/", import.meta.url));
const paqueteAstro = JSON.parse(readFileSync(new URL("../../../app/node_modules/astro/package.json", import.meta.url), "utf8"));
ejecutar(["node_modules/astro/" + paqueteAstro.bin.astro, "build"], carpetaApp);
ejecutar(["node_modules/@playwright/test/cli.js", "test", "--project=escritorio", "--project=movil"], carpetaApp);
// La comparación de tableta parte de fixtures restablecidos: los recorridos
// funcionales anteriores modifican citas y semanas del escenario de escritorio.
ejecutar(["functions/scripts/preparar-datos-reservas.mjs"]);
ejecutar(["node_modules/@playwright/test/cli.js", "test", "--project=tableta"], carpetaApp);
