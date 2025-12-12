import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Submission from "@/models/Submission";

// GET /api/quiz/check-completion - Check if quiz is completed
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId query parameter is required" },
        { status: 400 }
      );
    }

    // ✅ Check database for existing submission (not localStorage)
    const submission = await Submission.findOne(
      {
        userId: user.id,
        topicId: topicId,
      },
      {
        _id: 1,
        score: 1,
        percentage: 1,
        createdAt: 1,
      }
    );

    return NextResponse.json(
      {
        completed: !!submission,
        submission: submission
          ? {
              id: submission._id,
              score: submission.score,
              percentage: submission.percentage,
              completedAt: submission.createdAt,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error checking quiz completion:", error);
    return NextResponse.json(
      { error: "Failed to check completion status" },
      { status: 500 }
    );
  }
}
