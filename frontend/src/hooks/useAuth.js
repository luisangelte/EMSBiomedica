import { useMemo, useState } from 'react';
import { AuthController } from '../controllers/AuthController';
import { storageService } from '../services/storageService';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const user = useMemo(() => storageService.getUserData(), []);

  const login = async ({ usuario, clave, rol }) => {
    setLoading(true);
    setError('');

    try {
      const response = await AuthController.login({ usuario, clave, rol });
      return response;
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { login, user, loading, error };
}
