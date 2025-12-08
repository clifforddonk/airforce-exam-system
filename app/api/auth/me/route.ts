import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const token = cookieHeader
      ?.split("; ")
      ?.find((c) => c.startsWith("token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        { user: null, message: "No token" },
        { status: 401 }
      );
    }

    const jwtSecret = process.env.JWT_SECRET || process.env.jwt_secret;
    if (!jwtSecret) {
      console.error("JWT secret not configured");
      return NextResponse.json(
        { user: null, message: "Server error" },
        { status: 500 }
      );
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const decoded = payload as Record<string, unknown>;

    return NextResponse.json(
      {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
          fullName: decoded.fullname,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("ME Route Error:", error);
    return NextResponse.json(
      { user: null, message: "Invalid token" },
      { status: 401 }
    );
  }
}
