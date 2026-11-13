import { observarAreaProfesional } from "../../comun/permisos";
import { formatearFechaNegocio } from "../../comun/fechas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { obtenerCitasDia, obtenerCitasProfesional } from "../../datos/agenda";
import { obtenerProfesionales } from "../../datos/personas";
import { esperarEstadoSesion } from "../../datos/sesion";
import { obtenerDuracionEstadistica, contarServicios } from "./calculos";
import { mostrarCitasDelDia } from "../profesionales/tarjetas-citas";
const mensaje = document.getElementById("panel-msg")!;
const siguientes = document.getElementById("panel-next-list")!;
function limpiarResumen(): void {
    document.getElementById("stat-total-bookings")!.textContent = "0";
    document.getElementById("stat-total-min")!.textContent = "0 min";
    document.getElementById("stat-total-hours")!.textContent = "0 h";
    document.getElementById("stat-services")!.textContent = "Sin datos";
    siguientes.replaceChildren();
    mensaje.textContent = "";
}
observarAreaProfesional(async (contexto) => {
    mensaje.textContent = "Cargando datos del dia...";
    try {
        const configuracion = await obtenerConfiguracionAgenda();
        const hoy = formatearFechaNegocio(configuracion.timezone);
        const propio = contexto.usuario.rol === "worker";
        const [registros, equipo] = await Promise.all([propio ? obtenerCitasProfesional(contexto.usuario.uid, hoy) : obtenerCitasDia(hoy), obtenerProfesionales()]);
        await esperarEstadoSesion();
        if (!contexto.esVigente()) {
            return;
        }
        const citas = registros.filter((cita) => cita.status !== "cancelled" && cita.status !== "rescheduled");
        citas.sort((a, b) => String(a.timeStr || "00:00").localeCompare(String(b.timeStr || "00:00")));
        let minutos = 0;
        for (const cita of citas) {
            minutos += obtenerDuracionEstadistica(cita);
        }
        document.getElementById("stat-total-bookings")!.textContent = String(citas.length);
        document.getElementById("stat-total-min")!.textContent = minutos + " min";
        document.getElementById("stat-total-hours")!.textContent = (minutos / 60).toFixed(1) + " h";
        document.getElementById("stat-services")!.textContent = contarServicios(citas).slice(0, 3).map(([nombre, cantidad]) => nombre + ": " + cantidad).join("\n") || "Sin datos";
        mostrarCitasDelDia(siguientes, citas, hoy, propio, new Map(equipo.map((profesional) => [profesional.uid, profesional.name])));
        mensaje.textContent = "";
    }
    catch {
        await esperarEstadoSesion();
        if (contexto.esVigente()) {
            limpiarResumen();
            mensaje.textContent = "No se pudieron cargar los datos del dia. Actualiza la pagina.";
        }
    }
}, limpiarResumen);
