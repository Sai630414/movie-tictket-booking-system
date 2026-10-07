import axios from 'axios';
import { supabase } from './supabase.js';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Supabase JWT token
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.error('API token interceptor error:', err);
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
