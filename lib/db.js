import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:prateeekverma@localhost:5433/cleartax",
  connectionTimeoutMillis: 2000,
});

let tablesInitialized = false;
let dbAvailable = true;
let lastCheckTime = 0;
const RETRY_INTERVAL = 15000;

export async function ensureTablesExist() {
  if (tablesInitialized) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      invoice_number VARCHAR(255) NOT NULL,
      customer_name VARCHAR(255) NOT NULL,
      invoice_date DATE NOT NULL,
      amount NUMERIC(12, 2) NOT NULL,
      gst_number VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      error TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
  `);
  tablesInitialized = true;
}

// Helper query function that ensures tables exist before querying
export async function query(text, params) {
  const now = Date.now();
  if (!dbAvailable && now - lastCheckTime < RETRY_INTERVAL) {
    throw new Error("PostgreSQL connection unavailable (using fallback)");
  }

  try {
    await ensureTablesExist();
    const result = await pool.query(text, params);
    dbAvailable = true;
    return result;
  } catch (error) {
    if (dbAvailable) {
      console.warn("PostgreSQL connection unavailable. Operating in in-memory fallback mode.");
    }
    dbAvailable = false;
    lastCheckTime = now;
    throw error;
  }
}
