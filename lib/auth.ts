import { jwtVerify } from "jose";

export interface JWTPayload {
  id: string;
  role: "admin" | "student";
  email: string;
  fullname: string;
}

/**
 * Verify JWT token from request cookies
 * Extracts token and verifies it
 */
export async function verifyToken(cookieString?: string): Promise<JWTPayload> {
  try {
    const jwtSecret = process.env.JWT_SECRET || process.env.jwt_secret;
    if (!jwtSecret) {
      throw new Error("JWT secret not configured");
    }

    // Extract token from cookie string
    let token = "";
    if (cookieString) {
      const tokenMatch = cookieString
        .split("; ")
        .find((c) => c.startsWith("token="));
      if (tokenMatch) {
        token = tokenMatch.split("=")[1];
      }
    }

    if (!token) {
      throw new Error("No token provided");
    }

    // Verify token
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    return {
      id: payload.id as string,
      role: payload.role as "admin" | "student",
      email: payload.email as string,
      fullname: payload.fullname as string,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    throw new Error("Unauthorized");
  }
}
