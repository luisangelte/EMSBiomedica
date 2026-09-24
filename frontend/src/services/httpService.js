import { API_BASE_URL } from '../config/api';

const defaultHeaders = {
  'Content-Type': 'application/json',
};

async function request(endpoint, { method = 'GET', body, headers = {}, token } = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const finalHeaders = {
    ...defaultHeaders,
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === 'object' && data && data.mensaje
      ? data.mensaje
      : 'Error en la solicitud';
    throw new Error(message);
  }

  return data;
}

export const httpService = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
};
