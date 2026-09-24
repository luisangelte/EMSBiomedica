export const helpers = {
  isEmpty(value) {
    return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
  },

  capitalize(value = '') {
    return value.charAt(0).toUpperCase() + value.slice(1);
  },

  formatRole(role = '') {
    return role?.trim() || 'Usuario';
  },
};
