// Verifica sesión (mismo esquema que el resto de paneles).
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (!rolGuardado) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html";
    }
})();

const API_URL = "/api/admin";

// ==========================================
// NAVEGACIÓN ENTRE PESTAÑAS
// ==========================================
function switchTab(nombre) {
    document.querySelectorAll(".tab-content").forEach(sec => sec.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));

    const seccion = document.getElementById("tab-" + nombre);
    if (seccion) seccion.classList.add("active");

    const boton = Array.from(document.querySelectorAll(".nav-btn")).find(
        b => b.getAttribute("onclick") === `switchTab('${nombre}')`
    );
    if (boton) boton.classList.add("active");

    // En celular, el menú se abre encima del contenido; ciérralo al elegir.
    const nav = document.getElementById("nav-admin");
    if (nav) nav.classList.remove("open");

    if (nombre === "dashboard") cargarDashboard();
    if (nombre === "usuarios") obtenerUsuarios();
    if (nombre === "equipos") obtenerEquipos();
}

// ==========================================
// DASHBOARD
// ==========================================
async function cargarDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        // IDs reales del HTML: kpi-online, kpi-alarmas, kpi-tickets
        const elOnline = document.getElementById("kpi-online");
        const elAlarmas = document.getElementById("kpi-alarmas");
        const elTickets = document.getElementById("kpi-tickets");
        if (elOnline) elOnline.textContent = data.camasOnline;
        if (elAlarmas) elAlarmas.textContent = data.camasAlarma;
        if (elTickets) elTickets.textContent = data.ticketsActivos;

        actualizarGraficos(data);
    } catch (err) {
        console.error("Error cargando métricas del dashboard:", err);
    }
}

// Alimenta el donut de disponibilidad y las barras del panel visual
// con los datos reales del backend (no son valores decorativos).
function actualizarGraficos(data) {
    const total = data.totalCamas || 0;
    const online = data.camasOnline || 0;
    const alarma = data.camasAlarma || 0;
    const tickets = data.ticketsActivos || 0;
    const pctOnline = total > 0 ? Math.round((online / total) * 100) : 0;

    const donut = document.getElementById("donut-camas");
    if (donut) {
        donut.style.setProperty("--pct", pctOnline);
        donut.setAttribute("data-label", pctOnline + "%");
    }

    const barOnline = document.getElementById("bar-online");
    const barOnlineLabel = document.getElementById("bar-online-label");
    if (barOnline) barOnline.style.width = pctOnline + "%";
    if (barOnlineLabel) barOnlineLabel.textContent = `${online} / ${total}`;

    // Las barras de alarma y tickets se muestran en proporción a un
    // techo razonable (el total de camas), solo como referencia visual.
    const barAlarma = document.getElementById("bar-alarma");
    const barAlarmaLabel = document.getElementById("bar-alarma-label");
    const pctAlarma = total > 0 ? Math.min(100, Math.round((alarma / total) * 100)) : 0;
    if (barAlarma) barAlarma.style.width = pctAlarma + "%";
    if (barAlarmaLabel) barAlarmaLabel.textContent = alarma;

    const barTickets = document.getElementById("bar-tickets");
    const barTicketsLabel = document.getElementById("bar-tickets-label");
    const pctTickets = Math.min(100, tickets * 20); // referencia: 5+ tickets = barra llena
    if (barTickets) barTickets.style.width = pctTickets + "%";
    if (barTicketsLabel) barTicketsLabel.textContent = tickets;
}

// ==========================================
// USUARIOS Y ROLES
// ==========================================
async function obtenerUsuarios() {
    try {
        const res = await fetch(`${API_URL}/usuarios`);
        const usuarios = await res.json();
        const tbody = document.getElementById("tabla-usuarios");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => {
            const esPendiente = u.estado === "Pendiente";
            const colorEstado = esPendiente ? "#ffb703" : "#4ad66d";
            const botonAccion = esPendiente
                ? `<button style="background:#4ad66d; color:#090f1d; padding:6px 12px; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="autorizarRegistro(${u.id})">Aprobar</button>`
                : `<button style="background:#334155; color:#94a3b8; padding:6px 12px; border:none; border-radius:4px; cursor:default;" disabled>Activo</button>`;

            return `
                <tr>
                    <td>USR-${u.id}</td>
                    <td><strong>${u.nombre}</strong></td>
                    <td><span style="color:#00d2ff">${u.rol}</span></td>
                    <td style="color:${colorEstado}; font-weight:bold;">${u.estado}</td>
                    <td>${botonAccion}</td>
                </tr>
            `;
        }).join("");
    } catch (err) { console.error("Error cargando usuarios:", err); }
}

async function autorizarRegistro(id) {
    try {
        const res = await fetch(`${API_URL}/usuarios/aprobar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const data = await res.json();
        if (res.ok) { obtenerUsuarios(); }
        else { alert(data.mensaje); }
    } catch (err) { console.error("Error al autorizar:", err); }
}

async function agregarNuevoUsuario(event) {
    event.preventDefault();
    const nombre = document.getElementById("usr-nombre").value.trim();
    const rol = document.getElementById("usr-rol").value;
    if (!nombre || !rol) return;

    try {
        const res = await fetch(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, rol })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            document.getElementById("form-usuario").reset();
            obtenerUsuarios();
        } else {
            alert(data.mensaje || "No se pudo registrar el usuario.");
        }
    } catch (err) { console.error("Error registrando usuario:", err); }
}

// ==========================================
// INVENTARIO DE EQUIPOS
// ==========================================
async function obtenerEquipos() {
    try {
        const res = await fetch(`${API_URL}/equipos`);
        const equipos = await res.json();
        const tbody = document.getElementById("tabla-equipos");
        if (!tbody) return;

        tbody.innerHTML = equipos.map(e => `
            <tr>
                <td>EQ-${e.id}</td>
                <td>${e.modelo}</td>
                <td>${e.serie}</td>
                <td>${e.ubicacion}</td>
                <td>${e.mantenimiento}</td>
            </tr>
        `).join("");
    } catch (err) { console.error("Error cargando equipos:", err); }
}

// ==========================================
// INICIALIZADOR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    cargarDashboard();
    obtenerUsuarios();
    obtenerEquipos();
});
