/* ============================================================
   MONITOR.JS — Módulo: Central de Monitoreo de Equipos Biomédicos
   Todo vive dentro del objeto "Monitor" para no chocar con
   variables/funciones globales de otras partes del proyecto
   (ej. si tu compañera también usa render(), current, toast(), etc.)
   ============================================================ */
const Monitor = (function(){

  /* ---------- BASE DE CONOCIMIENTO (protocolos de atención) ----------
     Cada alarma sigue la MISMA estructura que usó tu compañera en
     casos.js (titulo, contexto, sintoma, posiblesCausas, diagnostico,
     solucion, leccion), para que las dos partes compartan un mismo
     "modelo de caso" aunque cada una tenga su propia interfaz.
     Esto también es 1:1 con el formato de la diapositiva del profesor
     (Contexto / Síntoma / Posibles causas / Diagnóstico real /
     Solución / Lección clave). */
  const KB = {
    spo2_off: {
      titulo:"Sensor SpO₂ desconectado", sev:"warn", cat:"tecnica", vital:"spo2",
      contexto:"Hospitalización general",
      sintoma:"El monitor no logra leer la saturación de oxígeno del paciente.",
      posiblesCausas:[
        "Sensor mal colocado en el dedo del paciente.",
        "Sensor sucio o con residuos (esmalte, suciedad).",
        "Cable desconectado del módulo del monitor."
      ],
      diagnostico:"El sensor de SpO₂ no está captando una señal válida.",
      solucion:[
        "Verificar que el sensor esté correctamente colocado en el dedo del paciente.",
        "Limpiar la superficie del sensor; retirar residuos o esmalte.",
        "Reposicionar el sensor en un dedo diferente y esperar la relectura.",
        "Revisar que el cable no esté doblado ni desconectado del módulo."
      ],
      leccion:"El 70% de estas alarmas se resuelven limpiando o reposicionando el sensor. Solo escale si persiste tras cambiar de dedo.",
      escalable:true
    },
    spo2_low: {
      titulo:"Señal SpO₂ deficiente", sev:"warn", cat:"tecnica", vital:"spo2",
      contexto:"Hospitalización general",
      sintoma:"La saturación fluctúa continuamente y no se estabiliza.",
      posiblesCausas:[
        "Movimiento constante de la extremidad del paciente.",
        "Mala perfusión por dedo frío.",
        "Sensor sucio o mal ajustado."
      ],
      diagnostico:"El sensor no obtiene una lectura estable por baja perfusión o movimiento.",
      solucion:[
        "Reducir el movimiento de la extremidad del paciente.",
        "Calentar la mano si está fría; la perfusión baja afecta la lectura.",
        "Limpiar el sensor y cambiarlo de dedo.",
        "Verificar que no haya luz ambiental intensa sobre el sensor."
      ],
      leccion:"Descarte causas de perfusión del paciente antes de sospechar del equipo.",
      escalable:true
    },
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
    nibp_fail: {
      titulo:"Fallo de medición PANI", sev:"warn", cat:"tecnica", vital:"pani",
      contexto:"Consulta externa",
      sintoma:"La medición de presión arterial falla o no inicia.",
      posiblesCausas:[
        "Brazalete desconectado o de talla incorrecta.",
        "Manguera doblada, pinchada o desconectada.",
        "Movimiento del brazo durante la toma."
      ],
      diagnostico:"Error en el sistema de medición de presión no invasiva.",
      solucion:[
        "Verificar que el brazalete tenga la talla correcta y esté bien ajustado.",
        "Comprobar que la manguera no esté doblada ni desconectada.",
        "Asegurar que el brazo del paciente esté quieto durante la toma.",
        "Reintentar la medición manual desde el monitor."
      ],
      leccion:"Si el fallo se repite tras 3 intentos con manguera y brazalete correctos, puede ser la bomba o válvula: escale a biomédica.",
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
    },
    hr_high: {
      titulo:"Frecuencia cardíaca alta", sev:"crit", cat:"fisiologica", vital:"fc",
      contexto:"UCI",
      sintoma:"La frecuencia cardíaca del paciente se mantiene elevada de forma sostenida.",
      posiblesCausas:[
        "Evento clínico real del paciente (dolor, fiebre, ansiedad).",
        "Artefacto de movimiento en la señal.",
        "Descompensación del paciente."
      ],
      diagnostico:"Esta es una alarma FISIOLÓGICA del paciente, no una falla del equipo.",
      solucion:[
        "Acudir al paciente y valorar su estado clínico de inmediato.",
        "Confirmar que la lectura es real y no un artefacto de movimiento.",
        "Notificar al personal médico según protocolo del servicio.",
        "Registrar el evento en la historia clínica."
      ],
      leccion:"Corresponde a atención clínica del equipo asistencial, no a soporte biomédico.",
      escalable:false
    },
    apnea: {
      titulo:"Apnea detectada", sev:"crit", cat:"fisiologica", vital:null,
      contexto:"UCI",
      sintoma:"El monitor no detecta ciclos respiratorios del paciente.",
      posiblesCausas:[
        "Evento respiratorio real del paciente.",
        "Sensor de respiración desplazado.",
        "Obstrucción de la vía aérea."
      ],
      diagnostico:"Alarma fisiológica de prioridad clínica máxima.",
      solucion:[
        "Acudir al paciente de forma inmediata y valorar la respiración.",
        "Verificar permeabilidad de la vía aérea.",
        "Activar el código o protocolo de emergencia del servicio.",
        "Confirmar que no se trate de un artefacto del sensor."
      ],
      leccion:"La atención es del equipo asistencial, no de biomédica.",
      escalable:false
    }
  };
  // Alarmas técnicas: son las que dispara el botón "Simular alarma".
  // Las fisiológicas (hr_high, apnea) no deberían salir al azar en la demo técnica.
  const TECH_KEYS = Object.keys(KB).filter(k=>KB[k].cat==="tecnica");

  /* ---------- ESTADO ---------- */
  const DEVICES = ["Philips IntelliVue MX450","GE CARESCAPE B450","Mindray uMEC12","Nihon Kohden BSM-3000"];
  const NAMES = ["Cama vacía","Paciente 0417","Paciente 1029","Paciente 3311","Paciente 2205","Paciente 8890","Paciente 6142","Paciente 5073","Paciente 4418","Paciente 7756","Paciente 1360","Paciente 9024"];
  let beds = [];
  let current = null;
  let intervals = [];

  function baseVitals(){
    return {
      fc: 62+Math.floor(Math.random()*28),
      spo2: 96+Math.floor(Math.random()*4),
      sys: 110+Math.floor(Math.random()*20),
      dia: 68+Math.floor(Math.random()*14),
      temp: (36.3+Math.random()*0.9),
      fr: 13+Math.floor(Math.random()*6)
    };
  }
  function initBeds(){
    beds = [];
    const rooms = ["UCI-1","UCI-1","UCI-2","UCI-2","UCI-3","UCI-3","URG-A","URG-A","HOSP-4","HOSP-4","HOSP-5","HOSP-5"];
    for(let i=0;i<12;i++){
      beds.push({
        id:i, no:i+1, room:rooms[i], patient:NAMES[i],
        device:DEVICES[i%DEVICES.length],
        status: i===7 ? "off" : "ok",      // una cama sin conexión de ejemplo
        alarm:null, v:baseVitals()
      });
    }
    // dos alarmas iniciales para que el demo arranque con estado
    fireAlarm(0,"spo2_off");
    fireAlarm(4,"ecg_lead");
  }

  /* ---------- helpers de DOM con prefijo sm- ---------- */
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
          <div class="sm-vital sm-spo2 ${almV==='spo2'?'sm-alarming':''}"><div class="sm-vl">SpO₂</div><div class="sm-vv">${st==='off'?'--':b.v.spo2}<span class="sm-vu"> %</span></div></div>
          <div class="sm-vital sm-pani ${almV==='pani'?'sm-alarming':''}"><div class="sm-vl">PANI</div><div class="sm-vv">${st==='off'?'--':b.v.sys+'/'+b.v.dia}</div></div>
          <div class="sm-vital"><div class="sm-vl">Temp</div><div class="sm-vv">${st==='off'?'--':b.v.temp.toFixed(1)}<span class="sm-vu">°C</span></div></div>
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
    if(info.vital==="spo2") b.v.spo2 = 84+Math.floor(Math.random()*5);
    render();
  }
  function triggerRandom(){
    const free = beds.filter(b=>b.status!=="off"&&!b.alarm);
    if(!free.length){ toast("sm-ok","Todas las camas ya tienen una alarma activa."); return; }
    const b = free[Math.floor(Math.random()*free.length)];
    // Solo alarmas técnicas en la simulación aleatoria; las fisiológicas
    // (hr_high, apnea) representan un evento real del paciente, no un
    // disparo aleatorio de demo.
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
    // Contexto y síntoma
    $("sm-pContexto").textContent = info.contexto;
    $("sm-pSintoma").textContent = info.sintoma;
    // Posibles causas
    $("sm-pCausas").innerHTML = info.posiblesCausas.map(c=>`<li>${c}</li>`).join("");
    // Diagnóstico
    $("sm-pDiagnostico").textContent = `👉 ${info.diagnostico}`;
    // Solución — lista simple de viñetas, igual que "Posibles causas"
    $("sm-pSteps").innerHTML = info.solucion.map(s=>`<li>${s}</li>`).join("");
    // Lección clave, como cita textual igual que en la diapositiva
    $("sm-pLeccion").textContent = `"${info.leccion}"`;
    // ocultar botón de escalar en alarmas fisiológicas
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

  /* ---------- AGENDAR SERVICIO ---------- */
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

    // Guardamos el ticket en el módulo compartido (tickets.js).
    // Así el panel del técnico (tu compañera) puede leerlo.
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
    b.alarm = null;            // alarma escalada y en gestión de biomédica
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

  /* ---------- SIMULACIÓN EN TIEMPO REAL ---------- */
  function tickVitals(){
    beds.forEach(b=>{
      if(b.status==="off") return;
      const almV = b.alarm ? KB[b.alarm].vital : null;
      if(almV!=="fc") b.v.fc = clamp(b.v.fc+rnd(-2,2),58,102);
      if(almV!=="spo2") b.v.spo2 = clamp(b.v.spo2+rnd(-1,1),95,100);
      b.v.sys = clamp(b.v.sys+rnd(-2,2),104,138);
      b.v.dia = clamp(b.v.dia+rnd(-1,1),64,86);
      b.v.temp = clamp(b.v.temp+ (Math.random()-.5)*0.06, 36.1, 37.6);
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

  /* ---------- INIT / DESTROY ---------- */
  function init(){
    initBeds(); render(); clock();
    // Muestra quién está usando el panel (vendrá del login más adelante)
    $("sm-sesUsuario").textContent = `${Sesion.usuarioActual()} · ${Sesion.rolActual()}`;
    intervals.push(setInterval(clock,1000));
    intervals.push(setInterval(tickVitals,2000));
    intervals.push(setInterval(autoAlarm,15000));
    document.addEventListener("keydown", escListener);
    document.querySelectorAll("#sm-root .sm-overlay").forEach(o=>o.addEventListener("click", overlayListener));
  }
  // destroy(): útil si el menú de tu compañera "monta y desmonta" vistas
  // (SPA) en vez de navegar a otra página HTML. Sin esto, los setInterval
  // seguirían corriendo en segundo plano aunque el usuario ya no vea el
  // monitor, consumiendo recursos y pudiendo lanzar errores si el DOM
  // de #sm-root ya no existe.
  function destroy(){
    intervals.forEach(clearInterval);
    intervals = [];
    document.removeEventListener("keydown", escListener);
  }
  function escListener(e){ if(e.key==="Escape") closeAll(); }
  function overlayListener(e){ if(e.target===e.currentTarget) closeAll(); }

  /* ---------- API pública (usada también por los onclick del HTML) ---------- */
  return {
    init, destroy,
    openProto, resolveAlarm,
    openSchedule, backToProto, confirmSchedule, finishTicket,
    closeAll, triggerRandom
  };
})();
