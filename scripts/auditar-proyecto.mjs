import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// Inventario reproducible. El análisis sintáctico no certifica corrección semántica.
const raiz = fileURLToPath(new URL("../", import.meta.url));
if (!fs.existsSync(path.join(raiz, ".git"))) throw new Error("El inventario requiere el checkout Git de BarberPro-M13; no debe usar el repositorio de una carpeta antecesora.");
const requerir = createRequire(new URL("../app/package.json", import.meta.url));
const ts = requerir("typescript");
const carpetaInforme = path.join(raiz, "docs/auditoria-final");
fs.mkdirSync(carpetaInforme, { recursive: true });
const exclusiones = new Set(["docs/auditoria-final/inventario.json", "docs/auditoria-final/inventario-archivos.md"]);
const rutas = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: raiz, stdio: ["ignore", "pipe", "pipe"] }).toString().split("\0").filter((ruta) => ruta && !exclusiones.has(ruta));
const archivos = [];
const enlaces = [];
const erroresImportacion = [];
function resolver(origen, destino) {
  const base = path.resolve(raiz, path.dirname(origen), destino);
  for (const candidato of [base, base + ".ts", base + ".js", base + ".mjs", base + ".astro", base + ".json", path.join(base, "index.ts"), path.join(base, "index.js")]) {
    if (fs.existsSync(candidato) && fs.statSync(candidato).isFile()) return path.relative(raiz, candidato).replaceAll("\\", "/");
  }
  return null;
}
function categoria(ruta) {
  if (ruta.startsWith("docs/") || ruta.endsWith(".md")) return "documentacion";
  if (ruta.includes("/tests/")) return "pruebas";
  if (ruta.includes("/pages/")) return "pagina";
  if (ruta.includes("/components/") || ruta.includes("/layouts/")) return "componente";
  if (ruta.includes("/src/")) return "codigo";
  if (ruta.includes("/scripts/") || ruta.startsWith("scripts/")) return "herramienta";
  if (/\.svg$/.test(ruta)) return "recurso";
  return "configuracion";
}
for (const ruta of [...new Set(rutas)].sort()) {
  if (!fs.existsSync(path.join(raiz, ruta))) continue;
  const contenido = fs.readFileSync(path.join(raiz, ruta));
  const texto = contenido.toString("utf8");
  const registro = { ruta, categoria: categoria(ruta), bytes: contenido.length, lineas: texto.split(/\r?\n/).length, sha256: createHash("sha256").update(contenido).digest("hex"), simbolos: [], imports: [], exports: [], ids: [], eventos: [], erroresSintaxis: [] };
  // Los lockfiles se parsean como JSON; sus bibliotecas de terceros no se revisan una por una.
  if (ruta.endsWith(".json")) { try { JSON.parse(texto); } catch { registro.erroresSintaxis.push("JSON no valido"); } }
  let codigo = texto;
  if (ruta.endsWith(".astro")) codigo = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] || "";
  if (/\.(?:[cm]?js|tsx?|astro)$/.test(ruta)) {
    const fuente = ts.createSourceFile(ruta + (ruta.endsWith(".astro") ? ".ts" : ""), codigo, ts.ScriptTarget.Latest, true);
    for (const error of fuente.parseDiagnostics) registro.erroresSintaxis.push(ts.flattenDiagnosticMessageText(error.messageText, " "));
    function visitar(nodo) {
      let tipo;
      if (ts.isVariableDeclaration(nodo)) tipo = nodo.parent.flags & ts.NodeFlags.Const ? "constante" : "variable";
      else if (ts.isParameter(nodo)) tipo = "parametro";
      else if (ts.isFunctionDeclaration(nodo)) tipo = "funcion";
      else if (ts.isArrowFunction(nodo)) tipo = "funcion flecha";
      else if (ts.isFunctionExpression(nodo)) tipo = "funcion expresion";
      else if (ts.isMethodDeclaration(nodo)) tipo = "metodo";
      else if (ts.isClassDeclaration(nodo)) tipo = "clase";
      else if (ts.isInterfaceDeclaration(nodo)) tipo = "interfaz";
      else if (ts.isTypeAliasDeclaration(nodo)) tipo = "tipo";
      if (tipo) registro.simbolos.push({ tipo, nombre: nodo.name?.getText(fuente) || "anonimo", linea: fuente.getLineAndCharacterOfPosition(nodo.getStart()).line + 1 + (ruta.endsWith(".astro") ? 1 : 0), lineas: fuente.getLineAndCharacterOfPosition(nodo.end).line - fuente.getLineAndCharacterOfPosition(nodo.getStart()).line + 1 });
      if ((ts.isImportDeclaration(nodo) || ts.isExportDeclaration(nodo)) && nodo.moduleSpecifier && ts.isStringLiteral(nodo.moduleSpecifier)) registro.imports.push(nodo.moduleSpecifier.text);
      if (ts.isExportDeclaration(nodo) && nodo.exportClause && ts.isNamedExports(nodo.exportClause)) for (const elemento of nodo.exportClause.elements) registro.exports.push(elemento.name.text);
      if (nodo.modifiers?.some((modificador) => modificador.kind === ts.SyntaxKind.ExportKeyword) && nodo.name) registro.exports.push(nodo.name.getText(fuente));
      ts.forEachChild(nodo, visitar);
    }
    visitar(fuente);
    // Incluye imports de los scripts Astro que no están en el frontmatter.
    for (const coincidencia of texto.matchAll(/\b(?:import|export)\s+(?:[^;\n]*?\s+from\s+)?["'](\.[^"']+)["']/g)) registro.imports.push(coincidencia[1]);
    registro.imports = [...new Set(registro.imports)];
    for (const destino of registro.imports.filter((nombre) => nombre.startsWith("."))) {
      const resuelto = resolver(ruta, destino);
      enlaces.push({ origen: ruta, importacion: destino, destino: resuelto });
      if (!resuelto) erroresImportacion.push({ origen: ruta, importacion: destino });
    }
  }
  registro.ids = [...new Set([...texto.matchAll(/\bid=["']([^"']+)["']/g)].map((valor) => valor[1]))];
  registro.eventos = [...new Set([...texto.matchAll(/addEventListener\(["']([^"']+)["']/g)].map((valor) => valor[1]))];
  archivos.push(registro);
}
const ciclos = [];
const grafo = new Map(archivos.map((archivo) => [archivo.ruta, enlaces.filter((enlace) => enlace.origen === archivo.ruta && enlace.destino).map((enlace) => enlace.destino)]));
const visitados = new Set();
function recorrer(ruta, recorrido = []) {
  if (recorrido.includes(ruta)) { ciclos.push([...recorrido.slice(recorrido.indexOf(ruta)), ruta]); return; }
  if (visitados.has(ruta)) return;
  for (const destino of grafo.get(ruta) || []) recorrer(destino, [...recorrido, ruta]);
  visitados.add(ruta);
}
for (const ruta of grafo.keys()) recorrer(ruta);
const resumen = { archivos: archivos.length, paginas: archivos.filter((archivo) => archivo.categoria === "pagina").length, enlacesLocales: enlaces.length, importsSinResolver: erroresImportacion, ciclos, erroresSintaxis: archivos.filter((archivo) => archivo.erroresSintaxis.length).map((archivo) => ({ ruta: archivo.ruta, errores: archivo.erroresSintaxis })), categorias: {}, simbolos: {} };
for (const archivo of archivos) { resumen.categorias[archivo.categoria] = (resumen.categorias[archivo.categoria] || 0) + 1; for (const simbolo of archivo.simbolos) resumen.simbolos[simbolo.tipo] = (resumen.simbolos[simbolo.tipo] || 0) + 1; }
// Evita autorreferencia de hashes: no incluye los informes generados por esta ejecución.
const resultado = { limites: "AST de JS/TS y frontmatter Astro; scripts Astro, plantillas, estilos y contratos requieren contraste funcional/manual. No es cobertura semantica ni de tests.", resumen, archivos: archivos.filter((archivo) => !exclusiones.has(archivo.ruta)), enlaces };
fs.writeFileSync(path.join(carpetaInforme, "inventario.json"), JSON.stringify(resultado, null, 2) + "\n");
const filas = resultado.archivos.map((archivo) => "| " + archivo.ruta + " | " + archivo.categoria + " | " + archivo.lineas + " | " + archivo.simbolos.length + " | " + archivo.imports.length + " | " + (archivo.erroresSintaxis.length ? "REVISAR" : "Sin errores de parseo detectados") + " |");
fs.writeFileSync(path.join(carpetaInforme, "inventario-archivos.md"), "# Inventario automatizado de archivos\n\nRegistro por archivo; no equivale a revision semantica completa. Los dos informes generados se excluyen de su propio inventario. Los lockfiles se parsean como JSON.\n\n| Archivo | Categoria | Lineas | Declaraciones AST | Imports | Analisis limitado |\n|---|---|---:|---:|---:|---|\n" + filas.join("\n") + "\n");
console.log(JSON.stringify(resumen, null, 2));
