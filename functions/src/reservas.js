import { onCall } from "firebase-functions/v2/https";
import { comprobarSesion } from "./permisos.js";
import { intentarCrearReservaAtomica, cambiarEstadoReserva } from "./persistencia-reservas.js";

export const createBooking = onCall(async (peticion) => {
  const identidad = await comprobarSesion(peticion, true);
  return intentarCrearReservaAtomica(identidad, peticion.data);
});

export const cancelBooking = onCall(async (peticion) => {
  const identidad = await comprobarSesion(peticion, true);
  return cambiarEstadoReserva(identidad, peticion.data, true);
});

export const rescheduleBooking = onCall(async (peticion) => {
  const identidad = await comprobarSesion(peticion, true);
  return intentarCrearReservaAtomica(identidad, peticion.data, true);
});

export const updateBookingStatus = onCall(async (peticion) => {
  const identidad = await comprobarSesion(peticion, true);
  return cambiarEstadoReserva(identidad, peticion.data);
});
