import React, { useState } from 'react';
import './LoginScreen.css';
import { login, saveSession, redirectByRole } from './authService';

export const LoginScreen = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    rol: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login({
        usuario: credentials.username,
        clave: credentials.password,
        rol: credentials.rol
      });

      saveSession({
        rol: data.rol,
        nombre: data.nombre
      });

      redirectByRole(data.rol);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 id="form-title">Ingresar a SIMEB</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Correo Electrónico</label>
            <input
              type="email"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="usuario@simeb.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rol">Selecciona tu Rol Asignado</label>
            <select
              id="rol"
              name="rol"
              value={credentials.rol}
              onChange={handleChange}
              required
            >
              <option value="" disabled>Escoge tu rol</option>
              <option value="Enfermero">Enfermero (Central de Monitoreo)</option>
              <option value="Técnico">Técnico (Soporte y Tickets)</option>
              <option value="Admin">Administrador (Dashboard Global)</option>
            </select>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};