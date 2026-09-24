import { httpService } from '../services/httpService';
import { API_ENDPOINTS } from '../config/api';

export const UserController = {
  async createUser(payload) {
    return httpService.post(API_ENDPOINTS.admin.users, payload);
  },

  async approveUser(id) {
    return httpService.post(API_ENDPOINTS.admin.approveUser, { id });
  },
};
