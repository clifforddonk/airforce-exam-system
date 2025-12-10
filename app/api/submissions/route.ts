import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import Submission from "@/models/Submission";
import Question from "@/models/Question";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

// POST /api/submissions - Submit a quiz
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Validate required fields (note: NO score/percentage in validation)
    if (
      !data.topicId ||
      !data.topicName ||
      !data.answers ||
      data.timeSpent === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ PROTECTION LAYER 1: Check if already submitted for this topic
    const existingSubmission = await Submission.findOne({
      userId: user.id,
      topicId: data.topicId,
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "Quiz already completed. No retakes allowed." },
        { status: 403 }
      );
    }

    // ✅ Fetch questions for this topic to validate answers
    const questions = await Question.find({ category: data.topicId });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Quiz questions not found" },
        { status: 400 }
      );
    }

    // ✅ PROTECTION LAYER 2: Validate all answers and calculate score server-side
    let correctAnswers = 0;
    const answersMap = new Map(Object.entries(data.answers));

    for (const question of questions) {
      const questionIdStr = question._id.toString();
      const userAnswer = answersMap.get(questionIdStr);

      // Validate answer is valid (0-3 for multiple choice)
      if (
        userAnswer !== undefined &&
        typeof userAnswer === "number" &&
        (userAnswer < 0 || userAnswer > 3)
      ) {
        return NextResponse.json(
          { error: "Invalid answers submitted" },
          { status: 400 }
        );
      }

      // Check if correct
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    }

    // ✅ Calculate score and percentage server-side (NOT from frontend)
    const totalQuestions = questions.length;
    const pointsPerQuestion = 2; // Each question = 2 points
    const scoreInPoints = correctAnswers * pointsPerQuestion; // Convert to 20-point scale
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);

    // Create submission with server-calculated score
    const submission = await Submission.create({
      userId: new mongoose.Types.ObjectId(user.id),
      topicId: data.topicId,
      topicName: data.topicName,
      answers: data.answers,
      score: scoreInPoints, // ← Score in points (0-20), not raw count
      totalQuestions, // ← From database
      percentage, // ← Server-calculated
      timeSpent: data.timeSpent,
      tabSwitches: data.tabSwitches || 0,
    });

    console.log(
      `✅ Quiz submitted - User: ${user.id}, Topic: ${data.topicId}, Score: ${scoreInPoints}/20 (${correctAnswers}/${totalQuestions} correct)`
    );

    return NextResponse.json(
      {
        message: "Submission saved",
        submission: {
          id: submission._id,
          score: submission.score, // Now in 20-point scale
          totalQuestions: submission.totalQuestions,
          percentage: submission.percentage,
          correctAnswers: correctAnswers, // Include for reference
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Failed to save submission" },
      { status: 500 }
    );
  }
}

// GET /api/submissions - Get user's submissions
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Verify user is authenticated
    const cookieString = req.headers.get("cookie") || "";
    const user = await verifyToken(cookieString);

    const submissions = await Submission.find({
      userId: new mongoose.Types.ObjectId(user.id), // Convert to ObjectId for query
    }).sort({
      createdAt: -1,
    });

    return NextResponse.json(submissions, { status: 200 });
  } catch (error) {
    console.error("Get submissions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
