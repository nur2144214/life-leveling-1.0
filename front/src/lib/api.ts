export const API_URL = 'http://localhost:8000/api';

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Гарантируем слеш на конце
  const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;

  const response = await fetch(`${API_URL}${normalizedEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.reload();
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || 'Ошибка запроса');
  }

  return response.json();
}