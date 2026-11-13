import { obtenerEtiquetaRol } from "../../comun/permisos";
import { obtenerFichaProfesional } from "../../datos/personas";
import { obtenerSemanaProfesional } from "../../datos/agenda";
import type { UsuarioAdministrable, Rol } from "../../modelos/cuentas";
export async function obtenerEstadoOperativo(uid: string, rol: Rol, semana: string) {
    const ficha = await obtenerFichaProfesional(uid);
    if (!ficha) {
        return {
            tono: rol === "worker" ? "amber" : "slate", titulo: rol === "worker" ? "Falta su ficha en el equipo." : "Esta cuenta no tiene ficha en el equipo.", detalle: rol === "worker" ? "Guarda el cambio y luego prepara una semana si debe salir en reservas." : "Ahora mismo no aparece en reservas ni en el equipo.", resumen: "Sin semana preparada"
        };
    }
    const horario = await obtenerSemanaProfesional(uid, semana);
    if (!ficha.active) {
        return {
            tono: "gray", titulo: "Ficha oculta.", detalle: "No aparecera en reservas hasta activarla desde Equipo.", resumen: "Perfil oculto"
        };
    }
    if (!horario) {
        return {
            tono: "amber", titulo: "Tiene ficha, pero sin horarios.", detalle: "Falta guardar una semana para que pueda recibir reservas.", resumen: "Sin semana preparada"
        };
    }
    if (!horario.published) {
        return {
            tono: "amber", titulo: "Semana guardada, pero aun oculta.", detalle: "Todavia no se muestra en reservas. Hazla visible desde Horarios.", resumen: "Semana guardada"
        };
    }
    return {
        tono: "green", titulo: "Listo para reservas.", detalle: "La ficha esta activa y la semana ya es visible.", resumen: "Semana visible"
    };
}
export function clasesEstadoOperativo(tono: string): string {
    if (tono === "green") {
        return "border-green-200 bg-green-50 text-green-900";
    }
    if (tono === "gray") {
        return "border-gray-200 bg-gray-50 text-gray-800";
    }
    if (tono === "amber") {
        return "border-amber-200 bg-amber-50 text-amber-900";
    }
    return "border-slate-200 bg-slate-50 text-slate-800";
}
export function crearTarjetaUsuario(usuario: UsuarioAdministrable, estado: Awaited<ReturnType<typeof obtenerEstadoOperativo>>): HTMLElement {
    const tarjeta = document.createElement("article");
    tarjeta.className = "border rounded-lg bg-white p-4 space-y-4";
    // La plantilla solo contiene marcado fijo; los datos se asignan como texto.
    tarjeta.innerHTML = '<div class="space-y-1"><div class="space-y-1"><p class="text-base font-semibold text-gray-900" data-nombre></p><p class="text-sm text-gray-600" data-correo></p><p class="text-xs text-gray-500" data-rol></p></div></div><div class="rounded border p-3 text-sm" data-estado><p class="font-medium"></p><p class="mt-1 text-xs"></p></div><div class="grid gap-3 md:grid-cols-[minmax(0,220px),auto] md:items-end"><label class="text-xs text-gray-600 block">Tipo de acceso<select class="role-select mt-1 w-full border rounded px-2 py-2 text-sm"></select></label><button class="apply-role rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Guardar cambios</button></div><div class="flex flex-wrap gap-3 text-sm"><a href="/equipo" class="text-blue-700 underline">Abrir equipo</a><a data-horarios class="text-blue-700 underline">Abrir horarios</a></div>';
    tarjeta.querySelector("[data-nombre]")!.textContent = usuario.name || "Sin nombre";
    tarjeta.querySelector("[data-correo]")!.textContent = usuario.email || "Sin email";
    tarjeta.querySelector("[data-rol]")!.textContent = "Acceso: " + obtenerEtiquetaRol(usuario.role);
    const aviso = tarjeta.querySelector("[data-estado]")!;
    aviso.className += " " + clasesEstadoOperativo(estado.tono);
    aviso.children[0].textContent = estado.titulo;
    aviso.children[1].textContent = estado.detalle;
    const selector = tarjeta.querySelector<HTMLSelectElement>("select")!;
    for (const rol of ["client", "worker", "manager", "admin"] as Rol[]) {
        selector.add(new Option(obtenerEtiquetaRol(rol), rol));
    }
    selector.value = usuario.role;
    tarjeta.querySelector<HTMLAnchorElement>("[data-horarios]")!.href = "/setup-barber?barberUid=" + encodeURIComponent(usuario.uid);
    return tarjeta;
}
