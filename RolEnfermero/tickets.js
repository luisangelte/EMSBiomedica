// Verifica que haya una sesión iniciada (el login la deja en localStorage
// bajo las claves "userRol" / "userNombre"). Si no hay sesión, expulsa
// al login.
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (!rolGuardado) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html";
    }
})();

/* ============================================================
   TICKETS.JS — Módulo COMPARTIDO entre paneles (Enfermería ↔ Técnico)
   ============================================================
   Ya NO usa localStorage: los tickets viven en el backend
   (Backend Alertas/servidor.js, endpoints /api/tickets), para que
   el panel del técnico (gestor_tickes) pueda leer en tiempo real
   lo que genera enfermería, sin importar si están en la misma
   máquina/navegador.
   ============================================================ */
const Tickets = (function () {

  const API = "/api/tickets";

  /**
   * Crea un nuevo ticket en el backend.
   * datos = { cama, sala, equipo, alarma, contexto, sintoma,
   *           diagnostico, solucion, leccion,
   *           prioridad, tecnicoAsignado, descripcion }
   * Devuelve una Promise con el ticket ya creado (id, estado, etc.)
   */
  async function crear(datos) {
    const resp = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos)
    });
    const data = await resp.json();
    if (!resp.ok || !data.success) throw new Error(data.mensaje || "No se pudo crear el ticket.");
    return data.ticket;
  }

  /** Lista todos los tickets (opcionalmente filtrados por estado). */
  async function listar(estado) {
    const resp = await fetch(API);
    const lista = await resp.json();
    return estado ? lista.filter(t => t.estado === estado) : lista;
  }

  /** Cambia el estado de un ticket y/o agrega un comentario. */
  async function actualizar(id, cambios) {
    const resp = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cambios)
    });
    return resp.json();
  }

  return { crear, listar, actualizar };
})();

/* ============================================================
   SESION — helper de rol/usuario, alineado con el login real
   (index.html), que guarda:
     localStorage.userRol     -> "Enfermero" | "Técnico" | "Admin"
     localStorage.userNombre  -> nombre para mostrar
   ============================================================ */
const Sesion = (function () {
  function rolActual() {
    return localStorage.getItem("userRol") || "Enfermero";
  }
  function usuarioActual() {
    return localStorage.getItem("userNombre") || "Personal de turno";
  }
  function cerrarSesion() {
    localStorage.removeItem("userRol");
    localStorage.removeItem("userNombre");
    window.location.href = "../index.html";
  }
  return { rolActual, usuarioActual, cerrarSesion };
})();
