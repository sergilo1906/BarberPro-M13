import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL("../", import.meta.url));
const requerir = createRequire(new URL("../app/package.json", import.meta.url));
const ts = requerir("typescript");
const carpeta = path.join(raiz, "docs/trazabilidad");
const originales = JSON.parse(fs.readFileSync(path.join(carpeta, "simbolos-originales.json"), "utf8"));
const resoluciones = JSON.parse(fs.readFileSync(path.join(carpeta, "resoluciones-funciones.json"), "utf8"));
const mapa = JSON.parse(fs.readFileSync(path.join(raiz, "docs/auditoria-final/correspondencias-archivos.json"), "utf8"));
const destinosPorOrigen = new Map(mapa.map((fila) => [fila.original, fila.destinos.map((destino) => destino.ruta)]));
const indices = new Map();
const errores = [];

function criterioArchivo(origen) {
  if (origen.endsWith(".astro")) return { area: "presentacion", decision: "Pagina/layout conservado; el controlador y los permisos se separan del marcado.", evidencia: ["docs/rutas-y-roles.md", "app/tests/e2e/comparacion-visual.test.ts", "docs/fase-10-comparacion-visual.md"] };
  if (origen.includes("-guard.") || origen.endsWith("guards.client.ts") || origen.endsWith("rbac.ts")) return { area: "permisos", decision: "Guards duplicados fusionados en matriz de rutas y contexto de sesion; autoridad efectiva tambien en reglas y backend.", evidencia: ["app/src/comun/permisos.ts", "app/tests/e2e/autenticacion.test.ts", "functions/tests/emuladores/permisos.test.mjs"] };
  if (/auth-flow|login\.client|registro\.client|verify\.client|perfil\.client|lib\/firebase/.test(origen)) return { area: "cuentas", decision: "Un observador de token/perfil sustituye listeners y caches repartidos; alta parcial, verificacion y errores se coordinan en servicios/controladores.", evidencia: ["app/src/datos/sesion.ts", "app/tests/e2e/autenticacion.test.ts", "app/tests/unit/sesion.test.ts"] };
  if (/navbar\.client|home-role\.client|index-admin\.client/.test(origen)) return { area: "navegacion", decision: "Menus y tarjeta inicial reaccionan a la sesion vigente; se fusiona home-role y se limpian respuestas/datos anteriores.", evidencia: ["app/src/modulos/navegacion/barra-navegacion.ts", "app/tests/e2e/acceso.test.ts", "app/tests/e2e/autenticacion.test.ts"] };
  if (/reservar\.client|mis-citas\.client|booking-core/.test(origen)) return { area: "reservas-cliente", decision: "Modelo de cita, fechas, estados, modal y llamadas se separan; locks, permisos y confirmacion pasan a transacciones autoritativas. Los locales de coordinacion cambian con esa separacion.", evidencia: ["app/tests/e2e/reservas.test.ts", "app/tests/e2e/cliente.test.ts", "functions/tests/emuladores/reservas-concurrencia.test.mjs"] };
  if (/agenda\.client|panel-barbero\.client|setup-barber\.client|bloqueos\.client/.test(origen)) return { area: "profesional", decision: "Tarjetas, formulario, calendario y datos se reutilizan; semanas/bloqueos usan backend con revision. Se retiran escrituras SDK y auxiliares duplicados.", evidencia: ["app/tests/e2e/personal.test.ts", "functions/tests/emuladores/profesional.test.mjs", "docs/fase-7-profesional-agenda.md"] };
  if (/admin-users\.client|equipo\.client|services\.client|branding\.client|horarios\.client/.test(origen)) return { area: "administracion", decision: "Consultas y tarjetas se separan; guardados pasan a callables autorizados y recuperables. Solo campos del contrato se guardan; borrado de servicios no se inventa.", evidencia: ["app/tests/e2e/administracion.test.ts", "functions/tests/emuladores/administracion.test.mjs", "docs/fase-8-administracion.md"] };
  if (/kpis\.client|export\.client|panel\.client/.test(origen)) return { area: "estadisticas-exportacion", decision: "Calculos y serializacion se separan del DOM. Se excluyen duplicados de historial y tiempo cancelado; el contexto/rango invalida datos antiguos.", evidencia: ["app/tests/unit/estadisticas.test.ts", "app/tests/e2e/restantes.test.ts", "docs/fase-9-funcionalidades-restantes.md"] };
  if (/lib\/csv|lib\/ics/.test(origen)) return { area: "formatos", decision: "CSV e ICS conservan sus contratos de descarga, con escape de texto, formulas y plegado UTF-8 corregidos.", evidencia: ["app/tests/unit/exportaciones.test.ts", "app/tests/unit/fechas.test.ts", "app/tests/e2e/restantes.test.ts"] };
  if (origen.endsWith("lib/ui.ts")) return { area: "modales-avisos", decision: "Creacion, estilo, temporizadores y resolucion se integran en mostrarAviso/abrirModal/pedirConfirmacion; no se fabrica una funcion por cada callback antiguo.", evidencia: ["app/src/comun/avisos.ts", "app/tests/e2e/cliente.test.ts", "app/tests/e2e/reservas.test.ts"] };
  if (origen.endsWith("lib/week.ts")) return { area: "calendario", decision: "Helpers locales del navegador sustituidos por dias de calendario UTC y zona de negocio explicita.", evidencia: ["app/src/comun/fechas.ts", "app/tests/unit/cliente.test.ts", "app/tests/unit/profesional.test.ts"] };
  if (origen === "functions/index.js") return { area: "backend", decision: "Los trece exports se conservan y se distribuyen por responsabilidad; seis operaciones nuevas sustituyen escrituras cliente. Se retiran autoservicio de roles, credenciales productivas y marcas de correo enviado ficticias.", evidencia: ["functions/index.js", "docs/auditoria-final/03-revision-funcional.md", "docs/auditoria-final/05-revision-seguridad.md"] };
  if (origen.startsWith("functions/scripts/")) return { area: "herramientas-roles", decision: "Herramientas limitadas a UID explicito, simulacion por defecto y emuladores. Se retiran carga de service account y migraciones productivas implicitas.", evidencia: ["functions/scripts/asignar-roles.mjs", "functions/scripts/normalizar-roles.mjs", "functions/src/permisos.js"] };
  if (origen.startsWith("functions/tests/")) return { area: "pruebas", decision: "El ensayo aislado de locks se sustituye por carreras de reservas reales en el emulador; runner fijo y fallos conservados, sin tolerar errores conocidos como exito.", evidencia: ["functions/tests/emuladores/reservas-concurrencia.test.mjs", "functions/tests/emuladores/ejecutar-pruebas.mjs", "docs/pruebas-finales.md"] };
  if (origen === "firestore.rules") return { area: "reglas", decision: "Roles/versiones vigentes y lecturas por propietario/gestion. Escrituras de negocio cerradas y realizadas en backend validado.", evidencia: ["firestore.rules", "functions/tests/emuladores/permisos.test.mjs"] };
  if (origen === "storage.rules") return { area: "storage", decision: "Regla de denegacion total; no habia un flujo de subida en las pantallas. Sus helpers y wildcards antiguos no se mantienen como capacidad de escritura.", evidencia: ["storage.rules", "docs/auditoria-final/05-revision-seguridad.md"] };
  if (origen.includes("config.")) return { area: "configuracion", decision: "Configuracion propia actualizada a Astro/Node/herramientas fijados; Playwright solo apunta al demo, sin modo de prueba productivo. Las claves de herramientas retiradas no son funcionalidades perdidas.", evidencia: [origen, "docs/decisiones-tecnicas.md", "docs/pruebas-finales.md"] };
  throw new Error("Falta criterio de archivo: " + origen);
}

