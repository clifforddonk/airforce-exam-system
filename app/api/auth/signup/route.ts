import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { fullName, email, password } = await req.json();

    // Validate
    if (!fullName || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create new user — role defaults to student
    const user = await User.create({
      fullName,
      email,
      password: hashed,
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
