import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Submission from "@/models/Submission";
import QuizSession from "@/models/QuizSession";
import { randomUUID } from "crypto";

// POST /api/quiz/start - Start a quiz session
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { topicId } = await req.json();

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // ✅ Check if quiz already completed
    const existingSubmission = await Submission.findOne({
      userId: user.id,
      topicId: topicId,
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Quiz already completed. No retakes allowed." },
        { status: 403 }
      );
    }

    // ✅ Check for active session from same user for same topic
    const existingSession = await QuizSession.findOne({
      userId: user.id,
      topicId: topicId,
      status: "active",
    });

    if (existingSession && new Date() < existingSession.expiresAt) {
      // Return existing valid session
      return NextResponse.json(
        {
          sessionToken: existingSession.sessionToken,
          expiresAt: existingSession.expiresAt,
          message: "Existing session restored",
        },
        { status: 200 }
      );
    }

    // ✅ Create new session
    const sessionToken = randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    const session = await QuizSession.create({
      userId: user.id,
      topicId,
      sessionToken,
      expiresAt,
      ip: (req.headers.get("x-forwarded-for") as string) || "unknown",
      userAgent: req.headers.get("user-agent"),
      status: "active",
    });

    console.log(
      `✅ Quiz session started - User: ${user.id}, Topic: ${topicId}, Token: ${sessionToken}`
    );

    return NextResponse.json(
      {
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt,
        message: "Session created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error starting quiz session:", error);
    return NextResponse.json(
      { error: "Failed to start quiz session" },
      { status: 500 }
    );
  }
}
