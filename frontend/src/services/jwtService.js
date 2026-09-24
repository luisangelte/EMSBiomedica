export const jwtService = {
  decode(token) {
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (error) {
      console.error('Token inválido:', error);
      return null;
    }
  },

  isValid(token) {
    const payload = this.decode(token);
    if (!payload || !payload.exp) return false;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  },
};
