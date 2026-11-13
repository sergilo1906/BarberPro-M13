import type { Cita, EstadoCita } from "../../modelos/agenda";
import { obtenerClasesEstadoAgenda, obtenerEtiquetaEstadoAgenda, obtenerEstadosSiguientes } from "../../comun/estados-cita";
export function mostrarTarjetasAgenda(contenedor: HTMLElement, citas: Cita[], nombres: Map<string, string>, actuar: (cita: Cita, estado: EstadoCita) => void): void {
    contenedor.replaceChildren();
    if (!citas.length) {
        contenedor.innerHTML = '<div class="p-4 text-sm text-gray-600 space-y-1"><p class="font-medium text-gray-800">No hay citas para los filtros seleccionados.</p><p>Prueba otra fecha o cambia el estado a "Todos".</p></div>';
        return;
    }
    for (const cita of citas) {
        const articulo = document.createElement("article");
        articulo.className = "p-3";
        articulo.dataset.id = cita.id;
        articulo.innerHTML = '<div class="flex items-start justify-between gap-3"><div class="space-y-1"><p data-cita="servicio" class="font-medium text-gray-900"></p><p data-cita="cliente" class="text-xs text-gray-600"></p><p data-cita="profesional" class="text-xs text-gray-500"></p></div><div data-cita="estado" class="text-right space-y-2"><span class="inline-block rounded border px-2 py-1 text-xs font-medium"></span></div></div>';
        articulo.querySelector('[data-cita="servicio"]')!.textContent = cita.timeStr + " - " + (cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio");
        articulo.querySelector('[data-cita="cliente"]')!.textContent = "Cliente: " + (cita.userName || cita.userEmail || cita.userPhone || "Cliente sin nombre");
        articulo.querySelector('[data-cita="profesional"]')!.textContent = "Profesional: " + (cita.barberUid ? nombres.get(cita.barberUid) || "Profesional" : "Profesional no asignado");
        const estado = cita.status || "pending";
        const etiqueta = articulo.querySelector("span")!;
        etiqueta.textContent = obtenerEtiquetaEstadoAgenda(estado);
        etiqueta.className += " " + obtenerClasesEstadoAgenda(estado);
        const acciones = document.createElement("div");
        acciones.className = "flex flex-col items-end gap-1";
        for (const siguiente of obtenerEstadosSiguientes(estado)) {
            const boton = document.createElement("button");
            boton.type = "button";
            boton.dataset.id = cita.id;
            boton.dataset.next = siguiente;
            let tono = "border-green-200 bg-green-50 text-green-800";
            if (siguiente === "cancelled") {
                tono = "border-red-200 bg-red-50 text-red-800";
            } else if (siguiente === "no_show") {
                tono = "border-amber-200 bg-amber-50 text-amber-800";
            }
            boton.className = "action-btn rounded border px-2 py-1 text-xs " + tono;
            if (siguiente === "confirmed") {
                boton.textContent = "Confirmar";
            } else if (siguiente === "done") {
                boton.textContent = "Marcar hecha";
            } else if (siguiente === "no_show") {
                boton.textContent = "No show";
            } else {
                boton.textContent = "Cancelar";
            }
            boton.addEventListener("click", () => actuar(cita, siguiente));
            acciones.append(boton);
        }
        if (acciones.childElementCount) {
            articulo.querySelector('[data-cita="estado"]')!.append(acciones);
        }
        contenedor.append(articulo);
    }
}
export function mostrarCitasDelDia(contenedor: HTMLElement, citas: Cita[], hoy: string, esTrabajador: boolean, nombres: Map<string, string>): void {
    contenedor.replaceChildren();
    let mostradas = 0;
    for (const cita of citas) {
        if (cita.dateStr !== hoy || !["pending", "confirmed"].includes(cita.status || "pending")) {
            continue;
        }
        if (mostradas++ >= 5) {
            break;
        }
        const articulo = document.createElement("article");
        articulo.className = "rounded border border-gray-200 p-3";
        const servicio = document.createElement("p");
        servicio.className = "text-sm font-medium text-gray-900";
        servicio.textContent = cita.timeStr + " - " + (cita.serviceSnapshot?.name || cita.serviceName || cita.service || "Servicio");
        const cliente = document.createElement("p");
        cliente.className = "text-xs text-gray-600";
        cliente.textContent = "Cliente: " + (cita.userName || cita.userEmail || "Cliente");
        articulo.append(servicio, cliente);
        if (!esTrabajador) {
            const profesional = document.createElement("p");
            profesional.className = "text-xs text-gray-500";
            profesional.textContent = "Profesional: " + (nombres.get(cita.barberUid) || "Profesional");
            articulo.append(profesional);
        }
        contenedor.append(articulo);
    }
    if (!mostradas) {
        contenedor.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><p class="font-medium text-slate-900">No hay citas pendientes para hoy.</p></div>';
    }
}
