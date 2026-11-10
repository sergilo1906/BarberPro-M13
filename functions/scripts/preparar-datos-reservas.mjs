const valoresLocales = {
  GCLOUD_PROJECT: "demo-barberpro-m13",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8088",
};
for (const [nombre, valor] of Object.entries(valoresLocales)) {
  if (process.env[nombre] && process.env[nombre] !== valor) throw new Error("La preparacion de datos solo admite los emuladores demo locales.");
  process.env[nombre] = valor;
}
const { prepararCuentas, prepararAgenda } = await import("../tests/emuladores/datos-reservas.mjs");
await prepararCuentas();
await prepararAgenda();
const { prepararDatosCliente } = await import("../tests/emuladores/datos-cliente.mjs");
await prepararDatosCliente();
console.log("Datos ficticios preparados. Se han reiniciado las reservas, locks, bloqueos y notificaciones de los emuladores demo locales.");
