import React, { useMemo, useState } from 'react';
import './AdminScreen.css';

const tabs = [
  { id: 'dashboard', label: 'Datos en vivo' },
  { id: 'usuarios', label: 'Usuarios y roles' },
  { id: 'equipos', label: 'Equipos médicos' },
  { id: 'enfermeria', label: 'Central de enfermería' },
  { id: 'tecnico', label: 'Gestión técnica' },
];

const initialUsers = [
  { id: 'USR-101', nombre: 'Diana Castro', rol: 'Enfermero', estado: 'Activo' },
  { id: 'USR-204', nombre: 'Camilo Rojas', rol: 'Técnico', estado: 'Activo' },
  { id: 'USR-312', nombre: 'Valeria Navas', rol: 'Admin', estado: 'Pendiente' },
];

const initialEquipment = [
  { codigo: 'MON-1001', modelo: 'Mindray BeneView T5', serie: 'MDR-7841', sala: 'UTI-01', calibracion: '12 Ago 2026' },
  { codigo: 'MON-1002', modelo: 'Philips IntelliVue MX40', serie: 'PHL-9912', sala: 'Sala 4', calibracion: '18 Ago 2026' },
  { codigo: 'MON-1003', modelo: 'GE Carescape B650', serie: 'GEC-2309', sala: 'UCI', calibracion: '24 Ago 2026' },
];

const monitoringRows = [
  { cama: 'C-201', paciente: 'Ana Gómez', estado: 'estable', fc: '72', fr: '18' },
  { cama: 'C-202', paciente: 'Luis Ortega', estado: 'advertencia', fc: '94', fr: '23' },
  { cama: 'C-203', paciente: 'Marta Ruiz', estado: 'critico', fc: '120', fr: '29' },
  { cama: 'C-204', paciente: 'Nicolás Díaz', estado: 'sin-conexion', fc: '--', fr: '--' },
];

const summaryMap = {
  dashboard: 'Datos clínicos y operativos en vivo',
  usuarios: 'Usuarios y roles',
  equipos: 'Equipos médicos',
  enfermeria: 'Central de enfermería',
  tecnico: 'Gestión técnica',
};

function getStatusColor(status) {
  const map = {
    estable: '#34d399',
    advertencia: '#fbbf24',
    critico: '#ff3b5c',
    'sin-conexion': '#7e8b9c',
    Activo: '#34d399',
    Pendiente: '#fbbf24',
  };

  return map[status] || '#7e8b9c';
}

function getStatusLabel(status) {
  const map = {
    estable: 'Estable',
    advertencia: 'Advertencia',
    critico: 'Crítica',
    'sin-conexion': 'Sin conexión',
  };

  return map[status] || status;
}

function StatusPill({ label, color }) {
  return (
    <span className="status-pill" style={{ '--status-color': color }}>
      {label}
    </span>
  );
}

