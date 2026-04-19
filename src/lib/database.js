// c:\Users\HUAWEI\OneDrive\Desktop\Bidding System\src\lib\database.js
import initSqlJs from "sql.js";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";

const DB_STORAGE_KEY = "eprocurement_sqlite_db";
let SQL = null;
let db = null;

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function persistDatabase() {
  if (!db) return;
  const data = db.export();
  localStorage.setItem(DB_STORAGE_KEY, bytesToBase64(data));
}

function seedUsersTable() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      company_name TEXT DEFAULT '',
      company_address TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      business_type TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);

  const result = db.exec("SELECT COUNT(*) as count FROM users;");
  const count = result?.[0]?.values?.[0]?.[0] || 0;

  if (!count) {
    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO users (
        full_name, email, password, role, status, company_name, company_address, phone, business_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `);

    insert.run(["Administrator", "admin@gmail.com", "admin123", "admin", "Active", "", "", "", "", now]);
    insert.run([
      "Supplier User",
      "supplier@eprocurement.gov",
      "supplier123",
      "supplier",
      "Approved",
      "Blue Grid Works",
      "City Center",
      "+63 912 000 0001",
      "IT Services",
      now,
    ]);
    insert.free();
    persistDatabase();
  }
}

export async function initializeDatabase() {
  if (db) return db;

  SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  db = stored ? new SQL.Database(base64ToBytes(stored)) : new SQL.Database();

  seedUsersTable();
  return db;
}

export async function execute(sql, params = []) {
  await initializeDatabase();
  const statement = db.prepare(sql);
  statement.run(params);
  statement.free();
  persistDatabase();
}

export async function query(sql, params = []) {
  await initializeDatabase();
  const statement = db.prepare(sql);
  statement.bind(params);
  const rows = [];

  while (statement.step()) {
    rows.push(statement.getAsObject());
  }

  statement.free();
  return rows;
}