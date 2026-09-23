/* ============================================================
   TICKETS.JS — Módulo COMPARTIDO entre paneles
   ============================================================
   Este archivo se debe copiar TAL CUAL en la carpeta de tu
   compañera también (el panel del técnico lo necesita para leer
   los mismos tickets que tú generas aquí).

   ¿Qué hace? Guarda los tickets en localStorage, que es una
   "cajita" de almacenamiento del propio navegador. Así, cuando
   tú generas un ticket en monitor.html, tu compañera puede
   leerlo desde tecnico.html — siempre que se abran en el MISMO
   navegador y computador (perfecto para la demo en clase).

   Cuando el backend esté listo, solo hay que cambiar las 4
   funciones de abajo (crear/listar/actualizarEstado/obtener)
   para que en vez de usar localStorage hagan fetch(...) al
   servidor. El resto del código (monitor.js, tecnico.js) no
   tiene que cambiar nada, porque siempre las llama a ELLAS,
   nunca toca localStorage directamente.
   ============================================================ */
/* Cliente compartido del API de tickets. */
const Tickets = (function () {
  const API = "/api/tickets";

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      throw new Error(data.mensaje || "No se pudo completar la operación.");
    }
    return data;
  }

  function crear(datos) {
    return request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    }).then(data => data.ticket);
  }

  function listar(estado) {
    return request(API).then(lista => estado ? lista.filter(t => t.estado === estado) : lista);
  }

  function obtener(id) {
    return listar().then(lista => lista.find(ticket => ticket.id === id) || null);
  }

  function actualizar(id, cambios) {
    return request(`${API}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios)
    });
  }

  return { crear, listar, obtener, actualizar };
})();

const Sesion = (function () {
  function rolActual() { return localStorage.getItem("userRol") || "Técnico"; }
  function usuarioActual() { return localStorage.getItem("userNombre") || "Personal de turno"; }
  function cerrarSesion() {
    localStorage.removeItem("userRol");
    localStorage.removeItem("userNombre");
    window.location.href = "../index.html";
  }
  return { rolActual, usuarioActual, cerrarSesion };
})();
