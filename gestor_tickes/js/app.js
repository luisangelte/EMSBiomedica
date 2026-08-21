// js/app.js - Lógica del Gestor Técnico Biomédico
// Verifica sesión (mismo esquema que el resto de paneles).
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (!rolGuardado) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html";
    }
})();

const API = "/api/tickets";
let pestanaActual = 'activos'; // 'activos' o 'historial'
let ticketSeleccionadoId = null;
let ticketsCache = [];

document.addEventListener('DOMContentLoaded', () => {
    inicializarReloj();
    mostrarUsuario();
    cargarTickets();
    setInterval(cargarTickets, 5000); // refresco periódico, por si enfermería crea un ticket nuevo
});

function inicializarReloj() {
    const clockElement = document.getElementById('clock');
    if (!clockElement) return;
    const actualizar = () => {
        clockElement.textContent = new Date().toLocaleTimeString('es-CO', {
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        });
    };
    actualizar();
    setInterval(actualizar, 1000);
}

function mostrarUsuario() {
    const nombre = localStorage.getItem("userNombre") || "Personal técnico";
    const elNombre = document.querySelector(".user-name");
    if (elNombre) elNombre.textContent = nombre;
}

// 1. Cargar tickets desde el backend (compartido con enfermería)
async function cargarTickets() {
    try {
        const respuesta = await fetch(API);
        ticketsCache = await respuesta.json();
        actualizarMetricas(ticketsCache);
        renderizarTabla(filtrarPorPestana(ticketsCache));
    } catch (error) {
        console.error("Error cargando tickets:", error);
    }
}

function filtrarPorPestana(tickets) {
    return pestanaActual === 'historial'
        ? tickets.filter(t => t.estado === 'Resuelto')
        : tickets.filter(t => t.estado !== 'Resuelto');
}

// 2. Renderizar tabla
function renderizarTabla(tickets) {
    const tbody = document.getElementById('tabla-tickets-body');
    if (!tbody) return;

    if (!tickets || tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#64748b;">No hay tickets en esta sección.</td></tr>`;
        return;
    }

    tbody.innerHTML = tickets.map(ticket => {
        const camaTexto = ticket.cama ? `Cama ${ticket.cama}` : 'Cama N/A';
        const estadoTexto = ticket.estado || 'Pendiente';
        const badgeEstado = estadoTexto === 'Resuelto' ? 'badge-ok' : (estadoTexto === 'En Atención' ? 'badge-proceso' : 'badge-pendiente');
        const equipoTexto = ticket.equipo || 'Equipo Biomédico';
        const fallaTexto = ticket.alarma || ticket.sintoma || 'Falla reportada';
        const protocoloTexto = ticket.diagnostico || 'N/A';
        const areaTexto = ticket.sala || ticket.contexto || '';

        const accion = estadoTexto === 'Resuelto'
            ? `<span style="color:#4ad66d">✓ Ver detalle</span>`
            : `<button class="btn btn-solucionar" onclick="abrirModalTicket('${ticket.id}')">Gestionar</button>`;

        return `
            <tr>
                <td data-label="TICKET"><span class="ticket-clickable-id" style="cursor:pointer;" onclick="abrirModalTicket('${ticket.id}')">#${ticket.id}</span></td>
                <td data-label="UBICACIÓN / CAMA">
                    <span class="cama-title">${camaTexto}</span>
                    ${areaTexto ? `<br><small style="color:#64748b;">${areaTexto}</small>` : ''}
                </td>
                <td data-label="EQUIPO BIOMÉDICO"><span>${equipoTexto}</span></td>
                <td data-label="FALLA REPORTADA"><div class="desc-protocolo">${fallaTexto}</div></td>
                <td data-label="INTENTOS ENFERMERÍA"><div class="desc-protocolo">${protocoloTexto}</div></td>
                <td data-label="ESTADO"><span class="badge ${badgeEstado}">${estadoTexto}</span></td>
                <td data-label="ACCIÓN">${accion}</td>
            </tr>
        `;
    }).join('');
}

// 3. Cambiar pestañas
function cambiarPestana(pestana) {
    pestanaActual = pestana;
    document.getElementById('tab-activos').classList.toggle('active', pestana === 'activos');
    document.getElementById('tab-historial').classList.toggle('active', pestana === 'historial');
    renderizarTabla(filtrarPorPestana(ticketsCache));
}

// 4. Abrir modal de detalle/gestión
function abrirModalTicket(id) {
    ticketSeleccionadoId = id;
    const ticket = ticketsCache.find(t => t.id === id);
    if (!ticket) return;

    document.getElementById('modal-ticket-id').textContent = `#${ticket.id}`;
    document.getElementById('modal-cama').textContent = `Cama ${ticket.cama}${ticket.sala ? ' (' + ticket.sala + ')' : ''}`;
    document.getElementById('modal-equipo').textContent = ticket.equipo || '-';
    document.getElementById('modal-falla').textContent = ticket.alarma || ticket.sintoma || '-';
    document.getElementById('modal-protocolo').textContent = ticket.diagnostico || '-';
    document.getElementById('modal-estado-select').value = ticket.estado || 'Pendiente';
    document.getElementById('modal-comentario').value = '';

    const contenedorComentarios = document.getElementById('modal-comentarios-lista');
    contenedorComentarios.innerHTML = '';
    if (ticket.comentarios && ticket.comentarios.length > 0) {
        ticket.comentarios.forEach(c => {
            const div = document.createElement('div');
            div.className = 'comment-item';
            div.innerHTML = `<div>${c.texto}</div><div class="comment-date">${c.fecha || ''}</div>`;
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

// 5. Guardar cambios del técnico (estado + comentario) contra el backend
async function guardarCambiosModal() {
    if (!ticketSeleccionadoId) return;
    const nuevoEstado = document.getElementById('modal-estado-select').value;
    const nuevoComentario = document.getElementById('modal-comentario').value.trim();

    try {
        await fetch(`${API}/${ticketSeleccionadoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado, comentario: nuevoComentario })
        });
        cerrarModal();
        cargarTickets();
    } catch (err) {
        console.error("Error guardando cambios del ticket:", err);
    }
}

function actualizarMetricas(tickets) {
    const elTotal = document.getElementById('num-total');
    const elCriticas = document.getElementById('num-criticas');
    const elResueltos = document.getElementById('num-resueltos');
    if (elTotal) elTotal.textContent = tickets.length;
    if (elCriticas) elCriticas.textContent = tickets.filter(t => t.estado !== 'Resuelto').length;
    if (elResueltos) elResueltos.textContent = tickets.filter(t => t.estado === 'Resuelto').length;
}
