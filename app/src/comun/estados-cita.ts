export function obtenerEtiquetaEstadoCliente(estado: string): string {
  if (estado === "confirmed") return "Confirmada";
  if (estado === "cancelled") return "Cancelada";
  if (estado === "done") return "Hecha";
  return "Historica (solo lectura): " + (estado || "sin estado");
}

