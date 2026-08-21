const socket = io('http://192.168.1.43:3000');

socket.on('actualizar_monitoreo_live', (datosCamasBackend) => {
    console.log("⚡ Datos simultáneos recibidos:", datosCamasBackend);
    
    // Aquí mapeas los datos al grid visual de tus camas críticas de monitor.html
    const gridCamas = document.getElementById("grid-camas"); // Asegúrate de tener este ID en el contenedor HTML
    if (!gridCamas) return;

    gridCamas.innerHTML = datosCamasBackend.map(cama => {
        const AlarmaClase = (cama.estado === 'advertencia') ? 'sm-alarming' : '';
        return `
            <div class="cama-card ${AlarmaClase}" style="background:#121826; padding:15px; border-radius:8px; margin:10px; border:1px solid #242f41;">
                <h3>${cama.nombre} - ${cama.estado.toUpperCase()}</h3>
                <p>Paciente: ${cama.paciente}</p>
                <div style="font-size:24px; color:#00d2ff; font-weight:bold;">FC: ${cama.fc} bpm</div>
                <div style="font-size:18px; color:#a3e635;">FR: ${cama.fr} rpm</div>
            </div>
        `;
    }).join('');
});
