import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const publico = fileURLToPath(new URL("../../dist/", import.meta.url));
const tipos = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" };
createServer(async (peticion, respuesta) => {
  try {
    if (!["GET", "HEAD"].includes(peticion.method)) { respuesta.writeHead(405).end(); return; }
    const url = new URL(peticion.url || "/", "http://127.0.0.1");
    const ruta = decodeURIComponent(url.pathname);
    let archivo = path.resolve(publico, "." + ruta);
    const relativa = path.relative(publico, archivo);
    if (relativa.startsWith("..") || path.isAbsolute(relativa)) { respuesta.writeHead(403).end(); return; }
    let estado = 200;
    try {
      if ((await stat(archivo)).isDirectory()) archivo = path.join(archivo, "index.html");
      await stat(archivo);
    } catch {
      archivo = path.join(publico, "404.html");
      if (ruta !== "/404") estado = 404;
    }
    const contenido = await readFile(archivo);
    respuesta.setHeader("Content-Type", tipos[path.extname(archivo)] || "application/octet-stream");
    respuesta.setHeader("Cache-Control", "no-store");
    respuesta.setHeader("X-Content-Type-Options", "nosniff");
    respuesta.statusCode = estado;
    respuesta.end(peticion.method === "HEAD" ? undefined : contenido);
  } catch { respuesta.writeHead(400).end(); }
}).listen(Number(process.argv[2] || "4331"), "127.0.0.1");
