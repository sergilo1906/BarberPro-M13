import type { OpcionesConfirmacion, TipoAviso } from "../modelos/interfaz";
let cancelarModal: (() => void) | null = null;
export function cerrarModalActivo(): void {
    cancelarModal?.();
}
export function mostrarAviso(mensaje: string, tipo: TipoAviso = "info"): void {
    let contenedor = document.getElementById("toast-root");
    if (!contenedor) {
        contenedor = document.createElement("div");
        contenedor.id = "toast-root";
        contenedor.className = "fixed bottom-4 right-4 z-[120] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2 sm:w-auto";
        contenedor.setAttribute("role", "status");
        document.body.append(contenedor);
    }
    const aviso = document.createElement("div");
    let colores = "border-slate-300 bg-white text-slate-900";
    if (tipo === "success") {
        colores = "border-green-300 bg-green-50 text-green-900";
    }
    if (tipo === "error") {
        colores = "border-red-300 bg-red-50 text-red-900";
    }
    aviso.className = "rounded-lg border px-3 py-2 text-sm shadow transition-opacity duration-200 " + colores;
    aviso.textContent = mensaje;
    contenedor.append(aviso);
    setTimeout(() => {
        aviso.classList.add("opacity-0");
        setTimeout(() => aviso.remove(), 180);
    }, 3000);
}
export function abrirModal(contenido: HTMLElement, alCerrar: () => void = () => {
}, puedeCerrar: () => boolean = () => true): () => void {
    cerrarModalActivo();
    const elementoAnterior = document.activeElement;
    const fondo = document.createElement("div");
    fondo.dataset.modalPrivate = "";
    fondo.className = "fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4";
    const modal = document.createElement("div");
    modal.className = "relative w-full max-w-md rounded-xl bg-white p-4 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = '<button type="button" data-modal-close="x" class="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Cerrar">X</button><div data-modal-content class="pr-6"></div>';
    modal.querySelector("[data-modal-content]")!.append(contenido);
    const titulo = contenido.querySelector("h3");
    if (titulo) {
        titulo.id = "modal-titulo";
        modal.setAttribute("aria-labelledby", titulo.id);
    }
    fondo.append(modal);
    document.body.append(fondo);
    let resuelto = false;
    function cerrar(): void {
        if (resuelto) {
            return;
        }
        resuelto = true;
        document.removeEventListener("keydown", manejarTecla);
        fondo.remove();
        cancelarModal = null;
        if (elementoAnterior instanceof HTMLElement && elementoAnterior.isConnected) {
            elementoAnterior.focus();
        }
        alCerrar();
    }
    function manejarTecla(evento: KeyboardEvent): void {
        if (evento.key === "Escape") {
            evento.preventDefault();
            if (puedeCerrar()) {
                cerrar();
            }
        }
        if (evento.key === "Tab") {
            const botones = Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]'));
            const indice = botones.indexOf(document.activeElement as HTMLButtonElement);
            const siguiente = (indice + (evento.shiftKey ? -1 : 1) + botones.length) % botones.length;
            evento.preventDefault();
            botones[siguiente].focus();
        }
    }
    document.addEventListener("keydown", manejarTecla);
    cancelarModal = cerrar;
    modal.querySelector("[data-modal-close]")!.addEventListener("click", () => {
        if (puedeCerrar()) {
            cerrar();
        }
    });
    fondo.addEventListener("click", (evento) => {
        if (evento.target === fondo && puedeCerrar()) {
            cerrar();
        }
    });
    (contenido.querySelector<HTMLElement>('button[data-action="confirm"]:not(:disabled)') || contenido.querySelector<HTMLElement>('input:not(:disabled), button:not(:disabled)') || modal.querySelector<HTMLButtonElement>("button"))?.focus();
    return cerrar;
}
export function pedirConfirmacion(opciones: OpcionesConfirmacion): Promise<boolean> {
    return new Promise((resolver) => {
        // La plantilla es constante. Todos los textos variables se insertan como texto.
        const contenido = document.createElement("div");
        contenido.className = "space-y-3";
        contenido.innerHTML = '<h3 class="text-base font-semibold text-slate-900"></h3><p class="text-sm text-slate-600 whitespace-pre-line"></p><div class="flex justify-end gap-2 pt-2"><button type="button" data-action="cancel" class="rounded border px-3 py-2 text-sm"></button><button type="button" data-action="confirm" class="rounded px-3 py-2 text-sm font-medium text-white"></button></div>';
        contenido.querySelector("h3")!.textContent = opciones.title;
        contenido.querySelector("p")!.textContent = opciones.message;
        const confirmar = contenido.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
        const cancelar = contenido.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
        confirmar.textContent = opciones.confirmText || "Confirmar";
        cancelar.textContent = opciones.cancelText || "Cancelar";
        confirmar.className += opciones.danger ? " bg-red-600 hover:bg-red-700" : " bg-blue-600 hover:bg-blue-700";
        const cerrar = abrirModal(contenido, () => resolver(false));
        confirmar.addEventListener("click", () => {
            resolver(true);
            cerrar();
        });
        cancelar.addEventListener("click", cerrar);
    });
}
