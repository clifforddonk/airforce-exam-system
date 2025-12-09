// app/api/admin/submissions/[id]/grade/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Group from "@/models/Group";
import GroupSubmission from "@/models/GroupSubmission";

// PUT - Grade a group submission
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Await params (Next.js 15+)
    const { id } = await params;

    // 1️⃣ Verify admin authentication
    const cookieString = req.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (userData.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can grade submissions" },
        { status: 403 }
      );
    }

    // 2️⃣ Get submission
    const submission = await GroupSubmission.findById(id);
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 3️⃣ Parse grade data
    const { score, feedback } = await req.json();

    // Validate score
    if (typeof score !== "number" || score < 0 || score > 100) {
      return NextResponse.json(
        { error: "Score must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // 4️⃣ Update submission
    const updatedSubmission = await GroupSubmission.findByIdAndUpdate(
      id,
      {
        score,
        feedback: feedback || null,
        gradedBy: userData.id,
        gradedAt: new Date(),
      },
      { new: true }
    );

    // 5️⃣ Update group score (all students get same score)
    await Group.findByIdAndUpdate(submission.groupId, {
      score,
    });

    return NextResponse.json({
      message: "Submission graded successfully",
      submission: {
        id: updatedSubmission._id,
        score: updatedSubmission.score,
        feedback: updatedSubmission.feedback,
        gradedAt: updatedSubmission.gradedAt,
      },
    });
  } catch (error) {
    console.error("Grading error:", error);
    return NextResponse.json(
      { error: "Failed to grade submission" },
      { status: 500 }
    );
  }
}

// GET - Get submission details (admin view)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Await params (Next.js 15+)
    const { id } = await params;

    // Verify admin
    const cookieString = req.headers.get("cookie") || "";
    const userData = await verifyToken(cookieString);

    if (userData.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get submission with populated data
    const submission = await GroupSubmission.findById(id)
      .populate("uploadedBy", "fullName email")
      .populate("gradedBy", "fullName email")
      .populate({
        path: "groupId",
        populate: {
          path: "students",
          select: "fullName email",
        },
      });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}
