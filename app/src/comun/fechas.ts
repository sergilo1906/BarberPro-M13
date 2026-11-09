export function formatearFechaNegocio(zona: string, instante = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", { timeZone: zona, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instante);
  let anio = "";
  let mes = "";
  let dia = "";
  for (const parte of partes) {
    if (parte.type === "year") anio = parte.value;
    if (parte.type === "month") mes = parte.value;
    if (parte.type === "day") dia = parte.value;
  }
  return anio + "-" + mes + "-" + dia;
}

export function sumarDiasCalendario(fecha: string, dias: number): string {
  const instante = new Date(fecha + "T00:00:00Z");
  instante.setUTCDate(instante.getUTCDate() + dias);
  return instante.toISOString().slice(0, 10);
}
