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

  const sendPhoneOtp = async (phone, fullName = '') => {
    if (!supabase) return { success: false, error: 'Authentication is not configured. Set the Supabase frontend environment variables.' };
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { shouldCreateUser: true, data: { name: fullName.trim(), full_name: fullName.trim(), city: 'Vijayawada' } },
      });
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyPhoneAuthError(err, 'send') };
    }
  };

  const verifyPhoneOtp = async (phone, token) => {
    if (!supabase) return { success: false, error: 'Authentication is not configured. Set the Supabase frontend environment variables.' };
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: 'sms' });
      if (error) throw error;
      setSession(data.session);
      await fetchProfile();
      return { success: true, data };
    } catch (err) {
      return { success: false, error: friendlyPhoneAuthError(err, 'verify') };
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
        sendPhoneOtp,
        verifyPhoneOtp,
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

const friendlyPhoneAuthError = (error, operation) => {
  const message = String(error?.message || '').toLowerCase();
  if (operation === 'verify' && /invalid.*otp|otp.*invalid|token.*invalid/.test(message)) return 'That code is incorrect. Check it and try again.';
  if (operation === 'verify' && /expired|otp_expired/.test(message)) return 'That code has expired. Request a new code to continue.';
  if (/too many|rate limit|security purposes|try again in/.test(message)) return 'Too many attempts. Wait a little while before trying again.';
  if (/already registered|already been registered|user already exists/.test(message)) return 'This phone number is already registered. Choose Sign in with OTP.';
  if (/fetch|network|timeout|load failed/.test(message)) return 'We could not reach the authentication service. Check your connection and try again.';
  return error?.message || 'Phone verification failed. Please try again.';
};

export const useAuth = () => useContext(AuthContext);
