/* ============================================================
   MONITOR.JS — Módulo: Central de Monitoreo de Equipos Biomédicos
    ============================================================ */
const Monitor = (function(){

  
  const KB = {
    ecg_lead: {
      titulo:"Electrodo ECG suelto", sev:"warn", cat:"tecnica", vital:"fc",
      contexto:"Unidad de cuidados intermedios",
      sintoma:"El monitor genera alarmas cada 30 segundos sin causa clínica aparente.",
      posiblesCausas:[
        "Electrodos secos o vencidos.",
        "Electrodos mal adheridos a la piel.",
        "Cable o latiguillo ECG deteriorado."
      ],
      diagnostico:"Electrodos secos → mala conductividad → falsas alarmas.",
      solucion:[
        "Identificar el latiguillo o electrodo desprendido en pantalla.",
        "Limpiar y secar la piel del paciente.",
        "Reemplazar el electrodo por uno nuevo con gel.",
        "Verificar la adhesión y reconectar el latiguillo firmemente."
      ],
      leccion:"Una mala señal genera falsas alarmas. El problema no siempre está donde suena.",
      escalable:true
    },
    battery: {
      titulo:"Batería baja", sev:"warn", cat:"tecnica", vital:null,
      contexto:"Traslado de pacientes",
      sintoma:"El nivel de batería del monitor es inferior al 15%.",
      posiblesCausas:[
        "Equipo desconectado de la corriente por tiempo prolongado.",
        "Carga insuficiente antes del traslado.",
        "Batería desgastada que ya no retiene carga."
      ],
      diagnostico:"El monitor requiere carga inmediata.",
      solucion:[
        "Conectar el monitor a la toma de corriente más cercana.",
        "Verificar que el indicador de carga se encienda.",
        "Confirmar que el cable de alimentación no esté dañado.",
        "Si no carga estando conectado, marcar el equipo y escalar."
      ],
      leccion:"No transportar pacientes con batería baja. Si no retiene carga tras varios ciclos, requiere reemplazo por biomédica.",
      escalable:true
    },
    net_loss: {
      titulo:"Pérdida de comunicación de red", sev:"crit", cat:"tecnica", vital:null,
      contexto:"UCI",
      sintoma:"El monitor deja de transmitir datos a la central de enfermería.",
      posiblesCausas:[
        "Cable de red desconectado del monitor.",
        "Falla del módulo de comunicación.",
        "Problema general de red en la sala."
      ],
      diagnostico:"El equipo perdió comunicación con la central, aunque sigue monitoreando localmente.",
      solucion:[
        "Verificar que el cable de red del monitor esté conectado.",
        "Confirmar que otros equipos de la sala mantengan conexión.",
        "Reiniciar el módulo de comunicación desde el menú del monitor.",
        "Si el equipo sigue aislado de la central, escalar de inmediato."
      ],
      leccion:"La pérdida de red no es una emergencia clínica, pero sí requiere atención técnica pronta.",
      escalable:true
    }
  };
  
  const TECH_KEYS = Object.keys(KB).filter(k=>KB[k].cat==="tecnica");

  /* ---------- ESTADO ---------- */
  const DEVICES = ["Philips IntelliVue MX450","GE CARESCAPE B450","Mindray uMEC12","Nihon Kohden BSM-3000"];
  const NAMES = ["Cama vacía","Paciente 0417","Paciente 1029","Paciente 3311","Paciente 2205"];
  let beds = [];
  let current = null;
  let intervals = [];

  function baseVitals(){
    return {
      fc: 62+Math.floor(Math.random()*28),
      fr: 13+Math.floor(Math.random()*6)
    };
  }
  function initBeds(){
    beds = [];
    //camas 
    const rooms = ["UCI-1","UCI-2","URG-A","HOSP-4","HOSP-5"];
    for(let i=0;i<5;i++){
      beds.push({
        id:i, no:i+1, room:rooms[i], patient:NAMES[i],
        device:DEVICES[i%DEVICES.length],
        status: i===2 ? "off" : "ok",      // una cama sin conexión de ejemplo
        alarm:null, v:baseVitals()
      });
    }
    //  alarmas iniciales 
    fireAlarm(0,"ecg_lead");
    fireAlarm(3,"battery");
  }

  
  const $ = (id)=>document.getElementById(id);

  /* ---------- RENDER ---------- */
  function render(){
    const g = $("sm-grid");
    g.innerHTML = beds.map(b=>{
      const st = b.status;
      const cls = st==="off" ? "sm-off" : (b.alarm ? "sm-"+KB[b.alarm].sev : "sm-ok");
      let tag = "";
      if(st==="off") tag = `<div class="sm-alarmtag">⚠ Sin conexión con la central</div>`;
      else if(b.alarm) tag = `<div class="sm-alarmtag">▲ ${KB[b.alarm].titulo}</div>`;
      const almV = b.alarm ? KB[b.alarm].vital : null;
      const dim = st==="off" ? 'style="opacity:.4"' : '';
      return `
      <div class="sm-bed ${cls}" tabindex="0" role="button" onclick="Monitor.openProto(${b.id})" onkeydown="if(event.key==='Enter')Monitor.openProto(${b.id})">
        <div class="sm-beacon"></div>
        <div class="sm-head"><span class="sm-bedno">Cama ${b.no}</span><span class="sm-room">${b.room}</span></div>
        <div class="sm-patient">${b.patient}</div>
        <div class="sm-device">${b.device}</div>
        <div class="sm-vitals" ${dim}>
          <div class="sm-vital sm-fc ${almV==='fc'?'sm-alarming':''}"><div class="sm-vl">FC</div><div class="sm-vv">${st==='off'?'--':b.v.fc}<span class="sm-vu"> lpm</span></div></div>
          <div class="sm-vital"><div class="sm-vl">FR</div><div class="sm-vv">${st==='off'?'--':b.v.fr}<span class="sm-vu"> rpm</span></div></div>
          <div class="sm-vital"><div class="sm-vl">Estado</div><div class="sm-vv" style="font-size:13px;color:var(--sm-muted)">${st==='off'?'OFF':(b.alarm?'ALARMA':'OK')}</div></div>
        </div>
        ${tag}
      </div>`;
    }).join("");
    updateKpis();
  }
  function updateKpis(){
    $("sm-kTotal").textContent = beds.length;
    $("sm-kOnline").textContent = beds.filter(b=>b.status!=="off").length;
    $("sm-kAlarm").textContent = beds.filter(b=>b.alarm).length;
  }

  /* ---------- ALARMAS ---------- */
  function fireAlarm(bedId,key){
    const b = beds[bedId];
    if(b.status==="off"||b.alarm) return;
    b.alarm = key;
    const info = KB[key];
    if(info.vital==="fc") b.v.fc = 128+Math.floor(Math.random()*22);
    render();
  }
  function triggerRandom(){
    const free = beds.filter(b=>b.status!=="off"&&!b.alarm);
    if(!free.length){ toast("sm-ok","Todas las camas ya tienen una alarma activa."); return; }
    const b = free[Math.floor(Math.random()*free.length)];
    
    const key = TECH_KEYS[Math.floor(Math.random()*TECH_KEYS.length)];
    fireAlarm(b.id, key);
    toast("sm-ok",`Alarma generada en Cama ${b.no}: ${KB[key].titulo}.`);
  }

  /* ---------- MODAL PROTOCOLO ---------- */
  function openProto(bedId){
    const b = beds[bedId];
    if(b.status==="off"){ toast("sm-ok",`Cama ${b.no} sin conexión. Verifique red/energía del equipo.`); return; }
    if(!b.alarm){ toast("sm-ok",`Cama ${b.no} sin alarmas activas. Todo en orden.`); return; }
    current = bedId;
    const info = KB[b.alarm];
    $("sm-pBed").textContent = `Cama ${b.no} · ${b.room}`;
    $("sm-pAlarm").textContent = info.titulo;
    $("sm-pDevice").textContent = b.device;
    const sev = $("sm-pSev");
    sev.className = "sm-sev sm-"+info.sev;
    sev.textContent = info.sev==="crit" ? "!" : "▲";
    // Contexto 
    $("sm-pContexto").textContent = info.contexto;
    $("sm-pSintoma").textContent = info.sintoma;
    
    $("sm-pCausas").innerHTML = info.posiblesCausas.map(c=>`<li>${c}</li>`).join("");
     
    $("sm-pDiagnostico").textContent = `👉 ${info.diagnostico}`;
    
    $("sm-pSteps").innerHTML = info.solucion.map(s=>`<li>${s}</li>`).join("");
   
    $("sm-pLeccion").textContent = `"${info.leccion}"`;
    
    const escBtn = document.querySelector("#ovProto .sm-escalate");
    escBtn.style.display = info.escalable ? "" : "none";
    document.querySelector("#ovProto .sm-resolve").textContent = info.escalable ? "Alarma resuelta" : "Atención clínica registrada";
    showOverlay("ovProto");
  }
  function resolveAlarm(){
    const b = beds[current];
    const titulo = KB[b.alarm].titulo;
    b.alarm = null;
    b.v = baseVitals();
    render(); closeAll();
    toast("sm-ok",`Cama ${b.no}: "${titulo}" resuelta por enfermería.`);
  }

  
  function scheduleFormHTML(){
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
  function openSchedule(){
    const b = beds[current];
    $("sm-sCtx").textContent = `Cama ${b.no} · ${b.room} · ${b.device}`;
    $("sm-sDesc").value = `Alarma: ${KB[b.alarm].titulo}. Protocolo de enfermería aplicado sin resolver.`;
    hide("ovProto"); showOverlay("ovSched");
  }
  function backToProto(){ hide("ovSched"); showOverlay("ovProto"); }
  function confirmSchedule(){
    const b = beds[current];
    const info = KB[b.alarm];
    const prio = document.querySelector('input[name="prio"]:checked').value;
    const tech = $("sm-sTech").value;
    const descripcion = $("sm-sDesc").value;

    
    const ticket = Tickets.crear({
      cama: b.no, sala: b.room, equipo: b.device,
      alarma: info.titulo,
      contexto: info.contexto, sintoma: info.sintoma,
      causas: info.posiblesCausas, diagnostico: info.diagnostico,
      solucion: info.solucion, leccion: info.leccion,
      prioridad: prio, tecnicoAsignado: tech, descripcion: descripcion
    });

    $("sm-schedBody").innerHTML = `
      <div class="sm-ticket-done">
        <div class="sm-big">✓</div>
        <h3>Ticket de soporte generado</h3>
        <div class="sm-code">${ticket.codigo}</div>
        <p>Cama ${b.no} · ${b.room} — <b>${info.titulo}</b></p>
        <p>Prioridad <b>${prio}</b> · ${tech}</p>
        <p style="margin-top:10px">El técnico de biomédica recibió la notificación con el historial del protocolo.</p>
        <div class="sm-actions"><button class="sm-btn sm-resolve" style="background:var(--sm-accent);color:#04101f" onclick="Monitor.finishTicket('${ticket.codigo}')">Entendido</button></div>
      </div>`;
  }
  function finishTicket(code){
    const b = beds[current];
    b.alarm = null;            
    render(); closeAll();
    toast("sm-ticket",`Ticket <span class="sm-tk">${code}</span> asignado a soporte biomédico.`);
  }

  /* ---------- UI HELPERS ---------- */
  function showOverlay(id){ $(id).classList.add("sm-show"); }
  function hide(id){ $(id).classList.remove("sm-show"); }
  function closeAll(){ hide("ovProto"); hide("ovSched"); resetSchedBody(); }
  function resetSchedBody(){
    const body = $("sm-schedBody");
    if(body.querySelector(".sm-ticket-done")) body.innerHTML = scheduleFormHTML();
  }
  let toastT;
  function toast(type,msg){
    const t = $("sm-toast");
    t.className = "sm-toast "+type+" sm-show";
    t.querySelector(".sm-ic").textContent = type==="sm-ticket" ? "#" : "✓";
    $("sm-toastMsg").innerHTML = msg;
    clearTimeout(toastT);
    toastT = setTimeout(()=>t.classList.remove("sm-show"),3600);
  }

  
  function tickVitals(){
    beds.forEach(b=>{
      if(b.status==="off") return;
      const almV = b.alarm ? KB[b.alarm].vital : null;
      if(almV!=="fc") b.v.fc = clamp(b.v.fc+rnd(-2,2),58,102);
      b.v.fr = clamp(b.v.fr+rnd(-1,1),12,22);
    });
    render();
  }
  function autoAlarm(){
    if(Math.random()<0.4) triggerRandom();   // alarma técnica esporádica
  }
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));

  function clock(){
    const d=new Date();
    $("sm-clkTime").textContent =
      d.toLocaleTimeString("es-CO",{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    $("sm-clkDate").textContent =
      d.toLocaleDateString("es-CO",{day:'2-digit',month:'short'});
  }

 
  function init(){
    initBeds(); render(); clock();
    // Uso panel
    $("sm-sesUsuario").textContent = `${Sesion.usuarioActual()} · ${Sesion.rolActual()}`;
    intervals.push(setInterval(clock,1000));
    intervals.push(setInterval(tickVitals,2000));
    intervals.push(setInterval(autoAlarm,15000));
    document.addEventListener("keydown", escListener);
    document.querySelectorAll("#sm-root .sm-overlay").forEach(o=>o.addEventListener("click", overlayListener));
  }
  
  function destroy(){
    intervals.forEach(clearInterval);
    intervals = [];
    document.removeEventListener("keydown", escListener);
  }
  function escListener(e){ if(e.key==="Escape") closeAll(); }
  function overlayListener(e){ if(e.target===e.currentTarget) closeAll(); }

  
  return {
    init, destroy,
    openProto, resolveAlarm,
    openSchedule, backToProto, confirmSchedule, finishTicket,
    closeAll, triggerRandom
  };
})();
