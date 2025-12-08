import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 }
      );
    }

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 }
      );
    }

    // Create JWT payload and sign using `jose` (works in Edge/more portable runtimes)
    const jwtSecret = process.env.JWT_SECRET || process.env.jwt_secret;
    if (!jwtSecret) {
      console.error("JWT secret not configured");
      return NextResponse.json({ message: "Server error" }, { status: 500 });
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      fullname: user.fullName,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Set cookie
    const res = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
      },
      { status: 200 }
    );

    res.cookies.set("token", token, {
      httpOnly: true,
      // Use secure cookies in production only so dev (http://localhost) works
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (error) {
    console.error("Login Error:", error);
    // More specific error messages
    if (error instanceof Error && error.message.includes("JWT")) {
      return NextResponse.json(
        { message: "Server configuration error" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { message: "Server error. Please try again later." },
      { status: 500 }
    );
  }
}
