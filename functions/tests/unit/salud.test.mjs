import test from "node:test";
import assert from "node:assert/strict";
import { ping } from "../../index.js";

test("ping conserva su respuesta sin leer datos ni requerir una cuenta", async () => {
  let estadoHttp = 0;
  let contenido = "";
  const respuestaHttp = {
    on() { return this; },
    status(estado) { estadoHttp = estado; return this; },
    send(texto) { contenido = texto; return this; },
  };
  await ping({ method: "GET", headers: {} }, respuestaHttp);
  assert.equal(estadoHttp, 200);
  assert.equal(contenido, "ok");
});
