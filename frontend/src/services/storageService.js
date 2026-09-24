const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const USER_ROLE_KEY = 'user_role';

export const storageService = {
  setToken(token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  },

  getToken() {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  },

  setUserData(data) {
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(data));
  },

  getUserData() {
    const raw = localStorage.getItem(USER_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  removeUserData() {
    localStorage.removeItem(USER_DATA_KEY);
  },

  setUserRole(role) {
    localStorage.setItem(USER_ROLE_KEY, role);
  },

  getUserRole() {
    return localStorage.getItem(USER_ROLE_KEY);
  },

  removeUserRole() {
    localStorage.removeItem(USER_ROLE_KEY);
  },

  clearSession() {
    this.removeToken();
    this.removeUserData();
    this.removeUserRole();
  },
};
