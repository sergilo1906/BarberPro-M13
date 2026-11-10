import { observarAreaAutorizada } from "../../comun/permisos";
observarAreaAutorizada(["worker", "manager", "admin"], (contexto) => {
  for (const elemento of document.querySelectorAll<HTMLElement>("[data-manager-only]")) {
    const visible = contexto.usuario.rol === "manager" || contexto.usuario.rol === "admin";
    elemento.classList.toggle("hidden", !visible); elemento.classList.toggle("flex", visible);
  }
}, () => { for (const elemento of document.querySelectorAll<HTMLElement>("[data-manager-only]")) { elemento.classList.add("hidden"); elemento.classList.remove("flex"); } });
