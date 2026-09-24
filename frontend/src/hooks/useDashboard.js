import { useEffect, useState } from 'react';
import { DashboardController } from '../controllers/DashboardController';

export function useDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await DashboardController.getDashboard();
        setData(response);
      } catch (err) {
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { data, loading, error };
}
