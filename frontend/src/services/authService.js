import api, { authAPI } from './api';
import { supabase } from '../lib/supabase';

function getLocalSupplierByEmail(email) {
  try {
    const procurementStateJson = localStorage.getItem('ep_procurement_state_v1');
    if (!procurementStateJson) return null;

    const procurementState = JSON.parse(procurementStateJson);
    return procurementState.suppliers?.find((supplier) => String(supplier.email || '').trim().toLowerCase() === email) || null;
  } catch (error) {
    console.error('Failed to read local supplier state:', error);
    return null;
  }
}

function isSupplierApprovedLocally(supplier) {
  const status = String(supplier?.status || '').trim().toLowerCase();
  return status === 'verified' || status === 'approved';
}

export async function loginWithEmail(email, password) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const localSupplier = getLocalSupplierByEmail(normalizedEmail);
    const localSupplierApproved = isSupplierApprovedLocally(localSupplier);

    // Try Supabase if available, but don't block backend login if it fails
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (!error) {
          // Supabase login successful, continue to backend
        }
      } catch (supabaseError) {
        // Supabase error - continue to backend API
      }
    }

    try {
      const response = await authAPI.login(normalizedEmail, password);
      const { access, refresh, user } = response.data;

      const normalizedStatus = String(user?.status || '').toLowerCase();
      if (user?.role === 'supplier' && normalizedStatus === 'pending') {
        if (!localSupplierApproved) {
          await logout();
          return { user: null, error: 'Your account is pending admin approval. Please wait.' };
        }
      }
      if (user?.role === 'supplier' && normalizedStatus === 'rejected') {
        if (!localSupplierApproved) {
          await logout();
          return { user: null, error: 'Your registration was rejected. Contact the administrator.' };
        }
      }
      if (normalizedStatus === 'inactive') {
        await logout();
        return { user: null, error: 'Your account is deactivated. Contact the administrator.' };
      }

      sessionStorage.setItem('access_token', access);
      sessionStorage.setItem('refresh_token', refresh);

      if (user?.role === 'supplier' && localSupplierApproved) {
        const trustedUser = {
          ...user,
          id: localSupplier.id || user.id,
          email: localSupplier.email || user.email,
          full_name: localSupplier.full_name || localSupplier.company_name || user.full_name || user.company_name,
          company_name: localSupplier.company_name || user.company_name,
          status: localSupplier.status || 'Verified',
        };
        sessionStorage.setItem('current_supplier', JSON.stringify(trustedUser));
        return { user: trustedUser, error: null };
      }

      return { user, error: null };
    } catch (backendError) {
      if (localSupplierApproved) {
        const trustedUser = {
          id: localSupplier.id,
          email: localSupplier.email,
          full_name: localSupplier.full_name || localSupplier.company_name,
          company_name: localSupplier.company_name,
          role: 'supplier',
          status: localSupplier.status || 'Verified',
        };
        sessionStorage.setItem('current_supplier', JSON.stringify(trustedUser));
        return { user: trustedUser, error: null };
      }
      // If backend fails and no supplier found in context, return original backend error
      throw backendError;
    }
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
  localStorage.removeItem('current_supplier');
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('current_supplier');
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export async function getCurrentUser() {
  try {
    const backendToken = sessionStorage.getItem('access_token');
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
