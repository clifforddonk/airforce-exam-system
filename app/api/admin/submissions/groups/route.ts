// app/api/admin/submissions/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import GroupSubmission from "@/models/GroupSubmission";
import Group from "@/models/Group";

// GET - Get all group submissions (admin only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const cookieString = req.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can view all submissions" },
        { status: 403 }
      );
    }

    // Get query params for filtering
    const { searchParams } = new URL(req.url);
    const graded = searchParams.get("graded"); // "true" or "false"
    const groupNumber = searchParams.get("groupNumber");

    // Build filter
    const filter: any = {};
    if (graded === "true") {
      filter.score = { $ne: null };
    } else if (graded === "false") {
      filter.score = null;
    }
    if (groupNumber) {
      filter.groupNumber = parseInt(groupNumber);
    }

    // Fetch submissions
    const submissions = await GroupSubmission.find(filter)
      .populate("uploadedBy", "fullName email")
      .populate("gradedBy", "fullName email")
      .populate({
        path: "groupId",
        populate: {
          path: "students",
          select: "fullName email",
        },
      })
      .sort({ uploadedAt: -1 });

    // Get groups without submissions
    const groupsWithSubmissions = submissions.map((s) => s.groupNumber);
    const groupsWithoutSubmissions = await Group.find({
      groupNumber: { $nin: groupsWithSubmissions },
    }).populate("students", "fullName email");

    return NextResponse.json({
      submissions: submissions.map((s) => ({
        id: s._id,
        groupNumber: s.groupNumber,
        fileName: s.fileName,
        fileUrl: s.fileUrl,
        uploadedAt: s.uploadedAt,
        uploadedBy: s.uploadedBy,
        score: s.score,
        feedback: s.feedback,
        gradedAt: s.gradedAt,
        gradedBy: s.gradedBy,
        students: s.groupId.students,
      })),
      pendingGroups: groupsWithoutSubmissions.map((g) => ({
        groupNumber: g.groupNumber,
        students: g.students,
        locked: g.locked,
      })),
      stats: {
        total: submissions.length,
        graded: submissions.filter((s) => s.score !== null).length,
        ungraded: submissions.filter((s) => s.score === null).length,
        pending: groupsWithoutSubmissions.length,
      },
    });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}