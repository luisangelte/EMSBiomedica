// Verifica sesión (mismo esquema que el resto de paneles).
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (rolGuardado !== "Admin") {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html";
    }
})();

const API_URL = "/api/admin";
const chartes = {};

async function solicitar(url, opciones) {
    const respuesta = await fetch(url, opciones);
    const data = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok || data.success === false) {
        throw new Error(data.mensaje || "No se pudo completar la operación.");
    }
    return data;
}

// ==========================================
// NAVEGACIÓN ENTRE PESTAÑAS
// ==========================================
function switchTab(nombre) {
    pestanaAdminActual = nombre;
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
    const nombres = { dashboard: "Datos clínicos y operativos en vivo", usuarios: "Usuarios y roles", equipos: "Equipos médicos", enfermeria: "Central de enfermería", tecnico: "Gestión técnica" };
    const titulo = document.getElementById("topbar-seccion");
    if (titulo) titulo.textContent = nombres[nombre] || "Consola administrativa";
}

function cerrarSesionAdmin() {
    localStorage.removeItem("userRol");
    localStorage.removeItem("userNombre");
    window.location.href = "../index.html";
}

function toggleProfileMenu() {
    const menu = document.getElementById("profile-menu");
    const trigger = document.getElementById("profile-trigger");
    if (!menu || !trigger) return;
    const abierto = !menu.hidden;
    menu.hidden = abierto;
    trigger.setAttribute("aria-expanded", String(!abierto));
}

function toggleEditMode() {
    const activo = document.body.classList.toggle("admin-edit-mode");
    const label = document.getElementById("edit-mode-label");
    const badge = document.getElementById("admin-mode");
    if (label) label.textContent = activo ? "Desactivar modo de gestión" : "Activar modo de gestión";
    if (badge) badge.textContent = activo ? "Modo gestión activo" : "Modo consulta";
    aplicarModoGestion(activo);
    toggleProfileMenu();
}

function aplicarModoGestion(activo) {
    document.querySelectorAll("#form-usuario input, #form-usuario select, #form-usuario button").forEach(control => {
        control.disabled = !activo;
    });
    document.querySelectorAll("#tabla-usuarios button[data-management-action]").forEach(control => {
        control.disabled = !activo;
    });
}

function goToCreateUser() {
    if (!document.body.classList.contains("admin-edit-mode")) toggleEditMode();
    switchTab("usuarios");
    if (!document.getElementById("profile-menu").hidden) toggleProfileMenu();
    const input = document.getElementById("usr-nombre");
    if (input) setTimeout(() => input.focus(), 0);
}

function refreshCurrentView() {
    if (pestanaAdminActual === "dashboard") cargarDashboard();
    if (pestanaAdminActual === "usuarios") obtenerUsuarios();
    if (pestanaAdminActual === "equipos") obtenerEquipos();
    toggleProfileMenu();
}

function integrarVista(frame, modulo) {
    try {
        const documento = frame.contentDocument;
        if (!documento || documento.getElementById("admin-integrated-style")) return;
        const estilos = documento.createElement("style");
        estilos.id = "admin-integrated-style";
        estilos.textContent = modulo === "enfermeria"
            ? `html, body { width: 100% !important; margin: 0 !important; padding: 0 !important; background: transparent !important; overflow: visible !important; } #sm-root { min-height: auto !important; background: transparent !important; } #sm-root .sm-header { position: static !important; padding: 12px 0 14px !important; background: transparent !important; border-bottom: 1px solid var(--sm-line-soft) !important; } #sm-root .sm-main { max-width: none !important; padding: 16px 0 30px !important; } #sm-root .sm-grid { gap: 12px !important; } #sm-root .sm-bed { border-radius: 12px !important; padding: 13px !important; }`
            : `html, body { width: 100% !important; margin: 0 !important; padding: 0 !important; background: transparent !important; } body { padding: 0 !important; } .app-container { max-width: none !important; } .header, .content-card { box-shadow: none !important; }`;
        documento.head.appendChild(estilos);
        const ajustarAltura = () => {
            const altura = Math.max(documento.documentElement.scrollHeight, documento.body?.scrollHeight || 0);
            frame.style.height = `${altura}px`;
        };
        ajustarAltura();
        window.requestAnimationFrame(ajustarAltura);
        if (window.ResizeObserver) {
            const observador = new ResizeObserver(ajustarAltura);
            observador.observe(documento.documentElement);
            if (documento.body) observador.observe(documento.body);
        }
    } catch (error) {
        console.warn("No se pudo integrar la vista interna:", error);
    }
}

