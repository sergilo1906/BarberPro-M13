import type { TipoAviso } from "../modelos/interfaz";
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
