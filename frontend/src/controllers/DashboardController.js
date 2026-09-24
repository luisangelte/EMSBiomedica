import { httpService } from '../services/httpService';
import { API_ENDPOINTS } from '../config/api';

export const DashboardController = {
  async getDashboard() {
    return httpService.get(API_ENDPOINTS.admin.dashboard);
  },

  async getUsers() {
    return httpService.get(API_ENDPOINTS.admin.users);
  },

  async getEquipos() {
    return httpService.get(API_ENDPOINTS.admin.equipos);
  },
};
