export async function login({ usuario, clave, rol }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ usuario, clave, rol }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.mensaje || 'Credenciales incorrectas');
  }

  return data;
}

export function saveSession({ rol, nombre }) {
  localStorage.setItem('userRol', rol);
  localStorage.setItem('userNombre', nombre || 'Personal de turno');
}

export function redirectByRole(rol) {
  if (rol === 'Admin') {
    window.location.href = '/paneladmin/admin.html';
    return;
  }

  if (rol === 'Enfermero') {
    window.location.href = '/RolEnfermero/monitor.html';
    return;
  }

  if (rol === 'Técnico') {
    window.location.href = '/gestor_tickes/index.html';
    return;
  }

  window.location.href = '/';
}
