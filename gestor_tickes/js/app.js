// js/app.js - Lógica Avanzada del Gestor Técnico Biomédico

let pestanaActual = 'activos'; // 'activos' o 'historial'
let ticketSeleccionadoId = null;

document.addEventListener('DOMContentLoaded', () => {
    inicializarReloj();
    cargarTickets();
});

function inicializarReloj() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;

    const actualizar = () => {
        const ahora = new Date();
        clockElement.textContent = ahora.toLocaleTimeString('es-CO', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
        });
    };
    actualizar();
    setInterval(actualizar, 1000);
}

// 1. Cargar tickets desde localStorage
function renderizarTablaTickets(tickets) {

tbody.innerHTML = tickets.map(ticket => {
        const idTicket = ticket.id || ticket.codigo || 'TK-000';
        const camaTexto = ticket.cama ? (String(ticket.cama).toLowerCase().includes('cama') ? ticket.cama : `Cama ${ticket.cama}`) : 'Cama N/A';
        const estadoTexto = ticket.estado || 'Pendiente';
        const equipoTexto = ticket.equipo || 'Equipo Biomédico';
        const fallaTexto = ticket.falla || ticket.sintoma || 'Falla reportada';
        const protocoloTexto = ticket.protocolo || ticket.diagnostico || 'N/A';
        const areaTexto = ticket.area || ticket.contexto || '';

        return `
            <tr>
                <td data-label="TICKET">
                    <span class="ticket-clickable-id" style="cursor:pointer;" onclick="abrirModalTicket('${idTicket}')">#${idTicket}</span>
                </td>
                <td data-label="UBICACIÓN / CAMA">
                    <span class="cama-title">${camaTexto}</span>
                    ${areaTexto ? `<br><small style="color:#64748b;">${areaTexto}</small>` : ''}
                </td>
                <td data-label="EQUIPO BIOMÉDICO">
                    <span>${equipoTexto}</span>
                </td>
                <td data-label="FALLA REPORTADA">
                    <div class="desc-protocolo">${fallaTexto}</div>
                </td>
                <td data-label="INTENTOS ENFERMERÍA">
                    <div class="desc-protocolo">${protocoloTexto}</div>
                </td>
                <td data-label="ESTADO">
                    <span class="badge">${estadoTexto}</span>
                </td>
                <td data-label="ACCIÓN">
                    <button class="btn btn-solucionar" onclick="abrirModalTicket('${idTicket}')">Gestionar</button>
                </td>
            </tr>
        `;
    }).join('');
    }
    
async function cargarTickets() {
    try {
        const respuesta = await fetch('http://192.168.1.6:3000/api/admin/tickets'); // Tu API de administración
        const tickets = await respuesta.json();
        
        // 1. Renderiza la tabla con los datos
        renderizarTablaTickets(tickets); 
        
        // 2. Aquí es donde DEBE ir la función para actualizar los números superiores del dashboard
        actualizarContadores(tickets); 

    } catch (error) {
        console.error("Error cargando tickets:", error);
    }
}


// Función auxiliar para actualizar contadores
function actualizarContadores(tickets) {
    const totalEl = document.getElementById('total-tickets') || document.querySelector('.metric-value');
    if (totalEl) totalEl.textContent = tickets.length;
}

// Ejecutar automáticamente al cargar la página
document.addEventListener('DOMContentLoaded', cargarTickets);

