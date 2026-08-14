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
const Tickets = (function(){

  const KEY = 'simeb_tickets'; // nombre de la "cajita" en localStorage

  function leerTodos(){
    try{
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error("Error leyendo tickets:", e);
      return [];
    }
  }

  function guardarTodos(lista){
    localStorage.setItem(KEY, JSON.stringify(lista));
  }

  /**
   * Crea un nuevo ticket y lo guarda.
   * datos = { cama, sala, equipo, alarma, contexto, sintoma,
   *           causas, diagnostico, solucion, leccion,
   *           prioridad, tecnicoAsignado, descripcion }
   * Devuelve el ticket ya creado (con id, código y estado).
   */
  function crear(datos){
    const lista = leerTodos();
    
    // Generar código de ticket fácil de leer (ej: TK-384)
    const randomId = Math.floor(100 + Math.random() * 900);
    const idTicket = "TK-" + randomId;

    const nuevo = {
        id: idTicket,
        codigo: datos.codigo || ("SB-" + String(Date.now()).slice(-5)),
        cama: datos.cama || datos.sala || 'Cama Registrada',
        area: datos.area || datos.contexto || 'UCI / General',
        equipo: datos.equipo || 'Equipo Biomédico',
        falla: datos.sintoma || datos.falla || 'Falla reportada por enfermería',
        fallaTipo: datos.prioridad || 'critica',
        protocolo: datos.diagnostico || 'Protocolo de enfermería aplicado sin resolver',
        estado: 'Pendiente', // Estado inicial obligatorio
        comentarios: [],
        fecha: new Date().toISOString()
    };

    lista.unshift(nuevo); // Agregar al inicio de la lista
    guardarTodos(lista);
    return nuevo;
}

  /**
   * Devuelve la lista de tickets. Si pasas un estado
   * ("pendiente" o "resuelto"), filtra solo esos.
   */
  function listar(estado){
    const lista = leerTodos();
    return estado ? lista.filter(t=>t.estado===estado) : lista;
  }

  /** Busca un ticket por su id. */
  function obtener(id){
    return leerTodos().find(t=>t.id===id) || null;
  }

  /** Cambia el estado de un ticket (ej. cuando el técnico lo cierra). */
  function actualizarEstado(id, nuevoEstado){
    const lista = leerTodos();
    const t = lista.find(t=>t.id===id);
    if(!t) return null;
    t.estado = nuevoEstado;
    t.actualizado = new Date().toISOString();
    guardarTodos(lista);
    return t;
  }

  return { crear, listar, obtener, actualizarEstado };
})();


/* ============================================================
   SESION — mini-helper de rol, mientras el login "de verdad"
   no está listo. Convención acordada con el equipo:
     localStorage.sm_rol     -> "enfermero" | "tecnico" | "admin"
     localStorage.sm_usuario -> nombre para mostrar (opcional)
   Cuando el login real esté listo, él es quien debe escribir
   estos dos valores antes de redirigir a cada panel.
   ============================================================ */
const Sesion = (function(){
  function rolActual(){
    return localStorage.getItem("sm_rol") || "enfermero"; // valor de prueba mientras no hay login
  }
  function usuarioActual(){
    return localStorage.getItem("sm_usuario") || "Personal de turno";
  }
  function cerrarSesion(){
    localStorage.removeItem("sm_rol");
    localStorage.removeItem("sm_usuario");
    window.location.href = "login.html";
  }
  return { rolActual, usuarioActual, cerrarSesion };
})();
