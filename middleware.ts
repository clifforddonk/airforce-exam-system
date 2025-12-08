import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;

  // If no token and trying to access protected routes
  if (!token) {
    if (
      req.nextUrl.pathname.startsWith("/admin") ||
      req.nextUrl.pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }
    return NextResponse.next();
  }

  // Verify token using `jose` (works in Edge runtime)
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.jwt_secret;
    if (!jwtSecret) {
      console.warn("JWT secret not set; cannot verify token in middleware.");
      const res = NextResponse.redirect(new URL("/auth/login", req.url));
      res.cookies.set("token", "", { maxAge: 0 });
      return res;
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    const decoded = payload as Record<string, unknown>;

    // ADMIN ROUTES
    if (req.nextUrl.pathname.startsWith("/admin")) {
      if (decoded.role !== "admin") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    // STUDENT ROUTES
    if (req.nextUrl.pathname.startsWith("/dashboard")) {
      if (decoded.role !== "student") {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    // Invalid token → force logout
    console.log("Invalid token:", err);
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    res.cookies.set("token", "", { maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*", // admin routes
    "/dashboard/:path*", // student-only routes
  ],
};
