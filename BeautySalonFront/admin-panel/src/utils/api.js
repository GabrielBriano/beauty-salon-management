export const API_URL = import.meta.env.VITE_API_URL ?? 'https://localhost:7244';

/** fetch que envia o token JWT salvo no login (rotas do painel exigem autenticação). */
export function authFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}
