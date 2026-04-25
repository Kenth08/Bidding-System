// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\services\authService.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

function normalize(user) {
  return {
    id: String(user.id),
    full_name: user.full_name,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status,
    company_name: user.company_name,
    company_address: user.company_address,
    phone: user.phone,
    business_type: user.business_type,
    created_at: user.created_at,
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error || payload?.detail || "Request failed.";
    throw new Error(message);
  }

  return payload;
}

export async function loginUser(email, password) {
  try {
    const payload = await request("/accounts/login/", {
      method: "POST",
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    const user = normalize(payload.user);
    return { user, error: null };
  } catch (error) {
    return { user: null, error: error.message || "Login failed. Please try again." };
  }
}

export async function registerSupplier({
  fullName,
  email,
  password,
  companyName,
  companyAddress,
  phone,
  businessType,
}) {
  try {
    if (!fullName || !email || !password || !companyName) {
      return { success: false, error: "Please fill in all required fields." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    await request("/accounts/register-supplier/", {
      method: "POST",
      body: JSON.stringify({
        fullName,
        email,
        password,
        companyName,
        companyAddress,
        phone,
        businessType,
      }),
    });

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message || "Registration failed. Please try again." };
  }
}

export async function getAllSuppliers() {
  try {
    const payload = await request("/accounts/suppliers/");
    return { data: (payload.data || []).map(normalize), error: null };
  } catch (error) {
    if (error.message === "Forbidden.") {
      return { data: [], error: "You are not authorized to view suppliers." };
    }
    return { data: [], error: "Failed to load suppliers." };
  }
}

export async function updateSupplierStatus(id, status) {
  try {
    const endpoint = status === "Approved"
      ? `/accounts/suppliers/${id}/approve/`
      : `/accounts/suppliers/${id}/reject/`;

    await request(endpoint, { method: "PATCH" });

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update supplier status." };
  }
}

export async function logoutUser() {
  try {
    await request("/accounts/logout/", { method: "POST" });
  } catch {
    // Ignore logout errors and continue UI logout.
  }
}
