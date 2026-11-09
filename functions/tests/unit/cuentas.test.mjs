import assert from "node:assert/strict";
import { test } from "node:test";
import { comprobarEntornoLocal } from "../../src/firebase.js";
import { comprobarUid, normalizarRolEntrada } from "../../src/permisos.js";

test("el Admin SDK rechaza un entorno sin los dos emuladores demo", () => {
  assert.throws(() => comprobarEntornoLocal(), /emuladores/);
});

test("los roles legados se normalizan sin aceptar propiedades de Object ni tipos arbitrarios", () => {
  assert.equal(normalizarRolEntrada("barbero"), "worker");
  assert.equal(normalizarRolEntrada("Cliente"), "client");
  for (const rol of ["__proto__", "toString", "owner", {}, true, null]) {
    assert.throws(() => normalizarRolEntrada(rol));
  }
});

test("un UID no puede alterar la ruta del documento", () => {
  for (const uid of ["", "a/b", " ", "a".repeat(129), null]) assert.throws(() => comprobarUid(uid));
  assert.equal(comprobarUid("uid_ficticio-1"), "uid_ficticio-1");
});
