// Validar sesión antes de arrancar cualquier lógica
(function verificarAccesoSeguro() {
    const rolGuardado = localStorage.getItem("userRol");
    if (!rolGuardado) {
        alert("Acceso denegado. Por favor, inicia sesión.");
        window.location.href = "../index.html"; // Lo expulsa a la raíz
    }
})();

// ==========================================
// 1. CONFIGURACIÓN DE LA GRÁFICA (CHART.JS)
// ==========================================
const ctx = document.getElementById('chartECG').getContext('2d');
const maxDatosVisibles = 50; 
const datosIniciales = Array(maxDatosVisibles).fill(512);
const etiquetas = Array(maxDatosVisibles).fill('');

const chartECG = new Chart(ctx, {
    type: 'line',
    data: {
        labels: etiquetas,
        datasets: [{
            data: datosIniciales,
            borderColor: '#10b981', 
            borderWidth: 2,
            pointRadius: 0,        
            tension: 0.3
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
            x: { display: false },
            y: { min: 100, max: 1000, grid: { color: '#1e293b' }, ticks: { color: '#64748b' } }
        }
    }
});

// ==========================================
// 2. CONEXIÓN WEBSOCKET (DIRECCIÓN NUMÉRICA)
// ==========================================
const socket = io('https://hungry-buckets-remain.loca.lt:3000');

socket.on('connect', () => {
    const badge = document.getElementById('badge-conexion');
    badge.className = "estado-conexion conectado";
    badge.innerText = "SISTEMA ONLINE";
});

socket.on('disconnect', () => {
    const badge = document.getElementById('badge-conexion');
    badge.className = "estado-conexion desconectado";
    badge.innerText = "DESCONECTADO DEL BACKEND";
});

// ==========================================
// 3. PROCESAMIENTO DINÁMICO EN TIEMPO REAL
// ==========================================
socket.on('datos_paciente', (data) => {
    chartECG.data.datasets[0].data.push(data.valorECG);
    if (chartECG.data.datasets[0].data.length > maxDatosVisibles) {
        chartECG.data.datasets[0].data.shift();
    }
    chartECG.update('none'); 

    document.getElementById('mensaje-alerta').innerText = data.mensaje;
    document.getElementById('porcentaje-senal').innerText = `${data.calidadSenal}%`;
    document.getElementById('barra-senal').style.width = `${data.calidadSenal}%`;
    document.getElementById('calidad-texto').innerText = `Calidad de Señal: ${data.calidadSenal}%`;

    const tarjetaGrafica = document.getElementById('tarjeta-grafica');
    const cardBpm = document.getElementById('card-bpm');
    const cardConductividad = document.getElementById('card-conductividad');
    const bannerAlerta = document.getElementById('banner-alerta');
    const iconoAlerta = document.getElementById('icono-alerta');
    const valorBpm = document.getElementById('valor-bpm');
    const labelEcg = document.getElementById('label-ecg');
    const estadoElectrodosTexto = document.getElementById('estado-electrodos-texto');

    if (data.tipoAlerta === "TECNICA_MANTENIMIENTO") {
        chartECG.data.datasets[0].borderColor = '#f59e0b';
        tarjetaGrafica.className = "tarjeta-grafica-normal alerta-tecnica-activa";
        cardBpm.style.opacity = "0.3"; 
        cardConductividad.className = "tarjeta-numerica-normal alerta-tecnica-activa";
        bannerAlerta.className = "banner-alertas-normal banner-alerta-tecnica";
        iconoAlerta.className = "circulo-estado circulo-alerta-activa";
        labelEcg.className = "titulo-parametro texto-alerta-tecnica";
        document.getElementById('barra-senal').style.backgroundColor = '#f59e0b';
        valorBpm.innerText = "--"; 
        valorBpm.className = "gran-numero";
        valorBpm.style.color = "#475569";
        estadoElectrodosTexto.innerText = "SECOS / DESPEGADOS";
        estadoElectrodosTexto.className = "texto-alerta-tecnica";
    } else {
        chartECG.data.datasets[0].borderColor = '#10b981';
        tarjetaGrafica.className = "tarjeta-grafica-normal";
        cardBpm.style.opacity = "1";
        cardConductividad.className = "tarjeta-numerica-normal";
        bannerAlerta.className = "banner-alertas-normal";
        iconoAlerta.className = "circulo-estado";
        iconoAlerta.style.backgroundColor = "#10b981";
        labelEcg.className = "titulo-parametro verde";
        document.getElementById('barra-senal').style.backgroundColor = '#3b82f6';
        valorBpm.innerText = "74"; 
        valorBpm.className = "gran-numero verde";
        valorBpm.style.color = "";
        estadoElectrodosTexto.innerText = "CONDUCTIVIDAD ÓPTIMA";
        estadoElectrodosTexto.className = "verde";
    }
});
