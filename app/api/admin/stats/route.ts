import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Group from "@/models/Group";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin
    const cookieString = req.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get total students (excluding admins)
    const totalStudents = await User.countDocuments({ role: "student" });

    // Get total groups
    const totalGroups = await Group.countDocuments();

    return NextResponse.json({
      totalStudents,
      totalGroups,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
