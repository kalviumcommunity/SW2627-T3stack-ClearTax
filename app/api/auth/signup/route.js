import { NextResponse } from "next/server";
import { createUser, findUserByEmail } from "@/lib/users";

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, and password are required",
        },
        { status: 400 }
      );
    }

    if (password.length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must be at least 4 characters long",
        },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists. Please log in.",
        },
        { status: 409 }
      );
    }

    const newUser = await createUser({ name, email, password });

    return NextResponse.json(
      {
        success: true,
        message: "User account created successfully in PostgreSQL",
        user: {
          id: newUser.email, // using email as consistent user identifier across invoice table
          dbId: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create account",
      },
      { status: 500 }
    );
  }
}
