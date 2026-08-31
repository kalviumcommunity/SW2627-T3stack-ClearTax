import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://postgres:prateeekverma@localhost:5433/cleartax",
});

let tablesInitialized = false;

export async function ensureTablesExist() {
  if (tablesInitialized) return;

  try {
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
  } catch (error) {
    console.error("Failed to auto-initialize database tables:", error);
  }
}

// Helper query function that ensures tables exist before querying
export async function query(text, params) {
  await ensureTablesExist();
  return pool.query(text, params);
}