import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const puerto = Number(process.argv[2] || "4331");
const indiceReferencia = process.argv.indexOf("--referencia");
const esReferencia = indiceReferencia !== -1;
const carpetaPublica = esReferencia
  ? path.resolve(process.argv[indiceReferencia + 1])
  : fileURLToPath(new URL("../../dist/", import.meta.url));
const rutasReferencia = new Set(["/", "/index-client", "/ayuda", "/legal", "/planes", "/404", "/login", "/registro", "/verify", "/perfil", "/reservar", "/mis-citas", "/agenda", "/panel-barbero", "/setup-barber", "/bloqueos", "/admin", "/admin/usuarios", "/index-admin", "/equipo", "/servicios", "/branding", "/horarios"]);
const tiposContenido = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };

function prepararReferenciaPublica(html) {
  // Leer la compilación original no debe ejecutar su SDK ni sus scripts.
  let documento = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  documento = documento.replace(/(<form\b[^>]*class=")([^"]*)(")/gi, (_etiqueta, inicio, clases, final) => {
    return inicio + clases.replace(/\b(opacity-50|pointer-events-none)\b/g, "").replace(/\s+/g, " ").trim() + final;
  });
  documento = documento.replace(/<a\b[^>]*>/gi, (etiqueta) => {
    if (/id="(?:btn-login|btn-register)"/.test(etiqueta)) {
      return etiqueta.replace(/class="([^"]*)"/, (_atributo, clases) => 'class="' + clases.replace(/\bhidden\b/g, "").trim() + '"');
    }
    if (/id="link-citas"/.test(etiqueta)) {
      return etiqueta.replace(/class="([^"]*)"/, 'class="$1 hidden"');
    }
    return etiqueta;
  });
  return documento;
}

const servidor = createServer(async (peticion, respuestaHttp) => {
  try {
    if (peticion.method !== "GET" && peticion.method !== "HEAD") {
      respuestaHttp.writeHead(405).end();
      return;
    }
    const url = new URL(peticion.url || "/", "http://127.0.0.1");
    const rutaSolicitada = decodeURIComponent(url.pathname);
    const rutaNormalizada = rutaSolicitada.replace(/\/$/, "") || "/";
    if (esReferencia && !rutasReferencia.has(rutaNormalizada) && rutaNormalizada !== "/favicon.svg" && !/^\/_astro\/[^/]+\.css$/.test(rutaNormalizada)) {
      respuestaHttp.writeHead(404).end();
      return;
    }

    let archivo = path.resolve(carpetaPublica, "." + rutaSolicitada);
    const relativa = path.relative(carpetaPublica, archivo);
    if (relativa.startsWith("..") || path.isAbsolute(relativa)) {
      respuestaHttp.writeHead(403).end();
      return;
    }
    let estadoHttp = 200;
    try {
      const informacion = await stat(archivo);
      if (informacion.isDirectory()) archivo = path.join(archivo, "index.html");
      await stat(archivo);
    } catch {
      if (rutaNormalizada === "/404") {
        archivo = path.join(carpetaPublica, "404.html");
      } else {
        archivo = path.join(carpetaPublica, "404.html");
        estadoHttp = 404;
      }
    }
    const extension = path.extname(archivo);
    let contenido = await readFile(archivo);
    if (esReferencia && extension === ".html") {
      contenido = Buffer.from(prepararReferenciaPublica(contenido.toString("utf8")));
    }

    respuestaHttp.setHeader("Content-Type", tiposContenido[extension] || "application/octet-stream");
    respuestaHttp.setHeader("Cache-Control", "no-store");
    respuestaHttp.setHeader("X-Content-Type-Options", "nosniff");
    if (esReferencia) {
      respuestaHttp.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; script-src 'none'; connect-src 'none'");
    }
    respuestaHttp.statusCode = estadoHttp;
    respuestaHttp.end(peticion.method === "HEAD" ? undefined : contenido);
  } catch {
    respuestaHttp.writeHead(400).end();
  }
});

servidor.listen(puerto, "127.0.0.1", () => {
  console.log("Servidor " + (esReferencia ? "de referencia" : "local") + " en http://127.0.0.1:" + puerto + " — Node " + process.version);
});
