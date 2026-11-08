import { setGlobalOptions } from "firebase-functions/v2";

// Configuración del backend; no inicializa Admin ni consulta servicios remotos.
setGlobalOptions({
  region: "europe-west1",
  memoryMiB: 256,
  timeoutSeconds: 120,
});