// 2. Renderizar tabla filtrada según la pestaña activa
function renderizarTabla(tickets) {
    const tbody = document.getElementById('tabla-tickets-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    /// Reemplaza desde if (!ticketsFiltrados... hasta .join('');

if (!ticketsFiltrados || ticketsFiltrados.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No hay tickets en esta sección.</td></tr>`;
    return;
}

tbody.innerHTML = ticketsFiltrados.map(ticket => {
    // Manejo ultra seguro de datos
    const idTicket = ticket.id || ticket.codigo || 'TK-000';
    const camaTexto = ticket.cama ? (String(ticket.cama).toLowerCase().includes('cama') ? ticket.cama : `Cama ${ticket.cama}`) : 'Cama N/A';
    const estadoTexto = ticket.estado || 'Pendiente';
    const equipoTexto = ticket.equipo || 'Equipo Biomédico';
    const fallaTexto = ticket.falla || 'Falla reportada';
    const protocoloTexto = ticket.protocolo || 'N/A';
    const areaTexto = ticket.area || '';

    return `
        <tr>
            <td data-label="TICKET">
                <span class="ticket-clickable-id">#${idTicket}</span>
            </td>
            <td data-label="UBICACIÓN / CAMA">
                <span class="cama-title">${camaTexto}</span>
                ${areaTexto ? `<br><small style="color:#64748b;">${areaTexto}</small>` : ''}
            </td>
            <td data-label="EQUIPO BIOMÉDICO">
                <span>${equipoTexto}</span>
            </td>
            <td data-label="FALLA REPORTADA">
                <div class="desc-protocolo">${fallaTexto}</div>
            </td>
            <td data-label="INTENTOS ENFERMERÍA">
                <div class="desc-protocolo">${protocoloTexto}</div>
            </td>
            <td data-label="ESTADO">
                <span class="badge">${estadoTexto}</span>
            </td>
            <td data-label="ACCIÓN">
                <button class="btn btn-solucionar" onclick="typeof abrirModalGestion === 'function' ? abrirModalGestion('${idTicket}') : null">Gestionar</button>
            </td>
        </tr>
    `;
}).join('');

    ticketsFiltrados.forEach(ticket => {
        const tr = document.createElement('tr');
        tr.onclick = () => abrirModal(ticket.id); // Clic en cualquier parte de la fila para abrir detalles

        const badgeFalla = ticket.fallaTipo === 'critica' ? 'badge-alarma-critica' : (ticket.fallaTipo === 'warning' ? 'badge-alarma-warning' : 'badge-alarma-off');
        const badgeEstado = ticket.estado === 'Resuelto' ? 'badge-ok' : (ticket.estado === 'En Atención' ? 'badge-proceso' : 'badge-pendiente');

        const accion = ticket.estado === 'Resuelto' 
            ? `<span class="text-ok">✓ Ver Detalle</span>`
            : `<button class="btn btn-solucionar" onclick="event.stopPropagation(); abrirModal('${ticket.id}')">Gestionar</button>`;

        tr.innerHTML = `
            <td><strong class="ticket-clickable-id">#${ticket.id}</strong></td>
            <span class="cama-title">
            ${String(ticket.cama).toLowerCase().includes('cama') ? ticket.cama : `Cama ${ticket.cama}`}
            </span>
            <td><span class="badge badge-equipo">${ticket.equipo}</span></td>
            <td><span class="badge ${badgeFalla}">${ticket.falla}</span></td>
            <td><small class="desc-protocolo">${ticket.protocolo}</small></td>
            <td><span class="badge ${badgeEstado}">${ticket.estado}</span></td>
            <td>${accion}</td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Cambiar Pestañas
function cambiarPestana(pestana) {
    pestanaActual = pestana;
    document.getElementById('tab-activos').classList.toggle('active', pestana === 'activos');
    document.getElementById('tab-historial').classList.toggle('active', pestana === 'historial');
    
    const tickets = JSON.parse(localStorage.getItem('simeb_tickets')) || [];
    renderizarTabla(tickets);
}

// 4. Abrir y Cargar Modal de Detalles
function abrirModal(id) {
    ticketSeleccionadoId = id;
    const tickets = JSON.parse(localStorage.getItem('simeb_tickets')) || [];
    const ticket = tickets.find(t => t.id === id);

    if (!ticket) return;

    document.getElementById('modal-ticket-id').textContent = `#${ticket.id}`;
    document.getElementById('modal-cama').textContent = `${ticket.cama} (${ticket.area})`;
    document.getElementById('modal-equipo').textContent = ticket.equipo;
    document.getElementById('modal-falla').textContent = ticket.falla;
    document.getElementById('modal-protocolo').textContent = ticket.protocolo;
    document.getElementById('modal-estado-select').value = ticket.estado;
    document.getElementById('modal-comentario').value = '';

    // Renderizar comentarios guardados
    const contenedorComentarios = document.getElementById('modal-comentarios-lista');
    contenedorComentarios.innerHTML = '';
    
    if (ticket.comentarios && ticket.comentarios.length > 0) {
        ticket.comentarios.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `<div>${c.texto || c}</div><div class="comment-date">${c.fecha || ''}</div>`;
            contenedorComentarios.appendChild(div);
        });
    } else {
        contenedorComentarios.innerHTML = `<p class="text-muted" style="margin:0; color:#64748b;">Sin comentarios registrados.</p>`;
    }

    document.getElementById('modal-ticket').classList.add('open');
}

function cerrarModal() {
    document.getElementById('modal-ticket').classList.remove('open');
    ticketSeleccionadoId = null;
}

// 5. Guardar Cambios desde el Modal
function guardarCambiosModal() {
    if (!ticketSeleccionadoId) return;

    let tickets = JSON.parse(localStorage.getItem('simeb_tickets')) || [];
    const nuevoEstado = document.getElementById('modal-estado-select').value;
    const nuevoComentario = document.getElementById('modal-comentario').value.trim();

    tickets = tickets.map(t => {
        if (t.id === ticketSeleccionadoId) {
            t.estado = nuevoEstado;
            
            if (!t.comentarios) t.comentarios = [];
            
            if (nuevoComentario !== '') {
                const fecha = new Date().toLocaleString('es-CO');
                t.comentarios.push({ texto: nuevoComentario, fecha: fecha });
            }
        }
        return t;
    });

    localStorage.setItem('simeb_tickets', JSON.stringify(tickets));
    cerrarModal();
    cargarTickets(); // Recarga la tabla y contadores dinámicamente
}

function actualizarMetricas(tickets) {
    const elTotal = document.getElementById('num-total');
    const elCriticas = document.getElementById('num-criticas');
    const elResueltos = document.getElementById('num-resueltos');

    if (elTotal) elTotal.textContent = tickets.length;
    if (elCriticas) elCriticas.textContent = tickets.filter(t => t.estado !== 'Resuelto').length;
    if (elResueltos) elResueltos.textContent = tickets.filter(t => t.estado === 'Resuelto').length;
}
// Detecta cuando la enfermera crea un ticket nuevo en otra pestaña
window.addEventListener('storage', (event) => {
    if (event.key === 'simeb_tickets') {
        cargarTickets(); // Actualiza la tabla y métricas en vivo
    }
});

// Detecta de inmediato cuando enfermería guarda un nuevo ticket en localStorage
window.addEventListener('storage', (event) => {
    if (event.key === 'simeb_tickets') {
        cargarTickets(); // Vuelve a leer y dibuja la lista actualizada
    }
});