let pestanaAdminActual = "dashboard";

// ==========================================
// DASHBOARD
// ==========================================
async function cargarDashboard() {
    try {
        const [data, camas, tickets] = await Promise.all([
            solicitar(`${API_URL}/dashboard`),
            solicitar("/api/monitoreo"),
            solicitar("/api/tickets")
        ]);
        // IDs reales del HTML: kpi-online, kpi-alarmas, kpi-tickets
        const elOnline = document.getElementById("kpi-online");
        const elAlarmas = document.getElementById("kpi-alarmas");
        const elTickets = document.getElementById("kpi-tickets");
        if (elOnline) elOnline.textContent = data.camasOnline;
        if (elAlarmas) elAlarmas.textContent = data.camasAlarma;
        if (elTickets) elTickets.textContent = data.ticketsActivos;
        renderizarGraficos(camas, tickets);
        renderizarMonitoreo(camas);
        const actualizado = document.getElementById("ultima-actualizacion");
        if (actualizado) actualizado.textContent = `Actualizado ${new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`;
    } catch (err) {
        console.error("Error cargando métricas del dashboard:", err);
        document.querySelectorAll("#kpi-online, #kpi-alarmas, #kpi-tickets").forEach(el => el.textContent = "--");
    }
}

function colorEstadoCama(estado) {
    return { estable: "#34d399", advertencia: "#fbbf24", critico: "#ff3b5c", "sin-conexion": "#7e8b9c" }[estado] || "#7e8b9c";
}

function etiquetaEstado(estado) {
    return { estable: "Estable", advertencia: "Advertencia", critico: "Crítica", "sin-conexion": "Sin conexión" }[estado] || estado;
}

function actualizarGrafico(id, configuracion) {
    if (!window.Chart) return;
    const canvas = document.getElementById(id);
    if (!canvas) return;
    if (chartes[id]) chartes[id].destroy();
    chartes[id] = new Chart(canvas, configuracion);
}

function renderizarGraficos(camas, tickets) {
    const estadosCama = ["estable", "advertencia", "critico", "sin-conexion"];
    const estadosTicket = ["Pendiente", "En Atención", "Resuelto"];
    const contar = (lista, valor, propiedad = "estado") => lista.filter(item => item[propiedad] === valor).length;
    const opcionesBase = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: "#b7c3d4", usePointStyle: true, padding: 18 } } } };

    actualizarGrafico("chart-camas", {
        type: "doughnut",
        data: { labels: estadosCama.map(etiquetaEstado), datasets: [{ data: estadosCama.map(estado => contar(camas, estado)), backgroundColor: estadosCama.map(colorEstadoCama), borderColor: "#151c26", borderWidth: 4, hoverOffset: 8 }] },
        options: { ...opcionesBase, cutout: "70%" }
    });
    actualizarGrafico("chart-tickets", {
        type: "bar",
        data: { labels: estadosTicket.map(etiquetaEstado), datasets: [{ label: "Tickets", data: estadosTicket.map(estado => contar(tickets, estado)), backgroundColor: ["#fbbf24", "#5b8def", "#34d399"], borderRadius: 6, maxBarThickness: 42 }] },
        options: { ...opcionesBase, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: "#7e8b9c" }, grid: { display: false } }, y: { beginAtZero: true, ticks: { color: "#7e8b9c", precision: 0 }, grid: { color: "rgba(126,139,156,.14)" } } } }
    });
    const online = camas.filter(cama => cama.estado !== "sin-conexion");
    const promedio = campo => online.length ? Math.round(online.reduce((suma, cama) => suma + Number(cama[campo] || 0), 0) / online.length) : 0;
    actualizarGrafico("chart-vitales", {
        type: "bar",
        data: { labels: ["Frecuencia cardiaca", "Frecuencia respiratoria"], datasets: [{ label: "Promedio", data: [promedio("fc"), promedio("fr")], backgroundColor: ["#5b8def", "#22d3ee"], borderRadius: 6, maxBarThickness: 52 }] },
        options: { ...opcionesBase, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { color: "#7e8b9c", precision: 0 }, grid: { color: "rgba(126,139,156,.14)" } }, y: { ticks: { color: "#b7c3d4" }, grid: { display: false } } } }
    });
}

