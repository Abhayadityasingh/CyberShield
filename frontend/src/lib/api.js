import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'cybershield_token';

// localStorage can throw (private mode, blocked storage), so every access is wrapped
export const tokenStore = {
  get() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } },
  clear() { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
};

export const api = axios.create({ baseURL: `${API_URL}/api`, timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the server says our token is invalid/expired, log the user out
let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isAuthForm = url.includes('/auth/login') || url.includes('/auth/register');
    if (err.response?.status === 401 && !isAuthForm && onUnauthorized) onUnauthorized();
    return Promise.reject(err);
  }
);

export function errorMessage(err) {
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Is the backend running?';
  const data = err.response?.data;
  return data?.details?.[0]?.message || data?.message || 'Something went wrong. Please try again.';
}