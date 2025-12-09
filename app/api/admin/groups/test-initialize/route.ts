// app/api/admin/groups/test-initialize/route.ts
// ⚠️ TEMPORARY - Remove this after testing!
// This bypasses authentication for easier testing

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Group from "@/models/Group";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // ⚠️ NO AUTH CHECK - FOR TESTING ONLY!
    console.log("🔄 Starting group initialization (TEST MODE - NO AUTH)...");

    // Get all students from database
    const students = await User.find({ role: "student" }).sort({ group: 1 });

    if (students.length === 0) {
      return NextResponse.json(
        { 
          error: "No students found in database",
          groupsCreated: 0 
        },
        { status: 404 }
      );
    }

    // Get unique group numbers from students
    const groupNumbers = [...new Set(students.map((s) => s.group))].sort(
      (a, b) => a - b
    );

    console.log(`📊 Found ${groupNumbers.length} unique groups from ${students.length} students`);

    let createdCount = 0;
    let updatedCount = 0;

    // Create or update each group
    for (const groupNum of groupNumbers) {
      // Get all students in this group
      const groupStudents = students.filter((s) => s.group === groupNum);

      // Check if group already exists
      const existingGroup = await Group.findOne({ groupNumber: groupNum });

      if (existingGroup) {
        // Update existing group with current students
        await Group.findByIdAndUpdate(existingGroup._id, {
          students: groupStudents.map((s) => s._id),
        });
        updatedCount++;
        console.log(
          `✅ Updated Group ${groupNum} with ${groupStudents.length} students`
        );
      } else {
        // Create new group
        await Group.create({
          groupNumber: groupNum,
          students: groupStudents.map((s) => s._id),
          locked: false,
          submissionId: null,
          score: null,
        });
        createdCount++;
        console.log(
          `✅ Created Group ${groupNum} with ${groupStudents.length} students`
        );
      }
    }

    console.log("✅ Group initialization complete!");

    return NextResponse.json({
      message: "Groups initialized successfully (TEST MODE)",
      success: true,
      groupsCreated: createdCount,
      groupsUpdated: updatedCount,
      totalGroups: groupNumbers.length,
      totalStudents: students.length,
      details: groupNumbers.map(num => ({
        groupNumber: num,
        studentCount: students.filter(s => s.group === num).length
      }))
    });

  } catch (error) {
    console.error("❌ Group initialization error:", error);
    return NextResponse.json(
      { 
        error: "Failed to initialize groups",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}