function rutaPermitida(ruta) {
  const absoluta = path.resolve(raiz, ruta);
  return absoluta.startsWith(raiz) && !/(^|[\\/])(?:node_modules|\.git|\.verificacion|entrega|dist)([\\/]|$)/.test(ruta)
    && !/(^|[\\/])\.env(?:$|\.(?!example$))/.test(ruta);
}

function indexar(ruta) {
  if (indices.has(ruta)) return indices.get(ruta);
  if (!rutaPermitida(ruta) || !fs.existsSync(path.join(raiz, ruta))) return null;
  const texto = fs.readFileSync(path.join(raiz, ruta), "utf8");
  const indice = { ruta, sha256: createHash("sha256").update(texto).digest("hex"), declaraciones: [], referencias: [] };
  function analizar(fragmento, lineaBase = 0) {
    const arbol = ts.createSourceFile(ruta, fragmento, ts.ScriptTarget.Latest, true);
    function visitar(nodo, ambito = "modulo") {
      const linea = arbol.getLineAndCharacterOfPosition(nodo.getStart(arbol)).line + 1 + lineaBase;
      if (ts.isFunctionDeclaration(nodo) && nodo.name) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "funcion", linea, ambito });
        ambito = nodo.name.text;
      } else if (ts.isVariableDeclaration(nodo) && ts.isIdentifier(nodo.name)) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "variable", linea, ambito });
      } else if ((ts.isInterfaceDeclaration(nodo) || ts.isTypeAliasDeclaration(nodo)) && nodo.name) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "tipo", linea, ambito });
      } else if (ts.isParameter(nodo) && ts.isIdentifier(nodo.name)) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "parametro", linea, ambito });
      } else if (ts.isImportClause(nodo) && nodo.name) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "import", linea, ambito });
      } else if (ts.isImportSpecifier(nodo) || ts.isNamespaceImport(nodo)) {
        indice.declaraciones.push({ nombre: nodo.name.text, tipo: "import", linea, ambito });
      }
      if (ts.isIdentifier(nodo) || ts.isStringLiteral(nodo)) {
        indice.referencias.push({ nombre: nodo.text, tipo: ts.isStringLiteral(nodo) ? "literal" : "identificador", linea, ambito });
      }
      ts.forEachChild(nodo, (hijo) => visitar(hijo, ambito));
    }
    visitar(arbol);
  }
  if (ruta.endsWith(".astro")) {
    const cabecera = texto.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/) || texto.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (cabecera) analizar(cabecera[1], 1);
    for (const coincidencia of texto.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) {
      const inicio = coincidencia.index + coincidencia[0].indexOf(">") + 1;
      analizar(coincidencia[1], texto.slice(0, inicio).split("\n").length - 1);
    }
  } else if (/\.[cm]?[jt]s$/.test(ruta)) analizar(texto.replace(/^\uFEFF/, ""));
  else {
    for (const coincidencia of texto.matchAll(/\b[A-Za-z_$][\w$]*\b/g)) {
      indice.referencias.push({ nombre: coincidencia[0], tipo: "configuracion-reglas", linea: texto.slice(0, coincidencia.index).split("\n").length, ambito: "modulo" });
    }
  }
  indices.set(ruta, indice);
  return indice;
}

