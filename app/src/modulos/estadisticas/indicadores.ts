import { observarAreaAutorizada, type ContextoProfesional } from "../../comun/permisos";
import { obtenerRangoPeriodo } from "../../comun/fechas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { obtenerCitasPeriodo } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { calcularIndicadores, contarServicios, contarProfesionales } from "./calculos";
import type { Cita } from "../../modelos/agenda";
const periodo = document.querySelector<HTMLSelectElement>("#kpi-range")!;
const recargar = document.querySelector<HTMLButtonElement>("#kpi-refresh")!;
const mensaje = document.getElementById("kpi-msg")!;
const tarjetas = document.getElementById("kpi-cards")!;
const servicios = document.getElementById("kpi-services")!;
const equipo = document.getElementById("kpi-staff")!;
let contexto: ContextoProfesional | null = null;
let revision = 0;
function mostrarIndicadores(citas: Cita[]): void {
    const resumen = calcularIndicadores(citas);
    const valores = [["Citas", String(resumen.total)], ["Confirmadas", String(resumen.confirmadas)], ["Hechas", String(resumen.hechas)], ["Canceladas o ausencias", String(resumen.incidencias)], ["Tiempo reservado", resumen.minutos + " min"], ["Horas reservadas", (resumen.minutos / 60).toFixed(1) + " h"]];
    tarjetas.replaceChildren();
    for (const [titulo, valor] of valores) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "rounded border border-gray-200 bg-gray-50 p-4";
        tarjeta.innerHTML = '<p class="text-[11px] uppercase tracking-wide text-gray-500"></p><p class="mt-2 text-2xl font-semibold text-gray-900"></p>';
        tarjeta.children[0].textContent = titulo;
        tarjeta.children[1].textContent = valor;
        tarjetas.append(tarjeta);
    }
}
function mostrarClasificacion(contenedor: HTMLElement, filas: [
    string,
    number
][]): void {
    contenedor.replaceChildren();
    for (const [nombre, cantidad] of filas) {
        const fila = document.createElement("div");
        fila.className = "flex items-center justify-between rounded border border-gray-200 px-3 py-2";
        const texto = document.createElement("span");
        const numero = document.createElement("span");
        texto.textContent = nombre;
        numero.className = "font-medium text-gray-900";
        numero.textContent = String(cantidad);
        fila.append(texto, numero);
        contenedor.append(fila);
    }
    if (!filas.length) {
        contenedor.innerHTML = '<p class="text-sm text-gray-600">Sin datos para este periodo.</p>';
    }
}
async function cargarIndicadores(): Promise<void> {
    const actual = contexto;
    const consulta = ++revision;
    const seleccion = periodo.value;
    if (!actual?.esVigente()) {
        return;
    }
    recargar.disabled = true;
    mensaje.textContent = "Cargando...";
    tarjetas.replaceChildren();
    servicios.replaceChildren();
    equipo.replaceChildren();
    try {
        const configuracion = await obtenerConfiguracionAgenda();
        const rango = obtenerRangoPeriodo(seleccion, configuracion.timezone);
        const [citas, profesionales] = await Promise.all([obtenerCitasPeriodo(rango.desde, rango.hasta), obtenerProfesionales(true)]);
        await esperarEstadoSesion();
        if (!actual.esVigente() || consulta !== revision) {
            return;
        }
        mostrarIndicadores(citas);
        mostrarClasificacion(servicios, contarServicios(citas).slice(0, 5));
        mostrarClasificacion(equipo, contarProfesionales(citas, new Map(profesionales.map((profesional) => [profesional.uid, profesional.name]))));
        mensaje.textContent = citas.length ? "Periodo: " + rango.desde + " a " + rango.hasta + "." : "No hay citas en ese periodo.";
    }
    catch {
        await esperarEstadoSesion();
        if (actual.esVigente() && consulta === revision) {
            mensaje.textContent = "No se pudieron cargar los indicadores. Pulsa Recargar para reintentarlo.";
        }
    }
    finally {
        if (contexto === actual && consulta === revision) {
            recargar.disabled = false;
        }
    }
}
recargar.addEventListener("click", () => {
    void cargarIndicadores();
});
periodo.addEventListener("change", () => {
    void cargarIndicadores();
});
observarAreaAutorizada(["manager", "admin"], (actual) => {
    contexto = actual;
    void cargarIndicadores();
}, () => {
    contexto = null;
    revision++;
    tarjetas.replaceChildren();
    servicios.replaceChildren();
    equipo.replaceChildren();
    mensaje.textContent = "";
    recargar.disabled = true;
});
