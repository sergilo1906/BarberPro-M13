export function escaparCeldaCsv(valor: unknown): string {
  let texto = String(valor ?? "");
  // Las comillas CSV no impiden que una hoja de cálculo ejecute fórmulas.
  // Solo el texto controlable recibe el prefijo; los números siguen siendo números.
  if (typeof valor === "string" && (/^\s*[=+\-@]/u.test(texto) || /^[\t\r]/.test(texto))) texto = "'" + texto;
  if (/[",\r\n]/.test(texto)) return '"' + texto.replace(/"/g, '""') + '"';
  return texto;
}
export function convertirACsv(filas: Record<string, unknown>[]): string {
  if (!filas.length) return "";
  const cabeceras = Object.keys(filas[0]), lineas = [cabeceras.map(escaparCeldaCsv).join(",")];
  for (const fila of filas) lineas.push(cabeceras.map((campo) => escaparCeldaCsv(fila[campo])).join(","));
  return lineas.join("\r\n");
}
