import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import QuizViolation from "@/models/QuizViolation";
import QuizSession from "@/models/QuizSession";

// POST /api/quiz/violations - Report a violation
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      sessionToken,
      violationType,
      count = 1,
      timeIntoQuiz,
    } = await req.json();

    if (!sessionToken || !violationType) {
      return NextResponse.json(
        { error: "sessionToken and violationType are required" },
        { status: 400 }
      );
    }

    // Find the session
    const session = await QuizSession.findOne({
      sessionToken,
      userId: user.id,
      status: "active",
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Determine severity based on violation type and count
    let severity: "low" | "medium" | "high" = "low";
    if (violationType === "tab_switch") {
      severity = count > 5 ? "high" : count > 2 ? "medium" : "low";
    } else if (violationType === "devtools") {
      severity = "high";
    } else if (violationType === "copy_paste") {
      severity = "high";
    } else if (violationType === "page_focus_loss") {
      severity = count > 3 ? "high" : count > 1 ? "medium" : "low";
    }

    // Create violation record
    const violation = await QuizViolation.create({
      userId: user.id,
      sessionId: session._id,
      topicId: session.topicId,
      violationType,
      severity,
      count,
      details: {
        ip: (req.headers.get("x-forwarded-for") as string) || "unknown",
        userAgent: req.headers.get("user-agent"),
        timeIntoQuiz,
      },
    });

    console.log(
      `⚠️ Violation logged - User: ${user.id}, Type: ${violationType}, Severity: ${severity}, Count: ${count}`
    );

    return NextResponse.json(
      {
        message: "Violation logged",
        violation: {
          id: violation._id,
          severity: violation.severity,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error logging violation:", error);
    return NextResponse.json(
      { error: "Failed to log violation" },
      { status: 500 }
    );
  }
}

// GET /api/quiz/violations - Get violations (admin only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated and is admin
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const severity = searchParams.get("severity");
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Build filter
    const filter: Record<string, string> = {};
    if (userId) filter.userId = userId;
    if (severity) filter.severity = severity;

    const violations = await QuizViolation.find(filter)
      .populate("userId", "fullName email")
      .populate("sessionId", "topicId startedAt")
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(violations, { status: 200 });
  } catch (error) {
    console.error("Error fetching violations:", error);
    return NextResponse.json(
      { error: "Failed to fetch violations" },
      { status: 500 }
    );
  }
}
