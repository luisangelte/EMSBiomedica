export const API_BASE_URL = 'http://localhost:3000';

export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/registrar',
  },
  admin: {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/usuarios',
    approveUser: '/api/admin/usuarios/aprobar',
    equipos: '/api/admin/equipos',
  },
  monitoring: '/api/monitoreo',
  tickets: '/api/tickets',
};
