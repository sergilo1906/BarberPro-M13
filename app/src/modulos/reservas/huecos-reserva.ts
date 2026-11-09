import type { HuecoDisponible } from "../../modelos/agenda";
import type { Profesional } from "../../modelos/cuentas";

export function mostrarHuecos(contenedor: HTMLElement, huecos: HuecoDisponible[], profesionales: Profesional[], alSeleccionar: (hueco: HuecoDisponible) => void): void {
  contenedor.replaceChildren();
  if (!huecos.length) {
    const aviso = document.createElement("div");
    aviso.className = "rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 space-y-1";
    const titulo = document.createElement("p");
    titulo.className = "font-medium";
    titulo.textContent = "Sin disponibilidad para esta seleccion.";
    const ayuda = document.createElement("p");
    ayuda.textContent = 'Prueba otro dia, otro servicio o marca "Cualquier profesional disponible".';
    aviso.append(titulo, ayuda);
    contenedor.append(aviso);
    return;
  }
  for (const hueco of huecos) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "slot-btn rounded border border-green-500 bg-green-50 px-3 py-2 text-left hover:bg-green-100";
    boton.dataset.time = hueco.timeStr;
    boton.dataset.barber = hueco.barberUid;
    const hora = document.createElement("div");
    hora.className = "font-medium text-green-900";
    hora.textContent = hueco.timeStr;
    const profesional = document.createElement("div");
    profesional.className = "text-xs text-green-700";
    profesional.textContent = profesionales.find((actual) => actual.uid === hueco.barberUid)?.name || "Profesional";
    boton.append(hora, profesional);
    boton.addEventListener("click", () => alSeleccionar(hueco));
    contenedor.append(boton);
  }
}
