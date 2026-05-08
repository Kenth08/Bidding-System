import api, { authAPI } from './api';
import { supabase } from '../lib/supabase';

export async function loginWithEmail(email, password) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          return { user: null, error: 'Invalid email or password.' };
        }
        if (error.message.includes('Email not confirmed')) {
          return { user: null, error: 'Please verify your email first. Check your inbox for the verification link.' };
        }
        return { user: null, error: error.message };
      }
    }

    const response = await authAPI.login(normalizedEmail, password);
    const { access, refresh, user } = response.data;

    const normalizedStatus = String(user?.status || '').toLowerCase();
    if (user?.role === 'supplier' && normalizedStatus === 'pending') {
      await logout();
      return { user: null, error: 'Your account is pending admin approval. Please wait.' };
    }
    if (user?.role === 'supplier' && normalizedStatus === 'rejected') {
      await logout();
      return { user: null, error: 'Your registration was rejected. Contact the administrator.' };
    }
    if (normalizedStatus === 'inactive') {
      await logout();
      return { user: null, error: 'Your account is deactivated. Contact the administrator.' };
    }

    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    return { user, error: null };
  } catch (error) {
    if (error?.code === 'ERR_NETWORK') {
      return { user: null, error: 'Cannot connect to server. Make sure the backend is running.' };
    }
    const errorMessage = error.response?.data?.error || error.response?.data?.detail || 'Login failed. Please try again.';
    return { user: null, error: errorMessage };
  }
}

export async function registerWithEmail(formData) {
  try {
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '').trim();

    if (supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return { error: 'This email is already registered.' };
        }
        return { error: error.message };
      }
    }

    await authAPI.register(formData);
    return { error: null };
  } catch (error) {
    return {
      error: error.response?.data?.error || error.response?.data?.detail || 'Registration failed. Please try again.',
    };
  }
}

export async function logout() {
  if (supabase) {
    await supabase.auth.signOut();
  }
  localStorage.removeItem('supabase_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  try {
    const backendToken = localStorage.getItem('access_token');
    if (backendToken) {
      const res = await api.get('/auth/me/');
      return res.data;
    }

    const session = await getCurrentSession();
    if (!session) return null;

    const res = await api.get('/auth/me/', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    return res.data;
  } catch {
    return null;
  }
}
