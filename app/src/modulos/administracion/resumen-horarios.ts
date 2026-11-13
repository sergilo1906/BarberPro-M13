import { observarAreaAutorizada } from "../../comun/permisos";
import { obtenerProfesionales } from "../../datos/personas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { esperarEstadoSesion } from "../../datos/sesion";
import { formatearFechaNegocio, obtenerLunesSemana } from "../../comun/fechas";
import { clasesEstadoOperativo, obtenerEstadoOperativo } from "./tarjeta-usuario";
const lista = document.getElementById("hours-list")!;
const mensaje = document.getElementById("hours-msg")!;
observarAreaAutorizada(["manager", "admin"], async (contexto) => {
    mensaje.textContent = "Cargando resumen semanal...";
    try {
        const [equipo, configuracion] = await Promise.all([obtenerProfesionales(true), obtenerConfiguracionAgenda()]);
        equipo.sort((primero, segundo) => {
            if (primero.uid < segundo.uid) {
                return -1;
            }
            if (primero.uid > segundo.uid) {
                return 1;
            }
            return 0;
        });
        const semana = obtenerLunesSemana(formatearFechaNegocio(configuracion.timezone));
        const tarjetas: HTMLElement[] = [];
        for (const profesional of equipo) {
            const estado = await obtenerEstadoOperativo(profesional.uid, "worker", semana);
            const tarjeta = document.createElement("article");
            tarjeta.className = "rounded-lg border border-gray-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3";
            tarjeta.innerHTML = '<div><h3 class="font-semibold text-gray-900"></h3><p class="text-sm text-gray-600"></p></div><div class="flex flex-wrap items-center gap-3"><span class="rounded-full border px-3 py-1 text-xs font-medium"></span><a class="text-sm text-blue-700 underline">Abrir horarios</a></div>';
            tarjeta.querySelector("h3")!.textContent = profesional.name;
            tarjeta.querySelector("p")!.textContent = "Semana " + semana;
            const etiqueta = tarjeta.querySelector("span")!;
            etiqueta.className += " " + clasesEstadoOperativo(estado.tono);
            etiqueta.textContent = estado.resumen;
            tarjeta.querySelector("a")!.href = "/setup-barber?barberUid=" + encodeURIComponent(profesional.uid);
            tarjetas.push(tarjeta);
        }
        await esperarEstadoSesion();
        if (!contexto.esVigente()) {
            return;
        }
        lista.replaceChildren(...tarjetas);
        mensaje.textContent = "Resumen cargado para la semana " + semana + ".";
        if (!tarjetas.length) {
            lista.innerHTML = '<div class="rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">No hay profesionales activos para revisar.</div>';
            mensaje.textContent = "Sin profesionales activos.";
        }
    }
    catch {
        await esperarEstadoSesion();
        if (contexto.esVigente()) {
            mensaje.textContent = "No se pudo cargar el resumen.";
        }
    }
}, () => {
    lista.replaceChildren();
    mensaje.textContent = "";
});
