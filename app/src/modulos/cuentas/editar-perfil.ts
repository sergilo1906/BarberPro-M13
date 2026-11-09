import { cerrarSesion, enviarVerificacion, observarSesion, obtenerUsuarioActual } from "../../datos/sesion";
import { crearPerfilUsuario, guardarPerfilUsuario } from "../../datos/personas";
import { obtenerEtiquetaRol } from "../../comun/permisos";
import { comprobarContacto } from "../../comun/formularios";
import { explicarErrorAcceso, explicarErrorVerificacion } from "../../comun/errores";

const correo = document.getElementById("perfil-email");
const verificacion = document.getElementById("perfil-verif");
const rol = document.getElementById("perfil-role");
const nombre = document.querySelector<HTMLInputElement>("#perfil-name");
const telefono = document.querySelector<HTMLInputElement>("#perfil-phone");
const guardar = document.querySelector<HTMLButtonElement>("#perfil-save");
const reenviar = document.querySelector<HTMLButtonElement>("#perfil-send-verify");
const salir = document.querySelector<HTMLButtonElement>("#perfil-logout");
const mensaje = document.getElementById("perfil-msg");
let guardando = false;
let cerrando = false;
let perfilEditado = false;
let ultimoUid = "";

function mostrarMensaje(texto: string): void { if (mensaje) mensaje.textContent = texto; }

function mostrarEstadoVerificacion(verificado: boolean): void {
  if (!verificacion) return;
  verificacion.textContent = verificado ? "Verificado" : "Pendiente";
  verificacion.className = "inline-block rounded px-2 py-0.5 text-xs font-medium "
    + (verificado ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800");
  reenviar?.classList.toggle("hidden", verificado);
}

nombre?.addEventListener("input", () => { perfilEditado = true; });
telefono?.addEventListener("input", () => { perfilEditado = true; });

observarSesion((estado) => {
  if (estado.estado === "cargando") return;
  const usuario = estado.usuario;
  if (estado.estado !== "autenticado" || !usuario) {
    if (correo) correo.textContent = "";
    if (rol) rol.textContent = "";
    if (nombre) nombre.value = "";
    if (telefono) telefono.value = "";
    ultimoUid = "";
    perfilEditado = false;
    return;
  }
  if (correo) correo.textContent = usuario.correo;
  if (rol) rol.textContent = obtenerEtiquetaRol(usuario.rol);
  mostrarEstadoVerificacion(usuario.correoVerificado);
  if (!perfilEditado || ultimoUid !== usuario.uid) {
    if (nombre) nombre.value = estado.perfil?.name || usuario.nombre;
    if (telefono) telefono.value = estado.perfil?.phone || "";
  }
  ultimoUid = usuario.uid;
  if (estado.errorPerfil) mostrarMensaje("No se pudieron cargar tus datos. Revisa la conexion antes de guardar.");
  else if (!estado.perfil) mostrarMensaje("Completa tus datos y pulsa Guardar cambios para terminar la configuracion inicial.");
});

guardar?.addEventListener("click", async () => {
  if (guardando || !nombre || !telefono) return;
  const estado = obtenerUsuarioActual();
  const usuario = estado.usuario;
  if (estado.estado !== "autenticado" || !usuario) return;
  const errorValidacion = comprobarContacto(nombre.value, telefono.value);
  if (errorValidacion) { mostrarMensaje(errorValidacion); return; }
  guardando = true;
  guardar.disabled = true;
  mostrarMensaje("Guardando cambios...");
  try {
    await crearPerfilUsuario(usuario.uid, usuario.correo, nombre.value, telefono.value);
    await guardarPerfilUsuario(usuario.uid, nombre.value, telefono.value);
    perfilEditado = false;
    if (obtenerUsuarioActual().usuario?.uid === usuario.uid) mostrarMensaje("Cambios guardados.");
  } catch (error) { mostrarMensaje(explicarErrorAcceso(error)); }
  finally { guardando = false; guardar.disabled = false; }
});

reenviar?.addEventListener("click", async () => {
  if (reenviar.disabled) return;
  reenviar.disabled = true;
  mostrarMensaje("Enviando correo de verificacion...");
  try {
    await enviarVerificacion();
    mostrarMensaje("Correo enviado. Revisa tambien la carpeta de spam.");
  } catch (error) { mostrarMensaje(explicarErrorVerificacion(error)); }
  finally { reenviar.disabled = false; }
});

salir?.addEventListener("click", async () => {
  if (cerrando) return;
  cerrando = true;
  salir.disabled = true;
  try { await cerrarSesion(); window.location.assign("/"); }
  catch { mostrarMensaje("No se pudo cerrar sesion. Vuelve a intentarlo."); }
  finally { cerrando = false; salir.disabled = false; }
});
