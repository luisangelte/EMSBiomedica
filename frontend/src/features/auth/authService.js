async function parseJsonResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

export async function login({ usuario, clave, rol }) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usuario, clave, rol }),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data?.mensaje || 'Credenciales incorrectas');
    }

    if (!data || !data.success) {
      throw new Error('No se pudo completar la autenticación.');
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }

    throw new Error(error.message || 'Error de autenticación.');
  }
}

export function saveSession({ rol, nombre }) {
  localStorage.setItem('userRol', rol);
  localStorage.setItem('userNombre', nombre || 'Personal de turno');
}

export function redirectByRole(rol) {
  if (rol === 'Admin') {
    window.location.href = '/admin';
    return;
  }

  if (rol === 'Enfermero') {
    window.location.href = '/enfermero';
    return;
  }

  if (rol === 'Técnico') {
    window.location.href = '/tecnico';
    return;
  }

  window.location.href = '/';
}
