import { NextResponse } from "next/server";
import { verifyUserCredentials, findUserByEmail } from "@/lib/users";

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await findUserByEmail(email);
    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "No account found with this email. Please sign up.",
        },
        { status: 404 }
      );
    }

    const verifiedUser = await verifyUserCredentials(email, password);
    if (!verifiedUser) {
      return NextResponse.json(
        {
          success: false,
          message: "Incorrect password. Please try again.",
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: verifiedUser.email,
        dbId: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to log in",
      },
      { status: 500 }
    );
  }
}
