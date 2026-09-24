import React from 'react';
import { AlertMessage } from '../common/AlertMessage';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './Login.css';

export function LoginView({
  username,
  password,
  role,
  error,
  loading,
  onChange,
  onSubmit,
}) {
  return (
    <div className="login-container">
      <div className="login-card">
        <h2 id="form-title">Ingresar a SIMEB</h2>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Correo Electrónico</label>
            <input
              type="email"
              id="username"
              name="username"
              value={username}
              onChange={onChange}
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
              value={password}
              onChange={onChange}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="rol">Selecciona tu Rol Asignado</label>
            <select id="rol" name="rol" value={role} onChange={onChange} required>
              <option value="" disabled>Escoge tu rol</option>
              <option value="Enfermero">Enfermero (Central de Monitoreo)</option>
              <option value="Técnico">Técnico (Soporte y Tickets)</option>
              <option value="Administrador">Administrador (Dashboard Global)</option>
            </select>
          </div>

          {error && <AlertMessage type="error" message={error} />}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? <LoadingSpinner label="Ingresando..." /> : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
