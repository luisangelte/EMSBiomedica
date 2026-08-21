const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

// serialport es OPCIONAL: solo se usa si hay un Arduino físico
// conectado (por ejemplo, en la máquina del profesor). En un hosting
// en la nube (Render, Railway, etc.) puede no estar disponible o no
// tener sentido, así que si falla al cargar, seguimos sin romper el
// servidor: se activa la simulación por software automáticamente.
let SerialPort, ReadlineParser;
try {
    ({ SerialPort } = require('serialport'));
    ({ ReadlineParser } = require('@serialport/parser-readline'));
} catch (e) {
    console.log("⚠️ Módulo 'serialport' no disponible en este entorno. Se usará simulación por software.");
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Servir los archivos del Frontend de forma automática y unificada
app.use(express.static(path.join(__dirname, '..')));
app.use('/paneladmin', express.static(path.join(__dirname, '../paneladmin')));
app.use('/RolEnfermero', express.static(path.join(__dirname, '../RolEnfermero')));


const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// ==========================================
// 1. BASE DE DATOS EN MEMORIA (USUARIOS Y CAMAS)
// ==========================================
let usuariosCredenciales = [
    { id: 1, usuario: "admin@simeb.com", clave: "123456", nombre: "Luis angel", rol: "Admin", estado: "Activo" },
    { id: 2, usuario: "enfermero@simeb.com", clave: "123456", nombre: "jessica", rol: "Enfermero", estado: "Activo" },
    { id: 3, usuario: "tecnico@simeb.com", clave: "123456", nombre: "loren chacon", rol: "Técnico", estado: "Activo" }
];

let datosCamas = [
    { id: 1, nombre: "Cama 1", paciente: "Paciente 5412", fc: 75, fr: 14, estado: "estable" },
    { id: 2, nombre: "Cama 2", paciente: "Paciente 0417", fc: 80, fr: 16, estado: "estable" },
    { id: 3, nombre: "Cama 3", paciente: "Paciente 1525", fc: 0, fr: 0, estado: "sin-conexion" },
    { id: 4, nombre: "Cama 4", paciente: "Paciente 9207", fc: 68, fr: 15, estado: "estable" },
    { id: 5, nombre: "Cama 5", paciente: "Paciente 2335", fc: 72, fr: 14, estado: "estable" }
];

let inventarioEquipos = [
    { id: 101, modelo: "Philips IntelliVue MX450", serie: "PH-99201", ubicacion: "UCI-1", mantenimiento: "15/09/2026" },
    { id: 102, modelo: "GE CARESCAPE B450", serie: "GE-44102", ubicacion: "UCI-2", mantenimiento: "01/10/2026" }
];

// Tickets generados por enfermería cuando escala una alarma al técnico.
let tickets = [];
let contadorTicket = 100;

// ==========================================
// 2. CONFIGURACIÓN DE ARDUINO / SIMULACIÓN
// ==========================================
function iniciarSimulacionPorSoftware() {
    console.log("⚠️ Arduino no detectado (o no disponible en este entorno). Simulando datos por software.");
    setInterval(() => {
        datosCamas.forEach(cama => {
            if (cama.estado !== "sin-conexion" && cama.estado !== "advertencia" && cama.estado !== "critico") {
                cama.fc = 65 + Math.floor(Math.random() * 25);
                cama.fr = 12 + Math.floor(Math.random() * 6);
            }
        });
        io.emit('actualizar_monitoreo_live', datosCamas);
    }, 1500);

    // Cada cierto tiempo, con baja probabilidad, dispara una alarma
    // técnica sobre una cama libre (simula el Caso 2 sin depender
    // del hardware físico, para que la demo funcione siempre).
    setInterval(() => {
        const libres = datosCamas.filter(c => c.estado === "estable");
        if (!libres.length) return;
        if (Math.random() < 0.35) {
            const cama = libres[Math.floor(Math.random() * libres.length)];
            const tipos = ["advertencia", "advertencia", "critico"]; // ecg_lead es más frecuente que net_loss
            cama.estado = tipos[Math.floor(Math.random() * tipos.length)];
            if (cama.estado === "advertencia") cama.fc = 128 + Math.floor(Math.random() * 22);
            io.emit('actualizar_monitoreo_live', datosCamas);
        }
    }, 12000);
}

if (SerialPort) {
    const arduinoPort = new SerialPort({ path: 'COM3', baudRate: 9600, autoOpen: false });
    const parser = arduinoPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    arduinoPort.open((err) => {
        if (err) {
            iniciarSimulacionPorSoftware();
        } else {
            console.log("🔌 Conexión física establecida exitosamente con Arduino en COM3.");
            parser.on('data', (linea) => {
                try {
                    const datosHardware = JSON.parse(linea);
                    const cama = datosCamas.find(c => c.id === 1);
                    if (cama) {
                        cama.fc = datosHardware.fc;
                        cama.fr = datosHardware.fr;
                        cama.estado = (datosHardware.lecturaElectrodo === "suelto" && datosHardware.fc > 120) ? "advertencia" : "estable";
                    }
                    io.emit('actualizar_monitoreo_live', datosCamas);
                } catch (e) { console.log("Error decodificando datos del hardware."); }
            });
        }
    });
} else {
    iniciarSimulacionPorSoftware();
}

io.on('connection', (socket) => {
    socket.emit('actualizar_monitoreo_live', datosCamas);
});

// ==========================================
// 3. ENDPOINTS DE AUTENTICACIÓN
// ==========================================
app.post('/api/auth/login', (req, res) => {
    const { usuario, clave, rol } = req.body;
    const encontrado = usuariosCredenciales.find(u => u.usuario === usuario && u.clave === clave && u.rol === rol);
    
    if (!encontrado) {
        return res.status(401).json({ success: false, mensaje: "Usuario, clave o rol incorrectos." });
    }
    if (encontrado.estado === "Pendiente") {
        return res.status(403).json({ success: false, mensaje: "Tu acceso está congelado. Requiere autorización del Administrador." });
    }
    res.json({ success: true, rol: encontrado.rol, nombre: encontrado.nombre });
});

app.post('/api/auth/registrar', (req, res) => {
    const { nombre, usuario, clave, rol } = req.body;
    if (usuariosCredenciales.some(u => u.usuario === usuario)) {
        return res.status(400).json({ success: false, mensaje: "El correo ya existe." });
    }
    const nuevo = { id: usuariosCredenciales.length + 1, usuario, clave, nombre, rol, estado: "Pendiente" };
    usuariosCredenciales.push(nuevo);
    res.json({ success: true });
});

// ==========================================
// 4. ENDPOINTS CLÍNICOS Y ADMINISTRATIVOS
// ==========================================
app.get('/api/monitoreo', (req, res) => res.json(datosCamas));

// La enfermería puede forzar una alarma de prueba en una cama libre
// (botón "Simular alarma" del panel).
app.post('/api/monitoreo/:id/simular', (req, res) => {
    const cama = datosCamas.find(c => c.id === parseInt(req.params.id));
    if (!cama) return res.status(404).json({ success: false, mensaje: "Cama no encontrada." });
    if (cama.estado === "sin-conexion") return res.status(400).json({ success: false, mensaje: "Cama sin conexión." });
    if (cama.estado === "advertencia" || cama.estado === "critico") return res.status(400).json({ success: false, mensaje: "Esa cama ya tiene una alarma activa." });
    const tipos = ["advertencia", "critico"];
    cama.estado = tipos[Math.floor(Math.random() * tipos.length)];
    if (cama.estado === "advertencia") cama.fc = 128 + Math.floor(Math.random() * 22);
    io.emit('actualizar_monitoreo_live', datosCamas);
    res.json({ success: true, cama });
});

// Enfermería marca la alarma como resuelta (limpieza de electrodo,
// reinicio de red, etc.) sin necesidad de escalar al técnico.
app.post('/api/monitoreo/:id/resolver', (req, res) => {
    const cama = datosCamas.find(c => c.id === parseInt(req.params.id));
    if (!cama) return res.status(404).json({ success: false, mensaje: "Cama no encontrada." });
    cama.estado = "estable";
    io.emit('actualizar_monitoreo_live', datosCamas);
    res.json({ success: true, cama });
});

// ==========================================
// 3.1 ENDPOINTS DE TICKETS (Enfermería ↔ Técnico)
// ==========================================
app.get('/api/tickets', (req, res) => res.json(tickets));

app.post('/api/tickets', (req, res) => {
    const d = req.body || {};
    contadorTicket++;
    const nuevo = {
        id: "TK-" + contadorTicket,
        cama: d.cama, sala: d.sala, equipo: d.equipo,
        alarma: d.alarma, contexto: d.contexto, sintoma: d.sintoma,
        diagnostico: d.diagnostico, solucion: d.solucion, leccion: d.leccion,
        prioridad: d.prioridad || "Media",
        tecnicoAsignado: d.tecnicoAsignado || "Asignación automática (turno actual)",
        descripcion: d.descripcion || "",
        estado: "Pendiente",
        comentarios: [],
        creado: new Date().toISOString()
    };
    tickets.unshift(nuevo);

    // La cama pasa a "en gestión de biomédica": ya se reportó, deja de
    // sonar en el panel de enfermería hasta que el técnico la resuelva.
    const cama = datosCamas.find(c => String(c.id) === String(d.cama));
    if (cama) { cama.estado = "estable"; io.emit('actualizar_monitoreo_live', datosCamas); }

    res.json({ success: true, ticket: nuevo });
});

app.patch('/api/tickets/:id', (req, res) => {
    const t = tickets.find(t => t.id === req.params.id);
    if (!t) return res.status(404).json({ success: false, mensaje: "Ticket no encontrado." });
    const { estado, comentario } = req.body || {};
    if (estado) t.estado = estado;
    if (comentario && comentario.trim() !== "") {
        t.comentarios.push({ texto: comentario.trim(), fecha: new Date().toLocaleString('es-CO') });
    }
    t.actualizado = new Date().toISOString();
    res.json({ success: true, ticket: t });
});

app.get('/api/admin/dashboard', (req, res) => {
    const camasOnline = datosCamas.filter(c => c.estado !== "sin-conexion").length;
    const camasAlarma = datosCamas.filter(c => c.estado === "advertencia" || c.estado === "critico").length;
    const ticketsActivos = tickets.filter(t => t.estado !== "Resuelto").length;
    res.json({ totalCamas: datosCamas.length, camasOnline, camasAlarma, ticketsActivos });
});

app.get('/api/admin/usuarios', (req, res) => res.json(usuariosCredenciales));
app.get('/api/admin/equipos', (req, res) => res.json(inventarioEquipos));

// El administrador registra directamente a un integrante (queda Activo).
app.post('/api/admin/usuarios', (req, res) => {
    const { nombre, rol } = req.body || {};
    if (!nombre || !rol) return res.status(400).json({ success: false, mensaje: "Nombre y rol son obligatorios." });
    const usuario = nombre.toLowerCase().trim().replace(/\s+/g, ".") + "@simeb.com";
    if (usuariosCredenciales.some(u => u.usuario === usuario)) {
        return res.status(400).json({ success: false, mensaje: "Ya existe un usuario con ese nombre." });
    }
    const nuevo = { id: usuariosCredenciales.length + 1, usuario, clave: "123456", nombre, rol, estado: "Activo" };
    usuariosCredenciales.push(nuevo);
    res.json({ success: true, usuario: nuevo });
});

app.post('/api/admin/usuarios/aprobar', (req, res) => {
    const { id } = req.body;
    const usuario = usuariosCredenciales.find(u => u.id === parseInt(id));
    if (usuario) {
        usuario.estado = "Activo";
        return res.json({ success: true, mensaje: "Acceso activado correctamente." });
    }
    res.status(404).json({ success: false, mensaje: "Usuario no encontrado." });
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor central de Aegis Med activo en http://localhost:${PORT}`);
});
