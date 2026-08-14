const API_URL = "http://192.168.1.6:3000/api/admin";

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabName === 'dashboard') obtenerDashboard();
    if (tabName === 'usuarios') obtenerUsuarios();
    if (tabName === 'equipos') obtenerEquipos();
}

async function obtenerDashboard() {
    try {
        const res = await fetch(`${API_URL}/dashboard`);
        const data = await res.json();
        document.getElementById("kpi-online").textContent = `${data.camasOnline} / ${data.totalCamas}`;
        document.getElementById("kpi-alarmas").textContent = data.camasAlarma;
        document.getElementById("kpi-tickets").textContent = data.ticketsActivos;
    } catch (err) { console.error(err); }
}

async function obtenerUsuarios() {
    try {
        const res = await fetch(`${API_URL}/usuarios`);
        const usuarios = await res.json();
        const tbody = document.getElementById("tabla-usuarios");
        
        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>USR-${u.id}</td>
                <td><strong>${u.nombre}</strong></td>
                <td><span style="color:var(--accent-blue)">${u.rol}</span></td>
                <td style="color:#4ad66d">${u.estado}</td>
                <td><button class="btn-delete" onclick="borrarUsuario(${u.id})">Remover</button></td>
            </tr>
        `).join("");
    } catch (err) { console.error(err); }
}

async function agregarNuevoUsuario(e) {
    e.preventDefault();
    const nombre = document.getElementById("usr-nombre").value;
    const rol = document.getElementById("usr-rol").value;

    try {
        const res = await fetch("http://192.168.1.6:3000/api/admin/usuarios/crear", {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nombre, rol })
        });
        if(res.ok) {
            document.getElementById("form-usuario").reset();
            obtenerUsuarios(); // Recarga la tabla de usuarios
        }
    } catch (err) { console.error(err); }
}

async function borrarUsuario(id) {
    if(!confirm("¿Retirar permisos de acceso de este usuario?")) return;
    try {
        await fetch(`${API_URL}/usuarios/eliminar`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id })
        });
        obtenerUsuarios();
    } catch (err) { console.error(err); }
}

async function obtenerEquipos() {
    try {
        const res = await fetch(`${API_URL}/equipos`);
        const equipos = await res.json();
        document.getElementById("tabla-equipos").innerHTML = equipos.map(e => `
            <tr>
                <td>${e.id}</td>
                <td><strong>${e.modelo}</strong></td>
                <td>${e.serie}</td>
                <td>${e.ubicacion}</td>
                <td>📅 ${e.mantenimiento}</td>
            </tr>
        `).join("");
    } catch (err) { console.error(err); }
}

// Carga Inicial
obtenerDashboard();
setInterval(obtenerDashboard, 3000);
