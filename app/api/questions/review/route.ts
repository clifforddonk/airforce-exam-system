// app/api/questions/review/route.ts
// Returns questions WITH correct answers for review (only for authenticated users who completed the quiz)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import Submission from "@/models/Submission";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // ✅ SECURITY: Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    if (!category) {
      return NextResponse.json(
        { error: "Category parameter required" },
        { status: 400 }
      );
    }

    // ✅ SECURITY: Verify user has submitted this quiz
    const submission = await Submission.findOne({
      userId: user.id,
      topicId: category,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Quiz not submitted" },
        { status: 403 }
      );
    }

    // Get questions for this category WITH correct answers
    const questions = await Question.find({ category }).sort({ createdAt: -1 });

    // Return full questions with correct answers
    const questionsWithAnswers = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
    }));

    return NextResponse.json(questionsWithAnswers, { status: 200 });
  } catch (error) {
    console.error("Get review questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch review questions" },
      { status: 500 }
    );
  }
}