function renderizarMonitoreo(camas) {
    const tbody = document.getElementById("tabla-monitoreo");
    if (!tbody) return;
    tbody.innerHTML = camas.map(cama => `<tr><td><strong>${textoSeguro(cama.nombre)}</strong></td><td>${textoSeguro(cama.paciente)}</td><td><span class="status-pill" style="--status-color:${colorEstadoCama(cama.estado)}">${etiquetaEstado(cama.estado)}</span></td><td class="mono-value">${cama.estado === "sin-conexion" ? "--" : textoSeguro(cama.fc)}</td><td class="mono-value">${cama.estado === "sin-conexion" ? "--" : textoSeguro(cama.fr)}</td></tr>`).join("");
    const resumen = document.getElementById("resumen-camas");
    if (resumen) resumen.textContent = `${camas.filter(cama => cama.estado !== "estable").length} requieren atención`;
}

function textoSeguro(valor) {
    const contenedor = document.createElement("span");
    contenedor.textContent = valor ?? "--";
    return contenedor.innerHTML;
}

// ==========================================
// USUARIOS Y ROLES
// ==========================================
async function obtenerUsuarios() {
    try {
        const usuarios = await solicitar(`${API_URL}/usuarios`);
        const tbody = document.getElementById("tabla-usuarios");
        if (!tbody) return;

        tbody.innerHTML = usuarios.map(u => {
            const esPendiente = u.estado === "Pendiente";
            const colorEstado = esPendiente ? "#ffb703" : "#4ad66d";
            const botonAccion = esPendiente
                ? `<button data-management-action style="background:#4ad66d; color:#090f1d; padding:6px 12px; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="autorizarRegistro(${u.id})">Aprobar</button>`
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
    } catch (err) {
        console.error("Error cargando usuarios:", err);
        mostrarErrorTabla("tabla-usuarios", "No se pudieron cargar los usuarios.", 5);
    }
}

async function autorizarRegistro(id) {
    try {
        const data = await solicitar(`${API_URL}/usuarios/aprobar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        alert(data.mensaje || "Acceso activado correctamente.");
        obtenerUsuarios();
    } catch (err) {
        console.error("Error al autorizar:", err);
        alert(err.message);
    }
}

async function agregarNuevoUsuario(event) {
    event.preventDefault();
    const nombre = document.getElementById("usr-nombre").value.trim();
    const rol = document.getElementById("usr-rol").value;
    if (!nombre || !rol) return;

    try {
        const data = await solicitar(`${API_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, rol })
        });
        document.getElementById("form-usuario").reset();
        alert(`Usuario creado: ${data.usuario.usuario}`);
        obtenerUsuarios();
    } catch (err) {
        console.error("Error registrando usuario:", err);
        alert(err.message || "No se pudo registrar el usuario.");
    }
}

// ==========================================
// INVENTARIO DE EQUIPOS
// ==========================================
async function obtenerEquipos() {
    try {
        const equipos = await solicitar(`${API_URL}/equipos`);
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
    } catch (err) {
        console.error("Error cargando equipos:", err);
        mostrarErrorTabla("tabla-equipos", "No se pudo cargar el inventario.", 5);
    }
}

function mostrarErrorTabla(id, mensaje, columnas) {
    const tbody = document.getElementById(id);
    if (tbody) tbody.innerHTML = `<tr><td colspan="${columnas}">${mensaje}</td></tr>`;
}

// ==========================================
// INICIALIZADOR
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const nombre = localStorage.getItem("userNombre") || "Administrador";
    const rol = localStorage.getItem("userRol") || "Admin";
    document.getElementById("profile-name").textContent = nombre;
    document.getElementById("menu-user-name").textContent = nombre;
    document.getElementById("profile-role").textContent = rol + " del sistema";
    document.getElementById("profile-avatar").textContent = nombre.split(/\s+/).map(parte => parte[0]).join("").slice(0, 2).toUpperCase();
    aplicarModoGestion(false);
    cargarDashboard();
    obtenerUsuarios();
    obtenerEquipos();
    setInterval(cargarDashboard, 5000);
    document.addEventListener("click", event => {
        const menu = document.getElementById("profile-menu");
        const contenedor = document.querySelector(".profile-menu-wrap");
        if (menu && contenedor && !contenedor.contains(event.target)) {
            menu.hidden = true;
            document.getElementById("profile-trigger")?.setAttribute("aria-expanded", "false");
        }
    });
});
