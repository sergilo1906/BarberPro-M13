import { onCall } from "firebase-functions/v2/https";
import { comprobarSesion } from "./permisos.js";
import { crearReserva, cambiarEstado } from "./persistencia-reservas.js";

// Cada entrada comprueba primero la identidad; la transacción vuelve a comprobar sus permisos.
export const createBooking = onCall(async peticion => crearReserva(await comprobarSesion(peticion, true), peticion.data));
export const cancelBooking = onCall(async peticion => cambiarEstado(await comprobarSesion(peticion, true), peticion.data, "cancelled"));
export const completeBooking = onCall(async peticion => cambiarEstado(await comprobarSesion(peticion, true), peticion.data, "done"));