function referenciaModulo(ruta) {
  const indice = indexar(ruta);
  return indice ? { ruta, linea: 1, nombre: "modulo", tipo: "modulo", sha256: indice.sha256 } : null;
}

function buscarEnRutas(rutas, nombres, declaraciones = true) {
  const resultado = [];
  for (const ruta of rutas) {
    const indice = indexar(ruta);
    if (!indice) continue;
    for (const entrada of declaraciones ? indice.declaraciones : indice.referencias) {
      if (nombres.includes(entrada.nombre)) resultado.push({ ruta, ...entrada, sha256: indice.sha256 });
    }
  }
  return resultado;
}

function resolverManual(registro) {
  const manual = resoluciones[registro.id];
  if (!manual) return null;
  const referencia = manual.anchor === "@modulo" ? referenciaModulo(manual.file)
    : buscarEnRutas([manual.file], [manual.anchor])[0];
  if (!referencia) errores.push("Ancla manual inexistente: " + registro.id + " " + manual.file + " " + manual.anchor);
  return { nivel: "DECISION_MANUAL", decision: manual.decision, motivo: manual.reason, referencias: referencia ? [referencia] : [] };
}

const funcionesResueltas = new Map();
for (const registro of originales.filter((fila) => fila.kind === "funcion")) {
  let resolucion = resolverManual(registro);
  if (!resolucion) {
    const rutas = [...new Set([...(destinosPorOrigen.get(registro.source) || []), ...registro.planned])];
    const referencias = buscarEnRutas(rutas, [registro.proposed, registro.name]);
    if (referencias.length) resolucion = {
      nivel: "DECLARACION_LOCALIZADA", decision: "conservado-o-renombrado",
      motivo: "Declaracion actual en un destino del mismo original; la coincidencia no demuestra por si sola igualdad de comportamiento.",
      referencias: referencias.slice(0, 6),
    };
    else errores.push("Funcion sin resolucion: " + registro.id + " " + registro.name);
  }
  funcionesResueltas.set(registro.source + "\0" + registro.name, resolucion);
}

