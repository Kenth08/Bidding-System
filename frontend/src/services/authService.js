// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\services\authService.js
import { execute, initializeDatabase, query } from "../lib/database";

function normalize(row) {
  return {
    id: String(row.id),
    full_name: row.full_name,
    fullName: row.full_name,
    email: row.email,
    password: row.password,
    role: row.role,
    status: row.status,
    company_name: row.company_name,
    company_address: row.company_address,
    phone: row.phone,
    business_type: row.business_type,
    created_at: row.created_at,
  };
}

export async function loginUser(email, password) {
  try {
    await initializeDatabase();
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await query(
      "SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1;",
      [normalizedEmail, password]
    );
    const user = rows[0] ? normalize(rows[0]) : null;

    if (!user) return { user: null, error: "Invalid email or password." };
    if (user.role === "supplier" && user.status === "Pending") {
      return { user: null, error: "Your account is pending admin approval." };
    }
    if (user.role === "supplier" && user.status === "Rejected") {
      return { user: null, error: "Your registration has been rejected." };
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
    await initializeDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!fullName || !email || !password || !companyName) {
      return { success: false, error: "Please fill in all required fields." };
    }
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters." };
    }

    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1;", [normalizedEmail]);
    if (existing.length) {
      return { success: false, error: "This email is already registered." };
    }

    await execute(
      `INSERT INTO users (
        full_name, email, password, role, status, company_name, company_address, phone, business_type, created_at
      ) VALUES (?, ?, ?, 'supplier', 'Pending', ?, ?, ?, ?, ?);`,
      [
        fullName.trim(),
        normalizedEmail,
        password,
        companyName.trim(),
        companyAddress?.trim() || "",
        phone?.trim() || "",
        businessType || "Other",
        new Date().toISOString(),
      ]
    );

    return { success: true, error: null };
  } catch {
    return { success: false, error: "Registration failed. Please try again." };
  }
}

export async function getAllSuppliers() {
  try {
    await initializeDatabase();
    const rows = await query(
      "SELECT * FROM users WHERE role = 'supplier' ORDER BY datetime(created_at) DESC;"
    );
    return { data: rows.map(normalize), error: null };
  } catch {
    return { data: [], error: "Failed to load suppliers." };
  }
}

export async function updateSupplierStatus(id, status) {
  try {
    await initializeDatabase();
    await execute("UPDATE users SET status = ? WHERE id = ? AND role = 'supplier';", [status, Number(id)]);
    return { success: true, error: null };
  } catch {
    return { success: false, error: "Failed to update supplier status." };
  }
}
