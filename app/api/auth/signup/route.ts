import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getNextGroup } from "@/lib/getNextGroup";

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
        { message: "Email already registered. Try a different email." },
        { status: 400 }
      );
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    const group = await getNextGroup();
    console.log("ASSIGNED GROUP:", group);
    // Create new user — role defaults to student
    const user = await User.create({
      fullName,
      email,
      password: hashed,
      group,
    });

    return NextResponse.json(
      {
        message: "Signup successful",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          group: user.group,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup Error:", error);
    // Check for MongoDB duplicate key error
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return NextResponse.json(
        { message: "Email already registered" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
