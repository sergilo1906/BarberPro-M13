export function obtenerCodigoError(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String(error.code);
  }
  return "";
}

export function explicarErrorAcceso(error: unknown): string {
  const codigo = obtenerCodigoError(error);
  if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found"].includes(codigo)) {
    return "Email o contrasena incorrectos.";
  }
  if (codigo === "auth/email-already-in-use") return "Ese email ya esta en uso.";
  if (codigo === "auth/invalid-email") return "Email no valido.";
  if (codigo === "auth/weak-password") return "La contrasena es demasiado debil.";
  if (codigo === "auth/too-many-requests") return "Demasiados intentos. Espera un minuto y vuelve a probar.";
  if (codigo === "auth/network-request-failed" || codigo === "unavailable") {
    return "No se pudo conectar. Comprueba la conexion y vuelve a intentarlo.";
  }
  if (codigo === "auth/user-disabled" || codigo === "auth/user-token-expired" || codigo === "auth/invalid-user-token") {
    return "La sesion ya no es valida. Vuelve a iniciar sesion.";
  }
  return "No se pudo completar la operacion. Vuelve a intentarlo.";
}

export function explicarErrorVerificacion(error: unknown): string {
  if (obtenerCodigoError(error) === "auth/too-many-requests") {
    return "Has pedido demasiados correos. Espera un minuto y vuelve a intentarlo.";
  }
  return "No se pudo enviar el correo de verificacion. Prueba otra vez desde tu perfil.";
}

export function explicarErrorReserva(error: unknown): string {
  const codigo = obtenerCodigoError(error);
  if (codigo === "functions/already-exists") return "Ese horario ya no esta disponible. Selecciona otra hora.";
  if (codigo === "functions/permission-denied" || codigo === "functions/unauthenticated") return "No tienes permiso para esta operacion. Revisa tu sesion y la verificacion del email.";
  if (codigo === "functions/not-found") return "La reserva no existe.";
  if (codigo === "functions/invalid-argument") return "Revisa el servicio, profesional, fecha y hora seleccionados.";
  if (codigo === "functions/failed-precondition") return "La seleccion ya no es valida. Revisa los datos y actualiza la disponibilidad.";
  return "No se pudo confirmar la respuesta. Comprueba la reserva antes de volver a enviarla.";
}

export function esRespuestaReservaIncierta(error: unknown): boolean {
  return !["functions/permission-denied", "functions/unauthenticated", "functions/not-found", "functions/already-exists", "functions/invalid-argument", "functions/failed-precondition", "functions/resource-exhausted"].includes(obtenerCodigoError(error));
}

export function explicarErrorCancelacion(error: unknown, margen: number): string {
  const codigo = obtenerCodigoError(error);
  if (codigo === "functions/permission-denied" || codigo === "functions/unauthenticated") return "Ahora mismo tu cuenta no puede cancelar esta cita.";
  if (codigo === "functions/failed-precondition") return "La cita ya no admite cancelacion o no cumple el margen de " + margen + " h. Actualiza el listado.";
  if (codigo === "functions/not-found") return "La reserva no existe. Actualiza el listado.";
  return "No se pudo confirmar la cancelacion. Actualiza el listado antes de volver a intentarlo.";
}

export function explicarErrorCambioCita(error: unknown, margen: number): string {
  const codigo = obtenerCodigoError(error);
  if (codigo === "functions/permission-denied" || codigo === "functions/unauthenticated") return "Ahora mismo tu cuenta no puede cambiar esta cita.";
  if (codigo === "functions/failed-precondition") return "La cita o la seleccion ya no admiten el cambio. Revisa el margen de " + margen + " h y actualiza el listado.";
  if (codigo === "functions/already-exists") return "Ese hueco ya no esta libre.";
  if (codigo === "functions/not-found") return "La reserva o el servicio ya no existen.";
  if (codigo === "functions/invalid-argument") return "Revisa la nueva fecha y hora.";
  return "No se pudo confirmar el cambio. Pulsa Comprobar cambio antes de iniciar otro.";
}

export function explicarErrorAgenda(error: unknown): string {
  const codigo = obtenerCodigoError(error);
  if (codigo.includes("permission-denied") || codigo.includes("unauthenticated")) return "No tienes permiso para esta operacion. Revisa tu sesion.";
  if (codigo.includes("already-exists")) return "Hay un conflicto con una cita o un bloqueo existente. Actualiza los datos y revisa el intervalo.";
  if (codigo.includes("failed-precondition")) return "Los datos han cambiado o el horario no permite conservar las citas existentes. Recarga y revisa la semana.";
  if (codigo.includes("invalid-argument")) return "Revisa las fechas, horas y campos del formulario.";
  if (codigo.includes("not-found")) return "El profesional o bloqueo ya no existe. Actualiza el listado.";
  if (codigo.includes("resource-exhausted")) return "El intervalo es demasiado grande para esta operacion. Reduce las fechas.";
  return "No se pudo confirmar la respuesta. Comprueba la operacion antes de volver a enviarla.";
}
