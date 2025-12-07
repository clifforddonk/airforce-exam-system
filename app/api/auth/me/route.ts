import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

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

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    return NextResponse.json(
      {
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
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
