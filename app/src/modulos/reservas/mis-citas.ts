import { observarAreaAutorizada, type ContextoAutorizado } from "../../comun/permisos";
import { obtenerCitasUsuario, obtenerCitasDia } from "../../datos/agenda";
import { cancelarReserva, completarReserva } from "../../datos/funciones-remotas";
import { obtenerConfiguracionAgenda } from "../../datos/configuracion";
import { formatearFechaNegocio, obtenerInicioCita } from "../../comun/fechas";
import { obtenerEtiquetaEstadoCliente } from "../../comun/estados-cita";
import type { Cita } from "../../modelos/agenda";

// Mis citas y Agenda comparten solo la presentacion y las acciones basicas.
export function iniciarListado(administrador: boolean): void {
  const lista = document.getElementById(administrador ? "agenda-list" : "my-list")!;
  const mensaje = document.getElementById(administrador ? "agenda-msg" : "my-msg")!;
  const fecha = document.querySelector<HTMLInputElement>(administrador ? "#agenda-date" : "#filter-date")!;
  const estado = document.querySelector<HTMLSelectElement>(administrador ? "#agenda-status" : "#filter-status")!;
  let contexto: ContextoAutorizado | null = null;
  let zona = "Europe/Madrid";
  let revision = 0;
  let citas: Cita[] = [];
  let procesando = false;
  function pintar() {
    lista.replaceChildren();
    const visibles = citas.filter(cita => (!fecha.value || cita.dateStr === fecha.value) && (estado.value === "all" || cita.status === estado.value));
    mensaje.textContent = visibles.length ? "" : "No hay citas con estos filtros.";
    for (const cita of visibles) {
      const tarjeta = document.createElement("article"); tarjeta.className = "p-3 space-y-2"; tarjeta.dataset.bookingId = cita.id;
      const titulo = document.createElement("h3"); titulo.className = "font-semibold";
      titulo.textContent = cita.dateStr + " · " + cita.timeStr + " · " + (cita.serviceSnapshot?.name || "Servicio historico");
      const datos = document.createElement("p");
      datos.textContent = obtenerEtiquetaEstadoCliente(cita.status) + " · " + cita.durationMin + " min · " + (cita.serviceSnapshot?.price ?? "—") + " EUR";
      tarjeta.append(titulo, datos);
      if (administrador) { const cliente = document.createElement("p"); cliente.textContent = [cita.userName, cita.userEmail, cita.userPhone].filter(Boolean).join(" · "); tarjeta.append(cliente); }
      if (cita.status === "confirmed") {
        if (administrador) accion("Marcar hecha", () => completarReserva(cita.id));
        if (administrador || obtenerInicioCita(cita, zona).getTime() > Date.now()) accion("Cancelar cita", () => cancelarReserva(cita.id));
      }
      function accion(texto: string, ejecutar: () => Promise<unknown>) {
        const boton = document.createElement("button"); boton.type = "button"; boton.textContent = texto;
        boton.className = "border rounded px-3 py-2 mr-2"; boton.disabled = procesando;
        boton.addEventListener("click", async () => {
          const actual = contexto;
          if (!actual?.esVigente() || procesando || !window.confirm(texto + "?")) return;
          procesando = true; pintar();
          try { await ejecutar(); if (actual.esVigente()) await cargar(); }
          catch (error) { if (actual.esVigente()) mensaje.textContent = error instanceof Error ? error.message : "No se pudo guardar el cambio."; }
          finally { if (actual.esVigente()) { procesando = false; lista.querySelectorAll("button").forEach(b => { b.disabled = false; }); } }
        });
        tarjeta.append(boton);
      }
      lista.append(tarjeta);
    }
  }
  async function cargar() {
    const actual = contexto; const consulta = ++revision;
    if (!actual?.esVigente()) return;
    mensaje.textContent = "Cargando citas..."; lista.replaceChildren();
    try {
      const resultado = administrador ? await obtenerCitasDia(fecha.value) : await obtenerCitasUsuario(actual.usuario.uid);
      if (!actual.esVigente() || consulta !== revision) return;
      citas = resultado; pintar();
    } catch (error) { if (actual.esVigente() && consulta === revision) mensaje.textContent = error instanceof Error ? error.message : "No se pudieron cargar las citas."; }
  }
  fecha.addEventListener("change", () => { if (administrador) void cargar(); else pintar(); }); estado.addEventListener("change", pintar);
  observarAreaAutorizada(administrador ? ["admin"] : ["client", "admin"], actual => {
    contexto = actual;
    void (async () => {
      try {
        const config = await obtenerConfiguracionAgenda(); if (!actual.esVigente()) return;
        zona = config.timezone; if (administrador) fecha.value = formatearFechaNegocio(zona); await cargar();
      } catch (error) { if (actual.esVigente()) mensaje.textContent = error instanceof Error ? error.message : "No se pudo leer el horario."; }
    })();
  }, () => { revision++; contexto = null; citas = []; procesando = false; lista.replaceChildren(); mensaje.textContent = ""; });
}
if (document.getElementById("my-list")) iniciarListado(false);

