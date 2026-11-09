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
