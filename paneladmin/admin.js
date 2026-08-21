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
    } catch (err) {
        console.error("Error cargando métricas del dashboard:", err);
    }
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