export const AdminScreen = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editMode, setEditMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [users, setUsers] = useState(initialUsers);

  const dashboardStats = useMemo(
    () => [
      { label: 'Monitores Activos', value: '24', accent: 'blue' },
      { label: 'Alarmas Críticas', value: '04', accent: 'danger' },
      { label: 'Tickets Pendientes', value: '12', accent: 'warning' },
    ],
    []
  );

  const handleCreateUser = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const nombre = form.elements['usr-nombre'].value.trim();
    const rol = form.elements['usr-rol'].value;

    if (!nombre || !rol) return;

    setUsers((current) => [
      {
        id: `USR-${Math.floor(Math.random() * 900 + 100)}`,
        nombre,
        rol,
        estado: 'Activo',
      },
      ...current,
    ]);

    form.reset();
  };

  const toggleEditMode = () => {
    setEditMode((current) => !current);
    setProfileOpen(false);
  };

  return (
    <div className={editMode ? 'admin-container admin-edit-mode' : 'admin-container'}>
      <aside className="sidebar">
        <h2>SIMEB</h2>
        <div className="profile-info">Panel de Gestión</div>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'nav-btn active' : 'nav-btn'}
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          <button className="nav-btn nav-logout" type="button">
            Cerrar sesión
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="admin-topbar">
          <div className="topbar-context">
            <span className="eyebrow">Administración central</span>
            <strong>{summaryMap[activeTab] || 'Datos clínicos y operativos en vivo'}</strong>
          </div>
          <span className="mode-badge">{editMode ? 'Modo gestión activo' : 'Modo consulta'}</span>

          <div className="profile-menu-wrap">
            <button
              className="profile-trigger"
              type="button"
              aria-expanded={profileOpen}
              aria-controls="profile-menu"
              onClick={() => setProfileOpen((current) => !current)}
            >
              <span className="profile-avatar">LA</span>
              <span className="profile-copy">
                <strong>Administrador</strong>
                <small>Administrador del sistema</small>
              </span>
              <span className="profile-chevron" aria-hidden="true">⌄</span>
            </button>

            {profileOpen && (
              <div className="profile-menu" id="profile-menu">
                <div className="menu-heading">
                  <span>Administrador</span>
                  <small>Sesión activa</small>
                </div>
                <button type="button" onClick={toggleEditMode}>
                  <span className="menu-icon">✎</span>
                  <span>
                    <strong>{editMode ? 'Desactivar modo de gestión' : 'Activar modo de gestión'}</strong>
                    <small>Controles administrativos disponibles</small>
                  </span>
                </button>
                <button type="button">
                  <span className="menu-icon">＋</span>
                  <span>
                    <strong>Crear usuario</strong>
                    <small>Asignar un nuevo acceso</small>
                  </span>
                </button>
                <button type="button">
                  <span className="menu-icon">↻</span>
                  <span>
                    <strong>Actualizar información</strong>
                    <small>Consultar datos del servidor</small>
                  </span>
                </button>
                <div className="menu-divider" />
                <button type="button" className="menu-danger">
                  <span className="menu-icon">⎋</span>
                  <span>
                    <strong>Cerrar sesión</strong>
                    <small>Salir de la consola</small>
                  </span>
                </button>
              </div>
            )}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <section className="tab-content active">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Centro de control</span>
                <h1>Datos clínicos y operativos en vivo</h1>
                <p className="section-intro">Supervisión consolidada de equipos, alarmas y mantenimiento.</p>
              </div>
              <div className="dashboard-meta">
                <span className="live-dot" />
                <span>Actualizando datos...</span>
              </div>
            </div>

            <div className="kpi-grid">
              {dashboardStats.map((card) => (
                <div key={card.label} className={`kpi-card ${card.accent === 'danger' ? 'danger' : card.accent === 'warning' ? 'warning' : ''}`}>
                  <h3>{card.label}</h3>
                  <p>{card.value}</p>
                </div>
              ))}
            </div>

            <div className="charts-grid">
              <article className="chart-box chart-wide">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Monitoreo clínico</span>
                    <h2>Estado de camas</h2>
                  </div>
                  <span className="panel-tag">En vivo</span>
                </div>
                <div className="chart-canvas chart-doughnut">
                  <div className="doughnut-legend">
                    <span><i className="dot stable" />Estable</span>
                    <span><i className="dot warning" />Advertencia</span>
                    <span><i className="dot critical" />Crítica</span>
                    <span><i className="dot offline" />Sin conexión</span>
                  </div>
                </div>
              </article>

              <article className="chart-box">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Mantenimiento</span>
                    <h2>Estado de tickets</h2>
                  </div>
                </div>
                <div className="bars-box">
                  <div className="bar-group"><span>Pendiente</span><div className="bar"><i style={{ width: '48%' }} /></div></div>
                  <div className="bar-group"><span>En Atención</span><div className="bar"><i style={{ width: '63%' }} /></div></div>
                  <div className="bar-group"><span>Resuelto</span><div className="bar"><i style={{ width: '76%' }} /></div></div>
                </div>
              </article>

              <article className="chart-box">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow">Signos vitales</span>
                    <h2>Promedios actuales</h2>
                  </div>
                </div>
                <div className="vital-bars">
                  <div className="vital-item"><span>Frecuencia cardiaca</span><div className="vital-line"><i style={{ width: '72%' }} /></div></div>
                  <div className="vital-item"><span>Frecuencia respiratoria</span><div className="vital-line"><i style={{ width: '61%' }} /></div></div>
                </div>
              </article>
            </div>

            <div className="activity-panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">Seguimiento operativo</span>
                  <h2>Equipos bajo observación</h2>
                </div>
                <span className="panel-tag">4 requieren atención</span>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table activity-table">
                  <thead>
                    <tr>
                      <th>Cama</th>
                      <th>Paciente</th>
                      <th>Estado</th>
                      <th>FC</th>
                      <th>FR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoringRows.map((row) => (
                      <tr key={row.cama}>
                        <td><strong>{row.cama}</strong></td>
                        <td>{row.paciente}</td>
                        <td>
                          <StatusPill label={getStatusLabel(row.estado)} color={getStatusColor(row.estado)} />
                        </td>
                        <td className="mono-value">{row.fc}</td>
                        <td className="mono-value">{row.fr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'usuarios' && (
          <section className="tab-content active">
            <h1>Gestión de Personal de Salud y Soporte</h1>

            <div className="form-container">
              <h3>Registrar Nuevo Integrante</h3>
              <form id="form-usuario" onSubmit={handleCreateUser}>
                <input type="text" name="usr-nombre" placeholder="Nombre completo" required disabled={!editMode} />
                <select name="usr-rol" required disabled={!editMode}>
                  <option value="" disabled selected>Selecciona un Rol</option>
                  <option value="Enfermero">Enfermero (Monitoreo Clínico)</option>
                  <option value="Admin">Admin (Control Total)</option>
                  <option value="Técnico">Técnico (Mantenimiento Biomédico)</option>
                </select>
                <button type="submit" className="btn-primary" disabled={!editMode}>
                  Crear acceso
                </button>
              </form>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID Acceso</th>
                  <th>Nombre</th>
                  <th>Rol de Sistema</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.nombre}</td>
                    <td>{user.rol}</td>
                    <td>
                      <StatusPill label={user.estado} color={getStatusColor(user.estado)} />
                    </td>
                    <td>
                      <button type="button" className="btn-delete" disabled={!editMode}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'equipos' && (
          <section className="tab-content active">
            <h1>Inventario de Equipos Críticos</h1>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Modelo de Monitor</th>
                  <th>Número de Serie</th>
                  <th>Sala Asignada</th>
                  <th>Próxima Calibración</th>
                </tr>
              </thead>
              <tbody>
                {initialEquipment.map((equipment) => (
                  <tr key={equipment.codigo}>
                    <td>{equipment.codigo}</td>
                    <td>{equipment.modelo}</td>
                    <td>{equipment.serie}</td>
                    <td>{equipment.sala}</td>
                    <td>{equipment.calibracion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'enfermeria' && (
          <section className="tab-content active embedded-view">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Módulo clínico</span>
                <h1>Central de Enfermería</h1>
                <p className="section-intro">Consulta y gestión de alarmas de los equipos conectados.</p>
              </div>
              <span className="panel-tag">Vista integrada</span>
            </div>
            <div className="embedded-frame embedded-nurse">
              <div className="embedded-placeholder">Central de enfermería</div>
            </div>
          </section>
        )}

        {activeTab === 'tecnico' && (
          <section className="tab-content active embedded-view">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Mantenimiento biomédico</span>
                <h1>Gestor Técnico</h1>
                <p className="section-intro">Seguimiento, actualización y cierre de tickets operativos.</p>
              </div>
              <span className="panel-tag">Vista integrada</span>
            </div>
            <div className="embedded-frame embedded-tech">
              <div className="embedded-placeholder">Gestor técnico</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminScreen;