const resultado = [];
for (const registro of originales) {
  const rutas = [...new Set([...(destinosPorOrigen.get(registro.source) || []), ...registro.planned])].filter(rutaPermitida).filter((ruta) => fs.existsSync(path.join(raiz, ruta)));
  let resolucion = resolverManual(registro);
  if (!resolucion && registro.kind === "funcion") resolucion = funcionesResueltas.get(registro.source + "\0" + registro.name);
  if (!resolucion) {
    const referencias = buscarEnRutas(rutas, [registro.proposed, registro.name]);
    if (referencias.length) resolucion = {
      nivel: "DECLARACION_LOCALIZADA", decision: "referencia-estructural",
      motivo: "Se localiza un nombre declarado. No se afirma una biyeccion entre variables de implementaciones distintas.", referencias: referencias.slice(0, 6),
    };
  }
  if (!resolucion && /propiedad|ruta match|parametro de regla/.test(registro.kind)) {
    const referencias = buscarEnRutas(rutas, [registro.proposed, registro.name], false);
    if (referencias.length) resolucion = {
      nivel: "CONTRATO_REFERENCIADO", decision: "clave-o-regla-localizada",
      motivo: "Campo, literal o identificador presente en los destinos actuales; permisos/efectos se revisan por operacion.", referencias: referencias.slice(0, 6),
    };
  }
  if (!resolucion) {
    const nombresAmbito = registro.scope.split("/").map((ambito) => ambito.replace(/@\d+.*$/, "")).reverse();
    const contenedor = nombresAmbito.map((nombre) => funcionesResueltas.get(registro.source + "\0" + nombre)).find(Boolean);
    if (contenedor) resolucion = {
      nivel: "AMBITO_REESTRUCTURADO", decision: "local-integrado-en-contenedor",
      motivo: "El local/callback pertenece al contenedor original resuelto. Sus nombres y numero pueden cambiar al separar responsabilidades; no se certifica equivalencia individual por esta herencia.",
      referencias: contenedor.referencias,
    };
  }
  if (!resolucion) {
    const referencias = rutas.map(referenciaModulo).filter(Boolean);
    resolucion = {
      nivel: "AMBITO_REESTRUCTURADO", decision: registro.source === "storage.rules" ? "politica-cerrada" : "local-o-importacion-sustituido-en-modulo",
      motivo: registro.source === "storage.rules"
        ? "Storage permanece cerrado; no existe flujo de subida en las 27 pantallas originales. Se retiran variables/helpers de una escritura que no se habilita."
        : "Decision de arquitectura del archivo original: coordinacion, SDK, validacion o prueba pasan a los destinos indicados. No se inventa una variable homonima ni se conserva codigo inseguro para forzar una correspondencia uno a uno.",
      referencias: referencias.slice(0, 6),
    };
  }
  if (!resolucion.referencias.length) errores.push("Registro sin destino real: " + registro.id);
  const criterio = criterioArchivo(registro.source);
  for (const evidencia of criterio.evidencia) if (!fs.existsSync(path.join(raiz, evidencia))) errores.push("Evidencia inexistente: " + evidencia);
  resultado.push({ ...registro, ...resolucion, criterioArchivo: criterio });
}

