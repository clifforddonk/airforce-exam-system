import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Clear the token cookie
    const res = NextResponse.json(
      { message: "Logout successful" },
      { status: 200 }
    );

    res.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediately expire the cookie
    });

    return res;
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json({ message: "Logout failed" }, { status: 500 });
  }
}
