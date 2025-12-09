// scripts/initializeGroups.ts
// Run this once to create groups from existing users
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Group from "@/models/Group";

export async function initializeGroups() {
  try {
    await connectDB();

    console.log("🔄 Initializing groups...");

    // Get all students
    const students = await User.find({ role: "student" }).sort({ group: 1 });

    if (students.length === 0) {
      console.log("❌ No students found");
      return;
    }

    // Get unique group numbers
    const groupNumbers = [...new Set(students.map((s) => s.group))].sort(
      (a, b) => a - b
    );

    console.log(`📊 Found ${groupNumbers.length} unique groups`);

    // Create or update each group
    for (const groupNum of groupNumbers) {
      const groupStudents = students.filter((s) => s.group === groupNum);

      const existingGroup = await Group.findOne({ groupNumber: groupNum });

      if (existingGroup) {
        // Update existing group
        await Group.findByIdAndUpdate(existingGroup._id, {
          students: groupStudents.map((s) => s._id),
        });
        console.log(
          `✅ Updated Group ${groupNum} with ${groupStudents.length} students`
        );
      } else {
        // Create new group
        await Group.create({
          groupNumber: groupNum,
          students: groupStudents.map((s) => s._id),
          locked: false,
        });
        console.log(
          `✅ Created Group ${groupNum} with ${groupStudents.length} students`
        );
      }
    }

    console.log("✅ Groups initialized successfully!");
    return { success: true, groupsCreated: groupNumbers.length };
  } catch (error) {
    console.error("❌ Error initializing groups:", error);
    throw error;
  }
}

// API route to trigger initialization (admin only)
// app/api/admin/groups/initialize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Verify admin
    const cookieString = req.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const result = await initializeGroups();

    return NextResponse.json({
      message: "Groups initialized successfully",
      ...result,
    });
  } catch (error) {
    console.error("Initialize groups error:", error);
    return NextResponse.json(
      { error: "Failed to initialize groups" },
      { status: 500 }
    );
  }
}
