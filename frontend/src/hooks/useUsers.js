import { useEffect, useState } from 'react';
import { DashboardController } from '../controllers/DashboardController';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await DashboardController.getUsers();
        setUsers(Array.isArray(response) ? response : []);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los usuarios.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { users, loading, error };
}