if (originales.length !== 3122 || new Set(originales.map((registro) => registro.id)).size !== 3122) errores.push("Entrada original incompleta o duplicada");
if (errores.length) {
  console.error(JSON.stringify({ errores }, null, 2));
  process.exitCode = 1;
} else {
  const niveles = {};
  for (const registro of resultado) niveles[registro.nivel] = (niveles[registro.nivel] || 0) + 1;
  const resumen = { registros: resultado.length, funcionesConNombreEnPlan: originales.filter((registro) => registro.kind === "funcion").length,
    resolucionesManuales: Object.keys(resoluciones).length, bindings: originales.filter((registro) => registro.kind === "binding importado").length,
    archivosOriginalesRepresentados: new Set(originales.map((registro) => registro.source)).size, niveles,
    sinDestino: 0, limite: "Trazabilidad estructural y decisiones de reestructuracion, no prueba formal ni cobertura de ejecucion individual de cada simbolo." };
  fs.writeFileSync(path.join(carpeta, "simbolos-actuales.json"), JSON.stringify({ resumen, registros: resultado }, null, 2) + "\n");
  const escapar = (valor) => String(valor).replaceAll("|", "&#124;").replaceAll("\n", " ");
  const filas = resultado.map((registro) => "| " + [registro.id, registro.source + ":" + registro.line, registro.scope, registro.name,
    registro.proposed, registro.nivel, registro.decision, registro.referencias.map((referencia) => referencia.ruta + ":" + referencia.linea + " (" + referencia.nombre + ")").join("; ")].map(escapar).join(" | ") + " |");
  const tablaNiveles = Object.entries(niveles).map(([nivel, cantidad]) => "| " + nivel + " | " + cantidad + " |").join("\n");
  fs.writeFileSync(path.join(carpeta, "simbolos-actuales.md"), "# Trazabilidad de los 3.122 registros originales\n\n"
    + "Se identifican todos los registros S/R y los 295 bindings I. Las propuestas de planificacion se distinguen de nombres actuales. Cada fila tiene una ubicacion o decision explicita; no declara equivalencia semantica individual ni ejecucion de cada variable.\n\n"
    + "DECLARACION_LOCALIZADA y CONTRATO_REFERENCIADO son evidencia estructural. DECISION_MANUAL documenta funciones renombradas, fusionadas o retiradas. AMBITO_REESTRUCTURADO enlaza el contenedor/modulo responsable, no una declaracion ficticia. Los hashes y motivos por fila estan en simbolos-actuales.json.\n\n"
    + "Reproducir desde la raiz con `node scripts/trazar-simbolos.mjs`, tras instalar app. No necesita el original ni la planificacion externos. La entrada guarda solo metadatos de nombres/posiciones, sin credenciales ni codigo original.\n\n"
    + "| Nivel | Registros |\n| --- | ---: |\n" + tablaNiveles + "\n\n"
    + "| ID | Original | Ambito original | Nombre original | Propuesta historica | Evidencia | Decision | Destino actual y linea |\n"
    + "| --- | --- | --- | --- | --- | --- | --- | --- |\n" + filas.join("\n") + "\n");
  console.log(JSON.stringify(resumen, null, 2));
}
