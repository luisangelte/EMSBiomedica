export const validators = {
  required(value) {
    return value !== null && value !== undefined && String(value).trim() !== '';
  },

  email(value = '') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  },

  minLength(value = '', length) {
    return String(value).trim().length >= length;
  },
};
