const entorno = { GCLOUD_PROJECT: "demo-barberpro-m13", FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099", FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088" };
for (const [nombre, valor] of Object.entries(entorno)) {
  if (process.env[nombre] && process.env[nombre] !== valor) throw new Error("Solo se permite preparar datos en los emuladores demo locales.");
  process.env[nombre] = valor;
}
const { prepararCuentas, prepararAgenda } = await import("../tests/emuladores/datos-reservas.mjs");
await prepararCuentas(); await prepararAgenda();
console.log("Preparados clientes y administrador ficticios; worker y manager son exclusivamente casos de acceso denegado.");

