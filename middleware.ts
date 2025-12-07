import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // If no token and trying to access protected routes
  if (!token) {
    if (req.nextUrl.pathname.startsWith("/admin") ||
        req.nextUrl.pathname.startsWith("/student")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next();
  }

  // Decode token
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    // ADMIN ROUTES
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (decoded.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // STUDENT ROUTES
    if (req.nextUrl.pathname.startsWith("/student")) {
      if (decoded.role !== "student") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid token → force logout
    console.log("Invalid token:", err);
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set("token", "", { maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",     // admin routes
    "/student/:path*",   // student-only routes
  ],
};
