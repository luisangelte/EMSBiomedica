// Verifica sesión antes de arrancar cualquier lógica del panel.
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (!rolGuardado) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html";
    }
})();

/* ============================================================
   MONITOR.JS — Módulo: Central de Monitoreo de Equipos Biomédicos
   Los datos de las camas vienen del backend real (Backend Alertas/
   servidor.js) por polling a /api/monitoreo cada 3s. Las alarmas
   se controlan también contra el backend (/api/monitoreo/:id/...),
   y al escalar se genera un ticket real vía Tickets.crear()
   (tickets.js), que el panel del técnico puede leer.
   ============================================================ */
const Monitor = (function () {

  /* ---------- BASE DE CONOCIMIENTO (protocolos de atención) ----------
     Solo el Caso 2 (ecg_lead) + fallas técnicas generales (battery,
     net_loss). El backend mapea su campo "estado" así:
       "advertencia" -> ecg_lead   "critico" -> net_loss
     "battery" no la genera el backend automáticamente, pero queda
     disponible en el KB por si se dispara manualmente más adelante. */
  const KB = {
    ecg_lead: {
      titulo: "Electrodo ECG suelto", sev: "warn", cat: "tecnica", vital: "fc",
      contexto: "Unidad de cuidados intermedios",
      sintoma: "El monitor genera alarmas cada 30 segundos sin causa clínica aparente.",
      posiblesCausas: ["Electrodos secos o vencidos.", "Electrodos mal adheridos a la piel.", "Cable o latiguillo ECG deteriorado."],
      diagnostico: "Electrodos secos → mala conductividad → falsas alarmas.",
      solucion: ["Identificar el latiguillo o electrodo desprendido en pantalla.", "Limpiar y secar la piel del paciente.", "Reemplazar el electrodo por uno nuevo con gel.", "Verificar la adhesión y reconectar el latiguillo firmemente."],
      leccion: "Una mala señal genera falsas alarmas. El problema no siempre está donde suena.",
      escalable: true
    },
    battery: {
      titulo: "Batería baja", sev: "warn", cat: "tecnica", vital: null,
      contexto: "Traslado de pacientes",
      sintoma: "El nivel de batería del monitor es inferior al 15%.",
      posiblesCausas: ["Equipo desconectado de la corriente por tiempo prolongado.", "Carga insuficiente antes del traslado.", "Batería desgastada que ya no retiene carga."],
      diagnostico: "El monitor requiere carga inmediata.",
      solucion: ["Conectar el monitor a la toma de corriente más cercana.", "Verificar que el indicador de carga se encienda.", "Confirmar que el cable de alimentación no esté dañado.", "Si no carga estando conectado, marcar el equipo y escalar."],
      leccion: "No transportar pacientes con batería baja. Si no retiene carga tras varios ciclos, requiere reemplazo por biomédica.",
      escalable: true
    },
    net_loss: {
      titulo: "Pérdida de comunicación de red", sev: "crit", cat: "tecnica", vital: null,
      contexto: "UCI",
      sintoma: "El monitor deja de transmitir datos a la central de enfermería.",
      posiblesCausas: ["Cable de red desconectado del monitor.", "Falla del módulo de comunicación.", "Problema general de red en la sala."],
      diagnostico: "El equipo perdió comunicación con la central, aunque sigue monitoreando localmente.",
      solucion: ["Verificar que el cable de red del monitor esté conectado.", "Confirmar que otros equipos de la sala mantengan conexión.", "Reiniciar el módulo de comunicación desde el menú del monitor.", "Si el equipo sigue aislado de la central, escalar de inmediato."],
      leccion: "La pérdida de red no es una emergencia clínica, pero sí requiere atención técnica pronta.",
      escalable: true
    }
  };

  /* ---------- ESTADO ---------- */
  const DEVICES = ["Philips IntelliVue MX450", "GE CARESCAPE B450", "Mindray uMEC12", "Nihon Kohden BSM-3000"];
  let beds = [];
  let current = null;
  let intervals = [];

  const $ = (id) => document.getElementById(id);

  /* ---------- CONEXIÓN BACKEND (API REST) ---------- */
  async function obtenerDatosDelBackend() {
    try {
      const respuesta = await fetch('/api/monitoreo');
      const datosCamasBackend = await respuesta.json();

      beds = datosCamasBackend.map((cama, i) => {
        let statusUI = "ok";
        let alarmUI = null;
        if (cama.estado === "sin-conexion") statusUI = "off";
        else if (cama.estado === "critico") alarmUI = "net_loss";
        else if (cama.estado === "advertencia") alarmUI = "ecg_lead";

        return {
          id: i,
          no: cama.id,
          room: i < 2 ? "UCI-" + (i + 1) : (i === 2 ? "URG-A" : "HOSP-" + (i - 1)),
          patient: cama.paciente,
          device: DEVICES[i % DEVICES.length],
          status: statusUI,
          alarm: alarmUI,
          v: { fc: cama.fc, fr: cama.fr }
        };
      });

      render();
    } catch (error) {
      console.error("Error obteniendo datos de la API de alertas:", error);
    }
  }

  /* ---------- RENDER ---------- */
  function render() {
    const g = $("sm-grid");
    if (!g) return;

    g.innerHTML = beds.map(b => {
      const st = b.status;
      const cls = st === "off" ? "sm-off" : (b.alarm ? "sm-" + KB[b.alarm].sev : "sm-ok");
      let tag = "";
      if (st === "off") tag = `<div class="sm-alarmtag">⚠ Sin conexión con la central</div>`;
      else if (b.alarm) tag = `<div class="sm-alarmtag">▲ ${KB[b.alarm].titulo}</div>`;
      const almV = b.alarm ? KB[b.alarm].vital : null;
      const dim = st === "off" ? 'style="opacity:.4"' : '';

      return `
      <div class="sm-bed ${cls}" tabindex="0" role="button" onclick="Monitor.openProto(${b.id})" onkeydown="if(event.key==='Enter')Monitor.openProto(${b.id})">
        <div class="sm-beacon"></div>
        <div class="sm-head"><span class="sm-bedno">Cama ${b.no}</span><span class="sm-room">${b.room}</span></div>
        <div class="sm-patient">${b.patient}</div>
        <div class="sm-device">${b.device}</div>
        <div class="sm-vitals" ${dim}>
          <div class="sm-vital sm-fc ${almV === 'fc' ? 'sm-alarming' : ''}"><div class="sm-vl">FC</div><div class="sm-vv">${st === 'off' ? '--' : b.v.fc}<span class="sm-vu"> lpm</span></div></div>
          <div class="sm-vital"><div class="sm-vl">FR</div><div class="sm-vv">${st === 'off' ? '--' : b.v.fr}<span class="sm-vu"> rpm</span></div></div>
          <div class="sm-vital"><div class="sm-vl">Estado</div><div class="sm-vv" style="font-size:13px;color:var(--sm-muted)">${st === 'off' ? 'OFF' : (b.alarm ? 'ALARMA' : 'OK')}</div></div>
        </div>
        ${tag}
      </div>`;
    }).join("");

    updateKpis();
  }

  function updateKpis() {
    if ($("sm-kTotal")) $("sm-kTotal").textContent = beds.length;
    if ($("sm-kOnline")) $("sm-kOnline").textContent = beds.filter(b => b.status !== "off").length;
    if ($("sm-kAlarm")) $("sm-kAlarm").textContent = beds.filter(b => b.alarm).length;
  }

  /* ---------- ALARMAS (contra backend) ---------- */
  async function triggerRandom() {
    const libres = beds.filter(b => b.status !== "off" && !b.alarm);
    if (!libres.length) { toast("sm-ok", "Todas las camas ya tienen una alarma activa."); return; }
    const b = libres[Math.floor(Math.random() * libres.length)];
    try {
      const resp = await fetch(`/api/monitoreo/${b.no}/simular`, { method: "POST" });
      const data = await resp.json();
      if (!resp.ok || !data.success) { toast("sm-ok", data.mensaje || "No se pudo simular la alarma."); return; }
      await obtenerDatosDelBackend();
      toast("sm-ok", `Alarma generada en Cama ${b.no}.`);
    } catch (e) {
      console.error("Error simulando alarma:", e);
    }
  }

  /* ---------- MODAL PROTOCOLO ---------- */
  function openProto(bedId) {
    const b = beds[bedId];
    if (!b) return;
    if (b.status === "off") { toast("sm-ok", `Cama ${b.no} sin conexión. Verifique red/energía del equipo.`); return; }
    if (!b.alarm) { toast("sm-ok", `Cama ${b.no} sin alarmas activas. Todo en orden.`); return; }

    current = bedId;
    const info = KB[b.alarm];

    if ($("sm-pBed")) $("sm-pBed").textContent = `Cama ${b.no} · ${b.room}`;
    if ($("sm-pAlarm")) $("sm-pAlarm").textContent = info.titulo;
    if ($("sm-pDevice")) $("sm-pDevice").textContent = b.device;

    const sev = $("sm-pSev");
    if (sev) { sev.className = "sm-sev sm-" + info.sev; sev.textContent = info.sev === "crit" ? "!" : "▲"; }

    if ($("sm-pContexto")) $("sm-pContexto").textContent = info.contexto;
    if ($("sm-pSintoma")) $("sm-pSintoma").textContent = info.sintoma;
    if ($("sm-pCausas")) $("sm-pCausas").innerHTML = info.posiblesCausas.map(c => `<li>${c}</li>`).join("");
    if ($("sm-pDiagnostico")) $("sm-pDiagnostico").textContent = `👉 ${info.diagnostico}`;
    if ($("sm-pSteps")) $("sm-pSteps").innerHTML = info.solucion.map(s => `<li>${s}</li>`).join("");
    if ($("sm-pLeccion")) $("sm-pLeccion").textContent = `"${info.leccion}"`;

    const escBtn = document.querySelector("#ovProto .sm-escalate");
    if (escBtn) escBtn.style.display = info.escalable ? "" : "none";
    const resBtn = document.querySelector("#ovProto .sm-resolve");
    if (resBtn) resBtn.textContent = info.escalable ? "Alarma resuelta" : "Atención clínica registrada";

    resetSchedBody();
    showOverlay("ovProto");
  }

  async function resolveAlarm() {
    if (current === null) return;
    const b = beds[current];
    try {
      await fetch(`/api/monitoreo/${b.no}/resolver`, { method: "POST" });
      await obtenerDatosDelBackend();
      closeAll();
      toast("sm-ok", `Cama ${b.no}: alarma resuelta por enfermería.`);
    } catch (e) {
      console.error("Error resolviendo alarma:", e);
    }
  }

  /* ---------- AGENDAR SERVICIO (genera ticket real en el backend) ---------- */
  function scheduleFormHTML() {
    return `
      <div class="sm-field"><label>Prioridad</label>
        <div class="sm-prio">
          <label><input type="radio" name="prio" value="Alta" checked><span>🔴 Alta</span></label>
          <label><input type="radio" name="prio" value="Media"><span>🟡 Media</span></label>
          <label><input type="radio" name="prio" value="Baja"><span>🟢 Baja</span></label>
        </div></div>
      <div class="sm-field"><label>Técnico asignado</label>
        <select id="sm-sTech">
          <option>Asignación automática (turno actual)</option>
          <option>Luis Terraza · Biomédica</option>
          <option>Loren Chacon · Biomédica</option>
          <option>Jessica Rodriguez · Biomédica</option>
        </select></div>
      <div class="sm-field"><label>Descripción para el técnico</label>
        <textarea id="sm-sDesc" placeholder="Pasos ya realizados por enfermería y observaciones..."></textarea></div>
      <div class="sm-note"><b>Nota:</b> el ticket incluye el historial del protocolo aplicado por enfermería, evitando repetir verificaciones básicas.</div>
      <div class="sm-actions">
        <button class="sm-btn sm-escalate" style="flex:.6" onclick="Monitor.backToProto()">← Volver</button>
        <button class="sm-btn sm-resolve" style="background:var(--sm-accent);color:#04101f" onclick="Monitor.confirmSchedule()">Generar ticket</button>
      </div>`;
  }
  function openSchedule() {
    const b = beds[current];
    if ($("sm-sCtx")) $("sm-sCtx").textContent = `Cama ${b.no} · ${b.room} · ${b.device}`;
    if ($("sm-sDesc")) $("sm-sDesc").value = `Alarma: ${KB[b.alarm].titulo}. Protocolo de enfermería aplicado sin resolver.`;
    hide("ovProto"); showOverlay("ovSched");
  }
  function backToProto() { hide("ovSched"); showOverlay("ovProto"); }

  async function confirmSchedule() {
    const b = beds[current];
    const info = KB[b.alarm];
    const prio = document.querySelector('input[name="prio"]:checked').value;
    const tech = $("sm-sTech").value;
    const descripcion = $("sm-sDesc").value;

    try {
      const ticket = await Tickets.crear({
        cama: b.no, sala: b.room, equipo: b.device,
        alarma: info.titulo, contexto: info.contexto, sintoma: info.sintoma,
        diagnostico: info.diagnostico, solucion: info.solucion, leccion: info.leccion,
        prioridad: prio, tecnicoAsignado: tech, descripcion: descripcion
      });

      if ($("sm-schedBody")) $("sm-schedBody").innerHTML = `
        <div class="sm-ticket-done">
          <div class="sm-big">✓</div>
          <h3>Ticket de soporte generado</h3>
          <div class="sm-code">${ticket.id}</div>
          <p>Cama ${b.no} · ${b.room} — <b>${info.titulo}</b></p>
          <p>Prioridad <b>${prio}</b> · ${tech}</p>
          <p style="margin-top:10px">El técnico de biomédica recibió la notificación con el historial del protocolo.</p>
          <div class="sm-actions"><button class="sm-btn sm-resolve" style="background:var(--sm-accent);color:#04101f" onclick="Monitor.finishTicket('${ticket.id}')">Entendido</button></div>
        </div>`;

      // El backend ya puso la cama en "estable" (queda en manos del
      // técnico); refrescamos para que la grilla lo refleje.
      await obtenerDatosDelBackend();
    } catch (e) {
      console.error("Error creando ticket:", e);
      toast("sm-ok", "No se pudo generar el ticket. Intenta de nuevo.");
    }
  }
  function finishTicket(code) {
    closeAll();
    toast("sm-ticket", `Ticket <span class="sm-tk">${code}</span> asignado a soporte biomédico.`);
  }

  /* ---------- UI HELPERS ---------- */
  function showOverlay(id) { if ($(id)) $(id).classList.add("sm-show"); }
  function hide(id) { if ($(id)) $(id).classList.remove("sm-show"); }
  function closeAll() { hide("ovProto"); hide("ovSched"); resetSchedBody(); current = null; }
  function resetSchedBody() {
    const body = $("sm-schedBody");
    if (body && body.querySelector(".sm-ticket-done")) body.innerHTML = scheduleFormHTML();
  }
  let toastT;
  function toast(type, msg) {
    const t = $("sm-toast");
    if (!t) return;
    t.className = "sm-toast " + type + " sm-show";
    t.querySelector(".sm-ic").textContent = type === "sm-ticket" ? "#" : "✓";
    $("sm-toastMsg").innerHTML = msg;
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("sm-show"), 3600);
  }

  function clock() {
    const d = new Date();
    if ($("sm-clkTime")) $("sm-clkTime").textContent = d.toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if ($("sm-clkDate")) $("sm-clkDate").textContent = d.toLocaleDateString("es-CO", { day: '2-digit', month: 'short' });
  }

  /* ---------- INIT / DESTROY ---------- */
  function init() {
    if ($("sm-sesUsuario")) $("sm-sesUsuario").textContent = `${Sesion.usuarioActual()} · ${Sesion.rolActual()}`;
    obtenerDatosDelBackend();
    clock();
    intervals.push(setInterval(clock, 1000));
    intervals.push(setInterval(obtenerDatosDelBackend, 3000));
    document.addEventListener("keydown", escListener);
    document.querySelectorAll("#sm-root .sm-overlay").forEach(o => o.addEventListener("click", overlayListener));
  }
  function destroy() {
    intervals.forEach(clearInterval);
    intervals = [];
    document.removeEventListener("keydown", escListener);
  }
  function escListener(e) { if (e.key === "Escape") closeAll(); }
  function overlayListener(e) { if (e.target === e.currentTarget) closeAll(); }

  return {
    init, destroy,
    openProto, resolveAlarm,
    openSchedule, backToProto, confirmSchedule, finishTicket,
    closeAll, triggerRandom
  };

})();
