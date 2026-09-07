import { supabase } from "./supabase.js";

// Find user by email
export async function findUserByEmail(email) {
  if (!email) return null;

  const normalizedEmail = String(email).trim().toLowerCase();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, password, created_at")
    .eq("email", normalizedEmail)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Supabase error while finding user:", error);
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    password: data.password,
    createdAt: data.created_at,
  };
}

// Create a new user
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

  const { data, error } = await supabase
    .from("users")
    .insert({
      name: trimmedName,
      email: normalizedEmail,
      password,
    })
    .select("id, name, email, created_at")
    .single();

  if (error) {
    console.error("Supabase error while creating user:", error);

    // Handle duplicate email in case another request created it
    if (error.code === "23505") {
      throw new Error("User with this email already exists");
    }

    throw new Error(error.message);
  }

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    createdAt: data.created_at,
  };
}

// Verify user login credentials
export async function verifyUserCredentials(email, password) {
  if (!email || !password) return null;

  const user = await findUserByEmail(email);

  if (!user) return null;

  // Simple string comparison
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