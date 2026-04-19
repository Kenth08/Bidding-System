// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\services\authService.js

const USERS_KEY = "eprocurement_users";

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function ensureSeedAdmin() {
  const users = readUsers();
  const hasAdmin = users.some((user) => user.email === "admin@gmail.com" && user.role === "admin");

  if (!hasAdmin) {
    users.push({
      id: users.length ? Math.max(...users.map((user) => Number(user.id) || 0)) + 1 : 1,
      full_name: "Administrator",
      email: "admin@gmail.com",
      password: "admin123",
      role: "admin",
      status: "Active",
      company_name: "",
      company_address: "",
      phone: "",
      business_type: "",
      created_at: new Date().toISOString(),
    });
    writeUsers(users);
  }

  return users;
}

export async function loginUser(email, password) {
  try {
    const users = ensureSeedAdmin();
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((item) => item.email === normalizedEmail && item.password === password);

    if (!user) {
      return { user: null, error: "Invalid email or password." };
    }

    if (user.role === "supplier" && user.status === "Pending") {
      return {
        user: null,
        error:
          "Your account is pending admin approval. Please wait for approval before logging in.",
      };
    }

    if (user.role === "supplier" && user.status === "Rejected") {
      return {
        user: null,
        error:
          "Your registration has been rejected. Please contact the administrator.",
      };
    }

    return { user, error: null };
  } catch {
    return { user: null, error: "Login failed. Please try again." };
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
    const users = ensureSeedAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    const existing = users.find((item) => item.email === normalizedEmail);
    if (existing) {
      return { success: false, error: "This email is already registered." };
    }

    if (!fullName || !email || !password || !companyName) {
      return { success: false, error: "Please fill in all required fields." };
    }

    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const nextId = users.length ? Math.max(...users.map((user) => Number(user.id) || 0)) + 1 : 1;
    users.push({
      id: nextId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      password,
      role: "supplier",
      status: "Pending",
      company_name: companyName.trim(),
      company_address: companyAddress?.trim() || "",
      phone: phone?.trim() || "",
      business_type: businessType || "Other",
      created_at: new Date().toISOString(),
    });

    writeUsers(users);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export async function getAllSuppliers() {
  try {
    const users = ensureSeedAdmin();
    const data = users
      .filter((user) => user.role === "supplier")
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { data, error: null };
  } catch {
    return { data: [], error: "Failed to load suppliers." };
  }
}

export async function updateSupplierStatus(id, status) {
  try {
    const users = ensureSeedAdmin();
    const updated = users.map((user) =>
      Number(user.id) === Number(id) && user.role === "supplier"
        ? { ...user, status }
        : user
    );
    writeUsers(updated);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update supplier status." };
  }
}

export async function getSupplierById(id) {
  try {
    const users = ensureSeedAdmin();
    const user = users.find((item) => Number(item.id) === Number(id)) || null;

    return { user };
  } catch {
    return { user: null };
  }
}
