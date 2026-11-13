import { observarAreaAutorizada, type ContextoAutorizado } from "../../comun/permisos";
import { obtenerCatalogoCompleto } from "../../datos/catalogo";
import { guardarServicio } from "../../datos/funciones-remotas";
import { bloquearFormulario } from "../../comun/formularios";
import type { ServicioAdministrable } from "../../modelos/agenda";
const formulario = document.querySelector<HTMLFormElement>("#service-create-form")!;
const lista = document.getElementById("services-list")!;
const mensaje = document.getElementById("services-msg")!;
const nombre = document.querySelector<HTMLInputElement>("#service-name")!;
const duracion = document.querySelector<HTMLInputElement>("#service-duration")!;
const precio = document.querySelector<HTMLInputElement>("#service-price")!;
const activo = document.querySelector<HTMLInputElement>("#service-active")!;
let contexto: ContextoAutorizado | null = null;
let nuevoId = crypto.randomUUID();
let ocupada = false;
// El servidor valida el servicio; reutilizar su ID permite reintentar sin crear duplicados.
async function guardar(item: ServicioAdministrable) {
    const actual = contexto;
    if (!actual?.esVigente() || ocupada) {
        return;
    }
    ocupada = true;
    bloquearFormulario(formulario, true);
    lista.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach(c => {
        c.disabled = true;
    });
    mensaje.textContent = "Guardando servicio...";
    try {
        await guardarServicio(item);
        if (!actual.esVigente()) {
            return;
        }
        if (item.id === nuevoId) {
            nuevoId = crypto.randomUUID();
            formulario.reset();
        }
        await cargar(actual);
        if (actual.esVigente()) {
            mensaje.textContent = "Servicio guardado.";
        }
    }
    catch (error) {
        if (actual.esVigente()) {
            mensaje.textContent = error instanceof Error ? error.message : "No se pudo guardar. Reintenta.";
        }
    }
    finally {
        if (actual.esVigente()) {
            ocupada = false;
            bloquearFormulario(formulario, false);
            lista.querySelectorAll<HTMLInputElement | HTMLButtonElement>("input, button").forEach(c => {
                c.disabled = false;
            });
        }
    }
}
// Cargamos el catalogo completo del administrador y creamos controles con texto seguro.
async function cargar(actual: ContextoAutorizado) {
    try {
        const catalogo = await obtenerCatalogoCompleto();
        if (!actual.esVigente()) {
            return;
        }
        lista.replaceChildren();
        for (const item of catalogo) {
            const fila = document.createElement("form");
            fila.className = "border rounded p-3 grid gap-3 sm:grid-cols-2";
            const nombreFila = campo("Nombre", item.name, "text");
            const duracionFila = campo("Duracion (30 o 60 min)", String(item.durationMin), "number");
            duracionFila.min = "30";
            duracionFila.max = "60";
            duracionFila.step = "30";
            const precioFila = campo("Precio (EUR)", String(item.price), "number");
            precioFila.min = "0";
            precioFila.step = "0.5";
            const etiqueta = document.createElement("label");
            etiqueta.textContent = " Activo ";
            const activoFila = document.createElement("input");
            activoFila.type = "checkbox";
            activoFila.defaultChecked = item.active;
            etiqueta.prepend(activoFila);
            fila.append(etiqueta);
            const guardarFila = document.createElement("button");
            guardarFila.type = "submit";
            guardarFila.className = "border rounded px-3 py-2";
            guardarFila.textContent = "Guardar servicio";
            fila.append(guardarFila);
            function campo(texto: string, valor: string, tipo: string) {
                const etiqueta = document.createElement("label");
                etiqueta.textContent = texto;
                const entrada = document.createElement("input");
                entrada.type = tipo;
                entrada.required = true;
                entrada.defaultValue = valor;
                entrada.className = "w-full border rounded px-3 py-2";
                etiqueta.append(entrada);
                fila.append(etiqueta);
                return entrada;
            }
            fila.addEventListener("submit", evento => {
                evento.preventDefault();
                void guardar({
                    id: item.id, name: nombreFila.value, durationMin: Number(duracionFila.value), price: Number(precioFila.value), active: activoFila.checked
                });
            });
            lista.append(fila);
        }
        mensaje.textContent = catalogo.length ? "" : "No hay servicios.";
    }
    catch (error) {
        if (actual.esVigente()) {
            mensaje.textContent = error instanceof Error ? error.message : "No se pudo cargar el catalogo.";
        }
    }
}
formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    void guardar({
        id: nuevoId, name: nombre.value, durationMin: Number(duracion.value), price: Number(precio.value), active: activo.checked
    });
});
document.getElementById("services-refresh")!.addEventListener("click", () => {
    if (contexto?.esVigente() && !ocupada) {
        void cargar(contexto);
    }
});
observarAreaAutorizada(["admin"], actual => {
    contexto = actual;
    bloquearFormulario(formulario, false);
    void cargar(actual);
}, () => {
    contexto = null;
    ocupada = false;
    nuevoId = crypto.randomUUID();
    formulario.reset();
    bloquearFormulario(formulario, true);
    lista.replaceChildren();
    mensaje.textContent = "";
});
