import { observarAreaAutorizada, type ContextoAutorizado } from "../../comun/permisos";
import { obtenerConfiguracionAgenda, obtenerDiasCerrados } from "../../datos/configuracion";
import { guardarHorario, cerrarDia } from "../../datos/funciones-remotas";
import { bloquearFormulario } from "../../comun/formularios";
import type { DiaHorario } from "../../modelos/agenda";
const formulario = document.querySelector<HTMLFormElement>("#schedule-form")!;
const cierre = document.querySelector<HTMLFormElement>("#closed-form")!;
const zona = document.querySelector<HTMLInputElement>("#schedule-zone")!;
const mensaje = document.getElementById("hours-msg")!;
const mensajeCierre = document.getElementById("closed-msg")!;
const dias = Array.from(document.querySelectorAll<HTMLFieldSetElement>("[data-day]"));
let contexto: ContextoAutorizado | null = null;
let ocupada = false;
function bloquear(valor: boolean) {
    ocupada = valor;
    bloquearFormulario(formulario, valor);
    bloquearFormulario(cierre, valor);
}
// Leemos los siete dias y solo los tramos que el administrador ha rellenado.
function leerDias(): DiaHorario[] {
    const resultado: DiaHorario[] = [];
    for (const fila of dias) {
        const active = fila.querySelector<HTMLInputElement>("[data-active]")!.checked;
        const ranges: DiaHorario["ranges"] = [];
        for (let indice = 0; indice < 2; indice++) {
            const start = fila.querySelector<HTMLInputElement>('[data-start="' + indice + '"]')!.value;
            const end = fila.querySelector<HTMLInputElement>('[data-end="' + indice + '"]')!.value;
            if (start || end) {
                ranges.push({ start, end });
            }
        }
        resultado.push({ active, ranges });
    }
    return resultado;
}
// Consultamos las fechas completas cerradas, sin reglas parciales por trabajador.
async function listarCierres(actual: ContextoAutorizado) {
    const fechas = await obtenerDiasCerrados();
    if (!actual.esVigente()) {
        return;
    }
    const lista = document.getElementById("closed-list")!;
    lista.replaceChildren();
    for (const fecha of fechas) {
        const li = document.createElement("li");
        li.textContent = fecha;
        lista.append(li);
    }
}
// Bloqueamos ambos formularios mientras se guarda y conservamos sus datos ante un error.
async function ejecutar(operacion: () => Promise<unknown>, aviso: HTMLElement) {
    const actual = contexto;
    if (!actual?.esVigente() || ocupada) {
        return;
    }
    bloquear(true);
    aviso.textContent = "Guardando...";
    try {
        await operacion();
        if (actual.esVigente()) {
            await listarCierres(actual);
            if (actual.esVigente()) {
                aviso.textContent = "Cambios guardados.";
            }
        }
    }
    catch (error) {
        if (actual.esVigente()) {
            aviso.textContent = error instanceof Error ? error.message : "No se pudo guardar. Reintenta.";
        }
    }
    finally {
        if (actual.esVigente()) {
            bloquear(false);
        }
    }
}
formulario.addEventListener("submit", evento => {
    evento.preventDefault();
    const datos = { timezone: zona.value, days: leerDias() };
    void ejecutar(() => guardarHorario(datos), mensaje);
});
cierre.addEventListener("submit", evento => {
    evento.preventDefault();
    const fecha = document.querySelector<HTMLInputElement>("#closed-date")!.value;
    const closed = document.querySelector<HTMLInputElement>("#closed-state")!.checked;
    void ejecutar(() => cerrarDia(fecha, closed), mensajeCierre);
});
observarAreaAutorizada(["admin"], actual => {
    contexto = actual;
    void (async () => {
        try {
            const config = await obtenerConfiguracionAgenda();
            if (!actual.esVigente()) {
                return;
            }
            zona.value = config.timezone;
            dias.forEach((fila, i) => {
                fila.querySelector<HTMLInputElement>("[data-active]")!.checked = config.days[i].active;
                [0, 1].forEach(j => {
                    fila.querySelector<HTMLInputElement>('[data-start="' + j + '"]')!.value = config.days[i].ranges[j]?.start || "";
                    fila.querySelector<HTMLInputElement>('[data-end="' + j + '"]')!.value = config.days[i].ranges[j]?.end || "";
                });
            });
            await listarCierres(actual);
        }
        catch (error) {
            if (actual.esVigente()) {
                mensaje.textContent = error instanceof Error ? error.message : "No se pudo cargar el horario.";
            }
        }
        finally {
            if (actual.esVigente()) {
                bloquear(false);
            }
        }
    })();
}, () => {
    contexto = null;
    bloquear(true);
    formulario.reset();
    cierre.reset();
    mensaje.textContent = "";
    mensajeCierre.textContent = "";
    document.getElementById("closed-list")!.replaceChildren();
});
