import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { comprobarEntornoLocal } from "../../src/firebase.js";
comprobarEntornoLocal();
const raiz = fileURLToPath(new URL("../../../", import.meta.url));
const app = fileURLToPath(new URL("../../../app/", import.meta.url));
const env = { ...process.env, PUBLIC_FIREBASE_MODE:"local", PUBLIC_USE_FIREBASE_EMULATORS:"1", PUBLIC_USE_FUNCTIONS_EMULATOR:"1", PUBLIC_FIREBASE_API_KEY:"demo-api-key", PUBLIC_FIREBASE_AUTH_DOMAIN:"localhost", PUBLIC_FIREBASE_PROJECT_ID:"demo-barberpro-m13", PUBLIC_FIREBASE_APP_ID:"1:123456789:web:demo", PUBLIC_APP_URL:"http://127.0.0.1:4331" };
function ejecutar(args, cwd=raiz) { const r=spawnSync(process.execPath,args,{cwd,env,stdio:"inherit"}); if(r.error || r.status!==0) process.exit(r.status || 1); }
ejecutar(["--test","--test-concurrency=1","functions/tests/emuladores/agenda.test.mjs"]);
const astro=JSON.parse(readFileSync(new URL("../../../app/node_modules/astro/package.json",import.meta.url),"utf8"));
ejecutar(["node_modules/astro/"+astro.bin.astro,"build"],app);
ejecutar(["node_modules/@playwright/test/cli.js","test"],app);

