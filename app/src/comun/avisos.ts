import type { OpcionesConfirmacion, TipoAviso } from "../modelos/interfaz";

let cancelarModal: (() => void) | null = null;

export function cerrarModalActivo(): void { cancelarModal?.(); }

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
  if (tipo === "success") colores = "border-green-300 bg-green-50 text-green-900";
  if (tipo === "error") colores = "border-red-300 bg-red-50 text-red-900";
  aviso.className = "rounded-lg border px-3 py-2 text-sm shadow transition-opacity duration-200 " + colores;
  aviso.textContent = mensaje;
  contenedor.append(aviso);
  setTimeout(() => { aviso.classList.add("opacity-0"); setTimeout(() => aviso.remove(), 180); }, 3000);
}

export function pedirConfirmacion(opciones: OpcionesConfirmacion): Promise<boolean> {
  cerrarModalActivo();
  return new Promise((resolver) => {
    const elementoAnterior = document.activeElement;
    const fondo = document.createElement("div");
    fondo.className = "fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4";
    const modal = document.createElement("div");
    modal.className = "relative w-full max-w-md rounded-xl bg-white p-4 shadow-2xl";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "confirmacion-titulo");
    // Solo esta plantilla constante usa HTML; los datos se insertan siempre como texto.
    modal.innerHTML = '<button type="button" data-modal-close="x" class="absolute right-2 top-2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Cerrar">X</button><div data-modal-content class="pr-6"><div class="space-y-3"><h3 id="confirmacion-titulo" class="text-base font-semibold text-slate-900"></h3><p class="text-sm text-slate-600 whitespace-pre-line"></p><div class="flex justify-end gap-2 pt-2"><button type="button" data-action="cancel" class="rounded border px-3 py-2 text-sm"></button><button type="button" data-action="confirm" class="rounded px-3 py-2 text-sm font-medium text-white"></button></div></div></div>';
    modal.querySelector("h3")!.textContent = opciones.title;
    modal.querySelector("p")!.textContent = opciones.message;
    const confirmar = modal.querySelector<HTMLButtonElement>('[data-action="confirm"]')!;
    const cancelar = modal.querySelector<HTMLButtonElement>('[data-action="cancel"]')!;
    confirmar.textContent = opciones.confirmText || "Confirmar";
    cancelar.textContent = opciones.cancelText || "Cancelar";
    confirmar.className += opciones.danger ? " bg-red-600 hover:bg-red-700" : " bg-blue-600 hover:bg-blue-700";
    fondo.append(modal);
    document.body.append(fondo);
    let resuelto = false;
    function cerrar(resultado: boolean): void {
      if (resuelto) return;
      resuelto = true;
      document.removeEventListener("keydown", manejarTecla);
      fondo.remove();
      cancelarModal = null;
      if (elementoAnterior instanceof HTMLElement && elementoAnterior.isConnected) elementoAnterior.focus();
      resolver(resultado);
    }
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === "Escape") { evento.preventDefault(); cerrar(false); }
      if (evento.key === "Tab") {
        const botones = Array.from(modal.querySelectorAll<HTMLButtonElement>("button"));
        const indice = botones.indexOf(document.activeElement as HTMLButtonElement);
        const siguiente = (indice + (evento.shiftKey ? -1 : 1) + botones.length) % botones.length;
        evento.preventDefault();
        botones[siguiente].focus();
      }
    }
    document.addEventListener("keydown", manejarTecla);
    cancelarModal = () => cerrar(false);
    confirmar.addEventListener("click", () => cerrar(true));
    cancelar.addEventListener("click", () => cerrar(false));
    modal.querySelector("[data-modal-close]")!.addEventListener("click", () => cerrar(false));
    fondo.addEventListener("click", (evento) => { if (evento.target === fondo) cerrar(false); });
    confirmar.focus();
  });
}
