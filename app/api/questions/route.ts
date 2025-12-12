// api/questions/route.ts (UPDATED)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Question from "@/models/Question";
import { verifyToken } from "@/lib/auth";

// POST /api/questions - Create a new question (Admin only via middleware)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    // Verify user is authenticated (middleware ensures admin access)
    const cookieString = req.headers.get("cookie") || "";
    await verifyToken(cookieString);
    const { question, options, correctAnswer, category } = await req.json();
    const newQuestion = await Question.create({
      question,
      options,
      correctAnswer,
      category,
    });
    return NextResponse.json(
      { message: "Question created", question: newQuestion },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    );
  }
}

// GET /api/questions - Get all questions (with optional category filter)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get category from query params
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    // Build filter - if category provided, filter by it
    const filter = category ? { category } : {};

    const questions = await Question.find(filter).sort({ createdAt: -1 });

    // ✅ SECURITY: Remove correctAnswer before sending to frontend
    const safeQuestions = questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      category: q.category,
      // ❌ correctAnswer is NOT included
    }));

    return NextResponse.json(safeQuestions, { status: 200 });
  } catch (error) {
    console.error("Get questions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    );
  }
}
