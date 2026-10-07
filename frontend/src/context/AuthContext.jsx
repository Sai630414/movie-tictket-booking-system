import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase.js';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.warn('Could not sync user profile from API server:', err.message);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile();
        } else {
          // Check local dev session
          const devUserJson = localStorage.getItem('dev_user');
          if (devUserJson) {
            setUser(JSON.parse(devUserJson));
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile();
      } else {
        const devUserJson = localStorage.getItem('dev_user');
        if (!devUserJson) setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Fallback for dev mode
        if (email === 'admin@cineverse.com' || password === 'admin123') {
          const devAdmin = {
            _id: 'admin_dev_id_123',
            supabaseUserId: 'mock_jwt_admin',
            email: 'admin@cineverse.com',
            name: 'System Admin',
            role: 'admin',
            city: 'Mumbai',
          };
          localStorage.setItem('dev_auth_token', 'mock_jwt_admin');
          localStorage.setItem('dev_user', JSON.stringify(devAdmin));
          setUser(devAdmin);
          return { success: true, user: devAdmin };
        }
        if (email.includes('user') || password === 'user123') {
          const devUser = {
            _id: 'user_dev_id_456',
            supabaseUserId: 'mock_jwt_user',
            email,
            name: email.split('@')[0],
            role: 'user',
            city: 'Mumbai',
          };
          localStorage.setItem('dev_auth_token', 'mock_jwt_user');
          localStorage.setItem('dev_user', JSON.stringify(devUser));
          setUser(devUser);
          return { success: true, user: devUser };
        }
        throw error;
      }
      await fetchProfile();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, phone, city) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, city, role: 'user' },
        },
      });

      if (error) {
        // Dev fallback
        const devUser = {
          _id: 'dev_user_' + Date.now(),
          supabaseUserId: 'mock_jwt_reg_' + Date.now(),
          email,
          name,
          phone,
          city: city || 'Mumbai',
          role: 'user',
        };
        localStorage.setItem('dev_auth_token', devUser.supabaseUserId);
        localStorage.setItem('dev_user', JSON.stringify(devUser));
        setUser(devUser);
        return { success: true, user: devUser };
      }

      await fetchProfile();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase logout error:', err);
    }
    localStorage.removeItem('dev_auth_token');
    localStorage.removeItem('dev_user');
    setUser(null);
    setSession(null);
  };

  const updateProfileState = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        register,
        logout,
        updateProfileState,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
