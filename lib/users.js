import { pool } from "./db";

// Find user by email
export async function findUserByEmail(email) {
  if (!email) return null;
  const normalizedEmail = String(email).trim().toLowerCase();

  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      password,
      created_at AS "createdAt"
    FROM users
    WHERE LOWER(email) = $1
    LIMIT 1
    `,
    [normalizedEmail]
  );

  return result.rows[0] || null;
}

// Create a new user in PostgreSQL
export async function createUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new Error("Name, email, and password are required");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const trimmedName = String(name).trim();

  // Check if user already exists
  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  const result = await pool.query(
    `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING
      id,
      name,
      email,
      created_at AS "createdAt"
    `,
    [trimmedName, normalizedEmail, password]
  );

  return result.rows[0];
}

// Verify user login credentials
export async function verifyUserCredentials(email, password) {
  if (!email || !password) return null;

  const user = await findUserByEmail(email);
  if (!user) return null;

  // Simple string comparison (matches user password)
  if (user.password !== password) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}
