// Validación compartida de contacto y credenciales; Firebase vuelve a validar en el servidor.
export function comprobarCorreo(correo: string): string {
    if (!correo.trim()) {
        return "Completa el email.";
    }
    if (correo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        return "Email no valido.";
    }
    return "";
}
export function comprobarFormulario(correo: string, contrasena: string): string {
    const mensaje = comprobarCorreo(correo);
    if (mensaje) {
        return mensaje;
    }
    if (!contrasena) {
        return "Completa la contrasena.";
    }
    if (contrasena.length < 6) {
        return "La contrasena debe tener al menos 6 caracteres.";
    }
    return "";
}
export function comprobarContacto(nombre: string, telefono: string): string {
    if (!nombre.trim()) {
        return "Completa el nombre.";
    }
    if (nombre.trim().length > 100) {
        return "El nombre no puede superar 100 caracteres.";
    }
    if (telefono.trim().length > 30) {
        return "El telefono no puede superar 30 caracteres.";
    }
    return "";
}
export function comprobarTramoHorario(inicio: string, fin: string): string {
    const hora = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!hora.test(inicio) || !hora.test(fin)) {
        return "Completa las horas con formato valido.";
    }
    if (inicio >= fin) {
        return "La hora de fin debe ser mayor que la de inicio.";
    }
    return "";
}
export function bloquearFormulario(formulario: HTMLFormElement, bloqueado: boolean): void {
    formulario.classList.toggle("opacity-50", bloqueado);
    formulario.classList.toggle("pointer-events-none", bloqueado);
    formulario.setAttribute("aria-busy", String(bloqueado));
    const controles = formulario.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>("input, button, select, textarea");
    for (let indice = 0; indice < controles.length; indice++) {
        controles[indice].disabled = bloqueado;
    }
}

