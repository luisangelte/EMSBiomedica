import { httpService } from '../services/httpService';
import { storageService } from '../services/storageService';
import { API_ENDPOINTS } from '../config/api';

export const AuthController = {
  async login({ usuario, clave, rol }) {
    const response = await httpService.post(API_ENDPOINTS.auth.login, { usuario, clave, rol });

    if (response?.success) {
      storageService.setUserRole(response.rol);
      storageService.setUserData({ nombre: response.nombre, rol: response.rol });
      return response;
    }

    throw new Error(response?.mensaje || 'No se pudo iniciar sesión.');
  },

  async register(payload) {
    return httpService.post(API_ENDPOINTS.auth.register, payload);
  },
};
