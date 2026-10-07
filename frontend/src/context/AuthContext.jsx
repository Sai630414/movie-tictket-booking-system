import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase.js';
import api from '../services/api.js';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      console.warn('Could not sync user profile from API server:', err.message);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!supabase) return;
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile();
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    if (!supabase) return undefined;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        await fetchProfile();
      } else setUser(null);
    });

    return () => subscription?.unsubscribe();
  }, [fetchProfile]);

  const login = async (email, password) => {
    if (!supabase) return { success: false, error: 'Authentication is not configured. Set the Supabase frontend environment variables.' };
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await fetchProfile();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, name, phone, city) => {
    if (!supabase) return { success: false, error: 'Authentication is not configured. Set the Supabase frontend environment variables.' };
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone, city, role: 'user' },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      if (data.session) await fetchProfile();
      return { success: true, data, needsEmailVerification: !data.session };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!supabase) return { success: false, error: 'Authentication is not configured. Set the Supabase frontend environment variables.' };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message || 'Google sign in failed.' };
    }
  };

  const logout = async () => {
    try {
      await supabase?.auth.signOut();
    } catch (err) {
      console.warn('Supabase logout error:', err);
    }
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
        loginWithGoogle,
        refreshProfile: fetchProfile,
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
